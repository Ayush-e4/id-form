import { expect, test } from "@playwright/test";
import ExcelJS from "exceljs";
import { readFile } from "fs/promises";
import JSZip from "jszip";

const adminPassword = "test-admin-password";
const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn7nF0AAAAASUVORK5CYII=",
  "base64"
);

const adminEntries = [
  {
    id: "entry-photo-123456",
    name: "Export Student",
    phone: "9999999999",
    photoUrl: "http://127.0.0.1:3200/test-photo.jpg",
    photoKey: "photos/export-student.jpg",
    submittedAt: "2026-04-07T08:00:00.000Z",
    type: "school",
    schoolSlug: "sanskaar-play-school",
    schoolName: "Sanskaar Play School",
    class: "KG",
    fathersName: "Parent One",
    admissionNo: "ADM-7",
  },
  {
    id: "entry-delete-654321",
    name: "Delete Me",
    phone: "8888888888",
    photoUrl: null,
    photoKey: null,
    submittedAt: "2026-04-07T09:00:00.000Z",
    type: "plant",
    plantSlug: "bml-plant",
    plantName: "BML Plant",
  },
];

async function loginAsAdmin(page: Parameters<typeof test>[0]["page"], next = "/admin") {
  await page.goto(`/admin-login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Password").fill(adminPassword);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL((url) => url.pathname === next);
}

test.describe("route smoke checks", () => {
  test("root redirects to the plant route", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/plants\/bml-plant$/);
    await expect(page.getByRole("heading", { name: "BML Plant ID Card" })).toBeVisible();
  });

  test("school route renders the simplified title and compact photo picker", async ({ page }) => {
    await page.goto("/schools/sanskaar-play-school");
    await expect(page.getByRole("heading", { name: "Sanskaar Play School" })).toBeVisible();
    await expect(page.getByText("Tap the profile icon to choose a photo")).toBeVisible();

    await page.getByRole("button", { name: /\+/ }).click();
    await expect(page.getByRole("button", { name: "Gallery" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Camera" })).toBeVisible();
  });

  test("unknown school route returns 404 page", async ({ page }) => {
    const response = await page.goto("/schools/not-a-school");
    expect(response?.status()).toBe(404);
    await expect(page.getByText("This page could not be found.")).toBeVisible();
  });

  test("admin routes load", async ({ page }) => {
    await loginAsAdmin(page, "/admin");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    await page.goto("/admin/submissions");
    await expect(page.getByRole("heading", { name: "Submissions" })).toBeVisible();

    await page.goto("/admin/schools");
    await expect(page.getByRole("heading", { name: "Schools" })).toBeVisible();
  });
});

test.describe("API guardrails", () => {
  test("presign rejects missing fields", async ({ request }) => {
    const response = await request.post("/api/presign", { data: {} });
    expect(response.status()).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Missing filename or type" });
  });

  test("submit rejects missing plant route metadata", async ({ request }) => {
    const response = await request.post("/api/submit", {
      data: {
        name: "Test User",
        phone: "1234567890",
        type: "plant",
      },
    });

    expect(response.status()).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "A valid plant route is required for plant submissions",
    });
  });

  test("submit rejects malformed school inputs", async ({ request }) => {
    const response = await request.post("/api/submit", {
      data: {
        name: "Student",
        phone: "1234567890",
        type: "school",
        schoolSlug: "uhs-chokad",
        schoolName: "UHS Chokad",
        bloodGroup: "X+",
      },
    });

    expect(response.status()).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Please select a valid blood group",
    });
  });

  test("admin submissions api rejects unauthenticated access", async ({ request }) => {
    const response = await request.get("/api/submissions");
    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  test("delete returns 404 for unknown submissions after admin login", async ({ page }) => {
    await loginAsAdmin(page);

    const result = await page.evaluate(async () => {
      const response = await fetch("/api/submissions/non-existent-id", { method: "DELETE" });
      return {
        status: response.status,
        body: await response.json(),
      };
    });

    expect(result.status).toBe(404);
    expect(result.body).toEqual({ error: "Submission not found" });
  });
});

test.describe("mocked integration flows", () => {
  test("plant form submits successfully through upload and submit steps", async ({ page }) => {
    let submitPayload: Record<string, unknown> | null = null;

    await page.route("**/api/presign", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          uploadUrl: "http://127.0.0.1:3200/__test-upload__",
          token: "test-token",
          key: "plants/bml-plant/test-photo.png",
        }),
      });
    });

    await page.route("**/__test-upload__", async (route) => {
      expect(route.request().method()).toBe("PUT");
      await route.fulfill({ status: 200, body: "" });
    });

    await page.route("**/api/submit", async (route) => {
      submitPayload = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, id: "new-entry" }),
      });
    });

    await page.goto("/plants/bml-plant");
    await page.locator('input[type="file"]').first().setInputFiles({
      name: "avatar.png",
      mimeType: "image/png",
      buffer: tinyPng,
    });
    await page.locator("label", { hasText: "FULL NAME" }).locator("..").locator("input").fill("Test Plant User");
    await page.locator("label", { hasText: "PHONE NUMBER" }).locator("..").locator("input").fill("9876543210");
    await page.getByRole("button", { name: /Submit/ }).click();

    await expect(page.getByRole("heading", { name: "All done!" })).toBeVisible();
    expect(submitPayload).toMatchObject({
      name: "Test Plant User",
      phone: "9876543210",
      type: "plant",
      plantSlug: "bml-plant",
      plantName: "BML Plant",
      photoKey: "plants/bml-plant/test-photo.png",
    });
  });

  test("admin delete success removes the entry from the table", async ({ page }) => {
    const entries = [...adminEntries];
    let deletedId: string | null = null;

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    await page.route("**/api/submissions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(entries),
      });
    });

    await page.route("**/api/submissions/*", async (route) => {
      deletedId = route.request().url().split("/").pop() || null;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await loginAsAdmin(page, "/admin/submissions");
    await expect(page.getByText("Delete Me")).toBeVisible();
    await page.locator('button[title="Delete Entry"]').last().click();

    await expect(page.locator("tbody")).not.toContainText("Delete Me");
    expect(deletedId).toBe("entry-delete-654321");
  });

  test("admin exports filtered Excel and ZIP files with expected contents", async ({ page }) => {
    await page.route("**/api/submissions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(adminEntries),
      });
    });

    await page.route("**/test-photo.jpg", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "image/jpeg",
        body: tinyPng,
      });
    });

    await loginAsAdmin(page, "/admin/submissions");
    await page.selectOption("select", "sanskaar-play-school");

    const [excelDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Download Excel" }).click(),
    ]);

    expect(excelDownload.suggestedFilename()).toBe("id_submissions_sanskaar-play-school.xlsx");
    const excelPath = await excelDownload.path();
    expect(excelPath).toBeTruthy();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelPath!);
    const worksheet = workbook.getWorksheet("Submissions");
    expect(worksheet).toBeTruthy();
    expect(worksheet?.getRow(2).getCell(1).value).toBe("school");
    expect(worksheet?.getRow(2).getCell(2).value).toBe("");
    expect(worksheet?.getRow(2).getCell(4).value).toBe("Sanskaar Play School");
    expect(worksheet?.getRow(2).getCell(6).value).toBe("Export Student");

    const [zipDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Download Photos" }).click(),
    ]);

    expect(zipDownload.suggestedFilename()).toBe(
      `id_photos_sanskaar-play-school_${new Date().toISOString().split("T")[0]}.zip`
    );
    const zipPath = await zipDownload.path();
    expect(zipPath).toBeTruthy();
    const zipBuffer = await JSZip.loadAsync(await readFile(zipPath!));
    expect(Object.keys(zipBuffer.files)).toEqual(["9999999999-123456.jpg"]);
  });
});
