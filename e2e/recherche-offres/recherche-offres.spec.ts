import { expect, test, type Page } from "@playwright/test";

// Scénarios décrits dans ./scenarios.md (EF-30, recherche d'offres par titre).
// Données : seed de démonstration, recréé dans une base dédiée à chaque lancement
// (voir playwright.config.ts). Les tests ne font que lire : aucun nettoyage n'est nécessaire
// et ils ne dépendent pas de leur ordre d'exécution.

const FLEET_APP = "Application React de gestion de flotte";
const CLOUD_MIGRATION = "Migration d'une application vers le cloud"; // attribuée : invisible pour un étudiant
const E2E_TESTS = "Automatisation des tests de bout en bout"; // en attente : invisible pour un étudiant
const PUBLISHED_OFFERS_COUNT = 4;

const NO_MATCH_MESSAGE = "Aucune offre ne correspond à votre recherche.";
const EMPTY_LIST_MESSAGE = "Aucune offre à afficher.";

const openOffersAsLucas = async (page: Page) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Lucas Dupont" }).click();
  await expect(page.getByRole("heading", { name: "Bonjour Lucas" })).toBeVisible();

  await page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", { name: "Offres" }).click();
  await expect(page).toHaveURL(/\/offres$/);
  await expect(page.getByRole("heading", { name: "Offres de stage", level: 1 })).toBeVisible();

  // État initial : la période ne filtre pas et seules les offres publiées du seed sont listées.
  await expect(page.getByRole("combobox", { name: "Période" })).toHaveValue("");
  await expect(page.getByText(`${PUBLISHED_OFFERS_COUNT} offres`, { exact: true })).toBeVisible();
};

const searchTitle = (page: Page, text: string) =>
  page.getByRole("searchbox", { name: "Mot-clé dans le titre" }).fill(text);

const offerRows = (page: Page) =>
  page.getByRole("table").getByRole("row").filter({ has: page.getByRole("cell") });

test("scénario 1 — recherche avec résultat : seule l'offre publiée dont le titre contient le mot est affichée", async ({
  page,
}) => {
  await openOffersAsLucas(page);

  await searchTitle(page, "application");

  await expect(page.getByText("1 offre", { exact: true })).toBeVisible();
  await expect(offerRows(page)).toHaveCount(1);

  const row = offerRows(page).first();
  await expect(row.getByRole("cell").nth(0)).toHaveText(FLEET_APP);
  await expect(row.getByRole("cell").nth(1)).toHaveText("Lumen Digital");
  await expect(row.getByRole("cell").nth(4)).toHaveText("Publiée");

  // Le mot figure aussi dans le titre d'une offre attribuée : la recherche ne contourne pas la visibilité.
  await expect(page.getByText(CLOUD_MIGRATION)).toHaveCount(0);
  await expect(page.getByText(NO_MATCH_MESSAGE)).toHaveCount(0);
  await expect(page.getByText(EMPTY_LIST_MESSAGE)).toHaveCount(0);
});

test("scénario 2 — recherche sans résultat : un message propre à la recherche est affiché", async ({ page }) => {
  await openOffersAsLucas(page);

  await searchTitle(page, "bout en bout");

  await expect(page.getByText(NO_MATCH_MESSAGE, { exact: true })).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(page.getByText(/^\d+ offres?$/)).toHaveCount(0);
  await expect(page.getByText(EMPTY_LIST_MESSAGE)).toHaveCount(0);

  // L'expression existe en base, mais seulement dans une offre en attente : elle ne fuit pas.
  await expect(page.getByText(E2E_TESTS)).toHaveCount(0);
});
