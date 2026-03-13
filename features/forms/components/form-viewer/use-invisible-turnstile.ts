"use client";

import { useCallback, useEffect, useRef } from "react";

const TURNSTILE_SCRIPT_ID = "cf-turnstile-script";
const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const TURNSTILE_TOKEN_TIMEOUT_MS = 10_000;

type TurnstileRenderOptions = {
  sitekey: string;
  action: string;
  execution: "execute";
  appearance: "execute";
  callback: (token: string) => void;
  "error-callback": () => void;
  "expired-callback": () => void;
};

type TurnstileApi = {
  render: (element: HTMLElement, options: TurnstileRenderOptions) => string;
  execute: (widgetId: string) => void;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    __turnstileLoaderPromise?: Promise<TurnstileApi>;
  }
}

async function loadTurnstileApi(): Promise<TurnstileApi> {
  if (window.turnstile) return window.turnstile;
  if (window.__turnstileLoaderPromise) return window.__turnstileLoaderPromise;

  window.__turnstileLoaderPromise = new Promise<TurnstileApi>(
    (resolve, reject) => {
      const existingScript = document.getElementById(
        TURNSTILE_SCRIPT_ID,
      ) as HTMLScriptElement | null;

      const resolveTurnstile = () => {
        if (window.turnstile) {
          resolve(window.turnstile);
          return;
        }

        reject(new Error("TURNSTILE_API_UNAVAILABLE"));
      };

      const rejectLoad = () => {
        reject(new Error("TURNSTILE_SCRIPT_LOAD_FAILED"));
      };

      if (existingScript) {
        if (window.turnstile) {
          resolve(window.turnstile);
          return;
        }

        existingScript.addEventListener("load", resolveTurnstile, {
          once: true,
        });
        existingScript.addEventListener("error", rejectLoad, {
          once: true,
        });
        return;
      }

      const script = document.createElement("script");
      script.id = TURNSTILE_SCRIPT_ID;
      script.src = TURNSTILE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", resolveTurnstile, { once: true });
      script.addEventListener("error", rejectLoad, { once: true });
      document.head.appendChild(script);
    },
  );

  return window.__turnstileLoaderPromise;
}

export function useInvisibleTurnstile({ action }: { action: string }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const widgetRenderPromiseRef = useRef<Promise<void> | null>(null);
  const resolveTokenRef = useRef<((token: string) => void) | null>(null);
  const rejectTokenRef = useRef<((error: Error) => void) | null>(null);

  const resolveCurrentToken = useCallback((token: string) => {
    const resolve = resolveTokenRef.current;
    resolveTokenRef.current = null;
    rejectTokenRef.current = null;
    resolve?.(token);
  }, []);

  const rejectCurrentToken = useCallback((error: Error) => {
    const reject = rejectTokenRef.current;
    resolveTokenRef.current = null;
    rejectTokenRef.current = null;
    reject?.(error);
  }, []);

  const ensureWidgetRendered = useCallback(async () => {
    if (!siteKey) {
      throw new Error("TURNSTILE_NOT_CONFIGURED");
    }

    if (widgetIdRef.current) return;
    if (widgetRenderPromiseRef.current) {
      await widgetRenderPromiseRef.current;
      return;
    }

    const container = containerRef.current;
    if (!container) {
      throw new Error("TURNSTILE_CONTAINER_MISSING");
    }

    widgetRenderPromiseRef.current = (async () => {
      const turnstile = await loadTurnstileApi();

      widgetIdRef.current = turnstile.render(container, {
        sitekey: siteKey,
        action,
        execution: "execute",
        appearance: "execute",
        callback: (token) => {
          resolveCurrentToken(token);
        },
        "error-callback": () => {
          rejectCurrentToken(new Error("TURNSTILE_CHALLENGE_ERROR"));
        },
        "expired-callback": () => {
          rejectCurrentToken(new Error("TURNSTILE_TOKEN_EXPIRED"));
        },
      });
    })();

    await widgetRenderPromiseRef.current;
  }, [action, rejectCurrentToken, resolveCurrentToken, siteKey]);

  const getToken = useCallback(async () => {
    await ensureWidgetRendered();

    if (resolveTokenRef.current || rejectTokenRef.current) {
      throw new Error("TURNSTILE_CHALLENGE_IN_PROGRESS");
    }

    const turnstile = window.turnstile;
    const widgetId = widgetIdRef.current;

    if (!turnstile || !widgetId) {
      throw new Error("TURNSTILE_WIDGET_UNAVAILABLE");
    }

    return new Promise<string>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        rejectCurrentToken(new Error("TURNSTILE_TIMEOUT"));
      }, TURNSTILE_TOKEN_TIMEOUT_MS);

      resolveTokenRef.current = (token) => {
        window.clearTimeout(timeoutId);
        resolve(token);
      };

      rejectTokenRef.current = (error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      };

      turnstile.reset(widgetId);
      turnstile.execute(widgetId);
    });
  }, [ensureWidgetRendered, rejectCurrentToken]);

  useEffect(
    () => () => {
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
      }

      widgetIdRef.current = null;
      widgetRenderPromiseRef.current = null;
      rejectCurrentToken(new Error("TURNSTILE_UNMOUNTED"));
    },
    [rejectCurrentToken],
  );

  return {
    containerRef,
    getToken,
    isConfigured: siteKey.length > 0,
  };
}
