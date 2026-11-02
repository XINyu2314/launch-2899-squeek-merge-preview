/** Production-export regression checks. Pass an externally installed Playwright module as argv[2].
 * Fixtures exercise failure/ownership/rule changes without claiming live-chain verification.
 * This bounded foreground process owns and closes both its HTTP server and browsers.
 */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const { chromium } = await import(process.argv[2] ? pathToFileURL(resolve(process.argv[2])).href : "playwright");
const root = resolve("dist");
const output = resolve("test/scratch/revision");
await mkdir(output, { recursive: true });
await mkdir("artifacts", { recursive: true });
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png" };
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, "http://localhost").pathname).replace(/^\/preview\/?/, "");
    const file = resolve(root, path || "index.html");
    if (!file.startsWith(root + "/")) throw new Error("outside export");
    res.setHeader("Content-Type", mime[extname(file)] || "application/octet-stream");
    res.end(await readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/preview/`;
const browser = await chromium.launch();
const results = [];
const errors = [];
const record = (name, evidence = {}) => {
  results.push({ name, passed: true, ...evidence });
  console.log(`PASS ${name}`);
};
let power = 2200;
let account = "pair";
let rpcOwner = "0x4b67b739dfd832f4eac67a7aa3bc244fb74cea4f";
const rpcCalls = [];
const word = n => BigInt(n).toString(16).padStart(64, "0");
async function fixture(context) {
  await context.route("https://**/*", async route => {
    const u = route.request().url();
    if (u.includes("/v1/economy/state")) return route.fulfill({ json: { chain: { chainId: 11155111 }, nft: { maximumLevel: 10, basePower: [1000, power, 4840], cooldownBlocks: [0, 3000, 7000] } } });
    if (u.includes("/v1/accounts/")) return account === "fail"
      ? route.fulfill({ status: 503, body: "unavailable" })
      : route.fulfill({ json: { status: "available", chain: { chainId: account === "wrong-chain" ? 1 : 11155111 }, tokens: (account === "empty" ? [] : account === "pair" ? ["8001", "8002"] : ["8001"]).map(tokenId => ({ tokenId, custody: "wallet", level: account === "merged" ? 2 : 1, mergeState: "ready", nextMergeHeight: "0" })) } });
    if (u.includes("/v1/squeeks/")) return route.fulfill({ json: {} });
    if (u.includes("publicnode.com") || u.includes("drpc.org")) {
      const { method, params } = route.request().postDataJSON();
      rpcCalls.push({ method, params });
      const result = method === "eth_chainId" ? "0xaa36a7" : params[0].data.startsWith("0x6352211e") ? "0x" + rpcOwner.slice(2).padStart(64, "0") : "0x" + [1000, 0, 0, 0, 1, 0, 0].map(word).join("");
      return route.fulfill({ json: { jsonrpc: "2.0", id: 1, result } });
    }
    return route.abort();
  });
  context.on("page", page => {
    page.on("pageerror", e => errors.push(e.message));
    page.on("response", r => { if (r.url().startsWith(url) && r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  });
}
const button = (page, name) => page.getByRole("button", { name, exact: true });
const card = (page, id) => page.locator(".card").filter({ hasText: `#${id}` });
const rows = page => page.locator(".cmp tbody tr");
async function pickPair(page, ids = ["1001", "1003"]) {
  for (const id of ids) await card(page, id).click();
  assert.equal(await rows(page).count(), 11);
}
async function loadAddress(page, address) {
  await page.locator("#addr").fill(address);
  await button(page, "Load holdings").click();
  if (account === "fail" || account === "wrong-chain") await page.locator(".state-error").waitFor();
  else if (account === "empty") await page.getByText("This address holds no Squeeks", { exact: false }).waitFor();
  else await card(page, "8001").waitFor();
}
async function downloaded(page, name) {
  const event = page.waitForEvent("download");
  await button(page, name).click();
  return event;
}

try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await fixture(context);
  const page = await context.newPage();
  await page.goto(url);
  assert.equal(await page.locator(".card").count(), 20);
  assert.equal(await page.locator(".card:disabled").count(), 6);
  assert.ok((await card(page, "1001").boundingBox()).y < 844);
  await page.screenshot({ path: `${output}/entry-390.png` });
  record("390 first screen contains product, connect control and selectable holdings");

  await button(page, "连接钱包").click();
  assert.equal(await page.locator(".sheet").evaluate(el => el.closest("[inert]")?.id ?? null), null);
  assert.equal(await page.locator("#app-shell").getAttribute("inert"), "");
  assert.equal(await page.evaluate(() => document.activeElement.className), "x");
  await page.keyboard.press("Shift+Tab");
  assert.ok(await page.locator(".sheet .row").last().evaluate(el => el === document.activeElement));
  await page.keyboard.press("Tab");
  assert.ok(await page.locator(".sheet .x").evaluate(el => el === document.activeElement));
  await button(page, "浏览器钱包").click();
  await page.locator(".sheet .note").waitFor();
  await button(page, "关闭").click();
  assert.equal(await page.locator(".sheet").count(), 0);
  assert.ok(await button(page, "连接钱包").evaluate(el => el === document.activeElement));
  await button(page, "连接钱包").click();
  await page.locator(".sheet-bg").click({ position: { x: 4, y: 4 } });
  assert.equal(await page.locator(".sheet").count(), 0);
  await button(page, "连接钱包").click();
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#app-shell").getAttribute("inert"), null);
  record("wallet chooser: row, close, backdrop, Escape, focus trap and focus return");

  await button(page, "钱包").click();
  await page.locator("#addr").fill("bad");
  await button(page, "读取持仓").click();
  assert.ok((await page.locator("#addr-err").textContent()).includes("请输入"));
  await button(page, "EN").click();
  assert.equal(await page.locator("#addr-err").textContent(), "Enter an address of 0x and 40 hexadecimal characters.");
  await button(page, "Load holdings").click();
  await button(page, "ZH").click();
  assert.ok((await page.locator("#addr-err").textContent()).includes("请输入"));
  assert.equal(await page.locator("#addr").getAttribute("aria-invalid"), "true");
  record("address validation errors translate immediately in both directions");
  await button(page, "我的收藏").click();
  for (const language of ["EN", "ZH"]) {
    await button(page, language).click();
    for (const width of [320, 360, 375, 390, 900, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
      const badgesFit = await page.locator(".badge").evaluateAll(list => list.every(el => {
        const b = el.getBoundingClientRect(), c = el.closest(".card").getBoundingClientRect();
        return b.left >= c.left && b.right <= c.right;
      }));
      assert.ok(badgesFit, `${language} badges inside cards at ${width}`);
    }
  }
  record("ZH and EN: no page overflow and all badges inside cards at 320/360/375/390/900/1440");

  await page.setViewportSize({ width: 1440, height: 900 });
  await button(page, "EN").click();
  await pickPair(page);
  assert.equal(await page.locator(".cmp .tag").count(), 11);
  assert.ok((await rows(page).nth(6).textContent()).match(/Yes, with another Lv 2/g).length === 2);
  assert.equal(await page.locator(".official-body").count(), 0);
  await page.locator(".check-gate input").check();
  await page.locator(".official-body").waitFor();
  await button(page, "Preview the signing prompt").click();
  assert.equal(await page.locator("dialog[open]").count(), 1);
  await button(page, "Close preview, broadcast nothing").click();
  assert.equal(await page.locator("dialog[open]").count(), 0);
  record("legal pair generates 11 tagged rows, Day 30 eligibility, regret gate and UI-only signing preview");

  await page.evaluate(() => {
    const original = CanvasRenderingContext2D.prototype.fillText;
    window.drawnText = [];
    CanvasRenderingContext2D.prototype.fillText = function(text, x, y, ...rest) {
      window.drawnText.push({ text, x, y, width: this.measureText(text).width });
      return original.call(this, text, x, y, ...rest);
    };
  });
  const png = await downloaded(page, "Download share image");
  await png.saveAs(`${output}/share-english.png`);
  const drawn = await page.evaluate(() => window.drawnText);
  assert.ok(drawn.every(line => line.x + line.width <= 1200 - 24), "all drawn text fits image");
  assert.ok(drawn.filter(line => line.x === 420 && line.y >= 200).every(line => line.y <= 500), "comparison above footer");
  assert.ok(drawn.map(line => line.text).join(" ").includes("(from next round)"));
  assert.ok(drawn.some(line => line.text.includes("@xinchne_eth")));
  record("English share PNG: measured wrapping preserves next-round qualification, footer and attribution", { drawn });

  for (const pace of ["slow", "steady", "fast"]) {
    await page.locator("#pace").selectOption(pace);
    await button(page, "Save baseline snapshot").click();
  }
  assert.equal(await page.locator(".snap-list li").count(), 3);
  assert.equal(await page.locator(".snap-grid .snap").count(), 3);
  const json = await downloaded(page, "Export JSON");
  const exported = JSON.parse(await readFile(await json.path(), "utf8"));
  assert.equal(exported.snapshots.length, 3);
  assert.ok(exported.snapshots.every(s => s.chainId === 11155111 && s.comparison.length === 11 && s.holdings.length === 20));
  power = 9000;
  await page.reload();
  await button(page, "Open this snapshot").first().click();
  assert.ok((await rows(page).nth(3).textContent()).includes("2,200"));
  assert.ok(!(await rows(page).nth(3).textContent()).includes("9,000"));
  assert.equal(await page.locator("#pace").isDisabled(), true);
  assert.equal(await button(page, "Save baseline snapshot").isDisabled(), true);
  assert.equal(await page.locator(".check-gate input").isDisabled(), true);
  await button(page, "Return to current rehearsal").click();
  await pickPair(page);
  assert.ok((await rows(page).nth(3).textContent()).includes("9,000"));
  record("three baselines restore/export; old comparison keeps 2,200 after rule change; new rehearsal uses 9,000");

  const address1 = "0x1111111111111111111111111111111111111111";
  const address2 = "0x2222222222222222222222222222222222222222";
  await button(page, "Wallet").click();
  await loadAddress(page, address1);
  await pickPair(page, ["8001", "8002"]);
  await button(page, "Save baseline snapshot").click();
  for (const state of ["fail", "merged"]) {
    account = state;
    await loadAddress(page, address1);
    await button(page, "Open this snapshot").click();
    assert.equal(await rows(page).count(), 11);
    assert.ok((await page.locator(".pair").textContent()).includes("#8002"));
    assert.ok((await page.locator(".snapshot-view").textContent()).includes(address1));
    assert.ok((await page.locator(".snapshot-view").textContent()).includes("#8002 Idle"));
    assert.equal(await page.locator(".snap-list li").count(), 1);
    assert.equal(await page.locator(".official-body").count(), 0);
  }
  record("saved wallet baseline opens independently after HTTP 503 and after donor burn");
  await page.evaluate(address => {
    const key = `smp:snapshots:${address}`;
    const saved = JSON.parse(localStorage.getItem(key));
    delete saved[0].comparison;
    localStorage.setItem(key, JSON.stringify(saved));
  }, address1);
  account = "fail";
  await page.reload();
  await button(page, "Wallet").click();
  await loadAddress(page, address1);
  await button(page, "Open this snapshot").click();
  assert.ok((await page.locator(".snapshot-view").textContent()).includes("older snapshot"));
  assert.ok((await rows(page).nth(3).textContent()).includes("Rules at capture were not saved; unknown"));
  assert.ok((await rows(page).nth(3).textContent()).includes("Unknown"));
  await button(page, "My collection").click();
  assert.equal(await page.locator(".snapshot-view").count(), 0);
  assert.equal(await page.locator(".snap-list li").count(), 3);
  record("legacy snapshot remains viewable with missing rules labelled Unknown; source isolation preserved");

  await button(page, "Wallet").click();
  for (const address of [address1, address2]) {
    await loadAddress(page, address);
    rpcCalls.length = 0;
    await page.locator("#rpc-ids").fill("8001");
    await button(page, "Check over RPC").click();
    await page.getByText("Omitted #8001:", { exact: false }).waitFor();
    assert.equal(await page.locator(".card").count(), 0);
    assert.equal(rpcCalls.length, 2, "no position call for unverified shared custody");
    assert.ok((await page.locator(".state-title").first().textContent()).includes("verified ownership"));
  }
  rpcOwner = address2;
  await button(page, "Check over RPC").click();
  await card(page, "8001").waitFor();
  assert.equal(await card(page, "8001").isDisabled(), false);
  await loadAddress(page, address1);
  await button(page, "Check over RPC").click();
  await page.getByText("None of these token IDs", { exact: false }).waitFor();
  assert.equal(await page.locator(".card").count(), 0);
  record("RPC: shared custody omitted for both accounts; direct ownership included only for verified owner");

  account = "wrong-chain";
  await loadAddress(page, address1);
  assert.ok((await page.locator(".state-error").textContent()).includes("chainId 1 ≠ 11155111"));
  assert.equal(await page.locator(".card").count(), 0);
  account = "empty";
  await loadAddress(page, address1);
  assert.equal(await page.locator(".card").count(), 0);
  record("wrong-chain API data rejected and successful empty response shown explicitly");
  await context.close();

  // Exercise the repaired chooser using an EIP-6963 provider with no signing capability.
  account = "pair";
  const walletContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await fixture(walletContext);
  await walletContext.addInitScript(({ address }) => {
    window.providerMethods = [];
    const listeners = {};
    let chain = "0x1";
    let authorized = false;
    const provider = {
      on: (event, listener) => { (listeners[event] ??= []).push(listener); },
      removeListener: (event, listener) => { listeners[event] = (listeners[event] ?? []).filter(f => f !== listener); },
      request: async ({ method }) => {
        window.providerMethods.push(method);
        if (method === "eth_requestAccounts") { authorized = true; return [address]; }
        if (method === "eth_accounts") return authorized ? [address] : [];
        if (method === "eth_chainId") return chain;
        if (method === "wallet_switchEthereumChain") {
          chain = "0xaa36a7";
          for (const listener of listeners.chainChanged ?? []) listener(chain);
          return null;
        }
        if (method === "wallet_requestPermissions" || method === "wallet_getPermissions") return [];
        throw new Error(`Unsupported read-only test-provider method: ${method}`);
      },
    };
    window.ethereum = provider;
    const announce = () => dispatchEvent(new CustomEvent("eip6963:announceProvider", { detail: { info: { name: "Review Wallet", uuid: "31472ff7-0bcf-4bda-9f08-fd71d31aed7d", rdns: "test.review.wallet", icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>" }, provider } }));
    addEventListener("eip6963:requestProvider", announce);
    announce();
  }, { address: address1 });
  const walletPage = await walletContext.newPage();
  await walletPage.goto(url);
  await button(walletPage, "连接钱包").click();
  await button(walletPage, "Review Wallet").click();
  await button(walletPage, "切换到 Sepolia").waitFor();
  await button(walletPage, "切换到 Sepolia").click();
  await card(walletPage, "8001").waitFor();
  const methods = await walletPage.evaluate(() => window.providerMethods);
  assert.ok(methods.includes("eth_requestAccounts"));
  assert.ok(methods.includes("wallet_switchEthereumChain"));
  assert.ok(methods.every(m => !/sendTransaction|sign|approve/i.test(m)));
  assert.equal(await walletPage.locator(".sheet").count(), 0);
  record("EIP-6963 chooser connects, closes, switches network and loads holdings without send/sign/approve", { methods });
  await walletContext.close();

  power = 2200;
  const shots = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  await fixture(shots);
  const shot = await shots.newPage();
  await shot.goto(url);
  await pickPair(shot);
  await shot.locator(".check-gate input").check();
  await shot.locator(".official-body").waitFor();
  await shot.evaluate(() => scrollTo(0, 0));
  await shot.screenshot({ path: "artifacts/screenshot-1440.png", fullPage: true });
  await shot.setViewportSize({ width: 390, height: 844 });
  await shot.evaluate(() => scrollTo(0, 0));
  await shot.screenshot({ path: "artifacts/screenshot-390.png", fullPage: true });
  await shot.locator("#compare").scrollIntoViewIfNeeded();
  await shot.screenshot({ path: `${output}/comparison-390.png` });
  assert.equal(await shot.evaluate(() => document.documentElement.scrollWidth), 390);
  record("actual completed-state screenshots: 1440 and 390, #1001 + #1003, 11 rows and official checklist");
  assert.ok(rpcCalls.every(call => ["eth_chainId", "eth_call"].includes(call.method)));
  assert.deepEqual(errors, []);
  record("no page exceptions, local resource failures or RPC write methods");
  await shots.close();
  await writeFile(`${output}/results.json`, JSON.stringify({ results, errors }, null, 2));
  console.log(`${results.length}/${results.length} regression groups passed`);
} finally {
  await browser.close();
  await new Promise(r => server.close(r));
}
