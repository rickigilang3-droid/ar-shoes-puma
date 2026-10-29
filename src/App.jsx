import React, { Component, Suspense, lazy, useEffect, useState } from 'react';
import './App.css';
import ShoppingCart from './components/ShoppingCart';
import ShoeCatalogPage from './pages/ShoeCatalogPage';
import { getShoeById, shoes } from './data/products';

const ShoeDetailPage = lazy(() => import('./pages/ShoeDetailPage'));
const ShoeComparePage = lazy(() => import('./pages/ShoeComparePage'));
const ARPage = lazy(() => import('./pages/ARPage'));

class RouteErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('[Product detail error]', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="store-not-found">
          <p className="store-eyebrow">DETAIL BELUM DAPAT DIBUKA</p>
          <h1>Viewer produk mengalami kendala.</h1>
          <button className="store-button store-button-dark" onClick={this.props.onBack}>
            Kembali ke katalog
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}

const getRoute = () => {
  if (/^\/ar\/?$/.test(window.location.pathname)) return { page: 'ar' };
  if (/^\/compare\/?$/.test(window.location.pathname)) {
    const params = new URLSearchParams(window.location.search);
    return { page: 'compare', leftId: params.get('left'), rightId: params.get('right') };
  }
  const match = window.location.pathname.match(/^\/shoe\/([^/]+)\/?$/);
  return match ? { page: 'detail', id: decodeURIComponent(match[1]) } : { page: 'catalog' };
};

