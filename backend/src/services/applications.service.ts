import { toApplication, toApplicationListItem } from "../mappers/application.mapper.ts";
import type { Application, ApplicationListItem } from "../models/application.ts";
import type { User } from "../models/user.ts";
import type { ApplicationsRepository } from "../repositories/applications.repository.ts";
import { HttpError } from "../utils/httpError.ts";
import { canApplyToOffers, canViewOwnApplications } from "./permissions.ts";

const MAX_MESSAGE_LENGTH = 1000;

const isUniqueConstraintError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === "SQLITE_CONSTRAINT_UNIQUE";

export const createApplicationsService = (repository: ApplicationsRepository) => ({
  listOwnApplications: (student: User): ApplicationListItem[] => {
    if (!canViewOwnApplications(student)) {
      throw new HttpError(403, "FORBIDDEN", "Seul un étudiant peut consulter ses candidatures");
    }
    return repository.findAllForStudent(student.id).map(toApplicationListItem);
  },

  applyToOffer: (student: User, offerId: number, message?: string): Application => {
    if (!canApplyToOffers(student)) {
      throw new HttpError(403, "FORBIDDEN", "Seul un étudiant peut candidater");
    }

    const offerStatus = repository.findOfferStatus(offerId);
    if (offerStatus === undefined) {
      throw new HttpError(404, "NOT_FOUND", "Offre introuvable");
    }
    if (offerStatus !== "PUBLISHED") {
      throw new HttpError(409, "OFFER_NOT_PUBLISHED", "Cette offre n'est pas publiée");
    }

    const normalizedMessage = message?.trim() || null;
    if (normalizedMessage !== null && normalizedMessage.length > MAX_MESSAGE_LENGTH) {
      throw new HttpError(
        400,
        "INVALID_BODY",
        `Le message ne peut pas dépasser ${MAX_MESSAGE_LENGTH} caractères`,
      );
    }

    if (repository.hasActiveForOffer(offerId, student.id)) {
      throw new HttpError(409, "APPLICATION_EXISTS", "Vous avez déjà candidaté à cette offre");
    }

    try {
      return toApplication(
        repository.create({ offerId, studentId: student.id, message: normalizedMessage }),
      );
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new HttpError(409, "APPLICATION_EXISTS", "Vous avez déjà candidaté à cette offre");
      }
      throw error;
    }
  },
});

export type ApplicationsService = ReturnType<typeof createApplicationsService>;