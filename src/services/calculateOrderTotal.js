
// constants
export const PRICE_UNIT = {
    PERCENT: "percent",
    FLAT: "flat",
};

// ==============================
// Pricing Constants
// ==============================

// export const TAG_DISCOUNTS = {
//     vip: 20, // 20%
// };

// export const QUANTITY_DISCOUNTS = [
//     { min: 1, max: 5, percent: 5 },   // 5%
//     { min: 6, max: 10, percent: 10 }, // example future slab
// ];

// ==============================
// Helper Utilities
// ==============================

export function roundPrice(value) {
    return Math.round(value * 100) / 100;
}

export function calculatePercentage(base, percent) {
    return (base * percent) / 100;
}

// ==============================
// Resolve Customer Discount
// ==============================

export function resolveCustomerDiscount(customerTags = [], customerRules = []) {
    if (!customerTags.length || !customerRules.length) return 0;

    // Normalize customer tags once
    const normalizedCustomerTags = customerTags.map(tag =>
        tag.toLowerCase().trim()
    );

    let maxDiscount = 0;

    customerRules.forEach((rule) => {
        rule.customerTiers?.forEach((tier) => {
            const hasAnyTag = tier.customerTag.some(tierTag =>
                normalizedCustomerTags.includes(
                    tierTag.toLowerCase().trim()
                )
            );

            if (hasAnyTag) {
                maxDiscount = Math.max(maxDiscount, tier.discountPercent);
            }
        });
    });

    return maxDiscount; // percent
}
// ==============================
// Resolve Quantity Discount
// ==============================

export function resolveQuantityDiscount(quantity, quantityRules = []) {
    const rule = quantityRules.find(
        r => quantity >= r.minQty && quantity <= r.maxQty
    );

    return rule ? rule.discountPercent : 0;
}


// ==============================
// Main Order Pricing Calculator
// ==============================

// ==============================
// Main Order Pricing Calculator
// ==============================

// ==============================
// Main Order Pricing Calculator
// ==============================

// ==============================
// Main Order Pricing Calculator
// ==============================

export function calculateOrderPrice({
    orderConfig,
    customerDiscountRules = [],
    quantityDiscountRules = [],
    Productprice,
}) {
    if (!orderConfig?.size) return 0;

    const {
        size,
        paper,
        lamination,
        mounting,
        mat,
        border,
        quantity = 1,
        tags = [],
    } = orderConfig;

    // 1️⃣ Size price as the base (used for all calculations)
    const sizeBasePrice = (size?.price || 0) * quantity;

    // Start with the base price
    let orderPrice = sizeBasePrice;

    // 2️⃣ Percentage add-ons (BASED ON SIZE PRICE)
    if (paper?.priceDeltaMinor) {
        orderPrice += calculatePercentage(sizeBasePrice, paper.priceDeltaMinor);
    }

    if (lamination?.priceDeltaMinor) {
        orderPrice += calculatePercentage(sizeBasePrice, lamination.priceDeltaMinor);
    }

    if (border?.priceDeltaMinor) {
        orderPrice += calculatePercentage(sizeBasePrice, border.priceDeltaMinor);
    }

    // 3️⃣ Flat add-ons (e.g., mounting, mat)
    if (mounting?.price) orderPrice += mounting.price * quantity;
    if (mat?.price) orderPrice += mat.price * quantity;

    // 4️⃣ Quantity discount
    const quantityDiscountPercent = resolveQuantityDiscount(
        quantity,
        quantityDiscountRules
    );

    if (quantityDiscountPercent > 0) {
        orderPrice -= calculatePercentage(orderPrice, quantityDiscountPercent);
    }

    // 5️⃣ Customer discount (LAST)
    const customerDiscountPercent = resolveCustomerDiscount(
        tags,
        customerDiscountRules
    );

    if (customerDiscountPercent > 0) {
        orderPrice -= calculatePercentage(orderPrice, customerDiscountPercent);
    }

    return roundPrice(orderPrice);
}
