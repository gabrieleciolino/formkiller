CREATE OR REPLACE FUNCTION "public"."submit_public_form_answer"(
  "p_session_id" uuid,
  "p_question_id" uuid,
  "p_form_id" uuid,
  "p_default_answer" text DEFAULT NULL,
  "p_file_key" text DEFAULT NULL,
  "p_file_generated_at" timestamp with time zone DEFAULT NULL,
  "p_stt" text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_question_form_id uuid;
  v_questions_count integer;
  v_next_question_index integer;
  v_completed boolean;
  v_answer_id uuid;
BEGIN
  SELECT
    fs.id,
    fs.form_id,
    fs.user_id,
    fs.status,
    fs.current_question_index
  INTO v_session
  FROM "public"."form_session" fs
  WHERE fs.id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Form session not found';
  END IF;

  IF v_session.form_id <> p_form_id THEN
    RAISE EXCEPTION 'Invalid session/form association';
  END IF;

  IF v_session.status = 'completed' THEN
    RAISE EXCEPTION 'Session already completed';
  END IF;

  SELECT q.form_id
  INTO v_question_form_id
  FROM "public"."question" q
  WHERE q.id = p_question_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question not found';
  END IF;

  IF v_question_form_id <> p_form_id THEN
    RAISE EXCEPTION 'Invalid question/form association';
  END IF;

  INSERT INTO "public"."answer" (
    "form_session_id",
    "question_id",
    "form_id",
    "user_id",
    "default_answer",
    "file_key",
    "file_generated_at",
    "stt"
  )
  VALUES (
    v_session.id,
    p_question_id,
    v_session.form_id,
    v_session.user_id,
    p_default_answer,
    p_file_key,
    p_file_generated_at,
    p_stt
  )
  RETURNING "id" INTO v_answer_id;

  SELECT count(*)::integer
  INTO v_questions_count
  FROM "public"."question" q
  WHERE q.form_id = p_form_id;

  IF v_questions_count <= 0 THEN
    RAISE EXCEPTION 'Form has no questions';
  END IF;

  v_next_question_index := coalesce(v_session.current_question_index, 0) + 1;
  v_completed := v_next_question_index >= v_questions_count;

  UPDATE "public"."form_session"
  SET
    "current_question_index" = v_next_question_index,
    "status" = CASE
      WHEN v_completed THEN 'completed'::"public"."form_session_status"
      ELSE 'in_progress'::"public"."form_session_status"
    END
  WHERE "id" = v_session.id;

  RETURN jsonb_build_object(
    'answerId', v_answer_id,
    'completed', v_completed
  );
END;
$$;
