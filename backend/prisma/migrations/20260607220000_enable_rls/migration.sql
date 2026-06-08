ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reservation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Routine" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProgressEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attendance" ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_self_or_admin ON "User"
  USING (
    id = NULLIF(current_setting('app.current_user_id', true), '')::int
    OR current_setting('app.current_user_role', true) = 'ADMIN'
  );

CREATE POLICY subscription_self_or_admin ON "Subscription"
  USING (
    "userId" = NULLIF(current_setting('app.current_user_id', true), '')::int
    OR current_setting('app.current_user_role', true) = 'ADMIN'
  );

CREATE POLICY payment_self_or_admin ON "Payment"
  USING (
    "userId" = NULLIF(current_setting('app.current_user_id', true), '')::int
    OR current_setting('app.current_user_role', true) = 'ADMIN'
  );

CREATE POLICY reservation_self_or_staff ON "Reservation"
  USING (
    "userId" = NULLIF(current_setting('app.current_user_id', true), '')::int
    OR current_setting('app.current_user_role', true) = 'ADMIN'
    OR EXISTS (
      SELECT 1 FROM "Class"
      WHERE "Class".id = "Reservation"."classId"
        AND "Class"."coachId" = NULLIF(current_setting('app.current_user_id', true), '')::int
    )
  );

CREATE POLICY routine_client_or_coach_or_admin ON "Routine"
  USING (
    "clientId" = NULLIF(current_setting('app.current_user_id', true), '')::int
    OR "coachId" = NULLIF(current_setting('app.current_user_id', true), '')::int
    OR current_setting('app.current_user_role', true) = 'ADMIN'
  );

CREATE POLICY progress_self_or_admin ON "ProgressEntry"
  USING (
    "userId" = NULLIF(current_setting('app.current_user_id', true), '')::int
    OR current_setting('app.current_user_role', true) = 'ADMIN'
  );

CREATE POLICY attendance_self_or_staff ON "Attendance"
  USING (
    "userId" = NULLIF(current_setting('app.current_user_id', true), '')::int
    OR current_setting('app.current_user_role', true) = 'ADMIN'
    OR EXISTS (
      SELECT 1 FROM "Class"
      WHERE "Class".id = "Attendance"."classId"
        AND "Class"."coachId" = NULLIF(current_setting('app.current_user_id', true), '')::int
    )
  );
