import { useEffect } from "react";
import { Text, View } from "react-native";

import BackButton from "../../src/components/BackButton";
import Screen from "../../src/components/Screen";
import { useVaultStore } from "../../src/state/vaultStore";
import { useTheme } from "../../src/utils/useTheme";
import { TagManagerSettingsSection } from "../../src/features/settings/sections/TagManagerSettingsSection";
import {
  responsiveFontSize,
  responsiveSpacing,
} from "../../src/utils/responsive";

export default function TagsManagerScreen() {
  const theme = useTheme();
  const { vault, loadVault, loading } = useVaultStore();

  useEffect(() => {
    if (!vault && !loading) {
      loadVault();
    }
  }, [vault, loading, loadVault]);

  return (
    <Screen>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
        }}
      >
        <BackButton />
        <Text
          style={{
            fontSize: responsiveFontSize(18),
            fontFamily: theme.font.bold,
            color: theme.colors.ink,
          }}
        >
          Manage Tags
        </Text>
        <View style={{ width: responsiveSpacing(40) }} />
      </View>

      <TagManagerSettingsSection />
    </Screen>
  );
}
