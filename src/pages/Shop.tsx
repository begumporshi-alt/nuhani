import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X, ChevronDown, Check } from 'lucide-react'
import { supabase, type Product, type Category } from '../lib/supabase'
import ProductCard from '../components/ProductCard'
import Seo from '../components/Seo'
import { useLanguage } from '../contexts/LanguageContext'

// Multi-select dropdown chip
function FilterDropdown({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: string[]
  selected: string[]
  onToggle: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const { t } = useLanguage()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const count = selected.length

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm font-medium transition-all ${
          count > 0
            ? 'border-ink-600 bg-ink-50 text-ink-700'
            : 'border-stone-300 bg-white text-ink-600 hover:border-mink-300'
        }`}
      >
        {label}
        {count > 0 && (
          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-ink-600 text-white text-[10px] font-bold leading-none">
            {count}
          </span>
        )}
        <ChevronDown
          size={14}
          className={`text-ink-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && options.length > 0 && (
        <div className="absolute top-full mt-2 left-0 z-30 min-w-[160px] bg-white rounded-2xl shadow-sm border border-stone-200 py-1.5 animate-fade-in">
          {options.map((opt) => {
            const active = selected.includes(opt)
            return (
              <button
                key={opt}
                onClick={() => onToggle(opt)}
                className={`flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm transition-colors ${
                  active ? 'text-ink-700 font-medium bg-mink-50' : 'text-ink-600 hover:bg-ivory-50'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    active ? 'bg-ink-600 border-ink-600' : 'border-stone-300'
                  }`}
                >
                  {active && <Check size={10} className="text-white" strokeWidth={3} />}
                </span>
                {opt}
              </button>
            )
          })}
          {selected.length > 0 && (
            <>
              <div className="my-1 border-t border-ivory-100" />
              <button
                onClick={() => options.forEach((o) => selected.includes(o) && onToggle(o))}
                className="w-full text-left px-4 py-1.5 text-xs text-ink-400 hover:text-ink-600 transition-colors"
              >
                {t('shop.clearAll')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function Shop() {
  const { t, pick } = useLanguage()
  const { categorySlug } = useParams()
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('q') ?? ''
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categorySlug ?? null)
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'name'>('newest')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0])
  const [draftMin, setDraftMin] = useState('')
  const [draftMax, setDraftMax] = useState('')
  const priceRangeInitialized = useRef(false)
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedAges, setSelectedAges] = useState<string[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    setSelectedCategory(categorySlug ?? null)
    if (categorySlug) {
      const parent = categories.find((c) => c.slug === categorySlug)
      if (parent) {
        setExpanded((prev) => new Set(prev).add(parent.id))
      }
    }
  }, [categorySlug, categories])

  useEffect(() => {
    async function load() {
      setLoading(true)
      let query = supabase
        .from('products')
        .select('*, category:categories(*), variants:product_variants(*)')
        .eq('is_active', true)

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      }

      const { data } = await query
      setProducts((data as Product[]) ?? [])

      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      setCategories((catData as Category[]) ?? [])

      setLoading(false)
    }
    load()
  }, [searchQuery])

  const allSizes = useMemo(() => {
    const sizes = new Set<string>()
    products.forEach((p) => p.variants?.forEach((v) => v.size && sizes.add(v.size)))
    return Array.from(sizes).sort()
  }, [products])

  const allColors = useMemo(() => {
    const colors = new Set<string>()
    products.forEach((p) => p.variants?.forEach((v) => v.color && colors.add(v.color)))
    return Array.from(colors).sort()
  }, [products])

  const allAges = useMemo(() => {
    const ages = new Set<string>()
    products.forEach((p) => p.variants?.forEach((v) => v.age && ages.add(v.age)))
    return Array.from(ages).sort()
  }, [products])

  const maxPrice = useMemo(() => {
    let m = 0
    products.forEach((p) => {
      p.variants?.forEach((v) => { if (v.price > m) m = v.price })
    })
    return m > 0 ? Math.ceil(m / 500) * 500 : 5000
  }, [products])

  useEffect(() => {
    if (!priceRangeInitialized.current && maxPrice > 0) {
      setPriceRange([0, maxPrice])
      setDraftMin('0')
      setDraftMax(String(maxPrice))
      priceRangeInitialized.current = true
    }
  }, [maxPrice])

  function applyPriceRange() {
    const lo = Math.max(0, Number(draftMin) || 0)
    const hi = Math.max(lo, Number(draftMax) || maxPrice)
    setDraftMin(String(lo))
    setDraftMax(String(hi))
    setPriceRange([lo, hi])
  }

  const hasPendingPriceChange =
    (Number(draftMin) || 0) !== priceRange[0] || (Number(draftMax) || maxPrice) !== priceRange[1]

  const filtered = useMemo(() => {
    let result = [...products]

    if (selectedCategory) {
      result = result.filter((p) => {
        if (p.category?.slug === selectedCategory) return true
        const childCats = categories.filter((c) => {
          const parent = categories.find((pc) => pc.id === c.parent_id)
          return parent?.slug === selectedCategory
        })
        return childCats.some((cc) => cc.id === p.category_id)
      })
    }

    if (selectedSizes.length > 0) {
      result = result.filter((p) => p.variants?.some((v) => v.size && selectedSizes.includes(v.size)))
    }

    if (selectedColors.length > 0) {
      result = result.filter((p) => p.variants?.some((v) => v.color && selectedColors.includes(v.color)))
    }

    if (selectedAges.length > 0) {
      result = result.filter((p) => p.variants?.some((v) => v.age && selectedAges.includes(v.age)))
    }

    result = result.filter((p) => {
      const minPrice = p.variants?.length ? Math.min(...p.variants.map((v) => v.price)) : 0
      return minPrice >= priceRange[0] && minPrice <= priceRange[1]
    })

    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => {
          const aMin = a.variants?.length ? Math.min(...a.variants.map((v) => v.price)) : 0
          const bMin = b.variants?.length ? Math.min(...b.variants.map((v) => v.price)) : 0
          return aMin - bMin
        })
        break
      case 'price-high':
        result.sort((a, b) => {
          const aMin = a.variants?.length ? Math.min(...a.variants.map((v) => v.price)) : 0
          const bMin = b.variants?.length ? Math.min(...b.variants.map((v) => v.price)) : 0
          return bMin - aMin
        })
        break
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    return result
  }, [products, selectedCategory, selectedSizes, selectedColors, selectedAges, priceRange, sortBy, categories])

  const toggleSize = (size: string) => setSelectedSizes((prev) => prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size])
  const toggleColor = (color: string) => setSelectedColors((prev) => prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color])
  const toggleAge = (age: string) => setSelectedAges((prev) => prev.includes(age) ? prev.filter((a) => a !== age) : [...prev, age])

  const totalActiveFilters = selectedSizes.length + selectedColors.length + selectedAges.length

  // Category + Price sidebar (desktop)
  const SidebarFilters = () => (
    <div className="space-y-7">
      <div>
        <h4 className="font-semibold text-ink-800 text-sm uppercase tracking-wide mb-3">{t('shop.category')}</h4>
        <div className="space-y-0.5">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`text-sm block w-full text-left px-3 py-1.5 rounded-2xl transition-colors ${
              !selectedCategory ? 'bg-mink-100 text-ink-700 font-medium' : 'text-ink-500 hover:bg-ivory-100'
            }`}
          >
            {t('shop.allProducts')}
          </button>
          {categories.filter((c) => !c.parent_id).map((parent) => {
            const children = categories.filter((c) => c.parent_id === parent.id)
            const isOpen = expanded.has(parent.id)
            const isParentSelected = selectedCategory === parent.slug
            const hasActiveChild = children.some((c) => c.slug === selectedCategory)

            return (
              <div key={parent.id}>
                <button
                  onClick={() => {
                    setSelectedCategory(parent.slug)
                    setExpanded((prev) => {
                      const next = new Set(prev)
                      if (next.has(parent.id)) next.delete(parent.id)
                      else next.add(parent.id)
                      return next
                    })
                  }}
                  className={`text-sm w-full text-left px-3 py-1.5 rounded-2xl transition-colors flex items-center gap-2 ${
                    isParentSelected || hasActiveChild ? 'text-ink-700 font-medium' : 'text-ink-600 hover:bg-ivory-100'
                  }`}
                >
                  <span className="flex-1">{pick(parent.name, parent.name_bn)}</span>
                  {children.length > 0 && (
                    <ChevronDown
                      size={14}
                      className={`text-ink-300 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  )}
                </button>
                {children.length > 0 && (
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-60 opacity-100 py-0.5' : 'max-h-0 opacity-0 py-0'
                    }`}
                  >
                    <div className="ml-4 space-y-0.5 border-l border-stone-200/70">
                      {children.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => setSelectedCategory(child.slug)}
                          className={`text-xs w-full text-left pl-3 pr-3 py-1.5 rounded-2xl transition-colors ${
                            selectedCategory === child.slug
                              ? 'bg-mink-50 text-ink-700 font-medium'
                              : 'text-ink-400 hover:text-ink-500 hover:bg-ivory-50'
                          }`}
                        >
                          {pick(child.name, child.name_bn)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-ink-800 text-sm uppercase tracking-wide mb-3">{t('shop.priceRange')}</h4>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-400 pointer-events-none">৳</span>
            <input
              type="number"
              value={draftMin}
              min={0}
              step={50}
              onChange={(e) => setDraftMin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyPriceRange()}
              className={`w-full pl-6 pr-2 py-1.5 rounded-2xl border bg-white text-sm text-ink-700 focus:outline-none focus:ring-2 focus:ring-mink-300 transition-colors ${
                hasPendingPriceChange ? 'border-mink-400' : 'border-stone-300'
              }`}
              placeholder={t('shop.min')}
            />
          </div>
          <span className="text-ink-300 self-center text-sm">—</span>
          <div className="flex-1 relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-400 pointer-events-none">৳</span>
            <input
              type="number"
              value={draftMax}
              min={0}
              step={50}
              onChange={(e) => setDraftMax(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyPriceRange()}
              className={`w-full pl-6 pr-2 py-1.5 rounded-2xl border bg-white text-sm text-ink-700 focus:outline-none focus:ring-2 focus:ring-mink-300 transition-colors ${
                hasPendingPriceChange ? 'border-mink-400' : 'border-stone-300'
              }`}
              placeholder={t('shop.max')}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2.5 h-6">
          <button
            onClick={applyPriceRange}
            disabled={!hasPendingPriceChange}
            className={`text-xs font-medium px-3 py-1 rounded-2xl transition-all duration-300 ${
              hasPendingPriceChange
                ? 'opacity-100 bg-ink-700 text-ivory-50 hover:bg-ink-800'
                : 'opacity-0 pointer-events-none bg-ivory-200 text-ink-300'
            }`}
          >
            {t('common.apply')}
          </button>
          {(priceRange[0] > 0 || priceRange[1] < maxPrice) && !hasPendingPriceChange && (
            <button
              onClick={() => {
                setPriceRange([0, maxPrice])
                setDraftMin('0')
                setDraftMax(String(maxPrice))
              }}
              className="text-xs text-ink-400 hover:text-ink-600 transition-colors"
            >
              {t('shop.resetPrice')}
            </button>
          )}
        </div>
      </div>
    </div>
  )

  // Full filter panel for mobile drawer
  const MobileFilters = () => (
    <div className="space-y-7">
      <SidebarFilters />

      {allSizes.length > 0 && (
        <div>
          <h4 className="font-semibold text-ink-800 text-sm uppercase tracking-wide mb-3">{t('shop.size')}</h4>
          <div className="flex flex-wrap gap-2">
            {allSizes.map((size) => (
              <button
                key={size}
                onClick={() => toggleSize(size)}
                className={`px-3 py-1.5 rounded-2xl text-sm border transition-all ${
                  selectedSizes.includes(size)
                    ? 'border-ink-700 bg-ink-700 text-ivory-50'
                    : 'border-stone-300 text-ink-600 hover:border-mink-300'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {allColors.length > 0 && (
        <div>
          <h4 className="font-semibold text-ink-800 text-sm uppercase tracking-wide mb-3">{t('shop.color')}</h4>
          <div className="flex flex-wrap gap-2">
            {allColors.map((color) => (
              <button
                key={color}
                onClick={() => toggleColor(color)}
                className={`px-3 py-1.5 rounded-2xl text-sm border transition-all ${
                  selectedColors.includes(color)
                    ? 'border-ink-700 bg-ink-700 text-ivory-50'
                    : 'border-stone-300 text-ink-600 hover:border-mink-300'
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {allAges.length > 0 && (
        <div>
          <h4 className="font-semibold text-ink-800 text-sm uppercase tracking-wide mb-3">{t('shop.age')}</h4>
          <div className="flex flex-wrap gap-2">
            {allAges.map((age) => (
              <button
                key={age}
                onClick={() => toggleAge(age)}
                className={`px-3 py-1.5 rounded-2xl text-sm border transition-all ${
                  selectedAges.includes(age)
                    ? 'border-ink-700 bg-ink-700 text-ivory-50'
                    : 'border-stone-300 text-ink-600 hover:border-mink-300'
                }`}
              >
                {age}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const activeCategoryName = selectedCategory
    ? categories.find((c) => c.slug === selectedCategory)
    : undefined
  const activeCategory = activeCategoryName
    ? pick(activeCategoryName.name, activeCategoryName.name_bn)
    : undefined
  const shopTitle = activeCategory
    ? t('shop.categoryTitle', { name: activeCategory })
    : searchQuery
    ? t('shop.searchTitle', { q: searchQuery })
    : t('nav.shopAll')

  return (
    <div className="section-padding py-8 animate-fade-in">
      <Seo
        title={shopTitle}
        description={
          activeCategory
            ? `Shop ${activeCategory.toLowerCase()} clothing at Nuhani. Premium, soft and safe fabrics delivered across Bangladesh.`
            : "Browse the full collection of premium baby and maternity clothing at Nuhani. Soft, safe fabrics delivered across Bangladesh."
        }
        path={selectedCategory ? `/shop/${selectedCategory}` : '/shop'}
        noindex={!!searchQuery}
      />
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-serif text-ink-900 mb-2">
          {selectedCategory
            ? pick(categories.find((c) => c.slug === selectedCategory)?.name, categories.find((c) => c.slug === selectedCategory)?.name_bn) ?? t('nav.shop')
            : searchQuery
            ? t('shop.resultsFor', { q: searchQuery })
            : t('nav.shopAll')}
        </h1>
        <p className="eyebrow">{t('shop.productCount', { n: filtered.length })}</p>
      </div>

      {/* Category strip — horizontal scroll */}
      <div className="flex items-center gap-7 overflow-x-auto scrollbar-hide border-b border-stone-200 pb-3 mb-6">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`text-[11px] font-medium uppercase tracking-[0.18em] whitespace-nowrap transition-colors ${
            !selectedCategory ? 'text-ink-900 border-b border-ink-900 pb-1' : 'text-stone-500 hover:text-ink-900 pb-1'
          }`}
        >
          {t('shop.all')}
        </button>
        {categories.filter((c) => !c.parent_id).map((parent) => (
          <button
            key={parent.id}
            onClick={() => setSelectedCategory(parent.slug)}
            className={`text-[11px] font-medium uppercase tracking-[0.18em] whitespace-nowrap transition-colors ${
              selectedCategory === parent.slug ? 'text-ink-900 border-b border-ink-900 pb-1' : 'text-stone-500 hover:text-ink-900 pb-1'
            }`}
          >
            {pick(parent.name, parent.name_bn)}
          </button>
        ))}
      </div>

      <div>
        {/* Toolbar: filters + price + sort */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          {/* Mobile: open drawer */}
          <button
            onClick={() => setShowFilters(true)}
            className={`lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-sm font-medium transition-all ${
              totalActiveFilters > 0
                ? 'border-ink-600 bg-ink-50 text-ink-700'
                : 'border-stone-300 bg-white text-ink-600'
            }`}
          >
            <SlidersHorizontal size={15} />
            {t('shop.filters')}
            {totalActiveFilters > 0 && (
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-ink-600 text-white text-[10px] font-bold">
                {totalActiveFilters}
              </span>
            )}
          </button>

          {/* Desktop inline dropdowns */}
          <div className="hidden lg:flex items-center gap-2 flex-wrap">
            {allSizes.length > 0 && (
              <FilterDropdown
                label={t('shop.size')}
                options={allSizes}
                selected={selectedSizes}
                onToggle={toggleSize}
              />
            )}
            {allColors.length > 0 && (
              <FilterDropdown
                label={t('shop.color')}
                options={allColors}
                selected={selectedColors}
                onToggle={toggleColor}
              />
            )}
            {allAges.length > 0 && (
              <FilterDropdown
                label={t('shop.age')}
                options={allAges}
                selected={selectedAges}
                onToggle={toggleAge}
              />
            )}

            {/* Compact price filter */}
            <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-stone-200">
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 pointer-events-none">৳</span>
                <input
                  type="number"
                  value={draftMin}
                  min={0}
                  step={50}
                  onChange={(e) => setDraftMin(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyPriceRange()}
                  className={`w-20 pl-5 pr-2 py-1.5 rounded-full border bg-white text-xs text-ink-700 focus:outline-none transition-colors ${
                    hasPendingPriceChange ? 'border-mink-400' : 'border-stone-300'
                  }`}
                  placeholder={t('shop.min')}
                />
              </div>
              <span className="text-stone-300 text-xs">—</span>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 pointer-events-none">৳</span>
                <input
                  type="number"
                  value={draftMax}
                  min={0}
                  step={50}
                  onChange={(e) => setDraftMax(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyPriceRange()}
                  className={`w-20 pl-5 pr-2 py-1.5 rounded-full border bg-white text-xs text-ink-700 focus:outline-none transition-colors ${
                    hasPendingPriceChange ? 'border-mink-400' : 'border-stone-300'
                  }`}
                  placeholder={t('shop.max')}
                />
              </div>
              <button
                onClick={applyPriceRange}
                disabled={!hasPendingPriceChange}
                className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                  hasPendingPriceChange
                    ? 'bg-ink-900 text-ivory-50 hover:bg-ink-800'
                    : 'text-stone-400 cursor-default'
                }`}
              >
                {t('common.apply')}
              </button>
            </div>

            {totalActiveFilters > 0 && (
              <button
                onClick={() => {
                  setSelectedSizes([])
                  setSelectedColors([])
                  setSelectedAges([])
                }}
                className="flex items-center gap-1 px-3 py-2 rounded-2xl text-sm text-ink-400 hover:text-ink-600 transition-colors"
              >
                <X size={14} /> {t('shop.clear')}
              </button>
            )}
          </div>

          {/* Sort — pushed to the right */}
          <div className="ml-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-4 py-2 rounded-full border border-stone-300 bg-white text-sm text-ink-700 focus:outline-none focus:border-ink-500"
            >
              <option value="newest">{t('shop.sortNewest')}</option>
              <option value="price-low">{t('shop.sortPriceLow')}</option>
              <option value="price-high">{t('shop.sortPriceHigh')}</option>
              <option value="name">{t('shop.sortName')}</option>
            </select>
          </div>
        </div>

        {/* Active filter chips */}
        {totalActiveFilters > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {selectedSizes.map((s) => (
              <button
                key={s}
                onClick={() => toggleSize(s)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-ivory-100 border border-stone-200 text-xs text-ink-700 hover:border-ink-900 transition-colors"
              >
                {s} <X size={11} />
              </button>
            ))}
            {selectedColors.map((c) => (
              <button
                key={c}
                onClick={() => toggleColor(c)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-ivory-100 border border-stone-200 text-xs text-ink-700 hover:border-ink-900 transition-colors"
              >
                {c} <X size={11} />
              </button>
            ))}
            {selectedAges.map((a) => (
              <button
                key={a}
                onClick={() => toggleAge(a)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-ivory-100 border border-stone-200 text-xs text-ink-700 hover:border-ink-900 transition-colors"
              >
                {a} <X size={11} />
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-10">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-ivory-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-10">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-stone-500 text-lg font-serif">{t('shop.noProducts')}</p>
          </div>
        )}
      </div>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setShowFilters(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute top-0 right-0 bottom-0 w-80 bg-ivory-50 p-6 overflow-y-auto animate-slide-down"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif text-ink-800">{t('shop.filters')}</h3>
              <button onClick={() => setShowFilters(false)} className="text-ink-500 hover:text-ink-700">
                <X size={24} />
              </button>
            </div>
            <MobileFilters />
          </div>
        </div>
      )}
    </div>
  )
}
