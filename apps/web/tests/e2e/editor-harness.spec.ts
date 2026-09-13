import { test, expect } from "@playwright/test";

/**
 * Slash/command-menu + toggle-block interaction suite driven through
 * the API-free /dev-editor-harness route (no backend or auth needed).
 *
 * Covers:
 * - Slash menu renders WITHOUT a filter input (input lives only in the
 *   "+" palette); typing after "/" is the query.
 * - MOUSE clicks execute the exact item clicked (regression: grouped
 *   display order used to desync from registry lookup order).
 * - Toggle list + toggle headings 1–4 exist, insert, collapse/expand,
 *   and Enter-in-title drops the caret into the body.
 */

async function openHarness(page: import("@playwright/test").Page) {
  await page.goto("/dev-editor-harness");
  const doc = page.locator(".hym-document");
  await expect(doc).toBeVisible({ timeout: 15_000 });
  return doc;
}

test.describe("Slash command menu", () => {
  test("opens without a filter input; typing after / filters", async ({
    page,
  }) => {
    const doc = await openHarness(page);
    await doc.click();
    await page.keyboard.type("/");

    const menu = page.locator(".hym-command-menu");
    await expect(menu).toBeVisible();
    await expect(menu.locator("input")).toHaveCount(0);
    await expect(menu.getByText("Basic blocks")).toBeVisible();

    // Typing continues into the DOCUMENT, not an input box.
    await page.keyboard.type("tog");
    await expect(menu.getByRole("option")).toHaveCount(5);
    await expect(menu.getByText("Toggle blocks")).toBeVisible();
    await expect(menu.getByText("Bullet list")).toHaveCount(0);

    // Clearing the query restores everything (12 base + 5 toggle blocks).
    for (let i = 0; i < 3; i += 1) await page.keyboard.press("Backspace");
    await expect(menu.getByRole("option")).toHaveCount(17);
  });

  test("mouse-clicking Quote inserts a blockquote (index-mapping regression)", async ({
    page,
  }) => {
    const doc = await openHarness(page);
    await doc.click();
    await page.keyboard.type("/");

    const menu = page.locator(".hym-command-menu");
    await expect(menu).toBeVisible();
    await menu
      .getByRole("option", { name: /Capture a quote or citation/ })
      .click();

    await expect(doc.locator("blockquote")).toHaveCount(1);
    await expect(doc.locator("p", { hasText: "/" })).toHaveCount(0);
    await expect(menu).not.toBeVisible();

    // Caret usable right away inside the quote.
    await page.keyboard.type("spoken words");
    await expect(doc.locator("blockquote p")).toHaveText("spoken words");
  });

  test("mouse-clicking To-do list inserts a task list", async ({ page }) => {
    const doc = await openHarness(page);
    await doc.click();
    await page.keyboard.type("/todo");
    const menu = page.locator(".hym-command-menu");
    await expect(menu.getByRole("option", { name: /Track tasks/ })).toBeVisible();
    await menu.getByRole("option", { name: /Track tasks/ }).click();

    await expect(doc.locator("ul[data-type='taskList']")).toHaveCount(1);
    await page.keyboard.type("ship it");
    await expect(
      doc.locator("ul[data-type='taskList'] li p").first(),
    ).toHaveText("ship it");
  });

  test("plus palette keeps its filter input", async ({ page }) => {
    const doc = await openHarness(page);
    await doc.click();
    await page.keyboard.type("anchor block");

    const plusBtn = page.locator(
      ".hym-block-controls button[aria-label='Insert block below']",
    );
    await doc.locator("p").first().hover();
    await plusBtn.click({ force: true });

    const menu = page.locator(".hym-command-menu");
    await expect(menu).toBeVisible();
    await expect(menu.locator("input")).toHaveCount(1);
  });
});

test.describe("Toggle blocks", () => {
  test("toggle headings 1–4 + toggle list are offered and insertable", async ({
    page,
  }) => {
    const doc = await openHarness(page);
    await doc.click();
    // NOTE: space-free query — a space exits the slash suggestion.
    await page.keyboard.type("/togg");

    const menu = page.locator(".hym-command-menu");
    for (const level of [1, 2, 3, 4]) {
      await expect(
        menu.getByText(`Toggle heading ${level}`, { exact: true }),
      ).toBeVisible();
    }
    await expect(
      menu.getByText("Toggle list", { exact: true }),
    ).toBeVisible();

    await menu
      .getByRole("option", { name: /Collapsible medium heading/ })
      .click();

    const toggle = doc.locator('div[data-type="toggle-block"][data-level="2"]');
    await expect(toggle).toHaveCount(1);
    await page.keyboard.type("Section of mine");
    await expect(doc.locator(".hym-toggle-title")).toHaveText(
      "Section of mine",
    );
  });

  test("inserted toggle opens, chevron collapses and expands, Enter drops into body", async ({
    page,
  }) => {
    const doc = await openHarness(page);
    await doc.click();

    // Keyboard path: "/toggle" matches all five toggles; the first is
    // Toggle list, so plain Enter inserts it.
    await page.keyboard.type("/toggle");
    const menu = page.locator(".hym-command-menu");
    await expect(
      menu.getByRole("option", { name: /Collapsible section of content/ }),
    ).toBeVisible();
    await page.keyboard.press("Enter");

    const toggle = doc.locator('div[data-type="toggle-block"][data-level="0"]');
    await expect(toggle).toHaveCount(1);
    // Inserted OPEN so the body is immediately discoverable.
    await expect(toggle.locator("[data-type='toggle-content']")).toBeVisible();

    await page.keyboard.type("Chapter");
    await page.keyboard.press("Enter"); // jump from title into body
    await page.keyboard.type("hidden treasure");

    const body = toggle.locator("[data-type='toggle-content']");
    await expect(body.locator("p")).toHaveText("hidden treasure");

    // Chevron collapses (presentation-only; document JSON unchanged).
    const jsonBefore = await page.locator("#harness-doc").textContent();
    await toggle.locator(".hym-toggle-chevron").click();
    await expect(body).not.toBeVisible();
    await toggle.locator(".hym-toggle-chevron").click();
    await expect(body).toBeVisible();
    expect(await page.locator("#harness-doc").textContent()).toBe(jsonBefore);
  });

  test("turning a paragraph with text into a toggle keeps the text as title", async ({
    page,
  }) => {
    const doc = await openHarness(page);
    await doc.click();
    await page.keyboard.type("carry me");

    const firstPara = doc.locator("p").first();
    await firstPara.hover();
    const grip = page.locator(
      ".hym-block-controls button[aria-label*='Open block actions']",
    );
    await grip.click({ force: true });

    const actions = page.locator(".hym-action-menu");
    await expect(actions).toBeVisible();
    await actions
      .getByRole("menuitem", { name: /^Toggle heading 1$/ })
      .click();

    const toggle = doc.locator('div[data-type="toggle-block"][data-level="1"]');
    await expect(toggle).toHaveCount(1);
    await expect(doc.locator(".hym-toggle-title")).toHaveText("carry me");
    await expect(doc.locator("p", { hasText: "carry me" })).toHaveCount(0);
  });
});
