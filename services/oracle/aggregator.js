/**
 * Aggregator for computing median price from multiple data sources
 */
class Aggregator {
  /**
   * Compute median of an array of numbers
   * @param {number[]} prices - Array of price values
   * @returns {number} Median price
   */
  static median(prices) {
    if (prices.length === 0) throw new Error('No prices provided');
    
    const sorted = [...prices].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
  }

  /**
   * Compute weighted median based on source reliability
   * @param {Array<{price: number, weight: number}>} weightedPrices - Prices with weights
   * @returns {number} Weighted median price
   */
  static weightedMedian(weightedPrices) {
    if (weightedPrices.length === 0) throw new Error('No weighted prices provided');
    
    // Sort by price
    const sorted = [...weightedPrices].sort((a, b) => a.price - b.price);
    
    // Calculate total weight
    const totalWeight = sorted.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight === 0) throw new Error('Total weight is zero');
        // Find weighted median
    let cumulativeWeight = 0;
    for (const item of sorted) {
      cumulativeWeight += item.weight;
      if (cumulativeWeight >= totalWeight / 2) {
        return item.price;
      }
    }
    
    // Fallback to last price
    return sorted[sorted.length - 1].price;
  }
}

module.exports = Aggregator;