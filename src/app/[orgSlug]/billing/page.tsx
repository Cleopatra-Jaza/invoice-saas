import { requireOrg } from "@/lib/session";
import BillingActions from "./BillingActions";
import { openBillingPortal, startCheckout } from "./actions";

export default async function BillingPage({
  params,
  searchParams,
}: {
  params: { orgSlug: string };
  searchParams: { success?: string; canceled?: string };
}) {
  const { organization, role } = await requireOrg(params.orgSlug);
  const isOwner = role === "OWNER";
  const upgradeAction = startCheckout.bind(null, params.orgSlug);
  const portalAction = openBillingPortal.bind(null, params.orgSlug);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Billing</h1>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
            organization.plan === "PRO"
              ? "bg-green-100 text-green-700"
              : "bg-slate-100 text-gray-900"
          }`}
        >
          {organization.plan}
        </span>
      </div>

      {searchParams.success ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {organization.plan === "FREE"
            ? "Updating your plan... refresh in a few seconds."
            : "Payment received, your plan will update in a few seconds."}
        </div>
      ) : null}
      {searchParams.canceled ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-gray-900">
          Checkout canceled.
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-medium text-gray-800">Current plan</h2>
        <p className="mt-2 text-2xl font-semibold text-gray-900">{organization.plan}</p>
        {organization.stripeCurrentPeriodEnd ? (
          <p className="mt-1 text-sm text-gray-700">
            Current period ends: {organization.stripeCurrentPeriodEnd.toISOString().slice(0, 10)}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900">FREE</h3>
          <p className="mt-1 text-sm text-gray-700">Up to 5 invoices per month</p>
          <ul className="mt-3 space-y-1 text-sm text-gray-900">
            <li>• 5 invoices / month</li>
            <li>• Core features</li>
          </ul>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900">PRO</h3>
          <p className="mt-1 text-sm text-gray-700">Unlimited invoices, GBP 9 per month</p>
          <ul className="mt-3 space-y-1 text-sm text-gray-900">
            <li>• Unlimited invoices</li>
            <li>• GBP 9 / month</li>
          </ul>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        {isOwner ? (
          organization.plan === "FREE" ? (
            <BillingActions action={upgradeAction} label="Upgrade to PRO" />
          ) : (
            <BillingActions action={portalAction} label="Manage subscription" />
          )
        ) : (
          <p className="text-sm text-gray-700">Only the owner can manage billing.</p>
        )}
      </div>
    </div>
  );
}
