import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import express from "express";
import home from "./route/home.js";
import ai from "./route/ai.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import cors from "cors";
import swapService from "./route/onchain/swapService.js";

const app = express();

const server = new McpServer({
    name: "onchain-swap",
    version: "1.0.0",
    capabilities: {
        resources: {},
        tools: {},
    },
});

const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));
app.enable("trust proxy");
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;
app.use("/api", home);
app.use("/api/ai", ai);

// Add REST API routes for swap functionality
import swapRoutes from './routes/swapRoutes.js';
app.use("/api/swap", swapRoutes);

// Register MCP tools that call swapService directly
server.tool("getSwapQuoteSuiToUsdc", "Get swap quote for converting SUI to USDC with current exchange rates and fees", {
    amount: z.string().describe("Amount of SUI to convert")
}, async (args) => {
    try {
        // Create mock req/res objects to work with the existing service
        const mockReq = { query: { amount: args.amount } };
        let result = null;
        let statusCode = 200;

        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    statusCode = code;
                    result = data;
                    return { statusCode, data };
                }
            }),
            json: (data) => {
                result = data;
                return { statusCode: 200, data };
            }
        };

        await swapService.getSwapQuoteSuiToUsdc(mockReq, mockRes);

        if (statusCode !== 200) {
            throw new Error(result?.error || 'Failed to get swap quote');
        }

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    } catch (error) {
        throw new Error(`Failed to get swap quote: ${error.message}`);
    }
});

server.tool("getSwapQuoteUsdcToSui", "Get swap quote for converting USDC to SUI with current exchange rates and fees", {
    amount: z.string().describe("Amount of USDC to convert")
}, async (args) => {
    try {
        const mockReq = { query: { amount: args.amount } };
        let result = null;
        let statusCode = 200;

        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    statusCode = code;
                    result = data;
                    return { statusCode, data };
                }
            }),
            json: (data) => {
                result = data;
                return { statusCode: 200, data };
            }
        };

        await swapService.getSwapQuoteUsdcToSui(mockReq, mockRes);

        if (statusCode !== 200) {
            throw new Error(result?.error || 'Failed to get swap quote');
        }

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    } catch (error) {
        throw new Error(`Failed to get swap quote: ${error.message}`);
    }
});

server.tool("getAvailablePairs", "Get list of all available trading pairs supported by the DEX aggregator", {}, async () => {
    try {
        const mockReq = { query: {} };
        let result = null;
        let statusCode = 200;

        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    statusCode = code;
                    result = data;
                    return { statusCode, data };
                }
            }),
            json: (data) => {
                result = data;
                return { statusCode: 200, data };
            }
        };

        await swapService.getAvailablePairs(mockReq, mockRes);

        if (statusCode !== 200) {
            throw new Error(result?.error || 'Failed to get available pairs');
        }

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    } catch (error) {
        throw new Error(`Failed to get available pairs: ${error.message}`);
    }
});

server.tool("getPoolConfig", "Get detailed configuration for a specific trading pair pool", {
    pairName: z.string().describe("Trading pair name (e.g., 'SUI/USDC')")
}, async (args) => {
    try {
        const mockReq = { query: { pair_name: args.pairName } };
        let result = null;
        let statusCode = 200;

        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    statusCode = code;
                    result = data;
                    return { statusCode, data };
                }
            }),
            json: (data) => {
                result = data;
                return { statusCode: 200, data };
            }
        };

        await swapService.getPoolConfig(mockReq, mockRes);

        if (statusCode !== 200) {
            throw new Error(result?.error || 'Failed to get pool config');
        }

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    } catch (error) {
        throw new Error(`Failed to get pool config: ${error.message}`);
    }
});

server.tool("getDexConfig", "Get configuration and stats for a specific DEX (1=Turbos, 2=FlowX, 3=Aftermath, 4=Cetus)", {
    dexId: z.string().describe("DEX identifier (1=Turbos, 2=FlowX, 3=Aftermath, 4=Cetus)")
}, async (args) => {
    try {
        const mockReq = { query: { dex_id: args.dexId } };
        let result = null;
        let statusCode = 200;

        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    statusCode = code;
                    result = data;
                    return { statusCode, data };
                }
            }),
            json: (data) => {
                result = data;
                return { statusCode: 200, data };
            }
        };

        await swapService.getDexConfig(mockReq, mockRes);

        if (statusCode !== 200) {
            throw new Error(result?.error || 'Failed to get DEX config');
        }

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    } catch (error) {
        throw new Error(`Failed to get DEX config: ${error.message}`);
    }
});

// Start HTTP server and MCP server
app.listen(PORT, async function () {
    // Only output to stderr to avoid interfering with MCP stdio communication
    console.error(`Worker ${process.pid} listen on port ${PORT}`);

    // Connect MCP server to stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('MCP server connected');
});