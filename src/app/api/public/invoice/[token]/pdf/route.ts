import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { getInvoiceByToken } from "@/lib/invoice-data";
import { InvoicePdf } from "@/lib/pdf/InvoicePdf";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const invoice = await getInvoiceByToken(params.token);
  if (!invoice || invoice.rawStatus === "DRAFT") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const document = React.createElement(InvoicePdf, { invoice });
  const buffer = await renderToBuffer(
    document as unknown as Parameters<typeof renderToBuffer>[0]
  );
  const body = new Uint8Array(buffer);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.number}.pdf"`,
    },
  });
}