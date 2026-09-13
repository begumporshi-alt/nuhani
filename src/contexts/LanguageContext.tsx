import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Language = 'en' | 'bn'

type Translations = {
  nav: {
    home: string
    baby: string
    mom: string
    shopAll: string
    about: string
    contact: string
    account: string
    admin: string
    adminDashboard: string
    shop: string
    wishlist: string
    cart: string
    menu: string
    switchLanguage: string
  }
  search: {
    placeholder: string
    searching: string
    suggestions: string
    viewAll: string
    noResults: string
  }
  home: {
    madeWithLove: string
    heroSubtitle: string
    shopCollection: string
    ourStory: string
    featured: string
    shopByCategory: string
    viewAll: string
    eyebrow: string
    heroTitleLine1: string
    heroTitleEm: string
    heroParagraph: string
    lovedAcross: string
    freeDelivery: string
    easyReturns: string
    altNewSeason: string
    newIn: string
    premiumFabrics: string
    madeInBD: string
    theCollection: string
    collectionLine1: string
    collectionEm: string
    collectionBatch: string
    seeFullCollection: string
    theEdit: string
    madeProperly: string
    madeForPre: string
    madeForPost: string
    goldenDays: string
    lifestyleParagraph: string
    statFabrics: string
    statDistricts: string
    statReturns: string
    findYourPiece: string
    justIn: string
    newArrivalsLine1: string
    newArrivalsEm: string
    newArrivalsLabel: string
    arrivingSoon: string
    beFirstToKnow: string
    altStudio: string
    est2026: string
    dhakaBD: string
    theStory: string
    storyLine1: string
    storyEm: string
    storyPost: string
    storyParagraph: string
    story1Title: string
    story1Desc: string
    story2Title: string
    story2Desc: string
    story3Title: string
    story3Desc: string
    story4Title: string
    story4Desc: string
    quote1: string
    quote2: string
    quote3: string
    cityDhaka: string
    cityChattogram: string
    citySylhet: string
    theLetter: string
    newsletterLine1: string
    newsletterEm: string
    newsletterPost: string
    newsletterParagraph: string
    subscribed: string
    alreadySubscribed: string
    subscribedOk: string
    signingUp: string
    signUp: string
    noSpam: string
  }
  product: {
    addToCart: string
    buyNow: string
    outOfStock: string
    lowStock: string
    selectSize: string
    quantity: string
    sizeGuide: string
    reviews: string
    writeReview: string
    description: string
    relatedProducts: string
    sale: string
    badgeFeatured: string
    lowStockBadge: string
    addWishlist: string
    removeWishlist: string
    loginToWishlist: string
    addedToWishlist: string
    removedFromWishlist: string
    wishlistError: string
    adding: string
    addWithPrice: string
    selectSizeFirst: string
    notFound: string
    backToShop: string
    shareText: string
    reviewCount: string
    oneSize: string
    shareAria: string
    fastDelivery: string
    dayReturns: string
    safeFabrics: string
    videos: string
    videoN: string
    noReviews: string
    noReviewsBeFirst: string
    noReviewsSignIn: string
    sizeGuideTitle: string
    ageCol: string
    heightCm: string
    weightKg: string
    sizeCol: string
    m03: string
    m36: string
    m612: string
    y12: string
    y24: string
    sizeGuideTip: string
    gotIt: string
    shareTitle: string
    shareViaDevice: string
    copied: string
    copy: string
    rating: string
    reviewTitleOptional: string
    reviewTitlePlaceholder: string
    reviewLabel: string
    reviewPlaceholder: string
    submitReview: string
    reviewBodyRequired: string
    alreadyReviewed: string
    reviewFailed: string
    reviewSubmitted: string
    moderationNote: string
  }
  cart: {
    title: string
    empty: string
    subtotal: string
    shipping: string
    total: string
    checkout: string
    continueShopping: string
    remove: string
    emptyHint: string
    startShopping: string
    addMoreForFree: string
    freeShippingUnlocked: string
    sizeLabel: string
    colorLabel: string
    removeItem: string
    orderSummary: string
    couponPlaceholder: string
    couponAppliedLabel: string
    invalidCoupon: string
    minOrder: string
    expiredCoupon: string
    couponApplied: string
    discount: string
    proceedCheckout: string
    calculatedAtCheckout: string
  }
  checkout: {
    title: string
    shipping: string
    payment: string
    review: string
    shippingAddress: string
    fullName: string
    phone: string
    email: string
    addressLine1: string
    city: string
    district: string
    postalCode: string
    orderNotes: string
    paymentMethod: string
    reviewOrder: string
    placeOrder: string
    orderSummary: string
    division: string
    fillIn: string
    emailRequired: string
    addressPlaceholder: string
    address2Placeholder: string
    notesPlaceholder: string
    continueToPayment: string
    addressLine2: string
    payBkash: string
    payBkashDesc: string
    payCard: string
    payCardDesc: string
    payCod: string
    payCodDesc: string
    payCodNote: string
    securePayment: string
    securePaymentDesc: string
    reviewYourOrder: string
    shippingTo: string
    verificationNote: string
    items: string
    placingOrder: string
    redirecting: string
    placeOrderWith: string
    payWith: string
    subtotalItems: string
    free: string
    discount: string
    gatewayError: string
    gatewayNotConfigured: string
    failedToPlace: string
  }
  shop: {
    clearAll: string
    category: string
    allProducts: string
    priceRange: string
    min: string
    max: string
    resetPrice: string
    size: string
    color: string
    age: string
    filters: string
    clear: string
    sortNewest: string
    sortPriceLow: string
    sortPriceHigh: string
    sortName: string
    categoryTitle: string
    searchTitle: string
    resultsFor: string
    productCount: string
    all: string
    noProducts: string
  }
  order: {
    findOrder: string
    phonePromptPre: string
    phonePromptPost: string
    viewOrder: string
    notFound: string
    phoneError: string
    stepPlaced: string
    stepProcessing: string
    stepShipped: string
    stepDelivered: string
    paymentFailed: string
    thankYou: string
    paymentFailedDesc: string
    placedSuccessfully: string
    number: string
    paymentPendingNote: string
    verified: string
    pendingVerification: string
    verifiedDesc: string
    codNote: string
    paymentConfirmed: string
    paidVia: string
    details: string
    qty: string
    sizeLabel: string
    paid: string
    failed: string
    pending: string
    verificationCall: string
    viewOrders: string
    trackTelegram: string
  }
  account: {
    updateFailed: string
    updated: string
    tabOrders: string
    tabProfile: string
    tabAddresses: string
    tabWishlist: string
    title: string
    signOut: string
    orderHistory: string
    statusPending: string
    statusProcessing: string
    statusShipped: string
    statusDelivered: string
    statusCancelled: string
    itemCount: string
    noOrders: string
    profileSettings: string
    saveChanges: string
    editProfile: string
    savedAddresses: string
    defaultBadge: string
    noAddresses: string
    myWishlist: string
    wishlistEmpty: string
    browseProducts: string
  }
  wishlist: {
    title: string
    empty: string
    discover: string
    myTitle: string
    savedCount: string
    removeFailed: string
  }
  notfound: {
    message: string
  }
  footer: {
    shop: string
    help: string
    getInTouch: string
    shipping: string
    returns: string
    aboutUs: string
    contactUs: string
    sizeGuide: string
    tagline: string
    rights: string
    madeIn: string
  }
  common: {
    loading: string
    error: string
    success: string
    save: string
    cancel: string
    delete: string
    edit: string
    close: string
    search: string
    addedToCart: string
    apply: string
    back: string
    backHome: string
    somethingWrong: string
    product: string
  }
}

