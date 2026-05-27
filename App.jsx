import { useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

const API = 'http://localhost:4000/api';
const socket = io('http://localhost:4000', { autoConnect: true });

function useFetch(url, initial = []) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(url)
      .then((res) => res.json())
      .then((json) => active && setData(json))
      .catch(() => active && setData(initial))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [url]);

  return { data, loading, setData };
}

function Navbar({ cartCount }) {
  return (
    <header className="navbar">
      <div className="brand-block">
        <Link to="/" className="brand">ShopKaro</Link>
        <span className="brand-tag">India's Smart Marketplace</span>
      </div>
      <nav>
        <Link to="/shop">Shop</Link>
        <Link to="/admin">Admin</Link>
        <Link to="/seller">Seller</Link>
        <Link to="/cart">Cart ({cartCount})</Link>
      </nav>
    </header>
  );
}

function Hero({ banners = [] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!banners.length) return;
    const id = setInterval(() => setIndex((prev) => (prev + 1) % banners.length), 3000);
    return () => clearInterval(id);
  }, [banners.length]);
  const banner = banners[index];
  if (!banner) return null;
  return (
    <section className="hero">
      <div>
        <span className="eyebrow">Trending Campaign</span>
        <h1>{banner.title}</h1>
        <p>{banner.subtitle}</p>
        <Link to="/shop" className="primary-btn">{banner.cta}</Link>
      </div>
      <div className="hero-card">
        <p>Multi-vendor marketplace</p>
        <h3>Live orders + ads + seller panel</h3>
        <div className="hero-stats">
          <div><strong>24/7</strong><span>Support</span></div>
          <div><strong>COD</strong><span>Enabled</span></div>
          <div><strong>Real-time</strong><span>Tracking</span></div>
        </div>
      </div>
    </section>
  );
}

function Categories({ categories = [] }) {
  return (
    <section className="section">
      <div className="section-head">
        <h2>Top Categories</h2>
        <Link to="/shop">View all</Link>
      </div>
      <div className="category-grid">
        {categories.map((cat) => (
          <Link to={`/shop?category=${encodeURIComponent(cat.name)}`} className="category-card" key={cat.id}>
            <div className="icon-bubble">{cat.name.slice(0, 1)}</div>
            <span>{cat.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ProductCard({ product, onAdd }) {
  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  return (
    <article className="product-card">
      <div className="product-image">{product.title.split(' ')[0]}</div>
      <div className="product-meta">
        <span className="badge">{product.category}</span>
        <h3>{product.title}</h3>
        <p className="muted">by {product.seller}</p>
        <div className="price-row">
          <strong>₹{product.price}</strong>
          <span className="strike">₹{product.originalPrice}</span>
          <span className="discount">{discount}% OFF</span>
        </div>
        <div className="rating-row">
          <span>⭐ {product.rating}</span>
          <span>{product.stock} left</span>
        </div>
        <div className="card-actions">
          <Link to={`/product/${product.id}`} className="secondary-btn">Details</Link>
          <button className="primary-btn" onClick={() => onAdd(product)}>Add to Cart</button>
        </div>
      </div>
    </article>
  );
}

function HomePage({ cart, setCart }) {
  const { data: categories } = useFetch(`${API}/categories`);
  const { data: banners } = useFetch(`${API}/banners`);
  const { data: products } = useFetch(`${API}/products`);

  const addToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.productId === product.id);
      if (exists) {
        return prev.map((item) => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { productId: product.id, title: product.title, price: product.price, quantity: 1 }];
    });
  };

  return (
    <main className="page">
      <Hero banners={banners} />
      <Categories categories={categories} />
      <section className="section">
        <div className="section-head">
          <h2>Best Sellers</h2>
          <Link to="/shop">Browse catalog</Link>
        </div>
        <div className="product-grid">
          {products.slice(0, 6).map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} />)}
        </div>
      </section>
      <section className="section promo-band">
        <div>
          <h3>Admin-ready banners</h3>
          <p>Manage ads, homepage campaigns, seller highlights, and promo strips from your control panel.</p>
        </div>
        <div>
          <h3>Live order visibility</h3>
          <p>Every new order appears instantly in admin and tracking views using realtime socket updates.</p>
        </div>
      </section>
    </main>
  );
}

function ShopPage({ setCart }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const { data: products } = useFetch(`${API}/products?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`);
  const { data: categories } = useFetch(`${API}/categories`);

  const addToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.productId === product.id);
      if (exists) return prev.map((item) => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { productId: product.id, title: product.title, price: product.price, quantity: 1 }];
    });
  };

  return (
    <main className="page shop-layout">
      <aside className="panel sidebar">
        <h3>Filters</h3>
        <label>Search</label>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product or brand" />
        <label>Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>All</option>
          {categories.map((cat) => <option key={cat.id}>{cat.name}</option>)}
        </select>
        <div className="filter-block">
          <span>Payment</span>
          <small>UPI, Cards, COD supported</small>
        </div>
        <div className="filter-block">
          <span>Delivery</span>
          <small>India-wide service mode</small>
        </div>
      </aside>
      <section className="panel grow">
        <div className="section-head">
          <h2>Product Catalog</h2>
          <span>{products.length} results</span>
        </div>
        <div className="product-grid compact-grid">
          {products.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} />)}
        </div>
      </section>
    </main>
  );
}

