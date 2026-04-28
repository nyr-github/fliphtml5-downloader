import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions - FlipHTML5 Downloader",
  description:
    "Read our terms and conditions to understand the rules and guidelines for using FlipHTML5 Downloader services.",
  keywords: [
    "terms and conditions",
    "terms of service",
    "user agreement",
    "legal terms",
  ],
};

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Background gradient mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden gradient-mesh" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-text)] mb-4">
            Terms and Conditions
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm">
            Last updated: April 28, 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
              By accessing or using FlipHTML5 Downloader ("Service", "we", "us",
              or "our"), you agree to be bound by these Terms and Conditions
              ("Terms"). If you disagree with any part of the terms, you may not
              access the Service.
            </p>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              These Terms apply to all visitors, users, and others who access or
              use the Service, including free users and paid subscribers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              2. Description of Service
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
              FlipHTML5 Downloader is a web-based tool that allows users to
              convert and download FlipHTML5 flipbooks as PDF files. The Service
              provides:
            </p>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] leading-relaxed ml-4 mb-4">
              <li>Flipbook to PDF conversion</li>
              <li>High-quality PDF export (for paid users)</li>
              <li>Batch download capabilities (for paid users)</li>
              <li>Online flipbook reading</li>
              <li>Reading history tracking</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              3. User Accounts and Registration
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
              To access certain features of the Service, you may be required to
              create an account. You are responsible for:
            </p>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] leading-relaxed ml-4 mb-4">
              <li>
                Maintaining the confidentiality of your account credentials
              </li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
              <li>Providing accurate and complete registration information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              4. Download Limits and Usage
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
              The Service imposes the following download limits:
            </p>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] leading-relaxed ml-4 mb-4">
              <li>
                <strong>Free Users:</strong> Maximum of 2 downloads per day
              </li>
              <li>
                <strong>Paid Subscribers:</strong> Unlimited downloads during
                the active subscription period
              </li>
            </ul>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Daily limits reset at midnight UTC. We reserve the right to modify
              these limits at any time with prior notice to users.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              5. Subscription and Payment
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
              We offer the following subscription plans:
            </p>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] leading-relaxed ml-4 mb-4">
              <li>Monthly Plan: $10 USD per month</li>
              <li>Semi-Annual Plan: $50 USD per 6 months</li>
              <li>Annual Plan: $80 USD per year</li>
            </ul>
            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
              All payments are processed securely through our payment provider.
              Subscriptions automatically renew unless cancelled before the
              renewal date.
            </p>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Prices are subject to change with 30 days advance notice to
              existing subscribers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              6. Refund Policy
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              We offer a 2-day unconditional money-back guarantee for all paid
              subscriptions. If you are not satisfied with our Service, you may
              request a full refund within 2 days of your purchase. Please refer
              to our dedicated Refund Policy page for more details.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              7. Intellectual Property
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
              The Service and its original content, features, and functionality
              are owned by FlipHTML5 Downloader and are protected by
              international copyright, trademark, patent, trade secret, and
              other intellectual property laws.
            </p>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Users are responsible for ensuring they have the right to download
              and use the flipbooks they convert through our Service. We do not
              claim ownership of any content converted using our tools.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              8. Prohibited Uses
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
              You agree not to use the Service:
            </p>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] leading-relaxed ml-4 mb-4">
              <li>
                In any way that violates applicable national or international
                laws
              </li>
              <li>
                To download or distribute copyrighted material without
                authorization
              </li>
              <li>To transmit any deceptive, false, or misleading content</li>
              <li>
                To impersonate any person or entity, or misrepresent your
                affiliation
              </li>
              <li>
                To interfere with or disrupt the Service or servers connected to
                the Service
              </li>
              <li>
                To attempt to gain unauthorized access to any portion of the
                Service
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              9. Disclaimer of Warranties
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              The Service is provided on an "AS IS" and "AS AVAILABLE" basis
              without warranties of any kind, either express or implied,
              including but not limited to, implied warranties of
              merchantability, fitness for a particular purpose, or
              non-infringement. We do not warrant that the Service will be
              uninterrupted, secure, or error-free.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              10. Limitation of Liability
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              In no event shall FlipHTML5 Downloader, its directors, employees,
              partners, agents, suppliers, or affiliates be liable for any
              indirect, incidental, special, consequential, or punitive damages,
              including without limitation, loss of profits, data, use,
              goodwill, or other intangible losses, resulting from your access
              to or use of or inability to access or use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              11. Changes to Terms
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              We reserve the right to modify or replace these Terms at any time.
              If a revision is material, we will provide at least 30 days'
              notice prior to any new terms taking effect. What constitutes a
              material change will be determined at our sole discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
              12. Contact Information
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="text-[var(--color-text-secondary)] leading-relaxed mt-2">
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
