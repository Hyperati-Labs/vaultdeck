import * as Crypto from "expo-crypto";
import { encodeBase64 } from "tweetnacl-util";

export async function generateId(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return encodeBase64(bytes).replace(/[+/=]/g, "");
}
