# AI Web3 Portfolio Assistant - Client Interface

## 🎨 Modern UI for Sui Network DEX Trading

This is the frontend interface for the AI Web3 Portfolio Assistant, providing a modern and intuitive way to interact with the Sui blockchain for trading and portfolio management.

## ✨ Features

### 🔗 Wallet Integration
- **Sui Wallet Connection**: Seamless integration with Sui wallets
- **Real-time Balance**: Live token balance and portfolio value tracking
- **Object Display**: View all owned Sui objects with detailed information

### 💱 Token Swap Interface
- **Bidirectional Trading**: SUI ↔ USDC swaps with live quotes
- **Real-time Pricing**: Dynamic price quotes with slippage calculations
- **DEX Integration**: Support for multiple DEXs (Turbos, FlowX, Aftermath)
- **Transaction Tracking**: Monitor swap progress and confirmations

### 📊 Pool Information
- **DEX Configuration**: View status and settings of different DEXs
- **Liquidity Pools**: Browse available trading pairs with APY data
- **Volume Analytics**: 24h trading volume and liquidity metrics

### 👤 Portfolio Management
- **Token Holdings**: Comprehensive view of all token balances
- **USD Valuation**: Real-time USD value calculation
- **Portfolio Summary**: Total portfolio value with asset breakdown

### 📈 Transaction History
- **Swap History**: Complete record of all swap transactions
- **Status Tracking**: Real-time transaction status monitoring
- **Hash Search**: Look up specific transactions by hash
- **Detailed Analytics**: Gas usage, confirmations, and timestamps

### 🤖 AI Assistant
- **Natural Language Commands**: "swap 10 SUI to USDC", "analyze my portfolio"
- **Smart Recommendations**: AI-powered trading suggestions
- **Command History**: Track and review previous AI interactions
- **Example Commands**: Pre-built command templates for easy use

## 🎨 Design System

### Color Scheme
- **Light Theme**: Clean, bright interface with high contrast
- **Blue Accent**: Professional blue color scheme (#0066CC)
- **Semantic Colors**: Green for success, orange for warnings, red for errors

### Components
- **Modern Cards**: Elevated cards with subtle shadows
- **Responsive Layout**: Adapts to different screen sizes
- **Smooth Animations**: CSS transitions and loading spinners
- **Accessibility**: WCAG compliant with proper focus indicators

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm package manager
- Sui wallet browser extension

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

### Development Server
The client runs on `http://localhost:5173` and automatically proxies API calls to the backend server at `http://localhost:3000`.

## 🏗️ Project Structure

```
client/
├── src/
│   ├── components/           # UI Components
│   │   ├── SwapInterface.tsx    # Token swap functionality
│   │   ├── PoolInfo.tsx         # DEX and pool information
│   │   ├── UserTokens.tsx       # Portfolio and token balances
│   │   ├── TransactionHistory.tsx # Transaction tracking
│   │   └── AICommand.tsx        # AI assistant interface
│   ├── App.tsx              # Main application component
│   ├── WalletStatus.tsx     # Wallet connection status
│   ├── OwnedObjects.tsx     # Sui objects display
│   ├── main.tsx            # Application entry point
│   ├── index.css           # Global styles and animations
│   └── networkConfig.ts    # Sui network configuration
├── package.json
├── vite.config.mts         # Vite configuration with API proxy
└── tsconfig.json
```

## 🔧 Configuration

### API Proxy
The Vite development server is configured to proxy API calls to the backend:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\http://localhost:3000/v1/, '')
    }
  }
}
```

### Theme Configuration
The application uses Radix UI themes with light appearance:

```typescript
<Theme appearance="light" accentColor="blue" radius="medium">
```

## 📱 Responsive Design

The interface is fully responsive and works across:
- **Desktop**: Full feature set with optimal layout
- **Tablet**: Adapted layout with touch-friendly controls
- **Mobile**: Streamlined interface for mobile trading

## 🔐 Security Features

- **Wallet Validation**: Ensures wallet connection before sensitive operations
- **Transaction Confirmation**: Clear confirmation dialogs for all transactions
- **Error Handling**: Comprehensive error messages and recovery options
- **Input Validation**: Client-side validation for all user inputs

## 🎯 User Experience

### Navigation
- **Tab-based Interface**: Easy switching between different features
- **Contextual Actions**: Relevant buttons and controls based on current state
- **Status Indicators**: Clear visual feedback for all operations

### Performance
- **Lazy Loading**: Components load on demand
- **Debounced Requests**: Optimized API calls for real-time data
- **Caching**: Smart caching of static data and user preferences

## 🛠️ Development

### Code Style
- **TypeScript**: Full type safety throughout the application
- **ESLint**: Consistent code formatting and best practices
- **Prettier**: Automated code formatting

### Component Architecture
- **Functional Components**: Modern React hooks-based components
- **Custom Hooks**: Reusable logic for API calls and state management
- **Type Safety**: Comprehensive TypeScript interfaces for all data

## 📦 Dependencies

### Core Dependencies
- **React 18**: Modern React with concurrent features
- **@mysten/dapp-kit**: Sui blockchain integration
- **@radix-ui/themes**: Design system and components
- **@tanstack/react-query**: Data fetching and caching

### Development Dependencies
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety and developer experience
- **ESLint**: Code quality and consistency

## 🚀 Deployment

### Production Build
```bash
pnpm build
```

### Environment Variables
Create `.env` file for environment-specific configuration:
```env
VITE_API_BASE_URL=https://your-api-domain.com
VITE_SUI_NETWORK=mainnet
```

## 🤝 Contributing

1. **Fork the Repository**
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Commit Changes**: `git commit -m 'Add amazing feature'`
4. **Push to Branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

## 📞 Support

For questions and support:
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check the main project README
- **Community**: Join our Discord/Telegram for discussions

---

Built with ❤️ for the Sui ecosystem 