import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import express from "express";
import cluster from "cluster";
import home from "./route/home.js";
import path from "path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import cors from "cors";


const app = express();

const server = new McpServer({
    name: "onchain-swap",
    version: "1.0.0",
    capabilities: {
        resources: {},
        tools: {},
    },
});

app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));
app.enable("trust proxy");
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;
app.use("/v1", home);
app.listen(process.env.PORT, async function () {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log(
        `Worker ${process.pid} listen on port ${process.env.PORT}`
    );
});