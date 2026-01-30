import { useReducer } from "react";
import { Alert } from "react-native";

import {
  VaultCorruptError,
  VaultPassphraseRequiredError,
} from "../../storage/vaultStorage";
import {
  selectBackupFile,
  saveBackupFile,
  ExportNotSupportedError,
  InvalidBackupFileError,
} from "./backupService";

type BackupAction = "export" | "import" | null;

type UseBackupFlowParams = {
  exportVault: (passphrase: string) => Promise<string>;
  importVault: (uri: string, passphrase: string) => Promise<void>;
  setAutoLockBypass: (bypass: boolean) => void;
};

type UseBackupFlowResult = {
  backupAction: BackupAction;
  backupPassphrase: string;
  backupPassphraseConfirm: string;
  pendingImportUri: string | null;
  backupBusy: boolean;
  successMessage: string | null;
  importWarningAcknowledged: boolean;
  isExportPassphraseValid: boolean;
  isImportPassphraseValid: boolean;
  isBackupActionValid: boolean;
  setBackupPassphrase: (value: string) => void;
  setBackupPassphraseConfirm: (value: string) => void;
  toggleImportWarning: () => void;
  startExport: () => void;
  startImport: () => Promise<void>;
  confirmBackupAction: () => Promise<void>;
  cancelBackupAction: () => void;
  dismissSuccessMessage: () => void;
};

type State = {
  backupAction: BackupAction;
  backupPassphrase: string;
  backupPassphraseConfirm: string;
  pendingImportUri: string | null;
  backupBusy: boolean;
  successMessage: string | null;
  importWarningAcknowledged: boolean;
};

type Action =
  | { type: "START_EXPORT" }
  | { type: "START_IMPORT" }
  | { type: "SET_ACTION"; value: BackupAction }
  | { type: "SET_PASSPHRASE"; value: string }
  | { type: "SET_PASSPHRASE_CONFIRM"; value: string }
  | { type: "SET_PENDING_IMPORT_URI"; value: string | null }
  | { type: "SET_IMPORT_WARNING"; value: boolean }
  | { type: "TOGGLE_IMPORT_WARNING" }
  | { type: "SET_BUSY"; value: boolean }
  | { type: "SET_SUCCESS"; value: string | null }
  | { type: "RESET" }
  | { type: "DISMISS_SUCCESS" };