function ProductPage({ setCart }) {
  const { id } = useParams();
  const { data: product, loading } = useFetch(`${API}/products/${id}`, null);
  if (loading) return <main className="page"><div className="panel">Loading product...</div></main>;
  if (!product) return <main className="page"><div className="panel">Product not found.</div></main>;

  return (
    <main className="page product-layout">
      <section className="panel product-gallery">
        <div className="product-image large">{product.title.split(' ')[0]}</div>
        <div className="thumb-row">
          {[1,2,3,4].map((n) => <div key={n} className="thumb">View {n}</div>)}
        </div>
      </section>
      <section className="panel product-detail">
        <span className="badge">{product.category}</span>
        <h1>{product.title}</h1>
        <p className="muted">Brand: {product.brand} • Seller: {product.seller}</p>
        <div className="rating-row larger">
          <span>⭐ {product.rating}</span>
          <span>Stock: {product.stock}</span>
        </div>
        <div className="price-stack">
          <strong>₹{product.price}</strong>
          <span className="strike">₹{product.originalPrice}</span>
        </div>
        <p>{product.description}</p>
        <ul className="feature-list">
          {product.features.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <div className="info-box">
          <p><strong>Delivery:</strong> 3-5 business days across India</p>
          <p><strong>Payments:</strong> Cards, UPI, NetBanking, Wallet, COD</p>
          <p><strong>Returns:</strong> Easy 7-day return policy</p>
        </div>
        <div className="card-actions">
          <button className="primary-btn" onClick={() => setCart((prev) => [...prev, { productId: product.id, title: product.title, price: product.price, quantity: 1 }])}>Add to Cart</button>
          <Link to="/cart" className="secondary-btn">Go to Checkout</Link>
        </div>
      </section>
    </main>
  );
}

function CartPage({ cart, setCart }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ customerName: '', customerEmail: '', address: '', paymentMethod: 'Cash on Delivery' });
  const [placing, setPlacing] = useState(false);
  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

  const updateQty = (productId, diff) => {
    setCart((prev) => prev
      .map((item) => item.productId === productId ? { ...item, quantity: Math.max(1, item.quantity + diff) } : item)
    );
  };

  const placeOrder = async () => {
    if (!cart.length || !form.customerName || !form.address) return alert('Please complete checkout details');
    setPlacing(true);
    const res = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, items: cart })
    });
    const data = await res.json();
    setPlacing(false);
    if (res.ok) {
      setCart([]);
      navigate(`/track/${data.id}`);
    } else {
      alert(data.message || 'Unable to place order');
    }
  };

  return (
    <main className="page shop-layout">
      <section className="panel grow">
        <div className="section-head">
          <h2>Checkout</h2>
          <span>{cart.length} items</span>
        </div>
        {cart.length === 0 ? <p>Your cart is empty.</p> : cart.map((item) => (
          <div className="cart-row" key={item.productId}>
            <div>
              <h4>{item.title}</h4>
              <p className="muted">₹{item.price} each</p>
            </div>
            <div className="qty-box">
              <button onClick={() => updateQty(item.productId, -1)}>-</button>
              <span>{item.quantity}</span>
              <button onClick={() => updateQty(item.productId, 1)}>+</button>
            </div>
            <strong>₹{item.price * item.quantity}</strong>
          </div>
        ))}
      </section>
      <aside className="panel sidebar sticky">
        <h3>Delivery & Payment</h3>
        <input placeholder="Full name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
        <input placeholder="Email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} />
        <textarea placeholder="Delivery address" rows="4" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
          <option>Cash on Delivery</option>
          <option>UPI</option>
          <option>Credit / Debit Card</option>
          <option>Net Banking</option>
        </select>
        <div className="summary-box">
          <div><span>Subtotal</span><strong>₹{total}</strong></div>
          <div><span>Delivery</span><strong>FREE</strong></div>
          <div><span>Coupon</span><strong>-₹0</strong></div>
          <div className="grand"><span>Total</span><strong>₹{total}</strong></div>
        </div>
        <button className="primary-btn full" onClick={placeOrder} disabled={placing}>{placing ? 'Placing...' : 'Place Order'}</button>
      </aside>
    </main>
  );
}

