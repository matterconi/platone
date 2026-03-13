import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Terms of Service – Interspeak",
};

export default function TermsPage() {
  return (
    <>
    <Navbar />
    <main className="max-w-3xl mx-auto px-6 py-16 flex flex-col gap-8 text-indigo-200">
      <div className="flex flex-col gap-2">
        <h1 className="text-indigo-100 text-3xl font-bold">Terms of Service</h1>
        <p className="text-indigo-400 text-sm">Last updated: March 6, 2026</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-indigo-100 text-xl font-semibold">1. Service</h2>
        <p className="text-sm leading-relaxed">
          Interspeak (<strong>interspeak.ai</strong>) provides an AI-powered voice interview
          practice platform. By accessing or using the service, you agree to these Terms.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-indigo-100 text-xl font-semibold">2. Eligibility</h2>
        <p className="text-sm leading-relaxed">
          You must be at least 16 years old to use Interspeak. By using the service, you represent
          that you meet this requirement.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-indigo-100 text-xl font-semibold">3. Subscriptions</h2>
        <p className="text-sm leading-relaxed">
          Interspeak offers monthly subscription plans (Casual, Regular, Pro). Subscriptions
          automatically renew each month. You may cancel at any time through the customer portal;
          cancellation takes effect at the end of the current billing period.
        </p>
        <p className="text-sm leading-relaxed">
          Payments are processed by Paddle.com Market Limited, acting as Merchant of Record.
          All billing inquiries should be directed to Paddle.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-indigo-100 text-xl font-semibold">4. Acceptable Use</h2>
        <p className="text-sm leading-relaxed">
          You agree not to misuse the service, attempt to circumvent usage limits, or use the
          platform for any unlawful purpose. We reserve the right to suspend or terminate accounts
          that violate these Terms.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-indigo-100 text-xl font-semibold">5. Intellectual Property</h2>
        <p className="text-sm leading-relaxed">
          All content, features, and functionality of Interspeak are owned by the operator and
          protected by applicable intellectual property laws. You may not copy, reproduce, or
          distribute any part of the service without prior written consent.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-indigo-100 text-xl font-semibold">6. Disclaimer of Warranties</h2>
        <p className="text-sm leading-relaxed">
          The service is provided &quot;as is&quot; without warranties of any kind. We do not guarantee
          uninterrupted availability or that AI-generated feedback will be accurate or complete.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-indigo-100 text-xl font-semibold">7. Limitation of Liability</h2>
        <p className="text-sm leading-relaxed">
          To the maximum extent permitted by law, Interspeak shall not be liable for any indirect,
          incidental, or consequential damages arising from your use of the service.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-indigo-100 text-xl font-semibold">8. Changes to Terms</h2>
        <p className="text-sm leading-relaxed">
          We may update these Terms from time to time. We will notify users of material changes
          via email or a notice on the platform. Continued use of the service after changes
          constitutes acceptance of the updated Terms.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-indigo-100 text-xl font-semibold">9. Contact</h2>
        <p className="text-sm leading-relaxed">
          For any questions regarding these Terms, please contact us at{" "}
          <a href="mailto:matterconi@gmail.com" className="text-violet-400 underline">
            matterconi@gmail.com
          </a>
          .
        </p>
      </section>
    </main>
    </>
  );
}
