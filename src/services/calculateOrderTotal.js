
// constants
export const PRICE_UNIT = {
    PERCENT: "percent",
    FLAT: "flat",
};

// ==============================
// Pricing Constants
// ==============================

export const TAG_DISCOUNTS = {
    vip: 20, // 20%
};

export const QUANTITY_DISCOUNTS = [
    { min: 1, max: 5, percent: 5 },   // 5%
    { min: 6, max: 10, percent: 10 }, // example future slab
];

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

    let maxDiscount = 0;

    customerRules.forEach((rule) => {
        rule.customerTiers?.forEach((tier) => {
            const hasAllTags = tier.customerTag.every(tag =>
                customerTags.includes(tag)
            );

            if (hasAllTags) {
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

export function calculateOrderPrice({
    orderConfig,
    customerDiscountRules = [],
    quantityDiscountRules = [],
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

    // ------------------------------
    // 1️⃣ Base price (per unit)
    // ------------------------------
    const RETAIL_PRICE = 100; // 🔴 replace later
    let baseAfterDiscount = RETAIL_PRICE;

    // ------------------------------
    // 2️⃣ Customer discount
    // ------------------------------
    const customerDiscountPercent = resolveCustomerDiscount(
        tags,
        customerDiscountRules
    );

    if (customerDiscountPercent > 0) {
        baseAfterDiscount -= calculatePercentage(
            baseAfterDiscount,
            customerDiscountPercent
        );
    }

    // ------------------------------
    // 3️⃣ Quantity discount
    // ------------------------------
    const quantityDiscountPercent = resolveQuantityDiscount(
        quantity,
        quantityDiscountRules
    );

    if (quantityDiscountPercent > 0) {
        baseAfterDiscount -= calculatePercentage(
            baseAfterDiscount,
            quantityDiscountPercent
        );
    }

    // 🔒 Lock discounted base
    let unitPrice = baseAfterDiscount;

    // ------------------------------
    // 4️⃣ Percentage add-ons
    // (always on discounted base)
    // ------------------------------

    if (paper?.priceDeltaMinor) {
        unitPrice += calculatePercentage(
            baseAfterDiscount,
            paper.priceDeltaMinor
        );
    }

    if (lamination?.priceDeltaMinor) {
        unitPrice += calculatePercentage(
            baseAfterDiscount,
            lamination.priceDeltaMinor
        );
    }

    if (border?.priceDeltaMinor) {
        unitPrice += calculatePercentage(
            baseAfterDiscount,
            border.priceDeltaMinor
        );
    }

    // ------------------------------
    // 5️⃣ Flat add-ons (per unit)
    // ------------------------------

    if (size?.price) {
        unitPrice += size.price;
    }

    if (mounting?.price) {
        unitPrice += mounting.price;
    }

    if (mat?.price) {
        unitPrice += mat.price;
    }

    // ------------------------------
    // 6️⃣ Quantity multiplication
    // ------------------------------
    const totalPrice = unitPrice * quantity;

    return roundPrice(totalPrice);
}
