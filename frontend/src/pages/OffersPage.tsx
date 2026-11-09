import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import EmptyState from "../components/EmptyState.tsx";
import ErrorState from "../components/ErrorState.tsx";
import LoadingState from "../components/LoadingState.tsx";
import OfferTable from "../components/OfferTable.tsx";
import { useApplyToOffer } from "../hooks/useApplyToOffer.ts";
import { useOffers } from "../hooks/useOffers.ts";
import type { Offer, PeriodCode } from "../models/offer.ts";
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
  const { offers, isLoading, error } = useOffers(token, onUnauthorized, period);
  const application = useApplyToOffer(token, onUnauthorized, user.kind === "STUDENT");
  const {
    selectedOfferId,
    message,
    error: applicationError,
    notice: applicationNotice,
    isSubmitting,
    selectOffer,
    setMessage,
    submitApplication,
    cancelApplication,
  } = application;
  const selectedOffer = offers.find((offer) => offer.id === selectedOfferId);

  const handlePeriodChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.currentTarget.value;
    setPeriod(isPeriodCode(value) ? value : undefined);
  };

  const handleApply = (offer: Offer) => selectOffer(offer.id);

  const handleSubmitApplication = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitApplication(selectedOffer);
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
              onClick={cancelApplication}
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
