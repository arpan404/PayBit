/**
 * 
 * @param btc - The amount in BTC to be converted to SAT
 * @throws Will throw an error if the BTC value is negative
 * @description This function converts a given amount in BTC to SAT (Satoshis).
 * 1 BTC = 100,000,000 SAT
 * @returns float - The equivalent amount in SAT
 * @example
 * // Convert 0.001 BTC to SAT
 * const satoshis = convertBTCtoSAT(0.001);
 * console.log(satoshis); // 100000
 */
export default function convertBTCtoSAT(btc: number): number {
  if (btc < 0) {
    throw new Error("BTC value cannot be negative");
  }
  return Math.round(btc * 1e8);
}