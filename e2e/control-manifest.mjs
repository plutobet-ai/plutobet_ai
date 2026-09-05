/**
 * The expected-control manifest.
 *
 * WHY A MANIFEST AT ALL. The interaction audit is generated from what the
 * browser did, which makes every row in it true — and says nothing about what
 * was never attempted. A generated report cannot tell you about the control
 * nobody wrote a test for. This file is the other half: a declared list of what
 * MUST be accounted for, so that "we tested everything we tested" becomes
 * "we tested everything we said existed".
 *
 * `scripts/check-control-coverage.mjs` compares this against the audit rows and
 * fails when a control marked `browser` has none.
 *
 * HOW TO ADD A CONTROL. Add the row here first. The check will fail, and that
 * failure is the point: it is the reminder to write the test. Deleting a row to
 * make the check pass is the one edit that defeats the whole file, so every
 * non-`browser` row must carry a `why`.
 *
 * COVERAGE KINDS
 *
 *   browser               must be clicked or submitted in a real browser
 *   blocked               the underlying feature needs a key, contract,
 *                         product decision or licence; the control is expected
 *                         to be absent, disabled, or to render an honest
 *                         unavailable state
 *   integration-boundary  cannot meaningfully exist in a browser, and is
 *                         covered by an integration test that is named
 *   hidden                deliberately not rendered, because the feature does
 *                         not exist
 */

/** @typedef {{page: string, control: string, coverage: "browser"|"blocked"|"integration-boundary"|"hidden", why?: string}} ExpectedControl */

