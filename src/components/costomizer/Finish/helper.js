import {
  loadCropImageFromDb,
  loadImageFromDb,
} from "../../../services/indexDb.js";
import {
  getDropboxFileNamingConfig,
  uploadImageOnDropBox,
} from "../../../services/services.js";

import ExifReader from "exifreader";
import { toast } from "react-toastify";

async function getMetaData(file) {
  // Read file as ArrayBuffer
  const decodedExif = await ExifReader.load(file);

  // console.log("decodedExif", decodedExif);

  // return decodedExif;
  const DateTimeOriginal = decodedExif.DateTimeOriginal ?? null;
  const ColorSpace = decodedExif.ColorSpace ?? null;
  const PixelXDimension = decodedExif.PixelXDimension ?? null;
  const PixelYDimension = decodedExif.PixelYDimension ?? null;;
  const CopyrightNotice = null;
  const Source = decodedExif.Software ?? null;

  return { DateTimeOriginal, ColorSpace, PixelXDimension, PixelYDimension, CopyrightNotice, Source };

}

function base64ToBlob(base64) {
  const [meta, data] = base64.split(",");
  const mime = meta.match(/:(.*?);/)[1];
  const binary = atob(data);

  const len = binary.length;
  const buffer = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    buffer[i] = binary.charCodeAt(i);
  }

  return new Blob([buffer], { type: mime });
}

async function uploadFileMaker(originalImage, isCroped) {
  // console.log("originalImage", originalImage);

  let originalImageBlob = originalImage.blob;
  if (!isCroped) {
    originalImageBlob = base64ToBlob(originalImage.url);
  }
  // console.log("originalImageBlob", originalImageBlob);
  // const ext = originalImageBlob.type.split("/")[1];

  const originalImageFile = new File(
    [originalImageBlob],
    `original-image.png`,
    {
      type: originalImage.type,
    }
  );

  const metadata = await getMetaData(originalImageFile);
  // ------------------------------------------------------------------
  // Step 3: Upload original image to Dropbox
  // ------------------------------------------------------------------
  const originalImageFormData = new FormData();
  originalImageFormData.append("image", originalImageFile);

  const originalImageCloudUrl = await uploadImageOnDropBox(
    originalImageFormData
  );

  return { originalImageCloudUrl, metadata };
}

async function uploadAndGetCloudeURl(setStatus) {
  const originalImage = await loadImageFromDb();
  // setStatus("image one is being uploading");
  const { originalImageCloudUrl, metadata } = await uploadFileMaker(originalImage);
  // console.log("Original Image Cloud URL:", originalImageCloudUrl);
  // console.log("----metadata", metadata)

  // ------------------------------------------------------------------
  //  Load cropped image from IndexedDB
  // ------------------------------------------------------------------
  const croppedImageBlob = await loadCropImageFromDb();

  // setStatus("image two is being uploading");

  const { originalImageCloudUrl: croppedImageCloudUrl, metadata: cropMetadata } = await uploadFileMaker(croppedImageBlob, true);

  // console.log("Cropped Image Cloud URL:", croppedImageCloudUrl, cropMetadata);

  return { originalImageCloudUrl, croppedImageCloudUrl, metadata, cropMetadata };
}


// export async function cartHandler() {
//   // ------------------------------------------------------------------
//   // Step 1: Fetch Dropbox file & folder naming configuration
//   // ------------------------------------------------------------------
//   const dropboxConfig = await getDropboxFileNamingConfig();

//   const folderNameTemplate = dropboxConfig.folderTemplateConfig;
//   const fileNameTemplate = dropboxConfig.fileNamingTemplateConfig;

//   // (Currently unused but kept for future naming logic)
//   // console.log("Folder Template:", folderNameTemplate);
//   // console.log("File Template:", fileNameTemplate);

//   const { originalImageCloudUrl, croppedImageCloudUrl } =
//     await uploadAndGetCloudeURl();


//   // ------------------------------------------------------------------
//   // Step 2: Load original image from IndexedDB
//   // ------------------------------------------------------------------
// }


export async function cartHandler(orderConfig, setStatus) {
  const { originalImageCloudUrl, croppedImageCloudUrl, metadata, cropMetadata } =
    await uploadAndGetCloudeURl(setStatus);
  toast.success("Saved successfully!");
  // console.log(originalImageCloudUrl, metadata, croppedImageCloudUrl, cropMetadata, "-==========cartDAtaaaa")

  const originalImagePayload = {
    url: originalImageCloudUrl,
    // dpi: metadata?.dpi,
    ppi: orderConfig?.originalPpi,
    width: metadata?.width,
    height: metadata?.height,
    fileSize: metadata.size,
    colorSpace: metadata?.colorSpace,
    photographer: metadata?.photographer,
    copyright: metadata?.copyright,
    source: metadata?.source,
  };
  const croppedImagePayload = {
    url: croppedImageCloudUrl,
    dpi: orderConfig?.croppedPpi,
    width: cropMetadata?.width,
    height: cropMetadata?.height,
    fileSize: cropMetadata.size,
    colorSpace: metadata?.colorSpace,
    photographer: metadata?.photographer,
    copyright: metadata?.copyright,
    source: metadata?.source,
  };




  const properties = buildImageAttributes({
    originalImageCloudUrl,
    croppedImageCloudUrl,
    metadata,
    cropMetadata,
    orderConfig
  });
  // console.log("--------properties", properties);
  await addToCartWithMetadata({
    variantId: '45459186450630',
    quantity: orderConfig?.quantity ?? 1,
    properties

  });
}

function buildImageAttributes({
  originalImageCloudUrl,
  croppedImageCloudUrl,
  metadata,
  cropMetadata,
  orderConfig
}) {
  const props = {};

  const add = (key, val) => {
    if (val !== undefined && val !== null && String(val) !== "") {
      props[key] = String(val);
    }
  };

  // ---- Preview / images ----
  add("Preview Image", croppedImageCloudUrl);
  add("Original Image URL", originalImageCloudUrl);

  // ---- Cropped image details ----
  add("Crop DPI", 300);
  add("Crop Width", cropMetadata?.width);
  add("Crop Height", cropMetadata?.height);
  add("Crop File Size (MB)", cropMetadata?.size);

  // ---- Original image details ----
  add("Original DPI", metadata?.dpi);
  add("Original Width", metadata?.width);
  add("Original Height", metadata?.height);
  add("Original File Size (MB)", metadata?.size);

  // ---- Optional metadata ----
  add("Color Space", metadata?.colorSpace);
  add("Photographer", metadata?.photographer);
  add("Copyright", metadata?.copyright);
  add("Source", metadata?.source);
  // ---- Order Config (your steps) ----
  add("Template Name", designConfig?.templateName);
  add("Size", designConfig?.size?.label);                 // e.g. 16×20"
  add("Paper Type", designConfig?.paper?.name);      // e.g. Photo Rag
  add("Finish Type", designConfig?.paper?.finish);
  // e.g. Matte / Gloss

  const border = designConfig?.border;

  const borderLabel = !border || !border.thickness
    ? "No Border"
    : `${border.thickness}" ${border.color || ""} Border`.replace(/\s+/g, " ").trim();
  add("Border", borderLabel);             // e.g. 1"
  add("Mounting Option", designConfig?.mountingOption?.name);
  add("Lamination", designConfig?.laminationOption ?? designConfig?.lamination?.name);


  return props;
};