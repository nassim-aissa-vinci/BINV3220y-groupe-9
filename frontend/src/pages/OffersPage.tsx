import { useState } from "react";
import type { ChangeEvent } from "react";
import EmptyState from "../components/EmptyState.tsx";
import ErrorState from "../components/ErrorState.tsx";
import LoadingState from "../components/LoadingState.tsx";
import OfferTable from "../components/OfferTable.tsx";
import { useOffers } from "../hooks/useOffers.ts";
import type { Offer } from "../models/offer.ts";
import type { PeriodCode } from "../models/offer.ts";
import { createApplication } from "../services/applications.service.ts";
import { isUnauthorized } from "../utils/api.ts";
import { isPeriodCode } from "../utils/guards.ts";
import type { User } from "../models/user.ts";

interface OffersPageProps {
  user: User;
  token: string;
  onUnauthorized: () => void;
}

const DESCRIPTIONS = {
  ADMIN: "Toutes les offres, tous statuts confondus.",
  STUDENT: "Les offres publiées.",
  CONTACT: "Les offres que vous avez déposées.",
} as const;

const OffersPage = ({ user, token, onUnauthorized }: OffersPageProps) => {
  const [period, setPeriod] = useState<PeriodCode | undefined>();
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [applicationError, setApplicationError] = useState<string | null>(null);
  const [applicationNotice, setApplicationNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { offers, isLoading, error } = useOffers(token, onUnauthorized, period);
  const selectedOffer = offers.find((offer) => offer.id === selectedOfferId);

  const handlePeriodChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.currentTarget.value;
    setPeriod(isPeriodCode(value) ? value : undefined);
  };

  const handleApply = (offer: Offer) => {
    setSelectedOfferId(offer.id);
    setMessage("");
    setApplicationError(null);
    setApplicationNotice(null);
  };

  const handleSubmitApplication = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (user.kind !== "STUDENT" || selectedOffer?.status !== "PUBLISHED") return;

    setIsSubmitting(true);
    setApplicationError(null);
    try {
      await createApplication(token, selectedOffer.id, message);
      setSelectedOfferId(null);
      setMessage("");
      setApplicationNotice("Votre candidature a été envoyée.");
    } catch (reason) {
      if (isUnauthorized(reason)) {
        onUnauthorized();
      } else {
        setApplicationError(reason instanceof Error ? reason.message : "Erreur inconnue");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (error) return <ErrorState message={error} />;
    if (isLoading) return <LoadingState />;
    if (offers.length === 0) return <EmptyState message="Aucune offre à afficher." />;
    return (
      <>
        <p className="result-count">
          {offers.length} offre{offers.length > 1 ? "s" : ""}
        </p>
        <OfferTable offers={offers} onApply={user.kind === "STUDENT" ? handleApply : undefined} />
        {user.kind === "STUDENT" && selectedOffer?.status === "PUBLISHED" && (
          <form className="application-form" onSubmit={handleSubmitApplication}>
            <h2>Candidater à « {selectedOffer.title} »</h2>
            <label htmlFor="application-message">Message (facultatif, 1000 caractères maximum)</label>
            <textarea
              id="application-message"
              maxLength={1000}
              value={message}
              onChange={(event) => setMessage(event.currentTarget.value)}
            />
            {applicationError && <ErrorState message={applicationError} />}
            <button className="button button-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Envoi…" : "Envoyer ma candidature"}
            </button>
            <button
              className="button"
              type="button"
              onClick={() => setSelectedOfferId(null)}
              disabled={isSubmitting}
            >
              Annuler
            </button>
          </form>
        )}
        {applicationNotice && <p className="state state-success">{applicationNotice}</p>}
      </>
    );
  };

  return (
    <section>
      <h1>Offres de stage</h1>
      <p>{DESCRIPTIONS[user.kind]}</p>
      <div className="field">
        <label htmlFor="offers-period">Période</label>
        <select id="offers-period" value={period ?? ""} onChange={handlePeriodChange}>
          <option value="">Toutes les périodes</option>
          <option value="P1">P1</option>
          <option value="P2">P2</option>
          <option value="OTHER">Autre</option>
        </select>
      </div>
      {renderContent()}
    </section>
  );
};

export default OffersPage;