const en: Translations = {
  nav: {
    home: 'Home', baby: 'Baby', mom: 'Mom', shopAll: 'Shop All', about: 'About', contact: 'Contact',
    account: 'Account', admin: 'Admin', adminDashboard: 'Dashboard', shop: 'Shop', wishlist: 'Wishlist',
    cart: 'Cart', menu: 'Menu', switchLanguage: 'Switch language',
  },
  search: {
    placeholder: 'Search for products...', searching: 'Searching...', suggestions: 'Suggestions',
    viewAll: 'View all results for', noResults: 'No products found. Try a different search.',
  },
  home: {
    madeWithLove: 'Made with love', heroSubtitle: '',
    shopCollection: 'Shop Collection', ourStory: 'Our Story', featured: 'Featured Products',
    shopByCategory: 'Shop by Category', viewAll: 'View All',
    eyebrow: 'Est. 2026 · Considered clothing, made in Bangladesh',
    heroTitleLine1: 'Clothing with',
    heroTitleEm: 'quiet confidence.',
    heroParagraph:
      'Considered pieces cut from premium fabrics — designed in Dhaka, made in Bangladesh, and delivered to your door. Numbered small batches, finished by hand.',
    lovedAcross: 'Loved across Bangladesh',
    freeDelivery: 'Free delivery over ৳3,000',
    easyReturns: '7-day easy returns',
    altNewSeason: 'Nuhani — new season',
    newIn: 'New in',
    premiumFabrics: 'Premium fabrics',
    madeInBD: 'Made in Bangladesh',
    theCollection: 'The collection',
    collectionLine1: 'Few pieces.',
    collectionEm: 'One endless wardrobe.',
    collectionBatch: 'Batch 01 — 2026',
    seeFullCollection: 'See the full collection',
    theEdit: 'The Nuhani edit',
    madeProperly: 'Made properly',
    madeForPre: 'Made for',
    madeForPost: ', and every day after.',
    goldenDays: 'golden days',
    lifestyleParagraph:
      'Glare-free fabrics, honest stitches, colors that stay rich wash after wash — clothing built for the long season of your life.',
    statFabrics: 'Premium fabrics',
    statDistricts: 'Districts delivered',
    statReturns: 'Easy returns',
    findYourPiece: 'Find your piece',
    justIn: 'Just in',
    newArrivalsLine1: 'Fresh off the',
    newArrivalsEm: 'line.',
    newArrivalsLabel: 'New arrivals',
    arrivingSoon: 'Our first collection is arriving soon.',
    beFirstToKnow: 'Subscribe below and be the first to know.',
    altStudio: 'Inside the Nuhani studio',
    est2026: 'Est. 2026',
    dhakaBD: 'Dhaka, Bangladesh',
    theStory: 'The story',
    storyLine1: 'Built for',
    storyEm: 'long',
    storyPost: ' seasons.',
    storyParagraph:
      'Nuhani began with a simple frustration: beautiful clothing in Bangladesh was either imported and expensive, or affordable and poorly made. We make a small number of pieces, in numbered batches, from premium fabrics — and we finish every piece by hand.',
    story1Title: 'Premium fabrics',
    story1Desc: 'Sourced for how they feel against the skin and how they age through seasons of wear.',
    story2Title: 'Made locally',
    story2Desc: 'Cut and stitched by skilled hands across Bangladesh, finished and inspected by a person.',
    story3Title: 'Honest pricing',
    story3Desc: 'No imported markups. One fair price for pieces that outlast the trend cycle.',
    story4Title: '7-day easy returns',
    story4Desc: 'Wrong size, changed your mind? Simple exchanges, no questions.',
    quote1: 'The fabric quality is genuinely premium — everything I ordered fits beautifully and washes well.',
    quote2: 'Ordered on Sunday, delivered by Tuesday in Chattogram. The packaging felt like a gift.',
    quote3: 'Finally a brand that gets both the fit and the finish right. My everyday pieces are all from here now.',
    cityDhaka: 'Dhaka',
    cityChattogram: 'Chattogram',
    citySylhet: 'Sylhet',
    theLetter: 'The letter',
    newsletterLine1: 'Join the',
    newsletterEm: 'good thread.',
    newsletterPost: '',
    newsletterParagraph:
      'One letter a month: new batches before anyone else, care guides, and the occasional photo of a very good day in Dhaka.',
    subscribed: "You're on the list. Welcome to Nuhani.",
    alreadySubscribed: "You're already subscribed!",
    subscribedOk: 'Subscribed successfully!',
    signingUp: 'Signing up…',
    signUp: 'Sign up',
    noSpam: 'No spam · Unsubscribe anytime',
  },
  product: {
    addToCart: 'Add to Cart', buyNow: 'Buy Now', outOfStock: 'Out of Stock', lowStock: 'Only {n} left in stock!',
    selectSize: 'Select Size', quantity: 'Quantity', sizeGuide: 'Size Guide', reviews: 'Customer Reviews',
    writeReview: 'Write a Review', description: 'Description', relatedProducts: 'You May Also Like',
    sale: 'Sale',
    badgeFeatured: 'Featured',
    lowStockBadge: 'Low stock',
    addWishlist: 'Add to wishlist',
    removeWishlist: 'Remove from wishlist',
    loginToWishlist: 'Please log in to save items to your wishlist.',
    addedToWishlist: 'Added to wishlist!',
    removedFromWishlist: 'Removed from wishlist.',
    wishlistError: 'Could not update your wishlist. Please try again.',
    adding: 'Adding…',
    addWithPrice: 'Add — {price}',
    selectSizeFirst: 'Please select a size',
    notFound: 'Product not found',
    backToShop: 'Back to Shop',
    shareText: 'Check out {name} on Nuhani!',
    reviewCount: '({n} reviews)',
    oneSize: 'One Size',
    shareAria: 'Share product',
    fastDelivery: 'Fast Delivery',
    dayReturns: '7-Day Returns',
    safeFabrics: 'Safe Fabrics',
    videos: 'Product Videos',
    videoN: 'Product video {n}',
    noReviews: 'No reviews yet.',
    noReviewsBeFirst: 'Be the first to review!',
    noReviewsSignIn: 'Sign in to write a review.',
    sizeGuideTitle: 'Baby Size Guide',
    ageCol: 'Age',
    heightCm: 'Height (cm)',
    weightKg: 'Weight (kg)',
    sizeCol: 'Size',
    m03: '0–3 months',
    m36: '3–6 months',
    m612: '6–12 months',
    y12: '1–2 years',
    y24: '2–4 years',
    sizeGuideTip: 'Tip: When in doubt, size up! Babies grow quickly and our fabrics have a comfortable fit.',
    gotIt: 'Got it',
    shareTitle: 'Share this product',
    shareViaDevice: 'Share via device',
    copied: 'Copied!',
    copy: 'Copy',
    rating: 'Rating',
    reviewTitleOptional: 'Title (optional)',
    reviewTitlePlaceholder: 'Great product!',
    reviewLabel: 'Review *',
    reviewPlaceholder: 'Share your experience...',
    submitReview: 'Submit Review',
    reviewBodyRequired: 'Please write a review',
    alreadyReviewed: 'You already reviewed this product',
    reviewFailed: 'Failed to submit review',
    reviewSubmitted: 'Review submitted! It will appear after approval.',
    moderationNote: 'Reviews are moderated and will appear after admin approval.',
  },
  cart: {
    title: 'Shopping Cart', empty: 'Your cart is empty', subtotal: 'Subtotal', shipping: 'Shipping',
    total: 'Total', checkout: 'Checkout', continueShopping: 'Continue Shopping', remove: 'Remove',
    emptyHint: "Looks like you haven't added anything yet.",
    startShopping: 'Start Shopping',
    addMoreForFree: 'Add {price} more for free shipping!',
    freeShippingUnlocked: "You've unlocked free shipping!",
    sizeLabel: 'Size: {v}',
    colorLabel: 'Color: {v}',
    removeItem: 'Remove item',
    orderSummary: 'Order Summary',
    couponPlaceholder: 'Coupon code',
    couponAppliedLabel: 'Coupon "{code}" applied',
    invalidCoupon: 'Invalid coupon code',
    minOrder: 'Minimum order of {price} required',
    expiredCoupon: 'This coupon has expired',
    couponApplied: 'Coupon applied! You saved {price}',
    discount: 'Discount',
    proceedCheckout: 'Proceed to Checkout',
    calculatedAtCheckout: 'Calculated at checkout',
  },
  checkout: {
    title: 'Checkout', shipping: 'Shipping', payment: 'Payment', review: 'Review',
    shippingAddress: 'Shipping Address', fullName: 'Full Name', phone: 'Phone', email: 'Email',
    addressLine1: 'Address Line 1', city: 'City / Area', district: 'District', postalCode: 'Postal Code',
    orderNotes: 'Order Notes (optional)', paymentMethod: 'Payment Method', reviewOrder: 'Review Order',
    placeOrder: 'Place Order', orderSummary: 'Order Summary',
    division: 'Division',
    fillIn: 'Please fill in {field}',
    emailRequired: 'Please enter your email',
    addressPlaceholder: 'House #, Road #',
    address2Placeholder: 'Apartment, suite, etc. (optional)',
    notesPlaceholder: 'Delivery instructions, gift message, etc.',
    continueToPayment: 'Continue to Payment',
    addressLine2: 'Address Line 2',
    payBkash: 'bKash',
    payBkashDesc: 'Pay with bKash mobile wallet',
    payCard: 'Card',
    payCardDesc: 'Visa / Mastercard / Amex',
    payCod: 'Cash on Delivery',
    payCodDesc: 'Pay when you receive your order',
    payCodNote:
      'Pay in cash when your order is delivered. A verification call may be made to confirm your order before dispatch.',
    securePayment: 'Secure Payment',
    securePaymentDesc:
      "You will be redirected to {name}'s secure payment page. Your payment is protected with bank-level encryption.",
    reviewYourOrder: 'Review Your Order',
    shippingTo: 'Shipping To',
    verificationNote: '(Verification required before dispatch)',
    items: 'Items',
    placingOrder: 'Placing Order...',
    redirecting: 'Redirecting to payment...',
    placeOrderWith: 'Place Order · {price}',
    payWith: 'Pay {price}',
    subtotalItems: 'Subtotal ({n} items)',
    free: 'Free',
    discount: 'Discount',
    gatewayError: 'Payment gateway error. Order placed with pending payment.',
    gatewayNotConfigured: 'Payment gateway not configured. Order placed with pending payment.',
    failedToPlace: 'Failed to place order. Please try again.',
  },
  shop: {
    clearAll: 'Clear all',
    category: 'Category',
    allProducts: 'All Products',
    priceRange: 'Price Range',
    min: 'Min',
    max: 'Max',
    resetPrice: 'Reset price',
    size: 'Size',
    color: 'Color',
    age: 'Age',
    filters: 'Filters',
    clear: 'Clear',
    sortNewest: 'Newest',
    sortPriceLow: 'Price: Low to High',
    sortPriceHigh: 'Price: High to Low',
    sortName: 'Name: A to Z',
    categoryTitle: '{name} Clothing',
    searchTitle: 'Search: {q}',
    resultsFor: 'Results for "{q}"',
    productCount: '{n} products',
    all: 'All',
    noProducts: 'No products found. Try adjusting your filters.',
  },
  order: {
    findOrder: 'Find your order',
    phonePromptPre: 'Enter the phone number you used when placing order',
    phonePromptPost: 'to view its details.',
    viewOrder: 'View Order',
    notFound: 'Order not found',
    phoneError: 'No order matches that order number and phone. Please check and try again.',
    stepPlaced: 'Order Placed',
    stepProcessing: 'Processing',
    stepShipped: 'Shipped',
    stepDelivered: 'Delivered',
    paymentFailed: 'Payment Failed',
    thankYou: 'Thank You!',
    paymentFailedDesc: 'Your payment could not be processed. Please try again.',
    placedSuccessfully: 'Your order has been placed successfully.',
    number: 'Order #{n}',
    paymentPendingNote:
      'Your order has been placed but payment is pending. Please complete payment to confirm your order.',
    verified: 'Order Verified',
    pendingVerification: 'Pending Verification',
    verifiedDesc: 'Your order has been verified and will be dispatched soon.',
    codNote:
      'Your COD order will be verified via phone call before dispatch. Please keep your phone available.',
    paymentConfirmed: 'Payment Confirmed',
    paidVia: 'Paid {price} via {method}',
    details: 'Order Details',
    qty: 'Qty: {n}',
    sizeLabel: 'Size: {v}',
    paid: 'Paid',
    failed: 'Failed',
    pending: 'Pending',
    verificationCall: 'Verification call will be made to {phone} before dispatch.',
    viewOrders: 'View Orders',
    trackTelegram: 'Track this order on Telegram',
  },
  account: {
    updateFailed: 'Failed to update profile',
    updated: 'Profile updated!',
    tabOrders: 'My Orders',
    tabProfile: 'Profile',
    tabAddresses: 'Addresses',
    tabWishlist: 'Wishlist',
    title: 'My Account',
    signOut: 'Sign Out',
    orderHistory: 'Order History',
    statusPending: 'Pending',
    statusProcessing: 'Processing',
    statusShipped: 'Shipped',
    statusDelivered: 'Delivered',
    statusCancelled: 'Cancelled',
    itemCount: '{n} items',
    noOrders: 'No orders yet',
    profileSettings: 'Profile Settings',
    saveChanges: 'Save Changes',
    editProfile: 'Edit Profile',
    savedAddresses: 'Saved Addresses',
    defaultBadge: 'Default',
    noAddresses: 'No saved addresses yet. They will appear here after your first order.',
    myWishlist: 'My Wishlist',
    wishlistEmpty: 'Your wishlist is empty',
    browseProducts: 'Browse Products',
  },
  wishlist: {
    title: 'Your Wishlist',
    empty: "You haven't saved any products yet.",
    discover: 'Discover Products',
    myTitle: 'My Wishlist',
    savedCount: '{n} saved items',
    removeFailed: 'Failed to remove',
  },
  notfound: {
    message: "Oops! The page you're looking for doesn't exist.",
  },
  footer: {
    shop: 'Shop', help: 'Help', getInTouch: 'Get in Touch', shipping: 'Shipping & Delivery',
    returns: 'Returns & Exchange', aboutUs: 'About Us', contactUs: 'Contact Us', sizeGuide: 'Size Guide',
    tagline: 'Small batches, honest prices, made in Bangladesh.',
    rights: 'All rights reserved',
    madeIn: 'Made in Bangladesh',
  },
  common: {
    loading: 'Loading...', error: 'Error', success: 'Success', save: 'Save', cancel: 'Cancel',
    delete: 'Delete', edit: 'Edit', close: 'Close', search: 'Search',
    addedToCart: 'Added to cart!',
    apply: 'Apply',
    back: 'Back',
    backHome: 'Back to Home',
    somethingWrong: 'Something went wrong. Please try again.',
    product: 'Product',
  },
}

