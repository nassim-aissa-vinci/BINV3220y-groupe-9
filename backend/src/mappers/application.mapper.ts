import type {
  Application,
  ApplicationDbo,
  ApplicationDto,
  ApplicationListDbo,
  ApplicationListItem,
  ApplicationListItemDto,
} from "../models/application.ts";

export const toApplication = (dbo: ApplicationDbo): Application => ({
  id: dbo.id,
  offerId: dbo.offer_id,
  message: dbo.message,
  status: dbo.status,
  appliedAt: dbo.applied_at,
});

export const toApplicationDto = (application: Application): ApplicationDto => ({
  id: application.id,
  offerId: application.offerId,
  message: application.message,
  status: application.status,
  appliedAt: application.appliedAt,
});

export const toApplicationListItem = (dbo: ApplicationListDbo): ApplicationListItem => ({
  ...toApplication(dbo),
  offerTitle: dbo.offer_title,
  companyShortName: dbo.company_short_name,
  academicYear: dbo.academic_year_label,
  period: dbo.period_code,
});

export const toApplicationListItemDto = (
  application: ApplicationListItem,
): ApplicationListItemDto => ({ ...application });