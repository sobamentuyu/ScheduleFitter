export const IMAGE_MAX_BYTES = 8 * 1024 * 1024;

export const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export function validateScheduleImage(file: File): string | null {
  if (file.size > IMAGE_MAX_BYTES) {
    return "画像は8MB以下にしてください";
  }

  if (!isAllowedImageType(file)) {
    return "対応していない画像形式です";
  }

  return null;
}

function isAllowedImageType(file: File): boolean {
  if (IMAGE_MIME_TYPES.has(file.type)) {
    return true;
  }

  if (file.type === "") {
    return /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);
  }

  return false;
}
