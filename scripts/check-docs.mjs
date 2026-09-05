/**
 * Documentation consistency checks.
 *
 *   node scripts/check-docs.mjs
 *
 * WHY THIS EXISTS. `general.md` is the single source of truth for a money
 * system, and it went wrong in the only way a long status document ever goes
 * wrong: not by lying, but by being edited in one place and not another. A pass
 * repaired cash-out and updated §15, and §23 went on listing the same defect as
 * outstanding. A migration was added and §19 kept the old count. The header said
 * the branch was unmerged while §0 said it was merged. Every one of those was
 * true when written.
 *
 * A human proof-reading 2,000 lines catches some of that. A machine catches the
 * same class every time, which is the difference between a convention and a
 * control.
 *
 * WHAT IT DOES NOT DO. It cannot tell whether a claim is TRUE — only whether the
 * document contradicts itself or the repository. "989 tests pass" is outside its
 * reach; "29 migrations here and 27 there" is not. Evidence is still the
 * author's job.
 *
 * Exit 0 clean, 1 with findings. Every finding names the file, the line and what
 * to compare it against, because a checker that only says "inconsistent" makes
 * somebody re-derive the search that found it.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** The authoritative status vocabulary, from general.md §2. */
const STATUS_LABELS = new Set([
  "VERIFIED_IN_REAL_BROWSER",
  "VERIFIED_END_TO_END",
  "VERIFIED_AGAINST_REAL_PROVIDER_DATA",
  "VERIFIED_BY_INTEGRATION_TEST",
  "VERIFIED_BY_UNIT_TEST_ONLY",
  "IMPLEMENTED_NOT_LIVE_TESTED",
  "BLOCKED_BY_KEY",
  "BLOCKED_BY_CONTRACT",
  "BLOCKED_BY_OWNER_CONFIGURATION",
  "BLOCKED_BY_PRODUCT_DECISION",
  "BLOCKED_BY_REGULATION",
  "NOT_IMPLEMENTED",
  "FAILED",
  // Outcome words, not statuses of a feature. Allowed because they describe the
  // whole pass rather than a row.
  "DEVELOPER_OWNED_SPORTSBOOK_MVP_COMPLETE",
  "INTERNAL_SECURITY_VERIFICATION",
  // Named in prose as things this pass must NOT claim. Listing them here keeps
  // the checker from flagging the sentence that forbids them.
  "REAL_MONEY_READY",
  "PRODUCTION_READY",
  "LICENSED",
  "PAYMENTS_VERIFIED",
  "ALL_PRODUCTS_COMPLETE",
  "DEMO_READY",
]);

/**
 * Files this repository has deleted on purpose.
 *
 * A document may still DISCUSS them — the trail from a defect to its fix is
 * worth reading — but it must not describe them as present. The rule is that a
 * mention must sit near a word that marks it as gone.
 */
const DELETED_FILES = [
  { path: "src/styles/legacy-bridge.css", goneWords: /delet|remov|gone|retire|no longer|used to|gitignor/i },
  { path: "src/app/(site)/sports/bet-slip.tsx", goneWords: /delet|remov|gone|retire|no longer|replac|used to/i },
  { path: "src/components/layout/site-shell.tsx", goneWords: /delet|remov|gone|retire|no longer|replac|used to/i },
];

const findings = [];

function report(file, line, rule, message) {
  findings.push({ file, line, rule, message });
}

function readLines(rel) {
  const full = path.join(ROOT, rel);
  if (!existsSync(full)) return null;
  return readFileSync(full, "utf8").split(/\r?\n/);
}

/** Markdown files this checker governs. */
function docFiles() {
  const top = readdirSync(ROOT).filter((f) => f.endsWith(".md"));
  const docs = existsSync(path.join(ROOT, "docs"))
    ? readdirSync(path.join(ROOT, "docs"))
        .filter((f) => f.endsWith(".md"))
        .map((f) => `docs/${f}`)
    : [];
  // `docs/history/` is deliberately excluded: it is a record of what was true on
  // a past date, and holding it to today's state would force somebody to edit
  // evidence.
  return [...top, ...docs];
}

/**
 * Dated logs, which record what was true when they were written.
 *
 * They are exempt from the CURRENT-STATE rules — a pass that correctly reported
 * 24 migrations in August is not wrong today, and "correcting" it would falsify
 * the record. They are NOT exempt from the rules about what a document may
 * claim about itself: a log may not declare itself the source of truth, and it
 * may not leave a placeholder.
 */
const HISTORICAL_DOCS = new Set(["NEXT_WORK_REPORT.md"]);

/** Documents that describe the state of the project right now. */
function currentStateDocs() {
  return docFiles().filter((f) => !HISTORICAL_DOCS.has(f));
}

// ---------------------------------------------------------------- 1. migrations

