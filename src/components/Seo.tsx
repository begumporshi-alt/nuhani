import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'Nuhani'
const SITE_URL = 'https://nuhani.com'
const DEFAULT_IMAGE = 'https://ixgapnhajpaxjuysioxn.supabase.co/storage/v1/object/public/product-images/brand/og-image.jpg'
const DEFAULT_DESCRIPTION =
  'Nuhani — considered clothing from Bangladesh. Premium fabrics, honest pricing, nationwide delivery.'

interface SeoProps {
  title?: string
  description?: string
  image?: string
  /** Path only, e.g. "/shop" or "/product/some-slug" */
  path?: string
  type?: 'website' | 'product' | 'article'
  /** Optional JSON-LD structured data object */
  jsonLd?: Record<string, unknown>
  noindex?: boolean
}

export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  path = '',
  type = 'website',
  jsonLd,
  noindex = false,
}: SeoProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Clothing with quiet confidence`
  const canonical = `${SITE_URL}${path}`

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  )
}
