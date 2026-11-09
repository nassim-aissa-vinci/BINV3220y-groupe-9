import { useEffect, useState } from "react";
import type { ApplicationListItem } from "../models/application.ts";
import { getMyApplications, withdrawMyApplication } from "../services/applications.service.ts";
import { isUnauthorized } from "../utils/api.ts";

interface ApplicationsRequestState {
  token: string | null;
  applications: ApplicationListItem[];
  isLoading: boolean;
  error: string | null;
}

export const useApplications = (token: string, onUnauthorized: () => void) => {
  const [requestState, setRequestState] = useState<ApplicationsRequestState>({
    token: null,
    applications: [],
    isLoading: true,
    error: null,
  });
  const [withdrawalError, setWithdrawalError] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);

  const withdrawApplication = async (applicationId: number) => {
    setWithdrawingId(applicationId);
    setWithdrawalError(null);
    try {
      const withdrawn = await withdrawMyApplication(token, applicationId);
      setRequestState((current) => ({
        ...current,
        applications: current.applications.map((application) =>
          application.id === withdrawn.id
            ? { ...application, status: withdrawn.status }
            : application,
        ),
      }));
    } catch (reason) {
      if (isUnauthorized(reason)) {
        onUnauthorized();
      } else {
        setWithdrawalError(reason instanceof Error ? reason.message : "Erreur inconnue");
      }
    } finally {
      setWithdrawingId(null);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    getMyApplications(token, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setRequestState({ token, applications: data, isLoading: false, error: null });
        }
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        if (isUnauthorized(reason)) {
          onUnauthorized();
        } else {
          setRequestState({
            token,
            applications: [],
            isLoading: false,
            error: reason instanceof Error ? reason.message : "Erreur inconnue",
          });
        }
      });

    return () => controller.abort();
  }, [token, onUnauthorized]);

  const currentRequest =
    requestState.token === token
      ? requestState
      : { applications: [], isLoading: true, error: null };

  return {
    ...currentRequest,
    withdrawalError,
    withdrawingId,
    withdrawApplication,
  };
};