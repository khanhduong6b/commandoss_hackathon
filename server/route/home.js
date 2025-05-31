import express from "express";
const router = express.Router({});
import swapService from "./onchain/swapService.js";

// =================== SWAP QUOTE ROUTES ===================
router.get('/quote/sui-to-usdc', swapService.getSwapQuoteSuiToUsdc);
router.get('/quote/usdc-to-sui', swapService.getSwapQuoteUsdcToSui);
// =================== POOL INFORMATION ROUTES ===================
router.get('/pools', swapService.getAvailablePairs);
router.get('/pool/config', swapService.getPoolConfig);
router.get('/dex/config', swapService.getDexConfig);
// =================== TRANSACTION ROUTES ===================
router.post('/prepare/sui-to-usdc', swapService.prepareSwapSuiToUsdc);
router.post('/prepare/usdc-to-sui', swapService.prepareSwapUsdcToSui);
router.post('/submit', swapService.submitTransaction);
router.get('/status/:tx_hash', swapService.getTransactionStatus);
// =================== USER & HISTORY ROUTES ===================
router.get('/history', swapService.getRecentSwaps);
router.get('/user/tokens', swapService.getUserTokens);
router.post('/ai/log', swapService.logAiCommand);

export default router;
