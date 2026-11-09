CREATE UNIQUE INDEX applications_active_unique
  ON applications (offer_id, student_id)
  WHERE status <> 'WITHDRAWN';