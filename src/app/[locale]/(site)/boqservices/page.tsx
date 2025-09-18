'use client'

import Hero from '@/components/Hero'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'

interface FAQ {
  q: string
  a: string
}

interface DeliverCard {
  title: string
  text: string
}

interface PackageCard {
  title: string
  price: string
  description: string
  features: string[]
}

export default function Page() {
  const t = useTranslations('BOQServices')
  const locale = useLocale()

  // Set document language for accessibility and SEO
  useEffect(() => {
    try {
      document.documentElement.lang = locale
    } catch {
      // Ignore in non-browser environments
    }
  }, [locale])

  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  // Translated data collections
  const heroBullets = (t.raw('hero.bullets') as string[]) || []
  const deliverCards = (t.raw('deliver.cards') as DeliverCard[]) || []
  const whyList = (t.raw('deliver.why.list') as string[]) || []
  const faqItems = (t.raw('faq.items') as FAQ[]) || []
  const packageItems = (t.raw('packages.items') as PackageCard[]) || []

  function toggleFaq(i: number) {
    setOpenIndex(openIndex === i ? null : i)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    // Mock sending delay
    await new Promise(r => setTimeout(r, 900))
    setSending(false)
    setSent(true)
    setForm({ name: '', email: '', phone: '', message: '' })
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <main className="bg-gray-50 text-gray-900">
      {/* Fake hero for extended behind appbar */}
      <Hero extendBackground>
        <div className="bg-gradient-to-tr from-zinc-900 via-indigo-900 to-emerald-700 h-[1000vh] fixed top-0 left-0 right-0 pointer-events-none" />
      </Hero>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-gradient-to-tr from-zinc-900 via-indigo-900 to-emerald-700 text-white">
          <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                  {t('hero.title')}
                </h1>
                <p className="mt-4 text-lg max-w-2xl opacity-90">
                  {t('hero.subtitle')}
                </p>

                <ul className="mt-8 grid sm:grid-cols-2 gap-3 text-sm">
                  {heroBullets.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-9 h-9 aspect-square bg-white/10 rounded-full font-sans">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-wrap gap-4">
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-3 bg-white text-zinc-900 font-semibold px-5 py-3 rounded-md shadow-lg hover:shadow-xl transition"
                  >
                    {t('hero.ctaQuote')}
                  </a>
                  <a
                    href="#work"
                    className="inline-flex items-center gap-3 border border-white/20 text-white px-5 py-3 rounded-md hover:bg-white/5 transition"
                  >
                    {t('hero.ctaWork')}
                  </a>
                </div>
              </div>

              <div className="relative">
                <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                  <Image
                    src="https://t4.ftcdn.net/jpg/08/35/64/35/360_F_835643573_x3bTs6n77e9hjZPfE2QCtTrU2bVq6EIr.jpg"
                    alt={t('hero.card.alt')}
                    className="w-full h-72 object-cover"
                  />
                  <div className="p-6 bg-gradient-to-t from-black/50 to-transparent text-white">
                    <h3 className="text-xl font-semibold">{t('hero.card.title')}</h3>
                    <p className="mt-2 text-sm opacity-90">{t('hero.card.subtitle')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="work" className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold">{t('deliver.heading')}</h2>
            <p className="mt-3 text-gray-600 max-w-2xl">
              {t('deliver.subheading')}
            </p>

            <div className="mt-8 grid sm:grid-cols-2 gap-6">
              {deliverCards.map((card, idx) => (
                <div key={idx} className="p-6 bg-white rounded-2xl shadow">
                  <h4 className="font-semibold">{card.title}</h4>
                  <p className="mt-2 text-sm text-gray-600">{card.text}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="p-6 bg-gradient-to-b from-white to-gray-100 rounded-2xl shadow">
            <h3 className="text-lg font-semibold">{t('deliver.why.heading')}</h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-700">
              {whyList.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>

            <div className="mt-6">
              <div className="text-xs uppercase tracking-wide text-gray-500">{t('deliver.why.turnaroundLabel')}</div>
              <div className="mt-1 text-2xl font-bold">{t('deliver.why.turnaroundValue')}</div>
            </div>
          </aside>
        </div>
      </section>

      {/* Gallery */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h3 className="text-2xl font-bold">{t('gallery.heading')}</h3>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <Image src="https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?q=80&w=1000&auto=format&fit=crop" alt={t('gallery.altInterior')} className="w-full h-48 object-cover" />
          </div>
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <Image src="https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?q=80&w=1000&auto=format&fit=crop" alt={t('gallery.altExterior')} className="w-full h-48 object-cover" />
          </div>
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <Image src="https://images.unsplash.com/photo-1505842465776-3d2d8a5b3b8a?q=80&w=1000&auto=format&fit=crop" alt={t('gallery.altSite')} className="w-full h-48 object-cover" />
          </div>
        </div>
      </section>

      {/* Pricing / Packages */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h3 className="text-2xl font-bold">{t('packages.heading')}</h3>
          <p className="mt-2 text-gray-600 max-w-2xl">{t('packages.subheading')}</p>

          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {packageItems.map((pkg, idx) => {
              const isFeatured = idx === 1
              return (
                <div
                  key={idx}
                  className={
                    isFeatured
                      ? 'p-6 rounded-2xl border-2 border-zinc-900 bg-zinc-50 shadow-lg'
                      : 'p-6 rounded-2xl border shadow-sm'
                  }
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{pkg.title}</h4>
                    <div className="text-2xl font-bold">{pkg.price}</div>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">{pkg.description}</p>
                  <ul className="mt-4 space-y-2 text-sm text-gray-700">
                    {pkg.features.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                  <a className="block mt-6 text-center bg-zinc-900 text-white px-4 py-2 rounded-md">{t('packages.requestQuote')}</a>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ + Contact */}
      <section className="max-w-7xl mx-auto px-6 py-16" id="contact">
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl font-bold">{t('faq.heading')}</h3>
            <p className="mt-2 text-gray-600">{t('faq.subheading')}</p>

            <div className="mt-6 space-y-3">
              {faqItems.map((f, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <button
                    onClick={() => toggleFaq(i)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between"
                    aria-expanded={openIndex === i}
                    aria-controls={`faq-panel-${i}`}
                  >
                    <div>
                      <div className="font-medium">{f.q}</div>
                      <div className="mt-1 text-sm text-gray-500">{openIndex === i ? '' : ''}</div>
                    </div>
                    <div className="text-xl text-gray-400" aria-hidden="true">{openIndex === i ? '−' : '+'}</div>
                  </button>
                  {openIndex === i && (
                    <div id={`faq-panel-${i}`} className="px-5 pb-4 text-sm text-gray-700 border-t">{f.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold">{t('contact.heading')}</h3>
            <p className="mt-2 text-gray-600">{t('contact.subheading')}</p>

            <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder={t('contact.form.name')}
                required
                className="w-full px-4 py-3 rounded-lg bg-white border"
              />
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder={t('contact.form.email')}
                required
                className="w-full px-4 py-3 rounded-lg bg-white border"
              />
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder={t('contact.form.phone')}
                className="w-full px-4 py-3 rounded-lg bg-white border"
              />
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder={t('contact.form.message')}
                rows={4}
                className="w-full px-4 py-3 rounded-lg bg-white border"
              />
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center justify-center bg-zinc-900 text-white px-5 py-3 rounded-md font-semibold hover:opacity-95 transition"
                >
                  {sending ? t('contact.form.submitting') : t('contact.form.submit')}
                </button>
                {sent && <div className="text-sm text-green-600">{t('contact.sent')}</div>}
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-gradient-to-r from-zinc-900 to-gray-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12 rounded-lg">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="text-xl font-bold">{t('footerCta.heading')}</h4>
              <p className="mt-1 text-sm opacity-90">{t('footerCta.subheading')}</p>
            </div>
            <div className="flex gap-3">
              <a href="#contact" className="bg-white text-zinc-900 px-5 py-3 rounded-md font-semibold">{t('footerCta.requestQuote')}</a>
              <a href="#" className="border border-white/30 px-5 py-3 rounded-md">{t('footerCta.scheduleCall')}</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}