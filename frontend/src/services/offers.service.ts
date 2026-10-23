import type { Offer, PeriodCode } from "../models/offer.ts";
import { API_URL, readJson } from "../utils/api.ts";
import { isOfferList } from "../utils/guards.ts";

export const getOffers = async (
  token: string,
  period?: PeriodCode,
  signal?: AbortSignal,
): Promise<Offer[]> => {
  const query = new URLSearchParams();
  if (period !== undefined) query.set("period", period === "OTHER" ? "Autre" : period);
  const queryString = query.toString();
  const url = `${API_URL}/offers${queryString === "" ? "" : `?${queryString}`}`;
  const response = await fetch(url, {
    headers: { Authorization: token },
    signal,
  });
  return readJson(response, isOfferList, "Chargement des offres impossible");
};
