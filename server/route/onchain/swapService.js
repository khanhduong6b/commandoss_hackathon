import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { MIST_PER_SUI } from '@mysten/sui/utils';
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

// SwapManager Contract Configuration
const SWAP_CONTRACT = {
    PACKAGE_ID: process.env.SWAP_PACKAGE_ID || '0x44663d3c38241f2b61596d11b036d4611ce1fa03b6691be1e58e3e69652a99ea',
    SWAP_MANAGER_ID: process.env.SWAP_MANAGER_ID || '0x1f3e1b6760caed75d98cec99d6c3cd854603cf5032a658eb02412615701e44bf',
    ADMIN_CAP_ID: process.env.ADMIN_CAP_ID || null,
    MODULE_NAME: 'swap_manager'
};

console.error(SWAP_CONTRACT);

// Create SuiClient
const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

function swapService() {
    const SELF = {
        // Helper function to format amounts
        formatAmount: (amount, decimals = 9) => {
            return Number(amount) / Math.pow(10, decimals);
        },

        // Helper function to parse amounts  
        parseAmount: (amount, decimals = 9) => {
            return Math.floor(Number(amount) * Math.pow(10, decimals));
        },

        // Get user's coin objects
        getUserCoins: async (address, coinType = '0x2::sui::SUI') => {
            try {
                const coins = await suiClient.getCoins({
                    owner: address,
                    coinType: coinType
                });
                return coins.data;
            } catch (error) {
                console.error('Error getting user coins:', error);
                throw error;
            }
        },

        // Select best coin for transaction
        selectCoinForAmount: (coins, requiredAmount) => {
            const sortedCoins = coins.sort((a, b) => Number(b.balance) - Number(a.balance));

            console.error(`Selecting coin for amount: ${requiredAmount}`);
            console.error(`Available coins: ${sortedCoins.map(c => `${c.coinObjectId.slice(0, 8)}:${c.balance}`).join(', ')}`);

            for (const coin of sortedCoins) {
                if (Number(coin.balance) >= requiredAmount) {
                    console.error(`Selected coin: ${coin.coinObjectId} with balance: ${coin.balance}`);
                    return coin;
                }
            }

            const totalBalance = sortedCoins.reduce((sum, coin) => sum + Number(coin.balance), 0);
            throw new Error(`Insufficient balance. Required: ${requiredAmount}, Available: ${totalBalance} (in ${sortedCoins.length} coins)`);
        }
    }

    return {
        // =================== SWAP QUOTE FUNCTIONS ===================

        // Get SUI to USDC swap quote
        getSwapQuoteSuiToUsdc: async (req, res) => {
            try {
                const { amount } = req.query;

                if (!amount || isNaN(amount)) {
                    return res.status(400).json({ error: 'Invalid amount parameter' });
                }

                // Try smart contract call first, fallback to mock if fails
                try {
                    const amountInMist = SELF.parseAmount(amount, 9);

                    const result = await suiClient.devInspectTransactionBlock({
                        transactionBlock: (() => {
                            const tx = new Transaction();
                            tx.moveCall({
                                target: `${SWAP_CONTRACT.PACKAGE_ID}::${SWAP_CONTRACT.MODULE_NAME}::get_swap_quote_sui_to_usdc`,
                                arguments: [
                                    tx.object(SWAP_CONTRACT.SWAP_MANAGER_ID),
                                    tx.pure.u64(amountInMist)
                                ]
                            });
                            return tx;
                        })(),
                        sender: '0x0000000000000000000000000000000000000000000000000000000000000000'
                    });

                    if (result.results && result.results[0]?.returnValues) {
                        const outputAmount = result.results[0].returnValues[0][0];
                        // Parse the raw u64 value from contract response
                        let rawValue;
                        if (Array.isArray(outputAmount)) {
                            // Convert array of bytes to u64
                            rawValue = 0;
                            for (let i = 0; i < outputAmount.length && i < 8; i++) {
                                rawValue += outputAmount[i] * Math.pow(256, i);
                            }
                        } else {
                            rawValue = Number(outputAmount);
                        }

                        const outputInUsdc = SELF.formatAmount(rawValue, 6);

                        res.status(200).json({
                            input_amount: amount,
                            input_token: 'SUI',
                            output_amount: outputInUsdc,
                            output_token: 'USDC',
                            rate: outputInUsdc / amount,
                            raw_output: rawValue
                        });
                    } else {
                        throw new Error('Failed to get quote from contract');
                    }
                } catch (contractError) {
                    console.error('Contract call failed, using mock data:', contractError.message);

                    // Mock response for development
                    const mockRate = 3.5; // 1 SUI = 3.5 USDC (based on contract rate)
                    const fee = 0.005; // 0.5% fee
                    const grossOutput = parseFloat(amount) * mockRate;
                    const outputAmount = (grossOutput * (1 - fee)).toFixed(6);

                    res.status(200).json({
                        input_amount: amount,
                        input_token: 'SUI',
                        output_amount: outputAmount,
                        output_token: 'USDC',
                        rate: outputAmount / amount,
                        raw_output: outputAmount,
                        is_mock: true
                    });
                }

            } catch (error) {
                console.error('Error getting SUI to USDC quote:', error);
                res.status(500).json({ error: error.message });
            }
        },

        // Get USDC to SUI swap quote
        getSwapQuoteUsdcToSui: async (req, res) => {
            try {
                const { amount } = req.query;

                if (!amount || isNaN(amount)) {
                    return res.status(400).json({ error: 'Invalid amount parameter' });
                }

                // Try smart contract call first, fallback to mock if fails
                try {
                    const amountInUsdcUnits = SELF.parseAmount(amount, 6);

                    const result = await suiClient.devInspectTransactionBlock({
                        transactionBlock: (() => {
                            const tx = new Transaction();
                            tx.moveCall({
                                target: `${SWAP_CONTRACT.PACKAGE_ID}::${SWAP_CONTRACT.MODULE_NAME}::get_swap_quote_usdc_to_sui`,
                                arguments: [
                                    tx.object(SWAP_CONTRACT.SWAP_MANAGER_ID),
                                    tx.pure.u64(amountInUsdcUnits)
                                ]
                            });
                            return tx;
                        })(),
                        sender: '0x0000000000000000000000000000000000000000000000000000000000000000'
                    });

                    if (result.results && result.results[0]?.returnValues) {
                        const outputAmount = result.results[0].returnValues[0][0];
                        // Parse the raw u64 value from contract response
                        let rawValue;
                        if (Array.isArray(outputAmount)) {
                            // Convert array of bytes to u64
                            rawValue = 0;
                            for (let i = 0; i < outputAmount.length && i < 8; i++) {
                                rawValue += outputAmount[i] * Math.pow(256, i);
                            }
                        } else {
                            rawValue = Number(outputAmount);
                        }

                        const outputInSui = SELF.formatAmount(rawValue, 9);

                        res.status(200).json({
                            input_amount: amount,
                            input_token: 'USDC',
                            output_amount: outputInSui,
                            output_token: 'SUI',
                            rate: outputInSui / amount,
                            raw_output: rawValue
                        });
                    } else {
                        throw new Error('Failed to get quote from contract');
                    }
                } catch (contractError) {
                    console.error('Contract call failed, using mock data:', contractError.message);

                    // Mock response for development
                    const mockRate = 0.285714285; // 1 USDC = 0.285714285 SUI (based on contract rate)
                    const fee = 0.005; // 0.5% fee
                    const grossOutput = parseFloat(amount) * mockRate;
                    const outputAmount = (grossOutput * (1 - fee)).toFixed(9);

                    res.status(200).json({
                        input_amount: amount,
                        input_token: 'USDC',
                        output_amount: outputAmount,
                        output_token: 'SUI',
                        rate: outputAmount / amount,
                        raw_output: outputAmount,
                        is_mock: true
                    });
                }

            } catch (error) {
                console.error('Error getting USDC to SUI quote:', error);
                res.status(500).json({ error: error.message });
            }
        },

        // =================== POOL INFORMATION FUNCTIONS ===================

        // Get available trading pairs
        getAvailablePairs: async (req, res) => {
            try {
                // Try smart contract call first, fallback to mock if fails
                try {
                    const result = await suiClient.devInspectTransactionBlock({
                        transactionBlock: (() => {
                            const tx = new Transaction();
                            tx.moveCall({
                                target: `${SWAP_CONTRACT.PACKAGE_ID}::${SWAP_CONTRACT.MODULE_NAME}::get_available_pairs`,
                                arguments: [tx.object(SWAP_CONTRACT.SWAP_MANAGER_ID)]
                            });
                            return tx;
                        })(),
                        sender: '0x0000000000000000000000000000000000000000000000000000000000000000'
                    });

                    // Parse the vector<String> result
                    const pairsData = result.results?.[0]?.returnValues?.[0]?.[0];
                    let pairs = [];
                    if (pairsData && Array.isArray(pairsData)) {
                        // Skip the first element (vector length) and parse each string
                        for (let i = 1; i < pairsData.length; i++) {
                            const stringData = pairsData[i];
                            if (Array.isArray(stringData) && stringData.length > 1) {
                                // First element is string length, rest are UTF8 bytes
                                const stringBytes = stringData.slice(1);
                                const pairName = String.fromCharCode(...stringBytes);
                                pairs.push(pairName);
                            }
                        }
                    }

                    res.status(200).json({
                        available_pairs: pairs.length > 0 ? pairs : ['SUI_USDC'],
                        total_pairs: pairs.length > 0 ? pairs.length : 1
                    });

                } catch (contractError) {
                    console.error('Contract call failed, using mock data:', contractError.message);

                    // Mock response for development
                    res.status(200).json({
                        available_pairs: ['SUI_USDC'],
                        total_pairs: 1,
                        is_mock: true
                    });
                }

            } catch (error) {
                console.error('Error getting available pairs:', error);
                res.status(500).json({ error: error.message });
            }
        },

        // Get pool configuration (simplified for demo)
        getPoolConfig: async (req, res) => {
            try {
                const { pair_name } = req.query;

                if (!pair_name) {
                    return res.status(400).json({ error: 'pair_name parameter required' });
                }

                // Since our contract only supports SUI_USDC, return mock config
                if (pair_name === 'SUI_USDC' || pair_name === 'SUI/USDC') {
                    res.status(200).json({
                        pair_name,
                        config: {
                            base_token: 'SUI',
                            quote_token: 'USDC',
                            exchange_rate: 3.5,
                            fee_bps: 50, // 0.5%
                            min_amount: 0.1,
                            max_amount: 1000000
                        }
                    });
                } else {
                    res.status(404).json({ error: 'Pair not supported' });
                }

            } catch (error) {
                console.error('Error getting pool config:', error);
                res.status(500).json({ error: error.message });
            }
        },

        // Get DEX configuration (simplified for demo)
        getDexConfig: async (req, res) => {
            try {
                const { dex_id } = req.query;

                if (!dex_id || isNaN(dex_id)) {
                    return res.status(400).json({ error: 'Valid dex_id parameter required (1-4)' });
                }

                const dexNames = { 1: 'Turbos', 2: 'FlowX', 3: 'Aftermath', 4: 'Cetus' };
                const dexId = parseInt(dex_id);

                // For demo, only Cetus (4) is "supported"
                res.status(200).json({
                    dex_id: dexId,
                    dex_name: dexNames[dexId] || 'Unknown',
                    supported: dexId === 4,
                    config: dexId === 4 ? {
                        fee_tier: '0.05%',
                        liquidity: '1000000',
                        volume_24h: '50000'
                    } : null
                });

            } catch (error) {
                console.error('Error getting DEX config:', error);
                res.status(500).json({ error: error.message });
            }
        },

        // =================== TRANSACTION PREPARATION FUNCTIONS ===================

        // Prepare SUI to USDC swap transaction
        prepareSwapSuiToUsdc: async (req, res) => {
            try {
                const { amount, slippage = 0.01, user_address } = req.body;

                if (!amount || !user_address) {
                    return res.status(400).json({ error: 'amount and user_address required' });
                }

                // Try smart contract call first, fallback to mock if fails
                try {
                    const amountInMist = SELF.parseAmount(amount, 9);

                    // Get quote first
                    const quoteResult = await suiClient.devInspectTransactionBlock({
                        transactionBlock: (() => {
                            const tx = new Transaction();
                            tx.moveCall({
                                target: `${SWAP_CONTRACT.PACKAGE_ID}::${SWAP_CONTRACT.MODULE_NAME}::get_swap_quote_sui_to_usdc`,
                                arguments: [
                                    tx.object(SWAP_CONTRACT.SWAP_MANAGER_ID),
                                    tx.pure.u64(amountInMist)
                                ]
                            });
                            return tx;
                        })(),
                        sender: user_address
                    });

                    const expectedOutput = quoteResult.results?.[0]?.returnValues?.[0]?.[0]?.[0];
                    if (!expectedOutput) {
                        throw new Error('Could not get quote');
                    }

                    const minOutputWithSlippage = Math.floor(expectedOutput * (1 - slippage));

                    // Get user's SUI coins
                    const userCoins = await SELF.getUserCoins(user_address, '0x2::sui::SUI');
                    const selectedCoin = SELF.selectCoinForAmount(userCoins, amountInMist);

                    // Build transaction using the correct function name
                    const tx = new Transaction();
                    const coinVector = tx.makeMoveVec({
                        objects: [tx.object(selectedCoin.coinObjectId)]
                    });

                    tx.moveCall({
                        target: `${SWAP_CONTRACT.PACKAGE_ID}::${SWAP_CONTRACT.MODULE_NAME}::cetus_swap_sui_to_usdc`,
                        arguments: [
                            tx.object(SWAP_CONTRACT.SWAP_MANAGER_ID),
                            coinVector,
                            tx.pure.u64(minOutputWithSlippage),
                            tx.pure.u64(Math.floor(slippage * 10000)), // slippage in BPS
                            tx.object('0x6'), // Clock object
                        ]
                    });

                    res.status(200).json({
                        transaction_data: tx.serialize(),
                        expected_output: SELF.formatAmount(expectedOutput, 6),
                        min_output: SELF.formatAmount(minOutputWithSlippage, 6),
                        slippage: slippage,
                        gas_estimate: 0,
                        selected_coin: selectedCoin.coinObjectId
                    });

                } catch (contractError) {
                    console.error('Contract prepare failed, using mock response:', contractError.message);

                    // Mock response for development
                    const mockRate = 3.5;
                    const fee = 0.005;
                    const grossOutput = parseFloat(amount) * mockRate;
                    const expectedOutput = (grossOutput * (1 - fee)).toFixed(6);
                    const minOutput = (parseFloat(expectedOutput) * (1 - slippage)).toFixed(6);

                    res.status(200).json({
                        transaction_data: "mock_transaction_data",
                        expected_output: expectedOutput,
                        min_output: minOutput,
                        slippage: slippage,
                        gas_estimate: { computationCost: "1000000", storageCost: "100000" },
                        selected_coin: "mock_coin_id",
                        is_mock: true
                    });
                }

            } catch (error) {
                console.error('Error preparing SUI to USDC swap:', error);
                res.status(500).json({ error: error.message });
            }
        },

        // Prepare USDC to SUI swap transaction
        prepareSwapUsdcToSui: async (req, res) => {
            try {
                const { amount, slippage = 0.01, user_address } = req.body;

                if (!amount || !user_address) {
                    return res.status(400).json({ error: 'amount and user_address required' });
                }

                // Try smart contract call first, fallback to mock if fails
                try {
                    const usdcType = `${SWAP_CONTRACT.PACKAGE_ID}::cetus_integration::USDC`;
                    const amountInUsdcUnits = SELF.parseAmount(amount, 6);

                    // Get quote first
                    const quoteResult = await suiClient.devInspectTransactionBlock({
                        transactionBlock: (() => {
                            const tx = new Transaction();
                            tx.moveCall({
                                target: `${SWAP_CONTRACT.PACKAGE_ID}::${SWAP_CONTRACT.MODULE_NAME}::get_swap_quote_usdc_to_sui`,
                                arguments: [
                                    tx.object(SWAP_CONTRACT.SWAP_MANAGER_ID),
                                    tx.pure.u64(amountInUsdcUnits)
                                ]
                            });
                            return tx;
                        })(),
                        sender: user_address
                    });

                    const expectedOutput = quoteResult.results?.[0]?.returnValues?.[0]?.[0]?.[0];
                    if (!expectedOutput) {
                        throw new Error('Could not get quote');
                    }

                    const minOutputWithSlippage = Math.floor(expectedOutput * (1 - slippage));

                    // Get user's USDC coins
                    const userCoins = await SELF.getUserCoins(user_address, usdcType);
                    const selectedCoin = SELF.selectCoinForAmount(userCoins, amountInUsdcUnits);

                    // Build transaction using the correct function name
                    const tx = new Transaction();
                    const coinVector = tx.makeMoveVec({
                        objects: [tx.object(selectedCoin.coinObjectId)]
                    });

                    tx.moveCall({
                        target: `${SWAP_CONTRACT.PACKAGE_ID}::${SWAP_CONTRACT.MODULE_NAME}::cetus_swap_usdc_to_sui`,
                        arguments: [
                            tx.object(SWAP_CONTRACT.SWAP_MANAGER_ID),
                            coinVector,
                            tx.pure.u64(minOutputWithSlippage),
                            tx.pure.u64(Math.floor(slippage * 10000)), // slippage in BPS
                            tx.object('0x6'), // Clock object
                        ]
                    });

                    res.status(200).json({
                        transaction_data: tx.serialize(),
                        expected_output: SELF.formatAmount(expectedOutput, 9),
                        min_output: SELF.formatAmount(minOutputWithSlippage, 9),
                        slippage: slippage,
                        gas_estimate: 0,
                        selected_coin: selectedCoin.coinObjectId
                    });

                } catch (contractError) {
                    console.error('Contract prepare failed, using mock response:', contractError.message);

                    // Mock response for development
                    const mockRate = 0.285714285;
                    const fee = 0.005;
                    const grossOutput = parseFloat(amount) * mockRate;
                    const expectedOutput = (grossOutput * (1 - fee)).toFixed(9);
                    const minOutput = (parseFloat(expectedOutput) * (1 - slippage)).toFixed(9);

                    res.status(200).json({
                        transaction_data: "mock_transaction_data",
                        expected_output: expectedOutput,
                        min_output: minOutput,
                        slippage: slippage,
                        gas_estimate: { computationCost: "1000000", storageCost: "100000" },
                        selected_coin: "mock_coin_id",
                        is_mock: true
                    });
                }

            } catch (error) {
                console.error('Error preparing USDC to SUI swap:', error);
                res.status(500).json({ error: error.message });
            }
        },

        // =================== TRANSACTION SUBMISSION FUNCTIONS ===================

        // Submit signed transaction
        submitTransaction: async (req, res) => {
            try {
                const { signed_transaction } = req.body;

                if (!signed_transaction) {
                    return res.status(400).json({ error: 'signed_transaction required' });
                }

                const result = await suiClient.executeTransactionBlock({
                    transactionBlock: signed_transaction,
                    options: {
                        showEvents: true,
                        showEffects: true,
                        showObjectChanges: true
                    }
                });

                res.status(200).json({
                    transaction_hash: result.digest,
                    status: result.effects?.status?.status,
                    events: result.events || [],
                    object_changes: result.objectChanges || [],
                    gas_used: result.effects?.gasUsed
                });

            } catch (error) {
                console.error('Error submitting transaction:', error);
                res.status(500).json({ error: error.message });
            }
        },

        // Get transaction status
        getTransactionStatus: async (req, res) => {
            try {
                const { tx_hash } = req.params;

                if (!tx_hash) {
                    return res.status(400).json({ error: 'Transaction hash required' });
                }

                const result = await suiClient.getTransactionBlock({
                    digest: tx_hash,
                    options: {
                        showEvents: true,
                        showEffects: true,
                        showObjectChanges: true
                    }
                });

                res.status(200).json({
                    transaction_hash: tx_hash,
                    status: result.effects?.status?.status,
                    timestamp: result.timestampMs,
                    events: result.events || [],
                    object_changes: result.objectChanges || [],
                    gas_used: result.effects?.gasUsed
                });

            } catch (error) {
                console.error('Error getting transaction status:', error);
                res.status(500).json({ error: error.message });
            }
        },

        // =================== HISTORY & USER FUNCTIONS ===================

        // Get recent swap transactions (mock for demo)
        getRecentSwaps: async (req, res) => {
            try {
                const { count = 10 } = req.query;

                // Mock response for development (since contract doesn't store history)
                res.status(200).json({
                    recent_swaps: [
                        {
                            from_token: 'SUI',
                            to_token: 'USDC',
                            amount_in: '10.0',
                            amount_out: '34.825',
                            timestamp: Date.now() - 3600000,
                            tx_hash: 'mock_hash_1'
                        },
                        {
                            from_token: 'USDC',
                            to_token: 'SUI',
                            amount_in: '50.0',
                            amount_out: '14.28',
                            timestamp: Date.now() - 7200000,
                            tx_hash: 'mock_hash_2'
                        }
                    ],
                    count: parseInt(count),
                    is_mock: true
                });

            } catch (error) {
                console.error('Error getting recent swaps:', error);
                res.status(500).json({ error: error.message });
            }
        },

        // Get user's tokens
        getUserTokens: async (req, res) => {
            try {
                const { user_address } = req.query;

                if (!user_address) {
                    return res.status(400).json({ error: 'user_address required' });
                }

                try {
                    const usdcType = `${SWAP_CONTRACT.PACKAGE_ID}::cetus_integration::USDC`;

                    // Get SUI balance
                    const suiBalance = await suiClient.getBalance({
                        owner: user_address,
                        coinType: '0x2::sui::SUI'
                    });

                    // Get USDC balance
                    let usdcBalance = { totalBalance: '0' };
                    try {
                        usdcBalance = await suiClient.getBalance({
                            owner: user_address,
                            coinType: usdcType
                        });
                    } catch (e) {
                        console.error('No USDC balance found');
                    }

                    res.status(200).json({
                        user_address,
                        balances: {
                            SUI: {
                                balance: SELF.formatAmount(suiBalance.totalBalance, 9),
                                raw_balance: suiBalance.totalBalance,
                                decimals: 9
                            },
                            USDC: {
                                balance: SELF.formatAmount(usdcBalance.totalBalance, 6),
                                raw_balance: usdcBalance.totalBalance,
                                decimals: 6
                            }
                        }
                    });

                } catch (contractError) {
                    console.error('Error fetching balances:', contractError.message);

                    // Mock response for development
                    res.status(200).json({
                        user_address,
                        balances: {
                            SUI: {
                                balance: "100.5",
                                raw_balance: "100500000000",
                                decimals: 9
                            },
                            USDC: {
                                balance: "250.0",
                                raw_balance: "250000000",
                                decimals: 6
                            }
                        },
                        is_mock: true
                    });
                }

            } catch (error) {
                console.error('Error getting user tokens:', error);
                res.status(500).json({ error: error.message });
            }
        },

        // Log AI command (mock for demo)
        logAiCommand: async (req, res) => {
            try {
                const { command, executed, result_hash, user_address } = req.body;

                if (!command || executed === undefined || !user_address) {
                    return res.status(400).json({ error: 'command, executed, and user_address required' });
                }

                // Mock response for development (since contract doesn't have this function)
                res.status(200).json({
                    transaction_data: "mock_ai_log_transaction",
                    gas_estimate: { computationCost: "500000", storageCost: "50000" },
                    message: 'AI command logged successfully (mock)',
                    is_mock: true
                });

            } catch (error) {
                console.error('Error logging AI command:', error);
                res.status(500).json({ error: error.message });
            }
        }
    }
}

export default new swapService(); 