"use client";

import { Button } from "@/components/ui/button";
import { updateUserTierAction } from "@/features/users/actions";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

export default function UserTierToggle({
  userId,
  currentTier,
}: {
  userId: string;
  currentTier: "free" | "pro";
}) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const nextTier = currentTier === "pro" ? "free" : "pro";

  const onClick = () => {
    startTransition(async () => {
      try {
        const { serverError, validationErrors } = await updateUserTierAction({
          userId,
          tier: nextTier,
        });

        if (serverError || validationErrors) {
          throw new Error();
        }

        toast(t("dashboard.users.tierUpdated"));
        router.refresh();
      } catch {
        toast(t("dashboard.users.tierUpdateError"));
      }
    });
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={onClick}
    >
      {nextTier === "pro"
        ? t("dashboard.users.actions.makePro")
        : t("dashboard.users.actions.makeFree")}
    </Button>
  );
}
