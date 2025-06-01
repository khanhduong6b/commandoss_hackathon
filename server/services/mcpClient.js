import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MCPClientService {
    constructor() {
        this.client = null;
        this.transport = null;
        this.isConnected = false;
    }

    async connect() {
        if (this.isConnected) {
            return;
        }

        try {
            // Create transport to connect to our MCP server
            this.transport = new StdioClientTransport({
                command: "node",
                args: [path.join(__dirname, "../index.js")],
                env: {
                    PORT: "3000",
                    SWAP_PACKAGE_ID: process.env.SWAP_PACKAGE_ID,
                    SWAP_MANAGER_ID: process.env.SWAP_MANAGER_ID
                }
            });

            this.client = new Client({
                name: "swap-client",
                version: "1.0.0"
            });

            await this.client.connect(this.transport);
            this.isConnected = true;
            console.error("MCP Client connected successfully");
        } catch (error) {
            console.error("Failed to connect MCP client:", error);
            throw error;
        }
    }

    async disconnect() {
        if (this.client && this.isConnected) {
            await this.client.close();
            this.isConnected = false;
            console.error("MCP Client disconnected");
        }
    }

    async ensureConnected() {
        if (!this.isConnected) {
            await this.connect();
        }
    }

    async listTools() {
        await this.ensureConnected();
        try {
            const tools = await this.client.listTools();
            return tools;
        } catch (error) {
            console.error("Error listing tools:", error);
            throw error;
        }
    }

    async callTool(name, args = {}) {
        await this.ensureConnected();
        try {
            const result = await this.client.callTool({
                name,
                arguments: args
            });
            return result;
        } catch (error) {
            console.error(`Error calling tool ${name}:`, error);
            throw error;
        }
    }

    // Specific methods for each tool
    async getSwapQuoteSuiToUsdc(amount) {
        return await this.callTool("getSwapQuoteSuiToUsdc", { amount: amount.toString() });
    }

    async getSwapQuoteUsdcToSui(amount) {
        return await this.callTool("getSwapQuoteUsdcToSui", { amount: amount.toString() });
    }

    async getAvailablePairs() {
        return await this.callTool("getAvailablePairs", {});
    }

    async getPoolConfig(pairName) {
        return await this.callTool("getPoolConfig", { pairName });
    }

    async getDexConfig(dexId) {
        return await this.callTool("getDexConfig", { dexId: dexId.toString() });
    }
}

// Create singleton instance
const mcpClientService = new MCPClientService();

export default mcpClientService; 