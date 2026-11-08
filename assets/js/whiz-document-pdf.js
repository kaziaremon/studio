/**
 * WHIZ STUDIO — OFFICIAL CORPORATE PDF INVOICE ENGINE
 * "Clean Minimalist Card A4 Stationery — Exact Design Replica"
 *
 * Architecture Standards:
 * - Standard A4 (210 x 297 mm = 595.28 x 841.89 pt)
 * - Pure Client-Side Zero-Storage Memory Compilation via pdf-lib (Zero Server / Zero R2 Storage)
 * - Strict Logo Enforcement: Purged legacy blurry assets, uses crisp tight brand logo
 * - Exact Visual Layout Match to Approved Corporate Template:
 *   1. Header: Logo at top left, 'Invoice' in clean, large, thin sans-serif font directly below.
 *      'Invoice No', 'Payment Date', and 'Due Date' / status neatly aligned on top right.
 *   2. Main Wrapper: Very light gray, softly rounded container enclosing the invoice body.
 *   3. The Green 'Contact' Block: Solid rounded Deep Green (#0E715D) rectangle inside main wrapper.
 *      'Bill To' (Client CIF details) on left and 'From' (Whiz Studio details) on right in crisp white.
 *   4. Itemized Table: Clean minimalist table (Item Description, Qty, Unit Price, Amount) with subtle dividers.
 *   5. Totals Section: Right-aligned 'Subtotal', 'Amount Received', and 'Grand Total'.
 *   6. Footer: 'Payment Method' details at bottom left; centered disclaimer at the very bottom:
 *      "This is a system-generated online invoice. No physical signature or seal is required."
 */

