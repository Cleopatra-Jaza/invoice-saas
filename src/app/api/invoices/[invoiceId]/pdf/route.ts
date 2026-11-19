import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInvoiceForOrg } from "@/lib/invoice-data";
import { InvoicePdf } from "@/lib/pdf/InvoicePdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { invoiceId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const orgSlug = searchParams.get("org");
  if (!orgSlug) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id, organization: { slug: orgSlug } },
    select: { organizationId: true },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const invoice = await getInvoiceForOrg(membership.organizationId, params.invoiceId);
  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const document = React.createElement(InvoicePdf, { invoice });
  let buffer: Buffer;
  try {
    buffer = await renderToBuffer(
      document as unknown as Parameters<typeof renderToBuffer>[0]
    );
  } catch (err) {
    console.error("[pdf]", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "PDF failed" }, { status: 500 });
  }
  const body = new Uint8Array(buffer);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.number}.pdf"`,
    },
  });
}