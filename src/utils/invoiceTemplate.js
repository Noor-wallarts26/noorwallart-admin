import { sanitizeOrder, formatCurrency, generateBarcodeSVG, getQRCodeURL, validateValue } from './orderUtils';

/**
 * Helper to determine badge color based on Order Status.
 */
const getStatusBadgeStyle = (status = '') => {
  const s = String(status).toUpperCase();
  if (s.includes('DELIVERED')) {
    return { bg: '#DEF7EC', color: '#03543F', border: '#84E1BC', text: 'DELIVERED ✅' };
  }
  if (s.includes('CANCEL') || s.includes('RETURN')) {
    return { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5', text: s.includes('CANCEL') ? 'CANCELLED ❌' : 'RETURNED 🔄' };
  }
  if (s.includes('SHIPPED') || s.includes('OUT FOR DELIVERY')) {
    return { bg: '#E0E7FF', color: '#3730A3', border: '#A5B4FC', text: s.includes('OUT') ? 'OUT FOR DELIVERY 🚚' : 'SHIPPED 🚚' };
  }
  if (s.includes('PACK') || s.includes('READY')) {
    return { bg: '#F3E8FF', color: '#6B21A8', border: '#D8B4FE', text: 'ORDER READY 📦' };
  }
  if (s.includes('CONFIRM') || s.includes('ACCEPT') || s.includes('PROCESS')) {
    return { bg: '#DBEAFE', color: '#1E40AF', border: '#93C5FD', text: 'CONFIRMED ⚙️' };
  }
  return { bg: '#FEF08A', color: '#713F12', border: '#FDE047', text: 'PENDING ⏳' };
};

/**
 * Generates Premium NOORKARTS A4 Print-Ready Invoice HTML.
 */
export const generateInvoiceHTML = (rawOrder, storeSettings = {}) => {
  const order = sanitizeOrder(rawOrder);
  const supportEmail = 'noorkarts.in@gmail.com';
  const supportPhone = '+91 89253 25330';
  const statusStyle = getStatusBadgeStyle(order.status);
  const isPaid = order.paymentStatus.toLowerCase().includes('paid');

  const invoiceNumber = `INV-${order.id}`;
  const trackingNo = order.trackingNumber && order.trackingNumber !== 'N/A' ? order.trackingNumber : `TRK-${order.id}`;
  const validCourier = order.courier && typeof order.courier === 'string' && order.courier !== 'N/A' && order.courier !== 'undefined' && order.courier !== 'null' ? order.courier.trim() : '';

  const qrDataText = `Order ID: ${order.id} | Invoice: ${invoiceNumber} | Customer: ${order.customer.name} | Phone: ${order.customer.phone} | Address: ${order.customer.fullAddress} | Status: ${order.paymentStatus} | Total: ${formatCurrency(order.totalPrice)} | Tracking: ${trackingNo}`;
  const qrUrl = getQRCodeURL(qrDataText);
  const barcodeSVG = generateBarcodeSVG(order.id);

  // Address lines sanitation (No '#' symbol before address)
  const billingEmailLine = order.customer.email && order.customer.email !== 'N/A' ? `<div><span style="color: #64748B;">Email:</span> ${order.customer.email}</div>` : '';
  const streetLine = order.customer.street && order.customer.street !== 'N/A' ? `${order.customer.street}, ` : '';
  const houseLine = order.customer.houseNo && order.customer.houseNo !== 'N/A' ? `${order.customer.houseNo}, ` : '';
  const buildingLine = order.customer.building && order.customer.building !== 'N/A' ? `${order.customer.building}, ` : '';
  const areaLine = order.customer.area && order.customer.area !== 'N/A' ? `${order.customer.area}, ` : '';
  const landmarkLine = order.customer.landmark && order.customer.landmark !== 'N/A' ? `(Near ${order.customer.landmark}), ` : '';
  const cityLine = order.customer.city && order.customer.city !== 'N/A' ? `${order.customer.city}, ` : '';
  const stateLine = order.customer.state && order.customer.state !== 'N/A' ? `${order.customer.state}` : '';
  const pincodeLine = order.customer.pincode && order.customer.pincode !== 'N/A' ? ` - ${order.customer.pincode}` : '';
  const countryLine = order.customer.country && order.customer.country !== 'N/A' ? `, ${order.customer.country}` : '';

  const cleanFormattedAddress = `${houseLine}${buildingLine}${streetLine}${areaLine}${landmarkLine}${cityLine}${stateLine}${pincodeLine}${countryLine}`.replace(/,\s*,/g, ',').trim() || order.customer.fullAddress;

  // Financial calculations
  const subtotalVal = Math.max(0, order.subtotal || 0);
  const shippingVal = Math.max(0, order.deliveryFee || 0);
  const couponDiscountVal = Math.max(0, order.discount || 0);
  const gstVal = Math.max(0, order.gst || 0);
  const grandTotalVal = Math.max(0, order.totalPrice || (subtotalVal + shippingVal + gstVal - couponDiscountVal));
  const paidAmountVal = isPaid ? grandTotalVal : 0;
  const balanceAmountVal = Math.max(0, grandTotalVal - paidAmountVal);

  const itemsRowsHTML = order.items.map((item, index) => {
    const unitPrice = item.price || 0;
    const qty = item.quantity || 1;
    const lineTotal = item.totalPrice || (unitPrice * qty);

    const variantStr = [
      item.variant !== 'N/A' ? `Variant: ${item.variant}` : '',
      item.size !== 'N/A' ? `Size: ${item.size}` : '',
      item.color !== 'N/A' ? `Color: ${item.color}` : '',
      item.frameType !== 'N/A' ? `Frame: ${item.frameType}` : ''
    ].filter(Boolean).join(' | ');

    return `
      <tr style="border-bottom: 1px solid #E2E8F0;">
        <td style="padding: 10px 8px; text-align: center; color: #64748B; font-size: 12px; font-weight: 600;">${index + 1}</td>
        <td style="padding: 10px 8px; width: 50px; text-align: center;">
          <img src="${item.imageUrl}" alt="${item.title}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px; border: 1px solid #E2E8F0;" onError="this.src='/logo.jpg'" />
        </td>
        <td style="padding: 10px 10px;">
          <div style="font-weight: 700; color: #0F172A; font-size: 13.5px; margin-bottom: 2px;">${item.title}</div>
          ${variantStr ? `<div style="font-size: 11px; color: #64748B; font-weight: 500;">${variantStr}</div>` : ''}
        </td>
        <td style="padding: 10px 8px; text-align: center; font-weight: 700; color: #0F172A; font-size: 13px;">${qty}</td>
        <td style="padding: 10px 8px; text-align: right; font-weight: 600; color: #334155; font-size: 13px;">${formatCurrency(unitPrice)}</td>
        <td style="padding: 10px 8px; text-align: right; font-weight: 500; color: #64748B; font-size: 13px;">₹0.00</td>
        <td style="padding: 10px 8px; text-align: right; font-weight: 500; color: #16A34A; font-size: 13px;">${couponDiscountVal > 0 && index === 0 ? `-${formatCurrency(couponDiscountVal)}` : '₹0.00'}</td>
        <td style="padding: 10px 8px; text-align: right; font-weight: 700; color: #0F172A; font-size: 13px;">${formatCurrency(unitPrice)}</td>
        <td style="padding: 10px 8px; text-align: right; font-weight: 800; color: #0F172A; font-size: 13.5px;">${formatCurrency(lineTotal)}</td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>NOORKARTS Tax Invoice - ${order.id}</title>
  <style>
    @media print {
      @page { size: A4 portrait; margin: 8mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 0; background: #FFFFFF; }
      .no-print { display: none !important; }
      .invoice-card { box-shadow: none !important; border: 1px solid #000000 !important; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      background-color: #F8FAFC;
      color: #0F172A;
      padding: 20px;
      line-height: 1.4;
    }
    .invoice-card {
      max-width: 840px;
      margin: 0 auto;
      background: #FFFFFF;
      padding: 32px;
      border-radius: 16px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.06);
      border: 1px solid #E2E8F0;
    }
    .brand-header {
      text-align: center;
      padding-bottom: 16px;
      border-bottom: 2px solid #0F172A;
      margin-bottom: 20px;
    }
    .brand-title {
      font-size: 34px;
      font-weight: 900;
      letter-spacing: 2px;
      color: #0F172A;
      text-transform: uppercase;
      margin: 0 0 4px 0;
      font-family: Arial, sans-serif;
    }
    .brand-contact {
      font-size: 13px;
      color: #475569;
      font-weight: 600;
    }
    
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: stretch;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .meta-card {
      flex: 1;
      min-width: 110px;
      background: #F8FAFC;
      border-radius: 10px;
      padding: 14px 16px;
      border: 1px solid #E2E8F0;
    }
    .meta-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748B; letter-spacing: 0.5px; margin-bottom: 2px; }
    .meta-val { font-size: 14px; font-weight: 700; color: #0F172A; }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .address-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .address-box {
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      border-radius: 10px;
      padding: 14px 16px;
    }
    .box-title { font-size: 11px; font-weight: 900; text-transform: uppercase; color: #334155; letter-spacing: 0.5px; margin-bottom: 8px; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; }
    .box-content { font-size: 12.5px; color: #1E293B; line-height: 1.5; }

    .product-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .product-table th {
      background: #0F172A;
      color: #FFFFFF;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 10px 8px;
      letter-spacing: 0.5px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 20px;
      align-items: start;
      margin-bottom: 24px;
    }
    .codes-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 14px;
      display: flex;
      gap: 14px;
      align-items: center;
    }
    .totals-card {
      background: #FFFFFF;
      border: 1.5px solid #0F172A;
      border-radius: 10px;
      padding: 14px 16px;
    }
    .t-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 13px;
      color: #475569;
      font-weight: 500;
    }
    .t-grand {
      display: flex;
      justify-content: space-between;
      padding-top: 8px;
      margin-top: 6px;
      border-top: 2px solid #0F172A;
      font-size: 16px;
      font-weight: 900;
      color: #0F172A;
    }

    .print-actions {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    .btn-print {
      background: #0F172A;
      color: #FFFFFF;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13.5px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-print:hover { background: #334155; }
    .btn-green { background: #16A34A; }
    .btn-green:hover { background: #15803D; }

    .footer-note {
      text-align: center;
      border-top: 1px solid #E2E8F0;
      padding-top: 14px;
      font-size: 12px;
      color: #64748B;
    }
  </style>
</head>
<body>

  <!-- PRINT ACTIONS -->
  <div class="print-actions no-print">
    <button class="btn-print" onclick="window.print()">🖨️ Print Full Invoice (A4)</button>
    <button class="btn-print btn-green" onclick="window.print()">📄 Save as PDF</button>
  </div>

  <div class="invoice-card">
    
    <!-- TOP CENTER BRAND HEADER -->
    <div class="brand-header">
      <div class="brand-title">NOORKARTS</div>
      <div class="brand-contact">
        Email: <strong>${supportEmail}</strong> &nbsp;|&nbsp; Phone: <strong>${supportPhone}</strong>
      </div>
    </div>

    <!-- META BAR & STATUS -->
    <div class="meta-row">
      <div class="meta-card">
        <div class="meta-label">Invoice Number</div>
        <div class="meta-val">${invoiceNumber}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Order ID</div>
        <div class="meta-val">#${order.id}</div>
      </div>
      ${validCourier ? `
        <div class="meta-card">
          <div class="meta-label">Courier</div>
          <div class="meta-val">${validCourier}</div>
        </div>
      ` : ''}
      <div class="meta-card">
        <div class="meta-label">Date & Time</div>
        <div class="meta-val">${order.formattedDate}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Payment Method</div>
        <div class="meta-val">${order.paymentMethod}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Payment Status</div>
        <div style="margin-top: 3px;">
          <span class="status-badge" style="background: ${isPaid ? '#DEF7EC' : '#FEF08A'}; color: ${isPaid ? '#03543F' : '#713F12'}; border: 1px solid ${isPaid ? '#84E1BC' : '#FDE047'};">
            ${isPaid ? 'PAID ✅' : 'PENDING'}
          </span>
        </div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Order Status</div>
        <div style="margin-top: 3px;">
          <span class="status-badge" style="background: ${statusStyle.bg}; color: ${statusStyle.color}; border: 1px solid ${statusStyle.border};">
            ${statusStyle.text}
          </span>
        </div>
      </div>
    </div>

    <!-- BILLING & SHIPPING DETAILS -->
    <div class="address-grid">
      <!-- BILLING DETAILS -->
      <div class="address-box">
        <div class="box-title">📋 Billing Details</div>
        <div class="box-content">
          <strong style="font-size: 14px; color: #0F172A;">${order.customer.name}</strong>
          <div><span style="color: #64748B;">Contact:</span> <strong>${order.customer.phone}</strong></div>
          ${billingEmailLine}
          <div style="margin-top: 6px; font-size: 11.5px; color: #64748B;">
            TXN ID: <strong style="color: #0F172A;">${order.transactionId}</strong>
          </div>
        </div>
      </div>

      <!-- SHIPPING ADDRESS -->
      <div class="address-box">
        <div class="box-title">🚚 Shipping Address</div>
        <div class="box-content">
          <strong style="font-size: 14px; color: #0F172A;">${order.customer.name}</strong>
          <div><span style="color: #64748B;">Contact:</span> <strong>${order.customer.phone}</strong></div>
          <div style="margin-top: 4px;">${cleanFormattedAddress}</div>
        </div>
      </div>
    </div>

    <!-- PRODUCT TABLE -->
    <table class="product-table">
      <thead>
        <tr>
          <th style="width: 32px; text-align: center;">#</th>
          <th style="width: 54px; text-align: center;">Item</th>
          <th style="text-align: left;">Product Details</th>
          <th style="width: 44px; text-align: center;">Qty</th>
          <th style="width: 90px; text-align: right;">Unit Price</th>
          <th style="width: 80px; text-align: right;">Offer Disc</th>
          <th style="width: 85px; text-align: right;">Coupon Disc</th>
          <th style="width: 90px; text-align: right;">Final Price</th>
          <th style="width: 100px; text-align: right;">Total Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRowsHTML}
      </tbody>
    </table>

    <!-- CODES & FINANCIAL SUMMARY -->
    <div class="summary-grid">
      <!-- AUTOMATIC CODES (QR CODE ONLY - NO BORDER CONTAINER) -->
      <div class="codes-card">
        <img src="${qrUrl}" alt="QR Code" width="95" height="95" style="display: block; flex-shrink: 0;" />
        <div style="flex: 1; text-align: center;">
          <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748B; margin-bottom: 2px;">Print-Ready Code 39 Barcode</div>
          ${barcodeSVG}
          <div style="font-size: 10px; color: #94A3B8; margin-top: 2px;">Order Verification Scanner</div>
        </div>
      </div>

      <!-- ORDER SUMMARY TOTALS -->
      <div class="totals-card">
        <div class="t-row">
          <span>Subtotal</span>
          <span>${formatCurrency(subtotalVal)}</span>
        </div>
        ${couponDiscountVal > 0 ? `
          <div class="t-row" style="color: #16A34A;">
            <span>Coupon Discount</span>
            <span>-${formatCurrency(couponDiscountVal)}</span>
          </div>
        ` : ''}
        <div class="t-row">
          <span>Shipping Charge</span>
          <span>${shippingVal === 0 ? 'FREE' : formatCurrency(shippingVal)}</span>
        </div>
        ${gstVal > 0 ? `
          <div class="t-row">
            <span>GST / Tax</span>
            <span>${formatCurrency(gstVal)}</span>
          </div>
        ` : ''}
        <div class="t-grand">
          <span>Grand Total</span>
          <span>${formatCurrency(grandTotalVal)}</span>
        </div>
        <div class="t-row" style="margin-top: 6px; font-weight: 700; color: #16A34A;">
          <span>Paid Amount</span>
          <span>${formatCurrency(paidAmountVal)}</span>
        </div>
        <div class="t-row" style="font-weight: 700; color: ${balanceAmountVal > 0 ? '#DC2626' : '#64748B'};">
          <span>Balance Amount</span>
          <span>${formatCurrency(balanceAmountVal)}</span>
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="footer-note">
      <p style="font-weight: 800; color: #0F172A; font-size: 13px; margin-bottom: 2px;">Thank you for shopping with NOORKARTS!</p>
      <p>Customer Support: <strong>${supportEmail}</strong> | Mobile: <strong>${supportPhone}</strong></p>
      <p style="font-size: 10.5px; color: #94A3B8; margin-top: 6px;">This is an automated computer-generated tax invoice and requires no physical signature.</p>
    </div>

  </div>

</body>
</html>
  `;
};

/**
 * Generates Premium NOORKARTS A6 Print-Ready Shipping Label HTML.
 */
export const generateShippingLabelHTML = (rawOrder, storeSettings = {}) => {
  const order = sanitizeOrder(rawOrder);
  const supportEmail = 'noorkarts.in@gmail.com';
  const supportPhone = '+91 89253 25330';
  const isCOD = order.paymentMethod.toUpperCase().includes('COD');
  const trackingNo = order.trackingNumber && order.trackingNumber !== 'N/A' ? order.trackingNumber : `TRK-${order.id}`;
  const validCourier = order.courier && typeof order.courier === 'string' && order.courier !== 'N/A' && order.courier !== 'undefined' && order.courier !== 'null' ? order.courier.trim() : '';

  const qrDataText = `ShipTo:${order.customer.name}|Contact:${order.customer.phone}|OrderID:${order.id}|Address:${order.customer.fullAddress}|Tracking:${trackingNo}`;
  const qrUrl = getQRCodeURL(qrDataText);
  const barcodeSVG = generateBarcodeSVG(order.id);

  // Address lines sanitation (No '#' symbol before address)
  const houseLine = order.customer.houseNo && order.customer.houseNo !== 'N/A' ? `${order.customer.houseNo}, ` : '';
  const buildingLine = order.customer.building && order.customer.building !== 'N/A' ? `${order.customer.building}, ` : '';
  const streetLine = order.customer.street && order.customer.street !== 'N/A' ? `${order.customer.street}, ` : '';
  const areaLine = order.customer.area && order.customer.area !== 'N/A' ? `${order.customer.area}, ` : '';
  const landmarkLine = order.customer.landmark && order.customer.landmark !== 'N/A' ? `(Near ${order.customer.landmark}), ` : '';
  const cityLine = order.customer.city && order.customer.city !== 'N/A' ? `${order.customer.city}, ` : '';
  const stateLine = order.customer.state && order.customer.state !== 'N/A' ? `${order.customer.state}` : '';
  const pincodeLine = order.customer.pincode && order.customer.pincode !== 'N/A' ? ` - ${order.customer.pincode}` : '';

  const cleanAddress = `${houseLine}${buildingLine}${streetLine}${areaLine}${landmarkLine}${cityLine}${stateLine}${pincodeLine}`.replace(/,\s*,/g, ',').trim() || order.customer.fullAddress;

  const contentsLines = order.items.map(i => `• ${i.title} (x${i.quantity})`).join('<br />');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>NOORKARTS Shipping Label - ${order.id}</title>
  <style>
    @media print {
      @page { size: A6 portrait; margin: 3mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 0; background: #FFFFFF; }
      .no-print { display: none !important; }
      .label-card { border: 2.5px solid #000000 !important; box-shadow: none !important; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
      background: #F1F5F9;
      padding: 16px;
      color: #000000;
    }
    .label-card {
      width: 100%;
      max-width: 390px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 3px solid #000000;
      padding: 12px;
      border-radius: 8px;
    }
    .brand-top {
      text-align: center;
      border-bottom: 2.5px solid #000000;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .brand-name {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
      font-family: Arial, sans-serif;
    }
    .brand-sub { font-size: 10.5px; font-weight: 700; color: #333333; }

    .badge-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #000000;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .payment-badge-paid {
      background: #000000;
      color: #FFFFFF;
      font-size: 14px;
      font-weight: 900;
      padding: 4px 10px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .payment-badge-cod {
      background: #DC2626;
      color: #FFFFFF;
      font-size: 14px;
      font-weight: 900;
      padding: 4px 10px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .ship-box {
      border: 2px solid #000000;
      padding: 10px;
      border-radius: 6px;
      margin-bottom: 8px;
      background: #FAF9F6;
    }
    .ship-title { font-size: 10px; font-weight: 900; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 4px; }
    .recip-name { font-size: 17px; font-weight: 900; text-transform: uppercase; line-height: 1.2; margin-bottom: 2px; }
    .recip-phone { font-size: 15px; font-weight: 900; margin-bottom: 4px; }
    .recip-addr { font-size: 12.5px; font-weight: 700; line-height: 1.35; color: #000; }
    .pin-badge { font-size: 18px; font-weight: 900; background: #000; color: #FFF; display: inline-block; padding: 2px 8px; border-radius: 4px; margin-top: 4px; }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      font-size: 10.5px;
      font-weight: 800;
      margin-bottom: 8px;
      border: 1px solid #000;
      padding: 6px;
      border-radius: 4px;
    }

    .contents-box {
      border: 1px solid #000000;
      padding: 6px 8px;
      font-size: 10.5px;
      font-weight: 700;
      margin-bottom: 8px;
      border-radius: 4px;
    }

    .codes-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 2px solid #000000;
      padding-top: 6px;
    }

    .print-actions { text-align: center; margin-bottom: 12px; }
    .btn-action { background: #000; color: #FFF; border: none; padding: 8px 18px; font-weight: bold; border-radius: 4px; cursor: pointer; }
  </style>
</head>
<body>

  <div class="print-actions no-print">
    <button class="btn-action" onclick="window.print()">🖨️ Print A6 Shipping Label</button>
  </div>

  <div class="label-card">
    
    <!-- BRAND TOP -->
    <div class="brand-top">
      <div class="brand-name">NOORKARTS</div>
      <div class="brand-sub">Email: ${supportEmail} | Phone: ${supportPhone}</div>
    </div>

    <!-- BADGE ROW -->
    <div class="badge-row">
      <div>
        <div style="font-size: 9px; font-weight: 900; text-transform: uppercase;">Order ID</div>
        <div style="font-size: 15px; font-weight: 900;">#${order.id}</div>
      </div>
      <div class="${isCOD ? 'payment-badge-cod' : 'payment-badge-paid'}">
        ${isCOD ? `COD: ${formatCurrency(order.totalPrice)}` : 'PREPAID - PAID ✅'}
      </div>
    </div>

    <!-- RECIPIENT / SHIP TO -->
    <div class="ship-box">
      <div class="ship-title">DELIVER TO (RECIPIENT):</div>
      <div class="recip-name">${order.customer.name}</div>
      <div class="recip-phone">Contact: ${order.customer.phone}</div>
      <div class="recip-addr">${cleanAddress}</div>
      <div><span class="pin-badge">PIN: ${order.customer.pincode}</span></div>
    </div>

    <!-- SHIPPING INFO -->
    <div class="info-grid">
      <div>COURIER: <strong>${validCourier || ''}</strong></div>
      <div>TRACKING #: <strong>${trackingNo}</strong></div>
    </div>

    <!-- CONTENTS -->
    <div class="contents-box">
      <strong style="text-transform: uppercase;">Ordered Items (${order.items.length}):</strong><br />
      ${contentsLines}
    </div>

    <!-- BARCODE & QR CODE (QR CODE ONLY - NO BORDER CONTAINER) -->
    <div class="codes-footer">
      <div style="width: 65%;">
        ${barcodeSVG}
      </div>
      <img src="${qrUrl}" alt="QR Code" width="70" height="70" style="display: block;" />
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
  const win = window.open('', '_blank', 'width=920,height=1000');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
};

/**
 * Opens browser print window for Shipping Label.
 */
export const printShippingLabel = (order, storeSettings = {}) => {
  const html = generateShippingLabelHTML(order, storeSettings);
  const win = window.open('', '_blank', 'width=620,height=850');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
};
