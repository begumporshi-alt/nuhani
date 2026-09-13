import { useEffect, useState } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { CircleCheck as CheckCircle, Package, Truck, Chrome as HomeIcon, Clock, ShieldCheck, CircleAlert as AlertCircle, Phone, Send } from 'lucide-react'
import { supabase, type Order } from '../lib/supabase'
import { formatBDT, districtName } from '../lib/constants'
import { useLanguage } from '../contexts/LanguageContext'

export default function OrderConfirmation() {
  const { t, lang } = useLanguage()
  const { orderNumber } = useParams()
  const [searchParams] = useSearchParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [needPhone, setNeedPhone] = useState(false)
  const [phoneInput, setPhoneInput] = useState('')
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [telegramBot, setTelegramBot] = useState<string | null>(null)

  const paymentResult = searchParams.get('payment')

  async function loadOrder(phone?: string) {
    setLoading(true)
    setPhoneError(null)

    // 1. Direct read — works for the order's owner and admins (RLS-scoped)
    const { data } = await supabase
      .from('orders')
      .select('*, order_items:order_items(*)')
      .eq('order_number', orderNumber)
      .maybeSingle()
    if (data) {
      setOrder(data as Order)
      setLoading(false)
      return
    }

    // 2. Guest lookup — order number + the phone used at checkout
    const phoneToTry = phone ?? sessionStorage.getItem('nuhani_order_phone')
    if (!phoneToTry) {
      setNeedPhone(true)
      setLoading(false)
      return
    }

    const { data: guestData } = await supabase.rpc('get_guest_order', {
      p_order_number: orderNumber,
      p_phone: phoneToTry,
    })
    const guest = guestData as { order?: Order; items?: Order['order_items'] } | null
    if (guest?.order) {
      setOrder({ ...guest.order, order_items: guest.items })
      setNeedPhone(false)
    } else {
      setOrder(null)
      setNeedPhone(true)
      if (phone) setPhoneError(t('order.phoneError'))
    }
    setLoading(false)
  }

  useEffect(() => {
    if (orderNumber) loadOrder()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber])

  useEffect(() => {
    supabase.rpc('get_public_settings').then(({ data }) => {
      const settings = data as { telegram_bot_username?: string | null } | null
      if (settings?.telegram_bot_username) {
        setTelegramBot(settings.telegram_bot_username)
      }
    })
  }, [])

  if (loading) {
    return (
      <div className="section-padding py-20 text-center">
        <div className="w-8 h-8 border-2 border-mink-300 border-t-ink-700 rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  if (needPhone) {
    return (
      <div className="section-padding py-20 max-w-md mx-auto text-center">
        <h1 className="text-2xl font-serif text-ink-800 mb-2">{t('order.findOrder')}</h1>
        <p className="text-sm text-ink-500 mb-6">
          {t('order.phonePromptPre')}<span className="font-medium text-ink-700">#{orderNumber}</span>{t('order.phonePromptPost')}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (phoneInput.trim()) loadOrder(phoneInput.trim())
          }}
        >
          <input
            type="tel"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="01XXXXXXXXX"
            className="input-field mb-3"
            autoFocus
          />
          {phoneError && <p className="text-sm text-red-600 mb-3">{phoneError}</p>}
          <button type="submit" className="btn-primary w-full">{t('order.viewOrder')}</button>
        </form>
        <Link to="/" className="inline-block mt-6 text-sm text-ink-500 hover:text-ink-700 underline underline-offset-4">
          {t('common.backHome')}
        </Link>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="section-padding py-20 text-center">
        <h1 className="text-2xl font-serif text-ink-800 mb-4">{t('order.notFound')}</h1>
        <Link to="/" className="btn-primary">{t('common.backHome')}</Link>
      </div>
    )
  }

  const isPaid = order.payment_status === 'paid' || paymentResult === 'success'
  const isCOD = order.payment_method === 'cod'
  const isPaymentFailed = paymentResult === 'failed' || order.payment_status === 'failed'

  const steps = [
    { icon: CheckCircle, label: t('order.stepPlaced'), done: true },
    { icon: Package, label: t('order.stepProcessing'), done: isPaid || isCOD },
    { icon: Truck, label: t('order.stepShipped'), done: false },
    { icon: HomeIcon, label: t('order.stepDelivered'), done: false },
  ]

  const payLabel = (m: string | null | undefined): string => {
    if (!m) return ''
    if (m === 'cod') return t('checkout.payCod')
    if (m === 'bkash') return t('checkout.payBkash')
    if (m === 'card') return t('checkout.payCard')
    return m.charAt(0).toUpperCase() + m.slice(1)
  }

  return (
    <div className="section-padding py-12 max-w-2xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isPaymentFailed ? 'bg-red-100' : 'bg-green-100'}`}>
          {isPaymentFailed ? <AlertCircle size={40} className="text-red-600" /> : <CheckCircle size={40} className="text-green-600" />}
        </div>
        <h1 className="text-3xl font-serif text-ink-800 mb-2">
          {isPaymentFailed ? t('order.paymentFailed') : t('order.thankYou')}
        </h1>
        <p className="text-ink-500">
          {isPaymentFailed
            ? t('order.paymentFailedDesc')
            : t('order.placedSuccessfully')}
        </p>
        <p className="text-ink-700 font-medium mt-2">{t('order.number', { n: order.order_number })}</p>
      </div>

      {/* Payment status banner */}
      {isPaymentFailed && (
        <div className="card p-4 mb-6 bg-red-50 border border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-red-600 shrink-0" />
            <div className="text-sm text-red-700">
              <p className="font-medium">{t('order.paymentFailed')}</p>
              <p>{t('order.paymentPendingNote')}</p>
            </div>
          </div>
        </div>
      )}

      {/* COD verification status */}
      {isCOD && !isPaymentFailed && (
        <div className={`card p-4 mb-6 ${order.cod_verified ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
          <div className="flex items-center gap-3">
            {order.cod_verified ? (
              <ShieldCheck size={20} className="text-green-600 shrink-0" />
            ) : (
              <Clock size={20} className="text-amber-600 shrink-0" />
            )}
            <div className="text-sm">
              <p className={`font-medium ${order.cod_verified ? 'text-green-700' : 'text-amber-700'}`}>
                {order.cod_verified ? t('order.verified') : t('order.pendingVerification')}
              </p>
              <p className={order.cod_verified ? 'text-green-600' : 'text-amber-600'}>
                {order.cod_verified
                  ? t('order.verifiedDesc')
                  : t('order.codNote')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Online payment success */}
      {isPaid && !isCOD && !isPaymentFailed && (
        <div className="card p-4 mb-6 bg-green-50 border border-green-200">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-green-600 shrink-0" />
            <div className="text-sm text-green-700">
              <p className="font-medium">{t('order.paymentConfirmed')}</p>
              <p>{t('order.paidVia', { price: formatBDT(order.total_amount), method: payLabel(order.payment_gateway ?? order.payment_method) })}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Steps */}
      <div className="flex justify-between mb-10 px-4">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                step.done ? 'bg-green-500 text-white' : 'bg-ivory-200 text-ink-300'
              }`}
            >
              <step.icon size={20} />
            </div>
            <span className={`text-xs ${step.done ? 'text-ink-700 font-medium' : 'text-ink-400'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Order Details */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-serif text-ink-800 mb-4">{t('order.details')}</h2>
        <div className="space-y-3">
          {order.order_items?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <div>
                <p className="text-ink-700 font-medium">{item.product_name}</p>
                <p className="text-ink-400 text-xs">
                  {t('order.qty', { n: item.quantity })}
                  {item.variant_details && (item.variant_details as Record<string, string>).size && ` · ${t('order.sizeLabel', { v: (item.variant_details as Record<string, string>).size })}`}
                </p>
              </div>
              <span className="text-ink-700 font-medium">{formatBDT(item.total_price)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-stone-200 mt-4 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-ink-600">
            <span>{t('cart.subtotal')}</span>
            <span>{formatBDT(order.subtotal)}</span>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>{t('cart.discount')}</span>
              <span>-{formatBDT(order.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between text-ink-600">
            <span>{t('cart.shipping')}</span>
            <span>{order.shipping_amount === 0 ? t('checkout.free') : formatBDT(order.shipping_amount)}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold text-ink-800 border-t border-stone-200 pt-2">
            <span>{t('cart.total')}</span>
            <span>{formatBDT(order.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-serif text-ink-800 mb-3">{t('checkout.shippingAddress')}</h2>
        <div className="text-sm text-ink-500">
          {(() => {
            const addr = order.shipping_address as Record<string, string>
            return (
              <>
                <p className="font-medium text-ink-700">{addr?.full_name}</p>
                <p>{addr?.address_line1}</p>
                {addr?.address_line2 && <p>{addr.address_line2}</p>}
                <p>{addr?.city}, {addr?.district ? districtName(addr.district, lang) : ''}</p>
                <p>{addr?.phone}</p>
              </>
            )
          })()}
        </div>
      </div>

      {/* Payment Info */}
      <div className="card p-6 mb-8">
        <h2 className="text-lg font-serif text-ink-800 mb-3">{t('checkout.payment')}</h2>
        <div className="flex justify-between text-sm">
          <span className="text-ink-600">{payLabel(order.payment_method)}</span>
          <span className={`font-medium ${isPaid ? 'text-green-600' : isPaymentFailed ? 'text-red-600' : 'text-amber-600'}`}>
            {isPaid ? t('order.paid') : isPaymentFailed ? t('order.failed') : t('order.pending')}
          </span>
        </div>
        {isCOD && !order.cod_verified && (
          <div className="flex items-center gap-2 mt-3 text-xs text-amber-600">
            <Phone size={14} />
            <span>{t('order.verificationCall', { phone: order.guest_phone ?? '—' })}</span>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <Link to="/shop" className="btn-primary flex-1 text-center">{t('cart.continueShopping')}</Link>
        {order.user_id && <Link to="/account" className="btn-outline flex-1 text-center">{t('order.viewOrders')}</Link>}
      </div>

      {telegramBot && (
        <a
          href={`https://t.me/${telegramBot}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex items-center justify-center gap-2 w-full py-3 rounded-full bg-[#229ED9] text-white text-sm font-medium hover:bg-[#1d8ec2] transition-colors"
        >
          <Send size={16} />
          {t('order.trackTelegram')}
        </a>
      )}
    </div>
  )
}
