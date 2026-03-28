import { connectWallet, disconnectWallet, getAccount } from './walletConnect.js';

const API_BASE = 'http://localhost:3000/api';

let currentAccount = null;
let provider = null;
let signer = null;

// DOM Elements
const connectButton = document.getElementById('connectWallet');
const disconnectButton = document.getElementById('disconnectWallet');
const addressDisplay = document.getElementById('userAddress');
const vaultStatsContainer = document.getElementById('vaultStats');
const userPositionContainer = document.getElementById('userPosition');
const actionButtons = {
  deposit: document.getElementById('btnDeposit'),
  fractionalize: document.getElementById('btnFractionalize'),
  rent: document.getElementById('btnRent'),
  lend: document.getElementById('btnLend'),
  withdraw: document.getElementById('btnWithdraw'),
  bridge: document.getElementById('btnBridge')
};

// Initialize the app
async function init() {
  // Check if already connected
  const account = await getAccount();
  if (account) {
    await handleWalletConnected(account);
  }

  // Event listeners
  connectButton.addEventListener('click', handleConnectClick);
  disconnectButton.addEventListener('click', handleDisconnectClick);
  
  // Action button listeners  actionButtons.deposit.addEventListener('click', handleDeposit);
  actionButtons.fractionalize.addEventListener('click', handleFractionalize);
  actionButtons.rent.addEventListener('click', handleRent);
  actionButtons.lend.addEventListener('click', handleLend);
  actionButtons.withdraw.addEventListener('click', handleWithdraw);
  actionButtons.bridge.addEventListener('click', handleBridge);
}

// Handle wallet connection
async function handleConnectClick() {
  try {
    const { account, provider: prov, signer: sign } = await connectWallet();
    currentAccount = account;
    provider = prov;
    signer = sign;
    await handleWalletConnected(account);
  } catch (error) {
    console.error('Wallet connection failed:', error);
    alert('Wallet connection failed. Please try again.');
  }
}

// Handle wallet disconnection
async function handleDisconnectClick() {
  try {
    await disconnectWallet();
    currentAccount = null;
    provider = null;
    signer = null;
    handleWalletDisconnected();
  } catch (error) {
    console.error('Wallet disconnection failed:', error);
  }
}

// Update UI when wallet is connected
async function handleWalletConnected(account) {
  connectButton.classList.add('hidden');
  disconnectButton.classList.remove('hidden');
  addressDisplay.textContent = account;
  addressDisplay.classList.remove('hidden');
  
  // Fetch and display data
  await fetchVaultStats();
  await fetchUserPosition();
  
  // Enable action buttons
  Object.values(actionButtons).forEach(btn => btn.disabled = false);
}

// Update UI when wallet is disconnected
function handleWalletDisconnected() {
  connectButton.classList.remove('hidden');
  disconnectButton.classList.add('hidden');
  addressDisplay.classList.add('hidden');
  addressDisplay.textContent = '';
  vaultStatsContainer.innerHTML = '<p>Connect wallet to view vault stats</p>';
  userPositionContainer.innerHTML = '<p>Connect wallet to view your position</p>';
  
  // Disable action buttons
  Object.values(actionButtons).forEach(btn => btn.disabled = true);
}

// Fetch vault stats from API
async function fetchVaultStats() {
  try {
    const response = await fetch(`${API_BASE}/vault/stats`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const stats = await response.json();
    
    vaultStatsContainer.innerHTML = `
      <div class="stat-card">
        <h3>Vault Statistics</h3>
        <p><strong>Total Value Locked:</strong> $${stats.tvl.toLocaleString()}</p>
        <p><strong>Total Shares:</strong> ${stats.totalShares.toLocaleString()}</p>
        <p><strong>APY:</strong> ${stats.apy.toFixed(2)}%</p>
        <p><strong>Deposits (24h):</strong> ${stats.deposits24h.toLocaleString()}</p>
      </div>
    `;
  } catch (error) {
    console.error('Failed to fetch vault stats:', error);
    vaultStatsContainer.innerHTML = '<p class="error">Failed to load vault stats. Please try again later.</p>';
  }
}

// Fetch user position from API
async function fetchUserPosition() {
  if (!currentAccount) return;
  
  try {
    const response = await fetch(`${API_BASE}/user/position/${currentAccount}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const position = await response.json();
    
    userPositionContainer.innerHTML = `
      <div class="position-card">
        <h3>Your Position</h3>
        <p><strong>Share Balance:</strong> ${position.shareBalance.toLocaleString()}</p>
        <p><strong>NFTs Deposited:</strong> ${position.nftCount}</p>
        <p><strong>Value:</strong> $${position.value.toLocaleString()}</p>
        <p><strong>Accrued Yield:</strong> $${position.accruedYield.toLocaleString()}</p>
      </div>
    `;
  } catch (error) {
    console.error('Failed to fetch user position:', error);
    userPositionContainer.innerHTML = '<p class="error">Failed to load your position. Please try again later.</p>';
  }
}

// Action handlers (placeholders that would interact with contracts via API)
async function handleDeposit() {
  alert('Deposit functionality would interact with the Vault contract via API. Not implemented in this MVP.');
}

async function handleFractionalize() {
  alert('Fractionalize functionality would interact with the Fractionalizer module via API. Not implemented in this MVP.');
}

async function handleRent() {
  alert('Rent functionality would interact with the RentalManager module via API. Not implemented in this MVP.');
}

async function handleLend() {
  alert('Lend functionality would interact with the LendingPool module via API. Not implemented in this MVP.');
}

async function handleWithdraw() {
  alert('Withdraw functionality would interact with the Vault contract via API. Not implemented in this MVP.');
}

async function handleBridge() {
  alert('Bridge functionality would interact with the BridgeAdapter via API. Not implemented in this MVP.');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);