const initialState: State = {
  backupAction: null,
  backupPassphrase: "",
  backupPassphraseConfirm: "",
  pendingImportUri: null,
  backupBusy: false,
  successMessage: null,
  importWarningAcknowledged: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START_EXPORT":
      return {
        ...state,
        backupAction: "export",
        pendingImportUri: null,
        importWarningAcknowledged: false,
      };
    case "START_IMPORT":
      return {
        ...state,
        backupAction: "import",
        importWarningAcknowledged: false,
      };
    case "SET_PASSPHRASE":
      return { ...state, backupPassphrase: action.value };
    case "SET_PASSPHRASE_CONFIRM":
      return { ...state, backupPassphraseConfirm: action.value };
    case "SET_PENDING_IMPORT_URI":
      return { ...state, pendingImportUri: action.value };
    case "SET_IMPORT_WARNING":
      return { ...state, importWarningAcknowledged: action.value };
    case "TOGGLE_IMPORT_WARNING":
      return {
        ...state,
        importWarningAcknowledged: !state.importWarningAcknowledged,
      };
    case "SET_BUSY":
      return { ...state, backupBusy: action.value };
    case "SET_SUCCESS":
      return { ...state, successMessage: action.value };
    case "DISMISS_SUCCESS":
      return { ...state, successMessage: null };
    case "SET_ACTION":
      return { ...state, backupAction: action.value };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export function useBackupFlow({
  exportVault,
  importVault,
  setAutoLockBypass,
}: UseBackupFlowParams): UseBackupFlowResult {
  const [state, dispatch] = useReducer(reducer, initialState);

  const trimmedPassphrase = state.backupPassphrase.trim();
  const isExportPassphraseValid =
    trimmedPassphrase.length >= 8 &&
    trimmedPassphrase === state.backupPassphraseConfirm.trim();
  const isImportPassphraseValid = trimmedPassphrase.length >= 8;
  const isBackupActionValid =
    state.backupAction === "export"
      ? isExportPassphraseValid
      : isImportPassphraseValid && state.importWarningAcknowledged;

  const startExport = () => {
    dispatch({ type: "START_EXPORT" });
  };

  const startImport = async () => {
    setAutoLockBypass(true);
    try {
      const uri = await selectBackupFile();
      if (!uri) {
        return;
      }
      dispatch({ type: "SET_PENDING_IMPORT_URI", value: uri });
      dispatch({ type: "START_IMPORT" });
    } catch (err) {
      if (err instanceof InvalidBackupFileError) {
        Alert.alert("Import failed", "Please select a VaultDeck backup file.");
        return;
      }
      Alert.alert("Import failed", "Invalid backup file.");
    } finally {
      setAutoLockBypass(false);
    }
  };

  const resetState = () => {
    dispatch({ type: "RESET" });
  };

  const confirmBackupAction = async () => {
    if (state.backupAction === "export" && !isExportPassphraseValid) {
      Alert.alert(
        "Backup password",
        "Use at least 8 characters and match both fields."
      );
      return;
    }
    if (state.backupAction === "import" && !isImportPassphraseValid) {
      Alert.alert("Backup password", "Use at least 8 characters.");
      return;
    }

    const action = state.backupAction;
    const pendingUri = state.pendingImportUri;

    try {
      dispatch({ type: "SET_BUSY", value: true });

      if (action === "export") {
        const path = await exportVault(trimmedPassphrase);
        const saved = await saveBackupFile(path);
        if (saved) {
          dispatch({ type: "SET_SUCCESS", value: "Backup saved." });
        }
        dispatch({ type: "SET_ACTION", value: null });
        dispatch({ type: "SET_PENDING_IMPORT_URI", value: null });
        dispatch({ type: "SET_IMPORT_WARNING", value: false });
        return;
      }

      if (action === "import" && pendingUri) {
        await importVault(pendingUri, trimmedPassphrase);
        dispatch({ type: "SET_SUCCESS", value: "Backup imported." });
        dispatch({ type: "SET_ACTION", value: null });
        dispatch({ type: "SET_PENDING_IMPORT_URI", value: null });
        dispatch({ type: "SET_IMPORT_WARNING", value: false });
      }
    } catch (err) {
      if (err instanceof VaultPassphraseRequiredError) {
        Alert.alert(
          "Backup password",
          "A password is required to import this backup."
        );
      } else if (err instanceof VaultCorruptError) {
        Alert.alert("Import failed", "Backup file is invalid or corrupted.");
      } else if (err instanceof ExportNotSupportedError) {
        Alert.alert("Export", "Web export not fully supported in this demo.");
      } else if (err instanceof InvalidBackupFileError) {
        Alert.alert("Import failed", "Please select a VaultDeck backup file.");
      } else {
        Alert.alert("Import failed", "Incorrect password or invalid backup.");
      }
    } finally {
      dispatch({ type: "SET_PASSPHRASE", value: "" });
      dispatch({ type: "SET_PASSPHRASE_CONFIRM", value: "" });
      dispatch({ type: "SET_PENDING_IMPORT_URI", value: null });
      dispatch({ type: "SET_IMPORT_WARNING", value: false });
      dispatch({ type: "SET_BUSY", value: false });

      dispatch({ type: "SET_ACTION", value: null });
    }
  };

  const cancelBackupAction = () => {
    if (state.backupBusy) {
      return;
    }
    resetState();
  };

  const dismissSuccessMessage = () => {
    dispatch({ type: "DISMISS_SUCCESS" });
  };

  return {
    backupAction: state.backupAction,
    backupPassphrase: state.backupPassphrase,
    backupPassphraseConfirm: state.backupPassphraseConfirm,
    pendingImportUri: state.pendingImportUri,
    backupBusy: state.backupBusy,
    successMessage: state.successMessage,
    importWarningAcknowledged: state.importWarningAcknowledged,
    isExportPassphraseValid,
    isImportPassphraseValid,
    isBackupActionValid,
    setBackupPassphrase: (value: string) =>
      dispatch({ type: "SET_PASSPHRASE", value }),
    setBackupPassphraseConfirm: (value: string) =>
      dispatch({ type: "SET_PASSPHRASE_CONFIRM", value }),
    toggleImportWarning: () => dispatch({ type: "TOGGLE_IMPORT_WARNING" }),
    startExport,
    startImport,
    confirmBackupAction,
    cancelBackupAction,
    dismissSuccessMessage,
  };
}
