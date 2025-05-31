#!/bin/bash

# Build the Move package
echo "Building Move package..."
sui move build

# Deploy to devnet
echo "Deploying to devnet..."
sui client publish --gas-budget 100000000

echo "Deployment complete!"
echo "Please save the Package ID and Object IDs from the output above." 