import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getCurrentPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const sub = subscription as Stripe.Subscription & {
    current_period_end?: number;
    items?: { data?: Array<{ current_period_end?: number }> };
  };
  const seconds =
    typeof sub.current_period_end === "number"
      ? sub.current_period_end
      : sub.items?.data?.[0]?.current_period_end;
  return typeof seconds === "number" ? new Date(seconds * 1000) : null;
}

function getPriceId(subscription: Stripe.Subscription): string | null {
  const item = subscription.items.data[0];
  const price = item?.price;
  if (!price) return null;
  return typeof price === "string" ? price : price.id;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return new NextResponse("Missing signature or webhook secret", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    const stripe = getStripe();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.kind === "invoice_payment") {
          if (
            session.mode === "payment" &&
            session.payment_status === "paid" &&
            session.metadata.invoiceId &&
            session.metadata.organizationId
          ) {
            await prisma.invoice.updateMany({
              where: {
                id: session.metadata.invoiceId,
                organizationId: session.metadata.organizationId,
                status: { in: ["SENT", "OVERDUE"] },
              },
              data: { status: "PAID", paidAt: new Date() },
            });
          }
          break;
        }
        if (session.mode !== "subscription") break;
        const organizationId = session.metadata?.organizationId;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        if (!organizationId || !subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const periodEnd = getCurrentPeriodEnd(subscription);
        await prisma.organization.update({
          where: { id: organizationId },
          data: {
            plan: "PRO",
            stripeCustomerId:
              typeof session.customer === "string"
                ? session.customer
                : session.customer?.id ?? undefined,
            stripeSubscriptionId: subscription.id,
            stripePriceId: getPriceId(subscription),
            ...(periodEnd ? { stripeCurrentPeriodEnd: periodEnd } : {}),
          },
        });
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const org = await prisma.organization.findFirst({
          where: {
            OR: [
              { stripeSubscriptionId: subscription.id },
              ...(subscription.metadata?.organizationId
                ? [{ id: subscription.metadata.organizationId }]
                : []),
            ],
          },
          select: { id: true },
        });
        if (!org) break;

        const isPro =
          subscription.status === "active" || subscription.status === "trialing";
        const periodEnd = getCurrentPeriodEnd(subscription);
        await prisma.organization.update({
          where: { id: org.id },
          data: {
            plan: isPro ? "PRO" : "FREE",
            stripePriceId: getPriceId(subscription),
            ...(periodEnd ? { stripeCurrentPeriodEnd: periodEnd } : {}),
          },
        });
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const org = await prisma.organization.findFirst({
          where: {
            OR: [
              { stripeSubscriptionId: subscription.id },
              ...(subscription.metadata?.organizationId
                ? [{ id: subscription.metadata.organizationId }]
                : []),
            ],
          },
          select: { id: true },
        });
        if (!org) break;
        await prisma.organization.update({
          where: { id: org.id },
          data: {
            plan: "FREE",
            stripeSubscriptionId: null,
            stripePriceId: null,
            stripeCurrentPeriodEnd: null,
          },
        });
        break;
      }
      case "invoice.payment_failed": {
        console.log("[stripe] invoice.payment_failed", event.id);
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[stripe webhook]", error);
    return new NextResponse("Webhook handler failed", { status: 500 });
  }
}
