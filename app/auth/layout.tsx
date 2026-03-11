import Link from "next/link";
import { urls } from "@/lib/urls";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-primary px-4 py-12">
      {/* grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          color: "var(--primary-foreground)",
        }}
      />

      <div className="relative w-full max-w-sm">
          {children}

        <p className="mt-6 text-center text-xs text-primary-foreground/40">
          <Link href="/" className="hover:text-primary-foreground/70 transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
