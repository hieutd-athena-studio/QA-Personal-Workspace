// project-data.jsx — Extended data for Project Detail / Cases / Plans
//
// Builds on data.jsx (PROJECT, PLAN, CYCLE, ASSIGNMENTS) and adds:
//  - the case catalogue (cases not in a cycle, just in the project)
//  - test plans + cycles
//  - test types
//  - dashboard stats

// ── Test case catalogue (project-level, not per-cycle) ──────────
// Re-uses the ASSIGNMENTS shape but stripped to catalogue fields.
const CATALOGUE = [
  // Cart
  { id: "c1",  display_id: "AUR-102", name: "Cart updates quantity without page reload", version: "v3", category: "Cart", subcategory: "Cart interactions" },
  { id: "c2",  display_id: "AUR-103", name: "Apply promo code — case insensitive, trimmed whitespace", version: "v2", category: "Cart", subcategory: "Promotions" },
  { id: "c3",  display_id: "AUR-121", name: "Empty cart redirects to /shop with banner", version: "v1", category: "Cart", subcategory: "Edge cases" },
  { id: "c4",  display_id: "AUR-122", name: "Inventory hold released when checkout abandoned", version: "v2", category: "Cart", subcategory: "Inventory" },
  { id: "c5",  display_id: "AUR-124", name: "Discount stacking — promo + loyalty applies both", version: "v3", category: "Cart", subcategory: "Promotions" },
  { id: "c6",  display_id: "AUR-131", name: "Out-of-stock during checkout surfaces a recovery toast", version: "v1", category: "Cart", subcategory: "Inventory" },
  { id: "c7",  display_id: "AUR-105", name: "Save-for-later moves item out of cart and persists", version: "v2", category: "Cart", subcategory: "Cart interactions" },
  { id: "c8",  display_id: "AUR-106", name: "Free shipping threshold banner updates live", version: "v1", category: "Cart", subcategory: "Promotions" },

  // Checkout
  { id: "c9",  display_id: "AUR-104", name: "Guest checkout email validation rejects role addresses", version: "v1", category: "Checkout", subcategory: "Identity" },
  { id: "c10", display_id: "AUR-108", name: "Saved card autofill respects last-used preference", version: "v2", category: "Checkout", subcategory: "Payment" },
  { id: "c11", display_id: "AUR-109", name: "Address autocomplete falls back to manual entry on API failure", version: "v1", category: "Checkout", subcategory: "Shipping" },
  { id: "c12", display_id: "AUR-110", name: "Shipping method selection persists across refresh", version: "v1", category: "Checkout", subcategory: "Shipping" },
  { id: "c13", display_id: "AUR-111", name: "US sales tax recalculates when shipping state changes", version: "v4", category: "Checkout", subcategory: "Tax" },
  { id: "c14", display_id: "AUR-112", name: "PayPal redirect returns to confirmation on success", version: "v2", category: "Checkout", subcategory: "Payment" },
  { id: "c15", display_id: "AUR-113", name: "3-D Secure challenge surfaces inside the payment sheet", version: "v1", category: "Checkout", subcategory: "Payment" },
  { id: "c16", display_id: "AUR-114", name: "Apple Pay sheet completes with billing ZIP mismatch", version: "v1", category: "Checkout", subcategory: "Payment" },
  { id: "c17", display_id: "AUR-115", name: "Google Pay sheet declines fall through to manual entry", version: "v1", category: "Checkout", subcategory: "Payment" },
  { id: "c18", display_id: "AUR-116", name: "Card decline shows actionable error, retains form state", version: "v1", category: "Checkout", subcategory: "Payment" },
  { id: "c19", display_id: "AUR-117", name: "VAT-ID field appears for EU billing addresses", version: "v2", category: "Checkout", subcategory: "Tax" },
  { id: "c20", display_id: "AUR-126", name: "Currency switcher to EUR rounds correctly", version: "v2", category: "Checkout", subcategory: "Pricing" },
  { id: "c21", display_id: "AUR-127", name: "Promotional pricing reflects in cart and checkout consistently", version: "v1", category: "Checkout", subcategory: "Pricing" },
  { id: "c22", display_id: "AUR-128", name: "Mobile checkout reflows at 375px without horizontal scroll", version: "v1", category: "Checkout", subcategory: "Responsive" },
  { id: "c23", display_id: "AUR-130", name: "Keyboard tab order on payment step is logical", version: "v2", category: "Checkout", subcategory: "Accessibility" },

  // Post-purchase
  { id: "c24", display_id: "AUR-118", name: "Order confirmation email sent within 30s", version: "v2", category: "Post-purchase", subcategory: "Notifications" },
  { id: "c25", display_id: "AUR-119", name: "Receipt PDF link is signed and expires after 7 days", version: "v1", category: "Post-purchase", subcategory: "Notifications" },
  { id: "c26", display_id: "AUR-120", name: "SMS confirmation respects opt-in preference", version: "v1", category: "Post-purchase", subcategory: "Notifications" },
  { id: "c27", display_id: "AUR-133", name: "Order appears in /account/orders within 5s of placement", version: "v1", category: "Post-purchase", subcategory: "Account" },
  { id: "c28", display_id: "AUR-134", name: "Customer can reorder from order detail with one click", version: "v1", category: "Post-purchase", subcategory: "Account" },
  { id: "c29", display_id: "AUR-135", name: "Refund initiated from admin reflects in customer account", version: "v2", category: "Post-purchase", subcategory: "Account" },

  // Admin
  { id: "c30", display_id: "AUR-140", name: "Admin can view full address audit trail per order", version: "v1", category: "Admin", subcategory: "Orders" },
  { id: "c31", display_id: "AUR-141", name: "Bulk export of orders respects active filters", version: "v1", category: "Admin", subcategory: "Orders" },
  { id: "c32", display_id: "AUR-142", name: "Inventory adjustment writes to audit log", version: "v1", category: "Admin", subcategory: "Inventory" },
];

