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

console.log(SWAP_CONTRACT);

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

            for (const coin of sortedCoins) {
                if (Number(coin.balance) >= requiredAmount) {
                    return coin;
                }
            }

            throw new Error(`Insufficient balance. Required: ${requiredAmount}, Available: ${sortedCoins[0]?.balance || 0}`);
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
                    const outputInUsdc = SELF.formatAmount(outputAmount[0], 6);

                    res.status(200).json({
                        input_amount: amount,
                        input_token: 'SUI',
                        output_amount: outputInUsdc,
                        output_token: 'USDC',
                        rate: outputInUsdc / amount,
                        raw_output: outputAmount[0]
                    });
                } else {
                    throw new Error('Failed to get quote');
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
                    const outputInSui = SELF.formatAmount(outputAmount[0], 9);

                    res.status(200).json({
                        input_amount: amount,
                        input_token: 'USDC',
                        output_amount: outputInSui,
                        output_token: 'SUI',
                        rate: outputInSui / amount,
                        raw_output: outputAmount[0]
                    });
                } else {
                    throw new Error('Failed to get quote');
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

                res.status(200).json({
                    available_pairs: result.results?.[0]?.returnValues || [],
                    total_pairs: result.results?.[0]?.returnValues?.length || 0
                });

            } catch (error) {
                console.error('Error getting available pairs:', error);
                res.status(500).json({ error: error.message });
            }
        },

        // Get pool configuration
        getPoolConfig: async (req, res) => {
            try {
                const { pair_name } = req.query;

                if (!pair_name) {
                    return res.status(400).json({ error: 'pair_name parameter required' });
                }

                const result = await suiClient.devInspectTransactionBlock({
                    transactionBlock: (() => {
                        const tx = new Transaction();
                        tx.moveCall({
                            target: `${SWAP_CONTRACT.PACKAGE_ID}::${SWAP_CONTRACT.MODULE_NAME}::get_pool_config`,
                            arguments: [
                                tx.object(SWAP_CONTRACT.SWAP_MANAGER_ID),
                                tx.pure.string(pair_name)
                            ]
                        });
                        return tx;
                    })(),
                    sender: '0x0000000000000000000000000000000000000000000000000000000000000000'
                });

                res.status(200).json({
                    pair_name,
                    config: result.results?.[0]?.returnValues || null
                });

            } catch (error) {
                console.error('Error getting pool config:', error);
                res.status(500).json({ error: error.message });
            }
        },

        // Get DEX configuration
        getDexConfig: async (req, res) => {
            try {
                const { dex_id } = req.query;

                if (!dex_id || isNaN(dex_id)) {
                    return res.status(400).json({ error: 'Valid dex_id parameter required (1-4)' });
                }

                const result = await suiClient.devInspectTransactionBlock({
                    transactionBlock: (() => {
                        const tx = new Transaction();
                        tx.moveCall({
                            target: `${SWAP_CONTRACT.PACKAGE_ID}::${SWAP_CONTRACT.MODULE_NAME}::get_dex_config`,
                            arguments: [
                                tx.object(SWAP_CONTRACT.SWAP_MANAGER_ID),
                                tx.pure.u8(parseInt(dex_id))
                            ]
                        });
                        return tx;
                    })(),
                    sender: '0x0000000000000000000000000000000000000000000000000000000000000000'
                });

                const dexNames = { 1: 'Turbos', 2: 'FlowX', 3: 'Aftermath', 4: 'Cetus' };

                res.status(200).json({
                    dex_id: parseInt(dex_id),
                    dex_name: dexNames[dex_id],
                    config: result.results?.[0]?.returnValues || null
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

                // Build transaction
                const tx = new Transaction();
                const coinArg = tx.object(selectedCoin.coinObjectId);

                tx.moveCall({
                    target: `${SWAP_CONTRACT.PACKAGE_ID}::${SWAP_CONTRACT.MODULE_NAME}::swap_sui_to_usdc_entry`,
                    arguments: [
                        tx.object(SWAP_CONTRACT.SWAP_MANAGER_ID),
                        coinArg,
                        tx.pure.u64(minOutputWithSlippage),
                        tx.object('0x6')
                    ]
                });

                // Estimate gas
                const dryRun = await suiClient.dryRunTransactionBlock({
                    transactionBlock: tx,
                    sender: user_address
                });

                res.status(200).json({
                    transaction_data: tx.serialize(),
                    expected_output: SELF.formatAmount(expectedOutput, 6),
                    min_output: SELF.formatAmount(minOutputWithSlippage, 6),
                    slippage: slippage,
                    gas_estimate: dryRun.effects.gasUsed,
                    selected_coin: selectedCoin.coinObjectId
                });

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

                const usdcType = `${SWAP_CONTRACT.PACKAGE_ID}::${SWAP_CONTRACT.MODULE_NAME}::USDC`;
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

                // Build transaction
                const tx = new Transaction();
                const coinArg = tx.object(selectedCoin.coinObjectId);

                tx.moveCall({
                    target: `${SWAP_CONTRACT.PACKAGE_ID}::${SWAP_CONTRACT.MODULE_NAME}::swap_usdc_to_sui_entry`,
                    arguments: [
                        tx.object(SWAP_CONTRACT.SWAP_MANAGER_ID),
                        coinArg,
                        tx.pure.u64(minOutputWithSlippage),
                        tx.object('0x6')
                    ]
                });

                // Estimate gas
                const dryRun = await suiClient.dryRunTransactionBlock({
                    transactionBlock: tx,
                    sender: user_address
                });

                res.status(200).json({
                    transaction_data: tx.serialize(),
                    expected_output: SELF.formatAmount(expectedOutput, 9),
                    min_output: SELF.formatAmount(minOutputWithSlippage, 9),
                    slippage: slippage,
                    gas_estimate: dryRun.effects.gasUsed,
                    selected_coin: selectedCoin.coinObjectId
                });

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

        // Get recent swap transactions
        getRecentSwaps: async (req, res) => {
            try {
                const { count = 10 } = req.query;

                const result = await suiClient.devInspectTransactionBlock({
                    transactionBlock: (() => {
                        const tx = new Transaction();
                        tx.moveCall({
                            target: `${SWAP_CONTRACT.PACKAGE_ID}::${SWAP_CONTRACT.MODULE_NAME}::get_recent_swaps`,
                            arguments: [
                                tx.object(SWAP_CONTRACT.SWAP_MANAGER_ID),
                                tx.pure.u64(parseInt(count))
                            ]
                        });
                        return tx;
                    })(),
                    sender: '0x0000000000000000000000000000000000000000000000000000000000000000'
                });

                res.status(200).json({
                    recent_swaps: result.results?.[0]?.returnValues || [],
                    count: parseInt(count)
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

                const usdcType = `${SWAP_CONTRACT.PACKAGE_ID}::${SWAP_CONTRACT.MODULE_NAME}::USDC`;

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
                    console.log('No USDC balance found');
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

            } catch (error) {
                console.error('Error getting user tokens:', error);
                res.status(500).json({ error: error.message });
            }
        },

        // Log AI command
        logAiCommand: async (req, res) => {
            try {
                const { command, executed, result_hash, user_address } = req.body;

                if (!command || executed === undefined || !user_address) {
                    return res.status(400).json({ error: 'command, executed, and user_address required' });
                }

                const tx = new Transaction();

                tx.moveCall({
                    target: `${SWAP_CONTRACT.PACKAGE_ID}::${SWAP_CONTRACT.MODULE_NAME}::log_ai_command`,
                    arguments: [
                        tx.object(SWAP_CONTRACT.SWAP_MANAGER_ID),
                        tx.pure.string(command),
                        tx.pure.bool(executed),
                        tx.pure.vector('u8', result_hash || []),
                        tx.object('0x6')
                    ]
                });

                const dryRun = await suiClient.dryRunTransactionBlock({
                    transactionBlock: tx,
                    sender: user_address
                });

                res.status(200).json({
                    transaction_data: tx.serialize(),
                    gas_estimate: dryRun.effects.gasUsed,
                    message: 'Transaction prepared. User needs to sign and submit.'
                });

            } catch (error) {
                console.error('Error logging AI command:', error);
                res.status(500).json({ error: error.message });
            }
        }
    }
}

export default new swapService(); 