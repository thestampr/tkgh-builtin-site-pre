import React from "react";

export default async function PolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-white to-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-white/80 to-white/60 shadow-2xl ring-1 ring-black/5">
          {/* Decorative gold stripe */}
          <div className="absolute inset-y-0 left-0 w-2 bg-primary" />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            {/* Main content */}
            <article className="col-span-1 lg:col-span-3 p-8 sm:p-12">
              <header className="mb-8">
                <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-gray-900">
                  Privacy & Policy
                </h1>
                <p className="mt-3 max-w-2xl text-lg text-gray-600">
                  This policy outlines how we collect, use, disclose, and protect information when
                  you interact with our services. We take privacy seriously and design our systems
                  to respect your rights.
                </p>

                <div className="mt-6 flex items-center gap-4">
                  <span className="rounded-md bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700 ring-1 ring-amber-100">
                    Effective: 2025-09-01
                  </span>
                  <span className="text-sm text-gray-500">Last updated: 2025-09-01</span>
                </div>
              </header>

              {/* Policy Sections */}
              <section id="introduction" className="mb-10">
                <h2 className="mb-3 text-2xl font-semibold text-gray-900">1. Introduction</h2>
                <p className="text-gray-600 leading-relaxed">
                  We strive to deliver a refined experience while protecting your information. This
                  Policy applies to all visitors and users of our websites and services. By using
                  our services, you consent to the terms described here.
                </p>
              </section>

              <section id="information-collection" className="mb-10">
                <h2 className="mb-3 text-2xl font-semibold text-gray-900">2. Information We Collect</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We collect information to provide better services, improve features, and ensure a
                  secure environment. The categories include:
                </p>
                <ul className="list-inside list-disc space-y-2 text-gray-600">
                  <li>
                    <strong>Account & Profile:</strong> name, email, contact details when you sign up or contact us.
                  </li>
                  <li>
                    <strong>Usage Data:</strong> pages viewed, interactions, timestamps, and device metadata.
                  </li>
                  <li>
                    <strong>Transactional Data:</strong> information necessary to process purchases or requests.
                  </li>
                  <li>
                    <strong>Communications:</strong> messages you send us for support or feedback.
                  </li>
                </ul>
              </section>

              <section id="how-we-use" className="mb-10">
                <h2 className="mb-3 text-2xl font-semibold text-gray-900">3. How We Use Information</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Your data enables us to operate the service, personalize experiences, and keep
                  things safe:
                </p>
                <dl className="space-y-4 text-gray-600">
                  <div>
                    <dt className="font-medium text-gray-800">Service Delivery</dt>
                    <dd>To provide and maintain the functionality of our services.</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-800">Improvement</dt>
                    <dd>To analyze usage patterns and improve features and performance.</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-800">Security</dt>
                    <dd>To detect, prevent, and respond to fraud or abuse.</dd>
                  </div>
                </dl>
              </section>

              <section id="sharing" className="mb-10">
                <h2 className="mb-3 text-2xl font-semibold text-gray-900">4. Sharing & Disclosure</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We do not sell personal data. We may share information in limited circumstances:
                </p>
                <ul className="list-inside list-disc space-y-2 text-gray-600">
                  <li>With service providers who process data on our behalf under strict contracts.</li>
                  <li>When required by law or to respond to legal requests.</li>
                  <li>In connection with business transfers like mergers or asset sales.</li>
                </ul>
              </section>

              <section id="cookies" className="mb-10">
                <h2 className="mb-3 text-2xl font-semibold text-gray-900">5. Cookies & Tracking</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We use cookies and similar technologies to remember preferences, evaluate and
                  optimize our services, and deliver relevant content. You can manage cookie
                  preferences through your browser settings.
                </p>
              </section>

              <section id="security" className="mb-10">
                <h2 className="mb-3 text-2xl font-semibold text-gray-900">6. Security</h2>
                <p className="text-gray-600 leading-relaxed">
                  We deploy administrative, technical, and physical safeguards appropriate to the
                  sensitivity of the data. While we aim to protect your information, no method of
                  transmission or storage is completely secure.
                </p>
              </section>

              <section id="children" className="mb-10">
                <h2 className="mb-3 text-2xl font-semibold text-gray-900">7. Children</h2>
                <p className="text-gray-600 leading-relaxed">
                  Our services are not intended for children under 16. We do not knowingly collect
                  personal information from children. If we become aware of such data, we will take
                  steps to delete it.
                </p>
              </section>

              <section id="changes" className="mb-10">
                <h2 className="mb-3 text-2xl font-semibold text-gray-900">8. Changes to This Policy</h2>
                <p className="text-gray-600 leading-relaxed">
                  We may update this Policy periodically. Material changes will be communicated via
                  notices on the site or direct communication where appropriate.
                </p>
              </section>

              <section id="contact" className="mb-10">
                <h2 className="mb-3 text-2xl font-semibold text-gray-900">9. Contact Us</h2>
                <p className="text-gray-600 leading-relaxed">
                  If you have questions, requests, or wish to exercise your data rights, contact our
                  privacy team at
                  <span className="ml-1 font-medium text-gray-800">privacy@example.com</span>.
                </p>
              </section>
            </article>

            {/* Table of Contents / Aside */}
            <aside className="col-span-1 hidden lg:block p-8">
              <nav className="sticky top-8 rounded-xl border border-gray-100 bg-white/80 p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                  <svg className="h-8 w-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m4-4H8" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">On this page</p>
                    <p className="text-xs text-gray-500">Quick links to policy sections</p>
                  </div>
                </div>

                <ul className="space-y-3 text-sm">
                  <li>
                    <a href="#introduction" className="block rounded-md py-2 px-3 text-gray-700 hover:bg-amber-50">
                      1. Introduction
                    </a>
                  </li>
                  <li>
                    <a href="#information-collection" className="block rounded-md py-2 px-3 text-gray-700 hover:bg-amber-50">
                      2. Information We Collect
                    </a>
                  </li>
                  <li>
                    <a href="#how-we-use" className="block rounded-md py-2 px-3 text-gray-700 hover:bg-amber-50">
                      3. How We Use Information
                    </a>
                  </li>
                  <li>
                    <a href="#sharing" className="block rounded-md py-2 px-3 text-gray-700 hover:bg-amber-50">
                      4. Sharing & Disclosure
                    </a>
                  </li>
                  <li>
                    <a href="#cookies" className="block rounded-md py-2 px-3 text-gray-700 hover:bg-amber-50">
                      5. Cookies & Tracking
                    </a>
                  </li>
                  <li>
                    <a href="#security" className="block rounded-md py-2 px-3 text-gray-700 hover:bg-amber-50">
                      6. Security
                    </a>
                  </li>
                  <li>
                    <a href="#children" className="block rounded-md py-2 px-3 text-gray-700 hover:bg-amber-50">
                      7. Children
                    </a>
                  </li>
                  <li>
                    <a href="#changes" className="block rounded-md py-2 px-3 text-gray-700 hover:bg-amber-50">
                      8. Changes
                    </a>
                  </li>
                  <li>
                    <a href="#contact" className="block rounded-md py-2 px-3 text-gray-700 hover:bg-amber-50">
                      9. Contact
                    </a>
                  </li>
                </ul>

                <div className="mt-6 border-t border-dashed border-gray-100 pt-4 text-xs text-gray-500">
                  <p>Designed for clarity. Minimal, luxurious styling with responsive layout.</p>
                </div>
              </nav>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}