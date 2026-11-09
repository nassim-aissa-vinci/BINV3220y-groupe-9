import { Router } from "express";
import { toApplicationDto, toApplicationListItemDto } from "../mappers/application.mapper.ts";
import { getCurrentUser } from "../middlewares/authenticate.ts";
import { authorize } from "../middlewares/authorize.ts";
import type { ApplicationsService } from "../services/applications.service.ts";
import {
  canApplyToOffers,
  canViewOwnApplications,
  canWithdrawOwnApplications,
} from "../services/permissions.ts";
import { HttpError } from "../utils/httpError.ts";

interface CreateApplicationBody {
  offerId: number;
  message?: string;
}

const isCreateApplicationBody = (value: unknown): value is CreateApplicationBody => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const body = value as Record<string, unknown>;
  return (
    typeof body.offerId === "number" &&
    Number.isInteger(body.offerId) &&
    body.offerId > 0 &&
    (body.message === undefined || typeof body.message === "string")
  );
};

const parseApplicationId = (value: unknown): number => {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    throw new HttpError(400, "INVALID_QUERY", "L'identifiant de candidature doit être un entier positif");
  }
  const applicationId = Number(value);
  if (!Number.isSafeInteger(applicationId)) {
    throw new HttpError(400, "INVALID_QUERY", "L'identifiant de candidature doit être un entier positif");
  }
  return applicationId;
};

export const createApplicationsRouter = (applicationsService: ApplicationsService) => {
  const router = Router();

  router.get("/me", authorize(canViewOwnApplications), (req, res) => {
    const applications = applicationsService.listOwnApplications(getCurrentUser(req));
    res.json(applications.map(toApplicationListItemDto));
  });

  router.patch("/:applicationId/withdraw", authorize(canWithdrawOwnApplications), (req, res) => {
    const application = applicationsService.withdrawApplication(
      getCurrentUser(req),
      parseApplicationId(req.params.applicationId),
    );
    res.json(toApplicationDto(application));
  });

  router.post("/", authorize(canApplyToOffers), (req, res) => {
    const body: unknown = req.body;
    if (!isCreateApplicationBody(body)) {
      throw new HttpError(
        400,
        "INVALID_BODY",
        "Le corps doit contenir offerId (entier positif) et un message facultatif",
      );
    }

    const application = applicationsService.applyToOffer(
      getCurrentUser(req),
      body.offerId,
      body.message,
    );
    res.status(201).json(toApplicationDto(application));
  });

  return router;
};