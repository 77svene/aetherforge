const express = require('express');
const router = express.Router();

// GET /vault/:id - returns TVL, share price, yield
router.get('/vault/:id', (req, res) => {
  const { id } = req.params;
  // Mock data - in production would fetch from blockchain
  res.json({
    vaultId: id,
    tvl: '1000000000000000000', // 1 ETH in wei
    sharePrice: '1000000000000000', // 0.001 ETH per share
    yield: '0.05', // 5% APY    lastUpdated: new Date().toISOString()
  });
});

// GET /positions/:user - returns user's share balance, rented NFTs, loan positions
router.get('/positions/:user', (req, res) => {
  const { user } = req.params;
  // Mock data - in production would fetch from blockchain
  res.json({
    user,
    shareBalance: '500000000000000000', // 0.5 ETH worth of shares
    rentedNFTs: [
      { nftContract: '0x123...', tokenId: '1', rentStart: '2024-01-01', rentEnd: '2024-02-01', rentAmount: '0.01' }
    ],
    loanPositions: [
      { nftContract: '0x456...', tokenId: '2', loanAmount: '0.5', collateralRatio: '2.0', interestRate: '0.03' }
    ]
  });
});

// POST /simulate-yield - accepts parameters and returns projected APY
router.post('/simulate-yield', (req, res) => {
  const { vaultId, amount, duration } = req.body;
  // Mock calculation - in production would use on-chain data and yield strategies
  const baseApy = 0.05; // 5%
  const durationFactor = duration ? Math.min(duration / 365, 2) : 1; // Cap at 2x for duration > 1 year
  const projectedApy = baseApy * (1 + durationFactor * 0.1); // Simple model
    res.json({
    vaultId,
    amount,
    duration: duration || 365,
    projectedApy: projectedApy.toString(),
    assumptions: {
      baseApy,
      durationFactor,
      note: 'Mock simulation - replace with actual yield strategy calculations'
    }
  });
});

module.exports = router;