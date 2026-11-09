import { Router } from "express";
import { toApplicationDto } from "../mappers/application.mapper.ts";
import { getCurrentUser } from "../middlewares/authenticate.ts";
import { authorize } from "../middlewares/authorize.ts";
import type { ApplicationsService } from "../services/applications.service.ts";
import { canApplyToOffers } from "../services/permissions.ts";
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

export const createApplicationsRouter = (applicationsService: ApplicationsService) => {
  const router = Router();

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