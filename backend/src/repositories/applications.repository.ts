import type { Db } from "../db/database.ts";
import type { ApplicationDbo, ApplicationListDbo } from "../models/application.ts";
import type { OfferStatus } from "../models/offer.ts";

interface OfferStatusRow {
  status: OfferStatus;
}

interface ApplicationParams {
  offerId: number;
  studentId: number;
  message: string | null;
}

export const createApplicationsRepository = (db: Db) => {
  const findOfferStatus = db.prepare<{ offerId: number }, OfferStatusRow>(
    "SELECT status FROM offers WHERE id = @offerId",
  );
  const findActive = db.prepare<{ offerId: number; studentId: number }, { id: number }>(`
    SELECT id FROM applications
    WHERE offer_id = @offerId AND student_id = @studentId AND status <> 'WITHDRAWN'
    LIMIT 1
  `);
  const insertApplication = db.prepare<ApplicationParams>(`
    INSERT INTO applications (offer_id, student_id, message)
    VALUES (@offerId, @studentId, @message)
  `);
  const findById = db.prepare<{ id: number }, ApplicationDbo>(`
    SELECT id, offer_id, student_id, message, status, applied_at
    FROM applications WHERE id = @id
  `);
  const findByStudentId = db.prepare<{ studentId: number }, ApplicationListDbo>(`
    SELECT a.id, a.offer_id, a.student_id, a.message, a.status, a.applied_at,
           o.title AS offer_title, c.short_name AS company_short_name,
           ay.label AS academic_year_label, p.code AS period_code
    FROM applications a
    JOIN offers o ON o.id = a.offer_id
    JOIN companies c ON c.id = o.company_id
    JOIN academic_years ay ON ay.id = o.academic_year_id
    JOIN periods p ON p.id = o.period_id
    WHERE a.student_id = @studentId
    ORDER BY a.applied_at DESC, a.id DESC
  `);

  return {
    findOfferStatus: (offerId: number): OfferStatus | undefined =>
      findOfferStatus.get({ offerId })?.status,
    hasActiveForOffer: (offerId: number, studentId: number): boolean =>
      findActive.get({ offerId, studentId }) !== undefined,
    findAllForStudent: (studentId: number): ApplicationListDbo[] =>
      findByStudentId.all({ studentId }),
    create: (params: ApplicationParams): ApplicationDbo => {
      const result = insertApplication.run(params);
      const application = findById.get({ id: Number(result.lastInsertRowid) });
      if (application === undefined) throw new Error("Candidature créée introuvable");
      return application;
    },
  };
};

export type ApplicationsRepository = ReturnType<typeof createApplicationsRepository>;