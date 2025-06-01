import { useCurrentAccount } from "@mysten/dapp-kit";
import {
    Box,
    Card,
    Flex,
    Heading,
    Text,
    Button,
    Callout,
    Badge
} from "@radix-ui/themes";
import { useState } from "react";
import {
    PaperPlaneIcon,
    InfoCircledIcon,
    PersonIcon,
    ChatBubbleIcon,
    LightningBoltIcon
} from "@radix-ui/react-icons";

interface AIResponse {
    command: string;
    analysis: string;
    recommendation: string;
    confidence: number;
    timestamp: string;
    data?: any;
}

interface CommandExample {
    text: string;
    description: string;
}

export function AICommand() {
    const account = useCurrentAccount();
    const [command, setCommand] = useState("");
    const [response, setResponse] = useState<AIResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [commandHistory, setCommandHistory] = useState<AIResponse[]>([]);

    const exampleCommands: CommandExample[] = [
        {
            text: "swap 10 SUI to USDC",
            description: "Get real-time swap quote using MCP"
        },
        {
            text: "analyze my portfolio",
            description: "AI analysis using MCP data"
        },
        {
            text: "find best liquidity pools",
            description: "Discover pools via MCP tools"
        },
        {
            text: "show me DEX information",
            description: "Get DEX configs through MCP"
        },
        {
            text: "what trading pairs are available?",
            description: "List available pairs via MCP"
        }
    ];

    const sendCommand = async () => {
        if (!command.trim() || !account) return;

        setLoading(true);
        try {
            // Determine API base URL: use VITE_SERVER_URL if provided, otherwise default to current origin
            const API_BASE_URL = "https://commandoss-server.duongfinance.com";

            const response = await fetch(`${API_BASE_URL}/api/ai/command`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    command: command.trim(),
                    user_address: account.address
                })
            });

            if (response.ok) {
                const aiResponse: AIResponse = await response.json();
                setResponse(aiResponse);
                setCommandHistory(prev => [aiResponse, ...prev.slice(0, 4)]); // Keep last 5 commands
                setCommand("");
            } else {
                const error = await response.json();
                console.error("AI API error:", error);
                // Show error response
                const errorResponse: AIResponse = {
                    command: command.trim(),
                    analysis: "I encountered an error processing your request.",
                    recommendation: `Error: ${error.error || 'Unknown error occurred'}`,
                    confidence: 0,
                    timestamp: new Date().toISOString()
                };
                setResponse(errorResponse);
            }
        } catch (error) {
            console.error("Error sending AI command:", error);
            const errorResponse: AIResponse = {
                command: command.trim(),
                analysis: "I couldn't process your request due to a connection error.",
                recommendation: "Please check your connection and try again.",
                confidence: 0,
                timestamp: new Date().toISOString()
            };
            setResponse(errorResponse);
        } finally {
            setLoading(false);
        }
    };

    const useExampleCommand = (exampleText: string) => {
        setCommand(exampleText);
    };

    if (!account) {
        return (
            <Callout.Root color="orange">
                <Callout.Icon>
                    <InfoCircledIcon />
                </Callout.Icon>
                <Callout.Text>
                    Please connect your wallet to use the AI assistant.
                </Callout.Text>
            </Callout.Root>
        );
    }

    return (
        <Box>
            <Heading size="5" mb="4" style={{ color: "var(--blue-11)" }}>
                AI Portfolio Assistant (MCP Powered)
            </Heading>

            {/* Command Input */}
            <Card style={{ padding: "24px", background: "var(--gray-a1)", marginBottom: "20px" }}>
                <Flex direction="column" gap="3">
                    <Flex gap="2" align="center">
                        <ChatBubbleIcon style={{ color: "var(--blue-11)" }} />
                        <Text size="3" weight="medium">Ask me anything - powered by MCP tools</Text>
                    </Flex>

                    <textarea
                        placeholder="e.g., 'swap 10 SUI to USDC' or 'analyze my portfolio performance'"
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        rows={3}
                        style={{
                            width: "100%",
                            padding: "12px",
                            border: "1px solid var(--gray-a6)",
                            borderRadius: "6px",
                            background: "white",
                            fontSize: "14px",
                            fontFamily: "inherit",
                            resize: "vertical",
                            boxSizing: "border-box"
                        }}
                    />

                    <Flex gap="2" justify="end">
                        <Button
                            variant="soft"
                            onClick={() => setCommand("")}
                            disabled={!command.trim()}
                        >
                            Clear
                        </Button>
                        <Button
                            onClick={sendCommand}
                            disabled={!command.trim() || loading}
                        >
                            {loading ? <LightningBoltIcon className="animate-pulse" /> : <PaperPlaneIcon />}
                            {loading ? "Processing..." : "Send Command"}
                        </Button>
                    </Flex>
                </Flex>
            </Card>

            {/* Example Commands */}
            <Card style={{ padding: "20px", background: "var(--blue-a2)", marginBottom: "20px" }}>
                <Text size="3" weight="medium" mb="3" style={{ color: "var(--blue-11)" }}>
                    Try these MCP-powered commands:
                </Text>
                <Flex direction="column" gap="2">
                    {exampleCommands.map((example, index) => (
                        <Flex
                            key={index}
                            justify="between"
                            align="center"
                            style={{
                                padding: "8px 12px",
                                background: "white",
                                borderRadius: "8px",
                                cursor: "pointer"
                            }}
                            onClick={() => useExampleCommand(example.text)}
                        >
                            <Flex direction="column">
                                <Text size="2" weight="medium" style={{ color: "var(--blue-11)" }}>
                                    {example.text}
                                </Text>
                                <Text size="1" style={{ color: "var(--gray-11)" }}>
                                    {example.description}
                                </Text>
                            </Flex>
                            <PaperPlaneIcon style={{ color: "var(--gray-9)" }} />
                        </Flex>
                    ))}
                </Flex>
            </Card>

            {/* Current Response */}
            {response && (
                <Card style={{ padding: "24px", background: response.confidence > 50 ? "var(--green-a2)" : "var(--orange-a2)", marginBottom: "20px" }}>
                    <Flex direction="column" gap="3">
                        <Flex justify="between" align="center">
                            <Text size="3" weight="bold" style={{ color: response.confidence > 50 ? "var(--green-11)" : "var(--orange-11)" }}>
                                MCP AI Response
                            </Text>
                            <Badge color={response.confidence > 50 ? "green" : response.confidence > 0 ? "orange" : "red"}>
                                {response.confidence}% Confidence
                            </Badge>
                        </Flex>

                        <Box>
                            <Text size="2" weight="medium" mb="2" style={{ color: "var(--gray-12)" }}>
                                Your Command:
                            </Text>
                            <Text size="2" style={{
                                background: "var(--gray-a3)",
                                padding: "8px 12px",
                                borderRadius: "6px",
                                display: "block"
                            }}>
                                "{response.command}"
                            </Text>
                        </Box>

                        <Box>
                            <Text size="2" weight="medium" mb="2" style={{ color: "var(--gray-12)" }}>
                                Analysis:
                            </Text>
                            <Text size="2">{response.analysis}</Text>
                        </Box>

                        <Box>
                            <Text size="2" weight="medium" mb="2" style={{ color: "var(--gray-12)" }}>
                                Recommendation:
                            </Text>
                            <Text size="2">{response.recommendation}</Text>
                        </Box>

                        {/* Show MCP data if available */}
                        {response.data && (
                            <Box>
                                <Text size="2" weight="medium" mb="2" style={{ color: "var(--gray-12)" }}>
                                    MCP Data:
                                </Text>

                                {/* Render formatted swap quote if fields detected */}
                                {response.data.input_amount !== undefined && response.data.output_amount !== undefined && response.data.rate !== undefined ? (
                                    <Box style={{ marginLeft: "20px" }}>
                                        <ul style={{ listStyleType: "disc", paddingLeft: "16px" }}>
                                            <li>
                                                <Text size="2">
                                                    <strong>Input:</strong> {response.data.input_amount} {response.data.input_token}
                                                </Text>
                                            </li>
                                            <li>
                                                <Text size="2">
                                                    <strong>Output:</strong> {response.data.output_amount} {response.data.output_token}
                                                </Text>
                                            </li>
                                            <li>
                                                <Text size="2">
                                                    <strong>Exchange Rate:</strong> 1 {response.data.input_token} = {Number(response.data.rate).toFixed(6)} {response.data.output_token}
                                                </Text>
                                            </li>
                                            <li>
                                                <Text size="2">
                                                    <strong>Raw Output:</strong> {response.data.raw_output}
                                                </Text>
                                            </li>
                                        </ul>
                                    </Box>
                                ) : (
                                    <pre style={{
                                        background: "var(--gray-a3)",
                                        padding: "12px",
                                        borderRadius: "6px",
                                        fontSize: "12px",
                                        overflow: "auto",
                                        maxHeight: "200px"
                                    }}>
                                        {JSON.stringify(response.data, null, 2)}
                                    </pre>
                                )}
                            </Box>
                        )}

                        <Text size="1" style={{ color: "var(--gray-11)" }}>
                            {new Date(response.timestamp).toLocaleString()}
                        </Text>
                    </Flex>
                </Card>
            )}

            {/* Command History */}
            {commandHistory.length > 0 && (
                <Card style={{ padding: "24px", background: "var(--gray-a1)" }}>
                    <Heading size="4" mb="3" style={{ color: "var(--gray-12)" }}>
                        Recent MCP Commands
                    </Heading>

                    <Flex direction="column" gap="3">
                        {commandHistory.map((item, index) => (
                            <Card key={index} style={{ padding: "16px", background: "white" }}>
                                <Flex direction="column" gap="2">
                                    <Flex justify="between" align="center">
                                        <Flex gap="2" align="center">
                                            <PersonIcon style={{ color: "var(--blue-11)" }} />
                                            <Text size="2" style={{ fontStyle: "italic" }}>
                                                "{item.command}"
                                            </Text>
                                        </Flex>
                                        <Badge variant="soft" color={item.confidence > 50 ? "blue" : "orange"}>
                                            {item.confidence}%
                                        </Badge>
                                    </Flex>

                                    <Text size="2" style={{ color: "var(--gray-11)" }}>
                                        {new Date(item.timestamp).toLocaleString()}
                                    </Text>
                                </Flex>
                            </Card>
                        ))}
                    </Flex>
                </Card>
            )}
        </Box>
    );
} 