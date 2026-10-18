/** true si algún píxel es (semi)transparente. Se revisa una muestra para no recorrer imágenes enormes. */
function hasTransparency(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  const { data } = ctx.getImageData(0, 0, width, height);
  const step = Math.max(1, Math.floor(data.length / 4 / 200_000)) * 4;
  for (let i = 3; i < data.length; i += step) {
    if (data[i] < 255) return true;
  }
  return false;
}

/**
 * Compress and resize an image file using Canvas API.
 * Returns a base64 data URL string: JPEG, or PNG when the image has transparency (logos),
 * because JPEG has no alpha channel and transparent areas would turn black.
 */
export function compressImage(
  file: File,
  maxWidth = 300,
  maxHeight = 300,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Scale down maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        // Solo PNG, WEBP y GIF pueden traer transparencia; las fotos (JPEG, HEIC) van directo a JPEG
        const mayHaveAlpha = /image\/(png|webp|gif)/i.test(file.type);
        if (mayHaveAlpha && hasTransparency(ctx, width, height)) {
          resolve(canvas.toDataURL('image/png'));
          return;
        }
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
}