(function (global) {
  'use strict';

  let cachedLogoBytes = null;

  async function getLogoBytes() {
    if (cachedLogoBytes) return cachedLogoBytes;
    try {
      if (typeof window !== 'undefined' && window.location) {
        // Strict newest logo enforcement with cache-busting timestamp
        const candidates = [
          '/assets/images/whiz-brand-logo-tight.png?v=20261108_replica_v1',
          '/assets/images/logo.png?v=20261108_replica_v1',
          '/whiz-brand-logo-tight.png?v=20261108_replica_v1',
          '/logo.png?v=20261108_replica_v1'
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
            'G:/Whiz Studio/assets/images/whiz-brand-logo-tight.png',
            'G:/Whiz Studio/public/assets/images/whiz-brand-logo-tight.png',
            'G:/Whiz Studio/assets/images/logo.png',
            'G:/Whiz Studio/public/assets/images/logo.png'
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

    const hasCents = (dollars % 1 !== 0);
    return symbol + dollars.toLocaleString('en-US', {
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: 2
    });
  }

  function formatInvoiceDate(val) {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const day = d.getDate();
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

    const marginX = 42;
    const contentWidth = width - (marginX * 2); // 511.28 pt
    const rightAlignX = width - marginX;        // 553.28 pt

    // Typography
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // Color Palette matching Reference Design
    const cWhite = rgb(1, 1, 1);
    const cPageBg = rgb(1, 1, 1);
    const cWrapperBg = rgb(240 / 255, 245 / 255, 243 / 255); // Soft mint/gray tint
    const cDeepGreen = rgb(14 / 255, 113 / 255, 87 / 255);    // Whiz Deep Green (#0E715D)
    const cTitleGreen = rgb(17 / 255, 60 / 255, 51 / 255);   // Dark Spruce Green (#113C33)
    const cCharcoal = rgb(23 / 255, 43 / 255, 54 / 255);      // #172B36 (Dark Slate / Charcoal)
    const cTextMuted = rgb(71 / 255, 85 / 255, 105 / 255);    // #475569
    const cDivider = rgb(203 / 255, 213 / 255, 225 / 255);     // #CBD5E1 (Subtle divider)
    const cWhiteSub = rgb(234 / 255, 245 / 255, 241 / 255);   // Soft white for subtext in green block

    // 1. Page Background
    page.drawRectangle({ x: 0, y: 0, width, height, color: cPageBg });

    // 2. Logo Top-Left
    const logoBytes = await getLogoBytes();
    let logoImg = null;
    let logoH = 33.7;
    const logoW = 112;
    if (logoBytes) {
      try {
        logoImg = await pdfDoc.embedPng(logoBytes);
        logoH = logoW * (logoImg.height / logoImg.width);
      } catch (err) {
        console.warn('Could not embed PNG logo into PDF:', err);
      }
    }

    const logoTopY = height - 42;
    const logoY = logoTopY - logoH;
    if (logoImg) {
      page.drawImage(logoImg, {
        x: marginX,
        y: logoY,
        width: logoW,
        height: logoH
      });
    } else {
      page.drawText('WHIZ STUDIO', {
        x: marginX,
        y: logoY + 8,
        size: 20,
        font: fontBold,
        color: cDeepGreen
      });
    }

    // 3. 'Invoice' in clean, large, thin sans-serif font directly below logo
    const titleY = logoY - 48;
    page.drawText('Invoice', {
      x: marginX,
      y: titleY,
      size: 40,
      font: fontRegular, // Large, clean, thin sans-serif
      color: cTitleGreen
    });

    // 4. Header Top-Right: Align 'Invoice No' and 'Payment Date' neatly on top right
    const curr = (docData.currency || 'USD').toUpperCase();
    const docNumber = docData.invoiceNumber || docData.receiptNumber || '012345';
    const rawPaymentDate = docData.paymentDate || docData.issueDate || '10 February 2050';
    const paymentDate = formatInvoiceDate(rawPaymentDate) || rawPaymentDate;
    const rawDueDate = docData.dueDate || docData.settlementDate || docData.paymentDate || '24 February 2050';
    const dueDate = formatInvoiceDate(rawDueDate) || rawDueDate;

    const metaStartY = logoY + 10;
    const labelColX = rightAlignX - 170;
    const valColX = rightAlignX - 85;

    function drawHeaderMetaRow(y, label, val) {
      page.drawText(label, {
        x: labelColX,
        y: y,
        size: 9.5,
        font: fontBold,
        color: cCharcoal
      });
      page.drawText(val, {
        x: valColX,
        y: y,
        size: 9.5,
        font: fontRegular,
        color: cCharcoal
      });
    }

    drawHeaderMetaRow(metaStartY, 'Invoice No:', docNumber);
    drawHeaderMetaRow(metaStartY - 18, 'Payment Date:', paymentDate);
    if (dueDate && dueDate !== paymentDate) {
      drawHeaderMetaRow(metaStartY - 36, 'Due Date:', dueDate);
    } else {
      drawHeaderMetaRow(metaStartY - 36, 'Status:', 'Paid / Settled');
    }

    // 5. Calculate Body Dimensions
    const items = (docData.items && docData.items.length > 0) ? docData.items : [{
      description: docData.serviceProvided || docData.serviceName || 'Full-Service Digital Retainer',
      quantity: 1,
      unitPriceCents: docData.amountPaidCents || docData.totalCents || 0,
      totalCents: docData.amountPaidCents || docData.totalCents || 0
    }];

    const wrapperTopY = titleY - 24;
    const greenBlockH = 105;
    const tableTopGap = 22;
    const tableHeaderH = 22;
    const rowHeight = 26;
    const itemsH = items.length * rowHeight;
    const tableBottomGap = 20;
    const totalsH = 72;
    const wrapperPaddingBottom = 22;

    const wrapperH = 14 + greenBlockH + tableTopGap + tableHeaderH + itemsH + tableBottomGap + totalsH + wrapperPaddingBottom;
    const wrapperY = wrapperTopY - wrapperH;
    const wrapperRadius = 16;

    // Draw Main Light Gray Softly Rounded Container
    const wrapperPath = createRoundedRectPath(marginX, wrapperY, contentWidth, wrapperH, wrapperRadius);
    page.drawSvgPath(wrapperPath, { color: cWrapperBg });

    // 6. The Green 'Contact' Block inside main rounded container
    const greenPadding = 14;
    const greenBlockX = marginX + greenPadding;
    const greenBlockW = contentWidth - (greenPadding * 2);
    const greenBlockTopY = wrapperTopY - greenPadding;
    const greenBlockY = greenBlockTopY - greenBlockH;
    const greenBlockRadius = 10;

    const greenBlockPath = createRoundedRectPath(greenBlockX, greenBlockY, greenBlockW, greenBlockH, greenBlockRadius);
    page.drawSvgPath(greenBlockPath, { color: cDeepGreen });

    // Left Column inside Green Block: 'Bill To' (Client details from CIF)
    const client = docData.client || {};
    const clientName = client.fullName || client.billingName || docData.clientName || 'Valued Client';
    const companyName = client.companyName || '';
    const clientAddr = client.billingAddress || client.address || docData.clientAddress || 'Dhaka, Bangladesh';
    const clientEmailPhone = [client.email, client.phone].filter(Boolean).join('  •  ') || 'hello@client.com';

    const billToX = greenBlockX + 18;
    let curBillToY = greenBlockTopY - 22;

    page.drawText('Bill To', {
      x: billToX,
      y: curBillToY,
      size: 10.5,
      font: fontBold,
      color: cWhite
    });
    curBillToY -= 15;

    page.drawText(clientName, {
      x: billToX,
      y: curBillToY,
      size: 9,
      font: fontRegular,
      color: cWhite
    });
    curBillToY -= 13;

    if (companyName) {
      page.drawText(companyName, {
        x: billToX,
        y: curBillToY,
        size: 8.5,
        font: fontRegular,
        color: cWhiteSub
      });
      curBillToY -= 13;
    }

    const addrLines = wrapText(clientAddr, 34);
    if (addrLines.length > 0) {
      page.drawText(addrLines[0], {
        x: billToX,
        y: curBillToY,
        size: 8.5,
        font: fontRegular,
        color: cWhiteSub
      });
      curBillToY -= 13;
    }

    page.drawText(clientEmailPhone, {
      x: billToX,
      y: curBillToY,
      size: 8.5,
      font: fontRegular,
      color: cWhiteSub
    });

    // Right Column inside Green Block: 'From' (Whiz Studio details)
    const agency = docData.agency || {};
    const agencyName = agency.name || 'Whiz Studio';
    const agencyPhone = agency.telephone || agency.phone || '+880 1815-127022';
    const agencyAddr = agency.address || 'House 53, Road 7, Block A, Mirpur 12, Dhaka 1216';
    const agencyEmail = agency.supportEmail || agency.email || 'info@whizstudio.art';

    const fromX = greenBlockX + (greenBlockW / 2) + 16;
    let curFromY = greenBlockTopY - 22;

    page.drawText('From', {
      x: fromX,
      y: curFromY,
      size: 10.5,
      font: fontBold,
      color: cWhite
    });
    curFromY -= 15;

    page.drawText(agencyName, {
      x: fromX,
      y: curFromY,
      size: 9,
      font: fontRegular,
      color: cWhite
    });
    curFromY -= 13;

    page.drawText(agencyPhone, {
      x: fromX,
      y: curFromY,
      size: 8.5,
      font: fontRegular,
      color: cWhiteSub
    });
    curFromY -= 13;

    const agencyAddrLines = wrapText(agencyAddr, 34);
    if (agencyAddrLines.length > 0) {
      page.drawText(agencyAddrLines[0], {
        x: fromX,
        y: curFromY,
        size: 8.5,
        font: fontRegular,
        color: cWhiteSub
      });
      curFromY -= 13;
    }

    page.drawText(agencyEmail, {
      x: fromX,
      y: curFromY,
      size: 8.5,
      font: fontRegular,
      color: cWhiteSub
    });

    // 7. Table: Minimalist, clean table with subtle horizontal dividers
    const tableX = greenBlockX;
    const tableW = greenBlockW;
    const tableRightX = tableX + tableW;

    const colDescX = tableX + 8;
    const colQtyX = tableX + 265;
    const colUnitX = tableX + 375;
    const colAmountX = tableRightX - 8;

    const tableTopDivY = greenBlockY - tableTopGap;

    // Divider above table header
    page.drawLine({
      start: { x: tableX, y: tableTopDivY },
      end: { x: tableRightX, y: tableTopDivY },
      thickness: 0.8,
      color: cDivider
    });

    // Table Column Headers
    const headerTextY = tableTopDivY - 14;
    page.drawText('Item Description', {
      x: colDescX,
      y: headerTextY,
      size: 9.5,
      font: fontBold,
      color: cCharcoal
    });

    const qtyHdrW = fontBold.widthOfTextAtSize('Qty', 9.5);
    page.drawText('Qty', {
      x: colQtyX - (qtyHdrW / 2),
      y: headerTextY,
      size: 9.5,
      font: fontBold,
      color: cCharcoal
    });

    const unitHdrW = fontBold.widthOfTextAtSize('Unit Price', 9.5);
    page.drawText('Unit Price', {
      x: colUnitX - unitHdrW,
      y: headerTextY,
      size: 9.5,
      font: fontBold,
      color: cCharcoal
    });

    const amtHdrW = fontBold.widthOfTextAtSize('Amount', 9.5);
    page.drawText('Amount', {
      x: colAmountX - amtHdrW,
      y: headerTextY,
      size: 9.5,
      font: fontBold,
      color: cCharcoal
    });

    // Divider below table header
    const headerBottomDivY = tableTopDivY - tableHeaderH;
    page.drawLine({
      start: { x: tableX, y: headerBottomDivY },
      end: { x: tableRightX, y: headerBottomDivY },
      thickness: 0.8,
      color: cDivider
    });

    // Item Rows
    let curRowY = headerBottomDivY;
    items.forEach((item) => {
      const itemDesc = item.description || 'Full-Service Retainer';
      const qty = String(item.quantity || 1);
      const unitCents = item.unitPriceCents ?? item.unit_price_cents ?? (item.unitPrice ? Math.round(item.unitPrice * 100) : 0);
      const lineTotalCents = item.totalCents ?? item.total_cents ?? (item.amount ? Math.round(item.amount * 100) : (unitCents * (item.quantity || 1)));

      const rowTextY = curRowY - 17;

      page.drawText(itemDesc, {
        x: colDescX,
        y: rowTextY,
        size: 9,
        font: fontRegular,
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

      const unitStr = formatMoney(unitCents, curr);
      const unitW = fontRegular.widthOfTextAtSize(unitStr, 9);
      page.drawText(unitStr, {
        x: colUnitX - unitW,
        y: rowTextY,
        size: 9,
        font: fontRegular,
        color: cCharcoal
      });

      const amtStr = formatMoney(lineTotalCents, curr);
      const amtW = fontRegular.widthOfTextAtSize(amtStr, 9);
      page.drawText(amtStr, {
        x: colAmountX - amtW,
        y: rowTextY,
        size: 9,
        font: fontRegular,
        color: cCharcoal
      });

      curRowY -= rowHeight;
    });

    // Divider below last item
    page.drawLine({
      start: { x: tableX, y: curRowY },
      end: { x: tableRightX, y: curRowY },
      thickness: 0.8,
      color: cDivider
    });

    // 8. Totals Section (Right-aligned below table): Subtotal, Amount Received, Grand Total
    const subtotalCents = docData.subtotalCents ?? docData.subtotal_cents ?? (docData.subtotal ? Math.round(docData.subtotal * 100) : items.reduce((s, i) => s + (i.totalCents || 0), 0));
    const amountReceivedCents = docData.amountPaidCents ?? docData.amount_cents ?? (docData.amountPaid ? Math.round(docData.amountPaid * 100) : subtotalCents);
    const grandTotalCents = docData.totalInvoiceAmountCents ?? docData.totalCents ?? subtotalCents;

    const totalsLabelX = tableRightX - 175;
    const totalsValRightX = colAmountX;

    function drawTotalRow(y, label, valStr, isBold = false, size = 9.5) {
      page.drawText(label, {
        x: totalsLabelX,
        y: y,
        size: size,
        font: isBold ? fontBold : fontRegular,
        color: cCharcoal
      });
      const valW = (isBold ? fontBold : fontRegular).widthOfTextAtSize(valStr, size);
      page.drawText(valStr, {
        x: totalsValRightX - valW,
        y: y,
        size: size,
        font: isBold ? fontBold : fontRegular,
        color: cCharcoal
      });
    }

    const totalsTopY = curRowY - 18;
    drawTotalRow(totalsTopY, 'Subtotal:', formatMoney(subtotalCents, curr), true);
    drawTotalRow(totalsTopY - 18, 'Amount Received:', formatMoney(amountReceivedCents, curr), true);

    // Divider / Gap above Grand Total
    page.drawLine({
      start: { x: totalsLabelX, y: totalsTopY - 26 },
      end: { x: totalsValRightX, y: totalsTopY - 26 },
      thickness: 0.8,
      color: cDivider
    });

    drawTotalRow(totalsTopY - 42, 'Grand Total:', formatMoney(grandTotalCents, curr), true, 11);

    // 9. Footer (Below Wrapper)
    // Left: Payment Method Details
    const methodConfig = docData.paymentAccountDetails || {};
    const payMethodName = docData.paymentMethod || 'Bank Transfer';
    const payAccountName = methodConfig.accountName || agencyName;
    const payAccountNum = methodConfig.accountNumber ? `Account No. ${methodConfig.accountNumber}` : (docData.paymentReference ? `Trx Ref: ${docData.paymentReference}` : 'Account No. 123 4567 8901');

    const pmTopY = wrapperY - 26;
    page.drawText('Payment Method', {
      x: marginX + 8,
      y: pmTopY,
      size: 10,
      font: fontBold,
      color: cCharcoal
    });

    page.drawText(payMethodName, {
      x: marginX + 8,
      y: pmTopY - 14,
      size: 8.5,
      font: fontRegular,
      color: cTextMuted
    });

    page.drawText(payAccountName, {
      x: marginX + 8,
      y: pmTopY - 26,
      size: 8.5,
      font: fontRegular,
      color: cTextMuted
    });

    page.drawText(payAccountNum, {
      x: marginX + 8,
      y: pmTopY - 38,
      size: 8.5,
      font: fontRegular,
      color: cTextMuted
    });

    // Centered Disclaimer at very bottom
    const disclaimer = 'This is a system-generated online invoice. No physical signature or seal is required.';
    const discW = fontRegular.widthOfTextAtSize(disclaimer, 7.5);
    page.drawText(disclaimer, {
      x: (width - discW) / 2,
      y: 36,
      size: 7.5,
      font: fontOblique,
      color: cTextMuted
    });

    return await pdfDoc.save();
  }

  // Exports for Browser and Node
  const exportTarget = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this);
  exportTarget.compileWhizDocumentPdf = compileWhizDocumentPdf;
  exportTarget.WhizDocumentPdf = { compileWhizDocumentPdf };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { compileWhizDocumentPdf };
    module.exports.default = { compileWhizDocumentPdf };
  }

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
