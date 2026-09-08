import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin } from 'lucide-react'
import { fetchPublicSettings, supabase, type PublicSettings, type Category } from '../lib/supabase'
import { useLanguage } from '../contexts/LanguageContext'

export default function Footer() {
  const [settings, setSettings] = useState<PublicSettings | null>(null)
  const [logoError, setLogoError] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const { t } = useLanguage()

  useEffect(() => {
    fetchPublicSettings().then(setSettings)
    supabase
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setCategories((data as Category[]) ?? []))
  }, [])

  const logoUrl = settings?.logo_url ?? '/logo.svg'
  const siteName = settings?.site_name ?? 'Nuhani'
  const phone = settings?.phone ?? '+880 1700 000000'
  const email = settings?.email ?? 'hello@nuhani.com'
  const address = settings?.address ?? 'Dhaka, Bangladesh'

  return (
    <footer className="bg-ink-900 text-ivory-100 pt-14 pb-8 border-t border-ivory-100/15">
      <div className="section-padding">
        <div className="footer-wordmark" aria-hidden="true">NUHANI</div>

        <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr_1fr_1.2fr] gap-10 pt-10 mt-10 border-t border-ivory-100/15">
          {/* Brand */}
          <div>
            {logoError ? (
              <span className="brand-title-light text-2xl block mb-4">{siteName}<span className="text-champagne-500">.</span></span>
            ) : (
              <div className="h-12 w-auto min-w-[40px] mb-4 brightness-0 invert">
                <img src={logoUrl} alt={siteName} className="h-12 w-auto" onError={() => setLogoError(true)} />
              </div>
            )}
            <p className="font-serif italic text-xl text-ivory-100/85 max-w-[22ch] leading-snug mb-5">
              Small batches, honest prices, made in Bangladesh.
            </p>
            <div className="flex gap-5 font-mono text-[11px] uppercase tracking-[0.14em]">
              {settings?.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="text-ivory-100/70 hover:text-champagne-500 transition-colors">
                  Instagram
                </a>
              )}
              {settings?.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="text-ivory-100/70 hover:text-champagne-500 transition-colors">
                  Facebook
                </a>
              )}
              {settings?.youtube_url && (
                <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer" className="text-ivory-100/70 hover:text-champagne-500 transition-colors">
                  YouTube
                </a>
              )}
              {settings?.twitter_url && (
                <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer" className="text-ivory-100/70 hover:text-champagne-500 transition-colors">
                  Twitter
                </a>
              )}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-mink-400 mb-4">{t('footer.shop')}</h3>
            <ul className="space-y-2.5 text-sm">
              {categories.slice(0, 3).map((c) => (
                <li key={c.id}>
                  <Link to={`/shop/${c.slug}`} className="text-ivory-100/70 hover:text-champagne-500 transition-colors">{c.name}</Link>
                </li>
              ))}
              <li><Link to="/shop" className="text-ivory-100/70 hover:text-champagne-500 transition-colors">{t('nav.shopAll')}</Link></li>
              <li><Link to="/size-guide" className="text-ivory-100/70 hover:text-champagne-500 transition-colors">{t('footer.sizeGuide')}</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-mink-400 mb-4">{t('footer.help')}</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/shipping" className="text-ivory-100/70 hover:text-champagne-500 transition-colors">{t('footer.shipping')}</Link></li>
              <li><Link to="/returns" className="text-ivory-100/70 hover:text-champagne-500 transition-colors">{t('footer.returns')}</Link></li>
              <li><Link to="/about" className="text-ivory-100/70 hover:text-champagne-500 transition-colors">{t('footer.aboutUs')}</Link></li>
              <li><Link to="/contact" className="text-ivory-100/70 hover:text-champagne-500 transition-colors">{t('footer.contactUs')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-mink-400 mb-4">{t('footer.getInTouch')}</h3>
            <ul className="space-y-3 text-sm text-ivory-100/70">
              <li className="flex items-center gap-2.5"><Phone size={14} className="text-ivory-100/40" /> {phone}</li>
              <li className="flex items-center gap-2.5"><Mail size={14} className="text-ivory-100/40" /> {email}</li>
              <li className="flex items-start gap-2.5"><MapPin size={14} className="text-ivory-100/40 mt-0.5 shrink-0" /> {address}</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-3 mt-12 pt-6 border-t border-ivory-100/15 font-mono text-[10px] tracking-[0.14em] uppercase text-ivory-100/45">
          <span>&copy; {new Date().getFullYear()} {siteName} — All rights reserved</span>
          <span>Made in Bangladesh</span>
        </div>
      </div>
    </footer>
  )
}
