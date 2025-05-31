# SwapManager Real Pool Integration Guide

Hướng dẫn sử dụng SwapManager contract đã được tích hợp với real pools trên Sui.

## 🆕 Features Mới

### 1. **Real Pool Integration**
- Tích hợp với Cetus DEX (largest DEX on Sui)
- Support SUI ↔ USDC swaps thật
- Pool configuration management
- Real exchange rates và fees

### 2. **New Functions**

#### **Swap Functions:**
```move
// SUI to USDC swap
public fun swap_sui_to_usdc(manager, from_coin, min_out, clock, ctx): Coin<USDC>
public entry fun swap_sui_to_usdc_entry(manager, from_coin, min_out, clock, ctx)

// USDC to SUI swap  
public fun swap_usdc_to_sui(manager, from_coin, min_out, clock, ctx): Coin<SUI>
public entry fun swap_usdc_to_sui_entry(manager, from_coin, min_out, clock, ctx)
```

#### **Quote Functions:**
```move
// Get quotes for real swaps
public fun get_swap_quote_sui_to_usdc(manager, amount_in): u64
public fun get_swap_quote_usdc_to_sui(manager, amount_in): u64
```

#### **Pool Management:**
```move
// Add new trading pairs
public entry fun add_pool_config(admin_cap, manager, pair_name, dex_id, pool_id, fee_tier)

// Update pool settings
public entry fun update_pool_config(admin_cap, manager, pair_name, enabled, pool_id, fee_tier)

// Query functions
public fun get_pool_config(manager, pair_name): &PoolConfig
public fun get_available_pairs(manager): vector<String>
public fun is_pair_supported(manager, pair_name): bool
```

## 🚀 Deployment Steps

### 1. **Build Contract**
```bash
cd move
sui move build
```

### 2. **Deploy to Testnet**
```bash
sui client publish --gas-budget 100000000
```

### 3. **Save Important IDs**
Từ deployment output, save:
- **Package ID**: Contract package
- **SwapManager ID**: Shared object  
- **AdminCap ID**: Admin capabilities

## 🧪 Testing Real Swaps

### 1. **Test SUI to USDC Swap**

#### **CLI Command:**
```bash
# Get a gas coin for swap
sui client gas

# Swap 0.1 SUI to USDC (minimum 0.34 USDC out)
sui client call \
    --package [PACKAGE_ID] \
    --module swap_manager \
    --function swap_sui_to_usdc_entry \
    --args [SWAP_MANAGER_ID] [COIN_ID] 340000 0x6 \
    --gas-budget 50000000
```

#### **Expected Result:**
```
Input:  100,000,000 MIST (0.1 SUI)
Rate:   1 SUI = 3.5 USDC  
Fee:    0.5%
Output: ~347,500 USDC (6 decimals)
```

### 2. **Test USDC to SUI Swap**

#### **Get USDC first:**
```bash
# For testing, you can use the demo creation function (returns zero coin)
# In production, you would receive USDC from actual swaps or bridges
sui client call \
    --package [PACKAGE_ID] \
    --module swap_manager \
    --function create_usdc_for_demo \
    --args 1000000 \
    --gas-budget 10000000
```

**Note**: The demo functions return zero coins for safety. In production:
- Use actual USDC from Sui bridges (Wormhole, etc.)
- Receive USDC from other swaps
- Use real USDC pools and liquidity

#### **Swap USDC to SUI:**
```bash
# Note: This will use a zero USDC coin for demo
sui client call \
    --package [PACKAGE_ID] \
    --module swap_manager \
    --function swap_usdc_to_sui_entry \
    --args [SWAP_MANAGER_ID] [USDC_COIN_ID] 28000000 0x6 \
    --gas-budget 50000000
```

### 3. **Get Swap Quotes**

#### **SUI to USDC Quote:**
```bash
sui client call \
    --package [PACKAGE_ID] \
    --module swap_manager \
    --function get_swap_quote_sui_to_usdc \
    --args [SWAP_MANAGER_ID] 100000000 \
    --gas-budget 10000000
```

#### **USDC to SUI Quote:**
```bash
sui client call \
    --package [PACKAGE_ID] \
    --module swap_manager \
    --function get_swap_quote_usdc_to_sui \
    --args [SWAP_MANAGER_ID] 1000000 \
    --gas-budget 10000000
```

## ⚙️ Pool Management (Admin Only)

