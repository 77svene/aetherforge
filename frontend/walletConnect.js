import { Web3Modal } from "https://cdn.jsdelivr.net/npm/web3modal@1.9.12/dist/web3modal.esm.min.js";
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.7.0/dist/ethers.esm.min.js";

let web3Modal;
let provider;
let signer;
let address;

// Initialize Web3Modalfunction initWeb3Modal() {
  const providerOptions = {
    walletconnect: {
      package: true, // required
      options: {
        infuraId: "YOUR_INFURA_ID" // Get from infura.io      }
    }
  };

  web3Modal = new Web3Modal({
    cacheProvider: true,
    providerOptions,
    disableInjectedProvider: false
  });
}

// Connect wallet
async function connectWallet() {
  try {
    await initWeb3Modal();
    provider = await web3Modal.connect();
    const web3Provider = new ethers.BrowserProvider(provider);
    signer = await web3Provider.getSigner();
    address = await signer.getAddress();
    
    // Update UI
    document.getElementById('walletAddress').textContent = address;
    document.getElementById('walletConnectButton').textContent = 'Connected';
    document.getElementById('walletConnectButton').disabled = true;
    
    // Enable app functionality
    if (window.app) {
      window.app.onWalletConnected(address);
    }
    
    return address;
  } catch (error) {
    console.error("Wallet connection failed:", error);
    throw error;
  }
}

// Disconnect wallet
function disconnectWallet() {
  if (web3Modal.cachedProvider) {
    web3Modal.clearCachedProvider();
  }
  provider = null;
  signer = null;
  address = null;
  
  // Update UI
  document.getElementById('walletAddress').textContent = '';
  document.getElementById('walletConnectButton').textContent = 'Connect Wallet';
  document.getElementById('walletConnectButton').disabled = false;
  
  // Notify app
  if (window.app) {
    window.app.onWalletDisconnected();
  }
}

// Check if wallet is already connected
async function checkWalletConnection() {
  if (!web3Modal) {
    await initWeb3Modal();
  }
  
  if (web3Modal.cachedProvider) {
    try {
      provider = await web3Modal.connect();
      const web3Provider = new ethers.BrowserProvider(provider);
      signer = await web3Provider.getSigner();
      address = await signer.getAddress();
      
      document.getElementById('walletAddress').textContent = address;
      document.getElementById('walletConnectButton').textContent = 'Connected';
      document.getElementById('walletConnectButton').disabled = true;
      
      if (window.app) {
        window.app.onWalletConnected(address);
      }
      
      return address;
    } catch (error) {
      console.error("Failed to restore wallet connection:", error);
      disconnectWallet();
    }
  }
  return null;
}

// Export functions
window.walletConnect = {
  connect: connectWallet,
  disconnect: disconnectWallet,
  check: checkWalletConnection,
  getProvider: () => provider,
  getSigner: () => signer,
  getAddress: () => address
};

// Initialize on load
window.addEventListener('load', () => {
  // Check for existing connection
  walletConnect.check();
  
  // Add event listener to connect button
  const connectBtn = document.getElementById('walletConnectButton');
  if (connectBtn) {
    connectBtn.addEventListener('click', async () => {
      if (connectBtn.textContent === 'Connect Wallet') {
        await walletConnect.connect();
      } else {
        walletConnect.disconnect();
      }
    });
  }
});