/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const IMPORT_USER_ID = process.env.IMPORT_USER_ID;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("Faltan variables de Supabase en .env.local");
}

if (!IMPORT_USER_ID) {
  throw new Error("Define IMPORT_USER_ID para importar ejercicios a un usuario.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const filePath = path.join(__dirname, "exercise-library.txt");
const raw = fs.readFileSync(filePath, "utf8");

const lines = raw.split("\n");

let currentMuscle = null;
let currentRegion = null;
let insideExercisesDb = false;
let insideVolume = false;

const exercises = [];

for (const rawLine of lines) {
  const line = rawLine.trim();

  if (line.includes("EJERCICIOS_DB")) {
    insideExercisesDb = true;
    continue;
  }

  if (line.includes("VOLUMEN_OPTIMO")) {
    insideVolume = true;
    break;
  }

  if (!insideExercisesDb || insideVolume) continue;

  const groupMatch = line.match(/^"([^"]+)":\s*\{$/);
  if (groupMatch) {
    currentMuscle = groupMatch[1];
    currentRegion = null;
    continue;
  }

  const regionMatch = line.match(/^"([^"]+)":\s*\[$/);
  if (regionMatch) {
    currentRegion = regionMatch[1];
    continue;
  }

  const exerciseMatch = line.match(/^"([^"]+)"[,]?$/);
  if (exerciseMatch && currentMuscle && currentRegion) {
    const name = exerciseMatch[1].trim();

    if (name.length > 2) {
      exercises.push({
        user_id: IMPORT_USER_ID,
        name,
        primary_muscle: currentMuscle,
        secondary_muscle: currentRegion,
        description: null,
        notes: null,
        youtube_url: null,
        is_favorite: false,
      });
    }
  }
}

const uniqueExercises = Array.from(
  new Map(
    exercises.map((exercise) => [
      `${exercise.name}-${exercise.primary_muscle}-${exercise.secondary_muscle}`,
      exercise,
    ])
  ).values()
);

async function main() {
  console.log(`Ejercicios detectados: ${uniqueExercises.length}`);

  const { data: existing, error: existingError } = await supabase
    .from("exercises")
    .select("name, primary_muscle, secondary_muscle")
    .eq("user_id", IMPORT_USER_ID);

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingKeys = new Set(
    (existing ?? []).map(
      (exercise) =>
        `${exercise.name}-${exercise.primary_muscle}-${exercise.secondary_muscle}`
    )
  );

  const toInsert = uniqueExercises.filter(
    (exercise) =>
      !existingKeys.has(
        `${exercise.name}-${exercise.primary_muscle}-${exercise.secondary_muscle}`
      )
  );

  console.log(`Ejercicios nuevos a insertar: ${toInsert.length}`);

  if (toInsert.length === 0) {
    console.log("No hay ejercicios nuevos.");
    return;
  }

  const { error } = await supabase.from("exercises").insert(toInsert);

  if (error) {
    throw new Error(error.message);
  }

  console.log("Importacion completada correctamente.");
}

main();