function TrackingPage() {
  const { id } = useParams();
  const { data: order, loading, setData: setOrder } = useFetch(`${API}/orders/${id}`, null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    fetch(`${API}/chat/${id}`).then((res) => res.json()).then(setMessages).catch(() => setMessages([]));
  }, [id]);

  useEffect(() => {
    const handler = (payload) => {
      if (payload.id === id) setOrder(payload);
    };
    const chatHandler = (message) => setMessages((prev) => [...prev, message]);
    socket.on('order:update', handler);
    socket.on(`chat:${id}`, chatHandler);
    return () => {
      socket.off('order:update', handler);
      socket.off(`chat:${id}`, chatHandler);
    };
  }, [id, setOrder]);

  const sendMessage = async () => {
    if (!draft.trim()) return;
    await fetch(`${API}/chat/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: 'Customer', text: draft })
    });
    setDraft('');
  };

  if (loading) return <main className="page"><div className="panel">Loading tracking info...</div></main>;
  if (!order) return <main className="page"><div className="panel">Order not found.</div></main>;

  return (
    <main className="page tracking-layout">
      <section className="panel grow">
        <div className="section-head">
          <h2>Track Order #{order.id}</h2>
          <span className="badge active-badge">{order.status}</span>
        </div>
        <div className="progress-shell">
          <div className="progress-bar"><div style={{ width: `${order.progress}%` }} /></div>
          <div className="step-row">
            {order.steps.map((step) => (
              <div key={step.name} className={`step ${step.completed ? 'done' : ''} ${step.active ? 'active' : ''}`}>
                <span>{step.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="timeline">
          {order.timeline.map((item, index) => (
            <div className="timeline-item" key={`${item.status}-${index}`}>
              <strong>{item.status}</strong>
              <span>{new Date(item.at).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="info-box">
          <p><strong>Ship to:</strong> {order.address}</p>
          <p><strong>Payment:</strong> {order.paymentMethod}</p>
          <p><strong>Amount:</strong> ₹{order.amount}</p>
        </div>
      </section>
      <aside className="panel sidebar">
        <h3>Live Chat Support</h3>
        <div className="chat-box">
          {messages.map((msg) => (
            <div className={`chat-msg ${msg.sender === 'Customer' ? 'customer' : ''}`} key={msg.id}>
              <strong>{msg.sender}</strong>
              <p>{msg.text}</p>
            </div>
          ))}
        </div>
        <div className="chat-compose">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message" />
          <button className="primary-btn" onClick={sendMessage}>Send</button>
        </div>
      </aside>
    </main>
  );
}

function AdminPage() {
  const { data: stats, setData: setStats } = useFetch(`${API}/admin/stats`, {});
  const { data: orders, setData: setOrders } = useFetch(`${API}/admin/orders`, []);
  const { data: banners, setData: setBanners } = useFetch(`${API}/admin/banners`, []);
  const [bannerForm, setBannerForm] = useState({ title: '', subtitle: '', cta: '' });

  useEffect(() => {
    const onNew = () => {
      fetch(`${API}/admin/stats`).then((r) => r.json()).then(setStats);
      fetch(`${API}/admin/orders`).then((r) => r.json()).then(setOrders);
    };
    const onUpdate = (payload) => {
      setOrders((prev) => prev.map((order) => order.id === payload.id ? payload : order));
      fetch(`${API}/admin/stats`).then((r) => r.json()).then(setStats);
    };
    socket.on('order:new', onNew);
    socket.on('order:update', onUpdate);
    return () => {
      socket.off('order:new', onNew);
      socket.off('order:update', onUpdate);
    };
  }, [setOrders, setStats]);

  const updateStatus = async (orderId, status) => {
    const res = await fetch(`${API}/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (res.ok) setOrders((prev) => prev.map((order) => order.id === orderId ? data : order));
  };

  const addBanner = async () => {
    const res = await fetch(`${API}/admin/banners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bannerForm)
    });
    const data = await res.json();
    if (res.ok) {
      setBanners((prev) => [data, ...prev]);
      setBannerForm({ title: '', subtitle: '', cta: '' });
    }
  };

  return (
    <main className="page admin-page">
      <section className="stats-grid">
        <div className="stat-card"><span>Revenue</span><strong>₹{stats.revenue || 0}</strong></div>
        <div className="stat-card"><span>Total Orders</span><strong>{stats.totalOrders || 0}</strong></div>
        <div className="stat-card"><span>Products</span><strong>{stats.totalProducts || 0}</strong></div>
        <div className="stat-card"><span>Live Sellers</span><strong>{stats.totalSellers || 0}</strong></div>
      </section>
      <section className="admin-grid">
        <div className="panel">
          <div className="section-head">
            <h2>Order Command Center</h2>
            <span>Real-time admin feed</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.customerName}</td>
                    <td>₹{order.amount}</td>
                    <td><span className="badge active-badge">{order.status}</span></td>
                    <td>
                      <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)}>
                        {['Placed', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'].map((status) => <option key={status}>{status}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="panel">
          <div className="section-head">
            <h2>Ad Banner Manager</h2>
            <span>Add homepage campaigns</span>
          </div>
          <div className="form-stack">
            <input placeholder="Banner title" value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} />
            <input placeholder="Banner subtitle" value={bannerForm.subtitle} onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })} />
            <input placeholder="CTA text" value={bannerForm.cta} onChange={(e) => setBannerForm({ ...bannerForm, cta: e.target.value })} />
            <button className="primary-btn" onClick={addBanner}>Add Banner</button>
          </div>
          <div className="banner-list">
            {banners.map((banner) => (
              <div className="banner-card" key={banner.id}>
                <strong>{banner.title}</strong>
                <p>{banner.subtitle}</p>
                <span>{banner.cta}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function SellerPage() {
  const { data: overview } = useFetch(`${API}/seller/overview`, {});
  return (
    <main className="page admin-page">
      <section className="stats-grid">
        <div className="stat-card"><span>Seller</span><strong>{overview.seller || '...'}</strong></div>
        <div className="stat-card"><span>Earnings</span><strong>₹{overview.earnings || 0}</strong></div>
        <div className="stat-card"><span>Total Orders</span><strong>{overview.totalOrders || 0}</strong></div>
        <div className="stat-card"><span>Live Products</span><strong>{overview.liveProducts || 0}</strong></div>
      </section>
      <section className="panel">
        <div className="section-head">
          <h2>Seller Inventory</h2>
          <span>Manage product visibility and stock</span>
        </div>
        <div className="product-grid compact-grid">
          {(overview.products || []).map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-image">{product.title.split(' ')[0]}</div>
              <div className="product-meta">
                <span className="badge">{product.category}</span>
                <h3>{product.title}</h3>
                <p className="muted">Stock: {product.stock}</p>
                <div className="price-row">
                  <strong>₹{product.price}</strong>
                  <span className="strike">₹{product.originalPrice}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('shopkaro-cart')) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('shopkaro-cart', JSON.stringify(cart));
  }, [cart]);

  return (
    <div>
      <Navbar cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} />
      <Routes>
        <Route path="/" element={<HomePage cart={cart} setCart={setCart} />} />
        <Route path="/shop" element={<ShopPage setCart={setCart} />} />
        <Route path="/product/:id" element={<ProductPage setCart={setCart} />} />
        <Route path="/cart" element={<CartPage cart={cart} setCart={setCart} />} />
        <Route path="/track/:id" element={<TrackingPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/seller" element={<SellerPage />} />
      </Routes>
    </div>
  );
}
