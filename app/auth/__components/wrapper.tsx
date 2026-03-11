import Image from "next/image";
import Link from "next/link";

export default function AuthWrapper({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-8 shadow-xl">
      <Link href="/" className="mb-6 flex justify-center">
        <Image src="/logo.png" alt="FormKiller" width={140} height={36} className="h-8 w-auto" />
      </Link>

      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h1 className="font-roboto text-2xl font-black tracking-tight text-foreground">
              {title}
            </h1>
          )}
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
