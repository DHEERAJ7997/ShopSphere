const API_BASE = 'http://127.0.0.1:8000/api';

let allProducts = [];
let filtered = [];
let cart = [];
let maxPrice = 500;
let currentQuery = '';

const $searchInput = document.getElementById('searchInput');
const $searchBtn = document.getElementById('searchBtn');
const $productGrid = document.getElementById('productGrid');
const $resultsTitle = document.getElementById('resultsTitle');
const $resultsCount = document.getElementById('resultsCount');
const $statusPill = document.getElementById('statusPill');
const $cartCount = document.getElementById('cartCount');
const $cartItems = document.getElementById('cartItems');
const $cartTotal = document.getElementById('cartTotal');
const $cartDrawer = document.getElementById('cartDrawer');
const $overlay = document.getElementById('overlay');
const $priceRange = document.getElementById('priceRange');
const $priceLabel = document.getElementById('priceLabel');
const $sortSelect = document.getElementById('sortSelect');
const $checkoutBtn = document.getElementById('checkoutBtn');

function apiUrl(path) {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`;
}

function pickEmoji(product) {
  const name = (product.name || '').toLowerCase();
  if (name.includes('headphone')) return '🎧';
  if (name.includes('keyboard')) return '⌨️';
  if (name.includes('shoe')) return '👟';
  if (name.includes('coffee')) return '☕';
  if (name.includes('speaker')) return '🔊';
  if (product.category === 'Apparel') return '👕';
  if (product.category === 'Home') return '🏠';
  return '📦';
}

function enrichProduct(product) {
  const id = Number(product.id);
  return {
    ...product,
    id,
    price: Number(product.price),
    emoji: pickEmoji(product),
    vendor: 'ShopSphere',
    rating: 4 + (id % 2),
    badge: id % 3 === 0 ? 'hot' : id % 2 === 0 ? 'new' : null,
  };
}

function badgeHtml(badge) {
  if (!badge) return '';
  const classes = { sale: 'badge-sale', new: 'badge-new', hot: 'badge-hot' };
  const labels = { sale: 'SALE', new: 'NEW', hot: '🔥 HOT' };
  return `<span class="badge ${classes[badge]}">${labels[badge]}</span>`;
}

function stars(rating) {
  return '⭐'.repeat(Math.min(5, Math.max(1, rating)));
}

function setStatus(message, isError = false) {
  $statusPill.textContent = message;
  $statusPill.style.color = isError ? '#dc2626' : '';
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function showLoadingGrid() {
  $productGrid.innerHTML = `
    <div class="loading-state">
      <div class="emoji">⏳</div>
      <h3>Loading products...</h3>
      <p>Fetching catalog from the API gateway.</p>
    </div>`;
}

function showErrorGrid(message) {
  $productGrid.innerHTML = `
    <div class="error-state">
      <div class="emoji">⚠️</div>
      <h3>Could not load products</h3>
      <p>${escapeHtml(message)}</p>
      <p style="margin-top:8px">Make sure Docker is running: <code>docker compose up --build</code></p>
    </div>`;
}

async function apiFetch(path, options = {}) {
  const response = await fetch(apiUrl(path), {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function fetchProductsFromApi() {
  showLoadingGrid();
  setStatus('Loading...');
  try {
    const data = await apiFetch('/products');
    const items = Array.isArray(data) ? data : (data.results || []);
    if (data.status && data.status !== 'success') {
      throw new Error(data.message || 'API returned an error');
    }
    allProducts = items.map(enrichProduct);
    if (allProducts.length) {
      const topPrice = Math.ceil(Math.max(...allProducts.map((p) => p.price)));
      maxPrice = Math.max(topPrice, 100);
      $priceRange.max = maxPrice;
      $priceRange.value = maxPrice;
      $priceLabel.textContent = formatPrice(maxPrice) + '+';
    }
    applyFilters();
    setStatus('Live');
  } catch (error) {
    setStatus('API offline', true);
    showErrorGrid(error.message);
  }
}

async function fetchSearchFromApi(query) {
  showLoadingGrid();
  setStatus('Searching...');
  try {
    const data = await apiFetch(`/search?q=${encodeURIComponent(query)}`);
    const items = Array.isArray(data) ? data : (data.results || []);
    if (data.status && data.status !== 'success') {
      throw new Error(data.message || 'Search failed');
    }
    filtered = items.map(enrichProduct);
    $resultsTitle.textContent = `Results for "${query}"`;
    sortAndRender();
    setStatus('Live');
  } catch (error) {
    setStatus('Search failed', true);
    showErrorGrid(error.message);
  }
}

function applyFilters() {
  const category = document.querySelector('input[name="category"]:checked')?.value || '';
  const max = Number($priceRange.value);

  filtered = allProducts.filter((product) => {
    const inCategory = !category || product.category === category;
    const inPrice = product.price <= max;
    return inCategory && inPrice;
  });

  if (currentQuery) {
    const q = currentQuery.toLowerCase();
    filtered = filtered.filter((product) =>
      product.name.toLowerCase().includes(q) ||
      (product.description || '').toLowerCase().includes(q) ||
      (product.category || '').toLowerCase().includes(q)
    );
    $resultsTitle.textContent = `Results for "${currentQuery}"`;
  } else {
    $resultsTitle.textContent = category ? `${category} Products` : 'All Products';
  }

  sortAndRender();
}

function sortAndRender() {
  const sortValue = $sortSelect.value;
  const sorted = [...filtered];

  if (sortValue === 'price-low') sorted.sort((a, b) => a.price - b.price);
  else if (sortValue === 'price-high') sorted.sort((a, b) => b.price - a.price);
  else if (sortValue === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));

  renderProducts(sorted);
}

function renderProducts(list) {
  $resultsCount.textContent = `${list.length} product${list.length === 1 ? '' : 's'} found`;

  if (!list.length) {
    $productGrid.innerHTML = `
      <div class="no-results">
        <div class="emoji">🔍</div>
        <h3>No products found</h3>
        <p>Try a different search term or clear your filters.</p>
      </div>`;
    return;
  }

  $productGrid.innerHTML = list.map((product) => {
    const inCart = cart.find((item) => item.id === product.id);
    return `
      <article class="product-card">
        <div class="product-img">${product.emoji}</div>
        <div class="product-info">
          ${badgeHtml(product.badge)}
          <div class="product-category">${escapeHtml(product.category || 'General')}</div>
          <div class="product-name">${escapeHtml(product.name)}</div>
          <div class="product-desc">${escapeHtml(product.description || '')}</div>
          <div class="product-vendor">by ${escapeHtml(product.vendor)}</div>
          <div class="stars">${stars(product.rating)}</div>
          <div class="product-bottom">
            <div class="product-price">${formatPrice(product.price)}</div>
            <button
              class="add-btn ${inCart ? 'added' : ''}"
              type="button"
              data-add-id="${product.id}"
            >${inCart ? '✓ Added' : '+ Cart'}</button>
          </div>
        </div>
      </article>`;
  }).join('');

  $productGrid.querySelectorAll('[data-add-id]').forEach((button) => {
    button.addEventListener('click', () => addToCart(Number(button.dataset.addId)));
  });
}

async function syncCartFromApi() {
  try {
    const data = await apiFetch('/cart');
    const cartMap = data.cart || {};
    cart = Object.entries(cartMap)
      .map(([id, qty]) => {
        const product = allProducts.find((item) => item.id === Number(id));
        if (!product) return null;
        return { ...product, qty: Number(qty) };
      })
      .filter(Boolean);
    updateCartUI();
    sortAndRender();
  } catch {
    // Cart sync is best-effort when backend is unavailable.
  }
}

async function addToCart(productId) {
  const product = allProducts.find((item) => item.id === productId);
  if (!product) return;

  const existing = cart.find((item) => item.id === productId);
  const nextQty = existing ? existing.qty + 1 : 1;

  try {
    await apiFetch('/cart', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity: nextQty }),
    });
    if (existing) existing.qty = nextQty;
    else cart.push({ ...product, qty: 1 });
    updateCartUI();
    sortAndRender();
    showToast(`✅ ${product.name} added to cart`);
  } catch (error) {
    showToast(`❌ Could not add item: ${error.message}`);
  }
}

async function changeQty(productId, delta) {
  const item = cart.find((entry) => entry.id === productId);
  if (!item) return;

  const nextQty = item.qty + delta;
  if (nextQty <= 0) {
    await removeItem(productId);
    return;
  }

  try {
    await apiFetch('/cart', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity: nextQty }),
    });
    item.qty = nextQty;
    updateCartUI();
  } catch (error) {
    showToast(`❌ Could not update cart: ${error.message}`);
  }
}

async function removeItem(productId) {
  try {
    await apiFetch('/cart', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity: 0 }),
    });
    cart = cart.filter((item) => item.id !== productId);
    updateCartUI();
    sortAndRender();
  } catch (error) {
    showToast(`❌ Could not remove item: ${error.message}`);
  }
}

function updateCartUI() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  $cartCount.textContent = count;

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  $cartTotal.textContent = formatPrice(total);

  if (!cart.length) {
    $cartItems.innerHTML = `
      <div class="cart-empty">🛒<br><br>Your cart is empty.<br>Add some products!</div>`;
    return;
  }

  $cartItems.innerHTML = cart.map((item) => `
    <div class="cart-item">
      <div class="cart-item-emoji">${item.emoji}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${escapeHtml(item.name)}</div>
        <div class="cart-item-price">${formatPrice(item.price)}</div>
        <div class="qty-ctrl">
          <button class="qty-btn" type="button" data-qty-id="${item.id}" data-delta="-1">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" type="button" data-qty-id="${item.id}" data-delta="1">+</button>
        </div>
      </div>
      <button class="remove-btn" type="button" data-remove-id="${item.id}">🗑</button>
    </div>
  `).join('');

  $cartItems.querySelectorAll('[data-qty-id]').forEach((button) => {
    button.addEventListener('click', () => {
      changeQty(Number(button.dataset.qtyId), Number(button.dataset.delta));
    });
  });

  $cartItems.querySelectorAll('[data-remove-id]').forEach((button) => {
    button.addEventListener('click', () => removeItem(Number(button.dataset.removeId)));
  });
}

async function checkout() {
  if (!cart.length) {
    showToast('🛒 Your cart is empty');
    return;
  }

  $checkoutBtn.disabled = true;
  $checkoutBtn.textContent = 'Processing...';

  try {
    const data = await apiFetch('/checkout', { method: 'POST', body: '{}' });
    cart = [];
    updateCartUI();
    sortAndRender();
    closeCart();
    showToast(`🎉 Order placed! ID: ${data.order_id || 'confirmed'}`);
  } catch (error) {
    showToast(`❌ Checkout failed: ${error.message}`);
  } finally {
    $checkoutBtn.disabled = false;
    $checkoutBtn.textContent = 'Proceed to Checkout';
  }
}

function openCart() {
  $cartDrawer.classList.add('open');
  $overlay.classList.add('open');
  syncCartFromApi();
}

function closeCart() {
  $cartDrawer.classList.remove('open');
  $overlay.classList.remove('open');
}

function handleSearch() {
  const query = $searchInput.value.trim();
  currentQuery = query;

  if (query) {
    fetchSearchFromApi(query);
  } else {
    applyFilters();
  }
}

function filterByTag(tag) {
  $searchInput.value = tag;
  currentQuery = tag;
  if (tag) fetchSearchFromApi(tag);
  else fetchProductsFromApi();
}

document.getElementById('openCartBtn').addEventListener('click', openCart);
document.getElementById('closeCartBtn').addEventListener('click', closeCart);
$overlay.addEventListener('click', closeCart);
$searchBtn.addEventListener('click', handleSearch);
$checkoutBtn.addEventListener('click', checkout);
$sortSelect.addEventListener('change', sortAndRender);

$searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') handleSearch();
});

$priceRange.addEventListener('input', (event) => {
  $priceLabel.textContent = formatPrice(event.target.value) + '+';
  applyFilters();
});

document.querySelectorAll('input[name="category"]').forEach((input) => {
  input.addEventListener('change', () => {
    currentQuery = '';
    $searchInput.value = '';
    applyFilters();
  });
});

document.querySelectorAll('.hero-tag').forEach((tag) => {
  tag.addEventListener('click', () => filterByTag(tag.dataset.tag || ''));
});

document.addEventListener('DOMContentLoaded', async () => {
  await fetchProductsFromApi();
  await syncCartFromApi();
});
