const DEFAULT_REDIRECT_PATH = "/dashboard";

/**
 * Keeps post-auth redirects inside the current application origin.
 * Absolute URLs and protocol-relative URLs are rejected to avoid open redirects.
 */
export function getSafeRedirectPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_REDIRECT_PATH;
  }

  return value;
}
