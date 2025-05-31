# SwapManager Contract Testing Guide

Hướng dẫn test contract SwapManager đã deploy trên Sui testnet.

## Yêu cầu

1. **Sui CLI** đã được cài đặt và config
2. **Testnet SUI tokens** trong wallet để test
3. **Package ID, SwapManager Object ID, AdminCap Object ID** từ kết quả deploy

## Cách lấy Object IDs

Sau khi deploy, bạn sẽ thấy output tương tự:
```bash
│ Object Changes                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│ Created Objects:                                                        │
│  ┌──                                                                    │
│  │ ObjectID: 0x123...abc                                               │
│  │ Sender: 0x456...def                                                 │
│  │ Owner: Account Address ( 0x456...def )                              │
│  │ ObjectType: 0x789...ghi::swap_manager::AdminCap                     │
│  │ Version: 1                                                          │
│  │ Digest: xxx                                                         │
│  └──                                                                    │
│  ┌──                                                                    │
│  │ ObjectID: 0xabc...123                                               │
│  │ Sender: 0x456...def                                                 │
│  │ Owner: Shared                                                       │
│  │ ObjectType: 0x789...ghi::swap_manager::SwapManager                  │
│  │ Version: 1                                                          │
│  │ Digest: xxx                                                         │
│  └──                                                                    │
```

- **Package ID**: `0x789...ghi`
- **SwapManager ID**: `0xabc...123` (Shared object)
- **AdminCap ID**: `0x123...abc` (Account owned)

## Scripts Test

### 1. Query Script (Read-only)

Test các function view mà không tốn gas:

```bash
cd move/scripts
chmod +x query_contract.sh
./query_contract.sh [PACKAGE_ID] [SWAP_MANAGER_ID]
```

Ví dụ:
```bash
./query_contract.sh 0x789abc 0xabc123
```

### 2. Full Test Script

Test toàn bộ các function bao gồm transactions:

```bash
chmod +x test_contract.sh
./test_contract.sh [PACKAGE_ID] [SWAP_MANAGER_ID] [ADMIN_CAP_ID]
```

Ví dụ:
```bash
./test_contract.sh 0x789abc 0xabc123 0x123abc
```

## Test Cases Manual

### 1. Test Swap Quote

Kiểm tra giá quote từ các DEX khác nhau:

```bash
# Turbos DEX (fee 30 bps)
sui client call \
    --package [PACKAGE_ID] \
    --module swap_manager \
    --function get_swap_quote \
    --args [SWAP_MANAGER_ID] 1 1000000 \
    --gas-budget 10000000

# FlowX DEX (fee 25 bps) 
sui client call \
    --package [PACKAGE_ID] \
    --module swap_manager \
    --function get_swap_quote \
    --args [SWAP_MANAGER_ID] 2 1000000 \
    --gas-budget 10000000

# Aftermath DEX (fee 20 bps)
sui client call \
    --package [PACKAGE_ID] \
    --module swap_manager \
    --function get_swap_quote \
    --args [SWAP_MANAGER_ID] 3 1000000 \
    --gas-budget 10000000
```

**Expected Results:**
- Turbos: 997,000 MIST (3,000 fee)
- FlowX: 997,500 MIST (2,500 fee)  
- Aftermath: 998,000 MIST (2,000 fee)

### 2. Test AI Command Logging

```bash
sui client call \
    --package [PACKAGE_ID] \
    --module swap_manager \
    --function log_ai_command \
    --args [SWAP_MANAGER_ID] '"swap 100 SUI to USDC"' true '[1,2,3,4]' 0x6 \
    --gas-budget 10000000
```

### 3. Test SUI Swap

**⚠️ Chú ý**: Test này sẽ sử dụng SUI thật từ wallet của bạn!

```bash
# Lấy gas coin ID
sui client gas

# Thực hiện swap (thay GAS_COIN_ID)
sui client call \
    --package [PACKAGE_ID] \
    --module swap_manager \
    --function swap_sui \
    --args [SWAP_MANAGER_ID] [GAS_COIN_ID] 3 990000 0x6 \
    --gas-budget 50000000
```

### 4. Test Admin Functions

Chỉ account deploy mới có quyền admin:

```bash
# Update DEX config
sui client call \
    --package [PACKAGE_ID] \
    --module swap_manager \
    --function update_dex_config \
    --args [ADMIN_CAP_ID] [SWAP_MANAGER_ID] 1 true 35 \
    --gas-budget 10000000

# Register new DEX
sui client call \
    --package [PACKAGE_ID] \
    --module swap_manager \
    --function register_dex \
    --args [ADMIN_CAP_ID] [SWAP_MANAGER_ID] 4 '"TestDEX"' 40 \
    --gas-budget 10000000
```

### 5. View Transaction Logs

```bash
# Recent swaps
sui client call \
    --package [PACKAGE_ID] \
    --module swap_manager \
    --function get_recent_swaps \
    --args [SWAP_MANAGER_ID] 5 \
    --gas-budget 10000000

# AI command logs  
sui client call \
    --package [PACKAGE_ID] \
    --module swap_manager \
    --function get_ai_logs \
    --args [SWAP_MANAGER_ID] 5 \
    --gas-budget 10000000
```

## Debug & Troubleshooting

### Common Errors

1. **EInvalidDEX (code 1)**: DEX ID không hợp lệ (chỉ hỗ trợ 1,2,3)
2. **ESlippageTooHigh (code 2)**: min_amount_out quá cao
3. **EInvalidAmount (code 3)**: Amount = 0
4. **EDEXNotRegistered (code 4)**: DEX không được enable

### Check Transaction Status

```bash
# Xem transaction details
sui client call --help

# Check objects
sui client objects

# View transaction on explorer
https://suiexplorer.com/txblock/[TX_DIGEST]?network=testnet
```

### Setup Testnet Environment

```bash
# Switch to testnet
sui client switch --env testnet

# Get testnet faucet
curl --location --request POST 'https://faucet.testnet.sui.io/gas' \
--header 'Content-Type: application/json' \
--data-raw '{"FixedAmountRequest":{"recipient":"[YOUR_ADDRESS]"}}'

# Check balance
sui client balance
```

## Expected Behavior

1. **DEX Quotes**: Aftermath có rate tốt nhất (fee thấp nhất 20bps)
2. **Swap Function**: Trả về coin với amount = input - fee
3. **Logging**: Events được emit và logs được lưu trong contract
4. **Admin Functions**: Chỉ admin mới có thể update config và add DEX mới

## Next Steps

Sau khi test thành công, bạn có thể:
1. Tích hợp với frontend/dapp
2. Connect với real DEX protocols  
3. Add more token types
4. Implement advanced routing logic 