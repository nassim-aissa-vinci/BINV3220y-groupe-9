import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { ADMINISTRATOR, CONTACT, OFFER, STUDENT } from "../src/db/seed/seedIds.ts";
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