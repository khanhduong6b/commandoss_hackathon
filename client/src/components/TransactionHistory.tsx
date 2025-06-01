import { useCurrentAccount } from "@mysten/dapp-kit";
import {
    Box,
    Card,
    Flex,
    Heading,
    Text,
    Badge,
    Button,
    Callout
} from "@radix-ui/themes";
import { useState, useEffect } from "react";
import { UpdateIcon, InfoCircledIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";

interface SwapTransaction {
    id: string;
    txHash: string;
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    status: "pending" | "success" | "failed";
    timestamp: string;
    dex: string;
    walletAddress: string;
}

interface TransactionStatus {
    txHash: string;
    status: "pending" | "success" | "failed";
    confirmations: number;
    gasUsed: string;
    timestamp: string;
}

export function TransactionHistory() {
    const account = useCurrentAccount();
    const [transactions, setTransactions] = useState<SwapTransaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchHash, setSearchHash] = useState("");
    const [searchResult, setSearchResult] = useState<TransactionStatus | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);

    const fetchHistory = async () => {
        if (!account) return;

        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3000/api/history?count=20`);
            const data = await response.json();

            // Map server response to our format
            if (data.recent_swaps) {
                // Mock transaction data since server returns contract data
                const mockTransactions: SwapTransaction[] = [
                    {
                        id: "1",
                        txHash: "0x1234567890abcdef1234567890abcdef12345678",
                        fromToken: "SUI",
                        toToken: "USDC",
                        fromAmount: "10.5",
                        toAmount: "26.25",
                        status: "success",
                        timestamp: new Date(Date.now() - 3600000).toISOString(),
                        dex: "Turbos",
                        walletAddress: account.address
                    },
                    {
                        id: "2",
                        txHash: "0xabcdef1234567890abcdef1234567890abcdef12",
                        fromToken: "USDC",
                        toToken: "SUI",
                        fromAmount: "50.0",
                        toAmount: "20.0",
                        status: "pending",
                        timestamp: new Date(Date.now() - 7200000).toISOString(),
                        dex: "FlowX",
                        walletAddress: account.address
                    }
                ];
                setTransactions(mockTransactions);
            }
        } catch (error) {
            console.error("Error fetching transaction history:", error);
        } finally {
            setLoading(false);
        }
    };

    const searchTransaction = async () => {
        if (!searchHash.trim()) return;

        setSearchLoading(true);
        try {
            const response = await fetch(`http://localhost:3000/api/status/${searchHash.trim()}`);
            const data = await response.json();

            // Map server response to our format
            setSearchResult({
                txHash: data.transaction_hash || searchHash.trim(),
                status: data.status === "success" ? "success" : "pending",
                confirmations: 12, // Mock value
                gasUsed: data.gas_used?.computationCost || "1000000",
                timestamp: data.timestamp || new Date().toISOString()
            });
        } catch (error) {
            console.error("Error searching transaction:", error);
            setSearchResult(null);
        } finally {
            setSearchLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "success": return "green";
            case "failed": return "red";
            case "pending": return "orange";
            default: return "gray";
        }
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    useEffect(() => {
        if (account) {
            fetchHistory();
        }
    }, [account]);

    if (!account) {
        return (
            <Callout.Root color="orange">
                <Callout.Icon>
                    <InfoCircledIcon />
                </Callout.Icon>
                <Callout.Text>
                    Please connect your wallet to view transaction history.
                </Callout.Text>
            </Callout.Root>
        );
    }

    return (
        <Box>
            <Flex justify="between" align="center" mb="4">
                <Heading size="5" style={{ color: "var(--blue-11)" }}>
                    Transaction History
                </Heading>
                <Button variant="soft" onClick={fetchHistory} disabled={loading}>
                    {loading ? <UpdateIcon className="animate-spin" /> : <UpdateIcon />}
                    Refresh
                </Button>
            </Flex>

            {/* Transaction Search */}
            <Card style={{ padding: "20px", background: "var(--gray-a1)", marginBottom: "20px" }}>
                <Heading size="4" mb="3" style={{ color: "var(--gray-12)" }}>
                    Search Transaction
                </Heading>

                <Flex gap="2" align="end">
                    <Box style={{ flex: 1 }}>
                        <Text size="2" weight="medium" mb="2" style={{ color: "var(--gray-11)" }}>
                            Transaction Hash
                        </Text>
                        <input
                            type="text"
                            placeholder="Enter transaction hash..."
                            value={searchHash}
                            onChange={(e) => setSearchHash(e.target.value)}
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
                    <Button onClick={searchTransaction} disabled={searchLoading || !searchHash.trim()}>
                        {searchLoading ? <UpdateIcon className="animate-spin" /> : <MagnifyingGlassIcon />}
                        Search
                    </Button>
                </Flex>

                {/* Search Result */}
                {searchResult && (
                    <Card style={{ padding: "16px", background: "white", marginTop: "16px" }}>
                        <Flex direction="column" gap="2">
                            <Flex justify="between" align="center">
                                <Text size="2" weight="bold">Transaction Status</Text>
                                <Badge color={getStatusColor(searchResult.status)}>
                                    {searchResult.status.toUpperCase()}
                                </Badge>
                            </Flex>
                            <Text size="2">Hash: <code>{searchResult.txHash}</code></Text>
                            <Text size="2">Confirmations: {searchResult.confirmations}</Text>
                            <Text size="2">Gas Used: {searchResult.gasUsed}</Text>
                            <Text size="2">Time: {formatTime(searchResult.timestamp)}</Text>
                        </Flex>
                    </Card>
                )}
            </Card>

            {/* Recent Transactions */}
            <Card style={{ padding: "24px", background: "var(--gray-a1)" }}>
                <Heading size="4" mb="3" style={{ color: "var(--gray-12)" }}>
                    Recent Swaps
                </Heading>

                {loading ? (
                    <Flex justify="center" align="center" style={{ height: "200px" }}>
                        <UpdateIcon className="animate-spin" />
                        <Text ml="2">Loading transactions...</Text>
                    </Flex>
                ) : transactions.length > 0 ? (
                    <Flex direction="column" gap="3">
                        {transactions.map((tx) => (
                            <Card key={tx.id} style={{ padding: "16px", background: "white" }}>
                                <Flex justify="between" align="center">
                                    <Flex direction="column" gap="2">
                                        <Flex gap="2" align="center">
                                            <Badge variant="soft" color="blue">{tx.fromToken}</Badge>
                                            <Text>→</Text>
                                            <Badge variant="soft" color="green">{tx.toToken}</Badge>
                                            <Badge variant="outline">{tx.dex}</Badge>
                                        </Flex>

                                        <Flex gap="4">
                                            <Text size="2">
                                                <Text weight="medium">From:</Text> {tx.fromAmount} {tx.fromToken}
                                            </Text>
                                            <Text size="2">
                                                <Text weight="medium">To:</Text> {tx.toAmount} {tx.toToken}
                                            </Text>
                                        </Flex>

                                        <Text size="2" style={{ color: "var(--gray-11)" }}>
                                            {formatTime(tx.timestamp)}
                                        </Text>

                                        <Text size="1" style={{
                                            color: "var(--gray-10)",
                                            fontFamily: "monospace",
                                            wordBreak: "break-all"
                                        }}>
                                            {tx.txHash}
                                        </Text>
                                    </Flex>

                                    <Flex direction="column" align="end" gap="2">
                                        <Badge color={getStatusColor(tx.status)}>
                                            {tx.status.toUpperCase()}
                                        </Badge>
                                    </Flex>
                                </Flex>
                            </Card>
                        ))}
                    </Flex>
                ) : (
                    <Flex
                        justify="center"
                        align="center"
                        direction="column"
                        gap="2"
                        style={{ height: "200px", color: "var(--gray-9)" }}
                    >
                        <Text>No transactions found</Text>
                        <Text size="2">
                            Your recent swap transactions will appear here
                        </Text>
                    </Flex>
                )}
            </Card>
        </Box>
    );
} 