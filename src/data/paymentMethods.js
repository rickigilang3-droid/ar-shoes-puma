export const DANA_QRIS_URL =
  'https://link.dana.id/minta?full_url=https://qr.dana.id/v1/281012012021061658928416';
export const DANA_QRIS_IMAGE = '/images/qris-payment.jpg';
export const DANA_PHONE_NUMBER = '0812-0210-6165';
export const DANA_ACCOUNT_NAME = 'NIKE AR STUDIO (DANA ID)';

export const BANK_TRANSFER_CHANNELS = [
  {
    id: 'bca',
    bankName: 'Bank BCA',
    bankCode: '014',
    accountNumber: '3901081202106165',
    formattedAccount: '3901 0812 0210 6165',
    accountHolder: 'NIKE AR STUDIO / DANA',
    type: 'BCA Virtual Account',
    badge: 'Otomatis Verifikasi',
    instructions: [
      'Buka m-BCA > pilih menu m-Transfer > BCA Virtual Account.',
      'Masukkan nomor VA: 3901 0812 0210 6165.',
      'Periksa nama penerima (NIKE AR STUDIO) dan nominal.',
      'Masukkan PIN m-BCA untuk menyelesaikan pembayaran.',
    ],
  },
  {
    id: 'mandiri',
    bankName: 'Bank Mandiri',
    bankCode: '008',
    accountNumber: '89508081202106165',
    formattedAccount: '89508 0812 0210 6165',
    accountHolder: 'NIKE AR STUDIO / DANA',
    type: 'Mandiri Virtual Account (Livin)',
    badge: 'Otomatis Verifikasi',
    instructions: [
      'Buka Livin by Mandiri > pilih menu Bayar / Transfer.',
      'Pilih Pembayaran Baru > Masukkan kode 89508.',
      'Masukkan nomor HP: 0812 0210 6165.',
      'Konfirmasi tagihan dan masukkan MPIN Livin.',
    ],
  },
  {
    id: 'bni',
    bankName: 'Bank BNI',
    bankCode: '009',
    accountNumber: '8810081202106165',
    formattedAccount: '8810 0812 0210 6165',
    accountHolder: 'NIKE AR STUDIO / DANA',
    type: 'BNI Virtual Account Billing',
    badge: 'Otomatis Verifikasi',
    instructions: [
      'Buka BNI Mobile Banking > Transfer > Virtual Account Billing.',
      'Input nomor VA: 8810 0812 0210 6165.',
      'Pastikan nominal sesuai dan masukkan password transaksi.',
    ],
  },
  {
    id: 'bri',
    bankName: 'Bank BRI',
    bankCode: '002',
    accountNumber: '88810081202106165',
    formattedAccount: '88810 0812 0210 6165',
    accountHolder: 'NIKE AR STUDIO / DANA',
    type: 'BRI Virtual Account (BRIVA)',
    badge: 'Otomatis Verifikasi',
    instructions: [
      'Buka aplikasi BRImo > pilih Pembayaran > BRIVA.',
      'Masukkan kode BRIVA: 88810 0812 0210 6165.',
      'Periksa detail pembayaran dan masukkan PIN BRImo.',
    ],
  },
  {
    id: 'permata',
    bankName: 'Bank Permata',
    bankCode: '013',
    accountNumber: '8528081202106165',
    formattedAccount: '8528 0812 0210 6165',
    accountHolder: 'NIKE AR STUDIO / DANA',
    type: 'Permata Virtual Account',
    badge: 'Otomatis Verifikasi',
    instructions: [
      'Buka PermataMobile X > Transfer > Virtual Account.',
      'Masukkan nomor VA: 8528 0812 0210 6165.',
      'Periksa nominal dan selesaikan transaksi.',
    ],
  },
];

export const EWALLET_CHANNELS = [
  {
    id: 'dana',
    name: 'DANA',
    number: '0812-0210-6165',
    accountHolder: 'NIKE AR STUDIO',
    actionUrl: DANA_QRIS_URL,
    badge: 'Rekomendasi Cepat',
    description: 'Transfer langsung sesama aplikasi DANA tanpa biaya admin',
  },
  {
    id: 'gopay',
    name: 'GoPay',
    number: '0812-0210-6165',
    accountHolder: 'NIKE AR STUDIO',
    description: 'Transfer saldo GoPay atau scan QRIS via aplikasi Gojek',
  },
  {
    id: 'ovo',
    name: 'OVO',
    number: '0812-0210-6165',
    accountHolder: 'NIKE AR STUDIO',
    description: 'Transfer saldo OVO atau scan QRIS via aplikasi OVO',
  },
  {
    id: 'shopeepay',
    name: 'ShopeePay',
    number: '0812-0210-6165',
    accountHolder: 'NIKE AR STUDIO',
    description: 'Transfer saldo ShopeePay atau scan QRIS via aplikasi Shopee',
  },
];
