/* ═══════════════════════════════════════════════════════════════════════
   SCRIPT.JS — The Wedding Blouse By Kaaru Invoice Generator
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

// ─── CONSTANTS ────────────────────────────────────────────────────────
const LS_KEY_NUM   = 'kaaru_inv_number';
const LS_KEY_DATA  = 'kaaru_inv_data';
const A4_W_PX      = 794;
const A4_H_PX      = 1123;

// ─── STATE ────────────────────────────────────────────────────────────
let items = [];

// ─── UTILS ────────────────────────────────────────────────────────────
const fmt = (n) => '₹' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const parseNum = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};

const fmtDate = (isoStr) => {
  if (!isoStr) return '—';
  const [y, m, d] = isoStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
};

const genId = () => '_' + Math.random().toString(36).substr(2, 9);

// ─── INVOICE NUMBER ───────────────────────────────────────────────────
function getNextInvoiceNumber() {
  const stored = parseInt(localStorage.getItem(LS_KEY_NUM) || '0', 10);
  const next   = stored + 1;
  localStorage.setItem(LS_KEY_NUM, next);
  return `KBL-${String(next).padStart(4, '0')}`;
}

function initInvoiceNumber() {
  const el = document.getElementById('inv-number');
  if (!el.value) {
    el.value = getNextInvoiceNumber();
  }
}

// ─── DATE HELPERS ─────────────────────────────────────────────────────
function setDefaultDates() {
  const today = new Date();
  const toISO = (d) => d.toISOString().split('T')[0];

  const dateEl = document.getElementById('inv-date');

  if (!dateEl.value) dateEl.value = toISO(today);
}

// ─── LINE ITEMS ───────────────────────────────────────────────────────
function createItem(desc = '', qty = 1, rate = 0) {
  return { id: genId(), desc, qty, rate };
}

function addItem(desc = '', qty = 1, rate = 0) {
  const item = createItem(desc, qty, rate);
  items.push(item);
  renderItemRow(item);
  updateTotals();
}

function removeItem(id) {
  items = items.filter(i => i.id !== id);
  const row = document.querySelector(`tr[data-id="${id}"]`);
  if (row) row.classList.add('removing');
  setTimeout(() => {
    if (row) row.remove();
    reindexRows();
    updateTotals();
    renderPreviewItems();
  }, 200);
}

function renderItemRow(item) {
  const tbody = document.getElementById('items-body');
  const tr    = document.createElement('tr');
  tr.dataset.id = item.id;

  const amount = parseNum(item.qty) * parseNum(item.rate);

  tr.innerHTML = `
    <td class="col-desc">
      <input type="text" class="item-desc" value="${escHtml(item.desc)}" placeholder="Service / Item description" />
    </td>
    <td class="col-qty">
      <input type="number" class="item-qty" value="${item.qty}" min="0" step="0.5" />
    </td>
    <td class="col-rate">
      <input type="number" class="item-rate" value="${item.rate}" min="0" step="0.01" placeholder="0.00" />
    </td>
    <td class="col-amount">
      <span class="amount-display">${fmt(amount)}</span>
    </td>
    <td class="col-del">
      <button class="btn-del-row" title="Remove row">✕</button>
    </td>
  `;

  // Events
  const descInput = tr.querySelector('.item-desc');
  const qtyInput  = tr.querySelector('.item-qty');
  const rateInput = tr.querySelector('.item-rate');
  const amtSpan   = tr.querySelector('.amount-display');
  const delBtn    = tr.querySelector('.btn-del-row');

  const recalcRow = () => {
    const it = items.find(i => i.id === item.id);
    if (!it) return;
    it.desc = descInput.value;
    it.qty  = parseNum(qtyInput.value);
    it.rate = parseNum(rateInput.value);
    const amt = it.qty * it.rate;
    amtSpan.textContent = fmt(amt);
    updateTotals();
    renderPreviewItems();
    saveData();
  };

  descInput.addEventListener('input', recalcRow);
  qtyInput.addEventListener('input',  recalcRow);
  rateInput.addEventListener('input', recalcRow);
  delBtn.addEventListener('click',    () => removeItem(item.id));

  tbody.appendChild(tr);
}

function reindexRows() {
  // Preview SI# is redrawn in renderPreviewItems; nothing to do in editor
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── TOTALS ───────────────────────────────────────────────────────────
function calcTotals() {
  const subtotal  = items.reduce((s, i) => s + parseNum(i.qty) * parseNum(i.rate), 0);
  const discount  = parseNum(document.getElementById('inv-discount').value);
  const advance   = parseNum(document.getElementById('inv-advance').value);

  const afterDisc = Math.max(0, subtotal - discount);
  const grand     = afterDisc;
  const balance   = Math.max(0, grand - advance);

  return { subtotal, discount, grand, advance, balance };
}

function updateTotals() {
  const t = calcTotals();

  // Editor display
  document.getElementById('display-subtotal').textContent = fmt(t.subtotal);
  document.getElementById('display-discount').textContent = fmt(t.discount);
  document.getElementById('display-grand').textContent    = fmt(t.grand);
  document.getElementById('display-advance').textContent  = fmt(t.advance);
  document.getElementById('display-balance').textContent  = fmt(t.balance);

  // Show/hide discount row
  const showDisc = t.discount > 0;
  document.getElementById('row-discount').style.display  = showDisc ? '' : 'none';

  // Show/hide advance row
  const showAdv = t.advance > 0;
  document.getElementById('row-advance').style.display = showAdv ? '' : 'none';

  // Preview totals
  document.getElementById('pv-subtotal').textContent = fmt(t.subtotal);
  document.getElementById('pv-discount').textContent = fmt(t.discount);
  document.getElementById('pv-grand').textContent    = fmt(t.grand);
  document.getElementById('pv-advance').textContent  = fmt(t.advance);
  document.getElementById('pv-balance').textContent  = fmt(t.balance);

  document.getElementById('pv-row-discount').style.display = showDisc ? '' : 'none';
  document.getElementById('pv-row-advance').style.display  = showAdv  ? '' : 'none';
  document.getElementById('pv-row-balance').style.display  = '';
}

// ─── PREVIEW SYNC ─────────────────────────────────────────────────────
function syncMeta() {
  const get = (id) => document.getElementById(id).value.trim();

  document.getElementById('pv-inv-number').textContent  = get('inv-number') || '—';
  document.getElementById('pv-inv-date').textContent    = fmtDate(get('inv-date'));
  document.getElementById('pv-cust-name').textContent   = get('cust-name')    || '—';
  document.getElementById('pv-cust-phone').textContent  = get('cust-phone')   || '—';

  const terms = get('inv-terms');
  const pvTerms = document.getElementById('pv-terms');
  const termsWrap = document.getElementById('pv-terms-wrap');

  pvTerms.textContent = terms;
  termsWrap.style.display = terms ? '' : 'none';
}

function renderPreviewItems() {
  const tbody = document.getElementById('pv-items-body');
  tbody.innerHTML = '';

  items.forEach((item, idx) => {
    const amt = parseNum(item.qty) * parseNum(item.rate);
    const tr  = document.createElement('tr');
    tr.innerHTML = `
      <td class="col-si">${idx + 1}</td>
      <td class="col-item-desc">${escHtml(item.desc) || '<em style="color:#bbb;font-size:0.7em">—</em>'}</td>
      <td class="col-item-qty">${item.qty}</td>
      <td class="col-item-rate">${fmt(item.rate)}</td>
      <td class="col-item-amount">${fmt(amt)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ─── SCALE PREVIEW ────────────────────────────────────────────────────
function scalePreview() {
  const panel   = document.getElementById('preview-panel');
  const scaler  = document.getElementById('preview-scaler');
  const invoice = document.getElementById('invoice-preview');

  if (!panel || !scaler || !invoice) return;

  const panelW  = panel.clientWidth - 48; // subtract padding
  const scale   = Math.min(1, panelW / A4_W_PX);

  scaler.style.transformOrigin = 'top center';
  scaler.style.transform       = `scale(${scale})`;
  // Compensate for the scaled-down height so the panel doesn't have extra space
  const scaledH  = invoice.offsetHeight * scale;
  scaler.style.height = `${invoice.offsetHeight}px`;
  scaler.style.marginBottom = `${scaledH - invoice.offsetHeight}px`;
}

// ─── BIND INPUTS → PREVIEW ────────────────────────────────────────────
function bindInputs() {
  const ids = ['inv-number','inv-date',
               'cust-name','cust-phone','inv-terms'];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => { syncMeta(); saveData(); });
      el.addEventListener('change', () => { syncMeta(); saveData(); });
    }
  });

  ['inv-discount','inv-advance'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => { updateTotals(); saveData(); });
  });
}

// ─── PERSIST DATA ─────────────────────────────────────────────────────
function saveData() {
  const getVal = (id) => {
    const el = document.getElementById(id);
    return el ? el.value : '';
  };

  const data = {
    invNumber: getVal('inv-number'),
    invDate:   getVal('inv-date'),
    custName:  getVal('cust-name'),
    custPhone: getVal('cust-phone'),
    discount:  getVal('inv-discount'),
    advance:   getVal('inv-advance'),
    terms:     getVal('inv-terms'),
    items:     items,
  };

  try {
    localStorage.setItem(LS_KEY_DATA, JSON.stringify(data));
  } catch(e) { /* storage full — silently fail */ }
}

