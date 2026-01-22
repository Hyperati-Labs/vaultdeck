import { Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import Screen from "../src/components/Screen";
import { useTheme } from "../src/utils/useTheme";

type ErrorScreenProps = {
  error: Error;
};

export default function ErrorScreen({ error }: ErrorScreenProps) {
  const theme = useTheme();
  const styles = getStyles(theme);
  return (
    <>
      <Stack.Screen options={{ title: "Error" }} />
      <Screen>
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{error.message}</Text>
          <Text style={styles.stack}>{error.stack}</Text>
        </View>
      </Screen>
    </>
  );
}

const getStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    title: {
      fontFamily: theme.font.bold,
      fontSize: 20,
      color: theme.colors.ink,
    },
    message: {
      marginTop: theme.spacing.sm,
      fontFamily: theme.font.regular,
      color: theme.colors.muted,
    },
    stack: {
      marginTop: theme.spacing.md,
      fontFamily: theme.font.regular,
      color: theme.colors.muted,
    },
  });
