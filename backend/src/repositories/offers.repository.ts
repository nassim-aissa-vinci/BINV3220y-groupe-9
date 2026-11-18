import type { Db } from "../db/database.ts";
import type { OfferDbo, OfferStatus, PeriodCode } from "../models/offer.ts";

export interface OfferFilter {
  /** Limite aux offres de ce statut. */
  status?: OfferStatus;
  /** Limite aux offres déposées par ce contact. */
  depositorContactId?: number;
  /** Limite aux offres de cette période. */
  period?: PeriodCode;
  /** Texte recherché dans le titre. */
  search?: string;
}

interface FindAllParams {
  status: OfferStatus | null;
  depositorContactId: number | null;
  period: PeriodCode | null;
  search: string | null;
}

export const createOffersRepository = (db: Db) => {
  const findAll = db.prepare<FindAllParams, OfferDbo>(`
    SELECT o.id, o.title, o.description, o.status,
           o.company_id, c.short_name AS company_short_name,
           o.depositor_contact_id,
           ay.label AS academic_year_label, p.code AS period_code,
           o.created_at, o.updated_at
    FROM offers o
    JOIN companies c ON c.id = o.company_id
    JOIN academic_years ay ON ay.id = o.academic_year_id
    JOIN periods p ON p.id = o.period_id
    WHERE (@status IS NULL OR o.status = @status)
      AND (@depositorContactId IS NULL OR o.depositor_contact_id = @depositorContactId)
      AND (@period IS NULL OR p.code = @period)
      AND (@search IS NULL OR instr(lower(o.title), lower(@search)) > 0)
    ORDER BY ay.start_date DESC, o.created_at DESC
  `);

  return {
    /** Offres correspondant au filtre, de la plus récente année à la plus ancienne. */
    findAll: ({ status, depositorContactId, period, search }: OfferFilter): OfferDbo[] =>
      findAll.all({
        status: status ?? null,
        depositorContactId: depositorContactId ?? null,
        period: period ?? null,
        search: search ?? null,
      }),
  };
};

export type OffersRepository = ReturnType<typeof createOffersRepository>;
