export function calculatePercentile(
  sortedValues: number[],
  percentile: number,
): number {
  if (sortedValues.length === 0) return 0;
  if (percentile <= 0) return sortedValues[0];
  if (percentile >= 100) return sortedValues[sortedValues.length - 1];

  const index = (percentile / 100) * (sortedValues.length - 1);
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);
  const weight = index - lowerIndex;

  if (lowerIndex === upperIndex) {
    return sortedValues[lowerIndex];
  }

  return (
    sortedValues[lowerIndex] * (1 - weight) + sortedValues[upperIndex] * weight
  );
}

export function calculateStdDev(values: number[], mean: number): number {
  if (values.length <= 1) return 0;
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    values.length;
  return Math.sqrt(variance);
}
