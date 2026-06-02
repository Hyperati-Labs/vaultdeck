import Constants, { AppOwnership } from "expo-constants";
import { StatusBar } from "expo-status-bar";

type AppSystemBarsProps = {
  style: "light" | "dark";
};

/**
 * Expo Go does not ship the RNEdgeToEdge native module. Importing
 * react-native-edge-to-edge at the top level crashes Android on full reload (R).
 */
export function AppSystemBars({ style }: AppSystemBarsProps) {
  if (Constants.appOwnership === AppOwnership.Expo) {
    return <StatusBar style={style} />;
  }

  const { SystemBars } =
    require("react-native-edge-to-edge") as typeof import("react-native-edge-to-edge");
  return <SystemBars style={style} />;
}