const bn: Translations = {
  nav: {
    home: 'হোম', baby: 'বেবি', mom: 'মা', shopAll: 'সব পণ্য', about: 'আমাদের সম্পর্কে', contact: 'যোগাযোগ',
    account: 'অ্যাকাউন্ট', admin: 'অ্যাডমিন', adminDashboard: 'ড্যাশবোর্ড', shop: 'শপ', wishlist: 'উইশলিস্ট',
    cart: 'কার্ট', menu: 'মেনু', switchLanguage: 'ভাষা পরিবর্তন',
  },
  search: {
    placeholder: 'পণ্য খুঁজুন...', searching: 'খুঁজছি...', suggestions: 'পরামর্শ',
    viewAll: 'সব ফলাফল দেখুন', noResults: 'কোনো পণ্য পাওয়া যায়নি। অন্য কিছু খুঁজে দেখুন।',
  },
  home: {
    madeWithLove: 'ভালোবাসায় তৈরি', heroSubtitle: '',
    shopCollection: 'কালেকশন দেখুন', ourStory: 'আমাদের গল্প', featured: 'ফিচার্ড পণ্য',
    shopByCategory: 'ক্যাটাগরি অনুযায়ী কিনুন', viewAll: 'সব দেখুন',
    eyebrow: 'প্রতিষ্ঠা ২০২৬ · বাংলাদেশে তৈরি যত্নের পোশাক',
    heroTitleLine1: 'পোশাক, যাতে',
    heroTitleEm: 'শান্ত আত্মবিশ্বাস।',
    heroParagraph:
      'প্রিমিয়াম কাপড়ে কাটা বাছাই করা পোশাক — ডিজাইন ঢাকায়, তৈরি বাংলাদেশে, পৌঁছে যায় আপনার দরজায়। নম্বরযুক্ত ছোট ব্যাচে, হাতে হাতে সমাপ্ত।',
    lovedAcross: 'সারা বাংলাদেশে ভালোবাসা পেয়েছে',
    freeDelivery: '৳3,000+ অর্ডারে ফ্রি ডেলিভারি',
    easyReturns: '৭ দিনের সহজ রিটার্ন',
    altNewSeason: 'নুহানি — নতুন মৌসুম',
    newIn: 'নতুন',
    premiumFabrics: 'প্রিমিয়াম কাপড়',
    madeInBD: 'বাংলাদেশে তৈরি',
    theCollection: 'কালেকশন',
    collectionLine1: 'অল্প কিছু পোশাক।',
    collectionEm: 'এক অফুরন্ত ওয়ারড্রোব।',
    collectionBatch: 'ব্যাচ ০১ — ২০২৬',
    seeFullCollection: 'পুরো কালেকশন দেখুন',
    theEdit: 'নুহানি এডিট',
    madeProperly: 'যথাযথভাবে তৈরি',
    madeForPre: '',
    madeForPost: ' এর জন্য তৈরি, আর পরের প্রতিটি দিনের জন্যও।',
    goldenDays: 'সোনালি দিন',
    lifestyleParagraph:
      'চোখে আরাম দেয় এমন কাপড়, সৎ সেলাই, বারবার ধুয়েও যে রং ওঠে না — আপনার জীবনের দীর্ঘ মৌসুমের জন্য তৈরি পোশাক।',
    statFabrics: 'প্রিমিয়াম কাপড়',
    statDistricts: 'জেলায় ডেলিভারি',
    statReturns: 'সহজ রিটার্ন',
    findYourPiece: 'আপনার পোশাক খুঁজুন',
    justIn: 'এইমাত্র এসেছে',
    newArrivalsLine1: 'কল থেকে সদ্য',
    newArrivalsEm: 'নেমে এসেছে।',
    newArrivalsLabel: 'নতুন পণ্য',
    arrivingSoon: 'আমাদের প্রথম কালেকশন শীঘ্রই আসছে।',
    beFirstToKnow: 'নিচে সাবস্ক্রাইব করুন, সবার আগে জানতে পারুন।',
    altStudio: 'নুহানি স্টুডিওর ভেতরে',
    est2026: 'প্রতিষ্ঠা ২০২৬',
    dhakaBD: 'ঢাকা, বাংলাদেশ',
    theStory: 'গল্প',
    storyLine1: '',
    storyEm: 'দীর্ঘ',
    storyPost: ' মৌসুমের জন্য তৈরি।',
    storyParagraph:
      'নুহানির শুরু ছিল এক সাধারণ হতাশা থেকে: বাংলাদেশে সুন্দর পোশাক হয় আমদানি করা ও দামি, নয়তো সস্তা কিন্তু মান খারাপ। আমরা প্রিমিয়াম কাপড়ে অল্প কিছু পোশাক তৈরি করি, নম্বরযুক্ত ছোট ব্যাচে — আর প্রতিটি পোশাক শেষ করি হাতে।',
    story1Title: 'প্রিমিয়াম কাপড়',
    story1Desc: 'ত্বকের ছোঁয়া আর বারবার ব্যবহারে কেমন হয়ে ওঠে, সেটা দেখেই কাপড় বাছাই করি।',
    story2Title: 'দেশেই তৈরি',
    story2Desc: 'বাংলাদেশের দক্ষ হাতে কাটা ও সেলাই করা, একজন মানুষের চোখে পরীক্ষা করা।',
    story3Title: 'সৎ মূল্য',
    story3Desc: 'আমদানি মার্কআপ নেই। ট্রেন্ডের চেয়ে বেশি দিন টেকে এমন পোশাকের জন্য একটাই ন্যায্য দাম।',
    story4Title: '৭ দিনের সহজ রিটার্ন',
    story4Desc: 'সাইজ ভুল হয়েছে, মন বদলেছে? সহজ এক্সচেঞ্জ, কোনো প্রশ্ন নেই।',
    quote1: 'কাপড়ের মান সত্যিই প্রিমিয়াম — অর্ডার করা সব পোশাক দারুণ মানায়, ধুলেও ভালো থাকে।',
    quote2: 'রবিবার অর্ডার, মঙ্গলবারেই চট্টগ্রামে ডেলিভারি। প্যাকেজিং উপহারের মতোই লাগল।',
    quote3: 'অবশেষে এমন একটা ব্র্যান্ড যারা ফিট আর ফিনিশ দুটোই ঠিক রাখে। এখন আমার প্রতিদিনের পোশাকগুলোই এখান থেকে।',
    cityDhaka: 'ঢাকা',
    cityChattogram: 'চট্টগ্রাম',
    citySylhet: 'সিলেট',
    theLetter: 'চিঠি',
    newsletterLine1: '',
    newsletterEm: 'ভালোবাসার',
    newsletterPost: ' সুতোয় বাঁধুন।',
    newsletterParagraph:
      'মাসে একটি চিঠি: সবার আগে নতুন ব্যাচের খবর, যত্নের গাইড, আর ঢাকার এক ভালো দিনের ছবি মাঝে মধ্যে।',
    subscribed: 'আপনি তালিকায় আছেন। নুহানিতে স্বাগতম।',
    alreadySubscribed: 'আপনি ইতিমধ্যেই সাবস্ক্রাইব করেছেন!',
    subscribedOk: 'সফলভাবে সাবস্ক্রাইব হয়েছে!',
    signingUp: 'সাবস্ক্রাইব হচ্ছে…',
    signUp: 'সাইন আপ',
    noSpam: 'স্প্যাম নেই · যখন চান আনসাবস্ক্রাইব',
  },
  product: {
    addToCart: 'কার্টে যোগ করুন', buyNow: 'এখনই কিনুন', outOfStock: 'স্টকে নেই', lowStock: 'মাত্র {n}টি বাকি!',
    selectSize: 'সাইজ নির্বাচন করুন', quantity: 'পরিমাণ', sizeGuide: 'সাইজ গাইড', reviews: 'কাস্টমার রিভিউ',
    writeReview: 'রিভিউ লিখুন', description: 'বিবরণ', relatedProducts: 'আপনার পছন্দ হতে পারে',
    sale: 'সেল',
    badgeFeatured: 'ফিচার্ড',
    lowStockBadge: 'স্টক কম',
    addWishlist: 'উইশলিস্টে যোগ করুন',
    removeWishlist: 'উইশলিস্ট থেকে সরান',
    loginToWishlist: 'উইশলিস্টে সংরক্ষণ করতে লগ ইন করুন।',
    addedToWishlist: 'উইশলিস্টে যোগ হয়েছে!',
    removedFromWishlist: 'উইশলিস্ট থেকে সরানো হয়েছে।',
    wishlistError: 'উইশলিস্ট আপডেট করা যায়নি। আবার চেষ্টা করুন।',
    adding: 'যোগ হচ্ছে…',
    addWithPrice: 'যোগ করুন — {price}',
    selectSizeFirst: 'অনুগ্রহ করে সাইজ নির্বাচন করুন',
    notFound: 'পণ্যটি খুঁজে পাওয়া যায়নি',
    backToShop: 'শপে ফিরে যান',
    shareText: 'নুহানিতে {name} দেখুন!',
    reviewCount: '({n}টি রিভিউ)',
    oneSize: 'ফ্রি সাইজ',
    shareAria: 'পণ্য শেয়ার করুন',
    fastDelivery: 'দ্রুত ডেলিভারি',
    dayReturns: '৭ দিনের রিটার্ন',
    safeFabrics: 'নিরাপদ কাপড়',
    videos: 'পণ্যের ভিডিও',
    videoN: 'পণ্যের ভিডিও {n}',
    noReviews: 'এখনো কোনো রিভিউ নেই।',
    noReviewsBeFirst: 'প্রথম রিভিউটি আপনিই দিন!',
    noReviewsSignIn: 'রিভিউ লিখতে সাইন ইন করুন।',
    sizeGuideTitle: 'বেবি সাইজ গাইড',
    ageCol: 'বয়স',
    heightCm: 'উচ্চতা (সেমি)',
    weightKg: 'ওজন (কেজি)',
    sizeCol: 'সাইজ',
    m03: '০–৩ মাস',
    m36: '৩–৬ মাস',
    m612: '৬–১২ মাস',
    y12: '১–২ বছর',
    y24: '২–৪ বছর',
    sizeGuideTip: 'টিপস: সন্দেহ থাকলে বড় সাইজ নিন! শিশুরা দ্রুত বড় হয়, আর আমাদের কাপড় আরামদায়ক ফিট হয়।',
    gotIt: 'বুঝেছি',
    shareTitle: 'এই পণ্যটি শেয়ার করুন',
    shareViaDevice: 'ডিভাইস দিয়ে শেয়ার করুন',
    copied: 'কপি হয়েছে!',
    copy: 'কপি',
    rating: 'রেটিং',
    reviewTitleOptional: 'শিরোনাম (ঐচ্ছিক)',
    reviewTitlePlaceholder: 'দারুণ পণ্য!',
    reviewLabel: 'রিভিউ *',
    reviewPlaceholder: 'আপনার অভিজ্ঞতা লিখুন...',
    submitReview: 'রিভিউ জমা দিন',
    reviewBodyRequired: 'অনুগ্রহ করে রিভিউ লিখুন',
    alreadyReviewed: 'আপনি ইতিমধ্যে এই পণ্যের রিভিউ দিয়েছেন',
    reviewFailed: 'রিভিউ জমা দিতে ব্যর্থ',
    reviewSubmitted: 'রিভিউ জমা হয়েছে! অনুমোদনের পরে দেখা যাবে।',
    moderationNote: 'রিভিউ মডারেট করা হয়; অ্যাডমিন অনুমোদনের পরে দেখা যাবে।',
  },
  cart: {
    title: 'শপিং কার্ট', empty: 'আপনার কার্ট খালি', subtotal: 'সাবটোটাল', shipping: 'ডেলিভারি চার্জ',
    total: 'মোট', checkout: 'চেকআউট', continueShopping: 'কেনাকাটা চালিয়ে যান', remove: 'মুছুন',
    emptyHint: 'মনে হচ্ছে আপনি এখনো কিছু যোগ করেননি।',
    startShopping: 'শপিং শুরু করুন',
    addMoreForFree: 'ফ্রি ডেলিভারির জন্য আরও {price} যোগ করুন!',
    freeShippingUnlocked: 'আপনি ফ্রি ডেলিভারি পেয়ে গেছেন!',
    sizeLabel: 'সাইজ: {v}',
    colorLabel: 'রং: {v}',
    removeItem: 'আইটেম সরান',
    orderSummary: 'অর্ডার সারাংশ',
    couponPlaceholder: 'কুপন কোড',
    couponAppliedLabel: '"{code}" কুপন প্রয়োগ হয়েছে',
    invalidCoupon: 'কুপন কোডটি সঠিক নয়',
    minOrder: 'সর্বনিম্ন অর্ডার {price} প্রয়োজন',
    expiredCoupon: 'এই কুপনের মেয়াদ শেষ',
    couponApplied: 'কুপন প্রয়োগ হয়েছে! আপনি বাঁচিয়েছেন {price}',
    discount: 'ছাড়',
    proceedCheckout: 'চেকআউট করুন',
    calculatedAtCheckout: 'চেকআউটে হিসাব হবে',
  },
  checkout: {
    title: 'চেকআউট', shipping: 'শিপিং', payment: 'পেমেন্ট', review: 'রিভিউ',
    shippingAddress: 'ডেলিভারি ঠিকানা', fullName: 'পুরো নাম', phone: 'ফোন', email: 'ইমেইল',
    addressLine1: 'ঠিকানা', city: 'শহর / এলাকা', district: 'জেলা', postalCode: 'পোস্ট কোড',
    orderNotes: 'অর্ডার নোট (ঐচ্ছিক)', paymentMethod: 'পেমেন্ট মেথড', reviewOrder: 'অর্ডার রিভিউ',
    placeOrder: 'অর্ডার দিন', orderSummary: 'অর্ডার সারাংশ',
    division: 'বিভাগ',
    fillIn: 'অনুগ্রহ করে {field} পূরণ করুন',
    emailRequired: 'অনুগ্রহ করে আপনার ইমেইল লিখুন',
    addressPlaceholder: 'বাসা #, রোড #',
    address2Placeholder: 'অ্যাপার্টমেন্ট, স্যুইট ইত্যাদি (ঐচ্ছিক)',
    notesPlaceholder: 'ডেলিভারির নির্দেশনা, উপহারের বার্তা ইত্যাদি।',
    continueToPayment: 'পেমেন্টে এগিয়ে যান',
    addressLine2: 'ঠিকানা ২',
    payBkash: 'বিকাশ',
    payBkashDesc: 'বিকাশ মোবাইল ওয়ালেট দিয়ে পেমেন্ট',
    payCard: 'কার্ড',
    payCardDesc: 'Visa / Mastercard / Amex',
    payCod: 'ক্যাশ অন ডেলিভারি',
    payCodDesc: 'পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন',
    payCodNote:
      'অর্ডার ডেলিভারির সময় নগদে পরিশোধ করুন। প্রেরণের আগে অর্ডার নিশ্চিত করতে ফোনে যাচাই করা হতে পারে।',
    securePayment: 'নিরাপদ পেমেন্ট',
    securePaymentDesc:
      'আপনাকে {name}-এর সুরক্ষিত পেমেন্ট পেজে নিয়ে যাওয়া হবে। আপনার পেমেন্ট ব্যাংক-স্তরের এনক্রিপশনে সুরক্ষিত।',
    reviewYourOrder: 'আপনার অর্ডার দেখে নিন',
    shippingTo: 'ডেলিভারি ঠিকানা',
    verificationNote: '(প্রেরণের আগে যাচাই প্রয়োজন)',
    items: 'আইটেম',
    placingOrder: 'অর্ডার দেওয়া হচ্ছে...',
    redirecting: 'পেমেন্টে পাঠানো হচ্ছে...',
    placeOrderWith: 'অর্ডার করুন · {price}',
    payWith: 'পরিশোধ করুন {price}',
    subtotalItems: 'সাবটোটাল ({n}টি আইটেম)',
    free: 'ফ্রি',
    discount: 'ছাড়',
    gatewayError: 'পেমেন্ট গেটওয়ে ত্রুটি। পেমেন্ট বাকি থেকে অর্ডার নেওয়া হয়েছে।',
    gatewayNotConfigured: 'পেমেন্ট গেটওয়ে কনফিগার করা নেই। পেমেন্ট বাকি থেকে অর্ডার নেওয়া হয়েছে।',
    failedToPlace: 'অর্ডার দিতে ব্যর্থ। আবার চেষ্টা করুন।',
  },
  shop: {
    clearAll: 'সব মুছুন',
    category: 'ক্যাটাগরি',
    allProducts: 'সব পণ্য',
    priceRange: 'দামের সীমা',
    min: 'সর্বনিম্ন',
    max: 'সর্বোচ্চ',
    resetPrice: 'দাম রিসেট করুন',
    size: 'সাইজ',
    color: 'রং',
    age: 'বয়স',
    filters: 'ফিল্টার',
    clear: 'মুছুন',
    sortNewest: 'নতুন',
    sortPriceLow: 'দাম: কম থেকে বেশি',
    sortPriceHigh: 'দাম: বেশি থেকে কম',
    sortName: 'নাম: অ থেকে ঔ',
    categoryTitle: '{name} পোশাক',
    searchTitle: 'খুঁজুন: {q}',
    resultsFor: '"{q}" এর ফলাফল',
    productCount: '{n}টি পণ্য',
    all: 'সব',
    noProducts: 'কোনো পণ্য পাওয়া যায়নি। ফিল্টার বদলে দেখুন।',
  },
  order: {
    findOrder: 'আপনার অর্ডার খুঁজুন',
    phonePromptPre: '',
    phonePromptPost: ' এর বিবরণ দেখতে যে ফোন নম্বর ব্যবহার করেছিলেন সেটি লিখুন।',
    viewOrder: 'অর্ডার দেখুন',
    notFound: 'অর্ডার খুঁজে পাওয়া যায়নি',
    phoneError: 'এই অর্ডার নম্বর ও ফোন নম্বরে কোনো অর্ডার মেলেনি। যাচাই করে আবার চেষ্টা করুন।',
    stepPlaced: 'অর্ডার নেওয়া হয়েছে',
    stepProcessing: 'প্রসেসিং চলছে',
    stepShipped: 'পাঠানো হয়েছে',
    stepDelivered: 'ডেলিভারি সম্পন্ন',
    paymentFailed: 'পেমেন্ট ব্যর্থ',
    thankYou: 'ধন্যবাদ!',
    paymentFailedDesc: 'আপনার পেমেন্ট প্রক্রিয়া করা যায়নি। আবার চেষ্টা করুন।',
    placedSuccessfully: 'আপনার অর্ডার সফলভাবে নেওয়া হয়েছে।',
    number: 'অর্ডার #{n}',
    paymentPendingNote:
      'অর্ডার নেওয়া হয়েছে, তবে পেমেন্ট এখনো বাকি আছে। অর্ডার নিশ্চিত করতে পেমেন্ট সম্পন্ন করুন।',
    verified: 'অর্ডার যাচাই হয়েছে',
    pendingVerification: 'যাচাই বাকি আছে',
    verifiedDesc: 'আপনার অর্ডার যাচাই হয়েছে, শীঘ্রই পাঠানো হবে।',
    codNote: 'ক্যাশ অন ডেলিভারি অর্ডার পাঠানোর আগে ফোনে যাচাই করা হবে। অনুগ্রহ করে ফোনের কাছে থাকুন।',
    paymentConfirmed: 'পেমেন্ট নিশ্চিত হয়েছে',
    paidVia: '{method} দিয়ে {price} পরিশোধ হয়েছে',
    details: 'অর্ডারের বিবরণ',
    qty: 'পরিমাণ: {n}',
    sizeLabel: 'সাইজ: {v}',
    paid: 'পরিশোধিত',
    failed: 'ব্যর্থ',
    pending: 'বাকি',
    verificationCall: 'পাঠানোর আগে {phone} নম্বরে যাচাই কল করা হবে।',
    viewOrders: 'অর্ডারগুলো দেখুন',
    trackTelegram: 'টেলিগ্রামে অর্ডার ট্র্যাক করুন',
  },
  account: {
    updateFailed: 'প্রোফাইল আপডেট করা যায়নি',
    updated: 'প্রোফাইল আপডেট হয়েছে!',
    tabOrders: 'আমার অর্ডার',
    tabProfile: 'প্রোফাইল',
    tabAddresses: 'ঠিকানা',
    tabWishlist: 'উইশলিস্ট',
    title: 'আমার অ্যাকাউন্ট',
    signOut: 'সাইন আউট',
    orderHistory: 'অর্ডার ইতিহাস',
    statusPending: 'বাকি',
    statusProcessing: 'প্রসেসিং চলছে',
    statusShipped: 'পাঠানো হয়েছে',
    statusDelivered: 'ডেলিভারি হয়েছে',
    statusCancelled: 'বাতিল',
    itemCount: '{n}টি আইটেম',
    noOrders: 'এখনো কোনো অর্ডার নেই',
    profileSettings: 'প্রোফাইল সেটিংস',
    saveChanges: 'পরিবর্তন সংরক্ষণ করুন',
    editProfile: 'প্রোফাইল সম্পাদনা',
    savedAddresses: 'সংরক্ষিত ঠিকানা',
    defaultBadge: 'ডিফল্ট',
    noAddresses: 'এখনো কোনো সংরক্ষিত ঠিকানা নেই। প্রথম অর্ডারের পরে এখানে দেখা যাবে।',
    myWishlist: 'আমার উইশলিস্ট',
    wishlistEmpty: 'আপনার উইশলিস্ট খালি',
    browseProducts: 'পণ্য দেখুন',
  },
  wishlist: {
    title: 'আপনার উইশলিস্ট',
    empty: 'এখনো কোনো পণ্য সংরক্ষণ করেননি।',
    discover: 'পণ্য দেখুন',
    myTitle: 'আমার উইশলিস্ট',
    savedCount: '{n}টি সংরক্ষিত পণ্য',
    removeFailed: 'সরাতে ব্যর্থ',
  },
  notfound: {
    message: 'ওপস! আপনি যে পেজটি খুঁজছেন সেটি নেই।',
  },
  footer: {
    shop: 'কেনাকাটা', help: 'সাহায্য', getInTouch: 'যোগাযোগ', shipping: 'শিপিং ও ডেলিভারি',
    returns: 'রিটার্ন ও এক্সচেঞ্জ', aboutUs: 'আমাদের সম্পর্কে', contactUs: 'যোগাযোগ করুন', sizeGuide: 'সাইজ গাইড',
    tagline: 'ছোট ব্যাচ, সৎ দাম, বাংলাদেশে তৈরি।',
    rights: 'সর্বস্বত্ব সংরক্ষিত',
    madeIn: 'বাংলাদেশে তৈরি',
  },
  common: {
    loading: 'লোড হচ্ছে...', error: 'ত্রুটি', success: 'সফল', save: 'সংরক্ষণ', cancel: 'বাতিল',
    delete: 'মুছুন', edit: 'সম্পাদনা', close: 'বন্ধ', search: 'খুঁজুন',
    addedToCart: 'কার্টে যোগ হয়েছে!',
    apply: 'প্রয়োগ করুন',
    back: 'পেছনে',
    backHome: 'হোমে ফিরে যান',
    somethingWrong: 'কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।',
    product: 'পণ্য',
  },
}

