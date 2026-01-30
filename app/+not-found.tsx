import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import Screen from "../src/components/Screen";
import { useTheme } from "../src/utils/useTheme";
import { responsiveFontSize } from "../src/utils/responsive";

export default function NotFoundScreen() {
  const theme = useTheme();
  const styles = getStyles(theme);
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <Screen>
        <View style={styles.container}>
          <Text style={styles.text}>This screen does not exist.</Text>
          <Link href="/" style={styles.link}>
            Go to home
          </Link>
        </View>
      </Screen>
    </>
  );
}

const getStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
    },
    text: {
      fontSize: responsiveFontSize(16),
      fontFamily: theme.font.regular,
      color: theme.colors.ink,
    },
    link: {
      marginTop: theme.spacing.sm,
      fontSize: responsiveFontSize(16),
      color: theme.colors.accent,
      fontFamily: theme.font.bold,
    },
  });
