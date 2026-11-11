/**
 * WHIZ STUDIO — OFFICIAL CORPORATE PDF INVOICE ENGINE
 * "High-End Corporate Designer Stationery & Precision Vector A4 Layout"
 *
 * Architecture & Design Blueprint:
 * 1. Color Palette: Extracted from official brand logo — Deep Teal / Green (#087F70), Rich Gold (#C69A40), Dark Charcoal (#172B36)
 * 2. Header Section: Crisp official logo top-left; modern bold 'INVOICE' top-right underlined with subtle Gold accent bar
 * 3. Grid Structure: Clean 2-column grid — 'Billed To' (Client CIF details) on left, 'Invoice Details' (No, Date, Status, Currency) on right
 * 4. Background Watermark: Horizontally and vertically centered watermark of official logo set to 5% opacity (opacity: 0.05)
 * 5. Premium Table Styling: Solid Teal/Deep Green (#087F70) header row with crisp white text; subtle light-gray borders (#E2E8F0); spacious padding (12px feel, 32 pt row height)
 * 6. Distinct Totals Block: Lightly tinted Teal rounded container (#EBF5F3) at bottom right wrapping Subtotal, Amount Received, and Grand Total
 * 7. Footer: 'Payment Method' details neatly at bottom left; signature-free disclaimer text centered; solid thin dual-tone accent bar across very bottom
 * 8. Zero-Storage Engine: Compiles entirely client-side in browser memory via pdf-lib (zero backend or Cloudflare R2 storage)
 */

