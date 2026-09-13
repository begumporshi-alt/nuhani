import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, Heart, MapPin, User as UserIcon, LogOut, ChevronRight, Truck, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase, type Order, type Address, type Product, type Wishlist as WishlistType } from '../lib/supabase'
import { formatBDT, districtName } from '../lib/constants'
import { useLanguage } from '../contexts/LanguageContext'

type Tab = 'orders' | 'profile' | 'addresses' | 'wishlist'

export default function Account() {
  const { session, profile, signOut, refreshProfile } = useAuth()
  const { t, pick, lang } = useLanguage()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [wishlistItems, setWishlistItems] = useState<WishlistType[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProfile, setEditingProfile] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')

  useEffect(() => {
    async function load() {
      if (!session) return
      const [ordersRes, addrRes, wishRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*, order_items:order_items(*)')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('addresses')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('wishlists')
          .select('*, product:products(*, category:categories(*), variants:product_variants(*))')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false }),
      ])
      setOrders((ordersRes.data as Order[]) ?? [])
      setAddresses((addrRes.data as Address[]) ?? [])
      setWishlistItems((wishRes.data as WishlistType[]) ?? [])
      setLoading(false)
    }
    load()
  }, [session])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const handleSaveProfile = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone })
      .eq('id', session!.user.id)
    if (error) {
      showToast(t('account.updateFailed'), 'error')
    } else {
      showToast(t('account.updated'), 'success')
      await refreshProfile()
      setEditingProfile(false)
    }
  }

  const tabs: { key: Tab; label: string; icon: typeof Package }[] = [
    { key: 'orders', label: t('account.tabOrders'), icon: Package },
    { key: 'profile', label: t('account.tabProfile'), icon: UserIcon },
    { key: 'addresses', label: t('account.tabAddresses'), icon: MapPin },
    { key: 'wishlist', label: t('account.tabWishlist'), icon: Heart },
  ]

  const statusLabels: Record<string, string> = {
    pending: t('account.statusPending'),
    processing: t('account.statusProcessing'),
    shipped: t('account.statusShipped'),
    delivered: t('account.statusDelivered'),
    cancelled: t('account.statusCancelled'),
  }

  const statusIcons: Record<string, typeof Package> = {
    pending: Package,
    processing: Package,
    shipped: Truck,
    delivered: CheckCircle,
  }

  return (
    <div className="section-padding py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-ink-800">{t('account.title')}</h1>
          <p className="text-ink-400 text-sm mt-1">{session?.user.email}</p>
        </div>
        <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-ink-500 hover:text-red-500 transition-colors">
          <LogOut size={16} /> {t('account.signOut')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="flex lg:flex-col gap-2 overflow-x-auto scrollbar-hide">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all whitespace-nowrap ${
                  tab === t.key ? 'bg-ink-700 text-ivory-50' : 'text-ink-600 hover:bg-ivory-100'
                }`}
              >
                <t.icon size={18} /> {t.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Orders */}
          {tab === 'orders' && (
            <div>
              <h2 className="text-xl font-serif text-ink-800 mb-4">{t('account.orderHistory')}</h2>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-24 bg-ivory-100 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const StatusIcon = statusIcons[order.status] ?? Package
                    return (
                      <Link
                        to={`/order-confirmation/${order.order_number}`}
                        key={order.id}
                        className="card p-5 flex items-center justify-between hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-mink-100 flex items-center justify-center">
                            <StatusIcon size={20} className="text-ink-600" />
                          </div>
                          <div>
                            <p className="font-medium text-ink-800">#{order.order_number}</p>
                            <p className="text-sm text-ink-400">
                              {new Date(order.created_at).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                            <span className={`text-xs font-medium capitalize mt-0.5 inline-block ${
                              order.status === 'delivered' ? 'text-green-600' :
                              order.status === 'shipped' ? 'text-blue-600' :
                              order.status === 'cancelled' ? 'text-red-500' : 'text-amber-600'
                            }`}>
                              {statusLabels[order.status] ?? order.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-ink-700">{formatBDT(order.total_amount)}</p>
                          <p className="text-xs text-ink-400">{t('account.itemCount', { n: order.order_items?.length ?? 0 })}</p>
                        </div>
                        <ChevronRight size={18} className="text-ink-300 ml-2" />
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package size={48} className="text-stone-300 mx-auto mb-4" />
                  <p className="text-ink-400 mb-4">{t('account.noOrders')}</p>
                  <Link to="/shop" className="btn-primary">{t('cart.startShopping')}</Link>
                </div>
              )}
            </div>
          )}

          {/* Profile */}
          {tab === 'profile' && (
            <div className="card p-6">
              <h2 className="text-xl font-serif text-ink-800 mb-4">{t('account.profileSettings')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-ink-600 mb-1.5 block">{t('checkout.fullName')}</label>
                  <input
                    type="text"
                    value={editingProfile ? fullName : (profile?.full_name ?? '')}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={!editingProfile}
                    className="input-field disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="text-sm text-ink-600 mb-1.5 block">{t('checkout.phone')}</label>
                  <input
                    type="tel"
                    value={editingProfile ? phone : (profile?.phone ?? '')}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!editingProfile}
                    className="input-field disabled:opacity-60"
                    placeholder="01XXXXXXXXX"
                  />
                </div>
                <div>
                  <label className="text-sm text-ink-600 mb-1.5 block">{t('checkout.email')}</label>
                  <input
                    type="email"
                    value={session?.user.email ?? ''}
                    disabled
                    className="input-field opacity-60"
                  />
                </div>
                {editingProfile ? (
                  <div className="flex gap-3">
                    <button onClick={handleSaveProfile} className="btn-primary">{t('account.saveChanges')}</button>
                    <button onClick={() => { setEditingProfile(false); setFullName(profile?.full_name ?? ''); setPhone(profile?.phone ?? '') }} className="btn-outline">{t('common.cancel')}</button>
                  </div>
                ) : (
                  <button onClick={() => setEditingProfile(true)} className="btn-secondary">{t('account.editProfile')}</button>
                )}
              </div>
            </div>
          )}

          {/* Addresses */}
          {tab === 'addresses' && (
            <div>
              <h2 className="text-xl font-serif text-ink-800 mb-4">{t('account.savedAddresses')}</h2>
              {addresses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div key={addr.id} className="card p-5">
                      {addr.is_default && <span className="badge bg-mink-100 text-ink-700 mb-2">{t('account.defaultBadge')}</span>}
                      <p className="font-medium text-ink-800">{addr.full_name}</p>
                      <p className="text-sm text-ink-500 mt-1">{addr.address_line1}</p>
                      {addr.address_line2 && <p className="text-sm text-ink-500">{addr.address_line2}</p>}
                      <p className="text-sm text-ink-500">{addr.city}, {addr.district ? districtName(addr.district, lang) : ''}</p>
                      <p className="text-sm text-ink-500">{addr.phone}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MapPin size={48} className="text-stone-300 mx-auto mb-4" />
                  <p className="text-ink-400">{t('account.noAddresses')}</p>
                </div>
              )}
            </div>
          )}

          {/* Wishlist */}
          {tab === 'wishlist' && (
            <div>
              <h2 className="text-xl font-serif text-ink-800 mb-4">{t('account.myWishlist')}</h2>
              {wishlistItems.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {wishlistItems.map((item) => (
                    <Link key={item.id} to={`/product/${(item.product as Product)?.slug ?? ''}`} className="card group block">
                      <div className="relative aspect-[4/5] overflow-hidden bg-ivory-100 rounded-t-2xl">
                        <img src={(item.product as Product)?.images?.[0] ?? 'https://images.pexels.com/photos/7679723/pexels-photo-7679723.jpeg'} alt={(item.product as Product)?.name ?? ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="p-3">
                        <h3 className="font-serif text-sm text-ink-800 line-clamp-1">{pick((item.product as Product)?.name, (item.product as Product)?.name_bn)}</h3>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Heart size={48} className="text-stone-300 mx-auto mb-4" />
                  <p className="text-ink-400 mb-4">{t('account.wishlistEmpty')}</p>
                  <Link to="/shop" className="btn-primary">{t('account.browseProducts')}</Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
