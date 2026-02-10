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
    setStatus("image is being uploaded");

    // Parallelize the upload process for both original and cropped images
    const uploadPromises = [
      uploadFileMaker(originalImage, false, { ...dropboxMeta, fileName: `${dropboxMeta.fileName}_original` }),
      loadCropImageFromDb().then(croppedImageBlob =>
        uploadFileMaker(croppedImageBlob, true, { ...dropboxMeta, fileName: `${dropboxMeta.fileName}_cropped` })
      )
    ];

    const [originalData, croppedData] = await Promise.all(uploadPromises);

    return {
      originalImageCloudUrl: originalData.originalImageCloudUrl,
      croppedImageCloudUrl: croppedData.originalImageCloudUrl,
      metadata: originalData.metadata,
      cropMetadata: croppedData.metadata
    };
  } catch (error) {
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
function extractVariantId(runtimeResult, setStatus) {


  const savedVariants = runtimeResult               // ← added [0]
    ?.result
    ?.savedVariants;

  setStatus("Preparing variant ");
  if (!Array.isArray(savedVariants) || savedVariants.length === 0) {
    throw new Error("No saved variants found.");
  }

  // // Return the variant_id of the first variant
  const variant = savedVariants[0];  // Assuming only one variant
  if (!variant?.variant_id) {
    throw new Error("Runtime variant creation failed: No variant_id found.");
  }

  return variant.variant_id;  // Return the first variant_id
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


export async function cartHandler(setStatus, orderConfig, total, productId, signal) {
  // Constants for toast notifications
  const TOAST_MAIN = "cart-flow";
  const TOAST_VARIANT = "runtime-variant";
  const TOAST_CART = "add-to-cart";

  try {
    // Fetch Dropbox configuration
    const dropboxConfig = await getDropboxFileNamingConfig();
    if (!dropboxConfig) throw new Error("Dropbox config failed");

    const folderTemplate = dropboxConfig?.folderTemplateConfig;
    const fileTemplate = dropboxConfig?.fileNamingTemplateConfig;

    // Build token map dynamically based on order config
    const tokenMap = {
      ...getDateTokens(),
      paper_name: orderConfig?.paper?.name,
      size_w: orderConfig?.size?.width,
      size_h: orderConfig?.size?.height,
      quantity: orderConfig?.quantity,
    };

    // Resolve folder and file names using templates
    const targetFolder = folderTemplate
      ? resolveTemplate(folderTemplate, tokenMap)
      : "default";

    const fileName = fileTemplate
      ? resolveTemplate(fileTemplate, tokenMap).replace(/\//g, "_") // Replace slashes with underscores
      : `file_${Date.now()}`;

    // Step 4: Upload images (original and cropped) in parallel
    const { originalImageCloudUrl, croppedImageCloudUrl, metadata, cropMetadata } =
      await uploadAndGetCloudeURl(setStatus, {
        targetFolder,
        fileName,
      });

    if (!originalImageCloudUrl || !croppedImageCloudUrl) {
      throw new Error("Image upload failed");
    }

    // Prepare the variant array for runtime variant creation
    const variantsArray = [
      { realBaseSku: "4012500555719", price: Number(total) },
      // Additional variants can be added here if needed
    ];

    // Step 5: Create runtime variant
    const runtimeResult = await createRuntimeVariant({
      productId: productId, // Shopify product ID (numeric)
      dataPrice: Number(total),
      availableQty: orderConfig?.quantity ?? 1,
      variantsArray,
    });

    const GlobalvariantId = extractVariantId(runtimeResult[0], setStatus);
    // setStatus(GlobalvariantId);
    const variantId = GlobalvariantId;

    if (!variantId) throw new Error("Variant creation failed");

    // Step 6: Prepare properties for adding to cart
    const properties = buildImageAttributes({
      originalImageCloudUrl,
      croppedImageCloudUrl,
      metadata,
      cropMetadata,
      orderConfig,
    });

    // Step 7: Add item to cart with metadata
    await addToCartWithMetadata({
      variantId,
      quantity: orderConfig?.quantity ?? 1,
      properties,
      signal
    });

    // Success message for cart flow
    showSuccess(TOAST_MAIN, "Artwork saved & added to cart 🎉");
    return true;

  } catch (error) {
    // Handle errors during the cart flow
    console.error("Cart flow failed:", error);
    showError(TOAST_MAIN, "Cart flow failed", error?.message || "Something went wrong");
    throw error; // Always re-throw the error to allow for further handling if needed
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
