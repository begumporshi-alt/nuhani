/*
# Add Bags and Proshadhoni Categories with Seed Products

## Summary
Adds two new root categories — Bags (sort_order 3) and Proshadhoni (beauty products,
sort_order 4) — shown in the header menu alongside Womenswear (1) and Accessories (2),
plus seed products for both.

## New Data
1. **Categories**: Bags (slug `bags`), Proshadhoni (slug `proshadhoni`) — both root,
   active, name_bn left NULL so Bangla mode falls back to the English labels
   (client choice: Latin-script labels in both language modes).
2. **Products**: 4 bag products + 4 beauty products. Images are Pexels CDN URLs,
   curl-verified (HTTP 200) and vision-verified 2026-11-08 for subject match and
   modest-store appropriateness (product-only shots; one waist-down shot, legs covered).
3. **Product Variants**: One Size + color per product, BDT pricing, sequential SKUs.

## Important Notes
- Idempotent: ON CONFLICT (slug)/(sku) DO NOTHING — safe to re-run.
- Category image_url reuses the primary product photo (storefront does not render
  category.image_url; kept for admin completeness).
*/

-- ============================================================
-- CATEGORIES (root, after Womenswear=1 and Accessories=2)
-- ============================================================
INSERT INTO public.categories (name, slug, description, image_url, sort_order) VALUES
  ('Bags', 'bags', 'Everyday carry: handbags, totes, and crossbody bags that finish every outfit.', 'https://images.pexels.com/photos/5670/wood-fashion-black-stylish.jpg', 3),
  ('Proshadhoni', 'proshadhoni', 'Daily beauty essentials — lipsticks, palettes, and kits for a polished look.', 'https://images.pexels.com/photos/7256093/pexels-photo-7256093.jpeg', 4)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- PRODUCTS (Bags)
-- ============================================================
INSERT INTO public.products (name, slug, description, category_id, images, tags, is_featured, is_active) VALUES
  (
    'Classic Leather Shoulder Bag',
    'classic-leather-shoulder-bag',
    'A structured black leather shoulder bag with a flap-and-buckle closure and whipstitch detailing. Roomy enough for everyday, polished enough for occasions.',
    (SELECT id FROM public.categories WHERE slug = 'bags'),
    ARRAY['https://images.pexels.com/photos/5670/wood-fashion-black-stylish.jpg'],
    ARRAY['leather', 'black', 'everyday'],
    true, true
  ),
  (
    'Leather Crossbody Bag & Wallet Set',
    'leather-crossbody-wallet-set',
    'A brown leather crossbody bag with a matching wallet — the everyday set that goes with everything.',
    (SELECT id FROM public.categories WHERE slug = 'bags'),
    ARRAY['https://images.pexels.com/photos/167703/pexels-photo-167703.jpeg'],
    ARRAY['leather', 'crossbody', 'set'],
    false, true
  ),
  (
    'Slouchy Leather Tote',
    'slouchy-leather-tote',
    'A soft, slouchy leather tote with a wide strap. Carry it by hand or over the shoulder for a relaxed, put-together look.',
    (SELECT id FROM public.categories WHERE slug = 'bags'),
    ARRAY['https://images.pexels.com/photos/709845/pexels-photo-709845.jpeg'],
    ARRAY['leather', 'tote', 'brown'],
    false, true
  ),
  (
    'Floral Chain Sling Bag',
    'floral-chain-sling-bag',
    'A white bag with a blue floral print, stud detailing, and a silver chain strap — light, pretty, and easy to pair.',
    (SELECT id FROM public.categories WHERE slug = 'bags'),
    ARRAY['https://images.pexels.com/photos/904350/pexels-photo-904350.jpeg'],
    ARRAY['sling', 'floral', 'chain strap'],
    false, true
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- PRODUCTS (Proshadhoni — beauty)
-- ============================================================
INSERT INTO public.products (name, slug, description, category_id, images, tags, is_featured, is_active) VALUES
  (
    'Matte Lipstick Trio',
    'matte-lipstick-trio',
    'Three matte bullet lipsticks — terracotta, coral red, and soft pink — for everyday colour that stays put.',
    (SELECT id FROM public.categories WHERE slug = 'proshadhoni'),
    ARRAY['https://images.pexels.com/photos/7256093/pexels-photo-7256093.jpeg'],
    ARRAY['lipstick', 'matte', 'set'],
    true, true
  ),
  (
    'Liquid Lipstick Collection',
    'liquid-lipstick-collection',
    'Long-wear liquid lipsticks in pink and red shades — glossy finish, comfortable all-day wear.',
    (SELECT id FROM public.categories WHERE slug = 'proshadhoni'),
    ARRAY['https://images.pexels.com/photos/3373738/pexels-photo-3373738.jpeg'],
    ARRAY['liquid lipstick', 'pink', 'red'],
    false, true
  ),
  (
    'Everyday Makeup Kit',
    'everyday-makeup-kit',
    'Palette, compact, brushes, and lip colours in one kit — everything needed for a complete everyday look.',
    (SELECT id FROM public.categories WHERE slug = 'proshadhoni'),
    ARRAY['https://images.pexels.com/photos/2253832/pexels-photo-2253832.jpeg'],
    ARRAY['makeup', 'kit', 'gift'],
    false, true
  ),
  (
    '12-Shade Eyeshadow Palette',
    '12-shade-eyeshadow-palette',
    'A 12-shade palette mixing shimmer and matte finishes, with a built-in mirror and a soft applicator brush.',
    (SELECT id FROM public.categories WHERE slug = 'proshadhoni'),
    ARRAY['https://images.pexels.com/photos/4702570/pexels-photo-4702570.jpeg'],
    ARRAY['eyeshadow', 'palette', 'shimmer'],
    false, true
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- PRODUCT VARIANTS (One Size + color per product, BDT)
-- ============================================================
INSERT INTO public.product_variants (product_id, size, color, sku, price, compare_at_price, stock_quantity, is_active) VALUES
  ((SELECT id FROM public.products WHERE slug = 'classic-leather-shoulder-bag'), 'One Size', 'Black',  'BG-001-BLK', 1850, 2200, 12, true),
  ((SELECT id FROM public.products WHERE slug = 'leather-crossbody-wallet-set'), 'One Size', 'Brown',  'BG-002-BRN', 2450, 2900,  8, true),
  ((SELECT id FROM public.products WHERE slug = 'slouchy-leather-tote'), 'One Size', 'Brown',  'BG-003-BRN', 1950, 2400, 10, true),
  ((SELECT id FROM public.products WHERE slug = 'floral-chain-sling-bag'), 'One Size', 'White',  'BG-004-WHT', 1450, 1800, 14, true),
  ((SELECT id FROM public.products WHERE slug = 'matte-lipstick-trio'), 'One Size', 'Multi',  'PR-001-TRI',  650,  890, 30, true),
  ((SELECT id FROM public.products WHERE slug = 'liquid-lipstick-collection'), 'One Size', 'Assorted', 'PR-002-ASN',  950, 1250, 25, true),
  ((SELECT id FROM public.products WHERE slug = 'everyday-makeup-kit'), 'One Size', 'Assorted', 'PR-003-KIT', 2250, 2800, 10, true),
  ((SELECT id FROM public.products WHERE slug = '12-shade-eyeshadow-palette'), 'One Size', 'Multi',  'PR-004-MLT', 1100, 1400, 20, true)
ON CONFLICT (sku) DO NOTHING;
