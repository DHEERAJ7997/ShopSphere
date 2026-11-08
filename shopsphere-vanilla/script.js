// Use the API gateway's public routes
const API_BASE = 'http://127.0.0.1:8000/api'; // update if your API gateway runs elsewhere

const $status = document.getElementById('status');
const $list = document.getElementById('product-list');
const $search = document.getElementById('search');
const $refresh = document.getElementById('refresh');

function apiUrl(path) {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

async function fetchProducts(q=''){
  $status.textContent = 'loading...';
  try{
    // Call the gateway which exposes /api/products and /api/search
    const url = new URL(apiUrl('/products'));
    if(q) url.searchParams.set('q', q);
    const res = await fetch(url.href, { credentials: 'include' });
    if(!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.results || []);
    if(data.status && data.status !== 'success') throw new Error(data.message || 'API returned error');
    render(items);
    $status.textContent = `loaded ${items.length || 0}`;
  }catch(err){
    $status.textContent = 'API error — check backend and CORS';
    $list.innerHTML = `<li class="card">${err.message}</li>`;
  }
}

function render(items=[]){
  if(!Array.isArray(items)) items = [];
  $list.innerHTML = items.map(it=>`
    <li class="card">
      <h3>${escapeHtml(it.name||'Untitled')}</h3>
      <div class="price">${it.price!=null?('$'+it.price):'—'}</div>
      <div class="muted">${escapeHtml(it.description||'')}</div>
    </li>
  `).join('');
}

function escapeHtml(s){
  return (s+'').replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

const doSearch = ()=>{
  const q = $search.value.trim();
  if(q) fetchSearch(q); else fetchProducts();
}

$refresh.addEventListener('click', doSearch);
$search.addEventListener('keyup', e=>{ if(e.key==='Enter') doSearch(); });

async function fetchSearch(q){
  $status.textContent = 'searching...';
  try{
    const url = new URL(apiUrl('/search'));
    url.searchParams.set('q', q);
    const res = await fetch(url.href, { credentials: 'include' });
    if(!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.results || []);
    if(data.status && data.status !== 'success') throw new Error(data.message || 'API returned error');
    render(items);
    $status.textContent = `found ${items.length || 0}`;
  }catch(err){
    $status.textContent = 'API error — check backend and CORS';
    $list.innerHTML = `<li class="card">${err.message}</li>`;
  }
}

document.addEventListener('DOMContentLoaded',()=>{ fetchProducts(); });
