/**
 * Android lifecycle & hardware integration.
 *
 * Registers listeners for:
 *  - Hardware back button (routes back through history, exits at root).
 *  - App state changes (pause/resume) — dispatches DOM events so features
 *    like Pomodoro / audio can react without importing Capacitor directly.
 *  - Status bar styling for immersive dark theme.
 *  - Splash screen auto-hide once the web layer is ready.
 *
 * All calls are guarded so this module is safe to import on the web build.
 */
import { isNative } from "./platform";

type Unsub = () => void;

export async function initNativeLifecycle(): Promise<Unsub> {
  if (!isNative()) return () => {};

  if (typeof document !== "undefined") {
    document.documentElement.classList.add("system-native");
  }

  const unsubs: Unsub[] = [];

  try {
    const { App } = await import("@capacitor/app");
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    const { SplashScreen } = await import("@capacitor/splash-screen");

    // Immersive dark status bar matching the SYSTEM theme.
    await StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    await StatusBar.setBackgroundColor({ color: "#0a0d1a" }).catch(() => {});
    await StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});

    // Hide the splash once React has mounted.
    await SplashScreen.hide().catch(() => {});

    // Hardware back button — pop history; exit if at root.
    const backHandle = await App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack && window.history.length > 1) {
        window.history.back();
      } else {
        App.exitApp().catch(() => {});
      }
    });
    unsubs.push(() => backHandle.remove());

    // Broadcast pause/resume so features can persist / restore state.
    const stateHandle = await App.addListener("appStateChange", ({ isActive }) => {
      window.dispatchEvent(
        new CustomEvent("system:appstate", { detail: { isActive } }),
      );
    });
    unsubs.push(() => stateHandle.remove());

    const urlHandle = await App.addListener("appUrlOpen", (event) => {
      window.dispatchEvent(new CustomEvent("system:deeplink", { detail: event }));
    });
    unsubs.push(() => urlHandle.remove());
  } catch (err) {
    // Never let native init break the web experience.
    console.warn("[native] lifecycle init skipped:", err);
  }

  return () => {
    for (const u of unsubs) {
      try { u(); } catch { /* noop */ }
    }
  };
}
