// data.jsx — realistic QA cycle data for the prototype
//
// Project: "Aurora" — an e-commerce platform
// Plan:    Checkout v2.4 Release Validation
// Cycle:   Smoke Pass · Production
//
// Mixed statuses to make the sidebar feel like real mid-execution work.

const PROJECT = {
  id: "aurora",
  prefix: "AUR",
  name: "Aurora",
  color: "#8b5cf6",
};

const PLAN = {
  id: "plan-v24",
  display_id: "AUR-PL-014",
  name: "Checkout v2.4 Release Validation",
  start_date: "2026-05-12",
  end_date: "2026-05-22",
  working_days: 8,
};

const CYCLE = {
  id: "cycle-smoke-prod",
  display_id: "AUR-CY-042",
  name: "Smoke Pass — Production",
  environment: "Production",
  build: "checkout-web @ 2.4.0-rc.3",
  tester: "You",
};

// Status: "pass" | "fail" | "blocked" | "unexec"
const ASSIGNMENTS = [
  {
    id: "a1", display_id: "AUR-102", version: "v3",
    name: "Cart updates quantity without page reload",
    status: "pass",
    category: "Cart", subcategory: "Cart interactions",
    description:
      "Verify that increment/decrement controls on a cart line item update the line subtotal, cart total, and tax estimate without a full navigation.",
    steps: [
      { action: "Open /cart with a single in-stock item, quantity 1.", expected: "Cart renders the item with qty stepper visible." },
      { action: "Click the + control twice.",                            expected: "Qty reads 3. Line subtotal and cart total update within 200ms; no spinner appears for >300ms." },
      { action: "Click the − control once.",                             expected: "Qty reads 2. Totals re-render cleanly. No layout shift below the cart summary." },
    ],
    expected_result: "Quantity adjustments are reflected immediately in line and cart totals via optimistic UI; the network request resolves silently in the background.",
    notes: "Stepper feels snappy; verified on Chrome 124 + Safari 17.4. No console errors.",
    executed_at: "2 min ago",
  },
  {
    id: "a2", display_id: "AUR-103", version: "v2",
    name: "Apply promo code — case insensitive, trimmed whitespace",
    status: "pass",
    category: "Cart", subcategory: "Promotions",
    description:
      "Promo code field should accept user input with surrounding whitespace and any mix of casing, normalising before submission.",
    steps: [
      { action: "On /cart, enter `  SUMMER24  ` into the promo field.",                          expected: "Field accepts the input as typed (no live transform)." },
      { action: "Click Apply.",                                                                  expected: "Code is normalised server-side; success toast appears; cart total reduced by 10%." },
      { action: "Reload the cart.",                                                              expected: "Promo persists; chip displayed as `SUMMER24` (uppercase, trimmed)." },
    ],
    expected_result: "Normalisation happens at the API boundary; UI shows the canonical form after success.",
    notes: "",
    executed_at: "5 min ago",
  },
  {
    id: "a3", display_id: "AUR-104", version: "v1",
    name: "Guest checkout email validation rejects role addresses",
    status: "fail",
    category: "Checkout", subcategory: "Identity",
    description:
      "Per fraud policy, guest checkout must reject obvious role-based email aliases (admin@, postmaster@, abuse@) before card entry.",
    steps: [
      { action: "Begin guest checkout, enter `admin@example.com` in the email field, blur.",      expected: "Inline error: 'Use a personal email address for guest checkout.'" },
      { action: "Try `postmaster@stripe.com`.",                                                   expected: "Same inline error." },
      { action: "Try `jane.doe@example.com`.",                                                    expected: "No error; continue to shipping enabled." },
    ],
    expected_result: "Role list is enforced before the Continue button enables.",
    notes: "Postmaster passes validation in current build — appears the role list is not loaded for the EU region. Filed AUR-BUG-218.",
    executed_at: "11 min ago",
  },
  {
    id: "a4", display_id: "AUR-108", version: "v2",
    name: "Saved card autofill respects last-used preference",
    status: "pass",
    category: "Checkout", subcategory: "Payment",
    description:
      "For a returning customer with multiple saved cards, the most recently used card should be pre-selected on the payment step.",
    steps: [
      { action: "Sign in as `qa+returning@aurora.test` (3 saved cards on file).",                  expected: "Cards listed with last-used at top." },
      { action: "Navigate to /checkout/payment.",                                                  expected: "Top card pre-selected; Continue enabled immediately." },
    ],
    expected_result: "Pre-selection is correct; preference survives a refresh.",
    notes: "",
    executed_at: "18 min ago",
  },
  {
    id: "a5", display_id: "AUR-109", version: "v1",
    name: "Address autocomplete falls back to manual entry on API failure",
    status: "pass",
    category: "Checkout", subcategory: "Shipping",
    description:
      "When the address autocomplete provider returns 5xx or times out, the form must gracefully reveal the full manual-entry fields.",
    steps: [
      { action: "Throttle to Slow 3G and start typing into Address line 1.",                      expected: "After 1.5s, the autocomplete spinner is replaced with a 'Enter manually' caption." },
      { action: "Click 'Enter manually'.",                                                         expected: "City / State / Postal code fields appear; address line 1 retains typed value." },
    ],
    expected_result: "User can always complete address entry; no dead-end state.",
    notes: "",
    executed_at: "22 min ago",
  },
  {
    id: "a6", display_id: "AUR-111", version: "v4",
    name: "US sales tax recalculates when shipping state changes",
    status: "pass",
    category: "Checkout", subcategory: "Tax",
    description:
      "Estimated tax line must update when the shipping address is edited to a different US state.",
    steps: [
      { action: "Set shipping state to CA, observe tax line.",                                     expected: "Tax computed against CA rate; line item visible." },
      { action: "Edit state to OR.",                                                               expected: "Tax line updates to $0.00 within 400ms (OR has no sales tax)." },
    ],
    expected_result: "Tax line is current with the shipping address.",
    notes: "",
    executed_at: "31 min ago",
  },
  {
    id: "a7", display_id: "AUR-112", version: "v2",
    name: "PayPal redirect returns to confirmation on success",
    status: "pass",
    category: "Checkout", subcategory: "Payment",
    description:
      "Selecting PayPal redirects to the PP sandbox; on approve, we return to /checkout/confirmation with the order created.",
    steps: [
      { action: "Select PayPal, click Continue.",                                                  expected: "Redirect to PayPal sandbox in <1s." },
      { action: "Approve in PayPal sandbox.",                                                      expected: "Return to /checkout/confirmation; order ID visible." },
    ],
    expected_result: "Round-trip completes; order persists.",
    notes: "",
    executed_at: "40 min ago",
  },
  {
    id: "a8", display_id: "AUR-113", version: "v1",
    name: "3-D Secure challenge surfaces inside the payment sheet",
    status: "blocked",
    category: "Checkout", subcategory: "Payment",
    description:
      "When the issuer requires SCA, the 3DS challenge must render in an inline iframe on /checkout/payment, not a popup.",
    steps: [
      { action: "Use a 3DS-required test card (`4000 0027 6000 3184`).",                          expected: "After clicking Pay, an inline challenge iframe appears within the payment card." },
      { action: "Complete the challenge.",                                                         expected: "Iframe collapses; order created." },
    ],
    expected_result: "No popups; the challenge sits within the page layout.",
    notes: "Blocked — sandbox 3DS endpoint returning 503 since 09:14 UTC. Stripe status page acknowledging incident. Will retest once green.",
    executed_at: "1 h ago",
  },
  {
    id: "a9", display_id: "AUR-114", version: "v1",
    name: "Apple Pay sheet completes with billing ZIP mismatch",
    status: "unexec",
    category: "Checkout", subcategory: "Payment",
    description:
      "When the customer uses Apple Pay with a card whose billing ZIP differs from the typed shipping ZIP, the order must still complete and the receipt must reflect both addresses correctly.",
    steps: [
      { action: "Add an in-stock item to cart and proceed to checkout as guest on a Safari device with Apple Pay configured.", expected: "Apple Pay button is visible on the Payment step." },
      { action: "Enter a shipping address with ZIP `94110`.",                                       expected: "Shipping address saved; Continue to payment enabled." },
      { action: "Tap Apple Pay and choose a card whose billing ZIP is `10013` (different from shipping).",                       expected: "Apple Pay sheet appears; selected card is highlighted; Pay with Face ID prompt is shown." },
      { action: "Confirm payment via Face ID / Touch ID.",                                          expected: "Sheet dismisses; /checkout/confirmation loads; order ID is displayed." },
      { action: "Open the order in the admin and inspect the addresses block.",                    expected: "Shipping ZIP = 94110, Billing ZIP = 10013. Receipt email mirrors both." },
    ],
    expected_result:
      "Order completes successfully. Both billing and shipping addresses are stored independently and reflected in the receipt email and the admin order view. No fraud-rule false-positive should fire for the ZIP mismatch.",
    notes: "",
    executed_at: null,
  },
  {
    id: "a10", display_id: "AUR-116", version: "v1",
    name: "Card decline shows actionable error, retains form state",
    status: "unexec",
    category: "Checkout", subcategory: "Payment",
    description:
      "On a card decline, the user should see a non-technical message and remain on the payment step with all entered details intact.",
    steps: [
      { action: "Submit payment with decline test card `4000 0000 0000 9995`.",                    expected: "Error toast: 'Card declined — try a different card or contact your issuer.'" },
      { action: "Verify the address and card-number fields.",                                      expected: "Address still populated; card-number field cleared; CVV cleared; expiry retained." },
    ],
    expected_result: "User can attempt a retry without re-entering shipping details.",
    notes: "",
    executed_at: null,
  },
  {
    id: "a11", display_id: "AUR-118", version: "v2",
    name: "Order confirmation email sent within 30s",
    status: "unexec",
    category: "Post-purchase", subcategory: "Notifications",
    description:
      "After a successful order, the confirmation email must arrive within 30 seconds in the test inbox.",
    steps: [
      { action: "Complete a successful order as `qa+inbox@aurora.test`.",                          expected: "Order created." },
      { action: "Poll the mailbox API.",                                                            expected: "Confirmation email present within 30s. Subject: 'Your Aurora order #...'." },
    ],
    expected_result: "Email arrives; renders correctly in Gmail, Outlook web, Apple Mail.",
    notes: "",
    executed_at: null,
  },
  {
    id: "a12", display_id: "AUR-119", version: "v1",
    name: "Receipt PDF link is signed and expires after 7 days",
    status: "fail",
    category: "Post-purchase", subcategory: "Notifications",
    description:
      "The 'Download receipt' link inside the confirmation email points to a signed URL valid for 7 days.",
    steps: [
      { action: "From the confirmation email, click 'Download receipt'.",                          expected: "PDF downloads; correct order data." },
      { action: "Inspect the URL — confirm it contains `?signature=` and `&expires=`.",            expected: "Both params present; expiry ≈ now + 7d." },
      { action: "After 8 days (or via clock skew), open the same link.",                           expected: "HTTP 403; user-friendly 'Link expired' page." },
    ],
    expected_result: "URL is signed and expires correctly.",
    notes: "Signature param missing — current build emits a plain `/receipt/{id}.pdf` URL. Filed AUR-BUG-221.",
    executed_at: "1 h ago",
  },
  {
    id: "a13", display_id: "AUR-121", version: "v1",
    name: "Empty cart redirects to /shop with banner",
    status: "pass",
    category: "Cart", subcategory: "Edge cases",
    description:
      "Navigating to /checkout with an empty cart must redirect to /shop and surface an informational banner.",
    steps: [
      { action: "Empty the cart, navigate to /checkout.",                                          expected: "Redirect to /shop; banner: 'Add something to your cart to check out.'" },
    ],
    expected_result: "Redirect + banner.",
    notes: "",
    executed_at: "2 h ago",
  },
  {
    id: "a14", display_id: "AUR-122", version: "v2",
    name: "Inventory hold released when checkout abandoned",
    status: "unexec",
    category: "Cart", subcategory: "Inventory",
    description:
      "When a user enters checkout, a 10-minute inventory hold is placed on each line; it must release on close.",
    steps: [
      { action: "Add a low-stock SKU to cart, enter checkout.",                                    expected: "Inventory hold visible in admin." },
      { action: "Close the tab without completing.",                                                expected: "Hold released within 10 min; stock counter returns to original." },
    ],
    expected_result: "Hold lifecycle works as designed.",
    notes: "",
    executed_at: null,
  },
  {
    id: "a15", display_id: "AUR-124", version: "v3",
    name: "Discount stacking — promo + loyalty applies both",
    status: "fail",
    category: "Cart", subcategory: "Promotions",
    description:
      "A logged-in loyalty member applying a stackable promo code should see both discounts on the summary.",
    steps: [
      { action: "Sign in with a Tier-2 member account (5% always-on).",                            expected: "Subtotal already reflects 5% loyalty line." },
      { action: "Apply promo `WELCOME10`.",                                                         expected: "Summary shows 5% loyalty + 10% promo as separate lines." },
    ],
    expected_result: "Both discounts visible and applied.",
    notes: "Loyalty discount disappears when the promo is applied — looks like server replaces the discount array instead of appending. Filed AUR-BUG-225.",
    executed_at: "2 h ago",
  },
  {
    id: "a16", display_id: "AUR-126", version: "v2",
    name: "Currency switcher to EUR rounds correctly",
    status: "unexec",
    category: "Checkout", subcategory: "Pricing",
    description:
      "Switching the storefront currency to EUR must convert all monetary fields and apply half-up rounding to 2dp.",
    steps: [
      { action: "Switch currency to EUR via the header switcher.",                                  expected: "Prices update; symbols change to €." },
      { action: "Verify one product: USD $19.99 → EUR ~€18.39 (at current rate).",                  expected: "Within ±€0.01 of the published FX rate. No ¢ shown." },
    ],
    expected_result: "Display rounds half-up to 2dp; no rendering glitches.",
    notes: "",
    executed_at: null,
  },
  {
    id: "a17", display_id: "AUR-128", version: "v1",
    name: "Mobile checkout reflows at 375px without horizontal scroll",
    status: "pass",
    category: "Checkout", subcategory: "Responsive",
    description:
      "At an iPhone SE viewport (375 × 667), every checkout step must remain within the viewport horizontally.",
    steps: [
      { action: "Open /checkout in 375×667 viewport.",                                              expected: "No horizontal scrollbar; all primary CTAs are within thumb reach (bottom 60%)." },
    ],
    expected_result: "Layout holds.",
    notes: "",
    executed_at: "3 h ago",
  },
  {
    id: "a18", display_id: "AUR-130", version: "v2",
    name: "Keyboard tab order on payment step is logical",
    status: "blocked",
    category: "Checkout", subcategory: "Accessibility",
    description:
      "Tab order should follow visual flow: email → name → card → expiry → CVV → ZIP → Pay.",
    steps: [
      { action: "Focus the email field, press Tab repeatedly.",                                    expected: "Focus advances in the documented order; visible focus ring on each element." },
    ],
    expected_result: "Tab order matches visual layout.",
    notes: "Blocked on AUR-BUG-219 — the saved-card disclosure renders before the form is hydrated, eating two tab stops. Test once frontend lands the fix.",
    executed_at: "3 h ago",
  },
  {
    id: "a19", display_id: "AUR-131", version: "v1",
    name: "Out-of-stock during checkout surfaces a recovery toast",
    status: "unexec",
    category: "Cart", subcategory: "Inventory",
    description:
      "If a SKU sells out between cart and place-order, the user should see a toast describing the issue and the line is auto-removed.",
    steps: [
      { action: "From admin, drop SKU `AURORA-MUG-01` stock to 0 while the user is on /checkout/payment.", expected: "No client-side error." },
      { action: "User clicks Pay.",                                                                   expected: "Toast: 'AURORA-MUG-01 is now out of stock and was removed from your order.' Order recalculated." },
    ],
    expected_result: "Graceful recovery; no 500.",
    notes: "",
    executed_at: null,
  },
  {
    id: "a20", display_id: "AUR-133", version: "v1",
    name: "Order appears in /account/orders within 5s of placement",
    status: "pass",
    category: "Post-purchase", subcategory: "Account",
    description:
      "A freshly placed order must be visible in the customer's order history immediately, not after a polling cycle.",
    steps: [
      { action: "Complete an order as a signed-in user.",                                          expected: "Confirmation page renders." },
      { action: "Navigate to /account/orders within 5s.",                                          expected: "The new order appears at the top with the expected total." },
    ],
    expected_result: "Order list reflects the new order; no manual refresh needed.",
    notes: "",
    executed_at: "4 h ago",
  },
];

Object.assign(window, { PROJECT, PLAN, CYCLE, ASSIGNMENTS });
