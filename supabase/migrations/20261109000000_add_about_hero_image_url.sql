-- About page hero banner image (wide landscape). Falls back to a brand-verified
-- bundled image when empty. Same pattern as story_image_url (20260913130000).
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS about_hero_image_url text;

-- Re-expose the public subset including the new field.
CREATE OR REPLACE FUNCTION public.get_public_settings()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'logo_url', s.logo_url,
    'site_name', s.site_name,
    'phone', s.phone,
    'email', s.email,
    'address', s.address,
    'instagram_url', s.instagram_url,
    'facebook_url', s.facebook_url,
    'youtube_url', s.youtube_url,
    'twitter_url', s.twitter_url,
    'hero_image_url', s.hero_image_url,
    'hero_mobile_image_url', s.hero_mobile_image_url,
    'story_image_url', s.story_image_url,
    'about_hero_image_url', s.about_hero_image_url,
    'whatsapp_number', s.whatsapp_number,
    'telegram_bot_username', s.telegram_bot_username,
    'courier_provider', s.courier_provider
  )
  FROM site_settings s
  LIMIT 1
$$;
