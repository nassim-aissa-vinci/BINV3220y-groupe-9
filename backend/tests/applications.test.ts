import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { ADMINISTRATOR, APPLICATION, CONTACT, OFFER, STUDENT } from "../src/db/seed/seedIds.ts";
import type { Db } from "../src/db/database.ts";
import { createTestApp, tokenFor } from "./helpers/testApp.ts";
import { createTestDatabase } from "./helpers/testDatabase.ts";

let db: Db;
let app: ReturnType<typeof createTestApp>;

beforeEach(() => {
  db = createTestDatabase();
  app = createTestApp(db);
});

const applyAs = (kind: "STUDENT" | "ADMIN" | "CONTACT", id: number, body: object) =>
  request(app)
    .post("/applications")
    .set("Authorization", tokenFor(kind, id))
    .send(body);

const listAs = (kind: "STUDENT" | "ADMIN" | "CONTACT", id: number) =>
  request(app).get("/applications/me").set("Authorization", tokenFor(kind, id));

const withdrawAs = (
  kind: "STUDENT" | "ADMIN" | "CONTACT",
  userId: number,
  applicationId: number,
) =>
  request(app)
    .patch(`/applications/${applicationId}/withdraw`)
    .set("Authorization", tokenFor(kind, userId));

describe("PATCH /applications/:applicationId/withdraw", () => {
  it("retire une candidature en cours en conservant son historique", async () => {
    const response = await withdrawAs("STUDENT", STUDENT.LUCAS_DUPONT, APPLICATION.LUCAS_FLEET_APP);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: APPLICATION.LUCAS_FLEET_APP,
      offerId: OFFER.FLEET_APP,
      message: "Le développement React m'intéresse particulièrement.",
      status: "WITHDRAWN",
    });
    const stored = db
      .prepare("SELECT id, student_id, message, status FROM applications WHERE id = ?")
      .get(APPLICATION.LUCAS_FLEET_APP) as {
      id: number;
      student_id: number;
      message: string;
      status: string;
    };
    expect(stored).toEqual({
      id: APPLICATION.LUCAS_FLEET_APP,
      student_id: STUDENT.LUCAS_DUPONT,
      message: "Le développement React m'intéresse particulièrement.",
      status: "WITHDRAWN",
    });

    const reapplication = await applyAs("STUDENT", STUDENT.LUCAS_DUPONT, {
      offerId: OFFER.FLEET_APP,
    });
    expect(reapplication.status).toBe(201);
    expect(reapplication.body.id).not.toBe(APPLICATION.LUCAS_FLEET_APP);
    const history = db
      .prepare("SELECT status FROM applications WHERE offer_id = ? AND student_id = ? ORDER BY id")
      .all(OFFER.FLEET_APP, STUDENT.LUCAS_DUPONT) as { status: string }[];
    expect(history.map((application) => application.status)).toEqual([
      "WITHDRAWN",
      "IN_PROGRESS",
    ]);
  });

  it.each([
    ["retenue", STUDENT.MATEUSZ_KOWALSKI, APPLICATION.MATEUSZ_CLOUD_MIGRATION],
    ["non retenue", STUDENT.LEA_MERTENS, APPLICATION.LEA_CLOUD_MIGRATION],
    ["déjà retirée", STUDENT.INES_HADDAD, APPLICATION.INES_BILLING_API],
  ] as const)("refuse le retrait d'une candidature %s (409)", async (_status, studentId, applicationId) => {
    const response = await withdrawAs("STUDENT", studentId, applicationId);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("APPLICATION_NOT_WITHDRAWABLE");
  });

  it("renvoie 404 si la candidature appartient à un autre étudiant", async () => {
    const response = await withdrawAs(
      "STUDENT",
      STUDENT.LUCAS_DUPONT,
      APPLICATION.INES_FLEET_APP,
    );

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("renvoie 404 si la candidature n'existe pas", async () => {
    const response = await withdrawAs("STUDENT", STUDENT.LUCAS_DUPONT, 999);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("refuse le retrait par un administrateur (403)", async () => {
    const response = await withdrawAs(
      "ADMIN",
      ADMINISTRATOR.ANNE_LECLERCQ,
      APPLICATION.LUCAS_FLEET_APP,
    );

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("rejette un identifiant invalide (400)", async () => {
    const response = await request(app)
      .patch("/applications/0/withdraw")
      .set("Authorization", tokenFor("STUDENT", STUDENT.LUCAS_DUPONT));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_QUERY");
  });
});

describe("GET /applications/me : accès et isolation", () => {
  it("refuse une requête sans session (401)", async () => {
    const response = await request(app).get("/applications/me");

    expect(response.status).toBe(401);
  });

  it.each([
    ["administrateur", "ADMIN" as const, ADMINISTRATOR.ANNE_LECLERCQ],
    ["contact déposant", "CONTACT" as const, CONTACT.MARC_LEJEUNE],
  ])("refuse la consultation par un %s (403)", async (_profile, kind, id) => {
    const response = await listAs(kind, id);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("retourne uniquement les candidatures de l'étudiant connecté", async () => {
    const response = await listAs("STUDENT", STUDENT.INES_HADDAD);

    expect(response.status).toBe(200);
    expect(response.body.map((application: { id: number }) => application.id)).toEqual([
      APPLICATION.INES_FLEET_APP,
      APPLICATION.INES_BILLING_API,
    ]);
    expect(response.body.every((application: { offerTitle: string }) =>
      typeof application.offerTitle === "string",
    )).toBe(true);
    expect(response.body[0]).toMatchObject({
      offerId: OFFER.FLEET_APP,
      offerTitle: "Application React de gestion de flotte",
      companyShortName: "Lumen Digital",
      academicYear: "2026-2027",
      period: "P2",
      status: "IN_PROGRESS",
    });
    expect(response.body[0]).not.toHaveProperty("studentId");
  });

  it("ne révèle pas les candidatures d'un autre étudiant", async () => {
    const response = await listAs("STUDENT", STUDENT.YOUSSEF_EL_AMRANI);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].id).toBe(APPLICATION.YOUSSEF_BILLING_API);
  });

  it("retourne une liste vide pour un étudiant sans candidature", async () => {
    const response = await listAs("STUDENT", STUDENT.DMYTRO_KOVALENKO);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});

describe("POST /applications : accès", () => {
  it("refuse une requête sans session (401)", async () => {
    const response = await request(app).post("/applications").send({ offerId: OFFER.DATA_QUALITY });

    expect(response.status).toBe(401);
  });

  it.each([
    ["administrateur", "ADMIN" as const, ADMINISTRATOR.ANNE_LECLERCQ],
    ["contact déposant", "CONTACT" as const, CONTACT.MARC_LEJEUNE],
  ])("refuse une candidature par %s (403)", async (_profile, kind, id) => {
    const response = await applyAs(kind, id, { offerId: OFFER.DATA_QUALITY });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });
});

describe("POST /applications : création", () => {
  it("crée une candidature avec un message normalisé", async () => {
    const response = await applyAs("STUDENT", STUDENT.LOUIS_CLAES, {
      offerId: OFFER.DATA_QUALITY,
      message: "  Le sujet m'intéresse.  ",
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      offerId: OFFER.DATA_QUALITY,
      message: "Le sujet m'intéresse.",
      status: "IN_PROGRESS",
    });
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("appliedAt");
    expect(response.body).not.toHaveProperty("studentId");
    const stored = db
      .prepare("SELECT student_id FROM applications WHERE id = ?")
      .get(response.body.id) as { student_id: number };
    expect(stored.student_id).toBe(STUDENT.LOUIS_CLAES);
  });

  it.each([undefined, "", "   "])("accepte un message vide (%s) et le stocke à NULL", async (message) => {
    const body = { offerId: OFFER.DATA_QUALITY, ...(message === undefined ? {} : { message }) };
    const response = await applyAs("STUDENT", STUDENT.DMYTRO_KOVALENKO, body);

    expect(response.status).toBe(201);
    expect(response.body.message).toBeNull();
    const stored = db
      .prepare("SELECT message FROM applications WHERE id = ?")
      .get(response.body.id) as { message: string | null };
    expect(stored.message).toBeNull();
  });

  it("accepte un message normalisé de 1000 caractères", async () => {
    const response = await applyAs("STUDENT", STUDENT.LOUIS_CLAES, {
      offerId: OFFER.DATA_QUALITY,
      message: ` ${"x".repeat(1000)} `,
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toHaveLength(1000);
  });

  it("rejette un message normalisé de plus de 1000 caractères", async () => {
    const response = await applyAs("STUDENT", STUDENT.LOUIS_CLAES, {
      offerId: OFFER.DATA_QUALITY,
      message: "x".repeat(1001),
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_BODY");
  });

  it("dérive l'étudiant de la session et ignore tout studentId fourni", async () => {
    const response = await applyAs("STUDENT", STUDENT.LOUIS_CLAES, {
      offerId: OFFER.DATA_QUALITY,
      studentId: STUDENT.DMYTRO_KOVALENKO,
    });

    expect(response.status).toBe(201);
    const stored = db
      .prepare("SELECT student_id FROM applications WHERE id = ?")
      .get(response.body.id) as { student_id: number };
    expect(stored.student_id).toBe(STUDENT.LOUIS_CLAES);
  });
});

describe("POST /applications : refus", () => {
  it("rejette un corps invalide", async () => {
    const response = await applyAs("STUDENT", STUDENT.LOUIS_CLAES, {
      offerId: 0,
      message: 12,
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_BODY");
  });

  it("renvoie 404 pour une offre inexistante", async () => {
    const response = await applyAs("STUDENT", STUDENT.LOUIS_CLAES, { offerId: 999 });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("refuse une offre existante qui n'est pas publiée (409)", async () => {
    const response = await applyAs("STUDENT", STUDENT.LOUIS_CLAES, {
      offerId: OFFER.CLIENT_PORTAL,
    });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("OFFER_NOT_PUBLISHED");
  });

  it.each(["IN_PROGRESS", "SELECTED", "REJECTED"] as const)(
    "refuse une candidature déjà existante au statut %s",
    async (status) => {
      if (status !== "IN_PROGRESS") {
        db.prepare(
          "INSERT INTO applications (offer_id, student_id, status) VALUES (?, ?, ?)",
        ).run(OFFER.DATA_QUALITY, STUDENT.DMYTRO_KOVALENKO, status);
      }
      const offerId = status === "IN_PROGRESS" ? OFFER.FLEET_APP : OFFER.DATA_QUALITY;
      const studentId = status === "IN_PROGRESS" ? STUDENT.LUCAS_DUPONT : STUDENT.DMYTRO_KOVALENKO;

      const response = await applyAs("STUDENT", studentId, { offerId });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("APPLICATION_EXISTS");
    },
  );

  it("permet de candidater à nouveau après une candidature retirée", async () => {
    const response = await applyAs("STUDENT", STUDENT.INES_HADDAD, { offerId: OFFER.BILLING_API });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("IN_PROGRESS");
  });
});