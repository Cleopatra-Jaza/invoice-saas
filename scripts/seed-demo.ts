import { PrismaClient, InvoiceStatus, Plan, Role, ProjectStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function calc(items: { description: string; quantity: number; unitPrice: number }[], taxRate = 20) {
  const lines = items.map((i) => ({
    ...i,
    amount: round2(i.quantity * i.unitPrice),
  }));
  const subtotal = round2(lines.reduce((s, i) => s + i.amount, 0));
  const tax = round2(subtotal * (taxRate / 100));
  const total = round2(subtotal + tax);
  return { lines, subtotal, taxRate, tax, total };
}

function monthsAgo(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

async function main() {
  const demoEmail = "demo@invoiceflow.dev";

  const existingUser = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (existingUser) {
    await prisma.organization.deleteMany({ where: { slug: "demo-studio" } });
  }

  const passwordHash = await hash("Demo12345!", 12);
  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: { name: "Demo Owner", passwordHash },
    create: { name: "Demo Owner", email: demoEmail, passwordHash },
  });

  const org = await prisma.organization.create({
    data: { name: "Demo Studio", slug: "demo-studio", plan: Plan.PRO },
  });

  await prisma.membership.create({
    data: { userId: user.id, organizationId: org.id, role: Role.OWNER },
  });

  const [acme, brightside, northwind] = await Promise.all([
    prisma.client.create({
      data: {
        organizationId: org.id,
        name: "Acme Ltd",
        email: "billing@acme.example",
        company: "Acme Ltd",
      },
    }),
    prisma.client.create({
      data: {
        organizationId: org.id,
        name: "Brightside Co",
        email: "accounts@brightside.example",
        company: "Brightside Co",
      },
    }),
    prisma.client.create({
      data: {
        organizationId: org.id,
        name: "Northwind Traders",
        email: "finance@northwind.example",
        company: "Northwind Traders",
      },
    }),
  ]);

  const [website, retainer] = await Promise.all([
    prisma.project.create({
      data: {
        organizationId: org.id,
        clientId: acme.id,
        name: "Website Redesign",
        status: ProjectStatus.ACTIVE,
      },
    }),
    prisma.project.create({
      data: {
        organizationId: org.id,
        clientId: brightside.id,
        name: "Monthly Retainer",
        status: ProjectStatus.ACTIVE,
      },
    }),
  ]);

  type InvDef = {
    number: string;
    status: InvoiceStatus;
    clientId: string;
    projectId?: string | null;
    issueDate: Date;
    dueDate: Date;
    sentAt?: Date | null;
    paidAt?: Date | null;
    items: { description: string; quantity: number; unitPrice: number }[];
  };

  const defs: InvDef[] = [
    {
      number: "INV-0001",
      status: InvoiceStatus.PAID,
      clientId: acme.id,
      projectId: website.id,
      issueDate: monthsAgo(5),
      dueDate: monthsAgo(5),
      sentAt: monthsAgo(5),
      paidAt: monthsAgo(5),
      items: [
        { description: "Design discovery", quantity: 10, unitPrice: 80 },
        { description: "Wireframes", quantity: 5, unitPrice: 90 },
      ],
    },
    {
      number: "INV-0002",
      status: InvoiceStatus.PAID,
      clientId: brightside.id,
      projectId: retainer.id,
      issueDate: monthsAgo(4),
      dueDate: monthsAgo(4),
      sentAt: monthsAgo(4),
      paidAt: monthsAgo(4),
      items: [{ description: "Retainer - month 1", quantity: 1, unitPrice: 1200 }],
    },
    {
      number: "INV-0003",
      status: InvoiceStatus.PAID,
      clientId: northwind.id,
      projectId: null,
      issueDate: monthsAgo(3),
      dueDate: monthsAgo(3),
      sentAt: monthsAgo(3),
      paidAt: monthsAgo(3),
      items: [
        { description: "Consulting hours", quantity: 8, unitPrice: 95 },
        { description: "Report preparation", quantity: 2, unitPrice: 150 },
      ],
    },
    {
      number: "INV-0004",
      status: InvoiceStatus.PAID,
      clientId: acme.id,
      projectId: website.id,
      issueDate: monthsAgo(2),
      dueDate: monthsAgo(2),
      sentAt: monthsAgo(2),
      paidAt: monthsAgo(2),
      items: [{ description: "Frontend implementation", quantity: 20, unitPrice: 85 }],
    },
    {
      number: "INV-0005",
      status: InvoiceStatus.PAID,
      clientId: brightside.id,
      projectId: retainer.id,
      issueDate: monthsAgo(1),
      dueDate: monthsAgo(1),
      sentAt: monthsAgo(1),
      paidAt: monthsAgo(1),
      items: [{ description: "Retainer - month 2", quantity: 1, unitPrice: 1200 }],
    },
    {
      number: "INV-0006",
      status: InvoiceStatus.SENT,
      clientId: northwind.id,
      projectId: null,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      sentAt: new Date(),
      paidAt: null,
      items: [
        { description: "Strategy workshop", quantity: 1, unitPrice: 900 },
        { description: "Follow-up support", quantity: 3, unitPrice: 75 },
      ],
    },
    {
      number: "INV-0007",
      status: InvoiceStatus.OVERDUE,
      clientId: acme.id,
      projectId: website.id,
      issueDate: monthsAgo(2),
      dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      sentAt: monthsAgo(2),
      paidAt: null,
      items: [{ description: "QA and fixes", quantity: 12, unitPrice: 70 }],
    },
    {
      number: "INV-0008",
      status: InvoiceStatus.DRAFT,
      clientId: brightside.id,
      projectId: retainer.id,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      sentAt: null,
      paidAt: null,
      items: [{ description: "Retainer - month 3 (draft)", quantity: 1, unitPrice: 1200 }],
    },
  ];

  for (const inv of defs) {
    const t = calc(inv.items, 20);
    await prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: inv.clientId,
        projectId: inv.projectId ?? null,
        number: inv.number,
        status: inv.status,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        currency: "GBP",
        subtotal: t.subtotal,
        taxRate: t.taxRate,
        tax: t.tax,
        total: t.total,
        sentAt: inv.sentAt ?? null,
        paidAt: inv.paidAt ?? null,
        items: {
          create: t.lines.map((l) => ({
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            amount: l.amount,
          })),
        },
      },
    });
  }

  console.log("Seeded demo org: Demo Studio (demo-studio)");
  console.log("Login: demo@invoiceflow.dev / Demo12345!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
