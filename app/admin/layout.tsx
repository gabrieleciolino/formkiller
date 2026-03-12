import { urls } from "@/lib/urls";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import React from "react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations();

  const links = [
    { href: urls.admin.index, label: "Admin" },
    { href: urls.admin.forms.index, label: t("dashboard.sidebar.forms") },
    { href: urls.admin.leads.index, label: t("dashboard.sidebar.leads") },
    { href: urls.admin.sessions.index, label: t("dashboard.sidebar.sessions") },
    { href: urls.admin.library.index, label: t("dashboard.sidebar.library") },
  ];

  return (
    <main className="min-h-dvh p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-lg border border-border bg-card p-4">
          <h1 className="text-xl font-semibold text-foreground">Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Placeholder area.
          </p>
          <nav className="mt-4 flex flex-wrap gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-accent"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </header>

        <section className="rounded-lg border border-border bg-card p-4">
          {children}
        </section>
      </div>
    </main>
  );
}
