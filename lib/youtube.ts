const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);

export function isValidYouTubeUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return true;
  }

  try {
    const url = new URL(trimmed);
    const hostname = url.hostname.toLowerCase();
    const isHttp = url.protocol === "http:" || url.protocol === "https:";
    const isYouTubeHost = YOUTUBE_HOSTS.has(hostname) || hostname.endsWith(".youtube.com");

    return isHttp && isYouTubeHost;
  } catch {
    return false;
  }
}

export function cleanOptionalYouTubeUrl(value?: string | null) {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    return null;
  }

  if (!isValidYouTubeUrl(trimmed)) {
    throw new Error("Introduce una URL válida de YouTube.");
  }

  return trimmed;
}