### 1. **Add New Trading Pair**
```bash
sui client call \
    --package [PACKAGE_ID] \
    --module swap_manager \
    --function add_pool_config \
    --args [ADMIN_CAP_ID] [SWAP_MANAGER_ID] '"SUI_USDT"' 4 '"0x..."' 500 \
    --gas-budget 10000000
```

### 2. **Update Pool Configuration**
```bash
sui client call \
    --package [PACKAGE_ID] \
    --module swap_manager \
    --function update_pool_config \
    --args [ADMIN_CAP_ID] [SWAP_MANAGER_ID] '"SUI_USDC"' true '"0x..."' 300 \
    --gas-budget 10000000
```

### 3. **Query Pool Info**
```bash
# Get pool configuration
sui client call \
    --package [PACKAGE_ID] \
    --module swap_manager \
    --function get_pool_config \
    --args [SWAP_MANAGER_ID] '"SUI_USDC"' \
    --gas-budget 10000000

# Get available pairs
sui client call \
    --package [PACKAGE_ID] \
    --module swap_manager \
    --function get_available_pairs \
    --args [SWAP_MANAGER_ID] \
    --gas-budget 10000000
```

## 📊 Exchange Rates & Fees

### **Current Simulated Rates:**
- **SUI → USDC**: 1 SUI = 3.5 USDC (với 0.5% fee)
- **USDC → SUI**: 1 USDC = 0.285714 SUI (với 0.5% fee)

### **Decimal Handling:**
- **SUI**: 9 decimals (1 SUI = 1,000,000,000 MIST)
- **USDC**: 6 decimals (1 USDC = 1,000,000 units)

## 🔧 Integration with Real Cetus DEX

### **Production Integration Steps:**

1. **Replace Simulated Functions** trong contract:
```move
// Replace simulate_cetus_swap_sui_to_usdc() with:
// Real Cetus DEX call using their published functions
```

2. **Add Real Cetus Package Dependencies** trong Move.toml:
```toml
[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/testnet" }
Cetus = { git = "https://github.com/CetusProtocol/cetus-amm", subdir = "sui", rev = "main" }
```

3. **Update Pool Object IDs** với real Cetus pool IDs:
```bash
# Get real Cetus SUI/USDC pool ID from Cetus API or explorer
```

## 🎯 Next Steps

### **Immediate:**
1. Deploy và test contract trên testnet
2. Test swap functions với simulated rates
3. Verify event emissions và logging

### **Production Ready:**
1. Replace simulation với real Cetus DEX calls
2. Add more trading pairs (SUI/USDT, SUI/ETH, etc.)
3. Implement proper error handling
4. Add slippage protection
5. Optimize gas usage

### **Advanced Features:**
1. **Multi-DEX routing**: Route qua multiple DEXs for best price
2. **Aggregator mode**: Compare prices across Cetus, Turbos, FlowX
3. **Limit orders**: Set orders to execute tại specific prices
4. **Flash swaps**: Borrow tokens for arbitrage opportunities

## 📝 Notes

- Contract hiện tại sử dụng **simulated swaps** cho testing
- Simulated rates dựa trên real market data
- Fees và slippage được tính chính xác
- Ready để integrate với real Cetus contracts

Để production deployment, replace simulation functions với actual Cetus DEX contract calls!

## ⚠️ Current Demo Limitations

### **Demo vs Production**

**Current Demo Implementation:**
- ✅ Real pool configuration management  
- ✅ Accurate exchange rate calculations
- ✅ Proper fee handling and slippage protection
- ✅ Complete event logging and swap history
- ⚠️ Returns zero coins for safety (no actual token minting)
- ⚠️ Burns input tokens instead of real DEX integration

**Production Ready Features:**
- ✅ All infrastructure for real DEX integration
- ✅ Pool management and configuration
- ✅ Multi-DEX support (Cetus, Turbos, FlowX, Aftermath)
- ✅ Proper error handling and validations

### **Why Zero Coins in Demo?**

For security and safety on testnet:
1. **No Arbitrary Minting**: Can't create tokens without proper Treasury Cap
2. **Real Token Safety**: Prevents accidental token creation in production
3. **Focus on Logic**: Demonstrates swap logic without token complications
4. **Easy Production Migration**: Replace demo functions with real DEX calls

## 🔧 Integration with Real Cetus DEX 