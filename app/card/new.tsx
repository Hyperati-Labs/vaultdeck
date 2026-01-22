import { useRouter } from "expo-router";
import { View } from "react-native";

import CardForm from "../../src/components/CardForm";
import Screen from "../../src/components/Screen";
import { useVaultStore } from "../../src/state/vaultStore";
import type { Card } from "../../src/types/vault";
import { generateId } from "../../src/utils/id";

export default function NewCardScreen() {
  const router = useRouter();
  const { upsertCard } = useVaultStore();

  const handleSubmit = async (
    payload: Omit<Card, "id" | "createdAt" | "updatedAt">
  ) => {
    const id = await generateId();
    await upsertCard({ id, createdAt: "", updatedAt: "", ...payload });
    router.replace(`/card/${id}`);
  };

  return (
    <Screen>
      <View style={{ flex: 1 }}>
        <CardForm onSubmit={handleSubmit} submitLabel="Save card" />
      </View>
    </Screen>
  );
}
