import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { supabase, type Product, type Category, type Banner, type PublicSettings } from '../lib/supabase'
import ProductCard from '../components/ProductCard'
import Seo from '../components/Seo'
import { useToast } from '../contexts/ToastContext'
import { formatBDT } from '../lib/constants'

const homeJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Nuhani',
  url: 'https://nuhani.com',
  logo: 'https://nuhani.com/logo.svg',
  description: 'Considered clothing from Bangladesh. Premium fabrics, honest pricing, nationwide delivery.',
  areaServed: 'BD',
}

const testimonials = [
  {
    quote: 'The fabric quality is genuinely premium — everything I ordered fits beautifully and washes well.',
    name: 'Nusrat J.',
    city: 'Dhaka',
  },
  {
    quote: 'Ordered on Sunday, delivered by Tuesday in Chattogram. The packaging felt like a gift.',
    name: 'Farhana R.',
    city: 'Chattogram',
  },
  {
    quote: 'Finally a brand that gets both the fit and the finish right. My everyday pieces are all from here now.',
    name: 'Tahmina K.',
    city: 'Sylhet',
  },
]

export default function Home() {
  const [featured, setFeatured] = useState<Product[]>([])
  const [newArrivals, setNewArrivals] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [settings, setSettings] = useState<PublicSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()
  const [subscribing, setSubscribing] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [bannerIndex, setBannerIndex] = useState(0)

  useEffect(() => {
    async function load() {
      const [featuredRes, newArrivalsRes, categoriesRes, bannersRes, settingsRes] = await Promise.all([
        supabase
          .from('products')
          .select('*, category:categories(*), variants:product_variants(*)')
          .eq('is_active', true)
          .eq('is_featured', true)
          .limit(8),
        supabase
          .from('products')
          .select('*, category:categories(*), variants:product_variants(*)')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(8),
        supabase
          .from('categories')
          .select('*')
          .is('parent_id', null)
          .eq('is_active', true)
          .order('sort_order'),
        supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .order('sort_order')
          .limit(3),
        supabase.rpc('get_public_settings'),
      ])

      setFeatured((featuredRes.data as Product[]) ?? [])
      setNewArrivals((newArrivalsRes.data as Product[]) ?? [])
      setCategories((categoriesRes.data as Category[]) ?? [])
      setBanners((bannersRes.data as Banner[]) ?? [])
      setSettings(settingsRes.data as PublicSettings | null)
      setLoading(false)
    }
    load()
  }, [])

  // Rotate the lifestyle band through active banners
  useEffect(() => {
    if (banners.length <= 1) return
    const id = setInterval(() => setBannerIndex((i) => (i + 1) % banners.length), 6000)
    return () => clearInterval(id)
  }, [banners.length])

  // The hero card features a real product — first featured, else newest
  const heroTagProduct = featured[0] ?? newArrivals[0] ?? null
  const heroTagPrice = heroTagProduct?.variants?.length
    ? Math.min(...heroTagProduct.variants.map((v) => v.price))
    : 0

  // Hero + story imagery: admin campaign images first, else real product photos
  const heroImage = settings?.hero_image_url ?? heroTagProduct?.images?.[0] ?? null
  const heroMobileImage = settings?.hero_mobile_image_url ?? settings?.hero_image_url ?? heroImage
  const storyImage =
    (featured.find((p) => p.slug !== heroTagProduct?.slug) ??
      newArrivals.find((p) => p.slug !== heroTagProduct?.slug))?.images?.[0] ?? null
  const banner = banners[bannerIndex]

  const marqueeItems =
    categories.length > 0
      ? categories.map((c) => c.name)
      : ['Premium fabrics', 'Free delivery over ৳3,000', '7-day easy returns', 'Made in Bangladesh']

  // Drifting fabric folds for dark sections
  const FabricFolds = () => (
    <div className="fabric-folds" aria-hidden="true">
      <svg viewBox="0 0 1200 700" className="w-full h-full" fill="none" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="foldGrad1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFB25E" />
            <stop offset="1" stopColor="#FF5A1F" />
          </linearGradient>
          <linearGradient id="foldGrad2" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FF8A50" />
            <stop offset="1" stopColor="#E8430D" />
          </linearGradient>
          <filter id="foldBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="20" />
          </filter>
        </defs>
        <path
          className="fold-1"
          fill="url(#foldGrad1)"
          filter="url(#foldBlur)"
          d="M-60,420 C240,300 420,360 640,300 C860,240 1060,300 1260,220 L1260,760 L-60,760 Z"
        />
        <path
          className="fold-2"
          fill="url(#foldGrad2)"
          filter="url(#foldBlur)"
          opacity="0.6"
          d="M-60,560 C280,470 520,540 760,470 C980,410 1120,470 1260,400 L1260,760 L-60,760 Z"
        />
      </svg>
    </div>
  )

  return (
    <div className="animate-fade-in">
      <Seo
        title=""
        description="Nuhani — considered clothing from Bangladesh. Premium fabrics, honest pricing, nationwide delivery."
        path="/"
        jsonLd={homeJsonLd}
      />

      {/* ============ HERO ============ */}
      <header className="relative min-h-[100svh] flex flex-col justify-center overflow-clip pt-[100px] pb-16">
        {/* Subtle fabric video texture (self-hosted, Pixabay Content License) */}
        <div className="hero-fabric-video" aria-hidden="true">
          <video src="/videos/fabric-loop.mp4" autoPlay muted loop playsInline preload="auto" />
          <div className="absolute inset-0 bg-gradient-to-b from-ivory-50/60 via-transparent to-ivory-50/70" />
        </div>
        {/* A thread, stitching its way across the hero */}
        <div className="fabric-flow" aria-hidden="true">
          <svg viewBox="0 0 700 700" className="w-full h-full" fill="none" preserveAspectRatio="xMidYMid slice">
            <path
              className="thread"
              stroke="#1E1710"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.45"
              d="M700,70 C555,160 615,330 485,445 C410,510 395,580 345,645"
            />
          </svg>
        </div>
        <div className="section-padding relative z-10 grid grid-cols-1 lg:grid-cols-[1.05fr_.95fr] gap-14 items-center">
          <div>
            <p className="eyebrow">Est. 2026 · Considered clothing, made in Bangladesh</p>
            <h1
              className="font-serif font-semibold leading-[0.98] tracking-[-0.02em] text-[clamp(3rem,8vw,6.5rem)] text-ink-900 mt-6 mb-7"
              style={{ fontVariationSettings: '"SOFT" 80' }}
            >
              Clothing with<br /><em className="em-sun font-normal" style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1' }}>quiet confidence.</em>
            </h1>
            <p className="text-ink-600 text-base md:text-lg leading-relaxed max-w-[44ch] mb-9">
              Considered pieces cut from premium fabrics — designed in Dhaka, made in
              Bangladesh, and delivered to your door. Numbered small batches, finished by hand.
            </p>
            <div className="flex flex-wrap items-center gap-7">
              <Link to="/shop" className="btn-primary">Shop the collection</Link>
              <Link
                to="/about"
                className="font-semibold inline-flex items-center gap-2 border-b-[1.5px] border-stone-300 pb-0.5 hover:border-champagne-500 hover:gap-3 transition-all"
              >
                Our story <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-9 gap-y-2 font-mono text-[11px] tracking-[0.08em] text-ink-600">
              <span><span className="text-champagne-500 tracking-[0.1em]" aria-hidden="true">★★★★★</span> Loved across Bangladesh</span>
              <span>Free delivery over ৳3,000</span>
              <span>7-day easy returns</span>
            </div>
          </div>

          <div className="relative justify-self-center lg:justify-self-end w-full max-w-[430px]">
            {/* Batch badge */}
            <div
              className="absolute top-6 -right-4 z-20 w-24 h-24 rounded-full bg-ink-900 text-ivory-100 grid place-content-center text-center rotate-[8deg] font-mono text-[9px] tracking-[0.12em] leading-[1.7] shadow-card"
              aria-hidden="true"
            >
              <b className="block text-mink-400 text-[12px]">N°</b>01<br />— 2026 —
            </div>
            {/* Arch image frame */}
            <div className="arch-mask overflow-hidden bg-ivory-200 aspect-[4/5.1] relative rotate-2 hover:rotate-0 hover:scale-[1.01] transition-transform duration-500 border-[6px] border-ivory-50 outline outline-1 outline-stone-300 shadow-card">
              {heroImage ? (
                <>
                  <img src={heroImage} alt="Nuhani — new season" className="absolute inset-0 w-full h-full object-cover hidden md:block" />
                  <img src={heroMobileImage ?? heroImage} alt="Nuhani — new season" className="absolute inset-0 w-full h-full object-cover md:hidden" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-mink-100 via-ivory-50 to-champagne-100 flex flex-col items-center justify-center gap-4">
                  <span className="font-serif italic font-medium text-5xl text-ink-600">Nuhani</span>
                  <span className="eyebrow">Autumn &rsquo;26</span>
                </div>
              )}
            </div>
            {/* Floating product tag — a real featured product */}
            {heroTagProduct && (
              <Link
                to={`/product/${heroTagProduct.slug}`}
                className="absolute -left-6 bottom-14 z-20 bg-ivory-50 border border-stone-300 rounded-2xl px-4 py-3 shadow-card flex flex-col animate-float hover:border-champagne-400 hover:-translate-y-1 transition-all"
              >
                <span className="font-mono text-[9px] tracking-[0.14em] uppercase text-ink-600">
                  {heroTagProduct.category?.name ?? 'New in'}
                </span>
                <span className="font-serif font-bold text-[15px] text-ink-900">{heroTagProduct.name}</span>
                <span className="font-mono font-bold text-sm text-champagne-600">{formatBDT(heroTagPrice)}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ============ MARQUEE ============ */}
      <div className="bg-ink-900 text-ivory-100 py-4 overflow-hidden" aria-label="Shop by category">
        <div className="marquee-track">
          {[...marqueeItems, ...marqueeItems].map((label, i) => (
            <Link
              key={`${label}-${i}`}
              to={categories.length > 0 ? `/shop/${categories[i % categories.length].slug}` : '/shop'}
              className="flex items-center gap-10 pr-10 font-mono text-[12px] tracking-[0.24em] uppercase whitespace-nowrap hover:text-mink-300 transition-colors"
            >
              {label}
              <span className="w-2 h-2 rounded-full bg-champagne-500 shrink-0" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>

      {/* ============ COLLECTION ============ */}
      {featured.length > 0 && (
        <section className="py-24 lg:py-28">
          <div className="section-padding">
            <div className="flex flex-wrap justify-between items-end gap-8 mb-12">
              <div>
                <p className="eyebrow">The collection</p>
                <h2
                  className="font-serif font-semibold tracking-[-0.015em] text-[clamp(2rem,4.2vw,3.4rem)] leading-[1.06] text-ink-900 mt-5 max-w-[16ch]"
                  style={{ fontVariationSettings: '"SOFT" 70' }}
                >
                  Few pieces. <em className="em-sun-deep" style={{ fontVariationSettings: '"SOFT" 100' }}>One endless wardrobe.</em>
                </h2>
              </div>
              <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink-600 text-right leading-[2]">
                <b className="text-champagne-600">01</b> / 04<br />Collection<br />Batch 01 — 2026
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <p className="mt-10 text-center">
              <Link
                to="/shop"
                className="font-semibold inline-flex items-center gap-2 border-b-[1.5px] border-stone-300 pb-0.5 hover:border-champagne-500 hover:gap-3 transition-all"
              >
                See the full collection <span aria-hidden="true">→</span>
              </Link>
            </p>
          </div>
        </section>
      )}

      {/* ============ LIFESTYLE (banner) ============ */}
      <section className="relative min-h-[86svh] grid place-items-center overflow-clip">
        {banner ? (
          <img key={banner.id} src={banner.image_url} alt={banner.title} className="absolute inset-0 w-full h-full object-cover animate-fade-in" />
        ) : (
          <div className="absolute inset-0 bg-ink-900" />
        )}
        {/* Warm wash + gradient */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-[rgba(20,14,8,.6)] via-[rgba(20,14,8,.3)] to-[rgba(20,14,8,.68)]" />
        <div className="absolute inset-0 z-10 mix-blend-soft-light bg-gradient-to-br from-[rgba(255,90,31,.5)] via-transparent to-[rgba(255,178,94,.45)]" />
        {!banner && <FabricFolds />}

        <div className="relative z-20 text-center text-ivory-50 section-padding py-20">
          <p className="eyebrow-light justify-center">{banner ? banner.subtitle ?? 'The Nuhani edit' : 'Made properly'}</p>
          <h2
            className="font-serif font-semibold tracking-[-0.015em] text-[clamp(2.2rem,5.2vw,4.2rem)] leading-[1.04] mt-6 mb-5"
            style={{ fontVariationSettings: '"SOFT" 80' }}
          >
            Made for <em className="em-amber" style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1' }}>{banner ? banner.title : 'golden days'}</em>, and every day after.
          </h2>
          <p className="text-ivory-100/85 max-w-[52ch] mx-auto mb-9 text-base md:text-lg">
            Glare-free fabrics, honest stitches, colors that stay rich wash after wash —
            clothing built for the long season of your life.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px max-w-2xl mx-auto mb-9 bg-ivory-100/25 border border-ivory-100/25 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="bg-ink-900/40 py-6 px-4">
              <b className="block font-serif font-semibold text-2xl md:text-3xl text-mink-400">100%</b>
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ivory-100/80">Premium fabrics</span>
            </div>
            <div className="bg-ink-900/40 py-6 px-4">
              <b className="block font-serif font-semibold text-2xl md:text-3xl text-mink-400">64</b>
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ivory-100/80">Districts delivered</span>
            </div>
            <div className="bg-ink-900/40 py-6 px-4">
              <b className="block font-serif font-semibold text-2xl md:text-3xl text-mink-400">7-day</b>
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ivory-100/80">Easy returns</span>
            </div>
          </div>
          <Link
            to={banner?.link_url ?? '/shop'}
            className="inline-flex items-center gap-2 bg-transparent text-ivory-50 px-7 py-3 rounded-full border-[1.5px] border-ivory-100/50 text-sm font-semibold hover:bg-ivory-50 hover:text-ink-900 hover:border-ivory-50 transition-all duration-300"
          >
            {banner?.button_text ?? 'Find your piece'}
          </Link>
        </div>
      </section>

      {/* ============ NEW ARRIVALS ============ */}
      <section className="py-24 lg:py-28">
        <div className="section-padding">
          <div className="flex flex-wrap justify-between items-end gap-8 mb-12">
            <div>
              <p className="eyebrow">Just in</p>
              <h2
                className="font-serif font-semibold tracking-[-0.015em] text-[clamp(2rem,4.2vw,3.4rem)] leading-[1.06] text-ink-900 mt-5 max-w-[16ch]"
                style={{ fontVariationSettings: '"SOFT" 70' }}
              >
                Fresh off the <em className="em-sun-deep" style={{ fontVariationSettings: '"SOFT" 100' }}>line.</em>
              </h2>
            </div>
            <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink-600 text-right leading-[2]">
              <b className="text-champagne-600">02</b> / 04<br />New arrivals
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-[4/4.6] bg-ivory-200 rounded-[28px] animate-pulse" />
              ))}
            </div>
          ) : newArrivals.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-ivory-200 border border-stone-200 rounded-[28px] px-6 py-16 text-center">
              <p className="font-serif text-2xl text-ink-900 mb-1">Our first collection is arriving soon.</p>
              <p className="text-sm text-ink-600">Subscribe below and be the first to know.</p>
            </div>
          )}
        </div>
      </section>

      {/* ============ STORY ============ */}
      <section className="py-24 lg:py-28">
        <div className="section-padding grid grid-cols-1 lg:grid-cols-[.92fr_1.08fr] gap-14 items-center">
          <div className="relative max-w-[440px] w-full justify-self-center">
            <div className="arch-invert overflow-hidden bg-ivory-200 aspect-[4/4.7] relative -rotate-[1.5deg] hover:rotate-0 transition-transform duration-500 border-[6px] border-ivory-50 outline outline-1 outline-stone-300 shadow-card">
              {storyImage ? (
                <img src={storyImage} alt="Inside the Nuhani studio" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-ivory-200 via-mink-100 to-champagne-200 flex flex-col items-center justify-center gap-3">
                  <span className="font-serif italic font-medium text-4xl text-ink-600">Est. 2026</span>
                  <span className="w-10 h-px bg-ink-400" aria-hidden="true" />
                  <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-600">Dhaka, Bangladesh</span>
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="eyebrow">03 / 04 — The story</p>
            <h2
              className="font-serif font-semibold tracking-[-0.015em] text-[clamp(2rem,4.2vw,3.4rem)] leading-[1.06] text-ink-900 mt-5 mb-6 max-w-[16ch]"
              style={{ fontVariationSettings: '"SOFT" 70' }}
            >
              Built for <em className="em-sun-deep" style={{ fontVariationSettings: '"SOFT" 100' }}>long</em> seasons.
            </h2>
            <p className="text-ink-600 max-w-[52ch] leading-relaxed">
              Nuhani began with a simple frustration: beautiful clothing in Bangladesh was
              either imported and expensive, or affordable and poorly made. We make a small
              number of pieces, in numbered batches, from premium fabrics — and we finish
              every piece by hand.
            </p>
            <ul className="mt-8">
              {[
                { num: 'N°1', title: 'Premium fabrics', desc: 'Sourced for how they feel against the skin and how they age through seasons of wear.' },
                { num: 'N°2', title: 'Made locally', desc: 'Cut and stitched by skilled hands across Bangladesh, finished and inspected by a person.' },
                { num: 'N°3', title: 'Honest pricing', desc: 'No imported markups. One fair price for pieces that outlast the trend cycle.' },
                { num: 'N°4', title: '7-day easy returns', desc: 'Wrong size, changed your mind? Simple exchanges, no questions.' },
              ].map((item) => (
                <li key={item.num} className="flex gap-6 items-baseline py-4 border-t border-stone-300 last:border-b">
                  <span className="font-mono text-[11px] text-champagne-600 tracking-[0.1em] shrink-0">{item.num}</span>
                  <div>
                    <b className="font-semibold text-ink-900">{item.title}</b>
                    <p className="text-sm text-ink-600 mt-0.5">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ============ QUOTES ============ */}
      <section className="bg-ivory-200 border-t border-b border-stone-300 py-24 lg:py-28">
        <div className="section-padding grid grid-cols-1 md:grid-cols-2 gap-12">
          {testimonials.map((tst) => (
            <blockquote key={tst.name}>
              <span className="block font-serif text-[4rem] leading-[0.5] text-champagne-500 mb-5" aria-hidden="true">&ldquo;</span>
              <p
                className="font-serif italic font-normal text-[clamp(1.2rem,2vw,1.6rem)] leading-[1.4] tracking-[-0.01em] text-ink-900"
                style={{ fontVariationSettings: '"SOFT" 90' }}
              >
                {tst.quote}
              </p>
              <cite className="block mt-5 not-italic font-mono text-[11px] tracking-[0.18em] uppercase text-ink-600 before:content-['——'] before:text-champagne-600 before:mr-1">
                {tst.name} · {tst.city}
              </cite>
            </blockquote>
          ))}
        </div>
      </section>

      {/* ============ NEWSLETTER ============ */}
      <section className="relative overflow-clip bg-ink-900 text-ivory-50 text-center py-28">
        <FabricFolds />
        <div className="section-padding relative z-10">
          <p className="eyebrow-light justify-center">04 / 04 — The letter</p>
          <h2
            className="font-serif font-semibold tracking-[-0.015em] text-[clamp(2.2rem,5vw,4rem)] leading-[1.04] mt-6 mb-4"
            style={{ fontVariationSettings: '"SOFT" 85' }}
          >
            Join the <em className="em-amber" style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1' }}>good thread.</em>
          </h2>
          <p className="text-ivory-100/70 max-w-[46ch] mx-auto mb-9">
            One letter a month: new batches before anyone else, care guides,
            and the occasional photo of a very good day in Dhaka.
          </p>
          {subscribed ? (
            <p className="font-serif italic text-xl text-mink-400">You&rsquo;re on the list. Welcome to Nuhani.</p>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const formEl = e.target as HTMLFormElement
                const emailInput = formEl.querySelector('input[type="email"]') as HTMLInputElement
                const email = emailInput.value.trim()
                if (!email) return
                setSubscribing(true)
                const { data, error } = await supabase.rpc('subscribe_newsletter', { p_email: email })
                if (error) {
                  showToast(error.message || 'Something went wrong. Please try again.', 'error')
                } else if ((data as { already_subscribed?: boolean })?.already_subscribed) {
                  showToast("You're already subscribed!", 'info')
                } else {
                  setSubscribed(true)
                  showToast('Subscribed successfully!', 'success')
                }
                setSubscribing(false)
              }}
              className="flex flex-wrap justify-center gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                placeholder="you@example.com"
                className="flex-1 min-w-[240px] px-6 py-3.5 rounded-full border-[1.5px] border-ivory-100/35 bg-ivory-100/5 text-ivory-50 placeholder:text-ivory-100/45 focus:outline-none focus:border-mink-400 focus:bg-ivory-100/10 transition-colors"
                required
                disabled={subscribing}
              />
              <button type="submit" disabled={subscribing} className="btn-outline whitespace-nowrap">
                {subscribing ? 'Signing up…' : 'Sign up'}
              </button>
            </form>
          )}
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ivory-100/50 mt-6">No spam · Unsubscribe anytime</p>
        </div>
      </section>
    </div>
  )
}
