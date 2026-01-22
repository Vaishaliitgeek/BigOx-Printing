import { apiConnecter } from "../utils/ApiConnector";
const BASE_URL = "https://seahorse-app-men9d.ondigitalocean.app";
const shop = "amjad-itgeeks.myshopify.com";

// ***********************************************************************************************************************************************
// *                                   Functions to add itms in cart                                                                                           *
// ************************************************************************************************************************************************
// Fetch Validation Rules from the API

export async function addToCartWithMetadata({
  variantId,
  quantity = 1,
  properties,
}) {
  try {
    const response = await apiConnecter("POST", `/cart/add.js`, null, null, {
      id: variantId,
      quantity,
      properties,
    });
    console.log("Added with metadata:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error while adding itme in cart ", error.message);
    throw error;
  }
}

// ***********************************************************************************************************************************************
// *                                   Functions to get validation rules                                                                                           *
// ************************************************************************************************************************************************
// Fetch Validation Rules from the API
export async function getValidationRules() {
  try {
    const response = await apiConnecter(
      "GET",
      `${BASE_URL}/api/validationRules/getValidationRules`,
      null,
      null,
      { shop }
    );
    return response.data.result;
  } catch (error) {
    console.error("Error fetching validation rules:", error);
    throw error;
  }
}

// ***********************************************************************************************************************************************
// *                           Functions to get various catalog options like Paper, Border, Mounting, Lamination etc.                                         *
// ************************************************************************************************************************************************

// Fetch Size Options from the API
export async function getSizeOptions() {
  try {
    const res = await apiConnecter(
      "get",
      `${BASE_URL}/api/catalogOptions/getSizeOptions`,
      null,
      null,
      { shop }
    );
    return res.data.result;
  } catch (err) {
    console.error("Error while getting size options:", err.message);
  }
}

// Fetch Paper Options from the API
export async function getPaperOptions() {
  try {
    const res = await apiConnecter(
      "get",
      `${BASE_URL}/api/catalogOptions/getPaperOptions`,
      null,
      null,
      { shop }
    );
    console.log("Date ////////////////", res);
    return res.data.result;
  } catch (err) {
    console.error("Error while getting Paper options:", err.message);
  }
}

// Fetch Border Options from the API
export async function getBorderOptions() {
  try {
    const res = await apiConnecter(
      "get",
      `${BASE_URL}/api/catalogOptions/getBorderOptions`,
      null,
      null,
      { shop }
    );
    return res.data.result;
  } catch (err) {
    console.error("Error while getting Border options:", err.message);
  }
}

// Fetch Mounting Options from the API
export async function getMountingOptions() {
  try {
    const res = await apiConnecter(
      "get",
      `${BASE_URL}/api/catalogOptions/getMountingOptions`,
      null,
      null,
      { shop }
    );
    return res.data.result;
  } catch (err) {
    console.error("Error while getting Mounting options:", err.message);
  }
}

// Fetch Mounting Lamination from the API
export async function getLaminationOptions() {
  try {
    const res = await apiConnecter(
      "get",
      `${BASE_URL}/api/catalogOptions/getLaminationOptions`,
      null,
      null,
      { shop }
    );
    console.log(res.data.result);
    return res.data.result;
  } catch (err) {
    console.error("Error while getting Lamination options:", err.message);
  }
}

// Fetch Mounting Lamination from the API
export async function getTemplateFromDb() {
  try {
    const res = await apiConnecter(
      "get",
      `${BASE_URL}/api/tamplates/getTamplatesByProductId`,
      null,
      null,
      { shop, productId: "gid://shopify/Product/8759366385862" }
    );
    console.log(res.data.result);
    return res.data.result[0];
  } catch (err) {
    console.error("Error while getting Lamination options:", err.message);
  }
}

export async function getCommerceRulesQuantityAndLimits() {
  try {
    const res = await apiConnecter(
      "get",
      `${BASE_URL}/api/commerceRules/getCommerceRulesQuantityAndLimits`,
      null,
      null,
      { shop }
    );
    console.log(res.data.result);
    return res.data.result;
  } catch (err) {
    console.error("Error while getting  quantity and discounts:", err.message);
  }
}

export async function getCommerseRule() {
  try {
    const res = await apiConnecter(
      "get",
      `${BASE_URL}/api/catalogOptions/getLaminationOptions`,
      null,
      null,
      { shop }
    );
    console.log(res.data.result);
    return res.data.result;
  } catch (err) {
    console.error("Error while getting Lamination options:", err.message);
  }
}

// ************************************* POST APIS***************************************************
// export async function uploadImageOnDropBox(data) {
//   // console.log("----data",data)
//   const randomFileName = `file_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

//   try {
//     const res = await apiConnecter(
//       "post",
//       `${BASE_URL}/api/dropboxConfig/uploadImagesOnDropBoxByClientEnd?shop=amjad-itgeeks.myshopify.com&fileName=${randomFileName}&targetFolder=test`,
//       data,
//     );
//     console.log(res.data.result, "====img");
//     return res.data.result.dropboxUrl;
//   } catch (err) {
//     console.error("Error while uploading image on dropbox:", err.message);
//   }
// }

export async function uploadImageOnDropBox({ data, fileName, targetFolder }) {
  const finalFileName = fileName || `file_${Date.now()}`;
  const finalFolder = targetFolder || "default";

  try {
    const res = await apiConnecter(
      "post",
      `${BASE_URL}/api/dropboxConfig/uploadImagesOnDropBoxByClientEnd?shop=${shop}&fileName=${finalFileName}&targetFolder=${finalFolder}`,
      data
    );

    return res.data.result.dropboxUrl;
  } catch (err) {
    console.error("Error while uploading image on dropbox:", err.message);
    throw err;
  }
}


export async function getDropboxFileNamingConfig(data) {
  try {
    const res = await apiConnecter(
      "get",
      `${BASE_URL}/api/dropboxConfig/getDropboxConfigAndConnectedCheck`,
      data,
    );
    console.log(res.data.result, "filenameee");
    return res.data.result;
  } catch (err) {
    console.error("Error while uploading image on dropbox:", err.message);
  }
}


// Quantity Discount 
export async function getCommerceRulesQuantityAndDiscounts() {
  try {
    const res = await apiConnecter(
      "get",
      `${BASE_URL}/api/commerceRules/getCommerceRulesQuantityDiscounts`,
      null,
      null,
      { shop }
    );
    console.log(res.data.result);
    return res.data.result;
  } catch (err) {
    console.error("Error while getting  quantity and discounts:", err.message);
  }
}

// Customer Discount 
export async function getCommerceRulesCustomerDiscounts() {
  try {
    const res = await apiConnecter(
      "get",
      `${BASE_URL}/api/commerceRules/getCommerceRulesCustomerDiscounts`,
      null,
      null,
      { shop }
    );
    console.log(res.data.result);
    return res.data.result;
  } catch (err) {
    console.error("Error while getting  quantity and discounts:", err.message);
  }
}


