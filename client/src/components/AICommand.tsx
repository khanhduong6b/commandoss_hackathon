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
            description: "Swap tokens with specified amounts"
        },
        {
            text: "analyze my portfolio",
            description: "Get AI analysis of your holdings"
        },
        {
            text: "find best liquidity pools",
            description: "Discover high-yield opportunities"
        },
        {
            text: "what's the gas fee trend?",
            description: "Get current gas fee insights"
        },
        {
            text: "suggest optimal swap route",
            description: "Find the most efficient trading path"
        }
    ];

    const sendCommand = async () => {
        if (!command.trim() || !account) return;

        setLoading(true);
        try {
            // Log the AI command
            const logResponse = await fetch("/api/ai/log", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    command: command.trim(),
                    executed: false, // Will be true when command is actually executed
                    user_address: account.address,
                    result_hash: null // Optional, can be added later
                })
            });

            if (logResponse.ok) {
                // Simulate AI response (in real implementation, this would call an AI service)
                const aiResponse: AIResponse = {
                    command: command.trim(),
                    analysis: `Based on your command "${command.trim()}", I analyzed current market conditions and your portfolio status.`,
                    recommendation: "I recommend checking the current market conditions and ensuring you have sufficient balance for the transaction. Consider the gas fees and slippage tolerance.",
                    confidence: Math.floor(Math.random() * 30) + 70, // Random confidence between 70-99%
                    timestamp: new Date().toISOString()
                };

                setResponse(aiResponse);
                setCommandHistory(prev => [aiResponse, ...prev.slice(0, 4)]); // Keep last 5 commands
                setCommand("");
            }
        } catch (error) {
            console.error("Error sending AI command:", error);
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
                AI Portfolio Assistant
            </Heading>

            {/* Command Input */}
            <Card style={{ padding: "24px", background: "var(--gray-a1)", marginBottom: "20px" }}>
                <Flex direction="column" gap="3">
                    <Flex gap="2" align="center">
                        <ChatBubbleIcon style={{ color: "var(--blue-11)" }} />
                        <Text size="3" weight="medium">Ask me anything about your portfolio or trading</Text>
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
                            Send Command
                        </Button>
                    </Flex>
                </Flex>
            </Card>

            {/* Example Commands */}
            <Card style={{ padding: "20px", background: "var(--blue-a2)", marginBottom: "20px" }}>
                <Text size="3" weight="medium" mb="3" style={{ color: "var(--blue-11)" }}>
                    Try these example commands:
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
                <Card style={{ padding: "24px", background: "var(--green-a2)", marginBottom: "20px" }}>
                    <Flex direction="column" gap="3">
                        <Flex justify="between" align="center">
                            <Text size="3" weight="bold" style={{ color: "var(--green-11)" }}>
                                AI Response
                            </Text>
                            <Badge color="green">
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
                        Recent Commands
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
                                        <Badge variant="soft" color="blue">
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