import {
    Box,
    Card,
    Flex,
    Heading,
    Text,
    Badge,
    Button
} from "@radix-ui/themes";
import { useState, useEffect } from "react";
import { UpdateIcon } from "@radix-ui/react-icons";
import { initCetusSDK } from '@cetusprotocol/cetus-sui-clmm-sdk'

const cetusClmmSDK = initCetusSDK({ network: 'testnet' })

interface Pool {
    id: string;
    token0: string;
    token1: string;
    liquidity: string;
    volume24h: string;
    apy: string;
    dex: string;
}

interface DexConfig {
    name: string;
    status: string;
    feeRate: string;
    totalPools: number;
}

export function PoolInfo() {
    const [pools, setPools] = useState<Pool[]>([]);
    const [dexConfig, setDexConfig] = useState<DexConfig[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchPoolData = async () => {
        setLoading(true);
        try {
                // Fetch available pools
            const cetusClmmSDK = initCetusSDK({ network: 'mainnet', wallet })
            // Mock pool data since server returns contract data
            const mockPools: Pool[] = [
                {
                    id: "pool_1",
                    token0: "SUI",
                    token1: "USDC",
                    liquidity: "1,250,000",
                    volume24h: "450,000",
                    apy: "12.5",
                    dex: "Turbos"
                },
                {
                    id: "pool_2",
                    token0: "SUI",
                    token1: "USDC",
                    liquidity: "890,000",
                    volume24h: "320,000",
                    apy: "10.8",
                    dex: "FlowX"
                },
                {
                    id: "pool_3",
                    token0: "SUI",
                    token1: "USDC",
                    liquidity: "650,000",
                    volume24h: "180,000",
                    apy: "8.9",
                    dex: "Aftermath"
                }
            ];
            setPools(mockPools);

            // Mock DEX configuration data
            const mockDexConfig: DexConfig[] = [
                {
                    name: "Turbos Finance",
                    status: "active",
                    feeRate: "0.3",
                    totalPools: 15
                },
                {
                    name: "FlowX Finance",
                    status: "active",
                    feeRate: "0.25",
                    totalPools: 12
                },
                {
                    name: "Aftermath Finance",
                    status: "active",
                    feeRate: "0.2",
                    totalPools: 8
                }
            ];
            setDexConfig(mockDexConfig);

        } catch (error) {
            console.error("Error fetching pool data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPoolData();
    }, []);

    return (
        <Box>
            <Flex justify="between" align="center" mb="4">
                <Heading size="5" style={{ color: "var(--blue-11)" }}>
                    Pool Information
                </Heading>
                <Button variant="soft" onClick={fetchPoolData} disabled={loading}>
                    {loading ? <UpdateIcon className="animate-spin" /> : <UpdateIcon />}
                    Refresh
                </Button>
            </Flex>

            {/* DEX Configuration */}
            <Card style={{ padding: "24px", background: "var(--gray-a1)", marginBottom: "20px" }}>
                <Heading size="4" mb="3" style={{ color: "var(--gray-12)" }}>
                    DEX Configuration
                </Heading>

                <Flex gap="3" wrap="wrap">
                    {dexConfig.map((dex, index) => (
                        <Card key={index} style={{ padding: "16px", minWidth: "200px", background: "white" }}>
                            <Flex direction="column" gap="2">
                                <Flex justify="between" align="center">
                                    <Text size="3" weight="bold">{dex.name}</Text>
                                    <Badge color={dex.status === "active" ? "green" : "orange"}>
                                        {dex.status}
                                    </Badge>
                                </Flex>
                                <Text size="2" style={{ color: "var(--gray-11)" }}>
                                    Fee Rate: {dex.feeRate}%
                                </Text>
                                <Text size="2" style={{ color: "var(--gray-11)" }}>
                                    Total Pools: {dex.totalPools}
                                </Text>
                            </Flex>
                        </Card>
                    ))}
                </Flex>
            </Card>

            {/* Available Pools */}
            <Card style={{ padding: "24px", background: "var(--gray-a1)" }}>
                <Heading size="4" mb="3" style={{ color: "var(--gray-12)" }}>
                    Available Trading Pairs
                </Heading>

                {pools.length > 0 ? (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            background: "white",
                            borderRadius: "8px",
                            overflow: "hidden"
                        }}>
                            <thead>
                                <tr style={{ background: "var(--gray-a3)" }}>
                                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>
                                        Pair
                                    </th>
                                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>
                                        DEX
                                    </th>
                                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>
                                        Liquidity
                                    </th>
                                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>
                                        24h Volume
                                    </th>
                                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>
                                        APY
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {pools.map((pool) => (
                                    <tr key={pool.id} style={{ borderTop: "1px solid var(--gray-a4)" }}>
                                        <td style={{ padding: "12px" }}>
                                            <Flex gap="1" align="center">
                                                <Badge variant="soft" color="blue">{pool.token0}</Badge>
                                                <Text>/</Text>
                                                <Badge variant="soft" color="green">{pool.token1}</Badge>
                                            </Flex>
                                        </td>
                                        <td style={{ padding: "12px" }}>
                                            <Badge variant="outline">{pool.dex}</Badge>
                                        </td>
                                        <td style={{ padding: "12px" }}>
                                            <Text size="2" weight="medium">${pool.liquidity}</Text>
                                        </td>
                                        <td style={{ padding: "12px" }}>
                                            <Text size="2">${pool.volume24h}</Text>
                                        </td>
                                        <td style={{ padding: "12px" }}>
                                            <Badge color="green">{pool.apy}%</Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <Flex
                        justify="center"
                        align="center"
                        style={{ height: "200px", color: "var(--gray-9)" }}
                    >
                        <Text>No pools available</Text>
                    </Flex>
                )}
            </Card>
        </Box>
    );
} 