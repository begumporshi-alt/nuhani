import { useEffect, useState } from 'react'
import { Crown, Heart, Shield, Leaf, Phone, Mail, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fetchPublicSettings, type PublicSettings } from '../lib/supabase'
import Seo from '../components/Seo'

export default function About() {
  const [settings, setSettings] = useState<PublicSettings | null>(null)

  useEffect(() => {
    fetchPublicSettings().then(setSettings)
  }, [])

  const phone = settings?.phone ?? '+880 1700 000000'
  const email = settings?.email ?? 'hello@nuhani.com'
  const address = settings?.address ?? 'Dhaka, Bangladesh'

  return (
    <div className="animate-fade-in">
      <Seo
        title="Our Story"
        description="Learn about Nuhani — a Bangladesh clothing brand built on premium fabrics, careful construction and honest pricing."
        path="/about"
      />
      {/* Hero */}
      <section className="relative h-[40vh] min-h-[300px] overflow-hidden">
        <img
          src="https://i.ibb.co.com/0VmkNg30/foraboutus.png"
          alt="Our Story"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-900/70 to-ink-800/30" />
        <div className="relative h-full flex items-center section-padding">
          <div>
            <p className="eyebrow-light mb-3">Our Story</p>
            <h1 className="text-4xl md:text-5xl font-serif text-ivory-50">Considered clothing,<br className="hidden md:block" /> made in Bangladesh</h1>
          </div>
        </div>
      </section>

      <section className="section-padding py-16 max-w-3xl mx-auto">
        <div className="prose pmink-lg max-w-none">
          <p className="text-xl text-ink-600 leading-relaxed mb-6 font-serif italic">
            "We make fewer, better pieces — clothing you reach for first, every single day."
          </p>
          <p className="text-ink-600 leading-relaxed mb-6">
            Nuhani began with a simple frustration: beautiful clothing in Bangladesh was either
            imported and expensive, or affordable and poorly made. We believed there was a third
            way — premium fabrics and careful construction, designed here and priced honestly.
          </p>
          <p className="text-ink-600 leading-relaxed mb-6">
            Every piece starts with the fabric. We source materials for how they feel against the
            skin and how they age through seasons of wear, then cut silhouettes that work as
            comfortably at home as they do outside. No loud logos, no passing trends — just
            clothing with quiet confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {[
            { icon: Leaf, title: 'Fabric First', desc: 'Premium, skin-friendly fabrics chosen for feel and longevity.' },
            { icon: Heart, title: 'Made Locally', desc: 'Cut and stitched by skilled hands across Bangladesh.' },
            { icon: Crown, title: 'Honest Quality', desc: 'Every piece is checked against a single standard: would we wear it ourselves?' },
          ].map((value) => (
            <div key={value.title} className="text-center">
              <div className="w-14 h-14 rounded-full bg-ivory-100 border border-stone-200 flex items-center justify-center mx-auto mb-4">
                <value.icon className="text-ink-700" size={22} />
              </div>
              <h3 className="font-serif text-lg text-ink-900 mb-2">{value.title}</h3>
              <p className="text-sm text-stone-500 leading-relaxed">{value.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-16 bg-mink-50 rounded-2xl p-10">
          <Shield className="text-champagne-500 mx-auto mb-4" size={32} />
          <h2 className="text-2xl font-serif text-ink-800 mb-3">Our Promise</h2>
          <p className="text-ink-600 max-w-xl mx-auto mb-6">
            If you're not completely happy with your purchase, we offer easy 7-day returns and exchanges.
            Your satisfaction is our priority.
          </p>
          <Link to="/shop" className="btn-primary">Shop Our Collection</Link>
        </div>

        {/* Contact Info from Site Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          {[
            { icon: Phone, title: 'Call Us', value: phone, sub: 'Sun–Fri, 10AM–8PM' },
            { icon: Mail, title: 'Email Us', value: email, sub: 'We reply within 24 hours' },
            { icon: MapPin, title: 'Visit Us', value: address, sub: 'Bangladesh' },
          ].map((item) => (
            <div key={item.title} className="card p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-mink-100 flex items-center justify-center mx-auto mb-3">
                <item.icon size={20} className="text-ink-700" />
              </div>
              <h3 className="font-medium text-ink-800 mb-1">{item.title}</h3>
              <p className="text-sm text-ink-600">{item.value}</p>
              <p className="text-xs text-ink-400 mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
