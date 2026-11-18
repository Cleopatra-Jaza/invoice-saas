"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import { getStripe } from "@/lib/stripe";

export type BillingActionState = { error?: string };

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function logStripeError(err: unknown) {
  const e = err as { type?: string; code?: string; message?: string };
  console.error("[checkout]", e?.type, e?.code, e?.message);
}

export async function startCheckout(
  orgSlug: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prevState: BillingActionState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData
): Promise<BillingActionState> {
  const { organizationId, role, organization } = await requireOrg(orgSlug);
  if (role !== "OWNER") {
    return { error: "Only the owner can manage billing" };
  }

  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    return { error: "Billing is not configured" };
  }

  const stripe = getStripe();
  let stripeCustomerId = organization.stripeCustomerId;
  let checkoutUrl: string | null = null;

  try {
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        name: organization.name,
        metadata: { organizationId },
      });
      await prisma.organization.update({
        where: { id: organizationId },
        data: { stripeCustomerId: customer.id },
      });
      stripeCustomerId = customer.id;
    }

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: stripeCustomerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${getAppUrl()}/${orgSlug}/billing?success=1`,
        cancel_url: `${getAppUrl()}/${orgSlug}/billing?canceled=1`,
        metadata: { organizationId },
        subscription_data: { metadata: { organizationId } },
      });
      checkoutUrl = session.url;
    } catch (err) {
      const e = err as { code?: string };
      if (e?.code === "resource_missing" && stripeCustomerId) {
        const customer = await stripe.customers.create({
          name: organization.name,
          metadata: { organizationId },
        });
        await prisma.organization.update({
          where: { id: organizationId },
          data: { stripeCustomerId: customer.id },
        });
        stripeCustomerId = customer.id;
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          customer: stripeCustomerId,
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: `${getAppUrl()}/${orgSlug}/billing?success=1`,
          cancel_url: `${getAppUrl()}/${orgSlug}/billing?canceled=1`,
          metadata: { organizationId },
          subscription_data: { metadata: { organizationId } },
        });
        checkoutUrl = session.url;
      } else {
        throw err;
      }
    }
  } catch (error) {
    logStripeError(error);
    return { error: "Unable to start checkout" };
  }

  if (!checkoutUrl) {
    return { error: "Unable to start checkout" };
  }
  redirect(checkoutUrl);
}

export async function openBillingPortal(
  orgSlug: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prevState: BillingActionState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData
): Promise<BillingActionState> {
  const { role, organization } = await requireOrg(orgSlug);
  if (role !== "OWNER") {
    return { error: "Only the owner can manage billing" };
  }
  if (!organization.stripeCustomerId) {
    return { error: "No billing account found for this organization" };
  }

  const stripe = getStripe();
  let portalUrl: string | null = null;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: organization.stripeCustomerId,
      return_url: `${getAppUrl()}/${orgSlug}/billing`,
    });
    portalUrl = session.url;
  } catch (error) {
    logStripeError(error);
    return { error: "Unable to open billing portal" };
  }

  if (!portalUrl) {
    return { error: "Unable to open billing portal" };
  }
  redirect(portalUrl);
}
