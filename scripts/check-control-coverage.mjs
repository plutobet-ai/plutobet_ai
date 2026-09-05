/**
 * Control-coverage gate.
 *
 *   node scripts/check-control-coverage.mjs
 *
 * Compares `e2e/control-manifest.mjs` against the audit rows the Playwright run
 * actually produced, and fails when a control that must be exercised in a
 * browser has no row.
 *
 * WHY THIS IS NOT A PLAYWRIGHT TEST. It would have to run last, and Playwright
 * orders files alphabetically — so the gate's correctness would rest on a
 * filename. Running it after the suite makes the ordering explicit and lets CI
 * fail on coverage separately from failing on a broken control, which are
 * different problems with different fixes.
 *
 * WHAT IT CANNOT DO. It cannot tell whether a recorded row is a good test. A row
 * saying a control was clicked and did nothing useful would satisfy it. It
 * closes one specific hole — the control nobody wrote a test for at all — and
 * `general.md` §6 remains the place where the quality of each claim is argued.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CONTROL_MANIFEST, controlsRequiringBrowserCoverage } from "../e2e/control-manifest.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUDIT_DIR = path.join(ROOT, "artifacts", "ui-review");

/** Per-project audit files written by `e2e/interactions.spec.ts`. */
function auditFiles() {
  if (!existsSync(AUDIT_DIR)) return [];
  return readdirSync(AUDIT_DIR)
    .filter((f) => /^interaction-audit-.+\.md$/.test(f))
    .map((f) => ({ project: f.replace(/^interaction-audit-|\.md$/g, ""), file: path.join(AUDIT_DIR, f) }));
}

/** The `control` cell of every recorded row, per project. */
function recordedControls(file) {
  const found = new Set();
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    // | page | viewport | control | action | observed | route | status |
    if (cells.length < 8) continue;
    if (cells[3]) found.add(cells[3]);
  }
  return found;
}

const projects = auditFiles();

if (projects.length === 0) {
  console.error(
    "control-coverage: no audit files under artifacts/ui-review/.\n" +
      "Run the browser suite first:  npx playwright test e2e/interactions.spec.ts\n" +
      "Refusing to report coverage from an absent run.",
  );
  process.exit(1);
}

const required = controlsRequiringBrowserCoverage();
const gaps = [];

for (const { project, file } of projects) {
  const recorded = recordedControls(file);
  for (const control of required) {
    /*
     * Match on a prefix rather than equality. A test may legitimately record
     * "Odds tile — 1, odds 2.30", which names the price it happened to click;
     * the manifest declares "Odds tile", because the price is data and the
     * control is what is being covered.
     */
    const hit = [...recorded].some((r) => r === control.control || r.startsWith(`${control.control} —`));
    if (!hit) gaps.push({ project, ...control });
  }
}

const summary = {
  manifest: CONTROL_MANIFEST.length,
  browser: required.length,
  blocked: CONTROL_MANIFEST.filter((c) => c.coverage === "blocked").length,
  boundary: CONTROL_MANIFEST.filter((c) => c.coverage === "integration-boundary").length,
  hidden: CONTROL_MANIFEST.filter((c) => c.coverage === "hidden").length,
  projects: projects.map((p) => p.project).join(", "),
};

console.info(
  `control-coverage: ${summary.manifest} declared — ${summary.browser} browser, ` +
    `${summary.blocked} blocked, ${summary.boundary} integration-boundary, ${summary.hidden} hidden\n` +
    `                  projects audited: ${summary.projects}`,
);

/*
 * Every non-browser row must say WHY. Without this the cheapest way to pass the
 * gate is to reclassify a control as "blocked" and move on, which is exactly the
 * dishonesty the manifest exists to prevent.
 */
const unexplained = CONTROL_MANIFEST.filter((c) => c.coverage !== "browser" && !c.why);
if (unexplained.length > 0) {
  console.error(`\ncontrol-coverage: ${unexplained.length} row(s) excluded from browser coverage with no reason:`);
  for (const c of unexplained) console.error(`  ${c.page} — ${c.control} (${c.coverage})`);
}

if (gaps.length === 0 && unexplained.length === 0) {
  console.info("control-coverage: every declared browser control has an audit row.");
  process.exit(0);
}

if (gaps.length > 0) {
  console.error(`\ncontrol-coverage: ${gaps.length} control(s) declared but never exercised in a browser:\n`);
  for (const g of gaps.sort((a, b) => a.project.localeCompare(b.project) || a.page.localeCompare(b.page))) {
    console.error(`  [${g.project}] ${g.page} — ${g.control}`);
  }
  console.error(
    "\nWrite the test, or change the manifest row to a non-browser coverage kind\n" +
      "WITH a reason. Deleting the row is the one edit that defeats the file.",
  );
}

process.exit(1);
