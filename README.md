# 🤖 AI Web3 Portfolio Assistant - Sui Network

> **Intelligent Portfolio Management with Multi-DEX Trading powered by MCP (Model Context Protocol)**

## 🌟 Overview

AI Web3 Portfolio Assistant is an intelligent portfolio management application built on **Sui Network**, integrating **Model Context Protocol (MCP)** to enable AI to automatically analyze and execute DeFi transactions safely and efficiently.

### ✨ Key Features

- 🤖 **AI-Powered Automation**: Uses MCP to enable AI autonomous transaction analysis and execution
- 🔄 **Multi-DEX Aggregation**: Integrates with multiple DEXs on Sui (Turbos, FlowX, Aftermath, Cetus)
- 📊 **Real-time Portfolio Analytics**: Real-time portfolio tracking and analysis
- 💬 **Natural Language Trading**: Trade using natural language ("swap 10 SUI to USDC")
- 🔐 **Secure Wallet Integration**: Secure integration with Sui Wallet
- ⚡ **Optimized Routing**: Automatically finds the best route with lowest slippage

## 🏗️ Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │───▶│  Express Server │───▶│  Sui Network    │
│   (Port 5173)   │    │  (Port 3000)    │    │   (Testnet)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └─────────────▶│  MCP Protocol   │◀─────────────┘
                        │  AI Integration │
                        └─────────────────┘
```

### MCP (Model Context Protocol) Integration

**MCP** enables AI agents to interact directly with blockchain safely:

- 🧠 **AI Command Processing**: Parse and validate commands from natural language
- 🔍 **Portfolio Analysis**: Automated performance and risk analysis
- 🎯 **Smart Execution**: Automatically optimize trades with best practices
- 📝 **Transaction Logging**: Log all AI actions for audit purposes

## 🔄 Multi-DEX Integration

### Supported DEXs

| DEX | Fee Rate | Specialization | Status |
|-----|----------|----------------|--------|
| **Turbos Finance** | 0.30% | High liquidity pools | ✅ Active |
| **FlowX Finance** | 0.25% | Optimized routing | ✅ Active |
| **Aftermath Finance** | 0.20% | Low slippage | ✅ Active |
| **Cetus Protocol** | 0.05% | Concentrated liquidity | ✅ Active |

### Smart Routing Algorithm

```
1. Query quotes from all DEXs
2. Calculate optimal route considering:
   - Price impact
   - Gas fees
   - Slippage tolerance
   - Available liquidity
3. Execute on best DEX automatically
```

## 🚀 How It Works

### 1. AI Command Processing
```
User: "swap 10 SUI to USDC"
  ↓
MCP AI Agent:
  - Parse command
  - Validate parameters
  - Check portfolio balance
  - Analyze market conditions
  ↓
Smart Contract Execution
```

### 2. Multi-DEX Quote Aggregation
```
Query Phase:
├── Turbos: 1 SUI = 2.45 USDC (0.3% fee)
├── FlowX:  1 SUI = 2.48 USDC (0.25% fee)
├── Aftermath: 1 SUI = 2.46 USDC (0.2% fee)
└── Cetus:  1 SUI = 2.49 USDC (0.05% fee)

Best Route: Cetus (highest output after fees)
```

### 3. Intelligent Execution
- 🔒 **Pre-execution Validation**
- ⚡ **Gas Optimization**
- 🛡️ **MEV Protection**
- 📊 **Slippage Control**

## 🛠️ Technical Stack

### Frontend
- **React 18** + **TypeScript**
- **Radix UI** for modern components
- **@mysten/dapp-kit** for Sui integration
- **Vite** for fast development

### Backend
- **Node.js** + **Express**
- **@mysten/sui** for blockchain interaction
- **MCP Protocol** for AI integration
- **Move** smart contracts

### Blockchain
- **Sui Network** (Testnet)
- **Move** programming language
- **Custom SwapManager** contract
- **Multi-DEX integrations**

## 🏃‍♂️ Quick Start

### Prerequisites
```bash
node >= 18.0.0
npm >= 8.0.0
Sui Wallet Extension
```

### Installation

1. **Clone Repository**
```bash
git clone <repository-url>
cd commandoss_hackathon
```

2. **Install Dependencies**
```bash
# Server
cd server && npm install

# Client  
cd ../client && npm install
```

3. **Environment Setup**
```bash
# Create server/.env
SWAP_PACKAGE_ID=your_package_id
SWAP_MANAGER_ID=your_manager_id
NETWORK=testnet
```

4. **Start Development**
```bash
# Terminal 1 - Server
cd server && npm start

# Terminal 2 - Client
cd client && npm run dev
```

5. **Access Application**
- Client: http://localhost:5173
- Server: http://localhost:3000

## 📱 User Interface

### Main Features

1. **🔄 Token Swap Interface**
   - Multi-DEX quote comparison
   - Slippage protection
   - Gas estimation

2. **💼 Portfolio Management**
   - Real-time balance tracking
   - Performance analytics
   - Asset allocation

3. **🤖 AI Assistant**
   - Natural language commands
   - Smart recommendations
   - Automated execution

4. **📊 Pool Information**
   - DEX comparison
   - APY tracking
   - Liquidity analysis

5. **📜 Transaction History**
   - Complete trade history
   - Transaction status tracking
   - Performance metrics

## 🤖 AI Command Examples

```bash
# Basic Swaps
"swap 10 SUI to USDC"
"convert half of my USDC to SUI"

# Portfolio Analysis
"analyze my portfolio performance"
"show me the best yield opportunities"

# Advanced Strategies
"rebalance my portfolio to 60% SUI, 40% USDC"
"find pools with highest APY"
"optimize my gas spending"
```

## 🔐 Security Features

- ✅ **Wallet-based Authentication**
- ✅ **Transaction Signing Required**
- ✅ **Slippage Protection**
- ✅ **Gas Limit Controls**
- ✅ **AI Action Logging**
- ✅ **Multi-signature Support**

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Basic swap functionality
- ✅ Multi-DEX integration
- ✅ AI command processing
- ✅ Portfolio tracking

### Phase 2 (Next)
- 🔄 Advanced AI strategies
- 🔄 Yield farming automation
- 🔄 Risk management tools
- 🔄 Social trading features

### Phase 3 (Future)
- 🔄 Cross-chain integration
- 🔄 NFT portfolio management
- 🔄 DAO governance participation
- 🔄 Advanced analytics dashboard

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Sui Foundation** for the amazing blockchain platform
- **Cetus Protocol** for DEX integration
- **Model Context Protocol** for AI capabilities
- **Radix UI** for beautiful components

## 📞 Contact

- **Project**: AI Web3 Portfolio Assistant
- **Network**: Sui Testnet

---

**Built with ❤️ for the Sui Hackathon**
