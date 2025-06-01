import { ConnectButton } from "@mysten/dapp-kit";
import { Box, Container, Flex, Heading, Tabs } from "@radix-ui/themes";
import { WalletStatus } from "./WalletStatus";
import { SwapInterface } from "./components/SwapInterface";
import { PoolInfo } from "./components/PoolInfo";
import { TransactionHistory } from "./components/TransactionHistory";
import { UserTokens } from "./components/UserTokens";
import { AICommand } from "./components/AICommand";

function App() {
  return (
    <>
      <Flex
        position="sticky"
        px="4"
        py="3"
        justify="between"
        style={{
          borderBottom: "1px solid var(--gray-a3)",
          background: "var(--color-background)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Box>
          <Heading size="6" style={{ color: "var(--blue-11)" }}>
          Multi Dex MCP
          </Heading>
        </Box>

        <Box>
          <ConnectButton />
        </Box>
      </Flex>

      <Container size="4" style={{ background: "var(--gray-a1)" }}>
        <WalletStatus />

        <Container
          mt="4"
          p="4"
          style={{
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 2px 8px var(--gray-a4)",
            minHeight: "600px"
          }}
        >
          <Tabs.Root defaultValue="swap">
            <Tabs.List size="2" style={{ marginBottom: "20px" }}>
              <Tabs.Trigger value="swap">Swap Tokens</Tabs.Trigger>
              <Tabs.Trigger value="tokens">My Tokens</Tabs.Trigger>
              <Tabs.Trigger value="history">History</Tabs.Trigger>
              <Tabs.Trigger value="ai">AI Assistant</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="swap">
              <SwapInterface />
            </Tabs.Content>

            <Tabs.Content value="pools">
              <PoolInfo />
            </Tabs.Content>

            <Tabs.Content value="tokens">
              <UserTokens />
            </Tabs.Content>

            <Tabs.Content value="history">
              <TransactionHistory />
            </Tabs.Content>

            <Tabs.Content value="ai">
              <AICommand />
            </Tabs.Content>
          </Tabs.Root>
        </Container>
      </Container>
    </>
  );
}

export default App;
