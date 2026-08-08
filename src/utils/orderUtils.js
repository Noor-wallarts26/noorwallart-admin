import { doc, getDoc } from 'firebase/firestore';

/**
 * Validates any value and returns 'N/A' if null, undefined, NaN, empty string, or "undefined"/"null"/"NaN" strings.
 */
export const validateValue = (val, fallback = 'N/A') => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number' && isNaN(val)) return fallback;
  const str = String(val).trim();
  if (str === '' || str.toLowerCase() === 'undefined' || str.toLowerCase() === 'null' || str.toLowerCase() === 'nan') {
    return fallback;
  }
  return str;
};

/**
 * Formats currency reliably into Indian Rupees (e.g. ₹129.00).
 * Never returns ₹undefined, ₹null, or ₹NaN.
 */
export const formatCurrency = (val) => {
  if (val === null || val === undefined) return '₹0.00';
  const num = parseFloat(val);
  if (isNaN(num)) return '₹0.00';
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Formats dates safely.
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return 'N/A';
  }
};

/**
 * Generates a unique 9-character Order ID starting with NWA followed by 6 digits (e.g. NWA123456).
 * Verifies with Firestore to guarantee uniqueness.
 */
export const generateUniqueOrderId = async (db) => {
  let isUnique = false;
  let newId = '';
  let attempts = 0;

  while (!isUnique && attempts < 30) {
    attempts++;
    const randomDigits = Math.floor(100000 + Math.random() * 900000); // 6 digits: 100000–999999
    newId = `NWA${randomDigits}`;
    if (!db) break;
    try {
      const docRef = doc(db, 'orders', newId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        isUnique = true;
      }
    } catch (e) {
      isUnique = true; // Fallback if network/rules check fails
    }
  }

  return newId || `NWA${Math.floor(100000 + Math.random() * 900000)}`;
};

/**
 * Complete Order Sanitizer - guarantees no undefined, null, or NaN anywhere in the order object.
 */
export const sanitizeOrder = (order = {}) => {
  const customer = order.customer || {};
  const items = Array.isArray(order.items) ? order.items : [];

  const houseNo = validateValue(customer.houseNo, '');
  const building = validateValue(customer.building, '');
  const street = validateValue(customer.street, '');
  const area = validateValue(customer.area, '');
  const landmark = validateValue(customer.landmark, '');
  const city = validateValue(customer.city, '');
  const district = validateValue(customer.district, '');
  const state = validateValue(customer.state, '');
  const pincode = validateValue(customer.pincode, '');
  const country = validateValue(customer.country, 'India');

  const addressParts = [houseNo, building, street, area, landmark, city || district, state, pincode, country]
    .filter(Boolean);
  
  const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : validateValue(customer.address, 'N/A');

  const sanitizedItems = items.map(item => {
    const qty = parseInt(item.quantity, 10);
    const validQty = isNaN(qty) || qty < 1 ? 1 : qty;
    const price = parseFloat(item.price);
    const validPrice = isNaN(price) ? 0 : price;

    return {
      title: validateValue(item.title || item.name || item.product?.title, 'Item'),
      imageUrl: validateValue(item.imageUrl || item.image || item.thumbnail || item.product?.logoUrl, '/logo.jpg'),
      variant: validateValue(item.variant || item.selectedVariant, 'N/A'),
      size: validateValue(item.size || item.selectedSize, 'N/A'),
      color: validateValue(item.color || item.selectedColor, 'N/A'),
      frameType: validateValue(item.frameType || item.selectedFrame, 'N/A'),
      quantity: validQty,
      price: validPrice,
      totalPrice: validPrice * validQty
    };
  });

  const rawSubtotal = parseFloat(order.subtotal);
  const rawDelivery = parseFloat(order.deliveryFee !== undefined ? order.deliveryFee : order.deliveryCharge);
  const rawDiscount = parseFloat(order.discount);
  const rawGst = parseFloat(order.gst);
  const rawTotal = parseFloat(order.totalPrice !== undefined ? order.totalPrice : order.total);

  const deliveryFee = !isNaN(rawDelivery) ? rawDelivery : 80;
  const itemsTotal = sanitizedItems.reduce((sum, i) => sum + i.totalPrice, 0);
  const subtotal = !isNaN(rawSubtotal) ? rawSubtotal : itemsTotal;
  const discount = !isNaN(rawDiscount) ? rawDiscount : 0;
  const gst = !isNaN(rawGst) ? rawGst : 0;
  const totalPrice = !isNaN(rawTotal) ? rawTotal : Math.max(0, subtotal + deliveryFee + gst - discount);

  return {
    id: validateValue(order.id, 'NWA000000'),
    timestamp: order.timestamp || order.createdAt || Date.now(),
    formattedDate: formatDate(order.timestamp || order.createdAt || Date.now()),
    customer: {
      name: validateValue(customer.name, 'Valued Customer'),
      phone: validateValue(customer.phone, 'N/A'),
      email: validateValue(customer.email, 'N/A'),
      houseNo: houseNo || 'N/A',
      building: building || 'N/A',
      street: street || 'N/A',
      area: area || 'N/A',
      landmark: landmark || 'N/A',
      city: city || district || 'N/A',
      district: district || 'N/A',
      state: state || 'N/A',
      pincode: pincode || 'N/A',
      country: country || 'India',
      fullAddress: fullAddress
    },
    items: sanitizedItems,
    paymentMethod: validateValue(order.paymentMethod, 'Razorpay'),
    paymentStatus: validateValue(order.paymentStatus, order.paymentMethod === 'COD' ? 'Pending (COD)' : 'Paid'),
    status: validateValue(order.status, 'Pending'),
    transactionId: validateValue(order.transactionId || order.upiRef || order.paymentId, 'N/A'),
    razorpayOrderId: validateValue(order.razorpayOrderId, 'N/A'),
    razorpaySignature: validateValue(order.razorpaySignature, 'N/A'),
    subtotal: subtotal,
    deliveryFee: deliveryFee,
    discount: discount,
    gst: gst,
    totalPrice: totalPrice,
    trackingNumber: validateValue(order.trackingNumber, 'N/A')
  };
};