function loadData() {
  try {
    const raw = localStorage.getItem(LS_KEY_DATA);
    if (!raw) return false;
    const data = JSON.parse(raw);

    const setVal = (id, v) => {
      const el = document.getElementById(id);
      if (el && v !== undefined) el.value = v;
    };

    setVal('inv-number', data.invNumber);
    setVal('inv-date',   data.invDate);
    setVal('cust-name',  data.custName);
    setVal('cust-phone', data.custPhone);
    setVal('inv-discount', data.discount);
    setVal('inv-advance',data.advance);
    setVal('inv-terms',  data.terms);

    if (data.items && Array.isArray(data.items)) {
      data.items.forEach(it => addItem(it.desc, it.qty, it.rate));
    }

    return true;
  } catch(e) { return false; }
}

// ─── NEW INVOICE ──────────────────────────────────────────────────────
function newInvoice() {
  if (!confirm('Start a new invoice? Current data will be cleared.')) return;

  localStorage.removeItem(LS_KEY_DATA);

  // Clear inputs
  ['inv-number','inv-date','cust-name','cust-phone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const termsEl = document.getElementById('inv-terms');
  if (termsEl) termsEl.selectedIndex = 0;

  ['inv-discount','inv-advance'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '0';
  });

  // Clear items
  items = [];
  document.getElementById('items-body').innerHTML = '';
  document.getElementById('pv-items-body').innerHTML = '';

  // Re-init
  initInvoiceNumber();
  setDefaultDates();
  addDefaultItems();
  syncMeta();
  updateTotals();
}

