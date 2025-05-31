#!/bin/bash

# Test script for SwapManager contract on testnet
# Usage: ./test_contract.sh [PACKAGE_ID] [SWAP_MANAGER_ID] [ADMIN_CAP_ID]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if required parameters are provided
if [ $# -lt 3 ]; then
    print_error "Usage: $0 [PACKAGE_ID] [SWAP_MANAGER_ID] [ADMIN_CAP_ID]"
    print_warning "Example: $0 0x123...abc 0x456...def 0x789...ghi"
    exit 1
fi

PACKAGE_ID=$1
SWAP_MANAGER_ID=$2
ADMIN_CAP_ID=$3

print_status "Starting contract tests on testnet..."
print_status "Package ID: $PACKAGE_ID"
print_status "SwapManager ID: $SWAP_MANAGER_ID"
print_status "AdminCap ID: $ADMIN_CAP_ID"

# Test 1: Check DEX configurations
print_status "\n=== Test 1: Check DEX Configurations ==="
echo "Testing Turbos DEX (ID: 1)..."
sui client call \
    --package $PACKAGE_ID \
    --module swap_manager \
    --function get_swap_quote \
    --args $SWAP_MANAGER_ID 1 1000000 \
    --gas-budget 10000000

echo "Testing FlowX DEX (ID: 2)..."
sui client call \
    --package $PACKAGE_ID \
    --module swap_manager \
    --function get_swap_quote \
    --args $SWAP_MANAGER_ID 2 1000000 \
    --gas-budget 10000000

echo "Testing Aftermath DEX (ID: 3)..."
sui client call \
    --package $PACKAGE_ID \
    --module swap_manager \
    --function get_swap_quote \
    --args $SWAP_MANAGER_ID 3 1000000 \
    --gas-budget 10000000

print_success "DEX configuration tests completed!"

# Test 2: Log AI Command
print_status "\n=== Test 2: Log AI Command ==="
sui client call \
    --package $PACKAGE_ID \
    --module swap_manager \
    --function log_ai_command \
    --args $SWAP_MANAGER_ID '"swap 100 SUI to USDC"' true '[1,2,3,4]' 0x6 \
    --gas-budget 10000000

print_success "AI command logging test completed!"

# Test 3: Perform SUI Swap
print_status "\n=== Test 3: Perform SUI Swap ==="
print_warning "This will use real SUI tokens from your wallet!"
read -p "Continue with swap test? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Get gas coin for swap
    GAS_COIN=$(sui client gas --json | jq -r '.[] | select(.mistBalance > 100000000) | .gasCoinId' | head -n 1)
    
    if [ -z "$GAS_COIN" ]; then
        print_error "No suitable gas coin found. Need at least 0.1 SUI."
        exit 1
    fi
    
    print_status "Using gas coin: $GAS_COIN"
    print_status "Performing swap on Aftermath DEX (best rate)..."
    
    sui client call \
        --package $PACKAGE_ID \
        --module swap_manager \
        --function swap_sui \
        --args $SWAP_MANAGER_ID $GAS_COIN 3 990000 0x6 \
        --gas-budget 50000000

    print_success "SUI swap test completed!"
else
    print_warning "Skipping swap test."
fi

# Test 4: Admin Functions (if you have admin access)
print_status "\n=== Test 4: Admin Functions ==="
read -p "Do you want to test admin functions? (requires admin privileges) (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Testing DEX config update..."
    sui client call \
        --package $PACKAGE_ID \
        --module swap_manager \
        --function update_dex_config \
        --args $ADMIN_CAP_ID $SWAP_MANAGER_ID 1 true 35 \
        --gas-budget 10000000

    print_status "Testing new DEX registration..."
    sui client call \
        --package $PACKAGE_ID \
        --module swap_manager \
        --function register_dex \
        --args $ADMIN_CAP_ID $SWAP_MANAGER_ID 4 '"TestDEX"' 40 \
        --gas-budget 10000000

    print_success "Admin function tests completed!"
else
    print_warning "Skipping admin tests."
fi

# Test 5: View Functions
print_status "\n=== Test 5: View Functions ==="
print_status "Getting recent swap logs..."
sui client call \
    --package $PACKAGE_ID \
    --module swap_manager \
    --function get_recent_swaps \
    --args $SWAP_MANAGER_ID 5 \
    --gas-budget 10000000

print_status "Getting AI command logs..."
sui client call \
    --package $PACKAGE_ID \
    --module swap_manager \
    --function get_ai_logs \
    --args $SWAP_MANAGER_ID 5 \
    --gas-budget 10000000

print_success "View function tests completed!"

print_success "\n=== All Tests Completed! ==="
print_status "Check the transaction results above for detailed outputs."
print_status "You can also view transactions on Sui Explorer: https://suiexplorer.com/" 