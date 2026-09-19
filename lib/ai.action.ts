import puter from "@heyputer/puter.js";
import {PLANVIA_RENDER_PROMPT} from "./constants";

export const fetchAsDataUrl = async (url: string): Promise<string> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const FURNISH_OFF_DIRECTIVE = `

OVERRIDE — FURNISHING DISABLED:
- Leave every room empty. Render only the shell: floors, walls, doors, and windows.
- Ignore the furniture and fixture mapping above; do not add beds, sofas, tables, counters, or sanitary ware.`;

export const generate3DView = async ({ sourceImage, furnish = true }: Generate3DViewParams) => {
    const dataUrl = sourceImage.startsWith('data:')
        ? sourceImage
        : await fetchAsDataUrl(sourceImage);

    const base64Data = dataUrl.split(',')[1];
    const mimeType = dataUrl.split(';')[0].split(':')[1];

    if(!mimeType || !base64Data) throw new Error('Invalid source image payload');

    const prompt = furnish
        ? PLANVIA_RENDER_PROMPT
        : `${PLANVIA_RENDER_PROMPT}${FURNISH_OFF_DIRECTIVE}`;

    const response = await puter.ai.txt2img(prompt, {
        provider: "gemini",
        model: "gemini-2.5-flash-image-preview",
        input_image: base64Data,
        input_image_mime_type: mimeType,
        ratio: { w: 1024, h: 1024 },
    });

    const rawImageUrl = (response as HTMLImageElement).src ?? null;

    if (!rawImageUrl) return { renderedImage: null, renderedPath: undefined };

    const renderedImage = rawImageUrl.startsWith('data:')
    ? rawImageUrl : await fetchAsDataUrl(rawImageUrl);

    return { renderedImage, renderedPath: undefined };
}
