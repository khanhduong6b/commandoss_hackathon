# SwapManager API Documentation

Complete API documentation để tương tác với SwapManager smart contract qua backend.

## 🔧 Setup

### **Environment Variables**
```bash
SWAP_PACKAGE_ID=0x44663d3c38241f2b61596d11b036d4611ce1fa03b6691be1e58e3e69652a99ea
SWAP_MANAGER_ID=0x1f3e1b6760caed75d98cec99d6c3cd854603cf5032a658eb02412615701e44bf
ADMIN_CAP_ID=0x... # Optional for admin functions
```

### **Import Routes**
```javascript
import swapRoutes from './route/onchain/swapRoutes.js';
app.use('http://localhost:3000/v1/swap', swapRoutes);
```

---

## 📊 Quote APIs

### **1. Get SUI to USDC Quote**
```http
GET http://localhost:3000/v1/swap/quote/sui-to-usdc?amount=1.5
```

**Parameters:**
- `amount`: Amount of SUI to swap (human readable, e.g., "1.5")

**Response:**
```json
{
  "input_amount": "1.5",
  "input_token": "SUI", 
  "output_amount": 5.244375,
  "output_token": "USDC",
  "rate": 3.4958333333333336,
  "raw_output": "5244375"
}
```

### **2. Get USDC to SUI Quote**
```http
GET http://localhost:3000/v1/swap/quote/usdc-to-sui?amount=5.0
```

**Parameters:**
- `amount`: Amount of USDC to swap (human readable, e.g., "5.0")

**Response:**
```json
{
  "input_amount": "5.0",
  "input_token": "USDC",
  "output_amount": 1.4267855,
  "output_token": "SUI", 
  "rate": 0.28535714,
  "raw_output": "1426785500"
}
```

---

## 🏊 Pool Information APIs

### **3. Get Available Trading Pairs**
```http
GET http://localhost:3000/v1/swap/pools
```

**Response:**
```json
{
  "available_pairs": ["SUI_USDC"],
  "total_pairs": 1
}
```

### **4. Get Pool Configuration**
```http
GET http://localhost:3000/v1/swap/pool/config?pair_name=SUI_USDC
```

**Parameters:**
- `pair_name`: Trading pair name (e.g., "SUI_USDC")

**Response:**
```json
{
  "pair_name": "SUI_USDC",
  "config": {
    "pair_name": "SUI_USDC",
    "dex_id": 4,
    "pool_object_id": "0x2e041f3fd93646dcc877f783c1f2b7fa62d30271bdef1f21ef002cebf857bded",
    "enabled": true,
    "fee_tier": 500
  }
}
```

### **5. Get DEX Configuration**
```http
GET http://localhost:3000/v1/swap/dex/config?dex_id=4
```

**Parameters:**
- `dex_id`: DEX ID (1=Turbos, 2=FlowX, 3=Aftermath, 4=Cetus)

**Response:**
```json
{
  "dex_id": 4,
  "dex_name": "Cetus",
  "config": {
    "name": "Cetus",
    "enabled": true,
    "fee_bps": 15,
    "total_volume": 12345678,
    "package_id": "0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb"
  }
}
```

---

## 💱 Transaction APIs

### **6. Prepare SUI to USDC Swap**
```http
POST http://localhost:3000/v1/swap/prepare/sui-to-usdc
Content-Type: application/json

{
  "amount": 1.5,
  "slippage": 0.01,
  "user_address": "0xa0b378174a39ad78ee6b7ec479ca8db658a99bf94f3db3891dc01531f4da2f82"
}
```

**Response:**
```json
{
  "transaction_data": "AAACAAgQJrI+jckQaWVm...", // Serialized transaction
  "expected_output": 5.244375,
  "min_output": 5.1919625, // With 1% slippage
  "slippage": 0.01,
  "gas_estimate": {
    "computationCost": "1000000",
    "storageCost": "2000000", 
    "storageRebate": "500000"
  },
  "selected_coin": "0x46550b9b21cd43394fbd3c656dd7257af041b0107df7f6bfcb75aa45d4618a6"
}
```

### **7. Prepare USDC to SUI Swap**
```http
POST http://localhost:3000/v1/swap/prepare/usdc-to-sui
Content-Type: application/json

{
  "amount": 5.0,
  "slippage": 0.01,
  "user_address": "0xa0b378174a39ad78ee6b7ec479ca8db658a99bf94f3db3891dc01531f4da2f82"
}
```

**Response:**
```json
{
  "transaction_data": "AAACAAgQJrI+jckQaWVm...",
  "expected_output": 1.4267855,
  "min_output": 1.4125176, // With 1% slippage
  "slippage": 0.01,
  "gas_estimate": {
    "computationCost": "1000000",
    "storageCost": "2000000",
    "storageRebate": "500000"
  },
  "selected_coin": "0x123abc456def789ghi..."
}
```

### **8. Submit Signed Transaction**
```http
POST http://localhost:3000/v1/swap/submit
Content-Type: application/json

{
  "signed_transaction": "AAACAAgQJrI+jckQaWVm..." // Signed transaction from frontend
}
```

**Response:**
```json
{
  "transaction_hash": "8x9YzAbc123DefGhi456...",
  "status": "success",
  "events": [
    {
      "type": "SwapExecuted",
      "data": {
        "dex": 4,
        "from_token": "SUI",
        "to_token": "USDC",
        "from_amount": "1500000000",
        "to_amount": "5244375",
        "trader": "0xa0b378174a39ad78ee6b7ec479ca8db658a99bf94f3db3891dc01531f4da2f82"
      }
    }
  ],
  "object_changes": [],
  "gas_used": {
    "computationCost": "1000000",
    "storageCost": "2000000"
  }
}
```

