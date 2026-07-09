/**
 * E-Invoice - Professional Invoice Generator Logic
 * Powered by Vanilla JS
 * Customized for: The Wedding Blouse By Kaaru
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================================================
  // ELEMENT SELECTORS
  // ==========================================================================
  
  // Form Controls
  const invoiceNoInput = document.getElementById('invoice-no');
  const invoiceDateInput = document.getElementById('invoice-date');
  const customerNameInput = document.getElementById('customer-name');
  const customerPhoneInput = document.getElementById('customer-phone');
  
  const itemsContainer = document.getElementById('items-container');
  const addItemBtn = document.getElementById('add-item-btn');
  const paymentMethodInput = document.getElementById('payment-method');

  // Preview Elements
  const previewCustomerName = document.getElementById('preview-customer-name');
  const previewCustomerPhone = document.getElementById('preview-customer-phone');
  const previewInvoiceNo = document.getElementById('preview-invoice-no');
  const previewInvoiceDate = document.getElementById('preview-invoice-date');
  
  const previewItemsBody = document.getElementById('preview-items-body');
  const previewGrandTotal = document.getElementById('preview-grand-total');
  const previewPaymentMethod = document.getElementById('preview-payment-method');

  // Action Buttons
  const generateBtn = document.getElementById('generate-btn');
  const downloadPdfBtn = document.getElementById('download-pdf-btn');
  const printBtn = document.getElementById('print-btn');
  const whatsappBtn = document.getElementById('whatsapp-btn');
  const clearBtn = document.getElementById('clear-btn');

  // Tab Toggles (Mobile View)
  const toggleEditorTab = document.getElementById('toggle-editor');
  const togglePreviewTab = document.getElementById('toggle-preview');
  const editorPanel = document.getElementById('editor-panel');
  const previewPanel = document.getElementById('preview-panel');

  // Modal elements
  const invoiceModal = document.getElementById('invoice-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const modalInvoiceBody = document.getElementById('modal-invoice-body');
  const modalDownloadBtn = document.getElementById('modal-download-btn');
  const modalPrintBtn = document.getElementById('modal-print-btn');
  const modalCloseActionBtn = document.getElementById('modal-close-action-btn');

  // A4 Reference element
  const invoiceCard = document.getElementById('invoice-card');

  // State Variables
  let nextInvoiceNo = '';

  // ==========================================================================
  // INITIALIZATION & DATES
  // ==========================================================================

  // Set today's date on start
  const setTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    invoiceDateInput.value = `${yyyy}-${mm}-${dd}`;
  };

  // Generate Sequential Invoice Numbers
  const generateSequentialInvoiceNumber = () => {
    const currentYear = new Date().getFullYear();
    let currentCounter = localStorage.getItem('invoice_counter');
    
    if (!currentCounter) {
      currentCounter = 1;
      localStorage.setItem('invoice_counter', currentCounter);
    }
    
    const paddedCounter = String(currentCounter).padStart(4, '0');
    nextInvoiceNo = `INV-${currentYear}-${paddedCounter}`;
    invoiceNoInput.value = nextInvoiceNo;
  };

  // Format YYYY-MM-DD input value to human readable string (e.g. 09 Jul 2026)
  const formatHumanReadableDate = (dateStr) => {
    if (!dateStr) return 'Date';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parts[2];
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${monthNames[monthIndex] || ''} ${year}`;
  };

  // ==========================================================================
  // ITEM ROWS MANAGER
  // ==========================================================================

  // Create a brand new item row in editor
  const createItemRow = (particulars = '', qty = 1, price = 0) => {
    const rowId = 'row-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    const rowDiv = document.createElement('div');
    rowDiv.className = 'item-row';
    rowDiv.id = rowId;
    
    rowDiv.innerHTML = `
      <div class="form-group">
        <label>Particulars</label>
        <input type="text" class="item-particulars" value="${particulars}" placeholder="Item details/services" required>
      </div>
      <div class="form-group">
        <label>Qty</label>
        <input type="number" class="item-qty" value="${qty}" min="1" step="any">
      </div>
      <div class="form-group">
        <label>Price (₹)</label>
        <input type="number" class="item-price" value="${price}" min="0" step="any">
      </div>
      <div class="form-group">
        <label>Amount</label>
        <input type="text" class="item-amount item-amount-input" value="0.00" disabled readonly>
      </div>
      <button type="button" class="remove-item-btn" title="Remove Item">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    `;

    // Attach local recalculation hooks
    const qtyInput = rowDiv.querySelector('.item-qty');
    const priceInput = rowDiv.querySelector('.item-price');
    const amountInput = rowDiv.querySelector('.item-amount');
    const particularsInput = rowDiv.querySelector('.item-particulars');

    const updateRowAmount = () => {
      const q = parseFloat(qtyInput.value) || 0;
      const p = parseFloat(priceInput.value) || 0;
      const totalAmount = q * p;
      amountInput.value = totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      syncPreview();
    };

    qtyInput.addEventListener('input', updateRowAmount);
    priceInput.addEventListener('input', updateRowAmount);
    particularsInput.addEventListener('input', syncPreview);

    // Remove event
    rowDiv.querySelector('.remove-item-btn').addEventListener('click', () => {
      rowDiv.remove();
      syncPreview();
    });

    itemsContainer.appendChild(rowDiv);
    updateRowAmount();
  };

  // Add Item Button event
  addItemBtn.addEventListener('click', () => {
    createItemRow('', 1, 0);
  });

  // ==========================================================================
  // PREVIEW SYNCHRONIZER (LIVE BINDING)
  // ==========================================================================

  const syncPreview = () => {
    // 1. Text Field Binds
    previewInvoiceNo.textContent = invoiceNoInput.value.trim() || 'INV-2026-0000';
    previewInvoiceDate.textContent = formatHumanReadableDate(invoiceDateInput.value);
    
    previewCustomerName.textContent = customerNameInput.value.trim() || 'Customer Name';
    previewCustomerPhone.textContent = customerPhoneInput.value.trim() || 'Phone Number';

    previewPaymentMethod.textContent = paymentMethodInput.value;

    // 2. Synchronize Items Table
    const itemRows = itemsContainer.querySelectorAll('.item-row');
    previewItemsBody.innerHTML = '';
    
    let grandTotal = 0;

    if (itemRows.length === 0) {
      previewItemsBody.innerHTML = `
        <tr>
          <td colspan="4" class="empty-table-row">No items entered yet. Click "Add Item" to add particulars.</td>
        </tr>
      `;
    } else {
      itemRows.forEach(row => {
        const particulars = row.querySelector('.item-particulars').value.trim() || 'Untitled Item';
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const amount = qty * price;
        grandTotal += amount;

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="col-desc">${particulars}</td>
          <td class="col-qty">${qty}</td>
          <td class="col-price">₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td class="col-amount">₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        `;
        previewItemsBody.appendChild(tr);
      });
    }

    // 3. Update Grand Total
    previewGrandTotal.textContent = `₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Wire up change/keyup triggers on static inputs for real-time synchronization
  const inputsToSync = [
    invoiceNoInput, invoiceDateInput, customerNameInput, customerPhoneInput, paymentMethodInput
  ];
  
  inputsToSync.forEach(input => {
    input.addEventListener('input', syncPreview);
    input.addEventListener('change', syncPreview);
  });

  // ==========================================================================
  // INPUT VALIDATIONS
  // ==========================================================================

  const validateInvoiceInputs = () => {
    // Check Client Name
    const name = customerNameInput.value.trim();
    if (!name) {
      alert('Please fill out the Customer Name.');
      customerNameInput.focus();
      return false;
    }

    // Check Phone
    const phone = customerPhoneInput.value.trim();
    if (!phone) {
      alert('Please fill out the Customer Phone.');
      customerPhoneInput.focus();
      return false;
    }

    // Basic Phone Match (allow + digits, spaces, hyphens but check for length/numbers)
    const rawDigits = phone.replace(/\D/g, '');
    if (rawDigits.length < 10) {
      alert('Please enter a valid Phone Number (minimum 10 digits).');
      customerPhoneInput.focus();
      return false;
    }

    // Check Items count
    const itemRows = itemsContainer.querySelectorAll('.item-row');
    if (itemRows.length === 0) {
      alert('Please add at least one line item before continuing.');
      addItemBtn.focus();
      return false;
    }

    // Check individual items particulars
    for (let i = 0; i < itemRows.length; i++) {
      const particulars = itemRows[i].querySelector('.item-particulars').value.trim();
      const qty = parseFloat(itemRows[i].querySelector('.item-qty').value) || 0;
      if (!particulars) {
        alert(`Line Item ${i + 1} Particulars cannot be empty.`);
        itemRows[i].querySelector('.item-particulars').focus();
        return false;
      }
      if (qty <= 0) {
        alert(`Line Item ${i + 1} Quantity must be greater than zero.`);
        itemRows[i].querySelector('.item-qty').focus();
        return false;
      }
    }

    return true;
  };

  // ==========================================================================
  // ACTIONS / BUTTON CONTROLLERS
  // ==========================================================================

  // Clear & Reset Form
  const clearForm = () => {
    if (!confirm('Are you sure you want to clear the client details and item list?')) {
      return;
    }

    // Clear client fields
    customerNameInput.value = '';
    customerPhoneInput.value = '';
    
    // Reset date & invoice number
    setTodayDate();
    generateSequentialInvoiceNumber();

    // Clear dynamic row items
    itemsContainer.innerHTML = '';
    
    // Add single default line item
    createItemRow('', 1, 0);

    // Sync Preview UI
    syncPreview();
  };

  clearBtn.addEventListener('click', clearForm);

  // Trigger A4 Print Sequence
  const printInvoice = () => {
    if (!validateInvoiceInputs()) return;
    window.print();
  };

  if (printBtn) printBtn.addEventListener('click', printInvoice);
  if (modalPrintBtn) modalPrintBtn.addEventListener('click', printInvoice);

  // Trigger PDF File Generation & Download
  const downloadPDF = () => {
    if (!validateInvoiceInputs()) return;

    const targetElement = document.getElementById('invoice-card');
    const invoiceNo = invoiceNoInput.value.trim() || 'INV-TEMP';
    const customerName = customerNameInput.value.trim().replace(/\s+/g, '_');

    const options = {
      margin:       0,
      filename:     `Invoice_${invoiceNo}_${customerName}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Show visual loading indicator if button exists
    let oldText = '';
    if (downloadPdfBtn) {
      downloadPdfBtn.disabled = true;
      oldText = downloadPdfBtn.innerHTML;
      downloadPdfBtn.innerHTML = `
        <svg class="btn-icon animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
        Generating...
      `;
    }

    // Process conversion
    html2pdf().set(options).from(targetElement).save()
      .then(() => {
        if (downloadPdfBtn) {
          downloadPdfBtn.disabled = false;
          downloadPdfBtn.innerHTML = oldText;
        }
        
        // Auto-increment the invoice counter localstorage for a successful operation
        incrementInvoiceCounter();
      })
      .catch((err) => {
        console.error('PDF export failed:', err);
        alert('PDF Generation failed. Please try printing to PDF instead.');
        if (downloadPdfBtn) {
          downloadPdfBtn.disabled = false;
          downloadPdfBtn.innerHTML = oldText;
        }
      });
  };

  if (downloadPdfBtn) downloadPdfBtn.addEventListener('click', downloadPDF);
  if (modalDownloadBtn) modalDownloadBtn.addEventListener('click', downloadPDF);

  // Auto increment invoice count helper
  const incrementInvoiceCounter = () => {
    let currentCounter = parseInt(localStorage.getItem('invoice_counter'), 10) || 1;
    localStorage.setItem('invoice_counter', currentCounter + 1);
  };

  // WhatsApp Web Redirection Message Constructor
  const shareOnWhatsApp = () => {
    if (!validateInvoiceInputs()) return;

    // Setup UI feedback loading spinner on WhatsApp button
    whatsappBtn.disabled = true;
    const oldText = whatsappBtn.innerHTML;
    whatsappBtn.innerHTML = `
      <svg class="btn-icon animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style="animation: spin 1s linear infinite; margin-right: 0.5rem;"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" style="opacity: 0.25;"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" style="opacity: 0.75;"></path></svg>
      Preparing PDF...
    `;

    const targetElement = document.getElementById('invoice-card');
    const invoiceNo = invoiceNoInput.value.trim() || 'INV-TEMP';
    const customerName = customerNameInput.value.trim();
    const customerNameSafe = customerName.replace(/\s+/g, '_');
    const filename = `Invoice_${invoiceNo}_${customerNameSafe}.pdf`;

    const options = {
      margin:       0,
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Render HTML to PDF and trigger download
    html2pdf().set(options).from(targetElement).save()
      .then(() => {
        // Setup Text Parameters
        const customerPhone = customerPhoneInput.value.trim().replace(/\D/g, ''); // Extract raw digits
        const companyName = 'The Wedding Blouse By Kaaru';

        // Construct Text Body with instructions
        const messageText = 
`Hello ${customerName},

Thank you for your purchase. Please find your invoice attached below.

Regards,
${companyName}`;

        const encodedMessage = encodeURIComponent(messageText);
        
        // If the phone number exists, prefix country code if needed (Indian numbers usually prefix 91 if length is 10)
        let formattedPhone = customerPhone;
        if (customerPhone.length === 10) {
          formattedPhone = '91' + customerPhone;
        }

        // Launch WhatsApp tab
        const whatsAppUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
        window.open(whatsAppUrl, '_blank');

        // Auto-increment the invoice counter localstorage for a successful operation
        incrementInvoiceCounter();
        
        whatsappBtn.disabled = false;
        whatsappBtn.innerHTML = oldText;
      })
      .catch((err) => {
        console.error('PDF generation/WhatsApp share failed:', err);
        alert('Could not prepare PDF or open WhatsApp. Please try again.');
        whatsappBtn.disabled = false;
        whatsappBtn.innerHTML = oldText;
      });
  };

  whatsappBtn.addEventListener('click', shareOnWhatsApp);

  // ==========================================================================
  // MODAL OVERLAY CONTROL (GENERATE INVOICE PREVIEW VIEW)
  // ==========================================================================

  const openInvoiceModal = () => {
    if (!validateInvoiceInputs()) return;
    
    // Temporarily clone/move the preview invoice card inside the modal body
    modalInvoiceBody.innerHTML = '';
    
    // Clone node to prevent event detachments on primary view
    const clonedCard = invoiceCard.cloneNode(true);
    modalInvoiceBody.appendChild(clonedCard);
    
    invoiceModal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Stop background scrolling
  };

  const closeInvoiceModal = () => {
    invoiceModal.classList.remove('active');
    document.body.style.overflow = ''; // Resume scrolling
  };

  generateBtn.addEventListener('click', openInvoiceModal);
  closeModalBtn.addEventListener('click', closeInvoiceModal);
  modalCloseActionBtn.addEventListener('click', closeInvoiceModal);

  // Close modal when clicking outside content area
  invoiceModal.addEventListener('click', (e) => {
    if (e.target === invoiceModal) {
      closeInvoiceModal();
    }
  });

  // ==========================================================================
  // MOBILE NAVIGATION TAB TOGGLES
  // ==========================================================================

  const selectTab = (tab) => {
    if (tab === 'editor') {
      toggleEditorTab.classList.add('active');
      togglePreviewTab.classList.remove('active');
      editorPanel.style.display = 'block';
      previewPanel.style.display = 'none';
    } else {
      toggleEditorTab.classList.remove('active');
      togglePreviewTab.classList.add('active');
      editorPanel.style.display = 'none';
      previewPanel.style.display = 'flex';
      syncPreview();
    }
  };

  toggleEditorTab.addEventListener('click', () => selectTab('editor'));
  togglePreviewTab.addEventListener('click', () => selectTab('preview'));

  // Handles browser viewport resizing - restore panels to standard side-by-side grids on Desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) {
      editorPanel.style.display = 'block';
      previewPanel.style.display = 'flex';
    } else {
      // Re-trigger active tab choice when resizing down
      const activeTab = toggleEditorTab.classList.contains('active') ? 'editor' : 'preview';
      selectTab(activeTab);
    }
  });

  // ==========================================================================
  // BOOTSTRAP INITIAL PAGE STATE
  // ==========================================================================
  
  setTodayDate();
  generateSequentialInvoiceNumber();
  
  // Create first row empty as default input
  createItemRow('', 1, 0);
  
  // Final initial preview synchronization
  syncPreview();

});
