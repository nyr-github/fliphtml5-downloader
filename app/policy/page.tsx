import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - FlipHTML5 Downloader",
  description:
    "Learn how FlipHTML5 Downloader collects, uses, and protects your personal information. Your privacy is important to us.",
  keywords: [
    "privacy policy",
    "data protection",
    "personal information",
    "user privacy",
    "data collection",
  ],
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Background gradient mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden gradient-mesh" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-text)] mb-4">
            Privacy Policy
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm">
            Last updated: April 28, 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              1. Introduction
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
              FlipHTML5 Downloader ("we", "our", or "us") respects your privacy
              and is committed to protecting your personal data. This Privacy
              Policy explains how we collect, use, disclose, and safeguard your
              information when you use our website and services.
            </p>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Please read this Privacy Policy carefully. By accessing or using
              our Service, you acknowledge that you have read and understood
              this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              2. Information We Collect
            </h2>

            <h3 className="text-xl font-semibold text-[var(--color-text)] mb-3 mt-6">
              2.1 Information You Provide
            </h3>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] leading-relaxed ml-4 mb-4">
              <li>
                Account registration information (email address, username)
              </li>
              <li>
                Payment information (processed securely by our payment provider)
              </li>
              <li>Communication data when you contact our support team</li>
              <li>Reading history and downloaded flipbook records</li>
            </ul>

            <h3 className="text-xl font-semibold text-[var(--color-text)] mb-3 mt-6">
              2.2 Information Automatically Collected
            </h3>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] leading-relaxed ml-4 mb-4">
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Usage patterns and interaction with the Service</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] leading-relaxed ml-4 mb-4">
              <li>Providing, maintaining, and improving our Service</li>
              <li>Processing transactions and managing your subscription</li>
              <li>Sending service-related notifications and updates</li>
              <li>
                Responding to your inquiries and providing customer support
              </li>
              <li>Monitoring usage patterns and analyzing trends</li>
              <li>Preventing fraud and ensuring security</li>
              <li>Complying with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              4. Legal Basis for Processing
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              We process your personal data based on the following legal
              grounds:
            </p>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] leading-relaxed ml-4 mt-4 mb-4">
              <li>
                <strong>Contractual necessity:</strong> Processing required to
                provide our Service under our Terms and Conditions
              </li>
              <li>
                <strong>Legitimate interests:</strong> For service improvement,
                security, and fraud prevention
              </li>
              <li>
                <strong>Consent:</strong> Where you have given explicit consent
                for specific processing activities
              </li>
              <li>
                <strong>Legal compliance:</strong> To comply with applicable
                laws and regulations
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              5. Data Sharing and Disclosure
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
              We do not sell your personal information. We may share your data
              with:
            </p>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] leading-relaxed ml-4 mb-4">
              <li>
                <strong>Service providers:</strong> Third-party companies that
                assist us in operating our Service (payment processors, hosting
                providers, analytics services)
              </li>
              <li>
                <strong>Legal requirements:</strong> When required by law,
                regulation, or legal process
              </li>
              <li>
                <strong>Business transfers:</strong> In connection with a
                merger, acquisition, or sale of assets
              </li>
              <li>
                <strong>Protection of rights:</strong> To protect the rights,
                property, or safety of our users, our company, or others
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              6. Data Security
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
              We implement appropriate technical and organizational measures to
              protect your personal data against unauthorized access,
              alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] leading-relaxed ml-4 mb-4">
              <li>Encryption of data in transit (HTTPS/TLS)</li>
              <li>Secure storage of user credentials</li>
              <li>Regular security audits and assessments</li>
              <li>Access controls and authentication mechanisms</li>
            </ul>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              While we strive to protect your personal information, no method of
              transmission over the Internet or electronic storage is 100%
              secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              7. Data Retention
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              We retain your personal data only as long as necessary to fulfill
              the purposes outlined in this Privacy Policy, unless a longer
              retention period is required or permitted by law. When your data
              is no longer needed, we will securely delete or anonymize it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              8. Your Rights and Choices
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] leading-relaxed ml-4 mb-4">
              <li>
                <strong>Access:</strong> Request a copy of your personal data
              </li>
              <li>
                <strong>Correction:</strong> Request correction of inaccurate
                data
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your personal
                data
              </li>
              <li>
                <strong>Portability:</strong> Request transfer of your data to
                another service
              </li>
              <li>
                <strong>Objection:</strong> Object to certain processing
                activities
              </li>
              <li>
                <strong>Restriction:</strong> Request restriction of processing
              </li>
            </ul>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              To exercise these rights, please contact us using the information
              provided at the end of this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              9. Cookies and Tracking Technologies
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
              We use cookies and similar tracking technologies to enhance your
              experience, analyze usage patterns, and deliver personalized
              content. You can control cookie preferences through your browser
              settings.
            </p>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              For more information about how we use cookies, please refer to our
              Cookie Policy (if applicable).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              10. Children's Privacy
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Our Service is not intended for children under the age of 13. We
              do not knowingly collect personal information from children under
              13. If we become aware that we have inadvertently collected such
              data, we will take steps to delete it promptly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              11. International Data Transfers
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Your information may be transferred to, and processed in,
              countries other than your country of residence. These countries
              may have data protection laws that differ from your jurisdiction.
              We ensure appropriate safeguards are in place to protect your data
              in accordance with this Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              12. Changes to This Privacy Policy
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              We may update this Privacy Policy from time to time. We will
              notify you of any material changes by posting the new policy on
              this page and updating the "Last updated" date. We encourage you
              to review this policy periodically.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              13. Contact Us
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              If you have any questions, concerns, or requests regarding this
              Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="text-[var(--color-text-secondary)] leading-relaxed mt-4">
              Email: dev@aivaded.com
              <br />
              Website: https://fliphtml5downloader.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
