import React, { useState, useEffect } from 'react';
import { formatPrice } from '../data/products';
import { OFFICIAL_STORES } from '../data/stores';
import AddressMapModal from './AddressMapModal';

function ShoppingCart({
  items,
  transactions,
  itemCount,
  subtotal,
  isOpen,
  initialView = 'cart',
  onOpen,
  onClose,
  onChangeQuantity,
  onRemove,
  onCompleteCheckout,
}) {
  const [activeView, setActiveView] = useState('cart');
  const [fulfillmentType, setFulfillmentType] = useState('delivery'); // 'delivery' | 'pickup'
  const [selectedStoreId, setSelectedStoreId] = useState(OFFICIAL_STORES[0]?.id || '');
  const [pinnedLocation, setPinnedLocation] = useState(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [courierNoteInput, setCourierNoteInput] = useState('');
  const [checkoutCustomer, setCheckoutCustomer] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setActiveView(initialView || 'cart');
    }
  }, [isOpen, initialView]);

  const selectedStore = OFFICIAL_STORES.find((store) => store.id === selectedStoreId) || OFFICIAL_STORES[0];

  const handleConfirmAddressFromMap = ({ address, coordinates, courierNote }) => {
    setPinnedLocation({ address, coordinates, courierNote });
    setAddressInput(address);
    if (courierNote) {
      setCourierNoteInput(courierNote);
    }
  };

  const continueToPayment = (event) => {
    const form = event.currentTarget.form;
    if (!form?.reportValidity()) return;
    const formData = new FormData(form);

    const name = formData.get('name');
    const phone = formData.get('phone');
    const email = formData.get('email');

    let customerData = {
      name,
      phone,
      email,
      fulfillmentType,
    };

    if (fulfillmentType === 'delivery') {
      const address = formData.get('address') || addressInput;
      const courierNote = formData.get('courierNote') || courierNoteInput;
      customerData = {
        ...customerData,
        address,
        courierNote,
        coordinates: pinnedLocation?.coordinates || null,
        pinnedAddress: pinnedLocation?.address || null,
      };
    } else {
      customerData = {
        ...customerData,
        store: selectedStore,
        address: selectedStore.address,
      };
    }

    setCheckoutCustomer(customerData);
    setActiveView('payment');
  };

  const handlePayment = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const customer = {
      ...checkoutCustomer,
      paymentMethod: formData.get('paymentMethod'),
    };
    const order = onCompleteCheckout(customer);
    setCompletedOrder({ ...order, customerName: customer.name });
    setActiveView('receipt');
  };

  const handleOpen = () => {
    setActiveView('cart');
    onOpen();
  };

  return (
    <>
      {/* Floating Cart Trigger Button */}
      <button
        className={`shopping-cart-trigger ${itemCount > 0 ? 'has-items' : ''}`}
        type="button"
        onClick={handleOpen}
        aria-label={`Buka keranjang, ${itemCount} barang, subtotal ${formatPrice(subtotal)}`}
      >
        <span className="shopping-cart-trigger-badge">
          <svg
            className="shopping-cart-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <span className="shopping-cart-count">{itemCount}</span>
        </span>
        <span className="shopping-cart-trigger-text">
          <span className="shopping-cart-trigger-label">Keranjang</span>
          {itemCount > 0 && (
            <span className="shopping-cart-trigger-sub">{formatPrice(subtotal)}</span>
          )}
        </span>
      </button>

      {/* Shopping Cart Drawer / Panel */}
      {isOpen && (
        <div className="shopping-cart-backdrop">
          <button
            className="shopping-cart-dismiss"
            type="button"
            onClick={onClose}
            aria-label="Tutup keranjang"
          />
          <section
            className="shopping-cart-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shopping-cart-title"
          >
            {/* Drawer Header */}
            <header className="shopping-cart-header">
              <div>
                <p className="store-eyebrow">STUDIO CHECKOUT</p>
                <h2 id="shopping-cart-title">
                  {activeView === 'history'
                    ? 'Riwayat Pesanan'
                    : activeView === 'checkout'
                    ? 'Metode Pengiriman'
                    : activeView === 'payment'
                    ? 'Pilih Pembayaran'
                    : activeView === 'receipt'
                    ? 'Pesanan Terkonfirmasi'
                    : 'Keranjang Belanja'}
                  {activeView === 'cart' && <span> ({itemCount} item)</span>}
                </h2>
              </div>
              <div className="shopping-cart-header-actions">
                <button
                  className="shopping-cart-history-link"
                  type="button"
                  onClick={() =>
                    setActiveView(activeView === 'history' ? 'cart' : 'history')
                  }
                >
                  {activeView === 'history'
                    ? `← Keranjang (${itemCount})`
                    : `Transaksi (${transactions.length})`}
                </button>
                <button
                  className="shopping-cart-close"
                  type="button"
                  onClick={onClose}
                  aria-label="Tutup keranjang"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width="18"
                    height="18"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </header>

            {/* View: History */}
            {activeView === 'history' ? (
              <div className="shopping-cart-history">
                {transactions.length === 0 ? (
                  <div className="shopping-cart-empty">
                    <div className="shopping-cart-empty-circle">📋</div>
                    <h3>Belum ada pesanan</h3>
                    <p>
                      Pesanan yang diselesaikan akan otomatis tersimpan di riwayat
                      perangkat ini.
                    </p>
                    {itemCount > 0 && (
                      <button
                        className="store-button store-button-dark"
                        type="button"
                        onClick={() => setActiveView('cart')}
                      >
                        Lihat keranjang aktif
                      </button>
                    )}
                  </div>
                ) : (
                  transactions.map((transaction) => (
                    <article className="shopping-cart-transaction" key={transaction.id}>
                      <div className="shopping-cart-transaction-head">
                        <div>
                          <strong>{transaction.id}</strong>
                          <span>{new Date(transaction.createdAt).toLocaleString('id-ID')}</span>
                        </div>
                        <span className="shopping-cart-fulfillment-badge">
                          {transaction.fulfillmentType === 'pickup'
                            ? '🏬 Ambil di Toko'
                            : '🚚 Dikirim'}
                        </span>
                      </div>

                      <div className="shopping-cart-transaction-loc">
                        {transaction.fulfillmentType === 'pickup' ? (
                          <small>
                            Outlet: <strong>{transaction.store?.name || 'Outlet Resmi'}</strong>
                          </small>
                        ) : (
                          <small>
                            Tujuan: <strong>{transaction.address || 'Alamat Terdaftar'}</strong>
                          </small>
                        )}
                      </div>

                      <p className="shopping-cart-transaction-items">
                        {transaction.items
                          .map((item) => `${item.name} (${item.size || ''}) ×${item.quantity}`)
                          .join(', ')}
                      </p>

                      <div className="shopping-cart-transaction-foot">
                        <span className="shopping-cart-badge-done">{transaction.status}</span>
                        <div className="shopping-cart-transaction-total">
                          <small>{transaction.paymentMethod}</small>
                          <strong>{formatPrice(transaction.total)}</strong>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            ) : activeView === 'receipt' && completedOrder ? (
              /* View: Order Receipt */
              <div className="shopping-cart-receipt" role="status">
                <span className="shopping-cart-success-mark" aria-hidden="true">
                  ✓
                </span>
                <p className="store-eyebrow">PESANAN TERKONFIRMASI</p>
                <h3>
                  {completedOrder.fulfillmentType === 'pickup'
                    ? 'Pesanan Siap Diambil di Toko!'
                    : 'Pesanan Siap Dikirim!'}
                </h3>
                <p className="shopping-cart-receipt-id">
                  ID Transaksi: <strong>{completedOrder.id}</strong>
                </p>

                {/* Fulfillment Specific Card */}
                {completedOrder.fulfillmentType === 'pickup' ? (
                  <div className="shopping-cart-receipt-pickup-card">
                    <div className="shopping-cart-pickup-qr-box">
                      {/* High-tech stylized QR code SVG representation */}
                      <svg
                        className="shopping-cart-pickup-qr-svg"
                        viewBox="0 0 140 140"
                        aria-label="QR Pass Pengambilan"
                      >
                        <rect width="140" height="140" fill="#ffffff" rx="10" />
                        {/* Finder Pattern Top-Left */}
                        <rect x="12" y="12" width="34" height="34" fill="#0f172a" rx="4" />
                        <rect x="18" y="18" width="22" height="22" fill="#ffffff" rx="2" />
                        <rect x="23" y="23" width="12" height="12" fill="#0f172a" rx="1" />
                        {/* Finder Pattern Top-Right */}
                        <rect x="94" y="12" width="34" height="34" fill="#0f172a" rx="4" />
                        <rect x="100" y="18" width="22" height="22" fill="#ffffff" rx="2" />
                        <rect x="105" y="23" width="12" height="12" fill="#0f172a" rx="1" />
                        {/* Finder Pattern Bottom-Left */}
                        <rect x="12" y="94" width="34" height="34" fill="#0f172a" rx="4" />
                        <rect x="18" y="100" width="22" height="22" fill="#ffffff" rx="2" />
                        <rect x="23" y="105" width="12" height="12" fill="#0f172a" rx="1" />
                        {/* Data matrix dots */}
                        <rect x="54" y="16" width="8" height="8" fill="#0f172a" />
                        <rect x="70" y="16" width="14" height="8" fill="#0f172a" />
                        <rect x="54" y="30" width="14" height="6" fill="#0f172a" />
                        <rect x="74" y="30" width="8" height="8" fill="#0f172a" />
                        <rect x="18" y="54" width="12" height="10" fill="#0f172a" />
                        <rect x="36" y="54" width="10" height="8" fill="#0f172a" />
                        <rect x="54" y="50" width="32" height="32" fill="#facc15" rx="4" />
                        <circle cx="70" cy="66" r="8" fill="#0f172a" />
                        <rect x="94" y="54" width="14" height="8" fill="#0f172a" />
                        <rect x="114" y="54" width="14" height="12" fill="#0f172a" />
                        <rect x="18" y="72" width="28" height="8" fill="#0f172a" />
                        <rect x="94" y="70" width="34" height="8" fill="#0f172a" />
                        <rect x="54" y="92" width="12" height="10" fill="#0f172a" />
                        <rect x="72" y="92" width="16" height="8" fill="#0f172a" />
                        <rect x="94" y="86" width="10" height="14" fill="#0f172a" />
                        <rect x="110" y="86" width="18" height="8" fill="#0f172a" />
                        <rect x="54" y="110" width="34" height="8" fill="#0f172a" />
                        <rect x="96" y="108" width="14" height="14" fill="#0f172a" />
                        <rect x="116" y="116" width="12" height="12" fill="#0f172a" />
                      </svg>
                      <div className="shopping-cart-pickup-pass-code">
                        <span>PASS PENGAMBILAN</span>
                        <strong>{`PICKUP-${completedOrder.id.replace('ORD-', '')}`}</strong>
                      </div>
                    </div>

                    <div className="shopping-cart-pickup-store-info">
                      <span className="shopping-cart-receipt-badge">🏬 OUTLET PENGAMBILAN</span>
                      <h4>{completedOrder.store?.name}</h4>
                      <p>{completedOrder.store?.address}</p>
                      <div className="shopping-cart-pickup-store-details">
                        <span>🕒 {completedOrder.store?.hours}</span>
                        <span>📞 {completedOrder.store?.phone}</span>
                      </div>
                      <small className="shopping-cart-pickup-hint">
                        Tunjukkan QR code di atas atau sebutkan Pass Pengambilan kepada staf toko saat pengambilan.
                      </small>
                    </div>
                  </div>
                ) : (
                  <div className="shopping-cart-receipt-delivery-card">
                    <span className="shopping-cart-receipt-badge">🚚 DETAIL PENGIRIMAN</span>
                    <p>
                      Penerima: <strong>{completedOrder.customerName}</strong>
                    </p>
                    <p>
                      Alamat: <strong>{completedOrder.address}</strong>
                    </p>
                    {completedOrder.courierNote && (
                      <p>
                        Patokan Kurir: <em>{completedOrder.courierNote}</em>
                      </p>
                    )}
                    {completedOrder.coordinates && (
                      <div className="shopping-cart-receipt-gps-tag">
                        📍 Titik GPS Terkunci: {completedOrder.coordinates.lat.toFixed(4)},{' '}
                        {completedOrder.coordinates.lng.toFixed(4)}
                      </div>
                    )}
                    <div className="shopping-cart-receipt-resi">
                      <span>Estimasi Pengiriman:</span>
                      <strong>1–2 Hari Kerja (Kurir Prioritas)</strong>
                    </div>
                  </div>
                )}

                <div className="shopping-cart-receipt-meta">
                  <p>
                    Status: <strong className="shopping-cart-paid-status">{completedOrder.status}</strong>
                  </p>
                  <p>
                    Metode: <strong>{completedOrder.paymentMethod}</strong>
                  </p>
                </div>

                <div className="shopping-cart-receipt-total">
                  <span>Total Transaksi</span>
                  <strong>{formatPrice(completedOrder.total)}</strong>
                </div>

                <button
                  className="store-button store-button-dark"
                  type="button"
                  onClick={() => setActiveView('history')}
                >
                  Lihat Riwayat Transaksi
                </button>
              </div>
            ) : activeView === 'checkout' ? (
              /* View: Fulfillment Selection & Customer Form */
              <form className="shopping-cart-checkout-form">
                <ol className="shopping-cart-progress" aria-label="Tahap checkout">
                  <li className="is-active">
                    1 <span>Pengiriman</span>
                  </li>
                  <li>
                    2 <span>Pembayaran</span>
                  </li>
                </ol>

                {/* Fulfillment Method Selector: Delivery vs Store Pickup */}
                <div className="fulfillment-selector" role="radiogroup" aria-label="Metode Pemenuhan Pesanan">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={fulfillmentType === 'delivery'}
                    className={`fulfillment-option ${fulfillmentType === 'delivery' ? 'is-selected' : ''}`}
                    onClick={() => setFulfillmentType('delivery')}
                  >
                    <span className="fulfillment-option-icon">🚚</span>
                    <div className="fulfillment-option-text">
                      <strong>Kirim ke Alamat</strong>
                      <small>Kurir ekspres tiba ke alamat Anda</small>
                    </div>
                    <span className="fulfillment-option-radio" />
                  </button>

                  <button
                    type="button"
                    role="radio"
                    aria-checked={fulfillmentType === 'pickup'}
                    className={`fulfillment-option ${fulfillmentType === 'pickup' ? 'is-selected' : ''}`}
                    onClick={() => setFulfillmentType('pickup')}
                  >
                    <span className="fulfillment-option-icon">🏬</span>
                    <div className="fulfillment-option-text">
                      <strong>Ambil di Toko</strong>
                      <small>Click & Collect di outlet resmi</small>
                    </div>
                    <span className="fulfillment-option-radio" />
                  </button>
                </div>

                {/* DELIVERY MODE */}
                {fulfillmentType === 'delivery' ? (
                  <>
                    <label>
                      <span>Nama Lengkap Penerima</span>
                      <input
                        name="name"
                        autoComplete="name"
                        required
                        maxLength={100}
                        placeholder="cth. Ricki Gilang"
                        defaultValue={checkoutCustomer?.name || ''}
                      />
                    </label>

                    <div className="shopping-cart-form-grid">
                      <label>
                        <span>Nomor WhatsApp / HP</span>
                        <input
                          name="phone"
                          type="tel"
                          autoComplete="tel"
                          required
                          maxLength={20}
                          placeholder="cth. 0812-3456-7890"
                          defaultValue={checkoutCustomer?.phone || ''}
                        />
                      </label>
                      <label>
                        <span>Alamat Email</span>
                        <input
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          maxLength={254}
                          placeholder="cth. ricki@example.com"
                          defaultValue={checkoutCustomer?.email || ''}
                        />
                      </label>
                    </div>

                    {/* Pinpoint Maps Address Selector Box */}
                    <div className="pinpoint-address-box">
                      <div className="pinpoint-address-header">
                        <span className="pinpoint-address-label">
                          <span className="pinpoint-icon">📍</span> TITIK PENGIRIMAN PETA
                        </span>
                        {pinnedLocation?.coordinates ? (
                          <span className="pinpoint-status-locked">✓ Titik Terkunci</span>
                        ) : (
                          <span className="pinpoint-status-optional">Rekomendasi Akurat</span>
                        )}
                      </div>

                      {pinnedLocation ? (
                        <div className="pinpoint-address-preview">
                          <p className="pinpoint-address-text">{pinnedLocation.address}</p>
                          <div className="pinpoint-address-meta">
                            <span className="pinpoint-coords-tag">
                              GPS: {pinnedLocation.coordinates.lat.toFixed(4)},{' '}
                              {pinnedLocation.coordinates.lng.toFixed(4)}
                            </span>
                            {pinnedLocation.courierNote && (
                              <span className="pinpoint-note-tag">
                                Patokan: {pinnedLocation.courierNote}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            className="pinpoint-change-btn"
                            onClick={() => setIsMapModalOpen(true)}
                          >
                            <span>📍 Ubah Titik Lokasi di Peta</span>
                          </button>
                        </div>
                      ) : (
                        <div className="pinpoint-address-placeholder">
                          <p>
                            Gunakan peta interaktif agar kurir dapat menemukan lokasi rumah atau kantor
                            dengan akurat tanpa tersesat.
                          </p>
                          <button
                            type="button"
                            className="pinpoint-open-btn"
                            onClick={() => setIsMapModalOpen(true)}
                          >
                            <span className="pinpoint-btn-icon">📍</span>
                            <span>Buka Peta & Tentukan Titik Rumah</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <label>
                      <span>Alamat Pengiriman Lengkap</span>
                      <textarea
                        name="address"
                        autoComplete="street-address"
                        required
                        maxLength={300}
                        rows={3}
                        placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan, dan kota..."
                        value={addressInput}
                        onChange={(e) => setAddressInput(e.target.value)}
                      />
                    </label>

                    <label>
                      <span>Catatan Kurir & Patokan (Opsional)</span>
                      <input
                        name="courierNote"
                        maxLength={120}
                        placeholder="Cth: Pagar abu-abu / Dekat pos satpam / Titip di pos"
                        value={courierNoteInput}
                        onChange={(e) => setCourierNoteInput(e.target.value)}
                      />
                    </label>
                  </>
                ) : (
                  /* STORE PICKUP MODE */
                  <>
                    <div className="store-pickup-banner">
                      <span className="store-pickup-banner-icon">🛍️</span>
                      <div>
                        <strong>Ambil Langsung di Outlet Resmi (Click & Collect)</strong>
                        <p>
                          Bebas biaya pengiriman! Pesanan Anda akan dikemas rapi dan dapat diambil langsung
                          dalam 2 jam setelah pembayaran selesai.
                        </p>
                      </div>
                    </div>

                    <label>
                      <span>Nama Lengkap Pengambil (Sesuai KTP/SIM)</span>
                      <input
                        name="name"
                        autoComplete="name"
                        required
                        maxLength={100}
                        placeholder="cth. Ricki Gilang"
                        defaultValue={checkoutCustomer?.name || ''}
                      />
                    </label>

                    <div className="shopping-cart-form-grid">
                      <label>
                        <span>Nomor WhatsApp / HP</span>
                        <input
                          name="phone"
                          type="tel"
                          autoComplete="tel"
                          required
                          maxLength={20}
                          placeholder="cth. 0812-3456-7890"
                          defaultValue={checkoutCustomer?.phone || ''}
                        />
                      </label>
                      <label>
                        <span>Alamat Email</span>
                        <input
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          maxLength={254}
                          placeholder="cth. ricki@example.com"
                          defaultValue={checkoutCustomer?.email || ''}
                        />
                      </label>
                    </div>

                    <div className="store-outlets-selection">
                      <span className="store-outlets-label">Pilih Outlet Pengambilan Terdekat</span>
                      <div className="store-outlets-list" role="radiogroup">
                        {OFFICIAL_STORES.map((store) => {
                          const isSelected = selectedStoreId === store.id;
                          return (
                            <div
                              key={store.id}
                              className={`store-outlet-card ${isSelected ? 'is-selected' : ''}`}
                              onClick={() => setSelectedStoreId(store.id)}
                              role="radio"
                              aria-checked={isSelected}
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === ' ' || e.key === 'Enter') {
                                  setSelectedStoreId(store.id);
                                }
                              }}
                            >
                              <div className="store-outlet-card-head">
                                <div className="store-outlet-title-row">
                                  <strong>{store.name}</strong>
                                  {store.isPopular && (
                                    <span className="store-outlet-badge-pop">POPULER</span>
                                  )}
                                </div>
                                <span className="store-outlet-dist">{store.distance}</span>
                              </div>

                              <p className="store-outlet-address">{store.address}</p>

                              <div className="store-outlet-meta">
                                <span>🕒 {store.hours}</span>
                                <span>📞 {store.phone}</span>
                              </div>

                              <div className="store-outlet-stock-row">
                                <span className="store-outlet-stock-badge">
                                  ✓ Stok Ukuran Tersedia di Toko Ini
                                </span>
                                <span className="store-outlet-estimate">{store.readyEstimate}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                <div className="shopping-cart-form-total">
                  <span>Total Belanja</span>
                  <strong>{formatPrice(subtotal)}</strong>
                </div>

                <button
                  className="store-button store-button-dark shopping-cart-checkout"
                  type="button"
                  onClick={continueToPayment}
                >
                  Lanjut ke Pembayaran <span aria-hidden="true">→</span>
                </button>
                <button
                  className="shopping-cart-back"
                  type="button"
                  onClick={() => setActiveView('cart')}
                >
                  ← Kembali ke keranjang
                </button>
              </form>
            ) : activeView === 'payment' ? (
              /* View: Payment Selection */
              <form className="shopping-cart-checkout-form" onSubmit={handlePayment}>
                <ol className="shopping-cart-progress" aria-label="Tahap checkout">
                  <li className="is-complete">
                    ✓ <span>Pengiriman</span>
                  </li>
                  <li className="is-active">
                    2 <span>Pembayaran</span>
                  </li>
                </ol>

                {/* Delivery or Store Pickup Summary */}
                <div className="shopping-cart-delivery-summary">
                  {checkoutCustomer?.fulfillmentType === 'pickup' ? (
                    <>
                      <div className="shopping-cart-summary-tag">
                        <span>🏬 AMBIL DI TOKO RESMI</span>
                      </div>
                      <strong>Pengambil: {checkoutCustomer?.name}</strong>
                      <p>No. Kontak: {checkoutCustomer?.phone}</p>
                      <p>
                        Outlet: <strong>{checkoutCustomer?.store?.name}</strong>
                      </p>
                      <p className="shopping-cart-summary-sub">{checkoutCustomer?.store?.address}</p>
                      <small>🕒 {checkoutCustomer?.store?.hours}</small>
                    </>
                  ) : (
                    <>
                      <div className="shopping-cart-summary-tag">
                        <span>🚚 PENGIRIMAN KE ALAMAT</span>
                      </div>
                      <strong>Penerima: {checkoutCustomer?.name}</strong>
                      <p>No. Kontak: {checkoutCustomer?.phone}</p>
                      <p>Alamat: {checkoutCustomer?.address}</p>
                      {checkoutCustomer?.courierNote && (
                        <p className="shopping-cart-summary-sub">
                          Patokan: {checkoutCustomer?.courierNote}
                        </p>
                      )}
                      {checkoutCustomer?.coordinates && (
                        <small>
                          📍 Titik GPS: {checkoutCustomer.coordinates.lat.toFixed(4)},{' '}
                          {checkoutCustomer.coordinates.lng.toFixed(4)}
                        </small>
                      )}
                    </>
                  )}
                </div>

                <fieldset className="shopping-cart-payment-methods">
                  <legend>Pilih Metode Pembayaran</legend>
                  <label className="shopping-cart-payment-option">
                    <input type="radio" name="paymentMethod" value="QRIS Instan" defaultChecked required />
                    <span className="shopping-cart-payment-icon" aria-hidden="true">
                      ▦
                    </span>
                    <span>
                      <strong>QRIS Instan</strong>
                      <small>Scan QR code e-wallet (GoPay, OVO, Dana, ShopeePay)</small>
                    </span>
                  </label>
                  <label className="shopping-cart-payment-option">
                    <input type="radio" name="paymentMethod" value="BCA Virtual Account" required />
                    <span className="shopping-cart-payment-icon" aria-hidden="true">
                      ▤
                    </span>
                    <span>
                      <strong>BCA Virtual Account</strong>
                      <small>Transfer otomatis via Virtual Account</small>
                    </span>
                  </label>
                  <label className="shopping-cart-payment-option">
                    <input type="radio" name="paymentMethod" value="Kartu Kredit / Debit" required />
                    <span className="shopping-cart-payment-icon" aria-hidden="true">
                      ▣
                    </span>
                    <span>
                      <strong>Kartu Kredit / Debit</strong>
                      <small>Pembayaran aman Visa / Mastercard / JCB</small>
                    </span>
                  </label>
                </fieldset>

                <div className="shopping-cart-payment-footer">
                  <div className="shopping-cart-form-total">
                    <span>Total Pembayaran</span>
                    <strong>{formatPrice(subtotal)}</strong>
                  </div>
                  <button className="store-button store-button-dark shopping-cart-checkout" type="submit">
                    Konfirmasi Pembayaran ({formatPrice(subtotal)}) <span aria-hidden="true">✓</span>
                  </button>
                  <small>Pembayaran aman dan terenkripsi SSL 256-bit.</small>
                </div>
                <button
                  className="shopping-cart-back"
                  type="button"
                  onClick={() => setActiveView('checkout')}
                >
                  ← Ubah data pengiriman
                </button>
              </form>
            ) : items.length === 0 ? (
              /* View: Empty Cart */
              <div className="shopping-cart-empty">
                <div className="shopping-cart-empty-circle">👟</div>
                <h3>Keranjang Masih Kosong</h3>
                <p>Pilih sepatu yang kamu sukai di katalog 3D, tentukan ukuran dan colorway, lalu tambahkan ke sini.</p>
                <button className="store-button store-button-dark" type="button" onClick={onClose}>
                  Jelajahi Koleksi 3D
                </button>
              </div>
            ) : (
              /* View: Cart Items List */
              <>
                <div className="shopping-cart-perks-banner">
                  <span className="shopping-cart-perks-icon">✨</span>
                  <span>
                    Pesanan ini memenuhi syarat <strong>Gratis Ongkir & Bebas Ambil di Toko</strong>
                  </span>
                </div>

                <div className="shopping-cart-items">
                  {items.map(({ key, shoe, size, colorName, quantity, price }) => (
                    <article className="shopping-cart-item" key={key}>
                      <div className="shopping-cart-item-thumb">
                        <img src={shoe.image} alt={shoe.name} />
                      </div>
                      <div className="shopping-cart-item-info">
                        <h3>{shoe.name}</h3>
                        <div className="shopping-cart-item-badges">
                          {colorName && (
                            <span className="shopping-cart-badge-pill">{colorName}</span>
                          )}
                          {size && (
                            <span className="shopping-cart-badge-pill">
                              EU {size.eu} ({size.cm} cm)
                            </span>
                          )}
                        </div>
                        <strong className="shopping-cart-item-price">{formatPrice(price)}</strong>
                        <div className="shopping-cart-item-controls">
                          <div className="shopping-cart-quantity" aria-label={`Jumlah ${shoe.name}`}>
                            <button
                              type="button"
                              onClick={() => onChangeQuantity(key, quantity - 1)}
                              aria-label="Kurangi jumlah"
                            >
                              −
                            </button>
                            <span>{quantity}</span>
                            <button
                              type="button"
                              onClick={() => onChangeQuantity(key, quantity + 1)}
                              aria-label="Tambah jumlah"
                            >
                              ＋
                            </button>
                          </div>
                          <button
                            className="shopping-cart-remove"
                            type="button"
                            onClick={() => onRemove(key)}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                      <strong className="shopping-cart-line-total">
                        {formatPrice(price * quantity)}
                      </strong>
                    </article>
                  ))}
                </div>

                <div className="shopping-cart-summary">
                  <div className="shopping-cart-summary-line">
                    <span>Subtotal Produk</span>
                    <strong>{formatPrice(subtotal)}</strong>
                  </div>
                  <div className="shopping-cart-summary-line">
                    <span>Estimasi Pengiriman / Ambil di Toko</span>
                    <span className="shopping-cart-free-tag">GRATIS</span>
                  </div>
                  <div className="shopping-cart-summary-total">
                    <span>Total Pembayaran</span>
                    <strong className="shopping-cart-grand-total">{formatPrice(subtotal)}</strong>
                  </div>
                  <button
                    className="store-button store-button-dark shopping-cart-checkout"
                    type="button"
                    onClick={() => {
                      setCheckoutCustomer(null);
                      setActiveView('checkout');
                    }}
                  >
                    Lanjut ke Checkout <span aria-hidden="true">→</span>
                  </button>
                  <div className="shopping-cart-secure-footer">
                    <span>🔒 Pembayaran Aman & Terenkripsi</span>
                    <span>•</span>
                    <span>Garansi 100% Original</span>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {/* Address Pinpoint Maps Modal */}
      <AddressMapModal
        isOpen={isMapModalOpen}
        initialAddress={addressInput || pinnedLocation?.address || ''}
        initialCoords={pinnedLocation?.coordinates || null}
        initialNote={courierNoteInput || pinnedLocation?.courierNote || ''}
        onClose={() => setIsMapModalOpen(false)}
        onConfirmAddress={handleConfirmAddressFromMap}
      />
    </>
  );
}

export default ShoppingCart;
