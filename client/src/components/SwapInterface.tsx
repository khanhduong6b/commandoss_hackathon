import { useCurrentAccount } from "@mysten/dapp-kit";
import {
    Box,
    Button,
    Card,
    Flex,
    Heading,
    Text,
    Badge,
    Callout
} from "@radix-ui/themes";
import { useState, useEffect } from "react";
import { InfoCircledIcon, UpdateIcon } from "@radix-ui/react-icons";

interface SwapQuote {
    inputAmount: string;
    outputAmount: string;
    priceImpact: string;
    slippage: string;
    route: string;
}

export function SwapInterface() {
    const account = useCurrentAccount();
    const [swapDirection, setSwapDirection] = useState<"sui-to-usdc" | "usdc-to-sui">("sui-to-usdc");
    const [amount, setAmount] = useState("");
    const [quote, setQuote] = useState<SwapQuote | null>(null);
    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState("");

    const getQuote = async () => {
        if (!amount || !account) return;

        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3000/api/quote/${swapDirection}?amount=${amount}`);
            const data = await response.json();

            // Map server response to our quote format
            setQuote({
                inputAmount: data.input_amount || amount,
                outputAmount: data.output_amount || "0",
                priceImpact: "0.5", // Mock value - would be calculated in real implementation
                slippage: "0.1", // Mock value
                route: `Direct ${data.input_token} → ${data.output_token}` || "Direct"
            });
        } catch (error) {
            console.error("Error getting quote:", error);
        } finally {
            setLoading(false);
        }
    };

    const executeSwap = async () => {
        if (!quote || !account) return;

        setLoading(true);
        try {
            // Prepare transaction
            const prepareResponse = await fetch(`http://localhost:3000/api/prepare/${swapDirection}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_address: account.address,
                    amount: amount
                })
            });

            const prepareData = await prepareResponse.json();

            // In a real implementation, user would sign the transaction here
            // For now, we'll just show the transaction data
            setTxHash(prepareData.transaction_data ? "mock_tx_hash_" + Date.now() : "");

        } catch (error) {
            console.error("Error executing swap:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (amount && amount !== "0") {
            const debounceTimer = setTimeout(() => {
                getQuote();
            }, 500);

            return () => clearTimeout(debounceTimer);
        }
    }, [amount, swapDirection]);

    if (!account) {
        return (
            <Callout.Root color="orange">
                <Callout.Icon>
                    <InfoCircledIcon />
                </Callout.Icon>
                <Callout.Text>
                    Please connect your wallet to use the swap feature.
                </Callout.Text>
            </Callout.Root>
        );
    }

    return (
        <Box>
            <Heading size="5" mb="4" style={{ color: "var(--blue-11)" }}>
                Token Swap
            </Heading>

            <Card style={{ padding: "24px", background: "var(--gray-a1)" }}>
                <Flex direction="column" gap="4">
                    {/* Swap Direction Selector */}
                    <Box>
                        <Text size="2" weight="medium" mb="2" style={{ color: "var(--gray-11)" }}>
                            Swap Direction
                        </Text>
                        <select
                            value={swapDirection}
                            onChange={(e) => setSwapDirection(e.target.value as "sui-to-usdc" | "usdc-to-sui")}
                            style={{
                                width: "100%",
                                padding: "12px",
                                border: "1px solid var(--gray-a6)",
                                borderRadius: "6px",
                                background: "white",
                                fontSize: "14px",
                                fontFamily: "inherit"
                            }}
                        >
                            <option value="sui-to-usdc">SUI → USDC</option>
                            <option value="usdc-to-sui">USDC → SUI</option>
                        </select>
                    </Box>

                    {/* Amount Input */}
                    <Box>
                        <Text size="2" weight="medium" mb="2" style={{ color: "var(--gray-11)" }}>
                            Amount ({swapDirection === "sui-to-usdc" ? "SUI" : "USDC"})
                        </Text>
                        <input
                            type="number"
                            step="0.000001"
                            placeholder="0.0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "12px",
                                border: "1px solid var(--gray-a6)",
                                borderRadius: "6px",
                                background: "white",
                                fontSize: "14px",
                                fontFamily: "inherit",
                                boxSizing: "border-box"
                            }}
                        />
                    </Box>

                    {/* Quote Display */}
                    {quote && (
                        <Card style={{ padding: "16px", background: "var(--blue-a2)" }}>
                            <Flex direction="column" gap="2">
                                <Text size="2" weight="bold" style={{ color: "var(--blue-11)" }}>
                                    Quote
                                </Text>
                                <Flex justify="between">
                                    <Text size="2">You'll receive:</Text>
                                    <Text size="2" weight="medium">
                                        {quote.outputAmount} {swapDirection === "sui-to-usdc" ? "USDC" : "SUI"}
                                    </Text>
                                </Flex>
                                <Flex justify="between">
                                    <Text size="2">Price Impact:</Text>
                                    <Badge color={parseFloat(quote.priceImpact) > 5 ? "red" : "green"}>
                                        {quote.priceImpact}%
                                    </Badge>
                                </Flex>
                                <Flex justify="between">
                                    <Text size="2">Route:</Text>
                                    <Text size="2">{quote.route}</Text>
                                </Flex>
                            </Flex>
                        </Card>
                    )}

                    {/* Action Buttons */}
                    <Flex gap="2">
                        <Button
                            variant="soft"
                            size="3"
                            onClick={getQuote}
                            disabled={!amount || loading}
                            style={{ flex: 1 }}
                        >
                            {loading ? <UpdateIcon className="animate-spin" /> : null}
                            Get Quote
                        </Button>

                        <Button
                            size="3"
                            onClick={executeSwap}
                            disabled={!quote || loading}
                            style={{ flex: 1 }}
                        >
                            {loading ? <UpdateIcon className="animate-spin" /> : null}
                            Execute Swap
                        </Button>
                    </Flex>

                    {/* Transaction Hash */}
                    {txHash && (
                        <Callout.Root color="green">
                            <Callout.Text>
                                Transaction submitted! Hash: <code>{txHash}</code>
                            </Callout.Text>
                        </Callout.Root>
                    )}
                </Flex>
            </Card>
        </Box>
    );
} 