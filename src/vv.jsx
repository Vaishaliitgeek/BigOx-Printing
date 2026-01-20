import {
    loadCropImageFromDb,
    loadImageFromDb,
} from "../../../services/indexDb.js";
import {
    getDropboxFileNamingConfig,
    uploadImageOnDropBox,
} from "../../../services/services.js";

import ExifReader from "exifreader";

// async function getMetaData(file) {
//   // Read file as ArrayBuffer
//   const decodedExif = await ExifReader.load(file);

//   console.log("decodedExif",decodedExif);

//   // return decodedExif;
//  const DateTimeOriginal = decodedExif.DateTimeOriginal ?? null;
//  const ColorSpace = decodedExif.ColorSpace ?? null;
//  const PixelXDimension = decodedExif.PixelXDimension ?? null;
//  const PixelYDimension = decodedExif.PixelYDimension ?? null;;
//  const CopyrightNotice = null;
//  const Source = decodedExif.Software ?? null;

//  return {DateTimeOriginal,ColorSpace,PixelXDimension,PixelYDimension,CopyrightNotice,Source};

// }


async function getMetaData(file) {
    const tags = await ExifReader.load(file);

    const width =
        tags?.PixelXDimension?.description ||
        tags?.["Image Width"]?.value ||
        null;

    const height =
        tags?.PixelYDimension?.description ||
        tags?.["Image Height"]?.value ||
        null;

    const colorSpace =
        tags?.ICCProfile?.description ||          // BEST
        tags?.["ICC Description"]?.description ||
        tags?.ColorSpace?.description ||
        tags?.["Color Space"]?.description ||
        null;

    const dateTimeOriginal =
        tags?.DateTimeOriginal?.description ||
        tags?.CreateDate?.description ||
        tags?.DateCreated?.description ||
        null;

    const photographer =
        tags?.Artist?.description ||
        tags?.Creator?.description ||
        tags?.CameraOwnerName?.description ||
        null;

    const copyright =
        tags?.Copyright?.description ||
        tags?.Rights?.description ||
        null;

    const source =
        tags?.Source?.description ||
        tags?.Software?.description ||
        tags?.DocumentID?.description ||
        null;

    return {
        dateTimeOriginal,
        width: Number(width),
        height: Number(height),
        colorSpace,
        photographer,
        copyright,
        source,
    };
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

// async function uploadFileMaker(originalImage, isCroped = false) {
//   let originalImageBlob = originalImage.blob;

//   if (!isCroped) {
//     originalImageBlob = base64ToBlob(originalImage.url);
//   }

//   const originalImageFile = new File(
//     [originalImageBlob],
//     `original-image.${originalImage.type.split("/")[1]}`,
//     { type: originalImage.type }
//   );

//   const metadata = await getMetaData(originalImageFile);

//   const originalImageFormData = new FormData();
//   originalImageFormData.append("image", originalImageFile);

//   const cloudUrl = await uploadImageOnDropBox(originalImageFormData);
// console.log(first)
//   return {
//     originalImageCloudUrl: cloudUrl,
//     metadata,
//     fileSize: originalImageFile.size,
//   };
// }


async function uploadAndGetCloudeURl() {
    const originalImage = await loadImageFromDb();
    const { originalImageCloudUrl, metadata } = await uploadFileMaker(originalImage);
    // console.log("Original Image Cloud URL:", originalImageCloudUrl);

    // ------------------------------------------------------------------
    //  Load cropped image from IndexedDB
    // ------------------------------------------------------------------
    const croppedImageBlob = await loadCropImageFromDb();

    const croppedImageCloudUrl = await uploadFileMaker(croppedImageBlob, true);

    // console.log("Cropped Image Cloud URL:", croppedImageCloudUrl);

    return { originalImageCloudUrl, croppedImageCloudUrl };
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
export async function cartHandler() {
    const { originalImageCloudUrl, metadata, fileSize } =
        await uploadAndGetCloudeURl();
    // console.log("============originalImageCloudUrl", originalImageCloudUrl, metadata)
    // const originalImageLineItem = {
    //   url: originalImageCloudUrl,
    //   dpi: 72, // or calculate later if needed
    //   width: metadata.width,
    //   height: metadata.height,
    //   fileSize,
    //   colorSpace: metadata.colorSpace,
    //   photographer: metadata.photographer,
    //   copyright: metadata.copyright,
    //   source: metadata.source,
    // };

    // console.log("originalImage lineItem:", originalImageLineItem);

    // Example: attach to cart API
    /*
    await addToCart({
      attributes: {
        originalImage: JSON.stringify(originalImageLineItem)
      }
    });
    */
}