(function (global) {
  'use strict';

  let cachedLogoBytes = null;

  async function getLogoBytes() {
    if (cachedLogoBytes) return cachedLogoBytes;
    try {
      if (typeof window !== 'undefined' && window.location) {
        const candidates = [
          '/assets/images/whiz-logo-v2.png?v=202611',
          '/whiz-logo-v2.png?v=202611',
          '/assets/images/logo.png?v=20261109_canon',
          '/logo.png?v=20261109_canon'
        ];
        for (const url of candidates) {
          try {
            const res = await fetch(url);
            if (res.ok) {
              cachedLogoBytes = await res.arrayBuffer();
              return cachedLogoBytes;
            }
          } catch (_) {}
        }
      }
      if (typeof process !== 'undefined') {
        try {
          const fs = await import('fs');
          const paths = [
            'G:/Whiz Studio/assets/images/whiz-logo-v2.png?v=202611',
            'G:/Whiz Studio/public/assets/images/whiz-logo-v2.png?v=202611',
            'G:/Whiz Studio/whiz-logo-v2.png?v=202611',
            'G:/Whiz Studio/public/whiz-logo-v2.png?v=202611',
            'G:/Whiz Studio/assets/images/logo.png'
          ];
          for (const p of paths) {
            if (fs.existsSync(p)) {
              cachedLogoBytes = fs.readFileSync(p);
              return cachedLogoBytes;
            }
          }
        } catch (_) {}
      }
    } catch (e) {
      console.warn('Could not load logo image for PDF:', e);
    }
    return null;
  }

  function formatMoney(amountCents, currency) {
    const curr = (currency || 'USD').toUpperCase();
    const num = Number(amountCents || 0);
    const dollars = num / 100;
    let symbol = '$';
    if (curr === 'BDT') symbol = 'BDT ';
    else if (curr === 'EUR') symbol = '€';
    else if (curr === 'GBP') symbol = '£';
    else if (curr === 'AED') symbol = 'AED ';
    else if (curr === 'SAR') symbol = 'SAR ';
    else if (curr === 'CAD') symbol = 'CA$';
    else if (curr === 'AUD') symbol = 'A$';
    else if (curr === 'SGD') symbol = 'S$';
    else if (curr === 'INR') symbol = '₹';
    return symbol + dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatInvoiceDate(val) {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }

  function wrapText(text, maxChars) {
    if (!text) return [];
    const words = String(text).replace(/\r?\n/g, ' ').split(/\s+/);
    const lines = [];
    let currentLine = '';
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (!word) continue;
      const testLine = currentLine ? currentLine + ' ' + word : word;
      if (testLine.length <= maxChars) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  function createRoundedRectPath(x, y, w, h, r) {
    return `M ${x + r} ${y} ` +
           `L ${x + w - r} ${y} ` +
           `Q ${x + w} ${y} ${x + w} ${y + r} ` +
           `L ${x + w} ${y + h - r} ` +
           `Q ${x + w} ${y + h} ${x + w - r} ${y + h} ` +
           `L ${x + r} ${y + h} ` +
           `Q ${x} ${y + h} ${x} ${y + h - r} ` +
           `L ${x} ${y + r} ` +
           `Q ${x} ${y} ${x + r} ${y} Z`;
  }

  async function compileWhizDocumentPdf(docData, options = {}) {
    let PDFLib = global.PDFLib || (typeof globalThis !== 'undefined' ? globalThis.PDFLib : null);
    if (!PDFLib && typeof require !== 'undefined') {
      try {
        PDFLib = require('pdf-lib');
      } catch (_) {
        try {
          PDFLib = require('G:/whiz-platform/node_modules/pdf-lib');
        } catch (_) {}
      }
    }
    if (!PDFLib) {
      throw new Error('PDFLib engine is not loaded. Please ensure pdf-lib is included on the page.');
    }

    const { PDFDocument, rgb, StandardFonts } = PDFLib;
    const pdfDoc = await PDFDocument.create();

    // Standard A4: 210 x 297 mm = 595.28 x 841.89 points
    const A4_WIDTH = 595.28;
    const A4_HEIGHT = 841.89;
    const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    const { width, height } = page.getSize();

    const marginX = 40;
    const contentWidth = width - (marginX * 2); // 515.28 pt
    const rightAlignX = width - marginX;        // 555.28 pt

    // Typography
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // Exact Brand Palette
    const cTeal = rgb(8 / 255, 127 / 255, 112 / 255);        // #087F70 (Deep Teal / Green Primary)
    const cGold = rgb(198 / 255, 154 / 255, 64 / 255);        // #C69A40 (Rich Brand Gold Accent)
    const cCharcoal = rgb(23 / 255, 43 / 255, 54 / 255);      // #172B36 (Dark Slate / Charcoal Text)
    const cLabelMuted = rgb(100 / 255, 116 / 255, 139 / 255); // #64748B (Subtle Gray Labels)
    const cTextMuted = rgb(71 / 255, 85 / 255, 105 / 255);    // #475569 (Secondary Text)
    const cBorder = rgb(226 / 255, 232 / 255, 240 / 255);     // #E2E8F0 (Subtle Border Gray)
    const cRowAlt = rgb(248 / 255, 250 / 255, 252 / 255);     // #F8FAFC (Subtle Alternating Row)
    const cTintedBox = rgb(235 / 255, 245 / 255, 243 / 255);  // #EBF5F3 (Lightly Tinted Teal Box)
    const cWhite = rgb(1, 1, 1);

    // 1. Page Background
    page.drawRectangle({ x: 0, y: 0, width, height, color: cWhite });

    // 2. Background Watermark: Horizontally and vertically centered at 5% opacity (opacity: 0.05)
    const logoBytes = await getLogoBytes();
    let logoImg = null;
    let logoH = 36;
    const targetLogoWidth = 120;

    if (logoBytes) {
      try {
        logoImg = await pdfDoc.embedPng(logoBytes);
        const aspect = logoImg.height / logoImg.width;
        logoH = targetLogoWidth * aspect;

        // Large, centered watermark at strictly 5% opacity
        const wmW = 340;
        const wmH = wmW * aspect;
        const wmX = (width - wmW) / 2;
        const wmY = (height - wmH) / 2;
        page.drawImage(logoImg, {
          x: wmX,
          y: wmY,
          width: wmW,
          height: wmH,
          opacity: 0.05
        });
      } catch (err) {
        console.warn('Could not embed PNG watermark into PDF:', err);
      }
    }

    // 3. Header Section: Logo top-left, 'INVOICE' top-right with subtle Gold accent line
    const headerTopY = height - 42;

    if (logoImg) {
      page.drawImage(logoImg, {
        x: marginX,
        y: headerTopY - logoH,
        width: targetLogoWidth,
        height: logoH
      });
    } else {
      page.drawText('WHIZ STUDIO', {
        x: marginX,
        y: headerTopY - 24,
        size: 22,
        font: fontBold,
        color: cTeal
      });
      logoH = 26;
    }

    // Top Right: 'INVOICE' in large modern sans-serif
    const titleText = 'INVOICE';
    const titleSize = 28;
    const titleW = fontBold.widthOfTextAtSize(titleText, titleSize);
    const titleX = rightAlignX - titleW;
    const titleY = headerTopY - 24;

    page.drawText(titleText, {
      x: titleX,
      y: titleY,
      size: titleSize,
      font: fontBold,
      color: cCharcoal
    });

    // Subtle Gold accent line under 'INVOICE'
    const goldLineY = titleY - 7;
    page.drawLine({
      start: { x: titleX - 8, y: goldLineY },
      end: { x: rightAlignX, y: goldLineY },
      thickness: 2.5,
      color: cGold
    });

    // Subtle horizontal divider separating header from grid
    const headerDividerY = headerTopY - Math.max(logoH, 38) - 14;
    page.drawLine({
      start: { x: marginX, y: headerDividerY },
      end: { x: rightAlignX, y: headerDividerY },
      thickness: 0.8,
      color: cBorder
    });

    // 4. Grid Structure: Clean 2-Column Grid (Billed To on Left, Invoice Details on Right)
    const gridTopY = headerDividerY - 18;
    const colWidth = (contentWidth - 24) / 2;
    const leftColX = marginX;
    const rightColX = marginX + colWidth + 24;

    // Left Side: 'Billed To' (Client CIF details)
    page.drawText('BILLED TO', {
      x: leftColX,
      y: gridTopY,
      size: 8.5,
      font: fontBold,
      color: cLabelMuted
    });

    const client = docData.client || {};
    const clientName = client.fullName || client.billingName || docData.clientName || 'Valued Client';
    const companyName = client.companyName || '';
    const clientAddr = client.billingAddress || client.address || docData.clientAddress || 'Dhaka, Bangladesh';
    const clientContact = [client.phone, client.email].filter(Boolean).join('  •  ') || 'info@client.com';

    let curLeftY = gridTopY - 15;
    page.drawText(clientName, {
      x: leftColX,
      y: curLeftY,
      size: 11,
      font: fontBold,
      color: cCharcoal
    });
    curLeftY -= 13;

    if (companyName && companyName.toLowerCase() !== clientName.toLowerCase()) {
      page.drawText(companyName, {
        x: leftColX,
        y: curLeftY,
        size: 9.5,
        font: fontBold,
        color: cTeal
      });
      curLeftY -= 12;
    }

    const addrLines = wrapText(clientAddr, 38);
    addrLines.forEach(l => {
      page.drawText(l, {
        x: leftColX,
        y: curLeftY,
        size: 8.5,
        font: fontRegular,
        color: cTextMuted
      });
      curLeftY -= 11;
    });

    page.drawText(clientContact, {
      x: leftColX,
      y: curLeftY,
      size: 8.5,
      font: fontRegular,
      color: cTextMuted
    });
    curLeftY -= 11;

    // Right Side: 'Invoice Details'
    page.drawText('INVOICE DETAILS', {
      x: rightColX,
      y: gridTopY,
      size: 8.5,
      font: fontBold,
      color: cLabelMuted
    });

    const curr = (docData.currency || 'USD').toUpperCase();
    const docNumber = docData.invoiceNumber || docData.receiptNumber || 'INV-202611-0042';
    const rawDate = docData.paymentDate || docData.issueDate || '2026-11-08';
    const formattedDate = formatInvoiceDate(rawDate) || rawDate;
    const rawStatus = (docData.status || 'PAID').toUpperCase().replace(/_/g, ' ');
    const isPaid = rawStatus === 'PAID' || rawStatus === 'CONFIRMED' || rawStatus === 'PAID IN FULL';
    const statusLabel = isPaid ? 'PAID' : (rawStatus.includes('PARTIAL') ? 'PARTIALLY PAID' : 'PAYMENT DUE');

    let curRightY = gridTopY - 15;
    const metaLabelWidth = 95;

    function drawDetailLine(label, value, isBoldVal = true, valColor = cCharcoal) {
      page.drawText(label, {
        x: rightColX,
        y: curRightY,
        size: 9,
        font: fontRegular,
        color: cLabelMuted
      });
      page.drawText(value, {
        x: rightColX + metaLabelWidth,
        y: curRightY,
        size: 9,
        font: isBoldVal ? fontBold : fontRegular,
        color: valColor
      });
      curRightY -= 13;
    }

    drawDetailLine('Invoice No:', docNumber, true, cCharcoal);
    drawDetailLine('Invoice Date:', formattedDate, true, cCharcoal);
    drawDetailLine('Payment Date:', formattedDate, true, cCharcoal);
    drawDetailLine('Status:', statusLabel, true, isPaid ? cTeal : cGold);
    drawDetailLine('Currency:', curr, true, cCharcoal);

    // 5. Premium Table Styling: Solid Teal/Deep Green Header Row with White Text, Light-Gray Borders, Spacious Padding
    const tableTopY = Math.min(curLeftY, curRightY) - 18;
    const thHeight = 28;
    const rowHeight = 32; // Adequate padding (12px feel)
    const items = (docData.items && docData.items.length > 0) ? docData.items : [{
      description: docData.serviceProvided || docData.serviceName || 'Full-Service Digital Retainer',
      quantity: 1,
      unitPriceCents: docData.amountPaidCents || docData.totalCents || 0,
      totalCents: docData.amountPaidCents || docData.totalCents || 0
    }];

    const tableH = thHeight + (items.length * rowHeight);

    // Solid Teal/Deep Green Header Row
    page.drawRectangle({
      x: marginX,
      y: tableTopY - thHeight,
      width: contentWidth,
      height: thHeight,
      color: cTeal
    });

    // Table Column Coordinates
    const colDescX = marginX + 14;
    const colQtyX = marginX + 270;
    const colPriceX = marginX + 375;
    const colTotalX = rightAlignX - 14;

    const thTextY = tableTopY - 18;
    page.drawText('ITEM DESCRIPTION', {
      x: colDescX,
      y: thTextY,
      size: 9,
      font: fontBold,
      color: cWhite
    });

    const qtyHeadW = fontBold.widthOfTextAtSize('QTY', 9);
    page.drawText('QTY', {
      x: colQtyX - (qtyHeadW / 2),
      y: thTextY,
      size: 9,
      font: fontBold,
      color: cWhite
    });

    const priceHeadW = fontBold.widthOfTextAtSize('UNIT PRICE', 9);
    page.drawText('UNIT PRICE', {
      x: colPriceX - priceHeadW,
      y: thTextY,
      size: 9,
      font: fontBold,
      color: cWhite
    });

    const totalHeadW = fontBold.widthOfTextAtSize('TOTAL AMOUNT', 9);
    page.drawText('TOTAL AMOUNT', {
      x: colTotalX - totalHeadW,
      y: thTextY,
      size: 9,
      font: fontBold,
      color: cWhite
    });

    // Table Body Rows with Subtle Light-Gray Borders
    let curRowY = tableTopY - thHeight;
    items.forEach((item, idx) => {
      // Subtle alternating tint
      if (idx % 2 === 1) {
        page.drawRectangle({
          x: marginX,
          y: curRowY - rowHeight,
          width: contentWidth,
          height: rowHeight,
          color: cRowAlt
        });
      }

      // Row bottom border
      page.drawLine({
        start: { x: marginX, y: curRowY - rowHeight },
        end: { x: rightAlignX, y: curRowY - rowHeight },
        thickness: 0.8,
        color: cBorder
      });

      const itemDesc = item.description || 'Digital Retainer';
      const qty = String(item.quantity || 1);
      const unitCents = item.unitPriceCents ?? item.unit_price_cents ?? (item.unitPrice ? Math.round(item.unitPrice * 100) : 0);
      const lineTotalCents = item.totalCents ?? item.total_cents ?? (item.amount ? Math.round(item.amount * 100) : (unitCents * (item.quantity || 1)));

      const rowTextY = curRowY - (rowHeight / 2) - 3.5;

      page.drawText(itemDesc, {
        x: colDescX,
        y: rowTextY,
        size: 9.5,
        font: fontBold,
        color: cCharcoal
      });

      const qtyW = fontRegular.widthOfTextAtSize(qty, 9);
      page.drawText(qty, {
        x: colQtyX - (qtyW / 2),
        y: rowTextY,
        size: 9,
        font: fontRegular,
        color: cCharcoal
      });

      const priceStr = formatMoney(unitCents, curr);
      const priceW = fontRegular.widthOfTextAtSize(priceStr, 9);
      page.drawText(priceStr, {
        x: colPriceX - priceW,
        y: rowTextY,
        size: 9,
        font: fontRegular,
        color: cCharcoal
      });

      const totalStr = formatMoney(lineTotalCents, curr);
      const totalW = fontBold.widthOfTextAtSize(totalStr, 9.5);
      page.drawText(totalStr, {
        x: colTotalX - totalW,
        y: rowTextY,
        size: 9.5,
        font: fontBold,
        color: cCharcoal
      });

      curRowY -= rowHeight;
    });

    // Outer border around table
    page.drawRectangle({
      x: marginX,
      y: tableTopY - tableH,
      width: contentWidth,
      height: tableH,
      borderColor: cBorder,
      borderWidth: 1
    });

    // 6. Totals Block: Wrapped in a visually distinct, lightly tinted Teal/Gold rounded box at bottom right
    const subtotalCents = docData.subtotalCents ?? docData.subtotal_cents ?? (docData.subtotal ? Math.round(docData.subtotal * 100) : items.reduce((s, i) => s + (i.totalCents || 0), 0));
    const amountReceivedCents = docData.amountPaidCents ?? docData.amount_cents ?? (docData.amountPaid ? Math.round(docData.amountPaid * 100) : subtotalCents);
    const grandTotalCents = docData.totalInvoiceAmountCents ?? docData.totalCents ?? subtotalCents;

    const totalsBoxW = 210;
    const totalsBoxH = 82;
    const totalsBoxX = rightAlignX - totalsBoxW;
    const totalsBoxY = curRowY - 16 - totalsBoxH;
    const totalsBoxRadius = 8;

    const totalsBoxPath = createRoundedRectPath(totalsBoxX, totalsBoxY, totalsBoxW, totalsBoxH, totalsBoxRadius);
    page.drawSvgPath(totalsBoxPath, {
      color: cTintedBox,
      borderColor: cTeal,
      borderWidth: 1.2
    });

    // Inside Totals Box
    const boxInnerPadX = 14;
    const boxLabelX = totalsBoxX + boxInnerPadX;
    const boxValueRightX = totalsBoxX + totalsBoxW - boxInnerPadX;

    // Subtotal Row
    const subtotalY = totalsBoxY + totalsBoxH - 20;
    page.drawText('Subtotal:', {
      x: boxLabelX,
      y: subtotalY,
      size: 9,
      font: fontRegular,
      color: cLabelMuted
    });
    const subValStr = formatMoney(subtotalCents, curr);
    const subValW = fontBold.widthOfTextAtSize(subValStr, 9);
    page.drawText(subValStr, {
      x: boxValueRightX - subValW,
      y: subtotalY,
      size: 9,
      font: fontBold,
      color: cCharcoal
    });

    // Amount Received Row
    const amtRecY = subtotalY - 16;
    page.drawText('Amount Received:', {
      x: boxLabelX,
      y: amtRecY,
      size: 9,
      font: fontRegular,
      color: cLabelMuted
    });
    const amtValStr = formatMoney(amountReceivedCents, curr);
    const amtValW = fontBold.widthOfTextAtSize(amtValStr, 9);
    page.drawText(amtValStr, {
      x: boxValueRightX - amtValW,
      y: amtRecY,
      size: 9,
      font: fontBold,
      color: cCharcoal
    });

    // Divider inside Totals Box
    page.drawLine({
      start: { x: boxLabelX, y: amtRecY - 8 },
      end: { x: boxValueRightX, y: amtRecY - 8 },
      thickness: 0.8,
      color: rgb(180 / 255, 215 / 255, 205 / 255)
    });

    // Grand Total Row
    const grandY = amtRecY - 24;
    page.drawText('Grand Total:', {
      x: boxLabelX,
      y: grandY,
      size: 11,
      font: fontBold,
      color: cTeal
    });
    const grandValStr = formatMoney(grandTotalCents, curr);
    const grandValW = fontBold.widthOfTextAtSize(grandValStr, 12);
    page.drawText(grandValStr, {
      x: boxValueRightX - grandValW,
      y: grandY - 1,
      size: 12,
      font: fontBold,
      color: cTeal
    });

    // 7. Footer: 'Payment Method' details at bottom left, centered disclaimer, solid thin accent bar across very bottom
    const agency = docData.agency || {};
    const agencyName = agency.name || 'Whiz Studio';
    const methodConfig = docData.paymentAccountDetails || {};
    const payMethodName = docData.paymentMethod || 'Bank Transfer';
    const payAccountName = methodConfig.accountName || agencyName;
    const payAccountNum = methodConfig.accountNumber ? `Account No. ${methodConfig.accountNumber}` : (docData.paymentReference ? `Trx Ref: ${docData.paymentReference}` : 'Account No. 123 4567 8901');

    const pmTopY = totalsBoxY + totalsBoxH - 8;
    page.drawText('PAYMENT METHOD', {
      x: marginX,
      y: pmTopY,
      size: 8.5,
      font: fontBold,
      color: cLabelMuted
    });

    page.drawText(payMethodName, {
      x: marginX,
      y: pmTopY - 15,
      size: 9.5,
      font: fontBold,
      color: cCharcoal
    });

    page.drawText(payAccountName, {
      x: marginX,
      y: pmTopY - 28,
      size: 8.5,
      font: fontRegular,
      color: cTextMuted
    });

    page.drawText(payAccountNum, {
      x: marginX,
      y: pmTopY - 40,
      size: 8.5,
      font: fontRegular,
      color: cTextMuted
    });

    // Signature-free disclaimer text centered above bottom bar
    const disclaimer = 'This is a system-generated online invoice. No physical signature or seal is required.';
    const discW = fontRegular.widthOfTextAtSize(disclaimer, 7.5);
    page.drawText(disclaimer, {
      x: (width - discW) / 2,
      y: 18,
      size: 7.5,
      font: fontOblique,
      color: cLabelMuted
    });

    // Solid thin accent bar across the very bottom of the page
    const barH = 4;
    page.drawRectangle({
      x: 0,
      y: 0,
      width: width * 0.70,
      height: barH,
      color: cTeal
    });
    page.drawRectangle({
      x: width * 0.70,
      y: 0,
      width: width * 0.30,
      height: barH,
      color: cGold
    });

    return await pdfDoc.save();
  }

  // Exports for Browser and Node
  const exportTarget = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this);
  exportTarget.compileWhizDocumentPdf = compileWhizDocumentPdf;
  exportTarget.WhizDocumentPdf = { compileWhizDocumentPdf };

  if (typeof exports !== 'undefined') {
    exports.compileWhizDocumentPdf = compileWhizDocumentPdf;
    exports.WhizDocumentPdf = { compileWhizDocumentPdf };
    exports.default = { compileWhizDocumentPdf };
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { compileWhizDocumentPdf, WhizDocumentPdf: { compileWhizDocumentPdf } };
    module.exports.default = { compileWhizDocumentPdf };
  }

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
