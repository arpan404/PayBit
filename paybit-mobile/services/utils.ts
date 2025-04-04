function rateConversion(bitcoinAmount: number, currencyAmount: "USD" | "EUR"): number {
    const rate = currencyAmount === "USD" ? 1 : 0.9;
    return bitcoinAmount * rate;
}
export { rateConversion };