type LanguageContextType = {
  lang: Language
  toggleLang: () => void
  t: (key: string, vars?: Record<string, string | number>) => string
  pick: (en: string | null | undefined, bn: string | null | undefined) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    const stored = localStorage.getItem('nuhani_lang') as Language | null
    return stored ?? 'en'
  })

  useEffect(() => {
    localStorage.setItem('nuhani_lang', lang)
    document.documentElement.lang = lang === 'bn' ? 'bn' : 'en'
  }, [lang])

  const toggleLang = () => setLang((prev) => (prev === 'en' ? 'bn' : 'en'))

  const t = (key: string, vars?: Record<string, string | number>): string => {
    const dict = lang === 'en' ? en : bn
    const parts = key.split('.')
    let result: unknown = dict
    for (const part of parts) {
      if (typeof result === 'object' && result !== null && part in result) {
        result = (result as Record<string, unknown>)[part]
      } else {
        return key
      }
    }
    if (typeof result !== 'string') return key
    if (!vars) return result
    return result.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in vars ? String(vars[name]) : match,
    )
  }

  // DB-backed display fields (product/category/banner names) — Bangla value with English fallback
  const pick = (en: string | null | undefined, bn: string | null | undefined): string =>
    lang === 'bn' && bn ? bn : en ?? ''

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, pick }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
