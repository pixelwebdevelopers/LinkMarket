import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/authz";
import { db } from "@/lib/db";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { getSetting } from "@/lib/settings";

/**
 * Create a Stripe Checkout Session for an existing PENDING_PAYMENT order.
 *
 * Flow:
 *   1. POST /api/orders creates the order in PENDING_PAYMENT with the price snapshot.
 *   2. POST /api/checkout/session { orderId } returns { url } — customer redirects there.
 *   3. Stripe redirects back to /orders/[id]?success=1
 *   4. Stripe sends payment_intent.succeeded webhook -> we mark PAID + write ledger.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: "orderId is required" }, { status: 400 });

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { listing: { include: { site: true } } },
    });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.customerId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (order.status !== "PENDING_PAYMENT") {
      return NextResponse.json({ error: "Order is not awaiting payment" }, { status: 409 });
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Payments are not configured. Set STRIPE_SECRET_KEY in env." },
        { status: 503 }
      );
    }

    const currency = (await getSetting("currency")).toLowerCase();
    const platformName = await getSetting("platformName");
    const origin =
      req.headers.get("origin") ??
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.AUTH_URL ??
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: user.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: order.pricePaidCents,
            product_data: {
              name: `${order.listing.site.name} — ${order.listing.type.replace("_", " ")}`,
              description: `${platformName} order ${order.id}`,
            },
          },
        },
      ],
      success_url: `${origin}/orders/${order.id}?paid=1`,
      cancel_url: `${origin}/orders/${order.id}?cancelled=1`,
      metadata: { orderId: order.id, customerId: user.id },
      payment_intent_data: {
        metadata: { orderId: order.id, customerId: user.id },
      },
    });

    await db.order.update({
      where: { id: order.id },
      data: { stripeCheckoutSessionId: session.id },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[checkout]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
