// utils/dropboxTemplate.js
export const pad2 = (n) => String(n).padStart(2, "0");

export function getDateTokens(date = new Date()) {
    return {
        dd_mm_yyyy: `${pad2(date.getDate())}_${pad2(date.getMonth() + 1)}_${date.getFullYear()}`,
        mm_dd_yyyy: `${pad2(date.getMonth() + 1)}_${pad2(date.getDate())}_${date.getFullYear()}`,
        yyyy_mm_dd: `${date.getFullYear()}_${pad2(date.getMonth() + 1)}_${pad2(date.getDate())}`,
        timestamp: String(Date.now()),
    };
}

export function sanitizePathPart(v) {
    return String(v ?? "")
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[<>:"\\|?*\u0000-\u001F]/g, "") // windows + control chars
        .replace(/\/+/g, "_"); // avoid nested slashes from values
}

/**
 * Replace {token} using provided tokenMap
 * Unknown tokens -> "unknown_token"
 */
export function resolveTemplate(template = "", tokenMap = {}) {
    return template.replace(/\{(.*?)\}/g, (_, rawToken) => {
        const token = rawToken.trim();
        const value = tokenMap[token];
        return sanitizePathPart(value ?? `None_${token}`);
    });
}
