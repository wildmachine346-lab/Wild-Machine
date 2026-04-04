import { useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Sparkles, Users, Shield, Send, Mail, MapPin } from 'lucide-react';
import api from '../lib/api';

const aboutContent = {
  en: {
    hero: { title: "About Wild Machine", subtitle: "A premium classified ads platform connecting escorts and clients with elegance and discretion." },
    what: { title: "What is Wild Machine?", text: "Wild Machine is a modern classified ads platform designed for the escort industry. We provide a safe, elegant, and professional space where verified escorts can showcase their services and clients can browse with confidence. Our platform prioritizes privacy, quality, and user experience." },
    how: { title: "How It Works", steps: [
      { label: "Create an Account", desc: "Sign up as an escort or a client. Escorts verify their email and complete their profile." },
      { label: "Publish Listings", desc: "Escorts create detailed listings with photos, pricing, availability, and contact information." },
      { label: "Browse & Connect", desc: "Clients browse listings, use filters to find their match, and reveal contact details to get in touch." },
      { label: "Go Premium", desc: "Escorts can upgrade to Featured or Top Featured for maximum visibility and priority placement." }
    ]},
    contact: { title: "Contact Us", email: "support@wildmachine.com", inquiry: "info@wildmachine.com", address: "Montréal, QC, Canada" }
  },
  fr: {
    hero: { title: "\u00c0 propos de Wild Machine", subtitle: "Une plateforme d'annonces class\u00e9es premium connectant escortes et clients avec \u00e9l\u00e9gance et discr\u00e9tion." },
    what: { title: "Qu'est-ce que Wild Machine ?", text: "Wild Machine est une plateforme d'annonces class\u00e9es moderne con\u00e7ue pour l'industrie des escortes. Nous offrons un espace s\u00fbr, \u00e9l\u00e9gant et professionnel o\u00f9 les escortes v\u00e9rifi\u00e9es peuvent pr\u00e9senter leurs services et les clients naviguer en toute confiance." },
    how: { title: "Comment \u00e7a marche", steps: [
      { label: "Cr\u00e9er un compte", desc: "Inscrivez-vous en tant qu'escorte ou client. Les escortes v\u00e9rifient leur email et compl\u00e8tent leur profil." },
      { label: "Publier des annonces", desc: "Les escortes cr\u00e9ent des annonces d\u00e9taill\u00e9es avec photos, tarifs, disponibilit\u00e9 et coordonn\u00e9es." },
      { label: "Parcourir et contacter", desc: "Les clients parcourent les annonces, utilisent les filtres et r\u00e9v\u00e8lent les coordonn\u00e9es pour entrer en contact." },
      { label: "Passer en Premium", desc: "Les escortes peuvent passer en Vedette ou Top Vedette pour une visibilit\u00e9 maximale." }
    ]},
    contact: { title: "Nous contacter", email: "support@wildmachine.com", inquiry: "info@wildmachine.com", address: "Montr\u00e9al, QC, Canada" }
  },
  zh: {
    hero: { title: "\u5173\u4e8e Wild Machine", subtitle: "\u4e00\u4e2a\u4f18\u96c5\u3001\u79c1\u5bc6\u5730\u8fde\u63a5\u4f34\u6e38\u548c\u5ba2\u6237\u7684\u9ad8\u7aef\u5206\u7c7b\u5e7f\u544a\u5e73\u53f0\u3002" },
    what: { title: "\u4ec0\u4e48\u662f Wild Machine\uff1f", text: "Wild Machine \u662f\u4e00\u4e2a\u4e13\u4e3a\u4f34\u6e38\u884c\u4e1a\u8bbe\u8ba1\u7684\u73b0\u4ee3\u5206\u7c7b\u5e7f\u544a\u5e73\u53f0\u3002\u6211\u4eec\u63d0\u4f9b\u4e00\u4e2a\u5b89\u5168\u3001\u4f18\u96c5\u3001\u4e13\u4e1a\u7684\u7a7a\u95f4\u3002" },
    how: { title: "\u5982\u4f55\u8fd0\u4f5c", steps: [
      { label: "\u521b\u5efa\u8d26\u6237", desc: "\u4ee5\u4f34\u6e38\u6216\u5ba2\u6237\u8eab\u4efd\u6ce8\u518c\u3002\u4f34\u6e38\u9700\u9a8c\u8bc1\u90ae\u7bb1\u5e76\u5b8c\u5584\u4e2a\u4eba\u8d44\u6599\u3002" },
      { label: "\u53d1\u5e03\u5217\u8868", desc: "\u4f34\u6e38\u521b\u5efa\u5305\u542b\u7167\u7247\u3001\u4ef7\u683c\u3001\u53ef\u7528\u6027\u548c\u8054\u7cfb\u65b9\u5f0f\u7684\u8be6\u7ec6\u5217\u8868\u3002" },
      { label: "\u6d4f\u89c8\u4e0e\u8054\u7cfb", desc: "\u5ba2\u6237\u6d4f\u89c8\u5217\u8868\uff0c\u4f7f\u7528\u7b5b\u9009\u5668\u627e\u5230\u5339\u914d\uff0c\u663e\u793a\u8054\u7cfb\u65b9\u5f0f\u4ee5\u53d6\u5f97\u8054\u7cfb\u3002" },
      { label: "\u5347\u7ea7\u9ad8\u7ea7", desc: "\u4f34\u6e38\u53ef\u4ee5\u5347\u7ea7\u4e3a\u63a8\u8350\u6216\u9876\u7ea7\u63a8\u8350\u4ee5\u83b7\u5f97\u6700\u5927\u66dd\u5149\u7387\u3002" }
    ]},
    contact: { title: "\u8054\u7cfb\u6211\u4eec", email: "support@wildmachine.com", inquiry: "info@wildmachine.com", address: "\u52a0\u62ff\u5927\u9b41\u5317\u514b\u8499\u7279\u5229\u5c14" }
  }
};