/**
 * Every stated migration total must match the journal.
 *
 * The real count is read from `drizzle/meta/_journal.json`, not from another
 * document, because two documents agreeing with each other and both being wrong
 * is the failure this is here to catch.
 */
function checkMigrationTotals() {
  const journalPath = path.join(ROOT, "drizzle", "meta", "_journal.json");
  if (!existsSync(journalPath)) return;
  const actual = JSON.parse(readFileSync(journalPath, "utf8")).entries.length;

  const patterns = [
    /(\d+)\s+migrations?\b/gi,
    /\b(\d+)\s+of\s+\1\b/gi, // "29 of 29"
    /Migrations\s*\|\s*(\d+)/gi,
  ];

  for (const rel of currentStateDocs()) {
    const lines = readLines(rel);
    if (!lines) continue;
    lines.forEach((text, i) => {
      /*
       * Only judge a line that is ABOUT migrations. "18 of 18 admin queries"
       * matches the N-of-N shape and has nothing to do with the schema; an
       * earlier version of this check reported three such lines and would have
       * taught everyone to skim past the output.
       */
      if (!/migration/i.test(text)) return;
      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        let m;
        while ((m = pattern.exec(text)) !== null) {
          const stated = Number(m[1]);
          /*
           * The N-of-N shape must sit NEXT TO the word it is a count of. One
           * line reads "migrations 29 of 29 … admin smoke 18 of 18", and
           * without this the 18 was reported as a wrong migration total.
           */
          const near = text.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40);
          if (!/migration/i.test(near)) continue;
          // Only judge numbers in the plausible range for this project's
          // migration count. "3 migrations ago" style prose is not a total.
          if (stated >= 10 && stated <= 200 && stated !== actual) {
            report(
              rel,
              i + 1,
              "migration-total",
              `states ${stated} migrations; drizzle/meta/_journal.json has ${actual}`,
            );
          }
        }
      }
    });
  }
}

// ------------------------------------------------------- 2. readiness blockers

/**
 * All statements of a readiness blocker count must agree with each other.
 *
 * The true number comes from running the script, which this checker does not do
 * — so it enforces INTERNAL consistency. Two sections disagreeing is always a
 * defect regardless of which one is right.
 */
function checkReadinessBlockerTotals() {
  const seen = { demo: [], real: [] };

  for (const rel of currentStateDocs()) {
    const lines = readLines(rel);
    if (!lines) continue;
    lines.forEach((text, i) => {
      const blocker = /(\d+)\s+blocker/i.exec(text);
      if (!blocker) return;
      const count = Number(blocker[1]);
      const isReal = /real[-\s]?money|REAL_MONEY_READY/i.test(text);
      const isDemo = /demo|DEMO_READY/i.test(text);
      if (isReal) seen.real.push({ rel, line: i + 1, count });
      else if (isDemo) seen.demo.push({ rel, line: i + 1, count });
    });
  }

  for (const [name, entries] of Object.entries(seen)) {
    const counts = [...new Set(entries.map((e) => e.count))];
    if (counts.length > 1) {
      for (const e of entries) {
        report(
          e.rel,
          e.line,
          "readiness-blockers",
          `${name} blocker count ${e.count} disagrees with other statements (${counts.join(", ")})`,
        );
      }
    }
  }
}

// ------------------------------------------- 3. done AND in the active backlog

/**
 * Nothing may be marked finished and also sit in the active developer backlog.
 *
 * The backlog table is the one titled "Blocked by nothing". Its whole meaning is
 * "a developer could start this today", so an entry that is already done makes
 * the section describe work that does not exist.
 */
