import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import {useCallback, useEffect, useState} from "react";
import {
    getCurrentUser,
    getProjects,
    signIn as puterSignIn,
    signOut as puterSignOut,
} from "../lib/puter.action";
import TopBar from "../components/TopBar";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0B0B0C" />
        <Meta />
        <Links />
        {/*
          Marks JS-capable clients so app.css can pre-hide the landing entrance
          targets before hydration. SSR streams the landing fully visible and the
          browser can paint it before the bundle arrives, so useLayoutEffect is
          not early enough on its own. useLandingAnimation() writes the hidden
          state as inline styles and then removes this class, handing ownership
          to GSAP. Deliberately a script rather than a className on <html>: React
          must not own the attribute, or it would re-add it on every Layout
          re-render after the hook removed it, hence suppressHydrationWarning
          on <html> above: React 19 does flag the extra attribute otherwise.

          The timer is the failsafe for the one case the class cannot survive —
          JS enabled but the bundle never arriving — which would otherwise leave
          the landing page blank for good. Not a CSS animation on purpose: those
          outrank inline styles and would fight GSAP for the rest of the session.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              `document.documentElement.classList.add("anim-boot");` +
              `window.__animBoot=setTimeout(function(){` +
              `document.documentElement.classList.remove("anim-boot")},2500)`,
          }}
        />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

const DEFAULT_AUTH_STATE: AuthState = {
    isSignedIn: false,
    userName: null,
    userId: null,
}

export default function App() {
    const [authState, setAuthState] = useState<AuthState>(DEFAULT_AUTH_STATE);
    const [projects, setProjects] = useState<DesignItem[]>([]);
    const [isProjectsLoading, setIsProjectsLoading] = useState(true);

    const refreshProjects = useCallback(async () => {
        setIsProjectsLoading(true);

        try {
            const items = await getProjects();
            const sorted = [...items].sort((a, b) => b.timestamp - a.timestamp);

            setProjects(sorted);

            return sorted;
        } finally {
            setIsProjectsLoading(false);
        }
    }, []);

    const upsertProject = useCallback((item: DesignItem) => {
        setProjects((prev) => {
            const next = prev.filter(({ id }) => id !== item.id);

            return [item, ...next].sort((a, b) => b.timestamp - a.timestamp);
        });
    }, []);

    const refreshAuth = useCallback(async () => {
        try {
            const user = await getCurrentUser();

            setAuthState({
                isSignedIn: !!user,
                userName: user?.username || null,
                userId: user?.uuid || null,
            });

            if (user) {
                await refreshProjects();
            } else {
                setProjects([]);
                setIsProjectsLoading(false);
            }

            return !!user;
        } catch {
            setAuthState(DEFAULT_AUTH_STATE);
            setProjects([]);
            setIsProjectsLoading(false);
            return false;
        }
    }, [refreshProjects]);

    useEffect(() => {
        refreshAuth()
    }, [refreshAuth]);

    const signIn = async () => {
        await puterSignIn();
        return await refreshAuth();
    }

    const signOut = async () => {
        puterSignOut();
        return await refreshAuth();
    }

    const context: AppContext = {
        ...authState,
        refreshAuth,
        signIn,
        signOut,
        projects,
        isProjectsLoading,
        refreshProjects,
        upsertProject,
    };

  return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <TopBar {...context} />
        <Outlet context={context} />
      </div>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="notice">
      <h1 className="font-mono text-[10px] tracking-[0.18em] text-dim">{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="mt-4 w-full overflow-x-auto rounded-xl border border-line bg-surface p-4 text-left font-mono text-[11px] text-muted">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
