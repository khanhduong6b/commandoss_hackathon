import { useCurrentAccount } from "@mysten/dapp-kit";
import { Box, Card, Flex, Heading, Text, Badge, Callout } from "@radix-ui/themes";
import { CheckCircledIcon, CrossCircledIcon } from "@radix-ui/react-icons";
import { OwnedObjects } from "./OwnedObjects";

export function WalletStatus() {
  const account = useCurrentAccount();

  return (
    <Box my="3">
      <Card style={{ padding: "20px", background: "white", boxShadow: "0 1px 4px var(--gray-a3)" }}>
        <Flex direction="column" gap="3">
          <Heading size="4" style={{ color: "var(--gray-12)" }}>
            Wallet Status
          </Heading>

          {account ? (
            <Flex direction="column" gap="2">
              <Flex gap="2" align="center">
                <CheckCircledIcon style={{ color: "var(--green-11)" }} />
                <Text size="3" weight="medium" style={{ color: "var(--green-11)" }}>
                  Wallet Connected
                </Text>
                <Badge color="green" variant="soft">Active</Badge>
              </Flex>

              <Box style={{
                background: "var(--gray-a2)",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid var(--gray-a4)"
              }}>
                <Text size="2" style={{ color: "var(--gray-11)" }}>
                  Wallet Address:
                </Text>
                <Text
                  size="2"
                  style={{
                    fontFamily: "monospace",
                    color: "var(--gray-12)",
                    wordBreak: "break-all"
                  }}
                >
                  {account.address}
                </Text>
              </Box>
            </Flex>
          ) : (
            <Callout.Root color="orange">
              <Callout.Icon>
                <CrossCircledIcon />
              </Callout.Icon>
              <Callout.Text>
                Wallet not connected. Please connect your wallet to access all features.
              </Callout.Text>
            </Callout.Root>
          )}

          <OwnedObjects />
        </Flex>
      </Card>
    </Box>
  );
}
