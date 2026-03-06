export const metadata = {
  title: "Refund Policy – Platone",
};

export default function RefundPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 flex flex-col gap-8 text-indigo-200">
      <div className="flex flex-col gap-2">
        <h1 className="text-indigo-100 text-3xl font-bold">Refund Policy</h1>
        <p className="text-indigo-400 text-sm">Last updated: March 6, 2026</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-indigo-100 text-xl font-semibold">Payments & Billing</h2>
        <p className="text-sm leading-relaxed">
          All payments for Platone subscriptions are processed by{" "}
          <strong>Paddle.com Market Limited</strong>, which acts as the Merchant of Record.
          Your card statement will show a charge from Paddle.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-indigo-100 text-xl font-semibold">Refund Eligibility</h2>
        <p className="text-sm leading-relaxed">
          A refund may be requested only if you have <strong>not yet started a paid interview
          session</strong> after purchasing a subscription. Specifically, no refund will be issued
          if you have completed the free trial interview, purchased a subscription, and then
          started at least one interview session under that subscription.
        </p>
        <p className="text-sm leading-relaxed">
          By starting a paid interview session, you acknowledge that the service has been
          delivered and waive your right to a refund for that billing period.
        </p>
        <p className="text-sm leading-relaxed">
          Refunds are never available for subscription renewals.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-indigo-100 text-xl font-semibold">How to Request a Refund</h2>
        <p className="text-sm leading-relaxed">
          To request a refund, contact us at{" "}
          <a href="mailto:matterconi@gmail.com" className="text-violet-400 underline">
            matterconi@gmail.com
          </a>{" "}
          within the eligible period. Please include the email address associated with your account.
          We will process your request within 5 business days.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-indigo-100 text-xl font-semibold">Cancellations</h2>
        <p className="text-sm leading-relaxed">
          You can cancel your subscription at any time through the customer portal. Cancellation
          stops future charges but does not entitle you to a refund for the current billing period.
          You retain access to the service until the end of the period.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-indigo-100 text-xl font-semibold">Contact</h2>
        <p className="text-sm leading-relaxed">
          Questions? Reach us at{" "}
          <a href="mailto:matterconi@gmail.com" className="text-violet-400 underline">
            matterconi@gmail.com
          </a>
          .
        </p>
      </section>
    </main>
  );
}
