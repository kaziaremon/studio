/**
 * WHIZ STUDIO — OFFICIAL VECTOR PDF GENERATOR
 * "WHIZ Emerald & Gold Professional A4 Stationery"
 * 
 * Standards:
 * - Standard A4 (210 x 297 mm = 595.28 x 841.89 pt)
 * - 14 mm print-safe margins (40 pt)
 * - Brand Colors: Emerald (#087F70), Gold (#C69A40), Deep Charcoal (#20312E)
 * - Embeds official logo (/assets/images/logo.png)
 * - Client-side execution via pdf-lib with zero server binary storage
 */

(function (global) {
  'use strict';

  // Cached logo bytes promise so multiple calls don't re-fetch
  let cachedLogoBytes = null;

  async function getLogoBytes() {
    try {
      if (typeof window !== 'undefined' && window.location) {
        const res = await fetch('/assets/images/logo.png');
        if (res.ok) return await res.arrayBuffer();
      }
      if (typeof process !== 'undefined') {
        try {
          const fs = await import('fs');
          const p = 'G:/Whiz Studio/assets/images/logo.png';
          if (fs.existsSync(p)) return fs.readFileSync(p);
        } catch (_) {}
      }
    } catch (e) {
      console.warn('Could not load logo image for PDF:', e);
    }
    return null;
  }



  function formatMoney(amountCents, currency) {
    var curr = (currency || "USD").toUpperCase();
    var num = Number(amountCents || 0);
    var dollars = num / 100;
    var symbol = "$";
    if (curr === "BDT") symbol = "BDT ";
    else if (curr === "EUR") symbol = "€";
    else if (curr === "GBP") symbol = "£";
    return symbol + dollars.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function wrapText(text, maxChars) {
    if (!text) return [];
    var words = String(text).split(" ");
    var lines = [];
    var currentLine = "";
    for (var i = 0; i < words.length; i++) {
      var word = words[i];
      if ((currentLine + " " + word).trim().length <= maxChars) {
        currentLine = (currentLine + " " + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  async function compileWhizDocumentPdf(docData, options = {}) {
    let PDFLib = global.PDFLib;
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
    const rightAlignX = width - marginX;

    // Fonts
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // WHIZ Emerald & Gold Brand Palette
    const cEmerald = rgb(8 / 255, 127 / 255, 112 / 255);       // #087F70
    const cEmeraldDark = rgb(6 / 255, 95 / 255, 70 / 255);      // #065F46
    const cEmeraldLight = rgb(234 / 255, 245 / 255, 241 / 255); // #EAF5F1
    const cGold = rgb(198 / 255, 154 / 255, 64 / 255);          // #C69A40
    const cGoldLight = rgb(253 / 255, 249 / 255, 238 / 255);    // #FDF9EE
    const cCharcoal = rgb(32 / 255, 49 / 255, 46 / 255);        // #20312E
    const cMuted = rgb(95 / 255, 113 / 255, 128 / 255);         // #5F7180
    const cLightBg = rgb(246 / 255, 248 / 255, 247 / 255);      // #F6F8F7
    const cBorder = rgb(227 / 255, 233 / 255, 239 / 255);       // #E3E9EF
    const cWhite = rgb(1, 1, 1);

    const isReceipt = (docData.documentType === 'receipt' || docData.type === 'receipt');

    // 1. Pure Crisp Background
    page.drawRectangle({ x: 0, y: 0, width, height, color: cWhite });

    // 2. Top Header Accent Strip (72% Emerald, 28% Gold)
    page.drawRectangle({ x: 0, y: height - 5, width: width * 0.72, height: 5, color: cEmerald });
    page.drawRectangle({ x: width * 0.72, y: height - 5, width: width * 0.28, height: 5, color: cGold });

    // 3. Embed Official Whiz Studio Logo
    const logoBytes = await getLogoBytes();
    if (logoBytes) {
      try {
        const logoImage = await pdfDoc.embedPng(logoBytes);
        const targetLogoWidth = 118;
        const targetLogoHeight = (logoImage.height / logoImage.width) * targetLogoWidth;
        page.drawImage(logoImage, {
          x: marginX,
          y: height - 40 - targetLogoHeight,
          width: targetLogoWidth,
          height: targetLogoHeight
        });
      } catch (err) {
        console.warn('Failed embedding logo PNG in PDF, drawing text fallback:', err);
        page.drawText('WHIZ STUDIO', { x: marginX, y: height - 48, size: 16, font: fontBold, color: cEmerald });
      }
    } else {
      page.drawText('WHIZ STUDIO', { x: marginX, y: height - 48, size: 16, font: fontBold, color: cEmerald });
    }

    // 4. Official Issuer Contact Block (Bill From)
    const issuer = docData.issuer || {};
    const issuerYStart = height - 88;
    page.drawText(issuer.legalName || 'WHIZ STUDIO', {
      x: marginX,
      y: issuerYStart,
      size: 9.5,
      font: fontBold,
      color: cCharcoal
    });
    page.drawText(issuer.tagline || 'Digital Marketing & Performance Growth Agency', {
      x: marginX,
      y: issuerYStart - 12,
      size: 7.5,
      font: fontRegular,
      color: cMuted
    });
    page.drawText(issuer.address || 'House 53, Road 7, Block A, Mirpur 12, Dhaka 1216, BD', {
      x: marginX,
      y: issuerYStart - 23,
      size: 7.5,
      font: fontRegular,
      color: cMuted
    });
    const contactLine = `Phone: ${issuer.phone || '+8801815127022'}  •  Email: ${issuer.email || 'info@whizstudio.art'}  •  ${issuer.website ? issuer.website.replace('https://', '') : 'whizstudio.art'}`;
    page.drawText(contactLine, {
      x: marginX,
      y: issuerYStart - 34,
      size: 7.5,
      font: fontRegular,
      color: cMuted
    });

    // 5. Header Right: Document Title & Metadata
    const docTitle = isReceipt ? 'PAYMENT RECEIPT' : 'INVOICE';
    const titleSize = isReceipt ? 22 : 28;
    const titleW = fontBold.widthOfTextAtSize(docTitle, titleSize);

    page.drawText(docTitle, {
      x: rightAlignX - titleW,
      y: height - (isReceipt ? 56 : 60),
      size: titleSize,
      font: fontBold,
      color: cEmerald
    });

    page.drawLine({
      start: { x: rightAlignX - titleW, y: height - 66 },
      end: { x: rightAlignX, y: height - 66 },
      thickness: 2,
      color: cGold
    });

    // Metadata lines
    const docNumber = isReceipt
      ? (docData.receiptNumber || 'WHIZ-RCPT-2026-0001')
      : (docData.invoiceNumber || 'WHIZ-INV-2026-000001');
    const issueDate = docData.issueDate || docData.paymentDate || '03 November, 2026';
    const dueDate = docData.dueDate;
    const rawStatus = (docData.status || (isReceipt ? 'CONFIRMED' : 'PAID')).toUpperCase().replace(/_/g, ' ');

    let metaY = height - 85;
    const metaLineHeight = 13.5;

    function drawMetaRow(label, value, isBold = false) {
      const valW = (isBold ? fontBold : fontRegular).widthOfTextAtSize(value, 8.5);
      const labelW = fontBold.widthOfTextAtSize(label + ' ', 8.5);
      page.drawText(label, { x: rightAlignX - valW - labelW, y: metaY, size: 8.5, font: fontBold, color: cMuted });
      page.drawText(value, { x: rightAlignX - valW, y: metaY, size: 8.5, font: isBold ? fontBold : fontRegular, color: cCharcoal });
      metaY -= metaLineHeight;
    }

    drawMetaRow(isReceipt ? 'Receipt No:' : 'Invoice No:', docNumber, true);
    drawMetaRow(isReceipt ? 'Payment Date:' : 'Issue Date:', issueDate);
    if (!isReceipt && dueDate) drawMetaRow('Due Date:', dueDate);
    if (isReceipt && docData.invoiceNumber) drawMetaRow('Invoice Ref:', docData.invoiceNumber);

    // Status Badge
    const isPaid = rawStatus === 'PAID' || rawStatus === 'CONFIRMED' || rawStatus === 'PAID IN FULL';
    const isPartial = rawStatus === 'PARTIALLY PAID' || rawStatus === 'PARTIAL';
    let badgeText = isPaid ? (isReceipt ? 'PAYMENT CONFIRMED' : 'PAID IN FULL') : (isPartial ? 'PARTIALLY PAID' : 'PAYMENT PENDING');
    const badgeW = fontBold.widthOfTextAtSize(badgeText, 7.5) + 14;
    const badgeH = 14;
    const badgeX = rightAlignX - badgeW;
    const badgeY = metaY - 3;

    page.drawRectangle({
      x: badgeX,
      y: badgeY,
      width: badgeW,
      height: badgeH,
      color: isPaid ? cEmeraldLight : (isPartial ? cGoldLight : cLightBg),
      borderColor: isPaid ? cEmerald : (isPartial ? cGold : cBorder),
      borderWidth: 0.8
    });
    page.drawText(badgeText, {
      x: badgeX + 7,
      y: badgeY + 3.5,
      size: 7.5,
      font: fontBold,
      color: isPaid ? cEmeraldDark : (isPartial ? cGold : cMuted)
    });

    // 6. Section Divider
    const dividerY = height - 150;
    page.drawLine({ start: { x: marginX, y: dividerY }, end: { x: rightAlignX, y: dividerY }, thickness: 1, color: cBorder });
    page.drawLine({ start: { x: marginX, y: dividerY }, end: { x: marginX + 60, y: dividerY }, thickness: 2, color: cGold });

    // 7. Two-Column Billing Details
    const colY = dividerY - 18;
    const colWidth = (contentWidth - 24) / 2;
    const col2X = marginX + colWidth + 24;

    // Left: Bill From
    page.drawText('BILL FROM', { x: marginX, y: colY, size: 8, font: fontBold, color: cGold });
    page.drawText(issuer.legalName || 'Whiz Studio', { x: marginX, y: colY - 14, size: 11, font: fontBold, color: cCharcoal });
    page.drawText('House 53, Road 7, Block A, Mirpur 12', { x: marginX, y: colY - 26, size: 8.5, font: fontRegular, color: cCharcoal });
    page.drawText('Dhaka 1216, Bangladesh', { x: marginX, y: colY - 37, size: 8.5, font: fontRegular, color: cCharcoal });
    page.drawText('info@whizstudio.art  |  +8801815127022', { x: marginX, y: colY - 48, size: 8, font: fontRegular, color: cMuted });

    // Right: Bill To (Client CIF Details)
    const client = docData.client || {};
    const clientName = client.billingName || client.organizationName || client.fullName || docData.clientName || 'Valued Client';
    const companyName = client.companyName || '';
    const clientAddr = client.billingAddress || client.address || docData.clientAddress || 'Dhaka, Bangladesh';
    const clientCityCountry = [client.city, client.country, client.postalCode].filter(Boolean).join(', ');
    const clientEmailPhone = [client.email, client.phone].filter(Boolean).join('  •  ');

    page.drawText(isReceipt ? 'RECEIVED FROM' : 'BILL TO', { x: col2X, y: colY, size: 8, font: fontBold, color: cEmerald });
    page.drawText(clientName, { x: col2X, y: colY - 14, size: 11, font: fontBold, color: cCharcoal });

    let clientCurY = colY - 26;
    if (companyName && companyName !== clientName) {
      page.drawText(companyName, { x: col2X, y: clientCurY, size: 9, font: fontBold, color: cEmeraldDark });
      clientCurY -= 12;
    }
    const addrLines = wrapText(clientAddr, 42);
    addrLines.slice(0, 2).forEach(line => {
      page.drawText(line, { x: col2X, y: clientCurY, size: 8.5, font: fontRegular, color: cCharcoal });
      clientCurY -= 11;
    });
    if (clientCityCountry) {
      page.drawText(clientCityCountry, { x: col2X, y: clientCurY, size: 8.5, font: fontRegular, color: cCharcoal });
      clientCurY -= 11;
    }
    if (clientEmailPhone) {
      page.drawText(clientEmailPhone, { x: col2X, y: clientCurY, size: 8, font: fontRegular, color: cMuted });
    }

    // 8. Line Items Table
    const tableY = dividerY - 95;
    const thHeight = 22;

    page.drawRectangle({
      x: marginX,
      y: tableY - thHeight,
      width: contentWidth,
      height: thHeight,
      color: cLightBg,
      borderColor: cBorder,
      borderWidth: 1
    });
    page.drawLine({ start: { x: marginX, y: tableY }, end: { x: rightAlignX, y: tableY }, thickness: 1.5, color: cEmerald });

    const colDescX = marginX + 12;
    const colQtyX = marginX + 310;
    const colRateX = marginX + 375;
    const colTotalX = rightAlignX - 12;

    page.drawText(isReceipt ? 'PAYMENT ITEM DESCRIPTION' : 'SERVICE DESCRIPTION', { x: colDescX, y: tableY - 15, size: 8, font: fontBold, color: cCharcoal });
    page.drawText('QTY', { x: colQtyX, y: tableY - 15, size: 8, font: fontBold, color: cCharcoal });
    page.drawText('UNIT PRICE', { x: colRateX, y: tableY - 15, size: 8, font: fontBold, color: cCharcoal });
    const thTotalText = isReceipt ? 'PAID' : 'TOTAL';
    const thTotalW = fontBold.widthOfTextAtSize(thTotalText, 8);
    page.drawText(thTotalText, { x: colTotalX - thTotalW, y: tableY - 15, size: 8, font: fontBold, color: cCharcoal });

    const items = (docData.items && docData.items.length > 0) ? docData.items : [{
      description: docData.serviceName || docData.description || 'Professional Retainer Services',
      quantity: 1,
      unitPriceCents: isReceipt ? (docData.amountPaidCents || docData.totalCents || 0) : (docData.totalCents || 0),
      totalCents: isReceipt ? (docData.amountPaidCents || docData.totalCents || 0) : (docData.totalCents || 0)
    }];

    const curr = docData.currency || 'USD';
    let rowY = tableY - thHeight - 4;

    items.forEach((item, index) => {
      const rowHeight = 32;
      if (index % 2 === 1) {
        page.drawRectangle({
          x: marginX,
          y: rowY - rowHeight + 4,
          width: contentWidth,
          height: rowHeight,
          color: rgb(250 / 255, 252 / 255, 251 / 255)
        });
      }

      page.drawLine({
        start: { x: marginX, y: rowY - rowHeight + 4 },
        end: { x: rightAlignX, y: rowY - rowHeight + 4 },
        thickness: 0.5,
        color: cBorder
      });

      page.drawText(item.description || 'Professional Agency Service', {
        x: colDescX,
        y: rowY - 14,
        size: 9,
        font: fontBold,
        color: cCharcoal
      });

      const metaSub = [docData.servicePackage, docData.serviceCategory].filter(Boolean).join(' • ');
      if (metaSub) {
        page.drawText(metaSub, { x: colDescX, y: rowY - 24, size: 7.5, font: fontRegular, color: cMuted });
      }

      page.drawText(String(item.quantity || 1), { x: colQtyX + 4, y: rowY - 16, size: 9, font: fontRegular, color: cCharcoal });
      const itemUnitCents = item.unitPriceCents ?? item.unit_price_cents ?? (item.unitPrice ? Math.round(item.unitPrice * 100) : 0);
      const itemTotalCents = item.totalCents ?? item.total_cents ?? (item.amount ? Math.round(item.amount * 100) : (itemUnitCents * (item.quantity || 1)));

      page.drawText(formatMoney(itemUnitCents, curr), { x: colRateX, y: rowY - 16, size: 9, font: fontRegular, color: cCharcoal });

      const lineTotalStr = formatMoney(itemTotalCents, curr);
      const lineTotalW = fontBold.widthOfTextAtSize(lineTotalStr, 9);
      page.drawText(lineTotalStr, { x: colTotalX - lineTotalW, y: rowY - 16, size: 9, font: fontBold, color: cCharcoal });

      rowY -= rowHeight;
    });

    // 9. Financial Summary & Settlement Terms
    const summaryTopY = rowY - 18;
    const summaryBoxWidth = 220;
    const summaryBoxX = rightAlignX - summaryBoxWidth;

    const subtotalCents = docData.subtotalCents ?? docData.subtotal_cents ?? (docData.subtotal ? Math.round(docData.subtotal * 100) : 0);
    const taxCents = docData.taxCents ?? docData.tax_cents ?? (docData.vatAmount ? Math.round(docData.vatAmount * 100) : 0);
    const totalCents = docData.totalCents ?? docData.total_cents ?? (docData.total ? Math.round(docData.total * 100) : (subtotalCents + taxCents));
    const amountPaidCents = isReceipt
      ? (docData.amountPaidCents ?? docData.amount_paid_cents ?? (docData.amountPaid ? Math.round(docData.amountPaid * 100) : totalCents))
      : (docData.amountPaidCents ?? docData.amount_paid_cents ?? (docData.amountPaid ? Math.round(docData.amountPaid * 100) : 0));
    const balanceCents = docData.outstandingBalanceCents !== undefined
      ? docData.outstandingBalanceCents
      : (docData.outstanding_balance_cents !== undefined
        ? docData.outstanding_balance_cents
        : (docData.balanceDue !== undefined ? Math.round(docData.balanceDue * 100) : Math.max(0, totalCents - amountPaidCents)));

    // Left Notes & Terms Box
    const notesWidth = contentWidth - summaryBoxWidth - 24;
    page.drawRectangle({
      x: marginX,
      y: summaryTopY - 110,
      width: notesWidth,
      height: 110,
      color: cLightBg,
      borderColor: cBorder,
      borderWidth: 0.8
    });

    page.drawText(isReceipt ? 'PAYMENT SETTLEMENT DETAILS' : 'PAYMENT & FINANCIAL TERMS', {
      x: marginX + 12,
      y: summaryTopY - 18,
      size: 8,
      font: fontBold,
      color: cEmerald
    });

    const paymentMethodStr = docData.paymentMethod || 'Bank Transfer / Wire';
    page.drawText(`Payment Method: ${paymentMethodStr}`, { x: marginX + 12, y: summaryTopY - 32, size: 8, font: fontRegular, color: cCharcoal });

    if (docData.paymentReference) {
      page.drawText(`Payment Reference: ${docData.paymentReference}`, { x: marginX + 12, y: summaryTopY - 45, size: 8, font: fontRegular, color: cCharcoal });
    }

    const customNotes = docData.notes || 'Payment is requested according to agreed terms. For billing inquiries contact info@whizstudio.art.';
    const noteLines = wrapText(customNotes, 52);
    noteLines.slice(0, 2).forEach((l, idx) => {
      page.drawText(l, { x: marginX + 12, y: summaryTopY - (docData.paymentReference ? 58 : 45) - (idx * 11), size: 7.5, font: fontOblique, color: cMuted });
    });

    page.drawText('Official payment acknowledgment digitally recorded in verified ledger.', {
      x: marginX + 12,
      y: summaryTopY - 96,
      size: 7,
      font: fontRegular,
      color: cMuted
    });

    // Right Summary Lines
    let sumY = summaryTopY;
    function drawSummaryLine(label, amountStr, isTotal = false, isAccent = false) {
      const sz = isTotal ? 11 : 8.5;
      const col = isTotal ? cEmeraldDark : (isAccent ? cGold : cCharcoal);

      if (isTotal) {
        page.drawRectangle({
          x: summaryBoxX,
          y: sumY - 16,
          width: summaryBoxWidth,
          height: 22,
          color: cEmeraldLight,
          borderColor: cEmerald,
          borderWidth: 0.8
        });
      }

      page.drawText(label, {
        x: summaryBoxX + (isTotal ? 8 : 4),
        y: sumY - (isTotal ? 11 : 8),
        size: sz,
        font: isTotal ? fontBold : (isAccent ? fontBold : fontRegular),
        color: col
      });

      const amtW = (isTotal ? fontBold : fontRegular).widthOfTextAtSize(amountStr, sz);
      page.drawText(amountStr, {
        x: rightAlignX - (isTotal ? 8 : 4) - amtW,
        y: sumY - (isTotal ? 11 : 8),
        size: sz,
        font: isTotal ? fontBold : fontRegular,
        color: col
      });

      sumY -= (isTotal ? 26 : 16);
    }

    if (isReceipt) {
      drawSummaryLine('Total Invoice Amount:', formatMoney(totalCents, curr));
      drawSummaryLine('AMOUNT RECEIVED:', formatMoney(amountPaidCents, curr), true);
      drawSummaryLine('Remaining Balance:', formatMoney(balanceCents, curr), false, balanceCents > 0);
    } else {
      drawSummaryLine('Subtotal:', formatMoney(subtotalCents, curr));
      if (taxCents > 0) {
        drawSummaryLine('Applicable VAT:', formatMoney(taxCents, curr));
      }
      drawSummaryLine('INVOICE TOTAL:', formatMoney(totalCents, curr), true);
      drawSummaryLine('Total Paid to Date:', formatMoney(amountPaidCents, curr));
      drawSummaryLine('Outstanding Balance:', formatMoney(balanceCents, curr), false, balanceCents > 0);
    }

    // 10. Online Generated Invoice Official Footer (Phase 11)
    const footerY = 56;
    page.drawLine({ start: { x: marginX, y: footerY + 36 }, end: { x: rightAlignX, y: footerY + 36 }, thickness: 1, color: cBorder });
    page.drawLine({ start: { x: width / 2 - 40, y: footerY + 36 }, end: { x: width / 2 + 40, y: footerY + 36 }, thickness: 1.5, color: cGold });

    const footerTitle = isReceipt ? 'Online Generated Receipt' : 'Online Generated Invoice';
    const fTitleW = fontBold.widthOfTextAtSize(footerTitle, 9);
    page.drawText(footerTitle, { x: (width - fTitleW) / 2, y: footerY + 20, size: 9, font: fontBold, color: cCharcoal });

    const footerSub = 'This is a system-generated online invoice and does not require a physical signature or seal.';
    const fSubW = fontRegular.widthOfTextAtSize(footerSub, 7.5);
    page.drawText(footerSub, { x: (width - fSubW) / 2, y: footerY + 9, size: 7.5, font: fontRegular, color: cMuted });

    const footerBottom = 'Whiz Studio  •  House 53, Road 7, Block A, Mirpur 12, Dhaka 1216, BD  •  https://whizstudio.art';
    const fBottomW = fontRegular.widthOfTextAtSize(footerBottom, 6.8);
    page.drawText(footerBottom, { x: (width - fBottomW) / 2, y: footerY - 1, size: 6.8, font: fontRegular, color: rgb(148 / 255, 163 / 255, 184 / 255) });

    return pdfDoc.save();
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
