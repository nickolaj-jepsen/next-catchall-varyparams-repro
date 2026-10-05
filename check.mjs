// Starts the production build, then in fresh browser contexts: load /a, let the <Link href="/" prefetch>
// prefetch, click the link to /b, and check which page renders.
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const PORT = process.env.PORT ?? "3123";
const BASE = `http://localhost:${PORT}`;
const RUNS = Number(process.env.RUNS ?? 10);

const server = spawn("npx", ["next", "start", "-p", PORT], { stdio: "ignore", detached: true });
const stop = () => process.kill(-server.pid);

try {
  for (let i = 0; ; i++) {
    if (await fetch(BASE + "/a").then((r) => r.ok, () => false)) break;
    if (i > 100) throw new Error("next start did not come up");
    await new Promise((r) => setTimeout(r, 200));
  }

  const browser = await chromium.launch();
  let stuck = 0;
  for (let run = 1; run <= RUNS; run++) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(BASE + "/a");
    await page.waitForLoadState("networkidle"); // the index link's full prefetch has landed
    await page.click("#link-b");
    await page.waitForURL(BASE + "/b");
    await page.waitForTimeout(1500);
    // Inactive routes stay mounted but hidden (cacheComponents), so read the visible heading.
    const title = await page.evaluate(
      () => [...document.querySelectorAll("main h1")].find((h) => h.getClientRects().length)?.textContent,
    );
    const ok = title === "Page /b";
    if (!ok) stuck++;
    console.log(`run ${run}: URL /b shows "${title}" ${ok ? "OK" : "BUG"}`);
    await context.close();
  }
  await browser.close();
  console.log(stuck ? `\nBUG: ${stuck}/${RUNS} navigations to /b rendered the wrong page.` : `\nOK: all ${RUNS} runs rendered /b.`);
  process.exitCode = stuck ? 1 : 0;
} finally {
  stop();
}
