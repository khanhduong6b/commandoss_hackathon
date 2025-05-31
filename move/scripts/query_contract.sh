#!/bin/bash

# Query script for SwapManager contract (read-only operations)
# Usage: ./query_contract.sh [PACKAGE_ID] [SWAP_MANAGER_ID]

set -e

if [ $# -lt 2 ]; then
    echo "Usage: $0 [PACKAGE_ID] [SWAP_MANAGER_ID]"
    echo "Example: $0 0x123...abc 0x456...def"
    exit 1
fi

PACKAGE_ID=$1
SWAP_MANAGER_ID=$2

echo "=== SwapManager Contract Query ==="
echo "Package ID: $PACKAGE_ID"
echo "SwapManager ID: $SWAP_MANAGER_ID"
echo ""

# Get swap quotes for different DEXs
echo "=== DEX Swap Quotes for 1 SUI (1,000,000 MIST) ==="
echo ""

echo "1. Turbos DEX Quote:"
sui client call \
    --package $PACKAGE_ID \
    --module swap_manager \
    --function get_swap_quote \
    --args $SWAP_MANAGER_ID 1 1000000 \
    --gas-budget 10000000
echo ""

echo "2. FlowX DEX Quote:"
sui client call \
    --package $PACKAGE_ID \
    --module swap_manager \
    --function get_swap_quote \
    --args $SWAP_MANAGER_ID 2 1000000 \
    --gas-budget 10000000
echo ""

echo "3. Aftermath DEX Quote:"
sui client call \
    --package $PACKAGE_ID \
    --module swap_manager \
    --function get_swap_quote \
    --args $SWAP_MANAGER_ID 3 1000000 \
    --gas-budget 10000000
echo ""

echo "=== Recent Transactions ==="
echo "Getting last 5 swap logs:"
sui client call \
    --package $PACKAGE_ID \
    --module swap_manager \
    --function get_recent_swaps \
    --args $SWAP_MANAGER_ID 5 \
    --gas-budget 10000000
echo ""

echo "Getting last 5 AI command logs:"
sui client call \
    --package $PACKAGE_ID \
    --module swap_manager \
    --function get_ai_logs \
    --args $SWAP_MANAGER_ID 5 \
    --gas-budget 10000000

echo ""
echo "=== Query Complete ===" 