### **9. Get Transaction Status**
```http
GET http://localhost:3000/v1/swap/status/8x9YzAbc123DefGhi456...
```

**Response:**
```json
{
  "transaction_hash": "8x9YzAbc123DefGhi456...",
  "status": "success",
  "timestamp": 1703123456789,
  "events": [...],
  "object_changes": [...],
  "gas_used": {
    "computationCost": "1000000",
    "storageCost": "2000000"
  }
}
```

---

## 👤 User & History APIs

### **10. Get User Token Balances**
```http
GET http://localhost:3000/v1/swap/user/tokens?user_address=0xa0b378174a39ad78ee6b7ec479ca8db658a99bf94f3db3891dc01531f4da2f82
```

**Response:**
```json
{
  "user_address": "0xa0b378174a39ad78ee6b7ec479ca8db658a99bf94f3db3891dc01531f4da2f82",
  "balances": {
    "SUI": {
      "balance": 10.123456789,
      "raw_balance": "10123456789",
      "decimals": 9
    },
    "USDC": {
      "balance": 25.5,
      "raw_balance": "25500000",
      "decimals": 6
    }
  }
}
```

### **11. Get Recent Swap History**
```http
GET http://localhost:3000/v1/swap/history?count=10
```

**Parameters:**
- `count`: Number of recent swaps to retrieve (default: 10)

**Response:**
```json
{
  "recent_swaps": [
    {
      "timestamp": 1703123456789,
      "dex": 4,
      "from_token": "SUI",
      "to_token": "USDC", 
      "from_amount": "1500000000",
      "to_amount": "5244375",
      "trader": "0xa0b378174a39ad78ee6b7ec479ca8db658a99bf94f3db3891dc01531f4da2f82",
      "pool_used": "0x2e041f3fd93646dcc877f783c1f2b7fa62d30271bdef1f21ef002cebf857bded"
    }
  ],
  "count": 10
}
```

### **12. Log AI Command**
```http
POST http://localhost:3000/v1/swap/ai/log
Content-Type: application/json

{
  "command": "swap 1.5 SUI to USDC with 1% slippage",
  "executed": true,
  "result_hash": [],
  "user_address": "0xa0b378174a39ad78ee6b7ec479ca8db658a99bf94f3db3891dc01531f4da2f82"
}
```

**Response:**
```json
{
  "transaction_data": "AAACAAgQJrI+jckQaWVm...",
  "gas_estimate": {
    "computationCost": "500000",
    "storageCost": "1000000"
  },
  "message": "Transaction prepared. User needs to sign and submit."
}
```

---

## 🔄 Complete Swap Flow

### **Frontend Integration Example:**

```javascript
// 1. Get quote
const quoteResponse = await fetch('http://localhost:3000/v1/swap/quote/sui-to-usdc?amount=1.5');
const quote = await quoteResponse.json();

// 2. Prepare transaction
const prepareResponse = await fetch('http://localhost:3000/v1/swap/prepare/sui-to-usdc', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 1.5,
    slippage: 0.01,
    user_address: userWalletAddress
  })
});
const preparedTx = await prepareResponse.json();

// 3. Sign transaction with user wallet (frontend)
const signedTx = await userWallet.signTransaction(preparedTx.transaction_data);

// 4. Submit signed transaction
const submitResponse = await fetch('http://localhost:3000/v1/swap/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    signed_transaction: signedTx
  })
});
const result = await submitResponse.json();

// 5. Check transaction status
const statusResponse = await fetch(`http://localhost:3000/v1/swap/status/${result.transaction_hash}`);
const status = await statusResponse.json();
```

---

## 🔒 Error Handling

### **Common Error Responses:**

```json
// Invalid parameters
{
  "error": "amount and user_address required"
}

// Insufficient balance
{
  "error": "Insufficient balance. Required: 1500000000, Available: 1000000000"
}

// Network errors
{
  "error": "Failed to connect to Sui network"
}

// Contract errors
{
  "error": "Slippage too high. Expected minimum output not met."
}
```

---

## 🚀 Production Deployment

### **Environment Setup:**
1. Set proper `SWAP_PACKAGE_ID` và `SWAP_MANAGER_ID`
2. Configure mainnet RPC endpoints
3. Add rate limiting và authentication
4. Set up monitoring và logging
5. Implement caching for quotes và pool data

### **Security Considerations:**
- Validate all user inputs
- Implement proper rate limiting
- Never store private keys
- Use HTTPS in production
- Monitor for unusual activity

---

## 📊 Testing APIs

### **Using curl:**

```bash
# Get quote
curl "http://localhost:3000http://localhost:3000/v1/swap/quote/sui-to-usdc?amount=1.5"

# Get user tokens
curl "http://localhost:3000http://localhost:3000/v1/swap/user/tokens?user_address=0xa0b378174a39ad78ee6b7ec479ca8db658a99bf94f3db3891dc01531f4da2f82"

# Prepare swap
curl -X POST http://localhost:3000http://localhost:3000/v1/swap/prepare/sui-to-usdc \
  -H "Content-Type: application/json" \
  -d '{"amount":1.5,"slippage":0.01,"user_address":"0xa0b378174a39ad78ee6b7ec479ca8db658a99bf94f3db3891dc01531f4da2f82"}'
```

---

Các APIs này provide complete integration với SwapManager smart contract, supporting tất cả các features từ quotes đến transaction execution và history tracking! 