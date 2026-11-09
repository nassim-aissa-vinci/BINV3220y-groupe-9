import type { Db } from "../db/database.ts";
import type { ApplicationDbo } from "../models/application.ts";
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

  return {
    findOfferStatus: (offerId: number): OfferStatus | undefined =>
      findOfferStatus.get({ offerId })?.status,
    hasActiveForOffer: (offerId: number, studentId: number): boolean =>
      findActive.get({ offerId, studentId }) !== undefined,
    create: (params: ApplicationParams): ApplicationDbo => {
      const result = insertApplication.run(params);
      const application = findById.get({ id: Number(result.lastInsertRowid) });
      if (application === undefined) throw new Error("Candidature créée introuvable");
      return application;
    },
  };
};

export type ApplicationsRepository = ReturnType<typeof createApplicationsRepository>;