import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { effectiveStatus } from "@/lib/invoice-status";

export const runtime = "nodejs";

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function POST(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const invoice = await prisma.invoice.findUnique({
    where: { publicToken: params.token },
    include: { client: true, organization: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const status = effectiveStatus(invoice.status, invoice.dueDate);
  if (status === "DRAFT") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (status === "PAID") {
    return NextResponse.redirect(`${getAppUrl()}/invoice/${params.token}`);
  }

  let redirectUrl: string | null = null;
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: invoice.client.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: invoice.currency.toLowerCase(),
            unit_amount: Math.round(Number(invoice.total.toString()) * 100),
            product_data: {
              name: `Invoice ${invoice.number} from ${invoice.organization.name}`,
            },
          },
        },
      ],
      metadata: {
        invoiceId: invoice.id,
        organizationId: invoice.organizationId,
        kind: "invoice_payment",
      },
      payment_intent_data: {
        metadata: {
          invoiceId: invoice.id,
          organizationId: invoice.organizationId,
          kind: "invoice_payment",
        },
      },
      success_url: `${getAppUrl()}/invoice/${params.token}?paid=1`,
      cancel_url: `${getAppUrl()}/invoice/${params.token}?canceled=1`,
    });
    redirectUrl = session.url;
  } catch (error) {
    console.error("[invoice checkout]", error);
    return NextResponse.json({ error: "Unable to start checkout" }, { status: 500 });
  }

  if (!redirectUrl) {
    return NextResponse.json({ error: "Unable to start checkout" }, { status: 500 });
  }
  return NextResponse.redirect(redirectUrl);
}
