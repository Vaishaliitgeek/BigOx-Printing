import { apiConnecter } from "../utils/ApiConnector";
const BASE_URL = "https://ozone-airplane-handle-portfolio.trycloudflare.com";
const shop = "amjad-itgeeks.myshopify.com";

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
      { shop, productId: "gid://shopify/Product/8715146461382" }
    );
    console.log(res.data.result);
    return res.data.result[0];
  } catch (err) {
    console.error("Error while getting Lamination options:", err.message);
  }
}
