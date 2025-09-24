export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-6 md:p-8 shadow-soft">
      <h1 className="mb-4 text-4xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-2 leading-relaxed text-slate-700">
        These Terms govern your use of Cothentify. By accessing the service you agree to these Terms.
      </p>
      <h2 className="mt-8 text-2xl font-semibold tracking-tight">Use of Service</h2>
      <p className="mt-2 leading-relaxed text-slate-700">
        Do not misuse the service or attempt to disrupt it. You are responsible for your account and content.
      </p>
      <h2 className="mt-8 text-2xl font-semibold tracking-tight">Subscriptions</h2>
      <p className="mt-2 leading-relaxed text-slate-700">
        Paid plans are billed monthly or yearly and may renew automatically unless canceled.
      </p>
      <h2 className="mt-8 text-2xl font-semibold tracking-tight">Liability</h2>
      <p className="mt-2 leading-relaxed text-slate-700">
        Service is provided “as is”. To the extent permitted by law, we disclaim warranties and liability.
      </p>
    </div>
  );
}
