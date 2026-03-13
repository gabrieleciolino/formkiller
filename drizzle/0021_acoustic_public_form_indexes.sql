CREATE INDEX IF NOT EXISTS "question_form_id_order_idx" ON "question" USING btree ("form_id", "order");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "question_form_id_idx" ON "question" USING btree ("form_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "answer_form_session_id_idx" ON "answer" USING btree ("form_session_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "answer_form_id_created_at_idx" ON "answer" USING btree ("form_id", "created_at");
