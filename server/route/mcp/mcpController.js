import swapService from "../onchain/swapService.js";

server.tool("getSwapQuoteSuiToUsdc", "Get swap quote for converting SUI to USDC with current exchange rates and fees", swapService.getSwapQuoteSuiToUsdc);
server.tool("getSwapQuoteUsdcToSui", "Get swap quote for converting USDC to SUI with current exchange rates and fees", swapService.getSwapQuoteUsdcToSui);
server.tool("getAvailablePairs", "Get list of all available trading pairs supported by the DEX aggregator", swapService.getAvailablePairs);
server.tool("getPoolConfig", "Get detailed configuration for a specific trading pair pool", swapService.getPoolConfig);
server.tool("getDexConfig", "Get configuration and stats for a specific DEX (1=Turbos, 2=FlowX, 3=Aftermath, 4=Cetus)", swapService.getDexConfig);
