-- Biometric setup for Archie + InsForge
-- Run once in InsForge SQL editor or via the InsForge CLI before deploying the feature.

CREATE TABLE IF NOT EXISTS face_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_version TEXT NOT NULL,
  descriptor JSONB NOT NULL,
  reference_photo_key TEXT NOT NULL,
  threshold NUMERIC NOT NULL DEFAULT 0.9,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_face_enrollments_active_user
  ON face_enrollments (user_id)
  WHERE status = 'active';

CREATE TABLE IF NOT EXISTS face_verification_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_version TEXT NOT NULL,
  score NUMERIC NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_face_verification_attempts_user_created
  ON face_verification_attempts (user_id, created_at DESC);

ALTER TABLE face_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_verification_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_face_enrollment" ON face_enrollments;
CREATE POLICY "users_read_own_face_enrollment"
  ON face_enrollments
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users_insert_own_face_enrollment" ON face_enrollments;
CREATE POLICY "users_insert_own_face_enrollment"
  ON face_enrollments
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_update_own_face_enrollment" ON face_enrollments;
CREATE POLICY "users_update_own_face_enrollment"
  ON face_enrollments
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_read_own_face_attempts" ON face_verification_attempts;
CREATE POLICY "users_read_own_face_attempts"
  ON face_verification_attempts
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users_insert_own_face_attempts" ON face_verification_attempts;
CREATE POLICY "users_insert_own_face_attempts"
  ON face_verification_attempts
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Storage buckets required by the full biometric feature:
--   face-models
--   face-reference-photos (private)
