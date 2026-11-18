import nodemailer from "nodemailer";

type SendInvoiceEmailInput = {
  to: string;
  organizationName: string;
  clientName: string;
  invoiceNumber: string;
  totalFormatted: string;
  dueDate: string;
  publicUrl: string;
  pdfBuffer: Buffer | Uint8Array;
};

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const portRaw = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM;

  if (!host || !portRaw || !user || !pass || !from) {
    throw new Error("Email is not configured");
  }

  const port = Number(portRaw);
  const secure = port === 465;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return { transporter, from };
}

export async function sendInvoiceEmail({
  to,
  organizationName,
  clientName,
  invoiceNumber,
  totalFormatted,
  dueDate,
  publicUrl,
  pdfBuffer,
}: SendInvoiceEmailInput) {
  const { transporter, from } = getTransporter();
  const subject = `Invoice ${invoiceNumber} from ${organizationName}`;

  const text = [
    `Hi ${clientName},`,
    "",
    `Invoice ${invoiceNumber} from ${organizationName} is ready.`,
    `Amount due: ${totalFormatted}`,
    `Due date: ${dueDate}`,
    "",
    `View invoice: ${publicUrl}`,
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <p>Hi ${clientName},</p>
      <p>Invoice <strong>${invoiceNumber}</strong> from <strong>${organizationName}</strong> is ready.</p>
      <p><strong>Amount due:</strong> ${totalFormatted}<br/>
      <strong>Due date:</strong> ${dueDate}</p>
      <p>
        <a href="${publicUrl}" style="display:inline-block;padding:10px 16px;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px;">
          View invoice
        </a>
      </p>
      <p style="font-size:12px;color:#374151;">If the button does not work, open this link:<br/>${publicUrl}</p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
    attachments: [
      {
        filename: `${invoiceNumber}.pdf`,
        content: Buffer.from(pdfBuffer),
        contentType: "application/pdf",
      },
    ],
  });
}

export async function sendInviteEmail({
  to,
  organizationName,
  inviteUrl,
}: {
  to: string;
  organizationName: string;
  inviteUrl: string;
}) {
  const { transporter, from } = getTransporter();
  const subject = `Invitation to join ${organizationName}`;
  const text = [
    `You have been invited to join ${organizationName} on InvoiceFlow.`,
    "",
    `Accept your invitation: ${inviteUrl}`,
    "",
    "This invitation expires in 7 days.",
  ].join("\n");
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <p>You have been invited to join <strong>${organizationName}</strong> on InvoiceFlow.</p>
      <p>
        <a href="${inviteUrl}" style="display:inline-block;padding:10px 16px;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px;">
          Accept invitation
        </a>
      </p>
      <p style="font-size:12px;color:#374151;">If the button does not work, open this link:<br/>${inviteUrl}</p>
      <p style="font-size:12px;color:#374151;">This invitation expires in 7 days.</p>
    </div>
  `;
  await transporter.sendMail({ from, to, subject, text, html });
}
