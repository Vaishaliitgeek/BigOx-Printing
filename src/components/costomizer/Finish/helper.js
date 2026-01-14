import {
  loadCropImageFromDb,
  loadImageFromDb,
} from "../../../services/indexDb.js";
import {
  getDropboxFileNamingConfig,
  uploadImageOnDropBox,
} from "../../../services/services.js";

import ExifReader from "exifreader";

async function getMetaData(file) {
  // Read file as ArrayBuffer
  const decodedExif = await ExifReader.load(file);

  console.log("decodedExif",decodedExif);

  // return decodedExif;
 const DateTimeOriginal = decodedExif.DateTimeOriginal ?? null;
 const ColorSpace = decodedExif.ColorSpace ?? null;
 const PixelXDimension = decodedExif.PixelXDimension ?? null;
 const PixelYDimension = decodedExif.PixelYDimension ?? null;;
 const CopyrightNotice = null;
 const Source = decodedExif.Software ?? null;
 
 return {DateTimeOriginal,ColorSpace,PixelXDimension,PixelYDimension,CopyrightNotice,Source};

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
  console.log("originalImage", originalImage);

  let originalImageBlob = originalImage.blob;
  if (!isCroped) {
    originalImageBlob = base64ToBlob(originalImage.url);
  }
  console.log("originalImageBlob", originalImageBlob);
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

  return {originalImageCloudUrl,metadata};
}

async function uploadAndGetCloudeURl() {
  const originalImage = await loadImageFromDb();
  const {originalImageCloudUrl,metadata} = await uploadFileMaker(originalImage);
  console.log("Original Image Cloud URL:", originalImageCloudUrl);

  // ------------------------------------------------------------------
  //  Load cropped image from IndexedDB
  // ------------------------------------------------------------------
  const croppedImageBlob = await loadCropImageFromDb();

  const croppedImageCloudUrl = await uploadFileMaker(croppedImageBlob, true);

  console.log("Cropped Image Cloud URL:", croppedImageCloudUrl);

  return { originalImageCloudUrl, croppedImageCloudUrl };
}


export async function cartHandler() {
  // ------------------------------------------------------------------
  // Step 1: Fetch Dropbox file & folder naming configuration
  // ------------------------------------------------------------------
  const dropboxConfig = await getDropboxFileNamingConfig();

  const folderNameTemplate = dropboxConfig.folderTemplateConfig;
  const fileNameTemplate = dropboxConfig.fileNamingTemplateConfig;

  // (Currently unused but kept for future naming logic)
  // console.log("Folder Template:", folderNameTemplate);
  // console.log("File Template:", fileNameTemplate);

  const { originalImageCloudUrl, croppedImageCloudUrl } =
    await uploadAndGetCloudeURl();
    

  // ------------------------------------------------------------------
  // Step 2: Load original image from IndexedDB
  // ------------------------------------------------------------------
}
