import { Platform } from 'react-native';
import { File as ExpoFile } from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Converts a Base64 string to a Uint8Array in a pure, dependency-free manner.
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const cleanBase64 = (base64.includes(',') ? base64.split(',')[1] : base64).replace(/[^A-Za-z0-9+/=]/g, '');
  if (typeof atob === 'function') {
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  let bufferLength = Math.floor(cleanBase64.length * 0.75);
  if (cleanBase64.endsWith('==')) bufferLength -= 2;
  else if (cleanBase64.endsWith('=')) bufferLength -= 1;
  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < cleanBase64.length; i += 4) {
    const enc1 = BASE64_CHARS.indexOf(cleanBase64.charAt(i));
    const enc2 = BASE64_CHARS.indexOf(cleanBase64.charAt(i + 1));
    const enc3 = BASE64_CHARS.indexOf(cleanBase64.charAt(i + 2));
    const enc4 = BASE64_CHARS.indexOf(cleanBase64.charAt(i + 3));

    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;

    bytes[p++] = chr1;
    if (enc3 !== 64 && enc3 !== -1 && p < bufferLength) bytes[p++] = chr2;
    if (enc4 !== 64 && enc4 !== -1 && p < bufferLength) bytes[p++] = chr3;
  }
  return bytes;
}

/**
 * Helper to append a file part to FormData in a cross-platform manner that works on:
 * 1. Web: standard Fetch / Blob
 * 2. Mobile (Android/iOS): Expo SDK 52+ / 57 WinterCG fetch compliant FormData part
 *    with `name`, `type`, and `.bytes()` async method.
 */
export async function appendFileToFormData(
  formData: FormData,
  fieldName: string,
  uri: string,
  preferredName?: string,
  preferredType?: string
): Promise<void> {
  const rawName = preferredName || uri.split('/').pop() || `upload_${Date.now()}.jpg`;
  const extMatch = /\.(\w+)$/.exec(rawName);
  const ext = (extMatch && extMatch[1]) ? extMatch[1].toLowerCase() : 'jpg';

  let mimeType = preferredType;
  if (!mimeType) {
    if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'webp') mimeType = 'image/webp';
    else if (ext === 'gif') mimeType = 'image/gif';
    else if (ext === 'mp4') mimeType = 'video/mp4';
    else mimeType = 'image/jpeg';
  }

  const safeName = rawName.includes('.') ? rawName : `upload_${Date.now()}.${ext}`;

  // 1. Web browser: fetch blob and append standard Blob
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    formData.append(fieldName, blob, safeName);
    return;
  }

  // 2. Native (Android / iOS):
  // Expo's WinterCG fetch (convertFormDataAsync) checks:
  // - headers: 'name' in part (for filename), 'type' in part (for content-type)
  // - body: 'bytes' in part -> await part.bytes() returning Uint8Array
  // This avoids the "Unsupported FormDataPart implementation" error completely.
  const filePart = {
    name: safeName,
    type: mimeType,
    bytes: async (): Promise<Uint8Array> => {
      // Strategy A: Expo modern File class
      try {
        const expoFile = new ExpoFile(uri);
        if (typeof (expoFile as any).bytes === 'function') {
          const result = await (expoFile as any).bytes();
          if (result && (result instanceof Uint8Array || ArrayBuffer.isView(result))) {
            return result as Uint8Array;
          }
        }
        if (typeof (expoFile as any).bytesSync === 'function') {
          const result = (expoFile as any).bytesSync();
          if (result && (result instanceof Uint8Array || ArrayBuffer.isView(result))) {
            return result as Uint8Array;
          }
        }
      } catch (err) {
        console.warn('[formDataHelper] ExpoFile.bytes() failed for URI, trying fallback:', uri, err);
      }

      // Strategy B: Legacy FileSystem base64 reader (reliable across all Android/iOS versions)
      try {
        const base64 = await LegacyFileSystem.readAsStringAsync(uri, {
          encoding: LegacyFileSystem.EncodingType.Base64,
        });
        return base64ToUint8Array(base64);
      } catch (err) {
        console.warn('[formDataHelper] LegacyFileSystem read failed for URI:', uri, err);
      }

      // Strategy C: Native fetch blob arrayBuffer fallback
      try {
        const resp = await fetch(uri);
        const blob = await resp.blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();
        return new Uint8Array(arrayBuffer);
      } catch (err) {
        console.error('[formDataHelper] All byte resolution strategies failed for URI:', uri, err);
        throw new Error(`Failed to read file bytes for upload: ${uri}`);
      }
    },
  };

  formData.append(fieldName, filePart as any);
}
