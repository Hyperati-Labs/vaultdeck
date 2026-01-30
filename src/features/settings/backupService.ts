import { Platform } from "react-native";
import { shareAsync } from "expo-sharing";
import { getDocumentAsync } from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";

export class UserCancelledError extends Error {
  constructor() {
    super("User cancelled");
    this.name = "UserCancelledError";
  }
}

export class InvalidBackupFileError extends Error {
  constructor() {
    super("Invalid backup file");
    this.name = "InvalidBackupFileError";
  }
}

export class ExportNotSupportedError extends Error {
  constructor() {
    super("Backup export not supported on web demo");
    this.name = "ExportNotSupportedError";
  }
}

export class PermissionDeniedError extends Error {
  constructor() {
    super("Permission denied");
    this.name = "PermissionDeniedError";
  }
}

const backupExtensions = [".vdb", ".blob"];

const getBackupFilename = () => {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `vault-backup-${stamp}.vdb`;
};

const isBackupFile = (pathOrName: string | undefined) => {
  if (!pathOrName) return false;
  const lower = pathOrName.toLowerCase();
  return backupExtensions.some((ext) => lower.endsWith(ext));
};

export async function selectBackupFile(): Promise<string | null> {
  const result = await getDocumentAsync({
    type: "*/*",
    copyToCacheDirectory: true,
  });

  if (result.canceled) {
    return null;
  }

  const asset = result.assets[0];
  if (!isBackupFile(asset.name ?? asset.uri)) {
    throw new InvalidBackupFileError();
  }

  return asset.uri;
}

export async function saveBackupFile(exportedPath: string): Promise<boolean> {
  if (Platform.OS === "web") {
    throw new ExportNotSupportedError();
  }

  if (Platform.OS === "android") {
    const permissions =
      await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permissions.granted) {
      return false;
    }
    const filename = getBackupFilename();
    const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      filename,
      "application/octet-stream"
    );
    const content = await FileSystem.readAsStringAsync(exportedPath, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return true;
  }

  const filename = getBackupFilename();
  const iosSharePath = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.copyAsync({ from: exportedPath, to: iosSharePath });
  try {
    await shareAsync(iosSharePath, {
      UTI: "public.data",
      mimeType: "application/octet-stream",
      dialogTitle: "Save Backup",
    });
  } finally {
    await FileSystem.deleteAsync(iosSharePath, { idempotent: true });
  }
  return true;
}
