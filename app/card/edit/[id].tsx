import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";

import CardForm from "../../../src/components/CardForm";
import Screen from "../../../src/components/Screen";
import { useVaultStore } from "../../../src/state/vaultStore";
import type { Card } from "../../../src/types/vault";
import { useTheme } from "../../../src/utils/useTheme";

export default function EditCardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { vault, upsertCard, loadVault, loading } = useVaultStore();

  useEffect(() => {
    if (!vault && !loading) {
      loadVault();
    }
  }, [loadVault, loading, vault]);

  const card = vault?.cards.find((item) => item.id === id);

  if (!card) {
    return (
      <Screen>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: theme.font.regular,
              color: theme.colors.muted,
            }}
          >
            Card not found.
          </Text>
        </View>
      </Screen>
    );
  }

  const handleSubmit = async (
    payload: Omit<Card, "id" | "createdAt" | "updatedAt">
  ) => {
    await upsertCard({ ...card, ...payload });
    router.back();
  };

  return (
    <Screen>
      <View style={{ flex: 1 }}>
        <CardForm
          initial={card}
          onSubmit={handleSubmit}
          submitLabel="Update card"
        />
      </View>
    </Screen>
  );
}
