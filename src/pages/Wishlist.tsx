import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Trash2 } from 'lucide-react'
import { supabase, type Product, type Wishlist as WishlistType } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useLanguage } from '../contexts/LanguageContext'
import ProductCard from '../components/ProductCard'

export default function Wishlist() {
  const { session } = useAuth()
  const { showToast } = useToast()
  const { t } = useLanguage()
  const [items, setItems] = useState<WishlistType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) { setLoading(false); return }
    load()
  }, [session])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('wishlists')
      .select('*, product:products(*, category:categories(*), variants:product_variants(*))')
      .eq('user_id', session!.user.id)
      .order('created_at', { ascending: false })
    setItems((data as WishlistType[]) ?? [])
    setLoading(false)
  }

  const handleRemove = async (productId: string) => {
    const { error } = await supabase.from('wishlists').delete().eq('user_id', session!.user.id).eq('product_id', productId)
    if (error) showToast(t('wishlist.removeFailed'), 'error')
    else { showToast(t('product.removedFromWishlist'), 'success'); await load() }
  }

  if (loading) {
    return (
      <div className="section-padding py-20 text-center">
        <div className="w-8 h-8 border-2 border-mink-300 border-t-ink-700 rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="section-padding py-20 text-center animate-fade-in">
        <Heart size={64} className="text-stone-300 mx-auto mb-6" />
        <h1 className="text-2xl font-serif text-ink-800 mb-3">{t('wishlist.title')}</h1>
        <p className="text-ink-400 mb-8">{t('wishlist.empty')}</p>
        <Link to="/shop" className="btn-primary">{t('wishlist.discover')}</Link>
      </div>
    )
  }

  return (
    <div className="section-padding py-8 animate-fade-in">
      <h1 className="text-3xl font-serif text-ink-800 mb-2">{t('wishlist.myTitle')}</h1>
      <p className="text-ink-400 text-sm mb-8">{t('wishlist.savedCount', { n: items.length })}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {items.map((item) => (
          <div key={item.id} className="relative">
            <ProductCard product={item.product as Product} />
            <button
              onClick={() => handleRemove(item.product_id)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-red-500 hover:text-white transition-all z-10"
              aria-label={t('product.removeWishlist')}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
