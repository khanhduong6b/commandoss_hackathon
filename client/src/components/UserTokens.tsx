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
import { UpdateIcon, InfoCircledIcon } from "@radix-ui/react-icons";

interface UserToken {
    symbol: string;
    name: string;
    balance: string;
    usdValue: string;
    address: string;
    decimals: number;
}

export function UserTokens() {
    const account = useCurrentAccount();
    const [tokens, setTokens] = useState<UserToken[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalValue, setTotalValue] = useState("0");

    const fetchUserTokens = async () => {
        if (!account) return;

        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3000/api/user/tokens?user_address=${account.address}`);
            const data = await response.json();

            // Map server response to our format
            if (data.balances) {
                const tokenList: UserToken[] = [];

                // Add SUI token
                if (data.balances.SUI) {
                    tokenList.push({
                        symbol: "SUI",
                        name: "Sui",
                        balance: data.balances.SUI.balance.toString(),
                        usdValue: (parseFloat(data.balances.SUI.balance) * 2.5).toFixed(2), // Mock USD price
                        address: "0x2::sui::SUI",
                        decimals: 9
                    });
                }

                // Add USDC token  
                if (data.balances.USDC) {
                    tokenList.push({
                        symbol: "USDC",
                        name: "USD Coin",
                        balance: data.balances.USDC.balance.toString(),
                        usdValue: data.balances.USDC.balance.toString(), // USDC = $1
                        address: "USDC_CONTRACT_ADDRESS",
                        decimals: 6
                    });
                }

                setTokens(tokenList);

                // Calculate total value
                const total = tokenList.reduce((sum, token) => sum + parseFloat(token.usdValue), 0);
                setTotalValue(total.toFixed(2));
            }
        } catch (error) {
            console.error("Error fetching user tokens:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (account) {
            fetchUserTokens();
        }
    }, [account]);

    if (!account) {
        return (
            <Callout.Root color="orange">
                <Callout.Icon>
                    <InfoCircledIcon />
                </Callout.Icon>
                <Callout.Text>
                    Please connect your wallet to view your token balances.
                </Callout.Text>
            </Callout.Root>
        );
    }

    return (
        <Box>
            <Flex justify="between" align="center" mb="4">
                <Heading size="5" style={{ color: "var(--blue-11)" }}>
                    My Tokens
                </Heading>
                <Button variant="soft" onClick={fetchUserTokens} disabled={loading}>
                    {loading ? <UpdateIcon className="animate-spin" /> : <UpdateIcon />}
                    Refresh
                </Button>
            </Flex>

            {/* Portfolio Summary */}
            <Card style={{ padding: "24px", background: "var(--blue-a2)", marginBottom: "20px" }}>
                <Flex direction="column" gap="2">
                    <Text size="2" style={{ color: "var(--blue-11)" }}>Total Portfolio Value</Text>
                    <Heading size="6" style={{ color: "var(--blue-12)" }}>
                        ${totalValue}
                    </Heading>
                    <Text size="2" style={{ color: "var(--gray-11)" }}>
                        Wallet: {account.address.slice(0, 8)}...{account.address.slice(-8)}
                    </Text>
                </Flex>
            </Card>

            {/* Token List */}
            <Card style={{ padding: "24px", background: "var(--gray-a1)" }}>
                <Heading size="4" mb="3" style={{ color: "var(--gray-12)" }}>
                    Token Balances
                </Heading>

                {loading ? (
                    <Flex justify="center" align="center" style={{ height: "200px" }}>
                        <UpdateIcon className="animate-spin" />
                        <Text ml="2">Loading tokens...</Text>
                    </Flex>
                ) : tokens.length > 0 ? (
                    <Flex direction="column" gap="3">
                        {tokens.map((token, index) => (
                            <Card key={index} style={{ padding: "16px", background: "white" }}>
                                <Flex justify="between" align="center">
                                    <Flex direction="column" gap="1">
                                        <Flex gap="2" align="center">
                                            <Badge variant="soft" size="2" color="blue">
                                                {token.symbol}
                                            </Badge>
                                            <Text size="3" weight="medium">{token.name}</Text>
                                        </Flex>
                                        <Text size="2" style={{ color: "var(--gray-11)" }}>
                                            {token.address.slice(0, 12)}...{token.address.slice(-8)}
                                        </Text>
                                    </Flex>

                                    <Flex direction="column" align="end" gap="1">
                                        <Text size="3" weight="bold">
                                            {parseFloat(token.balance).toLocaleString()} {token.symbol}
                                        </Text>
                                        <Text size="2" style={{ color: "var(--gray-11)" }}>
                                            ${parseFloat(token.usdValue).toLocaleString()}
                                        </Text>
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
                        <Text>No tokens found</Text>
                        <Text size="2">
                            Your wallet appears to be empty or tokens are still loading
                        </Text>
                    </Flex>
                )}
            </Card>
        </Box>
    );
} 