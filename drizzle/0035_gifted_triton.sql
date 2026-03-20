ALTER TABLE "account" ADD COLUMN "username" text;--> statement-breakpoint
WITH ranked_accounts AS (
  SELECT
    user_id,
    'user_' || row_number() OVER (ORDER BY user_id)::text AS generated_username
  FROM "account"
)
UPDATE "account" AS a
SET "username" = r.generated_username
FROM ranked_accounts AS r
WHERE a.user_id = r.user_id
  AND a.username IS NULL;--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "username" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_username_unique" UNIQUE("username");
