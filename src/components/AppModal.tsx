import { Modal, type ModalProps } from "react-native";

/**
 * Modal with edge-to-edge-safe system bar handling on Android 15+.
 * @see https://github.com/zoontek/react-native-edge-to-edge#modal-component-quirks
 */
export function AppModal(props: ModalProps) {
  return <Modal statusBarTranslucent navigationBarTranslucent {...props} />;
}
