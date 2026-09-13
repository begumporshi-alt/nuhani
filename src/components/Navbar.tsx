import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, Heart, User, Menu, X, Search, Globe } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { supabase, fetchPublicSettings, type PublicSettings, type Product, type Category } from '../lib/supabase'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [logoLoaded, setLogoLoaded] = useState(false)
  const [settings, setSettings] = useState<PublicSettings | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const { itemCount } = useCart()
  const { session, profile } = useAuth()
  const { lang, toggleLang, t, pick } = useLanguage()
  const navigate = useNavigate()
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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

  const logoUrl = settings?.logo_url ?? '/logo-mark.png'
  const siteName = settings?.site_name ?? 'Nuhani'

  useEffect(() => {
    setLogoError(false)
    setLogoLoaded(false)
  }, [logoUrl])

  // Live search with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    setSearchLoading(true)
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('products')
        .select('*, category:categories(*), variants:product_variants(*)')
        .eq('is_active', true)
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(6)
      setSearchResults((data as Product[]) ?? [])
      setSearchLoading(false)
    }, 250)
  }, [searchQuery])

  // Close search on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
      setSearchResults([])
    }
  }

  const navLinks = [
    { label: t('nav.shopAll'), path: '/shop' },
    ...categories.slice(0, 3).map((c) => ({ label: pick(c.name, c.name_bn), path: `/shop/${c.slug}` })),
    { label: t('nav.about'), path: '/about' },
    { label: t('nav.contact'), path: '/contact' },
  ]

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-ivory-50/85 backdrop-blur-md border-b border-stone-200' : 'bg-transparent'
        }`}
      >
        <nav className="section-padding flex items-center justify-between h-[76px]">
          <div className="flex items-center gap-4 min-w-0">
            <button
              className="lg:hidden text-ink-900"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={t('nav.menu')}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <Link to="/" className="flex items-center">
              {logoError ? (
                <span className="brand-title text-[1.65rem] leading-none">
                  {siteName}<span className="text-champagne-500">.</span>
                </span>
              ) : (
                <div className="relative flex items-center gap-2.5">
                  <div className="relative h-10 w-auto min-w-[60px] flex items-center">
                    {!logoLoaded && <div className="logo-skeleton absolute inset-0 min-w-[60px]" />}
                    <img
                      src={logoUrl}
                      alt={siteName}
                      className={`h-10 w-auto transition-opacity duration-500 ${logoLoaded ? 'opacity-100' : 'opacity-0'}`}
                      onLoad={() => setLogoLoaded(true)}
                      onError={() => setLogoError(true)}
                    />
                  </div>
                  <span className="brand-title uppercase text-[1.1rem] sm:text-[1.3rem] leading-none">
                    {siteName}
                  </span>
                </div>
              )}
            </Link>
          </div>

          <ul className="hidden lg:flex items-center gap-9">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className="relative text-[0.92rem] font-medium text-ink-900 py-1 after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:bg-champagne-500 after:scale-x-0 after:origin-right hover:after:scale-x-100 hover:after:origin-left after:transition-transform after:duration-300"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4 md:gap-5">
            <button onClick={() => setSearchOpen(!searchOpen)} className="text-ink-900 hover:text-champagne-600 transition-colors" aria-label={t('common.search')}>
              <Search size={19} />
            </button>
            <button onClick={toggleLang} className="flex items-center gap-1 text-ink-900 hover:text-champagne-600 transition-colors" aria-label={t('nav.switchLanguage')}>
              <Globe size={16} />
              <span className="font-mono text-[11px]">{lang === 'en' ? 'বাং' : 'EN'}</span>
            </button>
            {profile?.role === 'admin' && (
              <Link to="/admin" className="hidden sm:block font-mono text-[11px] uppercase tracking-[0.12em] text-ink-900 hover:text-champagne-600 transition-colors">
                {t('nav.admin')}
              </Link>
            )}
            <Link to={session ? '/account' : '/login'} className="text-ink-900 hover:text-champagne-600 transition-colors" aria-label={t('nav.account')}>
              <User size={19} />
            </Link>
            <Link to="/wishlist" className="hidden sm:block text-ink-900 hover:text-champagne-600 transition-colors" aria-label={t('nav.wishlist')}>
              <Heart size={19} />
            </Link>
            <Link to="/cart" className="relative text-ink-900 hover:text-champagne-600 transition-colors" aria-label={t('nav.cart')}>
              <ShoppingBag size={19} />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-champagne-500 text-ink-900 text-[10px] font-bold min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center font-mono">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </nav>

        {searchOpen && (
          <div ref={searchRef} className="absolute top-full left-0 right-0 bg-ivory-50/97 backdrop-blur-md border-b border-stone-200 animate-slide-down">
            <div className="section-padding py-4">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('search.placeholder')}
                    className="w-full pl-12 pr-12 py-3 rounded-full border border-stone-300 bg-white focus:outline-none focus:border-champagne-500 transition-colors"
                    autoFocus
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" size={20} />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); setSearchResults([]) }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-900"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </form>

              {searchQuery.trim() && (
                <div className="mt-3">
                  {searchLoading ? (
                    <div className="flex items-center gap-2 text-sm text-ink-500 py-4">
                      <div className="w-4 h-4 border-2 border-stone-300 border-t-champagne-500 rounded-full animate-spin" />
                      {t('search.searching')}
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-1">
                      <p className="eyebrow mb-2">{t('search.suggestions')}</p>
                      {searchResults.map((product) => {
                        const minPrice = product.variants?.length ? Math.min(...product.variants.map(v => v.price)) : 0
                        return (
                          <Link
                            key={product.id}
                            to={`/product/${product.slug}`}
                            onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]) }}
                            className="flex items-center gap-3 p-2 hover:bg-ivory-100 transition-colors"
                          >
                            {product.images?.[0] && (
                              <img src={product.images[0]} alt={product.name} className="w-12 h-12 rounded-2xl object-cover shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-serif font-bold text-ink-900 truncate">{pick(product.name, product.name_bn)}</p>
                              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-500">{pick(product.category?.name, product.category?.name_bn)}</p>
                            </div>
                            <span className="font-mono font-bold text-sm text-ink-900 shrink-0">৳{minPrice.toLocaleString()}</span>
                          </Link>
                        )
                      })}
                      <button
                        onClick={() => {
                          navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`)
                          setSearchOpen(false)
                          setSearchQuery('')
                          setSearchResults([])
                        }}
                        className="text-sm font-semibold text-ink-900 pt-2 pb-1 block w-full text-left border-b border-stone-300 hover:border-champagne-500 transition-colors"
                      >
                        {t('search.viewAll')} "{searchQuery}" →
                      </button>
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <p className="text-sm text-ink-500">{t('search.noResults')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-ink-900/40" />
          <div className="absolute top-0 left-0 bottom-0 w-72 bg-ivory-50 border-r border-stone-200 animate-slide-down p-6 pt-24" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link key={link.path} to={link.path} onClick={() => setMobileOpen(false)} className="text-xl font-serif text-ink-900 hover:text-champagne-600 transition-colors py-2.5 border-b border-stone-200">
                  {link.label}
                </Link>
              ))}
              {session && (
                <Link to="/account" onClick={() => setMobileOpen(false)} className="text-xl font-serif text-ink-900 hover:text-champagne-600 transition-colors py-2.5 border-b border-stone-200">
                  {t('nav.account')}
                </Link>
              )}
              {profile?.role === 'admin' && (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-xl font-serif text-ink-900 hover:text-champagne-600 transition-colors py-2.5">
                  {t('nav.adminDashboard')}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="h-[76px]" />
    </>
  )
}