// ─── PDF EXPORT ───────────────────────────────────────────────────────
function showPdfOverlay(show) {
  const overlay = document.getElementById('pdf-overlay');
  overlay.classList.toggle('hidden', !show);
}

async function exportPdf() {
  showPdfOverlay(true);

  try {
    // 1. Create wrapper positioned at absolute top-left of document, hidden from user view
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: ${A4_W_PX}px;
      height: ${A4_H_PX}px;
      overflow: hidden;
      z-index: -9999;
      pointer-events: none;
      margin: 0;
      padding: 0;
      background: #ffffff;
      box-sizing: border-box;
    `;

    // 2. Clone the invoice node
    const original = document.getElementById('invoice-preview');
    const clone    = original.cloneNode(true);
    clone.id       = 'invoice-clone';

    // 3. Style the clone to match A4 precisely and reset positions
    clone.style.cssText = `
      width: ${A4_W_PX}px;
      height: ${A4_H_PX}px;
      margin: 0;
      padding: 36px;
      background: #ffffff;
      box-sizing: border-box;
      box-shadow: none;
      border-radius: 0;
      position: relative;
      top: 0;
      left: 0;
      transform: none !important;
    `;

    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    // 4. Wait for images in clone to load
    const imgs = Array.from(clone.querySelectorAll('img'));
    await Promise.all(imgs.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(res => { img.onload = res; img.onerror = res; });
    }));

    // Give browser a frame to render
    await new Promise(r => setTimeout(r, 300));

    // 5. Get invoice number for filename
    const invNum = document.getElementById('inv-number').value || 'Invoice';

    // 6. html2pdf options
    const opt = {
      margin:      0,
      filename:    `${invNum}_Kaaru.pdf`,
      image:       { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale:           2,
        useCORS:         true,
        allowTaint:      true,
        logging:         false,
        scrollX:         0,
        scrollY:         0,
        x:               0,
        y:               0,
        width:           A4_W_PX,
        windowWidth:     A4_W_PX,
        backgroundColor: '#ffffff',
      },
      jsPDF: {
        unit:        'px',
        format:      [A4_W_PX, A4_H_PX],
        orientation: 'portrait',
        hotfixes:    ['px_scaling'],
      },
      pagebreak: { mode: ['css', 'legacy'] }, // Avoid using 'avoid-all' at the root level which pushes clone to page 2
    };

    await html2pdf().set(opt).from(clone).save();

  } catch (err) {
    console.error('PDF export error:', err);
    alert('PDF export failed. Please try printing instead.');
  } finally {
    // 7. Cleanup the wrapper containing the clone
    const c = document.getElementById('invoice-clone');
    if (c && c.parentNode) {
      c.parentNode.remove();
    }
    showPdfOverlay(false);
  }
}

// ─── PRINT ────────────────────────────────────────────────────────────
function printInvoice() {
  window.print();
}

// ─── WHATSAPP SHARE ───────────────────────────────────────────────────
function shareWhatsApp() {
  const ph = document.getElementById('cust-phone').value || '';
  const phone = ph.replace(/\D/g, '');

  if (!phone) {
    alert('Please enter a Customer Phone / WhatsApp number first.');
    return;
  }

  const url = `https://wa.me/${phone}`;
  window.open(url, '_blank');
}

// ─── DEFAULT ITEMS ────────────────────────────────────────────────────
function addDefaultItems() {
  addItem('Bridal Blouse — Custom Stitching', 1, 0);
  addItem('Fitting Charges', 1, 0);
}

// ─── INIT ─────────────────────────────────────────────────────────────
function init() {
  // Try to restore saved data
  const restored = loadData();

  if (!restored) {
    initInvoiceNumber();
    setDefaultDates();
    addDefaultItems();
  }

  // Sync preview with loaded/default values
  syncMeta();
  renderPreviewItems();
  updateTotals();

  // Bind editor inputs
  bindInputs();

  // Add item button
  document.getElementById('btn-add-item').addEventListener('click', () => {
    addItem();
    renderPreviewItems();
    saveData();
    // Scroll editor to bottom of items
    const tbody = document.getElementById('items-body');
    tbody.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  // Header buttons
  document.getElementById('btn-new-invoice').addEventListener('click', newInvoice);
  document.getElementById('btn-print').addEventListener('click',       printInvoice);
  document.getElementById('btn-pdf').addEventListener('click',         exportPdf);
  document.getElementById('btn-whatsapp').addEventListener('click',    shareWhatsApp);

  // Scale preview on load and resize
  scalePreview();
  window.addEventListener('resize', scalePreview);

  // Observer for invoice height changes
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(scalePreview);
    ro.observe(document.getElementById('invoice-preview'));
    ro.observe(document.getElementById('preview-panel'));
  }
}

document.addEventListener('DOMContentLoaded', init);
