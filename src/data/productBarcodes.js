export const PRODUCT_BARCODES = {
  'nike-air-force-1': {
    sku: 'CW2288-111',
    barcodeNumber: '888407892101',
    label: 'Nike Air Force 1 07',
    colorway: 'Triple White',
  },
  'nike-dunk-low': {
    sku: 'DD1391-100',
    barcodeNumber: '888407892102',
    label: 'Nike Dunk Low Retro',
    colorway: 'Black / White (Panda)',
  },
  'nike-air-max-270': {
    sku: 'AH8050-005',
    barcodeNumber: '888407892103',
    label: 'Nike Air Max 270',
    colorway: 'Triple Black',
  },
  'nike-air-jordan': {
    sku: '555088-109',
    barcodeNumber: '888407892104',
    label: 'Air Jordan 1 Retro High',
    colorway: 'White / Neutral',
  },
  'puma-carina-leather': {
    sku: '370325-02',
    barcodeNumber: '406097892105',
    label: 'Puma Carina L',
    colorway: 'Puma White',
  },
  'puma-suede': {
    sku: '352634-03',
    barcodeNumber: '406097892106',
    label: 'Puma Suede Classic',
    colorway: 'Suede Classic Brown',
  },
  'puma-vintage-sneaker': {
    sku: '374915-01',
    barcodeNumber: '406097892107',
    label: 'Puma Vintage Sneaker',
    colorway: 'Vintage Cream',
  },
  'adidas_running_green': {
    sku: 'EG0692',
    barcodeNumber: '406205892108',
    label: 'Adidas Running Green',
    colorway: 'Active Green / White',
  },
  'vans_photogrammetry': {
    sku: 'VN000D3HY28',
    barcodeNumber: '190289892109',
    label: 'Vans Sk8-Hi Pro',
    colorway: 'Black / White',
  },
  'vans_classic': {
    sku: 'VN000EYEBLK',
    barcodeNumber: '190289892110',
    label: 'Vans Classic Slip-On',
    colorway: 'Checkerboard Black / White',
  },
  'adidas-yeezy-boost-350-v2': {
    sku: 'CP9652',
    barcodeNumber: '406205892111',
    label: 'Yeezy Boost 350 V2',
    colorway: 'Core Black / Red Stripe',
  },
  'adidas-samba-vintage': {
    sku: 'B75806',
    barcodeNumber: '406205892112',
    label: 'Adidas Samba Vintage',
    colorway: 'Cloud White / Core Black / Gum',
  },
};

export const getBarcodeInfo = (shoeId) => {
  return (
    PRODUCT_BARCODES[shoeId] || {
      sku: 'SKU-' + shoeId.toUpperCase().slice(0, 8),
      barcodeNumber: '888000' + Math.abs(shoeId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)),
      label: 'Sneaker Model',
      colorway: 'Default Edition',
    }
  );
};
