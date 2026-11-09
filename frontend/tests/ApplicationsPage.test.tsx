import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ApplicationsPage from "../src/pages/ApplicationsPage.tsx";
import { stubFetch } from "./helpers/fetchMock.ts";

const applications = [
  {
    id: 1,
    offerId: 1,
    offerTitle: "Application React de gestion de flotte",
    companyShortName: "Lumen Digital",
    academicYear: "2026-2027",
    period: "P2",
    message: "Le développement React m'intéresse particulièrement.",
    status: "IN_PROGRESS",
    appliedAt: "2026-10-02 18:10:00",
  },
  {
    id: 2,
    offerId: 6,
    offerTitle: "Migration d'une application vers le cloud",
    companyShortName: "Datavia",
    academicYear: "2026-2027",
    period: "P2",
    message: null,
    status: "SELECTED",
    appliedAt: "2026-09-22 12:00:00",
  },
  {
    id: 3,
    offerId: 7,
    offerTitle: "Assistant conversationnel interne",
    companyShortName: "Nexalis",
    academicYear: "2026-2027",
    period: "OTHER",
    message: null,
    status: "REJECTED",
    appliedAt: "2026-09-20 12:00:00",
  },
  {
    id: 4,
    offerId: 3,
    offerTitle: "API REST de facturation",
    companyShortName: "Orbis",
    academicYear: "2026-2027",
    period: "P2",
    message: null,
    status: "WITHDRAWN",
    appliedAt: "2026-09-18 12:00:00",
  },
];

describe("ApplicationsPage", () => {
  it("affiche ses candidatures avec les libellés français des statuts", async () => {
    const fetchMock = stubFetch({ "/api/applications/me": () => Response.json(applications) });

    render(<ApplicationsPage token="jeton" onUnauthorized={vi.fn()} />);

    expect(await screen.findByText("Application React de gestion de flotte")).toBeInTheDocument();
    expect(screen.getByText("Migration d'une application vers le cloud")).toBeInTheDocument();
    expect(screen.getByText("Assistant conversationnel interne")).toBeInTheDocument();
    expect(screen.getByText("API REST de facturation")).toBeInTheDocument();
    expect(screen.getByText("En cours")).toBeInTheDocument();
    expect(screen.getByText("Retenue")).toBeInTheDocument();
    expect(screen.getByText("Non retenue")).toBeInTheDocument();
    expect(screen.getByText("Retirée")).toBeInTheDocument();
    expect(screen.getAllByText("Aucun message")).toHaveLength(3);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/applications/me");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      headers: { Authorization: "jeton" },
    });
  });

  it("affiche un état vide", async () => {
    stubFetch({ "/api/applications/me": () => Response.json([]) });

    render(<ApplicationsPage token="jeton" onUnauthorized={vi.fn()} />);

    expect(
      await screen.findByText("Vous n'avez pas encore candidaté à une offre."),
    ).toBeInTheDocument();
  });

  it("affiche les erreurs de chargement", async () => {
    stubFetch({ "/api/applications/me": () => new Response(null, { status: 500 }) });

    render(<ApplicationsPage token="jeton" onUnauthorized={vi.fn()} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("statut 500");
  });

  it("délègue la session expirée à onUnauthorized", async () => {
    stubFetch({ "/api/applications/me": () => new Response(null, { status: 401 }) });
    const onUnauthorized = vi.fn();

    render(<ApplicationsPage token="jeton" onUnauthorized={onUnauthorized} />);

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalled());
  });

  it("retire une candidature en cours et conserve sa ligne dans l'historique", async () => {
    const fetchMock = stubFetch({
      "/api/applications/1/withdraw": () =>
        Response.json({
          id: 1,
          offerId: 1,
          message: "Le développement React m'intéresse particulièrement.",
          status: "WITHDRAWN",
          appliedAt: "2026-10-02 18:10:00",
        }),
      "/api/applications/me": () => Response.json(applications),
    });

    render(<ApplicationsPage token="jeton" onUnauthorized={vi.fn()} />);

    const row = await screen.findByRole("row", { name: /Application React de gestion de flotte/ });
    expect(screen.getAllByRole("button", { name: "Retirer" })).toHaveLength(1);
    fireEvent.click(within(row).getByRole("button", { name: "Retirer" }));

    expect(await within(row).findByText("Retirée")).toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: "Retirer" })).not.toBeInTheDocument();
    const call = fetchMock.mock.calls.find(([url]) => url === "/api/applications/1/withdraw");
    expect(call?.[1]).toMatchObject({
      method: "PATCH",
      headers: { Authorization: "jeton" },
    });
  });

  it("affiche une erreur 409 et conserve l'action de retrait", async () => {
    stubFetch({
      "/api/applications/1/withdraw": () => new Response(null, { status: 409 }),
      "/api/applications/me": () => Response.json(applications),
    });

    render(<ApplicationsPage token="jeton" onUnauthorized={vi.fn()} />);

    const row = await screen.findByRole("row", { name: /Application React de gestion de flotte/ });
    fireEvent.click(within(row).getByRole("button", { name: "Retirer" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("statut 409");
    expect(within(row).getByRole("button", { name: "Retirer" })).toBeInTheDocument();
  });
});