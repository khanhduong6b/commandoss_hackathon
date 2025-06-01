import express from 'express';
import swapService from '../route/onchain/swapService.js';

const router = express.Router();

// =================== QUOTE ROUTES ===================

// GET /api/swap/quote/sui-to-usdc?amount=1
router.get('/quote/sui-to-usdc', swapService.getSwapQuoteSuiToUsdc);

// GET /api/swap/quote/usdc-to-sui?amount=10
router.get('/quote/usdc-to-sui', swapService.getSwapQuoteUsdcToSui);

// =================== POOL INFO ROUTES ===================

// GET /api/swap/pairs
router.get('/pairs', swapService.getAvailablePairs);

// GET /api/swap/pool/config?pair_name=SUI_USDC
router.get('/pool/config', swapService.getPoolConfig);

// GET /api/swap/dex/config?dex_id=4
router.get('/dex/config', swapService.getDexConfig);

// =================== TRANSACTION ROUTES ===================

// POST /api/swap/prepare/sui-to-usdc
// Body: { amount: "1", slippage: 0.01, user_address: "0x..." }
router.post('/prepare/sui-to-usdc', swapService.prepareSwapSuiToUsdc);

// POST /api/swap/prepare/usdc-to-sui
// Body: { amount: "10", slippage: 0.01, user_address: "0x..." }
router.post('/prepare/usdc-to-sui', swapService.prepareSwapUsdcToSui);

// POST /api/swap/submit
// Body: { signed_transaction: "..." }
router.post('/submit', swapService.submitTransaction);

// GET /api/swap/status/:tx_hash
router.get('/status/:tx_hash', swapService.getTransactionStatus);

// =================== USER & HISTORY ROUTES ===================

// GET /api/swap/history/recent?count=10
router.get('/history/recent', swapService.getRecentSwaps);

// GET /api/swap/user/tokens?user_address=0x...
router.get('/user/tokens', swapService.getUserTokens);

// POST /api/swap/ai/log
// Body: { command: "swap 1 SUI to USDC", executed: true, result_hash: "...", user_address: "0x..." }
router.post('/ai/log', swapService.logAiCommand);

export default router; 