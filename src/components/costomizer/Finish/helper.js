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
  // let dpi = '23';
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
  const copyright = tags?.Copyright?.description || tags?.["ICC Copyright"]?.description || tags?.Rights?.description || null;

  // ---------- Source ----------
  const source =
    tags?.Source?.description ||
    tags?.Software?.description ||
    null;

  const fileType = tags?.FileType?.description || null;

  return {
    width,
    height,
    // dpi,
    colorSpace,
    bitsPerSample,
    colorComponents,
    dateTimeOriginal,
    photographer,
    copyright,
    source,
    fileType,
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
    // showProgress(
    //   toastKey,
    //   isCroped ? "Uploading cropped image…" : "Uploading original image…"
    // );

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
    console.log("-errorrr", error)
    showError(

      isCroped ? "crop-upload" : "original-upload",
      "Image upload failed", error?.response?.data?.message
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
  const savedVariants = runtimeResult?.[0]?.result?.savedVariants;

  if (!savedVariants || savedVariants.length === 0) {
    throw new Error("No saved variants found.");
  }

  // Return the variant_id of the first variant
  const variant = savedVariants[0];  // Assuming only one variant
  if (!variant?.variant_id) {
    throw new Error("Runtime variant creation failed: No variant_id found.");
  }

  return variant.variant_id;  // Return the first variant_id
}



function getNumericVariantId(gid) {
  return gid.split("/").pop();
}



export async function cartHandler(setStatus, orderConfig, total, productId) {
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
    if (!dropboxConfig) throw new Error("Dropbox config failed");


    const folderTemplate = dropboxConfig?.folderTemplateConfig;
    const fileTemplate = dropboxConfig?.fileNamingTemplateConfig;
    console.log("-orderconfig", orderConfig)
    // ---------------------------------------------
    // 2. Build token map (dynamic, future-proof)
    // ---------------------------------------------
    const tokenMap = {
      ...getDateTokens(),
      paper_name: orderConfig?.paper?.name,
      // border_code: orderConfig?.border?.thickness,
      size_w: orderConfig?.size?.width,
      size_h: orderConfig?.size?.height,
      quantity: orderConfig?.quantity,
    };

    // ---------------------------------------------
    // 3. Resolve folder + file names
    // ---------------------------------------------
    const targetFolder = folderTemplate
      ? resolveTemplate(folderTemplate, tokenMap)
      : "default";

    const fileName = fileTemplate
      ? resolveTemplate(fileTemplate, tokenMap).replace(/\//g, "_") // Replace slashes with underscores
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


    if (!originalImageCloudUrl || !croppedImageCloudUrl) {
      throw new Error("Image upload failed");
    }
    console.log("-----------originalImageCloudUrl", originalImageCloudUrl)

    // varinat array
    const variantsArray = [
      { realBaseSku: "4012500555719", price: Number(total) },
      // { realBaseSku: "4012500555719", price: 40 },
      // { realBaseSku: "4012500555719", price: 60 }
    ];




    // showProgress(TOAST_VARIANT, "Creating runtime variant…");
    const runtimeResult = await createRuntimeVariant({
      productId: productId,   // Shopify product ID (numeric)
      dataPrice: Number(total),
      availableQty: orderConfig?.quantity ?? 1,
      variantsArray,
    });

    // console.log("----------")

    const GlobalvariantId = extractVariantId(runtimeResult);
    setStatus(GlobalvariantId);
    const variantId = GlobalvariantId;
    if (!variantId) throw new Error("Variant creation failed");

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
    console.log("--------properties", properties);
    // setStatus(JSON.stringify(orderConfig, null, 2));
    await addToCartWithMetadata({
      variantId: variantId,
      quantity: orderConfig?.quantity ?? 1,
      properties

    });
    // showSuccess("Item added to cart successfully");
    // showSuccess(TOAST_MAIN, "Artwork saved & added to cart 🎉");
    // toast.success('Item added to cart successfully')
    return true;
    // window.location.reload();
  }
  catch (error) {

    console.error("Cart flow failed:", error);
    throw error; // ⬅️ VERY IMPORTANT
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
  add("_Preview Image", croppedImageCloudUrl);
  add("_Original Image URL", originalImageCloudUrl);
  // add("Tags", "runtimeVariant");


  // ---- Cropped image details ----
  add("_Crop DPI", orderConfig?.croppedPpi);
  add("_Crop Width", cropMetadata?.width);
  add("_Crop Height", cropMetadata?.height);
  add("_Crop File Size (MB)", cropMetadata?.size);

  // ---- Original image details ----
  add("_Original DPI", orderConfig?.originalPpi);
  add("_Original Width", metadata?.width);
  add("_Original Height", metadata?.height);
  add("_Original File Size (MB)", metadata?.size);

  // ---- Optional metadata ----
  add("_Color Space", metadata?.colorSpace ?? 'N/A');
  add("_Photographer", metadata?.photographer ?? 'N/A');
  add("_Copyright", metadata?.copyright ?? 'N/A');
  add("_Source", metadata?.source ?? 'N/A');
  add('_fileType', metadata?.fileType ?? 'N/A');

  // ---- Order Config (your steps) ----
  add("_Template Name", orderConfig?.templateName);
  add("_Size", orderConfig?.size?.label);                 // e.g. 16×20"
  add("_Paper Type", orderConfig?.paper?.name);      // e.g. Photo Rag
  add("_Finish Type", orderConfig?.paper?.finish);  // e.g. Matte / Gloss

  const border = orderConfig?.border;

  const borderLabel = !border || !border.thickness
    ? "No Border"
    : `${border.thickness}" ${border.color || ""} Border`.replace(/\s+/g, " ").trim();
  add("_Border", borderLabel);             // e.g. 1"
  add("_Mounting Option", orderConfig?.mounting?.name);
  add("_Lamination", orderConfig?.laminationOption ?? orderConfig?.lamination?.name);

  return props;
}


// for multiple variantss
// async function cartHandler(setStatus, orderConfig, total, productId) {
//   // ---------------------------------------------
//   // 1. Fetch Dropbox config
//   // ---------------------------------------------
//   const TOAST_MAIN = "cart-flow";
//   const TOAST_VARIANT = "runtime-variant";
//   const TOAST_CART = "add-to-cart";

//   try {
//     // Show initial progress
//     // showProgress(TOAST_MAIN, "Preparing your product…");

//     // ---------------------------------------------
//     // 1) Dropbox config + folder/file name
//     // ---------------------------------------------
//     const dropboxConfig = await getDropboxFileNamingConfig();
//     if (!dropboxConfig) throw new Error("Dropbox config failed");

//     const folderTemplate = dropboxConfig?.folderTemplateConfig;
//     const fileTemplate = dropboxConfig?.fileNamingTemplateConfig;
//     console.log("-orderconfig", orderConfig);

//     // ---------------------------------------------
//     // 2. Build token map (dynamic, future-proof)
//     // ---------------------------------------------
//     const tokenMap = {
//       ...getDateTokens(),
//       paper_name: orderConfig?.paper?.name,
//       size_w: orderConfig?.size?.width,
//       size_h: orderConfig?.size?.height,
//       quantity: orderConfig?.quantity,
//     };

//     // ---------------------------------------------
//     // 3. Resolve folder + file names
//     // ---------------------------------------------
//     const targetFolder = folderTemplate
//       ? resolveTemplate(folderTemplate, tokenMap)
//       : "default";

//     const fileName = fileTemplate
//       ? resolveTemplate(fileTemplate, tokenMap).replace(/\//g, "_") // Replace slashes with underscores
//       : `file_${Date.now()}`;

//     // ---------------------------------------------
//     // 4. Upload images (NO STRUCTURE CHANGE)
//     // ---------------------------------------------
//     const { originalImageCloudUrl, croppedImageCloudUrl, metadata, cropMetadata } =
//       await uploadAndGetCloudeURl(setStatus, {
//         targetFolder,
//         fileName,
//       });

//     if (!originalImageCloudUrl || !croppedImageCloudUrl) {
//       throw new Error("Image upload failed");
//     }

//     console.log("-----------originalImageCloudUrl", originalImageCloudUrl);

//     // ---------------------------------------------
//     // 5. Handle variants array
//     // ---------------------------------------------
//     const variantsArray = [
//       { realBaseSku: "4012500555719", price: Number(total) },
//       // Add more variants if needed
//     ];

//     // Loop through variants and add each one to the cart
//     for (const variant of variantsArray) {
//       const variantId = await createVariantAndAddToCart(
//         variant, productId, originalImageCloudUrl, croppedImageCloudUrl, metadata, cropMetadata, orderConfig
//       );

//       if (variantId) {
//         console.log(`Variant ${variantId} added to cart`);
//       }
//     }

//     return true;

//   } catch (error) {
//     console.error("Cart flow failed:", error);
//     throw error; // ⬅️ VERY IMPORTANT
//   }
// }

// async function createVariantAndAddToCart(variant, productId, originalImageCloudUrl, croppedImageCloudUrl, metadata, cropMetadata, orderConfig) {
//   try {
//     // Create runtime variant
//     const variantsArray = [
//       { realBaseSku: variant.realBaseSku, price: variant.price },
//     ];

//     const runtimeResult = await createRuntimeVariant({
//       productId,
//       dataPrice: variant.price,
//       availableQty: orderConfig?.quantity ?? 1,
//       variantsArray,
//     });

//     const variantId = extractVariantId(runtimeResult);
//     if (!variantId) throw new Error("Variant creation failed");

//     // Prepare image attributes
//     const properties = buildImageAttributes({
//       originalImageCloudUrl,
//       croppedImageCloudUrl,
//       metadata,
//       cropMetadata,
//       orderConfig,
//     });

//     // Add variant to cart
//     await addToCartWithMetadata({
//       variantId: variantId,
//       quantity: orderConfig?.quantity ?? 1,
//       properties,
//     });

//     return variantId;
//   } catch (error) {
//     console.error("Error while creating variant and adding to cart:", error);
//     throw error;
//   }
// }

// // Extract variant id from runtime result
// function extractVariantId(runtimeResult) {
//   const savedVariants = runtimeResult?.[0]?.result?.savedVariants;
//   if (!savedVariants || savedVariants.length === 0) {
//     throw new Error("No saved variants found.");
//   }

//   const variant = savedVariants[0]; // Assuming only one variant
//   if (!variant?.variant_id) {
//     throw new Error("Runtime variant creation failed: No variant_id found.");
//   }

//   return variant.variant_id;  // Return the first variant_id
// }
