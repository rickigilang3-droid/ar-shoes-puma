import React, { useState, useEffect } from 'react';
import { formatPrice } from '../data/products';

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
  const [checkoutCustomer, setCheckoutCustomer] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setActiveView(initialView || 'cart');
    }
  }, [isOpen, initialView]);

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

  const continueToPayment = (event) => {
    const form = event.currentTarget.form;
    if (!form?.reportValidity()) return;
    const formData = new FormData(form);
    setCheckoutCustomer({
      name: formData.get('name'),
      email: formData.get('email'),
      address: formData.get('address'),
    });
    setActiveView('payment');
  };

  const handleOpen = () => {
    setActiveView('cart');
    onOpen();
  };

  return (
    <>
      <button
        className={`shopping-cart-trigger ${itemCount > 0 ? 'has-items' : ''}`}
        type="button"
        onClick={handleOpen}
        aria-label={`Buka keranjang, ${itemCount} barang, subtotal ${formatPrice(subtotal)}`}
      >
        <span className="shopping-cart-trigger-badge">
          <svg className="shopping-cart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

      {isOpen && (
        <div className="shopping-cart-backdrop">
          <button className="shopping-cart-dismiss" type="button" onClick={onClose} aria-label="Tutup keranjang" />
          <section
            className="shopping-cart-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shopping-cart-title"
          >
            <header className="shopping-cart-header">
              <div>
                <p className="store-eyebrow">STUDIO CHECKOUT SIMULATION</p>
                <h2 id="shopping-cart-title">
                  {activeView === 'history' ? 'Riwayat Pesanan' : activeView === 'checkout' ? 'Data Pengiriman' : activeView === 'payment' ? 'Pilih Pembayaran' : activeView === 'receipt' ? 'Pesanan Terkonfirmasi' : 'Keranjang Belanja'}
                  {activeView === 'cart' && <span> ({itemCount} item)</span>}
                </h2>
              </div>
              <div className="shopping-cart-header-actions">
                <button className="shopping-cart-history-link" type="button" onClick={() => setActiveView(activeView === 'history' ? 'cart' : 'history')}>
                  {activeView === 'history' ? `← Keranjang (${itemCount})` : `Transaksi (${transactions.length})`}
                </button>
                <button className="shopping-cart-close" type="button" onClick={onClose} aria-label="Tutup keranjang">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </header>

            {activeView === 'history' ? (
              <div className="shopping-cart-history">
                {transactions.length === 0 ? (
                  <div className="shopping-cart-empty">
                    <div className="shopping-cart-empty-circle">📋</div>
                    <h3>Belum ada pesanan</h3>
                    <p>Pesanan simulasi yang diselesaikan akan otomatis tersimpan di browser ini.</p>
                    {itemCount > 0 && (
                      <button className="store-button store-button-dark" type="button" onClick={() => setActiveView('cart')}>
                        Lihat keranjang aktif
                      </button>
                    )}
                  </div>
                ) : transactions.map((transaction) => (
                  <article className="shopping-cart-transaction" key={transaction.id}>
                    <div>
                      <strong>{transaction.id}</strong>
                      <span>{new Date(transaction.createdAt).toLocaleString('id-ID')}</span>
                    </div>
                    <p>{transaction.items.map((item) => `${item.name} ×${item.quantity}`).join(', ')}</p>
                    <p>Metode pembayaran: {transaction.paymentMethod}</p>
                    <div>
                      <span className="shopping-cart-badge-done">{transaction.status}</span>
                      <strong>{formatPrice(transaction.total)}</strong>
                    </div>
                  </article>
                ))}
              </div>
            ) : activeView === 'receipt' && completedOrder ? (
              <div className="shopping-cart-receipt" role="status">
                <span className="shopping-cart-success-mark" aria-hidden="true">✓</span>
                <p className="store-eyebrow">SIMULASI BERHASIL</p>
                <h3>Pesanan Siap Dikirim!</h3>
                <p>ID Transaksi: <strong>{completedOrder.id}</strong></p>
                <p>Penerima: <strong>{completedOrder.customerName}</strong></p>
                <p>Status: <strong className="shopping-cart-paid-status">{completedOrder.status}</strong></p>
                <p>Metode: <strong>{completedOrder.paymentMethod}</strong></p>
                <div className="shopping-cart-receipt-total">
                  <span>Total Transaksi</span>
                  <strong>{formatPrice(completedOrder.total)}</strong>
                </div>
                <small className="shopping-cart-receipt-demo-note">
                  Ini adalah simulasi studio. Tidak ada penagihan kartu atau transfer bank sungguhan.
                </small>
                <button className="store-button store-button-dark" type="button" onClick={() => setActiveView('history')}>
                  Lihat Riwayat Transaksi
                </button>
              </div>
            ) : activeView === 'checkout' ? (
              <form className="shopping-cart-checkout-form">
                <ol className="shopping-cart-progress" aria-label="Tahap checkout">
                  <li className="is-active">1 <span>Pengiriman</span></li>
                  <li>2 <span>Pembayaran</span></li>
                </ol>
                <div className="shopping-cart-demo-warning">
                  <span>ℹ️</span>
                  <span>Simulasi Checkout: Data formulir ini hanya digunakan untuk demonstrasi di browser.</span>
                </div>
                <label>
                  <span>Nama Lengkap Penerima</span>
                  <input name="name" autoComplete="name" required maxLength={100} placeholder="cth. Ricki Gilang" defaultValue={checkoutCustomer?.name || ''} />
                </label>
                <label>
                  <span>Alamat Email</span>
                  <input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="cth. ricki@example.com" defaultValue={checkoutCustomer?.email || ''} />
                </label>
                <label>
                  <span>Alamat Pengiriman (Simulasi)</span>
                  <textarea name="address" autoComplete="street-address" required maxLength={300} rows={3} placeholder="Alamat lengkap tujuan pengiriman..." defaultValue={checkoutCustomer?.address || ''} />
                </label>
                <div className="shopping-cart-form-total">
                  <span>Total Belanja</span>
                  <strong>{formatPrice(subtotal)}</strong>
                </div>
                <button className="store-button store-button-dark shopping-cart-checkout" type="button" onClick={continueToPayment}>
                  Lanjut ke Pembayaran <span aria-hidden="true">→</span>
                </button>
                <button className="shopping-cart-back" type="button" onClick={() => setActiveView('cart')}>← Kembali ke keranjang</button>
              </form>
            ) : activeView === 'payment' ? (
              <form className="shopping-cart-checkout-form" onSubmit={handlePayment}>
                <ol className="shopping-cart-progress" aria-label="Tahap checkout">
                  <li className="is-complete">✓ <span>Pengiriman</span></li>
                  <li className="is-active">2 <span>Pembayaran</span></li>
                </ol>
                <div className="shopping-cart-delivery-summary">
                  <span>Kirim ke:</span>
                  <strong>{checkoutCustomer?.name}</strong>
                  <p>{checkoutCustomer?.address}</p>
                </div>
                <fieldset className="shopping-cart-payment-methods">
                  <legend>Pilih Metode Pembayaran (Simulasi)</legend>
                  <label className="shopping-cart-payment-option">
                    <input type="radio" name="paymentMethod" value="QRIS (Instant Demo)" defaultChecked required />
                    <span className="shopping-cart-payment-icon" aria-hidden="true">▦</span>
                    <span><strong>QRIS Instan</strong><small>Simulasi scan QR code e-wallet</small></span>
                  </label>
                  <label className="shopping-cart-payment-option">
                    <input type="radio" name="paymentMethod" value="BCA Virtual Account (Demo)" required />
                    <span className="shopping-cart-payment-icon" aria-hidden="true">▤</span>
                    <span><strong>Virtual Account</strong><small>BCA / Mandiri / BNI Virtual Account</small></span>
                  </label>
                  <label className="shopping-cart-payment-option">
                    <input type="radio" name="paymentMethod" value="Kartu Kredit / Debit (Demo)" required />
                    <span className="shopping-cart-payment-icon" aria-hidden="true">▣</span>
                    <span><strong>Kartu Kredit / Debit</strong><small>Simulasi Visa / Mastercard</small></span>
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
                  <small>Konfirmasi ini akan langsung mensimulasikan pelunasan pesanan.</small>
                </div>
                <button className="shopping-cart-back" type="button" onClick={() => setActiveView('checkout')}>← Ubah data pengiriman</button>
              </form>
            ) : items.length === 0 ? (
              <div className="shopping-cart-empty">
                <div className="shopping-cart-empty-circle">👟</div>
                <h3>Keranjang Masih Kosong</h3>
                <p>Pilih sepatu yang kamu sukai di katalog 3D, tentukan ukuran dan colorway, lalu tambahkan ke sini.</p>
                <button className="store-button store-button-dark" type="button" onClick={onClose}>Jelajahi Koleksi 3D</button>
              </div>
            ) : (
              <>
                <div className="shopping-cart-perks-banner">
                  <span className="shopping-cart-perks-icon">✨</span>
                  <span>Pesanan ini memenuhi syarat <strong>Gratis Ongkir Studio</strong></span>
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
                            <span className="shopping-cart-badge-pill">EU {size.eu} ({size.cm} cm)</span>
                          )}
                        </div>
                        <strong className="shopping-cart-item-price">{formatPrice(price)}</strong>
                        <div className="shopping-cart-item-controls">
                          <div className="shopping-cart-quantity" aria-label={`Jumlah ${shoe.name}`}>
                            <button type="button" onClick={() => onChangeQuantity(key, quantity - 1)} aria-label="Kurangi jumlah">−</button>
                            <span>{quantity}</span>
                            <button type="button" onClick={() => onChangeQuantity(key, quantity + 1)} aria-label="Tambah jumlah">＋</button>
                          </div>
                          <button className="shopping-cart-remove" type="button" onClick={() => onRemove(key)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                      <strong className="shopping-cart-line-total">{formatPrice(price * quantity)}</strong>
                    </article>
                  ))}
                </div>

                <div className="shopping-cart-summary">
                  <div className="shopping-cart-summary-line">
                    <span>Subtotal Produk</span>
                    <strong>{formatPrice(subtotal)}</strong>
                  </div>
                  <div className="shopping-cart-summary-line">
                    <span>Estimasi Pengiriman</span>
                    <span className="shopping-cart-free-tag">GRATIS</span>
                  </div>
                  <div className="shopping-cart-summary-total">
                    <span>Total Pembayaran</span>
                    <strong className="shopping-cart-grand-total">{formatPrice(subtotal)}</strong>
                  </div>
                  <button className="store-button store-button-dark shopping-cart-checkout" type="button" onClick={() => { setCheckoutCustomer(null); setActiveView('checkout'); }}>
                    Lanjut ke Checkout <span aria-hidden="true">→</span>
                  </button>
                  <div className="shopping-cart-secure-footer">
                    <span>🔒 Simulasi Transaksi Aman</span>
                    <span>•</span>
                    <span>100% Bebas Biaya</span>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}

export default ShoppingCart;
