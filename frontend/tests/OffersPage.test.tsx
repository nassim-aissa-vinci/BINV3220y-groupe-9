import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OffersPage from "../src/pages/OffersPage.tsx";
import { adminUser, contactUser, stubFetch, studentUser } from "./helpers/fetchMock.ts";

const p2Offer = {
  id: 2,
  title: "Refonte du portail client",
  companyShortName: "Lumen Digital",
  academicYear: "2026-2027",
  period: "P2",
  status: "SUBMITTED",
};

const otherOffer = {
  id: 5,
  title: "Tableau de bord de qualité des données",
  companyShortName: "Lumen Data",
  academicYear: "2026-2027",
  period: "OTHER",
  status: "ASSIGNED",
};

const p1Offer = {
  id: 9,
  title: "Module de rapports PDF",
  companyShortName: "Orbis",
  academicYear: "2025-2026",
  period: "P1",
  status: "ARCHIVED",
};

const offers = [p2Offer, otherOffer, p1Offer];

describe("OffersPage", () => {
  it("affiche les offres avec leurs libellés français", async () => {
    const fetchMock = stubFetch({ "/api/offers": () => Response.json(offers) });

    render(<OffersPage user={contactUser} token="jeton" onUnauthorized={vi.fn()} />);

    expect(await screen.findByText("Refonte du portail client")).toBeInTheDocument();
    expect(screen.getByText("Soumise")).toBeInTheDocument();
    expect(screen.getByText("Attribuée")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Autre" })).toBeInTheDocument();
    expect(screen.getByText("Module de rapports PDF")).toBeInTheDocument();
    expect(screen.getByText("3 offres")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Période" })).toHaveValue("");
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/offers");
    expect(screen.getByText("Les offres que vous avez déposées.")).toBeInTheDocument();
  });

  it.each([
    ["P1", "P1", p1Offer.title],
    ["P2", "P2", p2Offer.title],
    ["Autre", "Autre", otherOffer.title],
  ])("demande les offres de la période %s", async (label, queryValue, expectedTitle) => {
    const fetchMock = stubFetch({
      "/api/offers?period=P1": () => Response.json([p1Offer]),
      "/api/offers?period=P2": () => Response.json([p2Offer]),
      "/api/offers?period=Autre": () => Response.json([otherOffer]),
      "/api/offers": () => Response.json(offers),
    });

    render(<OffersPage user={contactUser} token="jeton" onUnauthorized={vi.fn()} />);

    await screen.findByText("3 offres");
    fireEvent.change(screen.getByRole("combobox", { name: "Période" }), {
      target: { value: label === "Autre" ? "OTHER" : label },
    });

    expect(await screen.findByText("1 offre")).toBeInTheDocument();
    expect(screen.getByText(expectedTitle)).toBeInTheDocument();
    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe(`/api/offers?period=${queryValue}`);
  });

  it("adapte la description au profil", async () => {
    stubFetch({ "/api/offers": () => Response.json([]) });

    const { unmount } = render(
      <OffersPage user={studentUser} token="jeton" onUnauthorized={vi.fn()} />,
    );
    expect(screen.getByText("Les offres publiées.")).toBeInTheDocument();
    expect(await screen.findByText("Aucune offre à afficher.")).toBeInTheDocument();
    unmount();

    render(<OffersPage user={adminUser} token="jeton" onUnauthorized={vi.fn()} />);
    expect(screen.getByText("Toutes les offres, tous statuts confondus.")).toBeInTheDocument();
  });

  it("affiche un refus d'accès renvoyé par le backend", async () => {
    stubFetch({ "/api/offers": () => new Response(null, { status: 403 }) });

    render(<OffersPage user={contactUser} token="jeton" onUnauthorized={vi.fn()} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("statut 403");
  });

  it("signale une session expirée", async () => {
    stubFetch({ "/api/offers": () => new Response(null, { status: 401 }) });
    const onUnauthorized = vi.fn();

    render(<OffersPage user={contactUser} token="jeton" onUnauthorized={onUnauthorized} />);

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalled());
  });
});
