import { useEffect, useState } from "react";
import type { Offer, PeriodCode } from "../models/offer.ts";
import { getOffers } from "../services/offers.service.ts";
import { isUnauthorized } from "../utils/api.ts";

interface OffersRequestState {
  period: PeriodCode | undefined;
  search: string;
  offers: Offer[];
  isLoading: boolean;
  error: string | null;
}

const SEARCH_DELAY_MS = 300;

/**
 * Offres visibles par l'utilisateur, choisies par le backend selon son profil.
 * onUnauthorized doit être stable (useCallback) pour ne pas relancer le chargement.
 */
export const useOffers = (
  token: string,
  onUnauthorized: () => void,
  period?: PeriodCode,
  search = "",
) => {
  const normalizedSearch = search.trim();
  const [requestState, setRequestState] = useState<OffersRequestState>({
    period: undefined,
    search: "",
    offers: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    const timeoutId = window.setTimeout(() => {
      getOffers(token, period, normalizedSearch, controller.signal)
        .then((data) => {
          if (!controller.signal.aborted) {
            setRequestState({
              period,
              search: normalizedSearch,
              offers: data,
              isLoading: false,
              error: null,
            });
          }
        })
        .catch((reason: unknown) => {
          if (controller.signal.aborted) return;
          if (isUnauthorized(reason)) {
            onUnauthorized();
          } else {
            setRequestState({
              period,
              search: normalizedSearch,
              offers: [],
              isLoading: false,
              error: reason instanceof Error ? reason.message : "Erreur inconnue",
            });
          }
        });
    }, normalizedSearch === "" ? 0 : SEARCH_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [token, onUnauthorized, period, normalizedSearch]);

  if (requestState.period !== period || requestState.search !== normalizedSearch) {
    return { offers: [], isLoading: true, error: null };
  }
  return requestState;
};