/** @type {ExpectedControl[]} */
export const CONTROL_MANIFEST = [
  // ------------------------------------------------------------ global chrome
  { page: "any", control: "Brand mark", coverage: "browser" },
  { page: "any", control: "Primary navigation", coverage: "browser" },
  { page: "any", control: "Sports sub-navigation", coverage: "browser" },
  { page: "any", control: "More menu", coverage: "browser" },
  { page: "any", control: "More menu — Escape closes", coverage: "browser" },
  { page: "any", control: "More menu — outside click closes", coverage: "browser" },
  { page: "any", control: "Pluto AI navigation", coverage: "browser" },
  { page: "any", control: "Balance", coverage: "browser" },
  { page: "any", control: "Deposit", coverage: "browser" },
  { page: "any", control: "Account", coverage: "browser" },
  { page: "any", control: "Sign in link", coverage: "browser" },
  { page: "any", control: "Register link", coverage: "browser" },
  { page: "footer", control: "14 links", coverage: "browser" },
  { page: "/api/health", control: "health endpoint", coverage: "browser" },
  { page: "/not-a-real-page", control: "404 recovery links", coverage: "browser" },
  { page: "any", control: "Mobile navigation", coverage: "browser" },

  // -------------------------------------------------------------------- board
  { page: "/", control: "Header search", coverage: "browser" },
  { page: "/", control: "Competition search", coverage: "browser" },
  { page: "/", control: "Date filter chips", coverage: "browser" },
  { page: "/", control: "League filter", coverage: "browser" },
  { page: "/", control: "League collapse", coverage: "browser" },
  { page: "/", control: "Country collapse", coverage: "browser" },
  /*
   * ONE entry, not two. This listed both "Competition favourite (star)" and
   * "Competition favourite" — the same control under two names, because two
   * specs had recorded it differently. Only the desktop spec used the "(star)"
   * form, so the gate reported a mobile gap for a control mobile does not
   * render at all: the rail is hidden below 900px by design, and the audit says
   * so in its own row.
   */
  { page: "/", control: "Competition favourite", coverage: "browser" },
  { page: "/", control: "Fixture favourite", coverage: "browser" },
  { page: "/", control: "Favourite cross-tab sync", coverage: "browser" },
  { page: "/", control: "Odds tile", coverage: "browser" },
  { page: "/", control: "Unavailable odds state", coverage: "browser" },
  { page: "/", control: "More markets chevron", coverage: "browser" },
  { page: "/", control: "Statistics link", coverage: "browser" },
  { page: "/", control: "Betslip persistence", coverage: "browser" },

  // ------------------------------------------------------------- event detail
  { page: "/sports/event", control: "Market collapse", coverage: "browser" },
  { page: "/sports/event", control: "Selection adds to betslip", coverage: "browser" },
  { page: "/sports/event", control: "Back to competition", coverage: "browser" },

  // ----------------------------------------------------------------- betslip
  { page: "/", control: "Betslip empty state", coverage: "browser" },
  { page: "/", control: "Betslip remove selection", coverage: "browser" },
  { page: "/", control: "Betslip clear all", coverage: "browser" },
  { page: "/", control: "Betslip stake field", coverage: "browser" },
  { page: "/", control: "Betslip quick stake", coverage: "browser" },
  { page: "/", control: "Betslip invalid stake", coverage: "browser" },
  { page: "/", control: "Betslip potential return", coverage: "browser" },
  { page: "/", control: "Betslip accumulator", coverage: "browser" },
  { page: "/", control: "Betslip signed-out prompt", coverage: "browser" },
  { page: "/", control: "Place bet", coverage: "browser" },
  { page: "/", control: "Place bet — duplicate submit", coverage: "browser" },
  { page: "/", control: "Place bet — insufficient funds", coverage: "browser" },
  { page: "/", control: "Mobile betslip sheet", coverage: "browser" },
  {
    page: "/",
    control: "Betslip system bet and bankers",
    coverage: "integration-boundary",
    why: "system-bet combinatorics and banker selection are asserted in slip-math.acceptance.spec.ts, which covers every combination rather than the one a browser can click in a run",
  },
  {
    page: "/",
    control: "Stale price refusal",
    coverage: "integration-boundary",
    why: "requires repricing a selection between render and submit; http-placement.acceptance.spec.ts drives that race deterministically, which a browser cannot",
  },
  {
    page: "/",
    control: "Closed or suspended market refusal",
    coverage: "integration-boundary",
    why: "requires suspending a market mid-flight; covered by http-placement.acceptance.spec.ts",
  },

  // ---------------------------------------------------------- authentication
  { page: "/signin", control: "Sign in (wrong password)", coverage: "browser" },
  { page: "/signin", control: "Sign in (correct password)", coverage: "browser" },
  { page: "/signin", control: "Show/hide password", coverage: "browser" },
  { page: "/signin", control: "Forgot password link", coverage: "browser" },
  { page: "/signin", control: "Unsafe callback rejected", coverage: "browser" },
  { page: "/register", control: "Date of birth", coverage: "browser" },
  {
    page: "/register",
    control: "Registration (adult)",
    coverage: "integration-boundary",
    why: "step 1 cannot complete against the review server. `otp.service` refuses to issue a console-fallback code under a production build — that fallback returns the code in the API response and would let anyone verify a destination they do not control — so no browser can register there. The refusal itself IS browser-asserted as 'Registration OTP guard'. Registration through the real handler is covered by customer-journey.acceptance.spec.ts",
  },
  {
    page: "/register",
    control: "Registration (duplicate)",
    coverage: "integration-boundary",
    why: "behind the same step-1 blocker; the duplicate refusal is asserted in the acceptance journey and in registration.acceptance.spec.ts",
  },
  { page: "/forgot-password", control: "Password reset request", coverage: "browser" },
  { page: "any", control: "Sign out", coverage: "browser" },
  {
    page: "/register",
    control: "OTP delivery",
    coverage: "blocked",
    why: "BLOCKED_BY_KEY — Termii. The request is real and the local adapter returns a code; delivery is not exercised and is never claimed",
  },
  {
    page: "any",
    control: "Session revocation refresh",
    coverage: "integration-boundary",
    why: "a revoked session is downgraded on its next request; auth acceptance tests assert the downgrade directly, which is the property, rather than a browser reload that only shows its effect",
  },

  // --------------------------------------------- account and safer gambling
  { page: "/account", control: "Account tiles", coverage: "browser" },
  { page: "/account/security", control: "Change password", coverage: "browser" },
  { page: "/account/security", control: "Sign out other devices", coverage: "browser" },
  { page: "/account/preferences", control: "Odds format preference", coverage: "browser" },
  { page: "/account/preferences", control: "Notification preference", coverage: "browser" },
  { page: "/responsible", control: "Set a deposit limit", coverage: "browser" },
  { page: "/responsible", control: "Set a stake limit", coverage: "browser" },
  { page: "/responsible", control: "Set a loss limit", coverage: "browser" },
  { page: "/responsible", control: "Cool-off", coverage: "browser" },
  { page: "/referrals", control: "Referral copy", coverage: "browser" },
  { page: "/rewards", control: "Rewards navigation", coverage: "browser" },
  { page: "/account/date-of-birth", control: "Date-of-birth completion", coverage: "browser" },
  { page: "/account/date-of-birth", control: "Date-of-birth underage refusal", coverage: "browser" },
  {
    page: "/responsible",
    control: "Self-exclusion",
    coverage: "integration-boundary",
    why: "self-exclusion is irreversible for the account that takes it and would end every later test in the run; responsible.acceptance.spec.ts asserts it, including that it survives re-registration",
  },
  {
    page: "/responsible",
    control: "Delayed limit increase",
    coverage: "integration-boundary",
    why: "the increase applies after 24 hours; a browser cannot wait, and responsible.acceptance.spec.ts controls the clock",
  },
  {
    page: "/account",
    control: "Email verification request",
    coverage: "blocked",
    why: "BLOCKED_BY_KEY — Resend. The route is exercised; delivery is not, and is never claimed",
  },

  // ------------------------------------------------------------ wallet & KYC
  { page: "/wallet", control: "Wallet page", coverage: "browser" },
  { page: "/wallet", control: "Wallet buckets", coverage: "browser" },
  { page: "/withdraw", control: "Bank field", coverage: "browser" },
  { page: "/withdraw", control: "Withdrawal minimum refused", coverage: "browser" },
  { page: "/withdraw", control: "Over-balance withdrawal refused", coverage: "browser" },
  { page: "/kyc", control: "KYC status", coverage: "browser" },
  { page: "/deposit", control: "Deposit page", coverage: "browser" },
  {
    page: "/kyc",
    control: "KYC upload",
    coverage: "integration-boundary",
    why: "the upload path writes to object storage; the review server blanks the B2 credentials on purpose (finding 31), so a browser upload has nowhere legitimate to go. kyc.acceptance.spec.ts covers it against local disposable storage",
  },
  {
    page: "/withdraw",
    control: "Daily cap and KYC restriction",
    coverage: "integration-boundary",
    why: "requires an account at a specific KYC tier with a specific day's history; withdrawal.acceptance.spec.ts constructs those states directly",
  },
  {
    page: "/withdraw",
    control: "Provider failure and pending states",
    coverage: "blocked",
    why: "BLOCKED_BY_KEY — Paystack. The failure UI is driven by a provider response nobody can produce without credentials",
  },

  // ------------------------------------------------------------------ cash-out
  { page: "/bets", control: "Cash out", coverage: "browser" },
  { page: "/bets", control: "Cash out — accept full", coverage: "browser" },
  { page: "/bets", control: "Cash out — ticket updated", coverage: "browser" },
  { page: "/bets", control: "My bets list", coverage: "browser" },
  { page: "/bets", control: "Cash out — partial option offered", coverage: "browser" },
  {
    page: "/bets",
    control: "Cash out — partial taken",
    coverage: "integration-boundary",
    why: "the panel DOES offer 'Take half and leave the rest running', and the browser asserts that choice is presented. Taking it is left to cashout-exposure.acceptance.spec.ts, which can assert the half that keeps running and the exposure released exactly once — the arithmetic a browser cannot see. An earlier version of this row claimed no partial control was rendered at all, which was wrong and was found by reading the component",
  },
  {
    page: "/bets",
    control: "Cash out — stale offer refusal",
    coverage: "integration-boundary",
    why: "requires repricing between quote and take; http-cashout.acceptance.spec.ts drives that race",
  },

  // -------------------------------------------------------------------- pluto
  { page: "/pluto", control: "Ask Pluto — Send", coverage: "browser" },
  { page: "/pluto", control: "Mode disclosure", coverage: "blocked", why: "BLOCKED_BY_KEY — no language model is connected, and the page says so" },

  // ------------------------------------------- honest unavailable products
  { page: "/casino", control: "Unavailable state", coverage: "blocked", why: "BLOCKED_BY_CONTRACT — no aggregator" },
  { page: "/live-casino", control: "Unavailable state", coverage: "blocked", why: "BLOCKED_BY_CONTRACT — no provider" },
  { page: "/virtuals", control: "Unavailable state", coverage: "blocked", why: "BLOCKED_BY_CONTRACT — no provider" },
  { page: "/fantasy", control: "Unavailable state", coverage: "blocked", why: "BLOCKED_BY_PRODUCT_DECISION — the rules do not exist" },
  { page: "/lucky-numbers", control: "Unavailable state", coverage: "blocked", why: "BLOCKED_BY_PRODUCT_DECISION and BLOCKED_BY_REGULATION — rules, certified RNG and approval" },
  { page: "/live", control: "Live board prices", coverage: "blocked", why: "BLOCKED_BY_CONTRACT — no in-play feed, so prices are shown for information and are not tappable" },

  // -------------------------------------------------------------------- admin
  { page: "/admin", control: "Admin sign-in", coverage: "browser" },
  { page: "/admin", control: "Admin dashboard", coverage: "browser" },
  { page: "/admin/users", control: "User search", coverage: "browser" },
  { page: "/admin/users", control: "Newly registered user visible", coverage: "browser" },
  { page: "/admin/bets", control: "Newly placed bet visible", coverage: "browser" },
  { page: "/admin/ledger", control: "Ledger view", coverage: "browser" },
  { page: "/admin/reconciliation", control: "Reconciliation view", coverage: "browser" },
  { page: "/admin/audit", control: "Audit log", coverage: "browser" },
  { page: "/admin/kyc", control: "KYC review queue", coverage: "browser" },
  { page: "/admin/withdrawals", control: "Withdrawal review queue", coverage: "browser" },
  { page: "/admin/roles", control: "RBAC — support agent refused", coverage: "browser" },
  { page: "/admin", control: "Unauthenticated admin access refused", coverage: "browser" },
  {
    page: "/admin",
    control: "Step-up authentication",
    coverage: "integration-boundary",
    why: "step-up is held server-side in Redis and fails closed; rbac-http.acceptance.spec.ts asserts the server refusal, which is the control. A browser can only show the prompt",
  },
  { page: "/admin", control: "Admin screens render", coverage: "browser" },
  { page: "/admin", control: "Cross-user access refusal", coverage: "browser" },
  { page: "/admin/roles", control: "Support agent blocked from super-admin action", coverage: "browser" },

  // ------------------------------------------------- journey-level assertions
  { page: "/wallet", control: "Stake debited exactly", coverage: "browser" },
  { page: "any", control: "QA funding unreachable by a customer", coverage: "browser" },
  { page: "/register", control: "Registration OTP guard", coverage: "browser" },

  /*
   * ------------------------------------------- INTERNAL_SECURITY_VERIFICATION
   *
   * Automated probes through the real HTTP surface, on the disposable local
   * stack. NOT a penetration test: nobody creative tried to break this, a list
   * of known shapes was fired at it and the answers recorded. An independent
   * test stays outstanding external work.
   */
  { page: "any", control: "Authentication bypass refused", coverage: "browser" },
  { page: "any", control: "Error-message identifier leakage", coverage: "browser" },
  { page: "any", control: "Cross-user object access refused", coverage: "browser" },
  { page: "/api/webhooks/paystack", control: "Webhook signature enforced", coverage: "browser" },
  { page: "any", control: "Idempotency-key conflict refused", coverage: "browser" },
  { page: "/sports", control: "Injection payloads handled as text", coverage: "browser" },
  { page: "/", control: "No secret in client JavaScript", coverage: "browser" },
  { page: "/api/odds", control: "Rate limiting holds under a burst", coverage: "browser" },
  { page: "any", control: "No test-only route in a production build", coverage: "browser" },
  { page: "/account/date-of-birth", control: "Missing-DOB wagering bypass refused", coverage: "browser" },
  { page: "/pluto", control: "AI money action requires confirmation", coverage: "browser" },
  {
    page: "any",
    control: "Session fixation and revocation",
    coverage: "integration-boundary",
    why: "a revoked session is downgraded on its NEXT request, and the sign-in flow issues a fresh token; auth-secret and session acceptance specs assert both directly. A browser can only observe the effect one request later",
  },
  {
    page: "any",
    control: "CSRF on state-changing routes",
    coverage: "integration-boundary",
    why: "NextAuth issues and verifies the CSRF token for its own endpoints, and every money route is same-origin and cookie-authenticated with SameSite set on the session. Forging a cross-site POST needs a second origin, which a loopback review server does not have",
  },
  {
    page: "/kyc",
    control: "File-upload type, size and filename validation",
    coverage: "integration-boundary",
    why: "the upload path writes to object storage, and the review server blanks the B2 credentials on purpose (finding 31), so a browser upload has nowhere legitimate to go. kyc.acceptance.spec.ts drives type, size and malicious-filename cases against local disposable storage",
  },
  {
    page: "any",
    control: "Sandbox provider cannot boot as production",
    coverage: "integration-boundary",
    why: "asserted at construction in ephemeral-guard.acceptance.spec.ts, which is where the decision is made. A running review server has already chosen its provider, so a browser cannot observe the choice being refused",
  },
  {
    page: "any",
    control: "Dependency vulnerability audit",
    coverage: "integration-boundary",
    why: "`npm audit` is a supply-chain check over the lockfile, not a control a browser can press. Its findings and their exploitability are recorded in general.md §20",
  },
];

/** Controls that must appear in the generated audit. */
export function controlsRequiringBrowserCoverage() {
  return CONTROL_MANIFEST.filter((c) => c.coverage === "browser");
}
