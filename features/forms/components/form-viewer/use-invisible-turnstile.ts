"use client";

import { useCallback, useEffect, useRef } from "react";

const TURNSTILE_SCRIPT_ID = "cf-turnstile-script";
const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const TURNSTILE_TOKEN_TIMEOUT_MS = 10_000;
const TURNSTILE_SCRIPT_LOAD_TIMEOUT_MS = 8_000;

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
  if (!window.__turnstileLoaderPromise) {
    window.__turnstileLoaderPromise = new Promise<TurnstileApi>(
      (resolve, reject) => {
        const existingScript = document.getElementById(
          TURNSTILE_SCRIPT_ID,
        ) as HTMLScriptElement | null;
        const script = existingScript ?? document.createElement("script");
        let finished = false;

        const cleanup = () => {
          window.clearTimeout(timeoutId);
          script.removeEventListener("load", onLoad);
          script.removeEventListener("error", onError);
        };

        const rejectWith = (message: string) => {
          if (finished) return;
          finished = true;
          cleanup();
          reject(new Error(message));
        };

        const resolveTurnstile = () => {
          if (finished) return;

          if (!window.turnstile) {
            rejectWith("TURNSTILE_API_UNAVAILABLE");
            return;
          }

          finished = true;
          cleanup();
          resolve(window.turnstile);
        };

        const onLoad = () => {
          resolveTurnstile();
        };

        const onError = () => {
          rejectWith("TURNSTILE_SCRIPT_LOAD_FAILED");
        };

        const timeoutId = window.setTimeout(() => {
          rejectWith("TURNSTILE_SCRIPT_LOAD_TIMEOUT");
        }, TURNSTILE_SCRIPT_LOAD_TIMEOUT_MS);

        if (!existingScript) {
          script.id = TURNSTILE_SCRIPT_ID;
          script.src = TURNSTILE_SCRIPT_SRC;
          script.async = true;
          script.defer = true;
          document.head.appendChild(script);
        }

        script.addEventListener("load", onLoad, { once: true });
        script.addEventListener("error", onError, { once: true });

        if (window.turnstile) {
          resolveTurnstile();
          return;
        }

        const readyState = (
          script as HTMLScriptElement & { readyState?: string }
        ).readyState;
        if (readyState === "complete" || readyState === "loaded") {
          window.setTimeout(resolveTurnstile, 0);
        }
      },
    ).catch((error) => {
      window.__turnstileLoaderPromise = undefined;
      throw error;
    });
  }

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

    try {
      await widgetRenderPromiseRef.current;
    } catch (error) {
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
      }

      widgetIdRef.current = null;
      widgetRenderPromiseRef.current = null;
      throw error;
    }
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

  useEffect(() => {
    if (!siteKey) return;

    // Warm up script + widget during welcome phase to reduce click latency.
    const timeoutId = window.setTimeout(() => {
      void ensureWidgetRendered().catch(() => {});
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [ensureWidgetRendered, siteKey]);

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
