"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { urls } from "@/lib/urls";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function sanitizeIframeHeight(value: string) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return 640;
  return Math.min(900, Math.max(420, parsed));
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeForJsString(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

export default function FormEmbedDialog({
  assignmentId,
  formName,
}: {
  assignmentId: string;
  formName: string;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState("");
  const [iframeHeightInput, setIframeHeightInput] = useState("640");
  const [stickyButtonLabel, setStickyButtonLabel] = useState(
    t("forms.assignments.embed.sticky.defaultButtonLabel"),
  );

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const formUrl = useMemo(
    () => (origin ? `${origin}${urls.form(assignmentId)}` : urls.form(assignmentId)),
    [assignmentId, origin],
  );

  const iframeHeight = useMemo(
    () => sanitizeIframeHeight(iframeHeightInput),
    [iframeHeightInput],
  );

  const inlineSnippet = useMemo(() => {
    const title = escapeHtml(formName);
    return [
      `<iframe`,
      `  src="${formUrl}"`,
      `  title="${title}"`,
      `  loading="lazy"`,
      `  allow="microphone"`,
      `  style="width:100%;max-width:420px;height:${iframeHeight}px;border:0;border-radius:16px;overflow:hidden"`,
      `></iframe>`,
    ].join("\n");
  }, [formName, formUrl, iframeHeight]);

  const stickySnippet = useMemo(() => {
    const defaultButtonLabel = t("forms.assignments.embed.sticky.defaultButtonLabel");
    const buttonLabel = (stickyButtonLabel.trim() || defaultButtonLabel).slice(0, 80);
    const escapedUrl = escapeForJsString(formUrl);
    const escapedButtonLabel = escapeForJsString(buttonLabel);

    return [
      `<script>`,
      `(() => {`,
      `  const formUrl = '${escapedUrl}';`,
      `  const buttonLabel = '${escapedButtonLabel}';`,
      `  const widgetId = 'fk-widget-' + Math.random().toString(36).slice(2, 10);`,
      ``,
      `  const trigger = document.createElement('button');`,
      `  trigger.type = 'button';`,
      `  trigger.textContent = buttonLabel;`,
      `  trigger.style.cssText = [`,
      `    'position:fixed',`,
      `    'right:20px',`,
      `    'bottom:20px',`,
      `    'z-index:2147483000',`,
      `    'border:0',`,
      `    'border-radius:999px',`,
      `    'padding:12px 18px',`,
      `    'font:600 14px/1.2 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif',`,
      `    'cursor:pointer',`,
      `    'background:var(--fk-widget-button-bg,#111827)',`,
      `    'color:var(--fk-widget-button-color,#ffffff)',`,
      `    'box-shadow:0 10px 30px rgba(15,23,42,.25)'`,
      `  ].join(';');`,
      ``,
      `  const overlay = document.createElement('div');`,
      `  overlay.id = widgetId;`,
      `  overlay.style.cssText = [`,
      `    'position:fixed',`,
      `    'inset:0',`,
      `    'display:none',`,
      `    'align-items:center',`,
      `    'justify-content:center',`,
      `    'padding:12px',`,
      `    'z-index:2147483001',`,
      `    'background:var(--fk-widget-overlay,rgba(15,23,42,.52))',`,
      `    'backdrop-filter:blur(2px)'`,
      `  ].join(';');`,
      ``,
      `  const panel = document.createElement('div');`,
      `  panel.style.cssText = [`,
      `    'position:relative',`,
      `    'width:min(420px,100%)',`,
      `    'height:min(${iframeHeight}px,calc(100vh - 24px))',`,
      `    'border-radius:16px',`,
      `    'overflow:hidden',`,
      `    'background:#ffffff',`,
      `    'box-shadow:0 24px 50px rgba(15,23,42,.35)'`,
      `  ].join(';');`,
      ``,
      `  const close = document.createElement('button');`,
      `  close.type = 'button';`,
      `  close.setAttribute('aria-label', 'Close');`,
      `  close.textContent = '×';`,
      `  close.style.cssText = [`,
      `    'position:absolute',`,
      `    'top:8px',`,
      `    'right:8px',`,
      `    'z-index:2',`,
      `    'border:0',`,
      `    'border-radius:999px',`,
      `    'width:30px',`,
      `    'height:30px',`,
      `    'font-size:20px',`,
      `    'line-height:1',`,
      `    'cursor:pointer',`,
      `    'background:rgba(15,23,42,.65)',`,
      `    'color:#ffffff'`,
      `  ].join(';');`,
      ``,
      `  const iframe = document.createElement('iframe');`,
      `  iframe.src = formUrl;`,
      `  iframe.title = buttonLabel;`,
      `  iframe.loading = 'lazy';`,
      `  iframe.allow = 'microphone';`,
      `  iframe.style.cssText = 'width:100%;height:100%;border:0;background:transparent';`,
      ``,
      `  const openWidget = () => {`,
      `    overlay.style.display = 'flex';`,
      `  };`,
      ``,
      `  const closeWidget = () => {`,
      `    overlay.style.display = 'none';`,
      `  };`,
      ``,
      `  trigger.addEventListener('click', openWidget);`,
      `  close.addEventListener('click', closeWidget);`,
      `  overlay.addEventListener('click', (event) => {`,
      `    if (event.target === overlay) closeWidget();`,
      `  });`,
      ``,
      `  panel.append(close, iframe);`,
      `  overlay.append(panel);`,
      `  document.body.append(trigger, overlay);`,
      `})();`,
      `</script>`,
    ].join("\n");
  }, [formUrl, iframeHeight, stickyButtonLabel, t]);

  const copySnippet = async (mode: "inline" | "sticky") => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard not supported");

      await navigator.clipboard.writeText(
        mode === "inline" ? inlineSnippet : stickySnippet,
      );

      const key = `forms.assignments.embed.${mode}.copySuccess` as Parameters<
        typeof t
      >[0];
      toast(t(key));
    } catch {
      toast(t("forms.assignments.embed.copyError"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          {t("forms.assignments.embed.trigger")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("forms.assignments.embed.title")}</DialogTitle>
          <DialogDescription>
            {t("forms.assignments.embed.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground">
              {t("forms.assignments.embed.iframeHeight")}
            </p>
            <Input
              value={iframeHeightInput}
              onChange={(event) => setIframeHeightInput(event.target.value)}
              inputMode="numeric"
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground">
              {t("forms.assignments.embed.buttonLabel")}
            </p>
            <Input
              value={stickyButtonLabel}
              onChange={(event) => setStickyButtonLabel(event.target.value)}
              placeholder={t("forms.assignments.embed.buttonLabelPlaceholder")}
            />
          </div>
        </div>

        <div className="space-y-3">
          <section className="space-y-2 rounded-lg border border-border p-3">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">
                {t("forms.assignments.embed.inline.title")}
              </h4>
              <p className="text-xs text-muted-foreground">
                {t("forms.assignments.embed.inline.description")}
              </p>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => copySnippet("inline")}
              >
                {t("forms.assignments.embed.copy")}
              </Button>
            </div>
          </section>

          <section className="space-y-2 rounded-lg border border-border p-3">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">
                {t("forms.assignments.embed.sticky.title")}
              </h4>
              <p className="text-xs text-muted-foreground">
                {t("forms.assignments.embed.sticky.description")}
              </p>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => copySnippet("sticky")}
              >
                {t("forms.assignments.embed.copy")}
              </Button>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
