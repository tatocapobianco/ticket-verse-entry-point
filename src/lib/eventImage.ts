import { supabase } from '@/integrations/supabase/client';

export const EVENT_IMAGE_BUCKET = 'event-images';
export const EVENT_IMAGE_W = 1200;
export const EVENT_IMAGE_H = 628;
export const FLYER_MAX_SIDE = 1350;
export const EVENT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const THUMB_HELP = 'Se ve en el listado de eventos. Recomendado: 1200 × 628 px (horizontal)';
export const FLYER_HELP =
  'Es el flyer que ven al entrar a comprar. Recomendado: 1080 × 1350 px (vertical) o 1080 × 1080 px (cuadrado)';

const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
// ~10 years, so the URL keeps working in cards, headers and WhatsApp previews.
const SIGNED_URL_TTL = 60 * 60 * 24 * 3650;

/** Valida tipo y peso del archivo. Devuelve el mensaje de error o null si está OK. */
export function validateEventImage(file: File): string | null {
  if (!ALLOWED.includes(file.type.toLowerCase())) {
    return 'Formato no válido, usá JPG, PNG o WebP';
  }
  if (file.size > EVENT_IMAGE_MAX_BYTES) {
    return 'El archivo supera los 5 MB';
  }
  return null;
}

function readAsDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Archivo de imagen inválido'));
    el.src = src;
  });
}

async function canvasToResult(canvas: HTMLCanvasElement) {
  const previewUrl = canvas.toDataURL('image/jpeg', 0.88);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
  if (!blob) throw new Error('No se pudo procesar la imagen');
  return { blob, previewUrl };
}

/** Center-crop de una imagen ya cargada al frame 1200 × 628 (sin deformarla). */
async function centerCrop(img: HTMLImageElement) {
  const canvas = document.createElement('canvas');
  canvas.width = EVENT_IMAGE_W;
  canvas.height = EVENT_IMAGE_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen');

  const targetRatio = EVENT_IMAGE_W / EVENT_IMAGE_H;
  const srcRatio = img.width / img.height;
  let sw = img.width;
  let sh = img.height;
  if (srcRatio > targetRatio) sw = Math.round(img.height * targetRatio);
  else sh = Math.round(img.width / targetRatio);
  const sx = Math.round((img.width - sw) / 2);
  const sy = Math.round((img.height - sh) / 2);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, EVENT_IMAGE_W, EVENT_IMAGE_H);
  return canvasToResult(canvas);
}

/** Miniatura: recorta al centro en 1200 × 628 listo para subir + preview. */
export async function cropEventImage(file: Blob): Promise<{ blob: Blob; previewUrl: string }> {
  return centerCrop(await loadImage(await readAsDataUrl(file)));
}

/**
 * Flyer: NO recorta. Solo reescala (si hace falta) para que el lado más largo
 * no supere 1350 px, conservando la relación de aspecto original.
 */
export async function resizeFlyerImage(file: Blob): Promise<{ blob: Blob; previewUrl: string }> {
  const img = await loadImage(await readAsDataUrl(file));
  const scale = Math.min(1, FLYER_MAX_SIDE / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvasToResult(canvas);
}

/** Genera la miniatura 1200 × 628 a partir del blob del flyer ya procesado. */
export async function thumbFromFlyer(flyer: Blob) {
  return cropEventImage(flyer);
}

/** Sube una imagen al bucket y devuelve {path, url} para guardar en el evento. */
export async function uploadEventImage(blob: Blob, userId: string) {
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage
    .from(EVENT_IMAGE_BUCKET)
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false });
  if (error) throw new Error(error.message);

  const { data, error: signErr } = await supabase.storage
    .from(EVENT_IMAGE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (signErr || !data?.signedUrl) throw new Error(signErr?.message ?? 'No se pudo publicar la imagen');
  return { path, url: data.signedUrl };
}

/** Borra un archivo del bucket. Se ignoran los errores (la imagen puede no existir). */
export async function deleteEventImage(path?: string | null) {
  if (!path) return;
  await supabase.storage.from(EVENT_IMAGE_BUCKET).remove([path]);
}

/** Extrae el path dentro del bucket a partir de una URL firmada guardada en el evento. */
export function pathFromEventImageUrl(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(new RegExp(`/object/(?:sign|public)/${EVENT_IMAGE_BUCKET}/([^?]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}
