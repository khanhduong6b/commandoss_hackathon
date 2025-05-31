import express from "express";
const router = express.Router({});
import swapController from "./onchain/swapController.js";

// =================== SWAP QUOTE ROUTES ===================
router.get('/quote/sui-to-usdc', swapController.getSwapQuoteSuiToUsdc);
router.get('/quote/usdc-to-sui', swapController.getSwapQuoteUsdcToSui);
// =================== POOL INFORMATION ROUTES ===================
router.get('/pools', swapController.getAvailablePairs);
router.get('/pool/config', swapController.getPoolConfig);
router.get('/dex/config', swapController.getDexConfig);
// =================== TRANSACTION ROUTES ===================
router.post('/prepare/sui-to-usdc', swapController.prepareSwapSuiToUsdc);
router.post('/prepare/usdc-to-sui', swapController.prepareSwapUsdcToSui);
router.post('/submit', swapController.submitTransaction);
router.get('/status/:tx_hash', swapController.getTransactionStatus);
// =================== USER & HISTORY ROUTES ===================
router.get('/history', swapController.getRecentSwaps);
router.get('/user/tokens', swapController.getUserTokens);
router.post('/ai/log', swapController.logAiCommand);

export default router;