function App() {
  const [route, setRoute] = useState(getRoute);
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = JSON.parse(window.localStorage.getItem('ar-shoes-cart') || '[]');
      if (!Array.isArray(savedCart)) return [];
      return savedCart.filter((item) => (
        item &&
        typeof item.key === 'string' &&
        typeof item.shoeId === 'string' &&
        (item.sizeEu === null || Number.isFinite(item.sizeEu)) &&
        typeof item.colorName === 'string' &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
      ));
    } catch (error) {
      console.error('[Shopping cart] Could not restore saved cart', error);
      return [];
    }
  });
  const [transactions, setTransactions] = useState(() => {
    try {
      const savedTransactions = JSON.parse(window.localStorage.getItem('ar-shoes-transactions') || '[]');
      return Array.isArray(savedTransactions) ? savedTransactions : [];
    } catch (error) {
      console.error('[Shopping cart] Could not restore transaction history', error);
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartInitialView, setCartInitialView] = useState('cart');

  useEffect(() => {
    const onPopState = () => setRoute(getRoute());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('ar-shoes-cart', JSON.stringify(cart));
    } catch (error) {
      console.error('[Shopping cart] Could not save cart', error);
    }
  }, [cart]);

  useEffect(() => {
    try {
      window.localStorage.setItem('ar-shoes-transactions', JSON.stringify(transactions));
    } catch (error) {
      console.error('[Shopping cart] Could not save transaction history', error);
    }
  }, [transactions]);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setRoute(getRoute());
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const addToCart = (shoe, size, color, targetView = 'cart') => {
    if (!shoe.price) return;
    const sizeEu = size?.eu ?? null;
    const colorName = color?.name ?? '';
    const key = `${shoe.id}:${sizeEu ?? 'na'}:${colorName}`;
    setCart((current) => {
      const existing = current.find((item) => item.key === key);
      if (existing) {
        return current.map((item) => item.key === key
          ? { ...item, quantity: item.quantity + 1 }
          : item);
      }
      return [...current, { key, shoeId: shoe.id, sizeEu, colorName, quantity: 1 }];
    });
    setCartInitialView(targetView);
    setIsCartOpen(true);
  };

  const updateCartQuantity = (key, quantity) => {
    setCart((current) => quantity < 1
      ? current.filter((item) => item.key !== key)
      : current.map((item) => item.key === key ? { ...item, quantity } : item));
  };

  const removeFromCart = (key) => {
    setCart((current) => current.filter((item) => item.key !== key));
  };

  const cartItems = cart.flatMap((item) => {
    const shoe = shoes.find((product) => product.id === item.shoeId);
    if (!shoe?.price) return [];
    const price = Array.isArray(shoe.price) ? shoe.price[0] : shoe.price;
    return [{
      ...item,
      shoe,
      price,
      size: shoe.sizeOptions?.find((option) => option.eu === item.sizeEu) ?? null,
    }];
  });
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const completeCheckout = (customer) => {
    const transaction = {
      id: `ORD-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      paymentMethod: customer.paymentMethod,
      status: 'LUNAS',
      items: cartItems.map(({ shoe: itemShoe, size, colorName, quantity, price }) => ({
        name: itemShoe.name,
        size: size ? `EU ${size.eu} · ${size.cm} cm` : 'Ukuran tidak ditentukan',
        colorName,
        quantity,
        price,
      })),
      total: subtotal,
    };
    setTransactions((current) => [transaction, ...current]);
    setCart([]);
    return transaction;
  };

  const shoe = route.page === 'detail' ? getShoeById(route.id) : null;
  const leftShoe = route.page === 'compare' ? getShoeById(route.leftId) : null;
  const rightShoe = route.page === 'compare' ? getShoeById(route.rightId) : null;
  let page;

  if (route.page === 'detail' && !shoe) {
    page = (
      <main className="store-not-found">
        <p className="store-eyebrow">MODEL TIDAK DITEMUKAN</p>
        <h1>Sepatu ini belum ada di katalog.</h1>
        <button className="store-button store-button-dark" onClick={() => navigate('/')}>
          Kembali ke katalog
        </button>
      </main>
    );
  } else if (route.page === 'ar') {
    page = (
      <Suspense fallback={<main className="store-not-found"><h1>Menyiapkan mode AR…</h1></main>}>
        <ARPage onBack={() => navigate('/')} />
      </Suspense>
    );
  } else if (route.page === 'compare') {
    page = !leftShoe || !rightShoe || leftShoe.id === rightShoe.id
      ? (
        <main className="store-not-found">
          <p className="store-eyebrow">PERBANDINGAN TIDAK TERSEDIA</p>
          <h1>Pilih dua model sepatu yang berbeda.</h1>
          <button className="store-button store-button-dark" onClick={() => navigate('/')}>
            Kembali ke koleksi
          </button>
        </main>
      )
      : (
        <Suspense fallback={<main className="store-not-found"><h1>Menyiapkan perbandingan…</h1></main>}>
          <ShoeComparePage
            leftShoe={leftShoe}
            rightShoe={rightShoe}
            onBack={() => navigate('/')}
            onSelectPair={(leftId, rightId) => navigate(`/compare?left=${encodeURIComponent(leftId)}&right=${encodeURIComponent(rightId)}`)}
          />
        </Suspense>
      );
  } else if (!shoe) {
    page = (
      <ShoeCatalogPage
        onOpenShoe={(id) => navigate(`/shoe/${id}`)}
        onStartAR={() => navigate('/ar')}
        onCompare={(leftId, rightId) => navigate(`/compare?left=${encodeURIComponent(leftId)}&right=${encodeURIComponent(rightId)}`)}
      />
    );
  } else {
    page = (
      <RouteErrorBoundary key={shoe.id} onBack={() => navigate('/')}>
        <Suspense
          fallback={
            <main className="store-not-found">
              <p className="store-eyebrow">MENYIAPKAN MODEL 3D</p>
              <h1>Memuat detail sepatu…</h1>
            </main>
          }
        >
          <ShoeDetailPage
            shoe={shoe}
            onBack={() => navigate('/')}
            onAddToCart={(size, color) => addToCart(shoe, size, color, 'cart')}
            onBuyNow={(size, color) => addToCart(shoe, size, color, 'checkout')}
            onCompare={(leftId, rightId) => navigate(`/compare?left=${encodeURIComponent(leftId)}&right=${encodeURIComponent(rightId)}`)}
          />
        </Suspense>
      </RouteErrorBoundary>
    );
  }

  return (
    <>
      {page}
      <ShoppingCart
        items={cartItems}
        transactions={transactions}
        itemCount={itemCount}
        subtotal={subtotal}
        isOpen={isCartOpen}
        initialView={cartInitialView}
        onOpen={() => { setCartInitialView('cart'); setIsCartOpen(true); }}
        onClose={() => setIsCartOpen(false)}
        onChangeQuantity={updateCartQuantity}
        onRemove={removeFromCart}
        onCompleteCheckout={completeCheckout}
      />
    </>
  );
}

export default App;
