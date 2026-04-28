import React from "react";
import { Check, X } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing - FlipHTML5 Downloader",
  description:
    "Choose the perfect plan for your needs. Free users get 2 downloads per day. Premium plans start at $10/month with unlimited downloads and priority support.",
  keywords: [
    "pricing",
    "plans",
    "subscription",
    "fliphtml5 downloader pricing",
    "download limit",
    "premium plan",
  ],
};

export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for occasional use",
      features: [
        { text: "2 downloads per day", included: true },
        { text: "Standard quality PDF", included: true },
        { text: "Basic flipbook conversion", included: true },
        { text: "Community support", included: true },
        { text: "Unlimited downloads", included: false },
        { text: "Priority support", included: false },
        { text: "Advanced features", included: false },
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Monthly",
      price: "$10",
      period: "/month",
      description: "Best for regular users",
      features: [
        { text: "Unlimited downloads", included: true },
        { text: "High-quality PDF export", included: true },
        { text: "Advanced flipbook conversion", included: true },
        { text: "Priority email support", included: true },
        { text: "Batch download support", included: true },
        { text: "No watermarks", included: true },
        { text: "2-day money-back guarantee", included: true },
      ],
      cta: "Subscribe Now",
      popular: true,
    },
    {
      name: "Semi-Annual",
      price: "$50",
      period: "/6 months",
      description: "Save 17% compared to monthly",
      features: [
        { text: "Unlimited downloads", included: true },
        { text: "High-quality PDF export", included: true },
        { text: "Advanced flipbook conversion", included: true },
        { text: "Priority email support", included: true },
        { text: "Batch download support", included: true },
        { text: "No watermarks", included: true },
        { text: "2-day money-back guarantee", included: true },
      ],
      cta: "Subscribe Now",
      popular: false,
    },
    {
      name: "Annual",
      price: "$80",
      period: "/year",
      description: "Save 33% - Best value",
      features: [
        { text: "Unlimited downloads", included: true },
        { text: "High-quality PDF export", included: true },
        { text: "Advanced flipbook conversion", included: true },
        { text: "Priority email support", included: true },
        { text: "Batch download support", included: true },
        { text: "No watermarks", included: true },
        { text: "2-day money-back guarantee", included: true },
      ],
      cta: "Subscribe Now",
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Background gradient mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden gradient-mesh" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-text)] mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-text-secondary)] font-light leading-relaxed">
            Choose the plan that works best for you. All paid plans include a
            2-day unconditional money-back guarantee.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl sm:rounded-3xl p-6 sm:p-8 transition-all duration-300 hover:scale-105 ${
                plan.popular
                  ? "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-white shadow-xl"
                  : "bg-white/50 backdrop-blur-sm border border-[var(--color-border-light)]"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white text-[var(--color-primary)] px-4 py-1 rounded-full text-xs font-bold">
                  MOST POPULAR
                </div>
              )}

              <div className="mb-6">
                <h3
                  className={`text-xl font-bold mb-2 ${
                    plan.popular ? "text-white" : "text-[var(--color-text)]"
                  }`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`text-sm mb-4 ${
                    plan.popular
                      ? "text-white/80"
                      : "text-[var(--color-text-muted)]"
                  }`}
                >
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-4xl font-bold ${
                      plan.popular ? "text-white" : "text-[var(--color-text)]"
                    }`}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={`text-sm ${
                      plan.popular
                        ? "text-white/70"
                        : "text-[var(--color-text-muted)]"
                    }`}
                  >
                    {plan.period}
                  </span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    )}
                    <span
                      className={`text-sm ${
                        !feature.included
                          ? plan.popular
                            ? "text-white/50"
                            : "text-[var(--color-text-muted)]"
                          : plan.popular
                            ? "text-white/90"
                            : "text-[var(--color-text-secondary)]"
                      }`}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  plan.popular
                    ? "bg-white text-[var(--color-primary)] hover:bg-white/90"
                    : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Money-back guarantee */}
        <div className="mt-12 sm:mt-16 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-4 bg-green-50 border border-green-200 rounded-2xl">
            <svg
              className="w-6 h-6 text-green-600"
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
            <div className="text-left">
              <p className="font-semibold text-green-800">
                2-Day Money-Back Guarantee
              </p>
              <p className="text-sm text-green-700">
                Not satisfied? Get a full refund within 2 days, no questions
                asked.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 sm:mt-20 max-w-3xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-8 text-[var(--color-text)]">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-[var(--color-border-light)]">
              <h3 className="font-semibold text-[var(--color-text)] mb-2">
                What happens when I exceed my daily download limit?
              </h3>
              <p className="text-[var(--color-text-secondary)] text-sm">
                Free users can download up to 2 PDFs per day. When you
                reach this limit, you can upgrade to a paid plan for unlimited
                downloads or wait until the next day when your limit resets.
              </p>
            </div>

            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-[var(--color-border-light)]">
              <h3 className="font-semibold text-[var(--color-text)] mb-2">
                How does the 2-day money-back guarantee work?
              </h3>
              <p className="text-[var(--color-text-secondary)] text-sm">
                If you're not satisfied with your subscription for any reason,
                you can request a full refund within 2 days of your purchase. No
                questions asked, no hassle. Simply contact our support team.
              </p>
            </div>

            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-[var(--color-border-light)]">
              <h3 className="font-semibold text-[var(--color-text)] mb-2">
                Can I switch between plans?
              </h3>
              <p className="text-[var(--color-text-secondary)] text-sm">
                Yes, you can upgrade or downgrade your plan at any time. When
                upgrading, you'll be charged the difference. When downgrading,
                the new rate will apply at your next billing cycle.
              </p>
            </div>

            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-[var(--color-border-light)]">
              <h3 className="font-semibold text-[var(--color-text)] mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-[var(--color-text-secondary)] text-sm">
                We accept all major credit cards, debit cards, and other popular
                payment methods. All transactions are secure and encrypted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
