const { ethers } = require("ethers");

// Minimal ABI for Chainlink AggregatorV3Interface
const AGGREGATOR_V3_ABI = [
  "function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)"
];

class PriceFeed {
  /**
   * @param {ethers.Provider} provider - Ethereum provider
   * @param {string} ethUsdFeedAddress - Address of ETH/USD Chainlink feed
   * @param {string} nftFloorFeedAddress - Address of NFT floor price feed (same interface)
   */
  constructor(provider, ethUsdFeedAddress, nftFloorFeedAddress) {
    if (!provider) throw new Error("Provider is required");
    if (!ethUsdFeedAddress || !ethers.isAddress(ethUsdFeedAddress)) throw new Error("Invalid ETH/USD feed address");
    if (!nftFloorFeedAddress || !ethers.isAddress(nftFloorFeedAddress)) throw new Error("Invalid NFT floor feed address");
    
    this.provider = provider;
    this.ethUsdFeed = new ethers.Contract(ethUsdFeedAddress, AGGREGATOR_V3_ABI, provider);
    this.nftFloorFeed = new ethers.Contract(nftFloorFeedAddress, AGGREGATOR_V3_ABI, provider);
  }

  /**
   * Fetches latest ETH/USD price from Chainlink
   * @returns {Promise<bigint>} Price in wei equivalent (8 decimals)
   */
  async getEthUsdPrice() {
    try {
      const roundData = await this.ethUsdFeed.latestRoundData();
      // Check if round is valid (answeredInRound > 0)
      if (roundData.answeredInRound === 0) {
        throw new Error("Invalid round data for ETH/USD feed");
      }
      return roundData.answer; // int256 with 8 decimals
    } catch (error) {
      throw new Error(`Failed to fetch ETH/USD price: ${error.message}`);
    }
  }

  /**
   * Fetches latest NFT floor price from custom adapter
   * @returns {Promise<bigint>} Price in wei equivalent (8 decimals)
   */
  async getNftFloorPrice() {
    try {
      const roundData = await this.nftFloorFeed.latestRoundData();
      // Check if round is valid (answeredInRound > 0)
      if (roundData.answeredInRound === 0) {
        throw new Error("Invalid round data for NFT floor feed");
      }
      return roundData.answer; // int256 with 8 decimals
    } catch (error) {
      throw new Error(`Failed to fetch NFT floor price: ${error.message}`);
    }
  }
}

module.exports = { PriceFeed };