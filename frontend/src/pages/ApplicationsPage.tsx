import EmptyState from "../components/EmptyState.tsx";
import ErrorState from "../components/ErrorState.tsx";
import LoadingState from "../components/LoadingState.tsx";
import StatusBadge from "../components/StatusBadge.tsx";
import { useApplications } from "../hooks/useApplications.ts";
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_TONES, PERIOD_LABELS } from "../utils/labels.ts";

interface ApplicationsPageProps {
  token: string;
  onUnauthorized: () => void;
}

const ApplicationsPage = ({ token, onUnauthorized }: ApplicationsPageProps) => {
  const { applications, isLoading, error } = useApplications(token, onUnauthorized);

  if (error) return <ErrorState message={error} />;
  if (isLoading) return <LoadingState />;
  if (applications.length === 0) {
    return (
      <section>
        <h1>Mes candidatures</h1>
        <EmptyState message="Vous n'avez pas encore candidaté à une offre." />
      </section>
    );
  }

  return (
    <section>
      <h1>Mes candidatures</h1>
      <p className="result-count">
        {applications.length} candidature{applications.length > 1 ? "s" : ""}
      </p>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Offre</th>
              <th scope="col">Entreprise</th>
              <th scope="col">Année</th>
              <th scope="col">Période</th>
              <th scope="col">Date</th>
              <th scope="col">Message</th>
              <th scope="col">Statut</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr key={application.id}>
                <td>{application.offerTitle}</td>
                <td>{application.companyShortName}</td>
                <td>{application.academicYear}</td>
                <td>{PERIOD_LABELS[application.period]}</td>
                <td>
                  <time dateTime={application.appliedAt}>{application.appliedAt.slice(0, 10)}</time>
                </td>
                <td>{application.message ?? "Aucun message"}</td>
                <td>
                  <StatusBadge
                    label={APPLICATION_STATUS_LABELS[application.status]}
                    tone={APPLICATION_STATUS_TONES[application.status]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ApplicationsPage;