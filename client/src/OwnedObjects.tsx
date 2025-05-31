import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { Flex, Heading, Text, Badge, Card, Box } from "@radix-ui/themes";
import { UpdateIcon } from "@radix-ui/react-icons";

export function OwnedObjects() {
  const account = useCurrentAccount();
  const { data, isPending, error } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address as string,
    },
    {
      enabled: !!account,
    },
  );

  if (!account) {
    return null;
  }

  if (error) {
    return (
      <Card style={{ padding: "16px", background: "var(--red-a2)" }}>
        <Text style={{ color: "var(--red-11)" }}>
          Error loading objects: {error.message}
        </Text>
      </Card>
    );
  }

  if (isPending || !data) {
    return (
      <Card style={{ padding: "16px", background: "var(--gray-a2)" }}>
        <Flex align="center" gap="2">
          <UpdateIcon className="animate-spin" />
          <Text>Loading objects...</Text>
        </Flex>
      </Card>
    );
  }

  return (
    <Box>
      <Flex justify="between" align="center" mb="3">
        <Heading size="3" style={{ color: "var(--gray-12)" }}>
          Owned Objects
        </Heading>
        <Badge variant="soft" color="blue">
          {data.data.length} objects
        </Badge>
      </Flex>

      {data.data.length === 0 ? (
        <Card style={{ padding: "16px", background: "var(--yellow-a2)" }}>
          <Text style={{ color: "var(--yellow-11)" }}>
            No objects owned by the connected wallet
          </Text>
        </Card>
      ) : (
        <Flex direction="column" gap="2">
          {data.data.slice(0, 5).map((object, index) => (
            <Card key={object.data?.objectId || index} style={{
              padding: "12px",
              background: "var(--gray-a2)",
              border: "1px solid var(--gray-a4)"
            }}>
              <Flex justify="between" align="center">
                <Flex direction="column" gap="1">
                  <Text size="2" weight="medium" style={{ color: "var(--gray-12)" }}>
                    Object #{index + 1}
                  </Text>
                  <Text
                    size="1"
                    style={{
                      fontFamily: "monospace",
                      color: "var(--gray-11)",
                      wordBreak: "break-all"
                    }}
                  >
                    {object.data?.objectId}
                  </Text>
                </Flex>
                <Badge variant="outline" size="1">
                  {object.data?.type?.split("::").pop() || "Object"}
                </Badge>
              </Flex>
            </Card>
          ))}

          {data.data.length > 5 && (
            <Text size="2" style={{ color: "var(--gray-11)", textAlign: "center", padding: "8px" }}>
              ... and {data.data.length - 5} more objects
            </Text>
          )}
        </Flex>
      )}
    </Box>
  );
}
