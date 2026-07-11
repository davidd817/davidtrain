export type NumberValidation = {
  ok: boolean;
  value: number;
  message?: string;
};

export function parseBoundedNumber({
  value,
  label,
  min,
  max,
  integer = false,
}: {
  value: string;
  label: string;
  min: number;
  max: number;
  integer?: boolean;
}): NumberValidation {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return { ok: false, value: 0, message: `${label}: introduce un numero valido.` };
  }

  if (parsed < min || parsed > max) {
    return {
      ok: false,
      value: parsed,
      message: `${label}: debe estar entre ${min} y ${max}.`,
    };
  }

  if (integer && !Number.isInteger(parsed)) {
    return { ok: false, value: parsed, message: `${label}: debe ser un numero entero.` };
  }

  return { ok: true, value: parsed };
}

export function getFirstNumberError(results: NumberValidation[]) {
  return results.find((result) => !result.ok)?.message ?? "";
}
