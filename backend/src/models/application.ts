export const APPLICATION_STATUSES = [
  "IN_PROGRESS",
  "SELECTED",
  "REJECTED",
  "WITHDRAWN",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface ApplicationDbo {
  id: number;
  offer_id: number;
  student_id: number;
  message: string | null;
  status: ApplicationStatus;
  applied_at: string;
}

export interface Application {
  id: number;
  offerId: number;
  message: string | null;
  status: ApplicationStatus;
  appliedAt: string;
}

export interface ApplicationDto {
  id: number;
  offerId: number;
  message: string | null;
  status: ApplicationStatus;
  appliedAt: string;
}

export interface ApplicationListDbo extends ApplicationDbo {
  offer_title: string;
  company_short_name: string;
  academic_year_label: string;
  period_code: "P1" | "P2" | "OTHER";
}

export interface ApplicationListItem extends Application {
  offerTitle: string;
  companyShortName: string;
  academicYear: string;
  period: "P1" | "P2" | "OTHER";
}

export type ApplicationListItemDto = ApplicationListItem;