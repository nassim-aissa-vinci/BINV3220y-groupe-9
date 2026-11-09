import { useState } from "react";
import type { Offer } from "../models/offer.ts";
import { createApplication } from "../services/applications.service.ts";
import { isUnauthorized } from "../utils/api.ts";

export const useApplyToOffer = (
  token: string,
  onUnauthorized: () => void,
  canApply: boolean,
) => {
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectOffer = (offerId: number) => {
    setSelectedOfferId(offerId);
    setMessage("");
    setError(null);
    setNotice(null);
  };

  const submitApplication = async (offer: Offer | undefined) => {
    if (!canApply || offer?.status !== "PUBLISHED") return;

    setIsSubmitting(true);
    setError(null);
    try {
      await createApplication(token, offer.id, message);
      setSelectedOfferId(null);
      setMessage("");
      setNotice("Votre candidature a été envoyée.");
    } catch (reason) {
      if (isUnauthorized(reason)) {
        onUnauthorized();
      } else {
        setError(reason instanceof Error ? reason.message : "Erreur inconnue");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    selectedOfferId,
    message,
    error,
    notice,
    isSubmitting,
    selectOffer,
    setMessage,
    submitApplication,
    cancelApplication: () => setSelectedOfferId(null),
  };
};