-- Bangla display fields for products, categories and banners.
-- All columns are additive; display code falls back to the English value when NULL.
-- Idempotent: columns use IF NOT EXISTS, seeded values only fill rows where the
-- Bangla column is still NULL so admin edits are never clobbered on re-run.

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name_bn text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS name_bn text;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS title_bn text;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS subtitle_bn text;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS button_text_bn text;

-- Products: Bangla names (transliterated fashion terms, as used by BD storefronts)
UPDATE public.products AS p SET name_bn = v.bn
FROM (VALUES
  ('15c36e34-698e-4fab-afcb-c57ac7b452ed', 'ফ্লোরাল বেবি আউটফিট সেট'),
  ('2cc6529b-8a5b-4b88-b50e-d8ce54352603', 'কটন পপলিন শার্ট'),
  ('3399e664-ba8c-4d11-a40a-488ea18a910f', 'নরম কটন বেবি বডিস্যুট'),
  ('3bd3fb76-2873-467d-88c6-60bdaa6503cb', 'টেরাকোটা লিনেন স্কার্ফ'),
  ('42150e1a-31be-48ab-84f2-de2ab9416430', 'প্রতিদিনের ক্যানভাস টোট'),
  ('49593538-dd58-4bdf-9105-fb26cb34ccd4', 'প্রিমিয়াম ম্যাটারনিটি কুর্তি'),
  ('51833945-f782-43fd-859c-62f85015a3f3', 'রিবড নিট টপ'),
  ('599b93a4-d29e-4805-a415-9cae8bccb62c', 'ওভারসাইজড কটন টি-শার্ট'),
  ('92d55952-ca32-4cf0-b61a-1be22d7d36ea', 'মিডি স্লিপ ড্রেস'),
  ('c6ed97ea-e3f5-42a3-9241-c28e4df66041', 'আরামদায়ক বেবি স্লিপওয়্যার সেট'),
  ('cefb7ee8-94f3-4046-9dc5-572187196cd6', 'আরামদায়ক নার্সিং টপ'),
  ('d35ceb5e-4118-43e7-a9ad-bceb7f27b439', 'লিনেন র‍্যাপ ড্রেস'),
  ('d5a564cb-32c6-4c9d-87dd-63bb017fcfa7', 'এলিগেন্ট ম্যাটারনিটি ম্যাক্সি ড্রেস'),
  ('dddaf124-2c1a-4352-ad1e-54242fc90a5d', 'নরম মায়ের লাউঞ্জওয়্যার সেট'),
  ('f5c52f4e-db9d-48d8-b071-b9309aded95e', 'বেবি বিব ও মিটেন সেট'),
  ('fafeb2fd-5133-4f47-8aa9-1ed92ce91043', 'ওয়াইড-লেগ ট্রাউজার')
) AS v(id, bn)
WHERE p.id = v.id::uuid AND p.name_bn IS NULL;

-- Categories: Bangla names
UPDATE public.categories AS c SET name_bn = v.bn
FROM (VALUES
  ('079ac7b4-f876-4d9b-bd46-af193e9c08a3', 'ম্যাটারনিটি পোশাক'),
  ('2a96ba6e-c9d2-453f-9473-4dcfe1455bd1', 'টপস'),
  ('568a238c-9e97-44b1-9676-075148b51049', 'বডিস্যুট ও রম্পার'),
  ('5aa47e71-71ba-4942-b219-25944e3f69a9', 'ড্রেস'),
  ('70e558d3-a776-4527-863c-431c6d217ed0', 'মা'),
  ('75d57b22-ac51-4f8f-abf3-ca7ecd6fe0dd', 'বটমস'),
  ('908ee124-e5e7-4fd9-bdbe-d5d186cb1424', 'নার্সিং পোশাক'),
  ('a101c6f3-19a4-46b8-987f-36b12a908534', 'এক্সেসরিজ'),
  ('a38070e1-09d7-4c7c-8a42-c4ee8af852a7', 'আউটফিট ও সেট'),
  ('b6733014-6315-4c61-b473-581f03f11305', 'লাউঞ্জওয়্যার'),
  ('c10e4f9e-1279-41d1-b9dd-6e87238ca6c0', 'বেবি'),
  ('d0178678-043f-4a25-ab9d-c169f9b2652f', 'স্লিপওয়্যার'),
  ('f13854e1-1ee3-4007-8025-6de7b1e12ab2', 'এক্সেসরিজ'),
  ('f7a520b3-febe-4de1-99f6-533b1c772f07', 'মহিলাদের পোশাক')
) AS v(id, bn)
WHERE c.id = v.id::uuid AND c.name_bn IS NULL;

-- Banners: Bangla title / subtitle / button text
UPDATE public.banners SET
  title_bn = 'সামার সেল',
  subtitle_bn = 'নির্বাচিত পণ্যে ৩০% পর্যন্ত ছাড়',
  button_text_bn = 'অফার দেখুন'
WHERE id = '22a41745-35d0-4ca2-9e72-d11d0559bff7' AND title_bn IS NULL;

UPDATE public.banners SET
  title_bn = 'নতুন এসেছে',
  subtitle_bn = 'বেবি ও মায়েদের জন্য আমাদের সর্বশেষ কালেকশন',
  button_text_bn = 'এখনই কিনুন'
WHERE id = 'ee7199b9-fb43-407b-8420-8de29a64ca04' AND title_bn IS NULL;
