// utils/priceFormatter.js
export const getDeltaAmount = (basePrice, percent) => {
    const base = Number(basePrice) || 0;
    const p = Number(percent) || 0;
    return (base * p) / 100;
};
