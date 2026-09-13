import { Link, useNavigate } from 'react-router-dom'
import { Heart, Star } from 'lucide-react'
import { supabase, type Product } from '../lib/supabase'
import { formatBDT } from '../lib/constants'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useState, useEffect } from 'react'

export default function ProductCard({ product }: { product: Product }) {
  const { t, pick } = useLanguage()
  const { addToCart } = useCart()
  const { session } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [adding, setAdding] = useState(false)
  const [inWishlist, setInWishlist] = useState(false)
  const [rating, setRating] = useState<{ avg: number; count: number } | null>(null)

  useEffect(() => {
    supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', product.id)
      .eq('is_approved', true)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const avg = data.reduce((s, r) => s + r.rating, 0) / data.length
          setRating({ avg, count: data.length })
        }
      })
  }, [product.id])

  useEffect(() => {
    if (!session?.user) {
      setInWishlist(false)
      return
    }
    supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('product_id', product.id)
      .maybeSingle()
      .then(({ data }) => setInWishlist(!!data))
  }, [session?.user?.id, product.id])

  const minPrice = product.variants?.length
    ? Math.min(...product.variants.map((v) => v.price))
    : 0
  const minCompare = product.variants?.length
    ? Math.min(...product.variants.filter((v) => v.compare_at_price).map((v) => v.compare_at_price!)) || 0
    : 0
  const totalStock = product.variants?.reduce((sum, v) => sum + v.stock_quantity, 0) ?? 0
  const isLowStock = totalStock > 0 && totalStock <= 5
  const isOutOfStock = totalStock === 0
  const hasDiscount = minCompare > minPrice

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!product.variants?.length || isOutOfStock) return
    setAdding(true)
    const firstVariant = product.variants[0]
    await addToCart(firstVariant.id, 1)
    showToast(t('common.addedToCart'), 'success')
    setAdding(false)
  }

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!product.variants?.length || isOutOfStock) return
    const firstVariant = product.variants[0]
    await addToCart(firstVariant.id, 1)
    navigate('/cart')
  }

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!session?.user) {
      showToast(t('product.loginToWishlist'), 'info')
      navigate('/login')
      return
    }
    try {
      if (inWishlist) {
        const { error } = await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', session.user.id)
          .eq('product_id', product.id)
        if (error) throw error
        setInWishlist(false)
        showToast(t('product.removedFromWishlist'), 'info')
      } else {
        const { error } = await supabase
          .from('wishlists')
          .insert({ user_id: session.user.id, product_id: product.id })
        if (error) throw error
        setInWishlist(true)
        showToast(t('product.addedToWishlist'), 'success')
      }
    } catch {
      showToast(t('product.wishlistError'), 'error')
    }
  }

  const image = product.images?.[0] ?? 'https://images.pexels.com/photos/307009/pexels-photo-307009.jpeg'

  return (
    <Link to={`/product/${product.slug}`} className="group block">
      <div className="bg-ivory-200 rounded-[20px] sm:rounded-[28px] border border-stone-200 overflow-hidden transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-card flex flex-col">
        <div className="relative aspect-[4/4.6] overflow-hidden bg-ivory-100">
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.07]"
            loading="lazy"
          />

          {/* Corner ribbons */}
          {hasDiscount && <span className="ribbon ribbon--tr ribbon--sale">{t('product.sale')}</span>}
          {product.is_featured && <span className="ribbon ribbon--tl ribbon--featured">{t('product.badgeFeatured')}</span>}
          {isLowStock && !isOutOfStock && (
            <span
              className={`absolute left-3.5 font-mono text-[9px] tracking-[0.16em] uppercase bg-ivory-50 border border-stone-300 text-ink-600 rounded-full px-2.5 py-1 ${
                product.is_featured ? 'top-[62px] sm:top-[66px]' : 'top-3.5'
              }`}
            >
              {t('product.lowStockBadge')}
            </span>
          )}

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className={`absolute right-3.5 ${hasDiscount ? 'top-[60px] sm:top-[64px]' : 'top-3.5'} w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              inWishlist
                ? 'bg-champagne-500 text-ink-900'
                : 'bg-ivory-50/90 border border-stone-300 text-ink-600 hover:border-champagne-500 hover:text-champagne-600'
            }`}
            aria-label={inWishlist ? t('product.removeWishlist') : t('product.addWishlist')}
          >
            <Heart size={15} className={inWishlist ? 'fill-current' : ''} />
          </button>

          {isOutOfStock ? (
            <div className="absolute inset-0 bg-ivory-50/50 flex items-center justify-center">
              <span className="bg-ink-900 text-ivory-50 font-mono text-[10px] tracking-[0.16em] uppercase px-4 py-2 rounded-full">
                {t('product.outOfStock')}
              </span>
            </div>
          ) : (
            <button
              onClick={handleQuickAdd}
              disabled={adding}
              className="absolute right-3.5 bottom-3.5 font-mono text-[10px] tracking-[0.14em] uppercase bg-ink-900 text-ivory-50 rounded-full px-4 py-2.5 opacity-100 md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-300 hover:bg-champagne-500 hover:text-ink-900 disabled:opacity-50"
            >
              {adding ? t('product.adding') : t('product.addWithPrice', { price: formatBDT(minPrice) })}
            </button>
          )}
        </div>

        <div className="px-3.5 sm:px-5 pt-3.5 sm:pt-4 pb-4 sm:pb-5 flex flex-col gap-2 flex-1">
          <div className="min-w-0">
            <h3 className="font-serif font-bold text-[15px] sm:text-lg tracking-[0.01em] text-ink-900 leading-snug break-words">
              {pick(product.name, product.name_bn)}
            </h3>
            <p className="font-mono text-[9px] sm:text-[10px] tracking-[0.16em] uppercase text-ink-600 mt-0.5 truncate">
              {pick(product.category?.name ?? 'Nuhani', product.category?.name_bn)}
            </p>
            {rating && (
              <div className="flex items-center gap-1 mt-1.5">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={11}
                      className={n <= Math.round(rating.avg) ? 'fill-champagne-500 text-champagne-500' : 'text-stone-300'}
                    />
                  ))}
                </div>
                <span className="font-mono text-[10px] text-ink-500">({rating.count})</span>
              </div>
            )}
          </div>
          <div className="mt-auto flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <span className="font-mono font-bold text-sm sm:text-base text-ink-900 whitespace-nowrap">{formatBDT(minPrice)}</span>
              {hasDiscount && (
                <span className="ml-1.5 font-mono text-[10px] sm:text-[11px] text-ink-400 line-through whitespace-nowrap">
                  {formatBDT(minCompare)}
                </span>
              )}
            </div>
            {!isOutOfStock && (
              <button
                onClick={handleBuyNow}
                className="font-semibold text-[12px] text-ink-600 hover:text-champagne-600 transition-colors inline-flex items-center gap-1 shrink-0"
              >
                {t('product.buyNow')} <span aria-hidden="true">→</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
