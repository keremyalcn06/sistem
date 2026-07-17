// Standalone SPA entry used ONLY for the Capacitor/Android build.
// The web app still uses TanStack Start SSR; on Android we ship a pure
// client-side bundle because there is no server inside the WebView.
import "../styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "../router";

try {
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  if (cap?.isNativePlatform?.()) document.documentElement.classList.add("system-native");
} catch {
  // Native marker is an optimization only; rendering must continue without it.
}

const router = getRouter();
const container = document.getElementById("app");
if (!container) {
  throw new Error("[spa] #app container missing from index.html");
}
createRoot(container).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
