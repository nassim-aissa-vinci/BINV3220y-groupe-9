import { useEffect, useState } from "react";
import type { ApplicationListItem } from "../models/application.ts";
import { getMyApplications, withdrawMyApplication } from "../services/applications.service.ts";
import { isUnauthorized } from "../utils/api.ts";

export const useApplications = (token: string, onUnauthorized: () => void) => {
  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawalError, setWithdrawalError] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);

  const withdrawApplication = async (applicationId: number) => {
    setWithdrawingId(applicationId);
    setWithdrawalError(null);
    try {
      const withdrawn = await withdrawMyApplication(token, applicationId);
      setApplications((current) =>
        current.map((application) =>
          application.id === withdrawn.id ? { ...application, status: withdrawn.status } : application,
        ),
      );
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
    setIsLoading(true);
    setError(null);

    getMyApplications(token, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setApplications(data);
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        if (isUnauthorized(reason)) {
          onUnauthorized();
        } else {
          setError(reason instanceof Error ? reason.message : "Erreur inconnue");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [token, onUnauthorized]);

  return {
    applications,
    isLoading,
    error,
    withdrawalError,
    withdrawingId,
    withdrawApplication,
  };
};