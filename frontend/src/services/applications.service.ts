import type { Application, ApplicationListItem } from "../models/application.ts";
import { API_URL, readJson } from "../utils/api.ts";
import { isApplication, isApplicationList } from "../utils/guards.ts";

export const getMyApplications = async (
  token: string,
  signal?: AbortSignal,
): Promise<ApplicationListItem[]> => {
  const response = await fetch(`${API_URL}/applications/me`, {
    headers: { Authorization: token },
    signal,
  });
  return readJson(response, isApplicationList, "Chargement de vos candidatures impossible");
};

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