import { useEffect, useState } from "react";
import type { Offer, PeriodCode } from "../models/offer.ts";
import { getOffers } from "../services/offers.service.ts";
import { isUnauthorized } from "../utils/api.ts";

interface OffersRequestState {
  period: PeriodCode | undefined;
  offers: Offer[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Offres visibles par l'utilisateur, choisies par le backend selon son profil.
 * onUnauthorized doit être stable (useCallback) pour ne pas relancer le chargement.
 */
export const useOffers = (
  token: string,
  onUnauthorized: () => void,
  period?: PeriodCode,
) => {
  const [requestState, setRequestState] = useState<OffersRequestState>({
    period: undefined,
    offers: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    getOffers(token, period, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setRequestState({ period, offers: data, isLoading: false, error: null });
        }
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        if (isUnauthorized(reason)) {
          onUnauthorized();
        } else {
          setRequestState({
            period,
            offers: [],
            isLoading: false,
            error: reason instanceof Error ? reason.message : "Erreur inconnue",
          });
        }
      });

    return () => controller.abort();
  }, [token, onUnauthorized, period]);

  if (requestState.period !== period) {
    return { offers: [], isLoading: true, error: null };
  }
  return requestState;
};
