import { sanitizeOrder, formatCurrency, generateBarcodeSVG, getQRCodeURL, validateValue } from './orderUtils';

/**
 * Generates enterprise-grade A4 Invoice HTML (Shopify / Amazon / Flipkart style).
 */
export const generateInvoiceHTML = (rawOrder, storeSettings = {}) => {
  const order = sanitizeOrder(rawOrder);
  const logoUrl = storeSettings.logoUrl || '/logo.jpg';
  const supportEmail = 'noorwallartsofficial@gmail.com';
  const supportPhone = '+91 89253 25330';
  const websiteUrl = 'www.noorwallarts.in';
  const qrUrl = getQRCodeURL(`Order:${order.id} | Customer:${order.customer.name} | Phone:${order.customer.phone} | Total:${formatCurrency(order.totalPrice)} | Date:${order.formattedDate}`);
  const barcodeSVG = generateBarcodeSVG(order.id);

  const itemsRowsHTML = order.items.map((item, index) => `
    <tr style="border-bottom: 1px solid #E5E7EB;">
      <td style="padding: 12px; text-align: center; color: #6B7280; font-size: 13px; font-weight: 500;">${index + 1}</td>
      <td style="padding: 12px; width: 60px; text-align: center;">
        <img src="${item.imageUrl}" alt="${item.title}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 6px; border: 1px solid #E5E7EB;" onError="this.src='/logo.jpg'" />
      </td>
      <td style="padding: 12px;">
        <div style="font-weight: 600; color: #111827; font-size: 14px; margin-bottom: 4px;">${item.title}</div>
        <div style="font-size: 12px; color: #6B7280; line-height: 1.4;">
          ${item.variant !== 'N/A' ? `<span><strong>Variant:</strong> ${item.variant}</span> | ` : ''}
          ${item.size !== 'N/A' ? `<span><strong>Size:</strong> ${item.size}</span> | ` : ''}
          ${item.color !== 'N/A' ? `<span><strong>Color:</strong> ${item.color}</span> | ` : ''}
          ${item.frameType !== 'N/A' ? `<span><strong>Frame:</strong> ${item.frameType}</span>` : ''}
        </div>
      </td>
      <td style="padding: 12px; text-align: center; font-weight: 600; color: #111827; font-size: 14px;">${item.quantity}</td>
      <td style="padding: 12px; text-align: right; font-weight: 500; color: #374151; font-size: 14px;">${formatCurrency(item.price)}</td>
      <td style="padding: 12px; text-align: right; font-weight: 700; color: #111827; font-size: 14px;">${formatCurrency(item.totalPrice)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${order.id}</title>
  <style>
    @media print {
      @page { size: A4; margin: 10mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      background-color: #F9FAFB;
      color: #111827;
      padding: 30px;
      line-height: 1.5;
    }
    .invoice-container {
      max-width: 820px;
      margin: 0 auto;
      background: #FFFFFF;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      border: 1px solid #E5E7EB;
    }
    .header-centered {
      text-align: center;
      padding-bottom: 24px;
      border-bottom: 2px solid #111827;
      margin-bottom: 24px;
    }
    .store-logo {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: 50%;
      margin: 0 auto 12px auto;
      border: 2px solid #D4AF37;
      display: block;
    }
    .store-title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 1px;
      color: #111827;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .store-contact {
      font-size: 13px;
      color: #4B5563;
      font-weight: 500;
    }
    .invoice-meta-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #F3F4F6;
      padding: 16px 20px;
      border-radius: 8px;
      margin-bottom: 24px;
      border: 1px solid #E5E7EB;
    }
    .meta-item { display: flex; flex-direction: column; }
    .meta-label { font-size: 11px; text-transform: uppercase; color: #6B7280; font-weight: 700; letter-spacing: 0.5px; }
    .meta-value { font-size: 15px; font-weight: 700; color: #111827; margin-top: 2px; }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-paid { background: #DEF7EC; color: #03543F; border: 1px solid #84E1BC; }
    .badge-pending { background: #FEF08A; color: #713F12; border: 1px solid #FDE047; }
    
    .billing-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 28px;
    }
    .address-card {
      background: #FAFAFA;
      padding: 18px;
      border-radius: 8px;
      border: 1px solid #E5E7EB;
    }
    .address-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      color: #374151;
      margin-bottom: 10px;
      letter-spacing: 0.5px;
    }
    .address-text { font-size: 13.5px; color: #1F2937; line-height: 1.6; }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
    }
    .items-table th {
      background: #111827;
      color: #FFFFFF;
      padding: 12px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .summary-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-top: 20px;
    }
    .codes-box {
      display: flex;
      gap: 20px;
      align-items: center;
      background: #FFFFFF;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #E5E7EB;
    }
    .totals-box {
      width: 320px;
      background: #FAFAFA;
      padding: 18px;
      border-radius: 8px;
      border: 1px solid #E5E7EB;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 14px;
      color: #4B5563;
    }
    .totals-grand {
      display: flex;
      justify-content: space-between;
      padding-top: 12px;
      margin-top: 8px;
      border-top: 2px solid #111827;
      font-size: 18px;
      font-weight: 800;
      color: #111827;
    }

    .footer-centered {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      text-align: center;
      color: #6B7280;
      font-size: 13px;
    }
    .print-actions {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-bottom: 24px;
    }
    .btn-action {
      background: #111827;
      color: #FFFFFF;
      border: none;
      padding: 10px 24px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    }
    .btn-action:hover { background: #374151; }
  </style>
</head>
<body>

  <div class="print-actions no-print">
    <button class="btn-action" onclick="window.print()">🖨️ Print Invoice</button>
    <button class="btn-action" style="background: #059669;" onclick="window.print()">📄 Save as PDF</button>
  </div>

  <div class="invoice-container">
    
    <!-- CENTERED HEADER -->
    <div class="header-centered">
      <img src="${logoUrl}" alt="Noor WallArts Logo" class="store-logo" onError="this.src='/logo.jpg'" />
      <div class="store-title">NOOR WALLARTS & GIFTS</div>
      <div class="store-contact">
        📧 ${supportEmail} &nbsp;|&nbsp; 📞 ${supportPhone} &nbsp;|&nbsp; 🌐 ${websiteUrl}
      </div>
    </div>

    <!-- META BAR -->
    <div class="invoice-meta-bar">
      <div class="meta-item">
        <span class="meta-label">Invoice Number</span>
        <span class="meta-value">${order.id}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Date & Time</span>
        <span class="meta-value">${order.formattedDate}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Payment Method</span>
        <span class="meta-value">${order.paymentMethod}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Payment Status</span>
        <span class="badge ${order.paymentStatus.toLowerCase().includes('paid') ? 'badge-paid' : 'badge-pending'}">${order.paymentStatus}</span>
      </div>
    </div>

    <!-- BILLING ADDRESS -->
    <div class="billing-grid">
      <div class="address-card">
        <div class="address-title">Billed & Shipped To</div>
        <div class="address-text">
          <strong style="font-size: 15px; color: #111827;">${order.customer.name}</strong><br />
          📞 ${order.customer.phone}<br />
          ✉️ ${order.customer.email}<br />
          🏠 ${order.customer.fullAddress}
        </div>
      </div>
      
      <div class="address-card">
        <div class="address-title">Order Information</div>
        <div class="address-text">
          <strong>Order ID:</strong> ${order.id}<br />
          <strong>Transaction ID:</strong> ${order.transactionId}<br />
          <strong>Order Status:</strong> ${order.status}<br />
          <strong>Tracking Number:</strong> ${order.trackingNumber}
        </div>
      </div>
    </div>

    <!-- PRODUCT TABLE -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 40px; text-align: center;">#</th>
          <th style="width: 70px; text-align: center;">Item</th>
          <th style="text-align: left;">Product Description</th>
          <th style="width: 60px; text-align: center;">Qty</th>
          <th style="width: 100px; text-align: right;">Unit Price</th>
          <th style="width: 110px; text-align: right;">Line Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRowsHTML}
      </tbody>
    </table>

    <!-- CODES & SUMMARY -->
    <div class="summary-section">
      <div class="codes-box">
        <img src="${qrUrl}" alt="QR Code" width="90" height="90" style="border-radius: 4px;" />
        <div style="text-align: center;">
          <div style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: #6B7280; margin-bottom: 4px;">Barcode Verification</div>
          ${barcodeSVG}
        </div>
      </div>

      <div class="totals-box">
        <div class="totals-row">
          <span>Subtotal</span>
          <span>${formatCurrency(order.subtotal)}</span>
        </div>
        <div class="totals-row">
          <span>Shipping & Delivery</span>
          <span>${order.deliveryFee === 0 ? 'FREE' : formatCurrency(order.deliveryFee)}</span>
        </div>
        ${order.discount > 0 ? `
          <div class="totals-row" style="color: #059669;">
            <span>Coupon Discount</span>
            <span>-${formatCurrency(order.discount)}</span>
          </div>
        ` : ''}
        ${order.gst > 0 ? `
          <div class="totals-row">
            <span>GST / Tax</span>
            <span>${formatCurrency(order.gst)}</span>
          </div>
        ` : ''}
        <div class="totals-grand">
          <span>Grand Total</span>
          <span>${formatCurrency(order.totalPrice)}</span>
        </div>
      </div>
    </div>

    <!-- CENTERED FOOTER -->
    <div class="footer-centered">
      <p style="font-weight: 700; color: #111827; font-size: 14px; margin-bottom: 4px;">Thank you for shopping with Noor WallArts & Gifts!</p>
      <p>Need Help? Email: <strong>${supportEmail}</strong> | Phone: <strong>${supportPhone}</strong> | Website: <strong>${websiteUrl}</strong></p>
      <p style="font-size: 11px; color: #9CA3AF; margin-top: 10px;">This is a computer-generated tax invoice and requires no physical signature.</p>
    </div>

  </div>

</body>
</html>
  `;
};

/**
 * Generates A6 Thermal Print-Ready Shipping Label HTML.
 */
export const generateShippingLabelHTML = (rawOrder, storeSettings = {}) => {
  const order = sanitizeOrder(rawOrder);
  const logoUrl = storeSettings.logoUrl || '/logo.jpg';
  const websiteUrl = 'www.noorwallarts.in';
  const isCOD = order.paymentMethod.toUpperCase().includes('COD');
  const qrUrl = getQRCodeURL(`ShipTo:${order.customer.name}|Phone:${order.customer.phone}|OrderID:${order.id}|Address:${order.customer.fullAddress}`);
  const barcodeSVG = generateBarcodeSVG(order.id);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Shipping Label - ${order.id}</title>
  <style>
    @media print {
      @page { size: A6 portrait; margin: 4mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 0; background: #FFF; }
      .no-print { display: none !important; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
      background: #F3F4F6;
      padding: 20px;
      color: #000000;
    }
    .label-container {
      width: 100%;
      max-width: 400px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 3px solid #000000;
      padding: 12px;
      border-radius: 6px;
    }
    .label-header {
      text-align: center;
      border-bottom: 2px solid #000000;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .label-logo { width: 50px; height: 50px; border-radius: 50%; margin: 0 auto 4px auto; display: block; border: 1px solid #000; }
    .label-store-name { font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
    .label-website { font-size: 11px; font-weight: 600; color: #333; }

    .badge-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #000000;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .cod-badge {
      background: #000000;
      color: #FFFFFF;
      font-size: 16px;
      font-weight: 900;
      padding: 6px 14px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .prepaid-badge {
      background: #15803D;
      color: #FFFFFF;
      font-size: 16px;
      font-weight: 900;
      padding: 6px 14px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .ship-to-box {
      border: 2px solid #000000;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 10px;
      background: #FAFAFA;
    }
    .ship-to-title { font-size: 11px; font-weight: 900; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 3px; margin-bottom: 6px; }
    .customer-name { font-size: 18px; font-weight: 900; text-transform: uppercase; line-height: 1.2; margin-bottom: 4px; }
    .customer-phone { font-size: 16px; font-weight: 900; margin-bottom: 6px; }
    .customer-address { font-size: 13px; font-weight: 700; line-height: 1.4; color: #111; }
    .customer-pincode { font-size: 20px; font-weight: 900; margin-top: 6px; background: #000; color: #FFF; display: inline-block; padding: 2px 8px; border-radius: 4px; }

    .items-summary-box {
      border: 1px solid #000000;
      padding: 8px;
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 10px;
      border-radius: 4px;
    }

    .codes-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 2px solid #000000;
      padding-top: 8px;
    }

    .warning-box {
      margin-top: 10px;
      border: 2px dashed #000;
      text-align: center;
      padding: 6px;
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      background: #FFFBEB;
    }
    .print-actions { text-align: center; margin-bottom: 16px; }
    .btn-action { background: #000; color: #FFF; border: none; padding: 8px 20px; font-weight: bold; border-radius: 4px; cursor: pointer; }
  </style>
</head>
<body>

  <div class="print-actions no-print">
    <button class="btn-action" onclick="window.print()">🖨️ Print A6 Shipping Label</button>
  </div>

  <div class="label-container">
    
    <!-- HEADER -->
    <div class="label-header">
      <img src="${logoUrl}" alt="Logo" class="label-logo" onError="this.src='/logo.jpg'" />
      <div class="label-store-name">NOOR WALLARTS & GIFTS</div>
      <div class="label-website">${websiteUrl}</div>
    </div>

    <!-- BADGE BAR -->
    <div class="badge-bar">
      <div>
        <div style="font-size: 10px; font-weight: 900; text-transform: uppercase;">Order ID</div>
        <div style="font-size: 16px; font-weight: 900;">${order.id}</div>
      </div>
      <div class="${isCOD ? 'cod-badge' : 'prepaid-badge'}">
        ${isCOD ? `COD: ${formatCurrency(order.totalPrice)}` : 'PREPAID - PAID'}
      </div>
    </div>

    <!-- SHIP TO BOX -->
    <div class="ship-to-box">
      <div class="ship-to-title">DELIVER TO (RECIPIENT):</div>
      <div class="customer-name">${order.customer.name}</div>
      <div class="customer-phone">📞 TEL: ${order.customer.phone}</div>
      <div class="customer-address">${order.customer.fullAddress}</div>
      <div><span class="customer-pincode">PIN: ${order.customer.pincode}</span></div>
    </div>

    <!-- ITEM SUMMARY -->
    <div class="items-summary-box">
      <strong>CONTENTS (${order.items.length} items):</strong><br />
      ${order.items.map(i => `• ${i.title} x${i.quantity}`).join('<br />')}
    </div>

    <!-- BARCODE & QR -->
    <div class="codes-footer">
      <div style="width: 65%;">
        ${barcodeSVG}
      </div>
      <img src="${qrUrl}" alt="QR Code" width="75" height="75" style="border: 1px solid #000; border-radius: 4px;" />
    </div>

    <!-- WARNING BADGE -->
    <div class="warning-box">
      ⚠️ FRAGILE - HANDLE WITH CARE - ISLAMIC WALL ART & GLASS
    </div>

  </div>

</body>
</html>
  `;
};

/**
 * Opens browser print window for Invoice.
 */
export const printInvoice = (order, storeSettings = {}) => {
  const html = generateInvoiceHTML(order, storeSettings);
  const win = window.open('', '_blank', 'width=900,height=1000');
  win.document.write(html);
  win.document.close();
};

/**
 * Opens browser print window for Shipping Label.
 */
export const printShippingLabel = (order, storeSettings = {}) => {
  const html = generateShippingLabelHTML(order, storeSettings);
  const win = window.open('', '_blank', 'width=600,height=800');
  win.document.write(html);
  win.document.close();
};