export default function AboutPage() {
  const { t, language } = useI18n();
  const c = aboutContent[language] || aboutContent.en;
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSending(true);
    try {
      await api.post('/api/contact', form);
      setSent(true);
      setForm({ name: '', email: '', message: '' });
    } catch {
      alert('Failed to send message');
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-obsidian" data-testid="about-page">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl text-white font-heading mb-3">{c.hero.title}</h1>
          <p className="text-[#888] max-w-2xl mx-auto text-base">{c.hero.subtitle}</p>
        </div>

        {/* What is Wild Machine */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="text-gold" size={24} />
            <h2 className="text-2xl text-white font-heading">{c.what.title}</h2>
          </div>
          <p className="text-[#a3a3a3] leading-relaxed text-sm border-l-2 border-gold/30 pl-4">{c.what.text}</p>
        </section>

        {/* How it works */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Users className="text-gold" size={24} />
            <h2 className="text-2xl text-white font-heading">{c.how.title}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {c.how.steps.map((step, i) => (
              <div key={i} className="bg-[#111] border border-[#222] rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center text-sm font-bold">{i + 1}</span>
                  <h3 className="text-white font-semibold">{step.label}</h3>
                </div>
                <p className="text-[#888] text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="text-gold" size={24} />
            <h2 className="text-2xl text-white font-heading">{c.contact.title}</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {/* Contact Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-[#a3a3a3]">
                <Mail size={18} className="text-gold" />
                <div>
                  <p className="text-sm text-[#666]">Support</p>
                  <p className="text-white">{c.contact.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[#a3a3a3]">
                <Send size={18} className="text-gold" />
                <div>
                  <p className="text-sm text-[#666]">General Inquiries</p>
                  <p className="text-white">{c.contact.inquiry}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[#a3a3a3]">
                <MapPin size={18} className="text-gold" />
                <div>
                  <p className="text-sm text-[#666]">Location</p>
                  <p className="text-white">{c.contact.address}</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="contact-form">
              {sent && <p className="text-emerald-400 text-sm" data-testid="contact-success">{t('message_sent')}</p>}
              <input
                type="text" placeholder={t('your_name')} value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-3 text-white text-sm focus:border-gold/50 focus:outline-none"
                data-testid="contact-name-input"
              />
              <input
                type="email" placeholder={t('your_email')} value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-3 text-white text-sm focus:border-gold/50 focus:outline-none"
                data-testid="contact-email-input"
              />
              <textarea
                placeholder={t('your_message')} value={form.message} rows={4}
                onChange={e => setForm({ ...form, message: e.target.value })}
                className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-3 text-white text-sm focus:border-gold/50 focus:outline-none resize-none"
                data-testid="contact-message-input"
              />
              <button type="submit" disabled={sending} className="w-full bg-gold text-black py-3 rounded-full font-semibold hover:bg-gold/90 transition disabled:opacity-50" data-testid="contact-submit-btn">
                {sending ? '...' : t('send_message')}
              </button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
