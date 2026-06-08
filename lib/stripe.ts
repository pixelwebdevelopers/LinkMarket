import Stripe from "stripe";

const secret = process.env.STRIPE_SECRET_KEY;

if (!secret && process.env.NODE_ENV === "production") {
  console.warn("[stripe] STRIPE_SECRET_KEY not set");
}

// Omit apiVersion so the SDK uses the version pinned in your Stripe Dashboard.
// Hardcoding a specific API version string here couples this code to one
// SDK release and breaks the build when @stripe/stripe-js is upgraded.
export const stripe = new Stripe(secret ?? "sk_test_placeholder", {
  typescript: true,
});

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

export function isStripeConfigured(): boolean {
  return Boolean(secret) && !secret!.includes("placeholder");
}
