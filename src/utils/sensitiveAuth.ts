import * as LocalAuthentication from "expo-local-authentication";
import { useAuthStore } from "../state/authStore";

export async function requireSensitiveAuth(
  promptMessage: string
): Promise<boolean> {
  const { biometricEnabled } = useAuthStore.getState();
  if (!biometricEnabled) {
    return true;
  }
  const [hasHardware, isEnrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  if (!hasHardware || !isEnrolled) {
    return true;
  }
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    fallbackLabel: "Use PIN",
    cancelLabel: "Cancel",
  });
  return result.success;
}
