/**
 * Thin abstraction over Capacitor runtime detection.
 *
 * Kept intentionally small so the rest of the app can stay unaware of the
 * hosting shell (browser vs. native APK). Clean-architecture wise this module
 * belongs to the "infrastructure" layer: it hides the concrete platform
 * behind a stable interface consumed by hooks / features.
 */
import { Capacitor } from "@capacitor/core";

export function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function platformName(): "web" | "android" | "ios" {
  try {
    const p = Capacitor.getPlatform();
    if (p === "android" || p === "ios") return p;
    return "web";
  } catch {
    return "web";
  }
}