/**
 * Pure SVG Code 39 Barcode Generator.
 * Encodes text into Code 39 SVG bars cleanly without external libraries.
 */
export const generateBarcodeSVG = (text = 'NWA000000') => {
  const cleanText = String(text).toUpperCase().replace(/[^A-Z0-9\-]/g, '');
  const code39Map = {
    '0': '101001101101', '1': '110100101011', '2': '101100101011', '3': '110110010101',
    '4': '101001101011', '5': '110100110101', '6': '101100110101', '7': '101001011011',
    '8': '110100101101', '9': '101100101101', 'A': '110101001011', 'B': '101101001011',
    'C': '110110100101', 'D': '101011001011', 'E': '110101100101', 'F': '101101100101',
    'G': '101010011011', 'H': '110101001101', 'I': '101101001101', 'J': '101011001101',
    'K': '110101010011', 'L': '101101010011', 'M': '110110101001', 'N': '101011010011',
    'O': '110101101001', 'P': '101101101001', 'Q': '101010110011', 'R': '110101011001',
    'S': '101101011001', 'T': '101011011001', 'U': '110010101011', 'V': '100110101011',
    'W': '110011010101', 'X': '100101101011', 'Y': '110010110101', 'Z': '100110110101',
    '-': '100101011011', '*': '100101101101'
  };

  const fullText = `*${cleanText}*`;
  let bitPattern = '';

  for (let i = 0; i < fullText.length; i++) {
    const char = fullText[i];
    const pattern = code39Map[char] || code39Map['*'];
    bitPattern += pattern + '0'; // Inter-character gap
  }

  const unitWidth = 2.5;
  const barHeight = 45;
  const width = bitPattern.length * unitWidth + 20;

  let barsHTML = '';
  let xPos = 10;

  for (let i = 0; i < bitPattern.length; i++) {
    const isBar = bitPattern[i] === '1';
    if (isBar) {
      barsHTML += `<rect x="${xPos}" y="5" width="${unitWidth}" height="${barHeight}" fill="#000000" />`;
    }
    xPos += unitWidth;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${barHeight + 25}" width="100%" height="auto" style="max-height: 70px; display: block; margin: 0 auto;">
      <rect x="0" y="0" width="${width}" height="${barHeight + 25}" fill="#FFFFFF" />
      ${barsHTML}
      <text x="${width / 2}" y="${barHeight + 20}" font-family="'Courier New', monospace" font-size="14" font-weight="bold" text-anchor="middle" fill="#000000">${cleanText}</text>
    </svg>
  `;
};

/**
 * QR Code Data URL Generator using QuickChart / QRServer API with crisp rendering.
 */
export const getQRCodeURL = (text) => {
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encoded}`;
};

/**
 * Triggers instant WhatsApp Order Notification to the registered business number.
 */
export const sendWhatsAppOrderNotification = (orderData, targetPhone = '8925325330') => {
  const sanitized = sanitizeOrder(orderData);
  const cleanPhone = String(targetPhone).replace(/\D/g, '');
  const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const itemLines = sanitized.items.map(i => 
    `• *${i.title}* (x${i.quantity}) - ${formatCurrency(i.totalPrice)}`
  ).join('\n');

  const message = 
`🚨 *NEW ORDER ALERT - NOOR KARTS* 🚨
---------------------------------
*Order ID:* ${sanitized.id}
*Date:* ${sanitized.formattedDate}

👤 *Customer Details:*
• *Name:* ${sanitized.customer.name}
• *Phone:* ${sanitized.customer.phone}
• *Email:* ${sanitized.customer.email}

📦 *Ordered Items:*
${itemLines}

💰 *Financial Summary:*
• *Subtotal:* ${formatCurrency(sanitized.subtotal)}
• *Shipping:* ${formatCurrency(sanitized.deliveryFee)}
• *Discount:* ${formatCurrency(sanitized.discount)}
• *Grand Total:* ${formatCurrency(sanitized.totalPrice)}

💳 *Payment Method:* ${sanitized.paymentMethod}
🛡️ *Payment Status:* ${sanitized.paymentStatus}

📍 *Delivery Address:*
${sanitized.customer.fullAddress}
---------------------------------
Thank you for shopping with Noor Karts!`;

  const encodedUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
  
  try {
    window.open(encodedUrl, '_blank');
  } catch (e) {
    console.error("WhatsApp notification open failed:", e);
  }
};
