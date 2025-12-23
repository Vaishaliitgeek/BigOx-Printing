import axios from "axios";

// Create an Axios instance with default settings
export const axiosInstance = axios.create({});

// Base URL for the API, set via environment variable
// const Base_Url = process.env.REACT_APP_BASE_URL;

/**
* apiConnecter - A helper function to make API requests using Axios
*
* @param {string} method - The HTTP method (e.g., 'GET', 'POST', 'PUT', 'DELETE')
* @param {string} url - The endpoint URL to send the request to
* @param {Object | null} bodyData - The data to send in the body of the request (for methods like POST or PUT)
* @param {Object | null} headers - Custom headers to send along with the request (optional)
* @param {Object | null} params - URL query parameters to send with the request (optional)
*
* @returns {Promise} - Returns a promise that resolves to the API response or rejects with an error.
* 
*/
export const  apiConnecter = (method, url, bodyData, headers, params) => {
    return axiosInstance({
        method: `${method}`,  // HTTP method to be used (GET, POST, etc.)
        url: `${url}`,  // Full URL, combining base URL and endpoint
        data: bodyData ? bodyData : null,  // Request body, if provided
        headers: headers ? headers : null,  // Custom headers, if provided
        params: params ? params : null,  // Query parameters, if provided
    });
}
