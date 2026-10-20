import React, { useState } from 'react';
import { formatPrice } from '../data/products';

function ShoppingCart({
  items,
  transactions,
  itemCount,
  subtotal,
  isOpen,
  onOpen,
  onClose,
  onChangeQuantity,
  onRemove,
  onCompleteCheckout,
}) {
  const [activeView, setActiveView] = useState('cart');
  const [checkoutCustomer, setCheckoutCustomer] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);

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
        className="shopping-cart-trigger"
        type="button"
        onClick={handleOpen}
        aria-label={`Buka keranjang, ${itemCount} barang`}
      >
        <span aria-hidden="true">♧</span>
        <span>Keranjang</span>
        <span className="shopping-cart-count">{itemCount}</span>
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
                <p className="store-eyebrow">PILIHAN SEPATUMU</p>
                <h2 id="shopping-cart-title">
                  {activeView === 'history' ? 'Transaksi' : activeView === 'checkout' ? 'Pengiriman' : activeView === 'payment' ? 'Pembayaran' : activeView === 'receipt' ? 'Pesanan dibuat' : 'Keranjang'}
                  {activeView === 'cart' && <span> ({itemCount})</span>}
                </h2>
              </div>
              <div className="shopping-cart-header-actions">
                <button className="shopping-cart-history-link" type="button" onClick={() => setActiveView(activeView === 'history' ? 'cart' : 'history')}>
                  {activeView === 'history' ? `← Keranjang (${itemCount})` : `Transaksi (${transactions.length})`}
                </button>
                <button className="shopping-cart-close" type="button" onClick={onClose} aria-label="Tutup keranjang">×</button>
              </div>
            </header>

            {activeView === 'history' ? (
              <div className="shopping-cart-history">
                {transactions.length === 0 ? (
                  <div className="shopping-cart-empty">
                    <h3>Belum ada pesanan</h3>
                    <p>Pesanan yang diselesaikan melalui checkout akan tersimpan dan ditampilkan di sini.</p>
                    {itemCount > 0 && (
                      <button className="store-button store-button-dark" type="button" onClick={() => setActiveView('cart')}>
                        Lihat keranjang
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
                      <span>{transaction.status}</span>
                      <strong>{formatPrice(transaction.total)}</strong>
                    </div>
                  </article>
                ))}
              </div>
            ) : activeView === 'receipt' && completedOrder ? (
              <div className="shopping-cart-receipt" role="status">
                <span className="shopping-cart-success-mark" aria-hidden="true">✓</span>
                <p className="store-eyebrow">CHECKOUT DEMO SELESAI</p>
                <h3>Pesanan simulasi berhasil dibuat</h3>
                <p>Nomor transaksi: <strong>{completedOrder.id}</strong></p>
                <p>Nama: <strong>{completedOrder.customerName}</strong></p>
                <p>Status pembayaran: <strong>{completedOrder.status}</strong></p>
                <p>Metode: <strong>{completedOrder.paymentMethod}</strong></p>
                <p>Total: <strong>{formatPrice(completedOrder.total)}</strong></p>
                <small>Tidak ada uang yang ditagihkan. Transaksi ini hanya tersimpan di browser ini sebagai demonstrasi.</small>
                <button className="store-button store-button-dark" type="button" onClick={() => setActiveView('history')}>Lihat riwayat transaksi</button>
              </div>
            ) : activeView === 'checkout' ? (
              <form className="shopping-cart-checkout-form">
                <ol className="shopping-cart-progress" aria-label="Tahap checkout">
                  <li className="is-active">1 <span>Pengiriman</span></li>
                  <li>2 <span>Pembayaran</span></li>
                </ol>
                <p className="shopping-cart-demo-warning">Checkout demo: pesanan dan status pembayaran hanya simulasi. Tidak ada uang yang ditagihkan.</p>
                <label>
                  Nama lengkap
                  <input name="name" autoComplete="name" required maxLength={100} />
                </label>
                <label>
                  Email
                  <input name="email" type="email" autoComplete="email" required maxLength={254} />
                </label>
                <label>
                  Alamat pengiriman (demo)
                  <textarea name="address" autoComplete="street-address" required maxLength={300} rows={3} />
                </label>
                <div className="shopping-cart-form-total"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
                <button className="store-button store-button-dark shopping-cart-checkout" type="button" onClick={continueToPayment}>
                  Lanjut ke pembayaran <span aria-hidden="true">→</span>
                </button>
                <button className="shopping-cart-back" type="button" onClick={() => setActiveView('cart')}>← Kembali ke keranjang</button>
              </form>
            ) : activeView === 'payment' ? (
              <form className="shopping-cart-checkout-form" onSubmit={handlePayment}>
                <ol className="shopping-cart-progress" aria-label="Tahap checkout">
                  <li className="is-complete">✓ <span>Pengiriman</span></li>
                  <li className="is-active">2 <span>Pembayaran</span></li>
                </ol>
                <p className="shopping-cart-delivery-summary">
                  Dikirim ke <strong>{checkoutCustomer?.name}</strong><br />
                  {checkoutCustomer?.address}
                </p>
                <fieldset className="shopping-cart-payment-methods">
                  <legend>Pilih metode pembayaran</legend>
                  <label className="shopping-cart-payment-option">
                    <input type="radio" name="paymentMethod" value="QRIS (simulasi)" defaultChecked required />
                    <span className="shopping-cart-payment-icon" aria-hidden="true">▦</span>
                    <span><strong>QRIS</strong><small>Pembayaran kode QR · simulasi</small></span>
                  </label>
                  <label className="shopping-cart-payment-option">
                    <input type="radio" name="paymentMethod" value="Transfer bank (simulasi)" required />
                    <span className="shopping-cart-payment-icon" aria-hidden="true">▤</span>
                    <span><strong>Transfer bank</strong><small>Simulasi transfer</small></span>
                  </label>
                  <label className="shopping-cart-payment-option">
                    <input type="radio" name="paymentMethod" value="E-wallet (simulasi)" required />
                    <span className="shopping-cart-payment-icon" aria-hidden="true">▣</span>
                    <span><strong>E-wallet</strong><small>Simulasi pembayaran digital</small></span>
                  </label>
                </fieldset>
                <div className="shopping-cart-payment-footer">
                  <div className="shopping-cart-form-total"><span>Total pembayaran</span><strong>{formatPrice(subtotal)}</strong></div>
                  <button className="store-button store-button-dark shopping-cart-checkout" type="submit">
                    Bayar {formatPrice(subtotal)} <span aria-hidden="true">→</span>
                  </button>
                  <small>Pembayaran demo — tidak ada tagihan sungguhan.</small>
                </div>
                <button className="shopping-cart-back" type="button" onClick={() => setActiveView('checkout')}>← Kembali ke pengiriman</button>
              </form>
            ) : items.length === 0 ? (
              <div className="shopping-cart-empty">
                <span aria-hidden="true">＋</span>
                <h3>Keranjang masih kosong</h3>
                <p>Pilih sepatu dan tambahkan ke keranjang untuk melihat ringkasannya di sini.</p>
                <button className="store-button store-button-dark" type="button" onClick={onClose}>Jelajahi koleksi</button>
              </div>
            ) : (
              <>
                <div className="shopping-cart-items">
                  {items.map(({ key, shoe, size, colorName, quantity, price }) => (
                    <article className="shopping-cart-item" key={key}>
                      <img src={shoe.image} alt="" />
                      <div className="shopping-cart-item-info">
                        <h3>{shoe.name}</h3>
                        <p>{[colorName, size ? `EU ${size.eu} · ${size.cm} cm` : null].filter(Boolean).join(' · ') || 'Ukuran tidak ditentukan'}</p>
                        <strong>{formatPrice(price)}</strong>
                        <div className="shopping-cart-item-controls">
                          <div className="shopping-cart-quantity" aria-label={`Jumlah ${shoe.name}`}>
                            <button type="button" onClick={() => onChangeQuantity(key, quantity - 1)} aria-label="Kurangi jumlah">−</button>
                            <span>{quantity}</span>
                            <button type="button" onClick={() => onChangeQuantity(key, quantity + 1)} aria-label="Tambah jumlah">＋</button>
                          </div>
                          <button className="shopping-cart-remove" type="button" onClick={() => onRemove(key)}>Hapus</button>
                        </div>
                      </div>
                      <strong className="shopping-cart-line-total">{formatPrice(price * quantity)}</strong>
                    </article>
                  ))}
                </div>

                <div className="shopping-cart-summary">
                  <div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
                  <p>Ongkir dan ketersediaan tidak dihitung dalam demo ini.</p>
                  <button className="store-button store-button-dark shopping-cart-checkout" type="button" onClick={() => { setCheckoutCustomer(null); setActiveView('checkout'); }}>
                    Lanjut ke checkout <span aria-hidden="true">→</span>
                  </button>
                  <small>Harga referensi katalog. Transaksi dan pembayaran hanya simulasi.</small>
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
