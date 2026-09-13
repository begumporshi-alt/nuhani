export const BD_DISTRICTS: { district: string; division: string }[] = [
  { district: 'Dhaka', division: 'Dhaka' },
  { district: 'Chittagong', division: 'Chittagong' },
  { district: 'Khulna', division: 'Khulna' },
  { district: 'Rajshahi', division: 'Rajshahi' },
  { district: 'Sylhet', division: 'Sylhet' },
  { district: 'Barisal', division: 'Barisal' },
  { district: 'Rangpur', division: 'Rangpur' },
  { district: 'Mymensingh', division: 'Mymensingh' },
  { district: 'Comilla', division: 'Chittagong' },
  { district: 'Narayanganj', division: 'Dhaka' },
  { district: 'Gazipur', division: 'Dhaka' },
  { district: 'Narsingdi', division: 'Dhaka' },
  { district: 'Manikganj', division: 'Dhaka' },
  { district: 'Munshiganj', division: 'Dhaka' },
  { district: 'Faridpur', division: 'Dhaka' },
  { district: 'Madaripur', division: 'Dhaka' },
  { district: 'Gopalganj', division: 'Dhaka' },
  { district: 'Tangail', division: 'Dhaka' },
  { district: 'Kishoreganj', division: 'Dhaka' },
  { district: 'Sherpur', division: 'Mymensingh' },
  { district: 'Jamalpur', division: 'Mymensingh' },
  { district: 'Netrokona', division: 'Mymensingh' },
  { district: 'Bogra', division: 'Rajshahi' },
  { district: 'Pabna', division: 'Rajshahi' },
  { district: 'Sirajganj', division: 'Rajshahi' },
  { district: 'Natore', division: 'Rajshahi' },
  { district: 'Nawabganj', division: 'Rajshahi' },
  { district: 'Naogaon', division: 'Rajshahi' },
  { district: 'Joypurhat', division: 'Rajshahi' },
  { district: 'Dinajpur', division: 'Rangpur' },
  { district: 'Thakurgaon', division: 'Rangpur' },
  { district: 'Panchagarh', division: 'Rangpur' },
  { district: 'Nilphamari', division: 'Rangpur' },
  { district: 'Kurigram', division: 'Rangpur' },
  { district: 'Lalmonirhat', division: 'Rangpur' },
  { district: 'Gaibandha', division: 'Rangpur' },
  { district: 'Jashore', division: 'Khulna' },
  { district: 'Satkhira', division: 'Khulna' },
  { district: 'Magura', division: 'Khulna' },
  { district: 'Narail', division: 'Khulna' },
  { district: 'Jhenaidah', division: 'Khulna' },
  { district: 'Chuadanga', division: 'Khulna' },
  { district: 'Kushtia', division: 'Khulna' },
  { district: 'Meherpur', division: 'Khulna' },
  { district: 'Bagerhat', division: 'Khulna' },
  { district: 'Jhalokati', division: 'Barisal' },
  { district: 'Patuakhali', division: 'Barisal' },
  { district: 'Pirojpur', division: 'Barisal' },
  { district: 'Barguna', division: 'Barisal' },
  { district: 'Bhola', division: 'Barisal' },
  { district: 'Habiganj', division: 'Sylhet' },
  { district: 'Moulvibazar', division: 'Sylhet' },
  { district: 'Sunamganj', division: 'Sylhet' },
  { district: 'Cox\'s Bazar', division: 'Chittagong' },
  { district: 'Feni', division: 'Chittagong' },
  { district: 'Brahmanbaria', division: 'Chittagong' },
  { district: 'Chandpur', division: 'Chittagong' },
  { district: 'Noakhali', division: 'Chittagong' },
  { district: 'Lakshmipur', division: 'Chittagong' },
  { district: 'Rangamati', division: 'Chittagong' },
  { district: 'Khagrachari', division: 'Chittagong' },
  { district: 'Bandarban', division: 'Chittagong' },
]

export const SHIPPING_RATES: Record<string, number> = {
  Dhaka: 60,
  'Narayanganj': 60,
  'Gazipur': 60,
  'Narsingdi': 60,
  'Manikganj': 80,
  'Munshiganj': 80,
  'Tangail': 80,
  'Kishoreganj': 80,
  'Faridpur': 100,
  'Madaripur': 100,
  'Gopalganj': 100,
}

export function getShippingCost(district: string): number {
  if (SHIPPING_RATES[district] !== undefined) return SHIPPING_RATES[district]
  return 120
}

export const FREE_SHIPPING_THRESHOLD = 3000

