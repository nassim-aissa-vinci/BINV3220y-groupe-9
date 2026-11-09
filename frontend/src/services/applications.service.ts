import type { Application } from "../models/application.ts";
import { API_URL, readJson } from "../utils/api.ts";
import { isApplication } from "../utils/guards.ts";

export const createApplication = async (
  token: string,
  offerId: number,
  message: string,
): Promise<Application> => {
  const response = await fetch(`${API_URL}/applications`, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ offerId, message }),
  });
  return readJson(response, isApplication, "Envoi de la candidature impossible");
};