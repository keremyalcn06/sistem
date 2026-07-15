import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SystemBoot } from "../components/SystemBoot";
import { VoiceAssistant } from "../components/VoiceAssistant";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="panel-glow corner-frame p-10 max-w-md text-center">
        <div className="font-display text-[10px] tracking-[0.4em] text-primary uppercase">Sistem Hatası</div>
        <h1 className="font-display text-7xl mt-2 text-transparent bg-clip-text bg-[image:var(--gradient-arcane)]">404</h1>
        <p className="mt-4 text-sm text-muted-foreground">Bu zindan mevcut değil, Avcı.</p>
        <Link to="/" className="btn-arcane inline-block mt-6 px-5 py-2.5 text-xs">Ana Üsse Dön</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="panel-glow p-8 max-w-md text-center">
        <h1 className="font-display text-xl">Sistem Bağlantısı Kesildi</h1>
        <p className="mt-2 text-sm text-muted-foreground">Beklenmedik bir anomali oluştu.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="btn-arcane px-4 py-2 text-xs">Tekrar Dene</button>
          <a href="/" className="border border-border rounded-md px-4 py-2 text-xs font-display tracking-widest uppercase hover:bg-muted/40">Ana Üs</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no" },
      { name: "theme-color", content: "#0a0d1a" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "SYSTEM" },
      { name: "format-detection", content: "telephone=no" },
      { title: "SYSTEM — Kişisel Gelişim" },
      { name: "description", content: "SYSTEM: görev, XP ve odak temelli kişisel gelişim uygulaması." },
      { property: "og:title", content: "SYSTEM — Kişisel Gelişim" },
      { property: "og:description", content: "Günlük görevler, XP, seri ve pomodoro odak modu ile analitik gelişim." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/favicon.ico" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    import("../lib/native/lifecycle").then(({ initNativeLifecycle }) => {
      initNativeLifecycle().then((fn) => { cleanup = fn; });
    }).catch(() => {});
    return () => { cleanup?.(); };
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <SystemBoot />
      <VoiceAssistant />
    </QueryClientProvider>
  );
}