// ── Plans + Cycles ──────────────────────────────────────────────
const PLANS = [
  {
    id: "p1", display_id: "AUR-PL-014",
    name: "Checkout v2.4 Release Validation",
    description: "Full sweep of checkout flows before the 2.4 rollout to all regions.",
    start_date: "2026-05-12", end_date: "2026-05-22",
    working_days: 8, task_total: 7.25,
    cycles: 3, progress: { pass: 11, fail: 3, blocked: 2, unexec: 4 },
  },
  {
    id: "p2", display_id: "AUR-PL-013",
    name: "EU launch — VAT & currency",
    description: "Targeted plan covering EU-specific tax, currency and address forms.",
    start_date: "2026-05-25", end_date: "2026-06-05",
    working_days: 6, task_total: 5.5,
    cycles: 2, progress: { pass: 4, fail: 0, blocked: 1, unexec: 11 },
  },
  {
    id: "p3", display_id: "AUR-PL-012",
    name: "Post-purchase notifications",
    description: "Email + SMS + push parity audit.",
    start_date: "2026-06-08", end_date: "2026-06-12",
    working_days: 3, task_total: 3.25,
    cycles: 1, progress: { pass: 0, fail: 0, blocked: 0, unexec: 8 },
  },
];

// ── Test Types (orthogonal grouping) ────────────────────────────
const TYPES = [
  { id: "t1", name: "Smoke", description: "Critical-path coverage that must pass for every release.", assigned: 12, total: 32 },
  { id: "t2", name: "Regression", description: "Full coverage run before any major version cut.", assigned: 28, total: 32 },
  { id: "t3", name: "API", description: "Endpoint-level contract checks; usually automated.", assigned: 14, total: 32 },
  { id: "t4", name: "Accessibility", description: "WCAG-AA spot checks across primary flows.", assigned: 6, total: 32 },
  { id: "t5", name: "Performance", description: "TTI, FCP, and checkout-submit budget probes.", assigned: 4, total: 32 },
];

// ── Project list (for the projects index) ──────────────────────
const PROJECTS = [
  { id: "aurora",  prefix: "AUR", name: "Aurora",  description: "Direct-to-consumer e-commerce platform — web + mobile.", color: "#8b5cf6", cases: 32, plans: 3 },
  { id: "helios",  prefix: "HEL", name: "Helios",  description: "Internal admin dashboard for ops + customer support.",  color: "#0d9488", cases: 24, plans: 2 },
  { id: "vega",    prefix: "VGA", name: "Vega",    description: "Native iOS + Android storefront companion app.",        color: "#f59e0b", cases: 18, plans: 1 },
  { id: "lyra",    prefix: "LYR", name: "Lyra",    description: "Marketing site & content CMS — Next.js + Sanity.",       color: "#ec4899", cases: 9,  plans: 0 },
];

// Dashboard stats
const DASHBOARD = {
  cases: CATALOGUE.length,
  plans: PLANS.length,
  cycles: PLANS.reduce((s, p) => s + p.cycles, 0),
  types:  TYPES.length,
  upcoming: PLANS.map((p) => ({ ...p, days_to: Math.ceil((new Date(p.end_date) - new Date("2026-05-19")) / 86400000) })),
  task_budget: PLANS.reduce((s, p) => s + p.task_total, 0),
  working_days: PLANS.reduce((s, p) => s + p.working_days, 0),
};

Object.assign(window, { CATALOGUE, PLANS, TYPES, PROJECTS, DASHBOARD });