function checkBacklogVersusDone() {
  const rel = "general.md";
  const lines = readLines(rel);
  if (!lines) return;

  // The backlog section runs from its heading to the next heading.
  let start = -1;
  let end = lines.length;
  lines.forEach((text, i) => {
    if (start === -1 && /Blocked by nothing/i.test(text)) start = i;
    else if (start !== -1 && i > start && /^#{2,4}\s/.test(text) && end === lines.length) end = i;
  });
  if (start === -1) return;

  /*
   * A section that declares itself empty may still LIST what used to be in it,
   * next to where each item's evidence now lives. That table is a record of
   * completion, not a backlog, so scanning stops where it begins — otherwise
   * this rule reports every row of the very table that resolves it.
   */
  for (let i = start; i < end; i += 1) {
    if (/Was listed here|Where its evidence/i.test(lines[i])) {
      end = i;
      break;
    }
  }

  /*
   * Each entry is a subject and the evidence that it is finished. Matching on a
   * phrase rather than a fuzzy similarity keeps this readable and keeps a false
   * positive from teaching people to ignore the checker.
   */
  const finishedSubjects = [
    { in: /cash-?out exposure defect/i, why: "§15 records cash-out repaired, reachable and tested" },
    { in: /account-status gate on cash-?out/i, why: "§15 records assertMayCashOut gating on status" },
    { in: /bank list for withdrawals/i, why: "§0 stage 5f records the route, picker and 12 tests" },
    { in: /date-of-birth backfill/i, why: "§0 stage 5d records the flow, banner and gates" },
    { in: /redis caching of .?liveVersion/i, why: "§0 stage 5e records the cache and its tests" },
    { in: /load tests? for the homepage/i, why: "§0 stage 6 records the measured load run" },
    { in: /prompt-?injection corpus/i, why: "§0 stage 5i records 53 attacks and 59 tests" },
    { in: /retire the legacy bridge/i, why: "the file is deleted from the repository" },
  ];

  for (let i = start; i < end; i += 1) {
    for (const subject of finishedSubjects) {
      if (subject.in.test(lines[i])) {
        report(
          rel,
          i + 1,
          "done-in-backlog",
          `listed in the active developer backlog but finished — ${subject.why}`,
        );
      }
    }
  }
}

// ------------------------------------------ 4. deleted files described as live

function checkDeletedFilesNotDescribedAsPresent() {
  for (const rel of currentStateDocs()) {
    const lines = readLines(rel);
    if (!lines) continue;
    lines.forEach((text, i) => {
      for (const deleted of DELETED_FILES) {
        if (!text.includes(deleted.path) && !text.includes(path.basename(deleted.path))) continue;
        if (existsSync(path.join(ROOT, deleted.path))) continue; // not deleted after all
        /*
         * Search the whole SECTION, not a fixed window.
         *
         * A deletion is announced in a banner under the heading, and the
         * paragraph explaining what the file used to do can sit well below it.
         * Two fixed windows were tried — one line, then five — and each was one
         * paragraph too short for the next document. A section is the unit a
         * human reads, so it is the unit this reads too.
         */
        let from = 0;
        for (let k = i; k >= 0; k -= 1) {
          if (/^#{1,6}\s/.test(lines[k])) {
            from = k;
            break;
          }
        }
        let to = lines.length;
        for (let k = i + 1; k < lines.length; k += 1) {
          if (/^#{1,6}\s/.test(lines[k])) {
            to = k;
            break;
          }
        }
        const context = lines.slice(from, to).join(" ");
        if (!deleted.goneWords.test(context)) {
          report(
            rel,
            i + 1,
            "deleted-file-live",
            `${deleted.path} no longer exists, and nothing nearby says so`,
          );
        }
      }
    });
  }
}

// ------------------------------------------------ 5. one source of truth only

function checkSingleSourceOfTruth() {
  const claim = /single source of truth/i;
  for (const rel of docFiles()) {
    const lines = readLines(rel);
    if (!lines) continue;
    lines.forEach((text, i) => {
      if (!claim.test(text)) return;
      if (rel === "general.md") return; // the one document allowed to claim it
      // Other documents may POINT at general.md; they may not claim it.
      if (/general\.md/i.test(text)) return;
      report(
        rel,
        i + 1,
        "source-of-truth",
        "claims to be the single source of truth; only general.md may, and others must point at it",
      );
    });
  }
}

// ------------------------------------------------------ 6. status label check

function checkStatusLabels() {
  // Screaming-snake tokens of 2+ words, which is the shape every status uses.
  const token = /\b([A-Z][A-Z0-9]*(?:_[A-Z0-9]+){1,6})\b/g;
  /*
   * Ordinary uppercase identifiers that are not statuses. Without this the
   * checker would flag every environment variable and SQL keyword in the
   * document, and a checker with fifty false positives is one nobody runs.
   */
  const notAStatus =
    /^(DATABASE_URL|DIRECT_DATABASE_URL|MIGRATION_DATABASE_URL|POSTGRES_URL|POSTGRES_URL_NON_POOLING|DATABASE_URL_UNPOOLED|REDIS_URL|KV_URL|KV_REST_API_URL|KV_REST_API_TOKEN|AUTH_SECRET|NEXTAUTH_URL|NEXTAUTH_SECRET|AUTH_URL|IDENTITY_PEPPER|ODDS_API_KEY|ODDS_LIVE_CONTRACT|PAYSTACK_SECRET_KEY|PAYSTACK_PUBLIC_KEY|TERMII_API_KEY|TERMII_SENDER_ID|RESEND_API_KEY|RESEND_FROM|SENTRY_DSN|SENTRY_AUTH_TOKEN|NEXT_PUBLIC_SENTRY_DSN|B2_[A-Z_]+|INNGEST_[A-Z_]+|UPSTASH_[A-Z_]+|SEED_ADMIN_[A-Z_]+|APP_DATABASE_ROLE|WALLET_LOCK_TIMEOUT|DATABASE_POOL_MAX|DIRECT_DATABASE_POOL_MAX|ALLOW_QA_CREDIT|NODE_ENV|NEXT_RUNTIME|VERCEL_ENV|RAILWAY_[A-Z_]+|CI|GITHUB_TOKEN|GH_TOKEN|GIT_TOKEN|PLUTOBET_ENVIRONMENT|PLAYWRIGHT_BASE_URL|ASSUMED_FINISHED_AFTER_MS|SET_NULL|NOT_NULL|SET_LOCAL|SKIP_LOCKED|FOR_UPDATE|SUPER_ADMIN|SUPPORT_AGENT|SELF_EXCLUDED|CASHED_OUT|USER_ID|LC_[A-Z]+|STATUS_DLL_NOT_FOUND|HTTP_LOAD|INTERACTION_AUDIT|PROJECT_STATUS|PLUTOBET_STATUS|PLUTOBET_CORE_FLOW_VALIDATION|DEVELOPER_COMPLETION_REPORT|NEXT_WORK_REPORT|OWNER_LAUNCH_CHECKLIST|UI_REDESIGN_REPORT|README|AGENTS|CLAUDE|MVP_COMPLETE)$/;

  for (const rel of currentStateDocs()) {
    const lines = readLines(rel);
    if (!lines) continue;

    /*
     * The section of general.md that RETIRES labels has to name them, and it
     * says so itself. Its range is found rather than hard-coded to a line
     * number, because a line number in a checker goes stale the first time
     * somebody adds a paragraph above it.
     */
    let exemptFrom = -1;
    let exemptTo = -1;
    lines.forEach((text, i) => {
      if (exemptFrom === -1 && /why it is a downgrade/i.test(text)) exemptFrom = i;
      else if (exemptFrom !== -1 && exemptTo === -1 && i > exemptFrom && /^#{2,4}\s/.test(text)) exemptTo = i;
    });
    if (exemptFrom !== -1 && exemptTo === -1) exemptTo = lines.length;

    lines.forEach((text, i) => {
      if (exemptFrom !== -1 && i >= exemptFrom && i < exemptTo) return;
      token.lastIndex = 0;
      let m;
      while ((m = token.exec(text)) !== null) {
        const word = m[1];
        if (STATUS_LABELS.has(word)) continue;
        if (notAStatus.test(word)) continue;
        // Only judge tokens that LOOK like a status verb, so unrelated
        // constants do not drag the checker into guesswork.
        if (!/^(VERIFIED|BLOCKED|IMPLEMENTED|NOT|FAILED|DEVELOPER|REAL|PRODUCTION|ALL)_/.test(word)) continue;
        report(rel, i + 1, "status-label", `"${word}" is not in the general.md §2 vocabulary`);
      }
    });
  }
}

// ------------------------------------------------------- 7. placeholders left

function checkPlaceholders() {
  const placeholder = /\bTBD\b|\bTODO\b|\bFIXME\b|\bXXX\b|\bLorem ipsum\b|\{\{[^}]+\}\}|<PLACEHOLDER|\bFILL[ _-]?ME\b/i;
  for (const rel of docFiles()) {
    const lines = readLines(rel);
    if (!lines) continue;
    lines.forEach((text, i) => {
      /*
       * The audit sections legitimately quote the marker words they search for,
       * and `test.todo` is a Vitest API rather than an unfinished sentence.
       */
      if (/`TODO`|`FIXME`|`HACK`|`XXX`|grep|search(ed)? (the repository|for)|marker/i.test(text)) return;
      if (/\.todo\b|test\.todo|describe\.todo|`\.only`/i.test(text)) return;
      // "0 todo" and "Todo tests | 0" are TEST COUNTS, not unfinished writing.
      if (/\d+\s*todo\b|todo tests?\s*\|/i.test(text)) return;
      if (placeholder.test(text)) {
        report(rel, i + 1, "placeholder", "unresolved placeholder or marker left in a document");
      }
    });
  }
}

// ------------------------------------------------------------------- run them

checkMigrationTotals();
checkReadinessBlockerTotals();
checkBacklogVersusDone();
checkDeletedFilesNotDescribedAsPresent();
checkSingleSourceOfTruth();
checkStatusLabels();
checkPlaceholders();

const byRule = new Map();
for (const f of findings) byRule.set(f.rule, (byRule.get(f.rule) ?? 0) + 1);

if (findings.length === 0) {
  console.info(`check-docs: clean — ${docFiles().length} document(s), 7 rules`);
  process.exit(0);
}

console.error(`check-docs: ${findings.length} finding(s) across ${byRule.size} rule(s)\n`);
for (const f of findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)) {
  console.error(`  ${f.file}:${f.line}  [${f.rule}]  ${f.message}`);
}
console.error("\nFix the document, or the check. Do not silence it.");
process.exit(1);
