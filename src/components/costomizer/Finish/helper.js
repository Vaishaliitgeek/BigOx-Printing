import { toast } from "react-toastify";
import {
  loadCropImageFromDb,
  loadImageFromDb,
} from "../../../services/indexDb.js";
import {
  addToCartWithMetadata,
  createRuntimeVariant,
  getDropboxFileNamingConfig,
  uploadImageOnDropBox,
} from "../../../services/services.js";
import { getDateTokens, resolveTemplate } from "../../../utils/dropboxTemplate.js";
// import { toast } from "react-toastify";

import ExifReader from "exifreader";
import { dismissToast, showError, showProgress, showSuccess } from '../../../Components/toastHelper.jsx';

async function getMetaData(file) {
  const tags = await ExifReader.load(file);

  console.log("tags", tags);

  // ---------- Image dimensions ----------
  const width = Number(tags?.["Image Width"]?.value) || null;
  const height = Number(tags?.["Image Height"]?.value) || null;

  // ---------- DPI (JPEG: XResolution/YResolution are often useless = 1) ----------
  let dpi = '23';
  // if (
  //   tags?.XResolution?.value &&
  //   tags?.Resolution?.value &&
  //   tags?.ResolutionUnit?.description === "inches"
  // ) {
  //   dpi = Math.round(tags.XResolution.value);
  // }

  // ---------- Color space (MOST IMPORTANT) ----------
  const colorSpace =
    tags?.["ICC Description"]?.description || // BEST (sRGB)
    tags?.["Color Space"]?.description ||
    null;

  // ---------- Bit depth & color components ----------
  const bitsPerSample =
    tags?.["Bits Per Sample"]?.value || null;

  const colorComponents =
    tags?.["Color Components"]?.value || null;

  // ---------- Date (often missing in PNG / web JPEGs) ----------
  const dateTimeOriginal =
    tags?.DateTimeOriginal?.description ||
    tags?.CreateDate?.description ||
    null;

  // ---------- Photographer (NOT present in your data) ----------
  const photographer =
    tags?.Artist?.description ||
    tags?.Creator?.description ||
    null;

  // ---------- Copyright (IGNORE ICC Copyright) ----------
  const copyright =
    tags?.Copyright?.description ||
    tags?.Rights?.description ||
    null;

  // ---------- Source ----------
  const source =
    tags?.Source?.description ||
    tags?.Software?.description ||
    null;

  return {
    width,
    height,
    dpi,
    colorSpace,
    bitsPerSample,
    colorComponents,
    dateTimeOriginal,
    photographer,
    copyright,
    source,
    fileType: tags?.FileType?.description || null,
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



async function uploadFileMaker(originalImage, isCroped, dropboxMeta = {}) {
  try {
    const toastKey = isCroped ? "crop-upload" : "original-upload";
    console.log("originalImage", originalImage);
    showProgress(
      toastKey,
      isCroped ? "Uploading cropped image…" : "Uploading original image…"
    );

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
    console.log("------------------------------upmetaDAta", metadata);
    const sizeInMB = (originalImageFile.size / (1024 * 1024)).toFixed(2);
    metadata.size = sizeInMB;
    // ------------------------------------------------------------------
    // Step 3: Upload original image to Dropbox
    // ------------------------------------------------------------------
    const originalImageFormData = new FormData();
    originalImageFormData.append("image", originalImageFile);

    const originalImageCloudUrl = await uploadImageOnDropBox({
      data: originalImageFormData,
      ...dropboxMeta,
    });

    console.log("-------ourl", originalImageCloudUrl)
    // showSuccess(
    //   toastKey,
    //   isCroped
    //     ? "Cropped image uploaded successfully"
    //     : "Original image uploaded successfully"
    // );

    return { originalImageCloudUrl, metadata };
  }
  catch (error) {
    showError(
      isCroped ? "crop-upload" : "original-upload",
      "Image upload failed"
    );
    throw error;
  }

}

async function uploadAndGetCloudeURl(setStatus, dropboxMeta = {}) {
  try {
    const originalImage = await loadImageFromDb();
    setStatus("image one is being uploading");
    const { originalImageCloudUrl, metadata } = await uploadFileMaker(originalImage, false, {
      ...dropboxMeta,
      fileName: `${dropboxMeta.fileName}_original`,
    });
    console.log("Original Image Cloud URL:", originalImageCloudUrl);
    // console.log("----metadata", metadata)

    // ------------------------------------------------------------------
    //  Load cropped image from IndexedDB
    // ------------------------------------------------------------------
    const croppedImageBlob = await loadCropImageFromDb();

    setStatus("image two is being uploading");

    const { originalImageCloudUrl: croppedImageCloudUrl, metadata: cropMetadata } = await uploadFileMaker(croppedImageBlob, true, {
      ...dropboxMeta,
      fileName: `${dropboxMeta.fileName}_cropped`,
    });;

    // console.log("Cropped Image Cloud URL:", croppedImageCloudUrl, cropMetadata);

    return { originalImageCloudUrl, croppedImageCloudUrl, metadata, cropMetadata };
  }
  catch (error) {
    // toast.error("Image processing failed");
    showError("cart-flow", "Image processing failed");

    throw error;
  }
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

//   const { originalImageCloudUrl, croppedImageCloudUrl, metadata } =
//     await uploadAndGetCloudeURl();


//   console.log("---------------------cart data", originalImageCloudUrl, metadata)

//   // ------------------------------------------------------------------
//   // Step 2: Load original image from IndexedDB
//   // ------------------------------------------------------------------
// }

// cart handler ankit prajapat
// export async function cartHandler(setStatus) {
//   toast.success("Saved successfully!");
//   const { originalImageCloudUrl, croppedImageCloudUrl, metadata, cropMetadata } =
//     await uploadAndGetCloudeURl(setStatus);

//   console.log(originalImageCloudUrl, metadata, croppedImageCloudUrl, cropMetadata, "-==========cartDAtaaaa")

//   const originalImagePayload = {
//     url: originalImageCloudUrl,
//     dpi: metadata?.dpi,
//     width: metadata?.width,
//     height: metadata?.height,
//     fileSize: metadata.size,
//     colorSpace: metadata?.colorSpace,
//     photographer: metadata?.photographer,
//     copyright: metadata?.copyright,
//     source: metadata?.source,
//   };
//   const croppedImagePayload = {
//     url: croppedImageCloudUrl,
//     dpi: '300',
//     width: cropMetadata?.width,
//     height: cropMetadata?.height,
//     fileSize: cropMetadata.size,
//     colorSpace: metadata?.colorSpace,
//     photographer: metadata?.photographer,
//     copyright: metadata?.copyright,
//     source: metadata?.source,
//   };




//   const properties = buildImageAttributes({
//     originalImageCloudUrl,
//     croppedImageCloudUrl,
//     metadata,
//     cropMetadata
//   });
//   console.log("--------properties", properties);
//   await addToCartWithMetadata({
//     variantId: '45459186450630',
//     quantity: 1,
//     properties

//   });
// }


// extract varinat id
function extractVariantId(runtimeResult) {
  const variant =
    runtimeResult?.response?.find(r => r.success)?.variant;

  if (!variant?.id) {
    throw new Error("Runtime variant creation failed");
  }

  return variant.id;
}


// cart handler
// export async function cartHandler(setStatus) {
//   try {
//     showProgress("cart-flow", "Preparing your product…");

//     // ----------------------------------------
//     // 1️⃣ Create runtime variant FIRST
//     // ----------------------------------------
//     const runtimeResult = await createRuntimeVariant({
//       productId: "8760612421830",   // Shopify product ID (numeric)
//       dataPrice: 15,
//       availableQty: 10,
//     });

//     const variantId = extractVariantId(runtimeResult);

//     console.log('--------variantId', variantId)
//     showProgress("cart-flow", "Preparing your artwork…");

//     // ----------------------------------------
//     // 2️⃣ Upload images
//     // ----------------------------------------
//     const {
//       originalImageCloudUrl,
//       croppedImageCloudUrl,
//       metadata,
//       cropMetadata,
//     } = await uploadAndGetCloudeURl(setStatus);

//     const properties = buildImageAttributes({
//       originalImageCloudUrl,
//       croppedImageCloudUrl,
//       metadata,
//       cropMetadata,
//     });

//     showProgress("add-to-cart", "Adding item to cart…");

//     // ----------------------------------------
//     // 3️⃣ Add to cart using NEW variant ID
//     // ----------------------------------------
//     await addToCartWithMetadata({
//       variantId, // 🔥 dynamic runtime variant
//       quantity: 1,
//       properties,
//     });

//     showSuccess("add-to-cart", "Item added to cart successfully");
//     showSuccess("cart-flow", "Artwork saved & added to cart 🎉");
//   } catch (error) {
//     dismissToast("add-to-cart");
//     showError(
//       "cart-flow",
//       error?.response?.data?.message || error.message || "Something went wrong"
//     );
//   }
// }
function getNumericVariantId(gid) {
  return gid.split("/").pop();
}



export async function cartHandler(setStatus, orderConfig, total) {
  // ---------------------------------------------
  // 1. Fetch Dropbox config
  // ---------------------------------------------
  const TOAST_MAIN = "cart-flow";
  const TOAST_VARIANT = "runtime-variant";
  const TOAST_CART = "add-to-cart";


  try {
    // showProgress(TOAST_MAIN, "Preparing your product…");
    // ---------------------------------------------
    // 1) Dropbox config + folder/file name
    // ---------------------------------------------
    // showProgress(TOAST_MAIN, "Preparing artwork naming…");
    const dropboxConfig = await getDropboxFileNamingConfig();

    const folderTemplate = dropboxConfig?.folderTemplateConfig;
    const fileTemplate = dropboxConfig?.fileNamingTemplateConfig;
    console.log("-orderconfig", orderConfig)
    // ---------------------------------------------
    // 2. Build token map (dynamic, future-proof)
    // ---------------------------------------------
    const tokenMap = {
      ...getDateTokens(),
      paper_code: orderConfig?.paper?.name,
      border_code: orderConfig?.border?.thickness,
      size: orderConfig?.size?.label,
      quantity: orderConfig?.quantity,
    };

    // ---------------------------------------------
    // 3. Resolve folder + file names
    // ---------------------------------------------
    const targetFolder = folderTemplate
      ? resolveTemplate(folderTemplate, tokenMap)
      : "default";

    const fileName = fileTemplate
      ? resolveTemplate(fileTemplate, tokenMap)
      : `file_${Date.now()}`;

    // ---------------------------------------------
    // 4. Upload images (NO STRUCTURE CHANGE)
    // ---------------------------------------------
    // showProgress(TOAST_MAIN, "Uploading artwork…");
    const { originalImageCloudUrl, croppedImageCloudUrl, metadata, cropMetadata } =
      await uploadAndGetCloudeURl(setStatus, {
        targetFolder,
        fileName,
      });
    console.log("-----------originalImageCloudUrl", originalImageCloudUrl)

    // showProgress(TOAST_VARIANT, "Creating runtime variant…");
    const runtimeResult = await createRuntimeVariant({
      productId: "8760612421830",   // Shopify product ID (numeric)
      dataPrice: Number(total),
      availableQty: orderConfig?.quantity ?? 1,
    });

    const GlobalvariantId = extractVariantId(runtimeResult);
    const variantId = getNumericVariantId(GlobalvariantId)

    // const { originalImageCloudUrl, croppedImageCloudUrl, metadata, cropMetadata } =
    //   await uploadAndGetCloudeURl(setStatus);
    // console.log(originalImageCloudUrl, metadata, croppedImageCloudUrl, cropMetadata, "-==========cartDAtaaaa")


    // showSuccess(TOAST_VARIANT, "Runtime variant created");

    // showProgress(TOAST_CART, "Adding item to cart…");

    const properties = buildImageAttributes({
      originalImageCloudUrl,
      croppedImageCloudUrl,
      metadata,
      cropMetadata,
      orderConfig
    });
    // console.log("--------properties", properties);
    await addToCartWithMetadata({
      variantId: variantId,
      quantity: orderConfig?.quantity ?? 1,
      properties

    });
    // showSuccess("Item added to cart successfully");
    // showSuccess(TOAST_MAIN, "Artwork saved & added to cart 🎉");
    toast.success('Item added to cart successfully')
  }
  catch (error) {
    dismissToast("original-upload");
    dismissToast("crop-upload");
    dismissToast(TOAST_VARIANT);
    dismissToast(TOAST_CART);

    showError(TOAST_MAIN, getErrMsg(error));
    throw error;
  }

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
  add("Template Name", orderConfig?.templateName);
  add("Size", orderConfig?.size?.label);                 // e.g. 16×20"
  add("Paper Type", orderConfig?.paper?.name);      // e.g. Photo Rag
  add("Finish Type", orderConfig?.paper?.finish);
  // e.g. Matte / Gloss

  const border = orderConfig?.border;

  const borderLabel = !border || !border.thickness
    ? "No Border"
    : `${border.thickness}" ${border.color || ""} Border`.replace(/\s+/g, " ").trim();
  add("Border", borderLabel);             // e.g. 1"
  add("Mounting Option", orderConfig?.mountingOption?.name);
  add("Lamination", orderConfig?.laminationOption ?? orderConfig?.lamination?.name);


  return props;
};