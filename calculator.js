/* ═══════════════════════════════════════════════════════════════════════
   CALCULATOR.JS — Interactive logic for Blouse Price Calculator
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const modeFixedRadio = document.getElementById('mode-fixed');
  const modeCustomRadio = document.getElementById('mode-custom');
  const modeFixedCard = document.getElementById('mode-fixed-card');
  const modeCustomCard = document.getElementById('mode-custom-card');
  const customItemsContainer = document.getElementById('custom-items-container');
  
  const cbCutting = document.getElementById('item-cutting');
  const cbStitching = document.getElementById('item-stitching');
  const cbLining = document.getElementById('item-lining');
  const cbEmming = document.getElementById('item-emming');

  const priceCutting = document.getElementById('price-cutting');
  const priceStitching = document.getElementById('price-stitching');
  const priceLining = document.getElementById('price-lining');
  const priceEmming = document.getElementById('price-emming');
  
  const inputAariCost = document.getElementById('aari-cost');
  const spanAariCalculated = document.getElementById('aari-calculated-price');
  
  const inputClientName = document.getElementById('client-name');
  const inputClientNotes = document.getElementById('client-notes');
  
  // Card elements
  const cardClientName = document.getElementById('card-client-name');
  const cardDate = document.getElementById('card-date');
  const cardItemsBody = document.getElementById('quote-items-body');
  const cardTotalPrice = document.getElementById('card-total-price');
  const cardNotesWrapper = document.getElementById('card-notes-wrapper');
  const cardNotesText = document.getElementById('card-notes-text');

  // Dashboard elements
  const dashCost = document.getElementById('dash-cost');
  const dashProfit = document.getElementById('dash-profit');
  const dashClient = document.getElementById('dash-client');
  
  // Action buttons
  const btnPrintQuote = document.getElementById('btn-print-quote');
  const btnCopyQuote = document.getElementById('btn-copy-quote');
  const btnShareWhatsapp = document.getElementById('btn-share-whatsapp');

  // Set today's date on card
  const today = new Date();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  cardDate.textContent = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;

  // State
  let stitchingMode = 'fixed'; // 'fixed' or 'custom'
  let tailoringTotal = 1100;
  let tailoringCost = 600;
  let tailoringProfit = 500;
  let aariClientPrice = 0;
  let aariProfit = 0;
  let aariCost = 0;
  let grandTotal = 1100;

  // Currency Formatter
  const fmt = (n) => '₹' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // Mode Selection events
  modeFixedCard.addEventListener('click', () => {
    modeFixedRadio.checked = true;
    selectMode('fixed');
  });

  modeCustomCard.addEventListener('click', () => {
    modeCustomRadio.checked = true;
    selectMode('custom');
  });

  function selectMode(mode) {
    stitchingMode = mode;
    if (mode === 'fixed') {
      modeFixedCard.classList.add('active');
      modeCustomCard.classList.remove('active');
      customItemsContainer.style.display = 'none';
    } else {
      modeCustomCard.classList.add('active');
      modeFixedCard.classList.remove('active');
      customItemsContainer.style.display = 'flex';
    }
    calculate();
  }

  // Checkbox/Input listeners
  [cbCutting, cbStitching, cbLining, cbEmming].forEach(cb => {
    cb.addEventListener('change', calculate);
  });

  [priceCutting, priceStitching, priceLining, priceEmming].forEach(input => {
    input.addEventListener('input', () => {
      if (input.value < 0) input.value = 0;
      calculate();
    });
    // Prevent checkbox click when clicking input
    input.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });

  inputAariCost.addEventListener('input', () => {
    if (inputAariCost.value < 0) inputAariCost.value = 0;
    calculate();
  });

  inputClientName.addEventListener('input', () => {
    cardClientName.textContent = inputClientName.value.trim() || 'Valued Client';
  });

  inputClientNotes.addEventListener('input', () => {
    const val = inputClientNotes.value.trim();
    if (val) {
      cardNotesWrapper.style.display = 'block';
      cardNotesText.textContent = val;
    } else {
      cardNotesWrapper.style.display = 'none';
    }
  });

  // Print Action
  btnPrintQuote.addEventListener('click', () => {
    window.print();
  });

  // Calculate Function
  function calculate() {
    // 1. Calculate Tailoring Total
    if (stitchingMode === 'fixed') {
      tailoringTotal = 1100;
      tailoringProfit = 500;
      tailoringCost = 600;
    } else {
      let costSum = 0;
      if (cbCutting.checked) costSum += parseFloat(priceCutting.value) || 0;
      if (cbStitching.checked) costSum += parseFloat(priceStitching.value) || 0;
      if (cbLining.checked) costSum += parseFloat(priceLining.value) || 0;
      if (cbEmming.checked) costSum += parseFloat(priceEmming.value) || 0;

      tailoringCost = costSum;
      tailoringProfit = costSum > 0 ? 500 : 0;
      tailoringTotal = tailoringCost + tailoringProfit;
    }

    // 2. Calculate Aari Work Price with 30% Profit Markup
    aariCost = parseFloat(inputAariCost.value) || 0;
    aariProfit = aariCost * 0.30;
    aariClientPrice = aariCost * 1.30;
    spanAariCalculated.textContent = fmt(aariClientPrice);

    // 3. Grand Total
    grandTotal = tailoringTotal + aariClientPrice;
    cardTotalPrice.textContent = fmt(grandTotal);

    // 4. Update internal Dashboard
    dashCost.textContent = fmt(tailoringCost + aariCost);
    dashProfit.textContent = fmt(tailoringProfit + aariProfit);
    dashClient.textContent = fmt(grandTotal);

    // Update Quotation Card
    renderCardItems();
  }

  // Render Quotation Card Items
  function renderCardItems() {
    cardItemsBody.innerHTML = '';

    if (stitchingMode === 'fixed') {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>Standard Blouse Stitching</td>
        <td class="text-right">${fmt(1100)}</td>
      `;
      cardItemsBody.appendChild(tr);
    } else {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>Customized Blouse Stitching</td>
        <td class="text-right">${fmt(tailoringTotal)}</td>
      `;
      cardItemsBody.appendChild(tr);
    }

    // Aari Work Row (if cost entered)
    if (aariCost > 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>Aari Embroidery Work <small style="color: #666; display: block;">Custom designer handwork</small></td>
        <td class="text-right">${fmt(aariClientPrice)}</td>
      `;
      cardItemsBody.appendChild(tr);
    }
  }

  // Generate Quote Text for sharing
  function generateQuoteText() {
    const client = inputClientName.value.trim() || 'Valued Client';
    const notes = inputClientNotes.value.trim();
    
    let text = `✨ *The Wedding Blouse By Kaaru* ✨\n`;
    text += `*PRICE ESTIMATION*\n\n`;
    text += `*Client:* ${client}\n`;
    text += `*Date:* ${cardDate.textContent}\n`;
    text += `------------------------------------\n`;

    if (stitchingMode === 'fixed') {
      text += `• Standard Stitching Package: ${fmt(1100)}\n`;
    } else {
      text += `• Customized Stitching Package: ${fmt(tailoringTotal)}\n`;
    }

    if (aariCost > 0) {
      text += `• Aari Embroidery Work: ${fmt(aariClientPrice)}\n`;
    }

    text += `------------------------------------\n`;
    text += `*Estimated Total: ${fmt(grandTotal)}*\n`;

    if (notes) {
      text += `\n*Note:* ${notes}\n`;
    }

    text += `\nThank you for choosing us to design your bridal blouse! 🌸`;
    return text;
  }

  // Copy Quote Action
  btnCopyQuote.addEventListener('click', () => {
    const text = generateQuoteText();
    navigator.clipboard.writeText(text).then(() => {
      const originalText = btnCopyQuote.innerHTML;
      btnCopyQuote.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        Copied!
      `;
      btnCopyQuote.classList.remove('btn-secondary');
      btnCopyQuote.classList.add('btn-primary');
      
      setTimeout(() => {
        btnCopyQuote.innerHTML = originalText;
        btnCopyQuote.classList.remove('btn-primary');
        btnCopyQuote.classList.add('btn-secondary');
      }, 2000);
    }).catch(err => {
      alert('Failed to copy text: ' + err);
    });
  });

  // Share via WhatsApp Action
  btnShareWhatsapp.addEventListener('click', () => {
    const text = encodeURIComponent(generateQuoteText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  });

  // Initial Calculation
  calculate();
});
