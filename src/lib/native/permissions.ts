/**
 * Centralised permission requests.
 *
 * The SYSTEM app only needs "soft" permissions today (vibration is granted at
 * install time on Android and the Notifications API is opt-in via the browser
 * prompt). This module gives the rest of the app a single, safe entry point;
 * future permissions (camera, geolocation, etc.) should be added here so
 * feature code never touches the Capacitor plugins directly.
 */
import { isNative } from "./platform";

export type PermissionKind = "notifications" | "haptics" | "microphone";

export interface PermissionResult {
  kind: PermissionKind;
  granted: boolean;
  reason?: string;
}

export async function requestPermission(kind: PermissionKind): Promise<PermissionResult> {
  switch (kind) {
    case "notifications":
      return requestNotifications();
    case "microphone":
      return requestMicrophone();
    case "haptics":
      return { kind, granted: true }; // Android auto-grants; web no-op.
  }
}

async function requestMicrophone(): Promise<PermissionResult> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return { kind: "microphone", granted: false, reason: "unsupported" };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return { kind: "microphone", granted: true };
  } catch (err) {
    return { kind: "microphone", granted: false, reason: String(err) };
  }
}

async function requestNotifications(): Promise<PermissionResult> {
  if (typeof window === "undefined") {
    return { kind: "notifications", granted: false, reason: "no-window" };
  }
  // On native, notification permission is handled by a dedicated plugin
  // (not installed yet). We fall back to the Web Notification API which is
  // also available inside the Capacitor WebView.
  if (!("Notification" in window)) {
    return { kind: "notifications", granted: false, reason: "unsupported" };
  }
  try {
    const perm = await Notification.requestPermission();
    return { kind: "notifications", granted: perm === "granted", reason: perm };
  } catch (err) {
    return { kind: "notifications", granted: false, reason: String(err) };
  }
}

export function nativeContext() {
  return { native: isNative() };
}
