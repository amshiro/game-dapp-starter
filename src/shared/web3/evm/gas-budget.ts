/** Legacy EVM fees in raw integer units. Round each 5% margin upward, never use floats. */
export function bufferedGasFees(estimatedGas: bigint, currentGasPrice: bigint) {
  if (estimatedGas <= BigInt(0) || currentGasPrice <= BigInt(0))
    throw new Error("Invalid gas estimate");
  const increase = (value: bigint) =>
    (value * BigInt(105) + BigInt(99)) / BigInt(100);
  const gas = increase(estimatedGas);
  const gasPrice = increase(currentGasPrice);
  return { gas, gasPrice, budget: gas * gasPrice };
}
