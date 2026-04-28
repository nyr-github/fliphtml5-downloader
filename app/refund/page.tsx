import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy - FlipHTML5 Downloader",
  description:
    "Learn about our refund policy. We offer a 2-day unconditional money-back guarantee for all paid subscriptions.",
  keywords: [
    "refund policy",
    "money-back guarantee",
    "subscription refund",
    "cancellation policy",
  ],
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Background gradient mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden gradient-mesh" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-text)] mb-4">
            Refund Policy
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm">
            Last updated: April 28, 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              1. Our Commitment to You
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
              At FlipHTML5 Downloader, we stand behind the quality of our
              service. We want you to be completely satisfied with your
              subscription. If you're not happy for any reason, we offer a
              straightforward refund process.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              2. 2-Day Money-Back Guarantee
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
              All paid subscriptions (Monthly, Semi-Annual, and Annual plans)
              are covered by our{" "}
              <strong>2-day unconditional money-back guarantee</strong>. This
              means:
            </p>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] leading-relaxed ml-4 mb-4">
              <li>
                You can request a full refund within 2 days (48 hours) of your
                initial purchase
              </li>
              <li>No questions asked - we don't require a reason</li>
              <li>No hassle - simple and straightforward process</li>
              <li>Full refund of the purchase price</li>
            </ul>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              The 2-day period starts from the moment your payment is confirmed
              and your subscription becomes active.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              3. Eligibility for Refunds
            </h2>

            <h3 className="text-xl font-semibold text-[var(--color-text)] mb-3 mt-6">
              3.1 Eligible for Refund
            </h3>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] leading-relaxed ml-4 mb-4">
              <li>First-time subscription purchases within 2 days</li>
              <li>Subscription renewals within 2 days of the renewal charge</li>
              <li>Upgraded plans within 2 days of the upgrade</li>
            </ul>

            <h3 className="text-xl font-semibold text-[var(--color-text)] mb-3 mt-6">
              3.2 Not Eligible for Refund
            </h3>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] leading-relaxed ml-4 mb-4">
              <li>Requests made after the 2-day window has expired</li>
              <li>Free tier accounts (no payment made)</li>
              <li>Subscription renewals where more than 2 days have passed</li>
              <li>Accounts that have violated our Terms and Conditions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              4. How to Request a Refund
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
              Requesting a refund is simple. Follow these steps:
            </p>
            <ol className="list-decimal list-inside text-[var(--color-text-secondary)] leading-relaxed ml-4 mb-4">
              <li>
                Contact our support team at <strong>dev@aivaded.com</strong>
              </li>
              <li>
                Include your account email address and transaction details
              </li>
              <li>
                Our team will process your refund within 3-5 business days
              </li>
              <li>
                You will receive a confirmation email once the refund is
                processed
              </li>
            </ol>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Alternatively, you can submit a refund request through your
              account dashboard if you are logged in.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              5. Refund Processing Time
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
              Once your refund request is approved:
            </p>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] leading-relaxed ml-4 mb-4">
              <li>
                <strong>Credit/Debit Cards:</strong> 5-10 business days (depends
                on your bank)
              </li>
              <li>
                <strong>PayPal:</strong> 3-5 business days
              </li>
              <li>
                <strong>Other Payment Methods:</strong> 5-7 business days
              </li>
            </ul>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              The exact timing may vary depending on your payment provider and
              financial institution.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              6. Cancellation vs. Refund
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
              It's important to understand the difference between cancellation
              and refund:
            </p>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] leading-relaxed ml-4 mb-4">
              <li>
                <strong>Cancellation:</strong> Stops future billing but does not
                refund past charges. Your subscription remains active until the
                end of the current billing period.
              </li>
              <li>
                <strong>Refund:</strong> Returns your payment and immediately
                terminates your subscription access.
              </li>
            </ul>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              You can cancel your subscription at any time to prevent future
              charges, but refunds are only available within the 2-day window.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              7. Partial Refunds
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              We do not offer partial refunds for unused portions of a
              subscription period. Refunds are only available as full refunds
              within the 2-day guarantee window. After this period, no refunds
              will be issued for any reason.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              8. Subscription Downgrades and Upgrades
            </h2>

            <h3 className="text-xl font-semibold text-[var(--color-text)] mb-3 mt-6">
              8.1 Upgrades
            </h3>
            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
              If you upgrade your plan, you will be charged the difference
              between your current plan and the new plan. The 2-day refund
              window applies to the upgrade charge.
            </p>

            <h3 className="text-xl font-semibold text-[var(--color-text)] mb-3 mt-6">
              8.2 Downgrades
            </h3>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              If you downgrade your plan, the new rate will take effect at your
              next billing cycle. No refunds are issued for downgrades. The
              difference is not refunded but applied as credit toward future
              billing.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              9. Exceptions
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
              While we strive to honor all legitimate refund requests, we
              reserve the right to deny refunds in cases of:
            </p>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] leading-relaxed ml-4 mb-4">
              <li>Fraudulent or abusive behavior</li>
              <li>Violation of our Terms and Conditions</li>
              <li>Excessive refund requests (refund abuse)</li>
              <li>Attempts to exploit the refund policy</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              10. Changes to This Refund Policy
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              We may update this Refund Policy from time to time. Any changes
              will be posted on this page with an updated "Last updated" date.
              We encourage you to review this policy periodically to stay
              informed about our refund practices.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              11. Contact Us
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
              If you have any questions about this Refund Policy or need
              assistance with a refund request, please contact us:
            </p>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Email: dev@aivaded.com
              <br />
              Support: dev@aivaded.com
              <br />
              Website: https://fliphtml5downloader.com
            </p>
          </section>

          {/* Money-back guarantee highlight */}
          <div className="mt-12 p-6 bg-green-50 border border-green-200 rounded-2xl">
            <div className="flex items-start gap-4">
              <svg
                className="w-8 h-8 text-green-600 flex-shrink-0 mt-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <div>
                <h3 className="font-bold text-green-800 text-lg mb-2">
                  Our Promise to You
                </h3>
                <p className="text-green-700 leading-relaxed">
                  We believe in our service and want you to feel confident in
                  your purchase. Our 2-day unconditional money-back guarantee
                  ensures you can try our premium features risk-free. If you're
                  not satisfied, simply contact us for a full refund - no
                  questions asked.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
