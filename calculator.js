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
  const inputClientPhone = document.getElementById('client-phone');
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
  
  // Added blouses list elements
  const btnAddBlouse = document.getElementById('btn-add-blouse');
  const btnClearBlouses = document.getElementById('btn-clear-blouses');
  const addedBlousesCard = document.getElementById('added-blouses-card');
  const addedBlousesList = document.getElementById('added-blouses-list');

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

  let addedBlouses = []; // Array of saved blouses

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

  // Multi-blouse addition trigger
  btnAddBlouse.addEventListener('click', () => {
    // Stitching mode validation: if customized, must have checked items
    if (stitchingMode === 'custom' && tailoringCost === 0 && aariCost === 0) {
      alert('Please check at least one tailoring service cost or enter an Aari Cost.');
      return;
    }

    // Generate descriptive metadata
    let desc = '';
    if (stitchingMode === 'fixed') {
      desc += 'Standard Stitching Package';
    } else {
      const parts = [];
      if (cbCutting.checked) parts.push('Cutting');
      if (cbStitching.checked) parts.push('Stitching');
      if (cbLining.checked) parts.push('Lining');
      if (cbEmming.checked) parts.push('Emming');
      desc += `Customized Stitching (${parts.join(', ')})`;
    }

    if (aariCost > 0) {
      desc += ` + Aari Embroidery`;
    }

    const blouse = {
      id: '_' + Math.random().toString(36).substr(2, 9),
      name: `Blouse ${addedBlouses.length + 1}`,
      desc: desc,
      stitchingMode: stitchingMode,
      tailoringTotal: tailoringTotal,
      tailoringCost: tailoringCost,
      tailoringProfit: tailoringProfit,
      aariCost: aariCost,
      aariProfit: aariProfit,
      aariClientPrice: aariClientPrice,
      totalClientPrice: tailoringTotal + aariClientPrice
    };

    addedBlouses.push(blouse);

    // Reset editor inputs for the next blouse
    inputAariCost.value = 0;
    cbCutting.checked = true;
    cbStitching.checked = true;
    cbLining.checked = true;
    cbEmming.checked = true;
    priceCutting.value = 150;
    priceStitching.value = 300;
    priceLining.value = 100;
    priceEmming.value = 60;
    selectMode('fixed');

    renderAddedBlouses();
    calculate();
  });

  btnClearBlouses.addEventListener('click', () => {
    addedBlouses = [];
    renderAddedBlouses();
    calculate();
  });

  function renderAddedBlouses() {
    addedBlousesList.innerHTML = '';
    if (addedBlouses.length === 0) {
      addedBlousesCard.style.display = 'none';
      return;
    }

    addedBlousesCard.style.display = 'block';

    addedBlouses.forEach((blouse, index) => {
      blouse.name = `Blouse ${index + 1}`;
      
      const div = document.createElement('div');
      div.className = 'added-blouse-item';
      div.innerHTML = `
        <div class="added-blouse-info">
          <span class="added-blouse-title">${blouse.name}</span>
          <span class="added-blouse-meta">${blouse.desc}</span>
        </div>
        <div class="added-blouse-right">
          <span class="added-blouse-price">${fmt(blouse.totalClientPrice)}</span>
          <button class="btn-delete-blouse" title="Delete Blouse">✕</button>
        </div>
      `;

      div.querySelector('.btn-delete-blouse').addEventListener('click', () => {
        addedBlouses = addedBlouses.filter(b => b.id !== blouse.id);
        renderAddedBlouses();
        calculate();
      });

      addedBlousesList.appendChild(div);
    });
  }

  // Calculate Function
  function calculate() {
    // 1. Calculate Currently Editing values
    let currentTailoringTotal = 0;
    let currentTailoringCost = 0;
    let currentTailoringProfit = 0;

    if (stitchingMode === 'fixed') {
      currentTailoringTotal = 1100;
      currentTailoringProfit = 500;
      currentTailoringCost = 600;
    } else {
      let costSum = 0;
      if (cbCutting.checked) costSum += parseFloat(priceCutting.value) || 0;
      if (cbStitching.checked) costSum += parseFloat(priceStitching.value) || 0;
      if (cbLining.checked) costSum += parseFloat(priceLining.value) || 0;
      if (cbEmming.checked) costSum += parseFloat(priceEmming.value) || 0;

      currentTailoringCost = costSum;
      currentTailoringProfit = costSum > 0 ? 500 : 0;
      currentTailoringTotal = currentTailoringCost + currentTailoringProfit;
    }

    // Aari Work Price
    const currentAariCost = parseFloat(inputAariCost.value) || 0;
    const currentAariProfit = currentAariCost * 0.30;
    const currentAariClientPrice = currentAariCost * 1.30;
    spanAariCalculated.textContent = fmt(currentAariClientPrice);

    // Sync to active variables
    tailoringTotal = currentTailoringTotal;
    tailoringCost = currentTailoringCost;
    tailoringProfit = currentTailoringProfit;
    aariCost = currentAariCost;
    aariProfit = currentAariProfit;
    aariClientPrice = currentAariClientPrice;

    // 2. Perform aggregation based on list length
    if (addedBlouses.length === 0) {
      grandTotal = currentTailoringTotal + currentAariClientPrice;
      cardTotalPrice.textContent = fmt(grandTotal);

      dashCost.textContent = fmt(currentTailoringCost + currentAariCost);
      dashProfit.textContent = fmt(currentTailoringProfit + currentAariProfit);
      dashClient.textContent = fmt(grandTotal);
    } else {
      let aggregateCost = 0;
      let aggregateProfit = 0;
      let aggregateClient = 0;

      addedBlouses.forEach(b => {
        aggregateCost += b.tailoringCost + b.aariCost;
        aggregateProfit += b.tailoringProfit + b.aariProfit;
        aggregateClient += b.totalClientPrice;
      });

      grandTotal = aggregateClient;
      cardTotalPrice.textContent = fmt(grandTotal);

      dashCost.textContent = fmt(aggregateCost);
      dashProfit.textContent = fmt(aggregateProfit);
      dashClient.textContent = fmt(grandTotal);
    }

    // Update Quotation Card
    renderCardItems();
  }

  // Render Quotation Card Items
  function renderCardItems() {
    cardItemsBody.innerHTML = '';

    if (addedBlouses.length === 0) {
      if (stitchingMode === 'fixed') {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>Standard Blouse Stitching (Fixed Package)</td>
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

      if (aariCost > 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>Aari Embroidery Work <small style="color: #666; display: block;">Custom designer handwork</small></td>
          <td class="text-right">${fmt(aariClientPrice)}</td>
        `;
        cardItemsBody.appendChild(tr);
      }
    } else {
      addedBlouses.forEach(blouse => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <strong>${blouse.name}</strong>
            <small style="color: #666; display: block;">${blouse.desc}</small>
          </td>
          <td class="text-right">${fmt(blouse.totalClientPrice)}</td>
        `;
        cardItemsBody.appendChild(tr);
      });
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

    if (addedBlouses.length === 0) {
      if (stitchingMode === 'fixed') {
        text += `• Standard Stitching Package: ${fmt(1100)}\n`;
      } else {
        text += `• Customized Stitching Package: ${fmt(tailoringTotal)}\n`;
      }

      if (aariCost > 0) {
        text += `• Aari Embroidery Work: ${fmt(aariClientPrice)}\n`;
      }
    } else {
      addedBlouses.forEach(b => {
        text += `• *${b.name}* (${b.desc}): ${fmt(b.totalClientPrice)}\n`;
      });
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
    let phone = inputClientPhone.value.trim().replace(/\D/g, '');
    
    // Automatically prepend India country code (91) if it's a 10-digit number
    if (phone.length === 10) {
      phone = '91' + phone;
    }
    
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  });

  // Initial Calculation
  calculate();
});
