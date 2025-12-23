export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export const parseSizeInches = (sizeStr) => {
  if (!sizeStr) return { widthIn: null, heightIn: null };
  const cleaned = sizeStr.replace(/"/g, "").trim(); // remove "
  const [wStr, hStr] = cleaned.split(/[×x]/i); // × or x
  const widthIn = parseFloat(wStr);
  const heightIn = parseFloat(hStr);
  if (isNaN(widthIn) || isNaN(heightIn)) {
    return { widthIn: null, heightIn: null };
  }
  return { widthIn, heightIn };
};

export function makeCenteredCropPx(displayW, displayH, aspect, heightPx) {
  const maxH = Math.min(displayH, displayW / aspect);
  const h = clamp(heightPx, 40, maxH);
  const w = h * aspect;

  return {
    unit: "px",
    width: w,
    height: h,
    x: (displayW - w) / 2,
    y: (displayH - h) / 2,
  };
}

export async function cropToBlob(
  imageEl,
  cropPx,
  mimeType = "image/png",
  quality = 0.92
) {
  if (!cropPx?.width || !cropPx?.height)
    throw new Error("No crop area selected");

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D context");

  const scaleX = imageEl.naturalWidth / imageEl.width;
  const scaleY = imageEl.naturalHeight / imageEl.height;

  const sx = Math.round(cropPx.x * scaleX);
  const sy = Math.round(cropPx.y * scaleY);
  const sw = Math.round(cropPx.width * scaleX);
  const sh = Math.round(cropPx.height * scaleY);

  canvas.width = sw;
  canvas.height = sh;

  ctx.drawImage(imageEl, sx, sy, sw, sh, 0, 0, sw, sh);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Canvas export failed")),
      mimeType,
      quality
    );
  });
}

export const getQualityClass = (quality) => {
  switch (quality) {
    case "green":
      return "quality-green";
    case "orange":
      return "quality-orange";
    case "red":
      return "quality-red";
    default:
      return "quality-gray";
  }
};

export const getQualityFromPpi = (ppi) => {
  if (ppi == null) return "gray";
  if (ppi >= 180) return "green";
  if (ppi >= 150) return "orange";
  return "red";
};
