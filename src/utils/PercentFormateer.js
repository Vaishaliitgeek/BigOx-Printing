export const getDeltaAmount = (basePrice, percent) => {

    // console.log("----basePrice-", basePrice, percent)
    const base = Number(basePrice) || 0;
    const p = Number(percent) || 0;
    if (p == 0) {
        return 0
    }

    const delta = (base * p) / 100;
    // const result = base + delta;

    return delta; // 2 decimal rounding
};

