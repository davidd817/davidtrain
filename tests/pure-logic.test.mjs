import assert from "node:assert/strict";
import test from "node:test";

import { estimateOneRepMax, formatDuration, secondsBetween } from "../lib/format.ts";
import { getSafeRedirectPath } from "../lib/redirect.ts";
import { parseBoundedNumber } from "../lib/validation.ts";
import { cleanOptionalYouTubeUrl, isValidYouTubeUrl } from "../lib/youtube.ts";

test("parseBoundedNumber validates finite integer values and bounds", () => {
  assert.deepEqual(
    parseBoundedNumber({ value: "8", label: "Reps", min: 1, max: 20, integer: true }),
    { ok: true, value: 8 }
  );
  assert.equal(
    parseBoundedNumber({ value: "8.5", label: "Reps", min: 1, max: 20, integer: true }).ok,
    false
  );
  assert.equal(
    parseBoundedNumber({ value: "21", label: "Reps", min: 1, max: 20, integer: true }).ok,
    false
  );
});

test("training format helpers calculate duration and estimated one-rep max", () => {
  assert.equal(formatDuration(3660), "1 h 1 min");
  assert.equal(estimateOneRepMax(100, 5), 116.7);
  assert.equal(secondsBetween("2026-01-01T10:00:00.000Z", "2026-01-01T10:01:05.000Z"), 65);
});

test("YouTube validation accepts supported hosts and rejects other origins", () => {
  assert.equal(isValidYouTubeUrl("https://youtu.be/example"), true);
  assert.equal(isValidYouTubeUrl("https://example.com/video"), false);
  assert.equal(cleanOptionalYouTubeUrl("  https://www.youtube.com/watch?v=abc  "), "https://www.youtube.com/watch?v=abc");
  assert.equal(cleanOptionalYouTubeUrl(""), null);
});

test("auth callback redirect stays on the application origin", () => {
  assert.equal(getSafeRedirectPath("/auth/update-password"), "/auth/update-password");
  assert.equal(getSafeRedirectPath("https://malicious.example"), "/dashboard");
  assert.equal(getSafeRedirectPath("//malicious.example"), "/dashboard");
  assert.equal(getSafeRedirectPath(null), "/dashboard");
});
