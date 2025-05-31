#!/bin/bash

# Script kiểm tra setup môi trường để test contract
echo "=== Kiểm tra Setup Môi trường ==="

# Check Sui CLI
echo "1. Checking Sui CLI..."
if command -v sui &> /dev/null; then
    echo "✅ Sui CLI đã được cài đặt"
    sui --version
else
    echo "❌ Sui CLI chưa được cài đặt"
    echo "Hướng dẫn cài đặt: https://docs.sui.io/guides/developer/getting-started/sui-install"
    exit 1
fi

echo ""

# Check active environment  
echo "2. Checking active environment..."
CURRENT_ENV=$(sui client active-env)
echo "Environment hiện tại: $CURRENT_ENV"

if [ "$CURRENT_ENV" != "testnet" ]; then
    echo "⚠️  Bạn không đang ở testnet environment"
    echo "Chạy lệnh: sui client switch --env testnet"
else
    echo "✅ Đang ở testnet environment"
fi

echo ""

# Check active address
echo "3. Checking active address..."
ACTIVE_ADDRESS=$(sui client active-address)
echo "Address hiện tại: $ACTIVE_ADDRESS"

echo ""

# Check balance
echo "4. Checking SUI balance..."
sui client balance

echo ""

# Check gas objects
echo "5. Checking gas objects..."
GAS_COUNT=$(sui client gas --json | jq length)
echo "Số lượng gas objects: $GAS_COUNT"

if [ "$GAS_COUNT" -eq 0 ]; then
    echo "❌ Không có SUI để làm gas"
    echo "Lấy testnet tokens: https://discord.com/channels/916379725201563759/971488439931392130"
else
    echo "✅ Có gas objects để test"
fi

echo ""

# Check for jq (used in test scripts)
echo "6. Checking jq utility..."
if command -v jq &> /dev/null; then
    echo "✅ jq đã được cài đặt"
else
    echo "⚠️  jq chưa được cài đặt (cần cho một số script)"
    echo "Cài đặt jq: https://stedolan.github.io/jq/download/"
fi

echo ""
echo "=== Setup Check Complete ==="
echo ""
echo "Nếu mọi thứ OK, bạn có thể bắt đầu test contract:"
echo "1. Có Package ID, SwapManager ID, AdminCap ID từ deployment"
echo "2. Chạy: ./query_contract.sh [PACKAGE_ID] [SWAP_MANAGER_ID]" 
echo "3. Hoặc: ./test_contract.sh [PACKAGE_ID] [SWAP_MANAGER_ID] [ADMIN_CAP_ID]" 