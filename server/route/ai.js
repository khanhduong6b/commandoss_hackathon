import express from "express";
import mcpClientService from "../services/mcpClient.js";

const router = express.Router({});

// AI Command Processing endpoint
router.post('/command', async (req, res) => {
    try {
        const { command, user_address } = req.body;

        if (!command || !user_address) {
            return res.status(400).json({ error: 'command and user_address required' });
        }

        console.error(`Processing AI command: ${command}`);

        // Parse the command and determine which MCP tools to call
        const analysis = await analyzeCommand(command);

        res.json({
            command,
            analysis: analysis.analysis,
            recommendation: analysis.recommendation,
            confidence: analysis.confidence,
            data: analysis.data,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error processing AI command:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get MCP tools list
router.get('/tools', async (req, res) => {
    try {
        const tools = await mcpClientService.listTools();
        res.json(tools);
    } catch (error) {
        console.error('Error listing tools:', error);
        res.status(500).json({ error: error.message });
    }
});

// Direct MCP tool calls
router.post('/tools/:toolName', async (req, res) => {
    try {
        const { toolName } = req.params;
        const { arguments: toolArgs } = req.body;

        const result = await mcpClientService.callTool(toolName, toolArgs || {});
        res.json(result);
    } catch (error) {
        console.error(`Error calling tool ${req.params.toolName}:`, error);
        res.status(500).json({ error: error.message });
    }
});

// Specific swap quote endpoints
router.get('/quote/sui-to-usdc', async (req, res) => {
    try {
        const { amount } = req.query;
        if (!amount) {
            return res.status(400).json({ error: 'amount parameter required' });
        }

        const result = await mcpClientService.getSwapQuoteSuiToUsdc(amount);
        res.json(result);
    } catch (error) {
        console.error('Error getting SUI to USDC quote:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/quote/usdc-to-sui', async (req, res) => {
    try {
        const { amount } = req.query;
        if (!amount) {
            return res.status(400).json({ error: 'amount parameter required' });
        }

        const result = await mcpClientService.getSwapQuoteUsdcToSui(amount);
        res.json(result);
    } catch (error) {
        console.error('Error getting USDC to SUI quote:', error);
        res.status(500).json({ error: error.message });
    }
});

// Simple command analysis function
async function analyzeCommand(command) {
    const lowerCommand = command.toLowerCase();

    try {
        // Detect swap commands
        if (lowerCommand.includes('swap')) {
            return await handleSwapCommand(command);
        }

        // Detect portfolio analysis
        if (lowerCommand.includes('portfolio') || lowerCommand.includes('analyze')) {
            return await handlePortfolioAnalysis(command);
        }

        // Detect pool/liquidity queries
        if (lowerCommand.includes('pool') || lowerCommand.includes('liquidity')) {
            return await handlePoolAnalysis(command);
        }

        // Detect DEX information queries
        if (lowerCommand.includes('dex') || lowerCommand.includes('exchange')) {
            return await handleDexAnalysis(command);
        }

        // Default fallback
        return {
            analysis: `I understand you want to: "${command}". Let me help you with that.`,
            recommendation: "I'll analyze the current market conditions and provide specific recommendations.",
            confidence: 75,
            data: null
        };

    } catch (error) {
        console.error('Error in command analysis:', error);
        return {
            analysis: `I encountered an issue analyzing: "${command}"`,
            recommendation: "Please try rephrasing your command or check if the service is available.",
            confidence: 60,
            data: { error: error.message }
        };
    }
}

async function handleSwapCommand(command) {
    // Extract amounts and tokens from command
    const swapMatch = command.match(/swap\s+(\d+\.?\d*)\s+(\w+)\s+to\s+(\w+)/i);

    if (swapMatch) {
        const [, amount, fromToken, toToken] = swapMatch;

        try {
            let quoteData = null;

            if (fromToken.toUpperCase() === 'SUI' && toToken.toUpperCase() === 'USDC') {
                const result = await mcpClientService.getSwapQuoteSuiToUsdc(amount);
                quoteData = JSON.parse(result.content[0].text);
            } else if (fromToken.toUpperCase() === 'USDC' && toToken.toUpperCase() === 'SUI') {
                const result = await mcpClientService.getSwapQuoteUsdcToSui(amount);
                quoteData = JSON.parse(result.content[0].text);
            }

            if (quoteData) {
                return {
                    analysis: `I found a swap quote for ${amount} ${fromToken.toUpperCase()} to ${toToken.toUpperCase()}. Current rate is ${quoteData.rate} ${toToken.toUpperCase()} per ${fromToken.toUpperCase()}.`,
                    recommendation: `You would receive approximately ${quoteData.output_amount} ${quoteData.output_token}. ${quoteData.is_mock ? 'Note: This is mock data for testing.' : 'This is live market data.'}`,
                    confidence: quoteData.is_mock ? 75 : 95,
                    data: quoteData
                };
            }
        } catch (error) {
            console.error('Error getting swap quote:', error);
        }
    }

    return {
        analysis: `I detected a swap command: "${command}". I can help you find the best rates.`,
        recommendation: "Please specify the format like 'swap 10 SUI to USDC' for accurate quotes.",
        confidence: 80,
        data: null
    };
}

async function handlePortfolioAnalysis(command) {
    try {
        // Get available pairs to show portfolio diversity options
        const pairsResult = await mcpClientService.getAvailablePairs();
        const pairsData = JSON.parse(pairsResult.content[0].text);

        return {
            analysis: "I analyzed the available trading pairs and current market conditions for portfolio optimization.",
            recommendation: `Consider diversifying across ${pairsData.total_pairs} available pairs: ${pairsData.available_pairs.join(', ')}. ${pairsData.is_mock ? 'Note: Using mock data for demo.' : ''}`,
            confidence: 85,
            data: pairsData
        };
    } catch (error) {
        return {
            analysis: "I'm analyzing your portfolio request but encountered an issue accessing current market data.",
            recommendation: "Please ensure you're connected and try again.",
            confidence: 60,
            data: { error: error.message }
        };
    }
}

async function handlePoolAnalysis(command) {
    try {
        const pairsResult = await mcpClientService.getAvailablePairs();
        const pairsData = JSON.parse(pairsResult.content[0].text);

        return {
            analysis: `I found ${pairsData.total_pairs} liquidity pools available for trading.`,
            recommendation: `Available pools: ${pairsData.available_pairs.join(', ')}. Consider pools with higher liquidity for better rates.`,
            confidence: 90,
            data: pairsData
        };
    } catch (error) {
        return {
            analysis: "I'm searching for the best liquidity pools but encountered an issue.",
            recommendation: "Pool data temporarily unavailable. Please try again.",
            confidence: 50,
            data: { error: error.message }
        };
    }
}

async function handleDexAnalysis(command) {
    try {
        // Get info about different DEXes
        const dexPromises = [1, 2, 3, 4].map(async (dexId) => {
            try {
                const result = await mcpClientService.getDexConfig(dexId);
                return JSON.parse(result.content[0].text);
            } catch (e) {
                return null;
            }
        });

        const dexResults = (await Promise.all(dexPromises)).filter(Boolean);

        return {
            analysis: `I analyzed ${dexResults.length} DEX configurations for optimal trading routes.`,
            recommendation: "Consider using multiple DEXes for better price discovery and reduced slippage.",
            confidence: 85,
            data: { dexes: dexResults }
        };
    } catch (error) {
        return {
            analysis: "I'm analyzing DEX configurations but encountered an issue.",
            recommendation: "DEX data temporarily unavailable. Please try again.",
            confidence: 50,
            data: { error: error.message }
        };
    }
}

export default router; 