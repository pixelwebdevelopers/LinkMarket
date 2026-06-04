import Stripe from "stripe";

const secret = process.env.STRIPE_SECRET_KEY;

if (!secret && process.env.NODE_ENV === "production") {
  console.warn("[stripe] STRIPE_SECRET_KEY not set");
}

export const stripe = new Stripe(secret ?? "sk_test_placeholder", {
  apiVersion: "2024-09-30.acacia",
  typescript: true,
});

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

export function isStripeConfigured(): boolean {
  return Boolean(secret) && !secret!.includes("placeholder");
}
