# 🚀 AetherForge— The Composable NFT Yield & Liquidity Engine  
**One‑line pitch:** Turn illiquid NFTs into yield‑bearing, cross‑chain composable assets that auto‑compound via fractionalization, renting, lending and automated liquidity rebalancing.  

---  ## 📖 Table of Contents  
- [Problem](#problem)  
- [Solution](#solution)  
- [Architecture](#architecture)  
- [Tech Stack](#tech-stack)  
- [Setup](#setup)  
- [API Endpoints](#api-endpoints)  
- [Demo](#demo)  
- [Team](#team)  
- [License](#license)  

---  ## 🐞 Problem  
The NFTfi market ($12B+) suffers from:  

- **Illiquidity:** NFTs sit idle in wallets, generating no yield.  
- **Fragmentation:** Assets are siloed on individual chains, preventing cross‑chain composability.  
- **Complexity:** Users must manually fractionalize, rent, lend, and manage liquidity across disparate protocols.  

These frictions lock up capital and inhibit the emergence of NFT‑based money markets.  

---  

## 💡 Solution  
AetherForge provides a **modular, ERC‑4626‑compatible Vault** that accepts whole NFTs or NFT‑shares and issues **Nebula** shares representing proportional ownership. Plug‑in modules enable:  | Module | Function |
|--------|----------|
| **Fractionalizer** | Mints ERC‑20 shares from whole NFTs. |
| **RentalManager** | Facilitates time‑bound NFT leasing with escrowed payments. |
| **LendingPool** | Offers over‑collateralized loans against NFT‑shares using Chainlink price feeds. |
| **BridgeAdapter** | Routes assets via LI.FI / Arc / Circle to keep a single vault state across Ethereum, Polygon, and Arbitrum. |

A keeper‑style **Oracle service** updates floor‑price data and triggers automatic rebalancing, while an **Express API** supplies vault stats, user positions, and yield simulations. The React‑like frontend offers one‑click actions for deposit, fractionalize, rent, lend, and withdraw—all verified on‑chain and ready for Sepolia deployment.  

---  

## 🏗️ Architecture  

```
+-------------------+        +-------------------+        +-------------------+
|   Frontend (React) |<------>|   API Server (Node/Express) |<------>|   Oracle Service   |
+-------------------+        +-------------------+        +-------------------+
          ^                         ^                         ^
          |                         |                         |
          |                         |                         |
+-------------------+        +-------------------+        +-------------------+
|   Vault (ERC‑4626) |<------>|   AccessControl   |<------>|   Registry (Modules)|
+-------------------+        +-------------------+        +-------------------+
          |                         |                         |
          |                         |                         |
+-------------------+        +-------------------+        +-------------------+
| Fractionalizer    |        | RentalManager     |        | LendingPool       |
+-------------------+        +-------------------+        +-------------------+
          |                         |                         |
          |                         |                         |
+-------------------+        +-------------------+        +-------------------+
| BridgeAdapter (LI.FI/Arc/Circle)  <----------------------------->  Cross‑Chain State
+-----------------------------------------------------------------------------------+
```

*The Vault core holds NFTs or NFT‑shares; modules plug in via the Registry; the Oracle keeps floor‑prices fresh and triggers rebalancing; the API and frontend expose all actions to users.*  

---  

## 🛠️ Tech Stack  

| Layer | Technology |
|-------|------------|
| Smart Contracts | Solidity ^0.8.20, Hardhat, ERC‑4626 (Vault), OpenZeppelin AccessControl |
| Cross‑Chain | LI.FI, Arc, Circle (via BridgeAdapter) |
| Oracles | Chainlink Price Feeds, custom keeper (Node.js) |
| Backend | Node.js, Express, ethers.js |
| Frontend | React (Vite), Wagmi, WalletConnect, TailwindCSS |
| Testing | Hardhat, Mocha, Chai, Waffle |
| Deployment | hardhat‑deploy, verify‑script, idempotent init scripts |
| CI / Linting | `npm run lint`, `node --check`, `hardhat compile` |
| License | MIT |

**Badges**  

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)  
![Node](https://img.shields.io/badge/Node-%3E%3D18-brightgreen)  
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)  ![Hardhat](https://img.shields.io/badge/Hardhat-Compiled-orange)  
![React](https://img.shields.io/badge/React-Vite-%2361DAFB)  

---  

## ⚙️ Setup  

1. **Clone the repo**  
   ```bash   git clone https://github.com/77svene/aetherforge.git
   cd aetherforge
   ```

2. **Install dependencies**  
   ```bash
   npm install
   ```

3. **Create a `.env` file** (copy from `.env.example` and fill)  
   ```env
   # RPC Endpoints
   ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY   POLYGON_RPC_URL=https://polygon-sepolia.infura.io/v3/YOUR_INFURA_KEY
   ARBITRUM_RPC_URL=https://arbitrum-sepolia.infura.io/v3/YOUR_INFURA_KEY

   # Private key for deployment (never commit!)
   DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY

   # API keys
   LI_FI_API_KEY=your_lifi_key   ARC_API_KEY=your_arc_key
   CIRCLE_API_KEY=your_circle_key

   # Chainlink
   ETH_USD_FEED=0x...   # Sepolia ETH/USD feed address   # Uniswap V3 Router (Sepolia)
   UNISWAP_V3_ROUTER=0x...

   # WETH (Sepolia)
   WETH_ADDRESS=0x...

   # Server
   PORT=3000
   ```

4. **Compile contracts**  
   ```bash
   npx hardhat compile
   ```

5. **Deploy to Sepolia (idempotent)**  
   ```bash
   npx hardhat deploy --network sepolia
   # The deploy script runs link.js, verify.js and initializes state safely.
   ```

6. **Start the backend services**  
   ```bash
   # API server   npm run start:api   # runs services/api/server.js

   # Oracle keeper (price feed updater + rebalancer)
   npm run start:oracle   # runs services/oracle/updateJob.js
   ```

7. **Start the frontend**  
   ```bash
   npm run start:frontend   # runs vite dev server on http://localhost:5173
   ```

8. **Run the test suite**  
   ```bash
   npm test   ```

---  

## 🔌 API Endpoints  

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/vault/stats` | Returns total deposited NFTs, total Nebula supply, current APY, and cross‑chain vault balances. |
| `GET` | `/api/position/:userAddress` | Returns the user’s Nebula share balance, deposited NFTs/shares, active rentals, and outstanding loans. |
| `GET` | `/api/yield/simulate?amount=&days=` | Simulates yield (fees + rebalancing rewards) for a given Nebula amount over a number of days. |
| `POST` | `/api/action/deposit` | (Authenticated) Deposits an NFT or NFT‑share into the Vault; returns tx hash. |
| `POST` | `/api/action/fractionalize` | (Authenticated) Fractionalizes a deposited NFT into ERC‑20 shares. |
| `POST` | `/api/action/rent` | (Authenticated) Lists an NFT/share for rent; creates escrow. |
| `POST` | `/api/action/lend` | (Authenticated) Takes an over‑collateralized loan against Nebula shares. |
| `POST` | `/api/action/withdraw` | (Authenticated) Withdraws underlying assets after burning Nebula shares. |

*All endpoints require a valid JWT signed by the user’s wallet (see `frontend/walletConnect.js` for signature flow).*  

---  ## 🖼️ Demo  ![AetherForge Dashboard](https://via.placeholder.com/1200x600.png?text=AetherForge+Dashboard)  
*Deposit → Fractionalize → Rent → Lend → Withdraw in one click.*  

![Yield Simulation](https://via.placeholder.com/800x400.png?text=Yield+Simulation+Chart)  
*Real‑time APY projection based on current floor prices and rebalancing activity.*  

---  

## 👥 Team  

**Built by VARAKH BUILDER — autonomous AI agent**  

---  

## 📜 License  

MIT © 2026 AetherForge. See [LICENSE](LICENSE) file for details.  ---  

*Ready to unlock NFT liquidity? Deploy, compose, and earn.*