export const PAYMENT_METHODS = [
  { id: 'bkash', name: 'bKash', description: 'Pay with bKash mobile wallet', icon: '📱' },
  // Nagad disabled: the gateway's encrypted checkout flow is not implemented yet.
  // Re-enable after finishing the nagad branch in supabase/functions/payment-gateway.
  // { id: 'nagad', name: 'Nagad', description: 'Pay with Nagad mobile wallet', icon: '💰' },
  { id: 'card', name: 'Card', description: 'Visa / Mastercard / Amex', icon: '💳' },
  { id: 'cod', name: 'Cash on Delivery', description: 'Pay when you receive your order', icon: '🚚' },
] as const

export function formatBDT(amount: number): string {
  return '৳' + amount.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// Bangla display names for districts/divisions. DB and shipping rates stay keyed
// by the English names above — these are only for rendering in Bangla mode.
export const DISTRICT_NAMES_BN: Record<string, string> = {
  Dhaka: 'ঢাকা',
  Chittagong: 'চট্টগ্রাম',
  Khulna: 'খুলনা',
  Rajshahi: 'রাজশাহী',
  Sylhet: 'সিলেট',
  Barisal: 'বরিশাল',
  Rangpur: 'রংপুর',
  Mymensingh: 'ময়মনসিংহ',
  Comilla: 'কুমিল্লা',
  Narayanganj: 'নারায়ণগঞ্জ',
  Gazipur: 'গাজীপুর',
  Narsingdi: 'নরসিংদী',
  Manikganj: 'মানিকগঞ্জ',
  Munshiganj: 'মুন্সিগঞ্জ',
  Faridpur: 'ফরিদপুর',
  Madaripur: 'মাদারীপুর',
  Gopalganj: 'গোপালগঞ্জ',
  Tangail: 'টাঙ্গাইল',
  Kishoreganj: 'কিশোরগঞ্জ',
  Sherpur: 'শেরপুর',
  Jamalpur: 'জামালপুর',
  Netrokona: 'নেত্রকোণা',
  Bogra: 'বগুড়া',
  Pabna: 'পাবনা',
  Sirajganj: 'সিরাজগঞ্জ',
  Natore: 'নাটোর',
  Nawabganj: 'নবাবগঞ্জ',
  Naogaon: 'নওগাঁ',
  Joypurhat: 'জয়পুরহাট',
  Dinajpur: 'দিনাজপুর',
  Thakurgaon: 'ঠাকুরগাঁও',
  Panchagarh: 'পঞ্চগড়',
  Nilphamari: 'নীলফামারী',
  Kurigram: 'কুড়িগ্রাম',
  Lalmonirhat: 'লালমনিরহাট',
  Gaibandha: 'গাইবান্ধা',
  Jashore: 'যশোর',
  Satkhira: 'সাতক্ষীরা',
  Magura: 'মাগুরা',
  Narail: 'নড়াইল',
  Jhenaidah: 'ঝিনাইদহ',
  Chuadanga: 'চুয়াডাঙ্গা',
  Kushtia: 'কুষ্টিয়া',
  Meherpur: 'মেহেরপুর',
  Bagerhat: 'বাগেরহাট',
  Jhalokati: 'ঝালকাঠি',
  Patuakhali: 'পটুয়াখালী',
  Pirojpur: 'পিরোজপুর',
  Barguna: 'বরগুনা',
  Bhola: 'ভোলা',
  Habiganj: 'হবিগঞ্জ',
  Moulvibazar: 'মৌলভীবাজার',
  Sunamganj: 'সুনামগঞ্জ',
  "Cox's Bazar": 'কক্সবাজার',
  Feni: 'ফেনী',
  Brahmanbaria: 'ব্রাহ্মণবাড়িয়া',
  Chandpur: 'চাঁদপুর',
  Noakhali: 'নোয়াখালী',
  Lakshmipur: 'লক্ষ্মীপুর',
  Rangamati: 'রাঙ্গামাটি',
  Khagrachari: 'খাগড়াছড়ি',
  Bandarban: 'বান্দরবান',
}

export const DIVISION_NAMES_BN: Record<string, string> = {
  Dhaka: 'ঢাকা',
  Chittagong: 'চট্টগ্রাম',
  Khulna: 'খুলনা',
  Rajshahi: 'রাজশাহী',
  Sylhet: 'সিলেট',
  Barisal: 'বরিশাল',
  Rangpur: 'রংপুর',
  Mymensingh: 'ময়মনসিংহ',
}

export function districtName(district: string, lang: 'en' | 'bn'): string {
  if (lang === 'bn') return DISTRICT_NAMES_BN[district] ?? district
  return district
}

export function divisionName(division: string, lang: 'en' | 'bn'): string {
  if (lang === 'bn') return DIVISION_NAMES_BN[division] ?? division
  return division
}
