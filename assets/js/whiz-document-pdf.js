/**
 * WHIZ STUDIO — OFFICIAL CORPORATE PDF INVOICE ENGINE
 * "Modern Card-Based Architecture Reference"
 *
 * Design Architecture:
 * - Standard A4 (210 x 297 mm = 595.28 x 841.89 pt)
 * - Brand Palette: Deep Green Primary (#087F70), Warm Gold Accent (#C69A40), Dark Charcoal (#172B36), Slate (#5F7180)
 * - Top & Bottom Framing Accents: Slim dual-tone brand bars (Deep Green & Gold)
 * - Watermark: Large, centralized, low-opacity (6%, strictly between 5% and 8%) watermark of official company logo
 * - Header: Company Logo at top-left, title strictly 'Invoice' at top-right in bold, subtle horizontal divider line below
 * - Meta Section: 'Billed to:' (Client CIF data) on the left, Invoice No. & Dynamic Date on the right
 * - Main Data Card: Sleek, rounded white card container with subtle border for itemized table (Description, Amount)
 * - Total Block: Solid block of the brand's primary Deep Green (#087F70) at bottom of rounded card, displaying 'Total Amount' and value in crisp white text
 * - Information Logic: NO duplicate addresses; company contact info displayed neatly at bottom ('Payment Info' & 'Issued by')
 * - Footer: System-generated compliance notice centered at very bottom, zero physical signature blocks
 * - Engine: Pure Client-Side Zero-Storage Vector Execution in browser memory (Zero server storage)
 */

(function (global) {
  'use strict';

  let cachedLogoBytes = null;

  async function getLogoBytes() {
    if (cachedLogoBytes) return cachedLogoBytes;
    try {
      if (typeof window !== 'undefined' && window.location) {
        const candidates = [
          '/assets/images/logo.png',
          '/public/assets/images/logo.png',
          '/logo.png'
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
            'G:/Whiz Studio/assets/images/logo.png',
            'G:/Whiz Studio/public/assets/images/logo.png',
            'G:/Whiz Studio/logo.png'
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
    const curr = (currency || "USD").toUpperCase();
    const num = Number(amountCents || 0);
    const dollars = num / 100;
    let symbol = "$";
    if (curr === "BDT") symbol = "BDT ";
    else if (curr === "EUR") symbol = "€";
    else if (curr === "GBP") symbol = "£";
    else if (curr === "AED") symbol = "AED ";
    else if (curr === "SAR") symbol = "SAR ";
    else if (curr === "CAD") symbol = "CA$";
    else if (curr === "AUD") symbol = "A$";
    else if (curr === "SGD") symbol = "S$";
    else if (curr === "INR") symbol = "₹";
    else if (curr === "JPY") symbol = "¥";
    else if (curr === "MYR") symbol = "RM ";
    return symbol + dollars.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function wrapText(text, maxChars) {
    if (!text) return [];
    const words = String(text).replace(/\r?\n/g, ' ').split(/\s+/);
    const lines = [];
    let currentLine = "";
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (!word) continue;
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

  // Draw full rounded card container with border and fill
  function drawRoundedCard(page, x, y, width, height, radius, options = {}) {
    const { fillColor, borderColor, borderWidth } = options;
    const r = Math.min(radius, width / 2, height / 2);
    const path = `M ${x + r} ${y} ` +
                 `L ${x + width - r} ${y} ` +
                 `Q ${x + width} ${y} ${x + width} ${y + r} ` +
                 `L ${x + width} ${y + height - r} ` +
                 `Q ${x + width} ${y + height} ${x + width - r} ${y + height} ` +
                 `L ${x + r} ${y + height} ` +
                 `Q ${x} ${y + height} ${x} ${y + height - r} ` +
                 `L ${x} ${y + r} ` +
                 `Q ${x} ${y} ${x + r} ${y} Z`;
    page.drawSvgPath(path, {
      color: fillColor,
      borderColor: borderColor,
      borderWidth: borderWidth || 1
    });
  }

  // Draw top-rounded table header background inside card
  function drawTopRoundedHeader(page, x, y, width, height, radius, fillColor) {
    const r = Math.min(radius, width / 2, height);
    const path = `M ${x} ${y} ` +
                 `L ${x + width} ${y} ` +
                 `L ${x + width} ${y + height - r} ` +
                 `Q ${x + width} ${y + height} ${x + width - r} ${y + height} ` +
                 `L ${x + r} ${y + height} ` +
                 `Q ${x} ${y + height} ${x} ${y + height - r} ` +
                 `L ${x} ${y} Z`;
    page.drawSvgPath(path, { color: fillColor });
  }

  // Draw bottom-rounded solid total block inside card
  function drawBottomRoundedTotalBlock(page, x, y, width, height, radius, fillColor) {
    const r = Math.min(radius, width / 2, height);
    const path = `M ${x + r} ${y} ` +
                 `L ${x + width - r} ${y} ` +
                 `Q ${x + width} ${y} ${x + width} ${y + r} ` +
                 `L ${x + width} ${y + height} ` +
                 `L ${x} ${y + height} ` +
                 `L ${x} ${y + r} ` +
                 `Q ${x} ${y} ${x + r} ${y} Z`;
    page.drawSvgPath(path, { color: fillColor });
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
    const contentWidth = width - (marginX * 2);
    const rightAlignX = width - marginX;

    // Corporate Typography
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // Whiz Studio Refined Corporate Palette
    const cEmerald = rgb(8 / 255, 127 / 255, 112 / 255);        // #087F70 (Deep Green Brand Primary)
    const cEmeraldDark = rgb(6 / 255, 95 / 255, 70 / 255);       // #065F46
    const cGold = rgb(198 / 255, 154 / 255, 64 / 255);           // #C69A40 (Warm Gold Accent)
    const cCharcoal = rgb(23 / 255, 43 / 255, 54 / 255);         // #172B36 (Dark Slate Primary Text)
    const cMuted = rgb(95 / 255, 113 / 255, 128 / 255);          // #5F7180 (Secondary Text)
    const cMutedLight = rgb(148 / 255, 163 / 255, 184 / 255);    // #94A3B8 (Legal/Subtle)
    const cTableHeadBg = rgb(244 / 255, 247 / 255, 246 / 255);    // #F4F7F6 (Table Header Tint)
    const cBorder = rgb(226 / 255, 232 / 255, 240 / 255);        // #E2E8F0 (Subtle Border)
    const cWhite = rgb(1, 1, 1);

    // 1. Page Background Canvas
    page.drawRectangle({ x: 0, y: 0, width, height, color: cWhite });

    // 2. Framing Accent Bars (Top & Bottom: 70% Deep Green, 30% Gold)
    const barH = 4.5;
    page.drawRectangle({ x: 0, y: height - barH, width: width * 0.70, height: barH, color: cEmerald });
    page.drawRectangle({ x: width * 0.70, y: height - barH, width: width * 0.30, height: barH, color: cGold });
    page.drawRectangle({ x: 0, y: 0, width: width * 0.70, height: barH, color: cEmerald });
    page.drawRectangle({ x: width * 0.70, y: 0, width: width * 0.30, height: barH, color: cGold });

    // 3. Centralized Logo Watermark (Strictly 5% - 8% low opacity)
    const logoBytes = await getLogoBytes();
    let logoImg = null;
    let actualLogoHeight = 44;

    if (logoBytes) {
      try {
        logoImg = await pdfDoc.embedPng(logoBytes);
        const aspect = logoImg.height / logoImg.width;

        // Watermark: Large, centralized, low-opacity (6%) in the middle of document background
        const wmW = 320;
        const wmH = wmW * aspect;
        const wmX = (width - wmW) / 2;
        const wmY = (height - wmH) / 2;
        page.drawImage(logoImg, {
          x: wmX,
          y: wmY,
          width: wmW,
          height: wmH,
          opacity: 0.06 // 6% opacity
        });
      } catch (err) {
        console.warn('Could not embed PNG watermark into PDF:', err);
      }
    }

    // 4. Header Section: Logo at top-left, title strictly 'Invoice' at top-right in bold
    const headerTopY = height - 32;
    if (logoImg) {
      const targetLogoWidth = 105;
      actualLogoHeight = targetLogoWidth * (logoImg.height / logoImg.width);
      page.drawImage(logoImg, {
        x: marginX,
        y: headerTopY - actualLogoHeight,
        width: targetLogoWidth,
        height: actualLogoHeight
      });
    } else {
      page.drawText('WHIZ STUDIO', {
        x: marginX,
        y: headerTopY - 20,
        size: 20,
        font: fontBold,
        color: cEmerald
      });
      actualLogoHeight = 24;
    }

    // Document Title: Strictly 'Invoice' at top-right in bold
    const invoiceTitle = 'Invoice';
    const titleSize = 28;
    const titleW = fontBold.widthOfTextAtSize(invoiceTitle, titleSize);
    page.drawText(invoiceTitle, {
      x: rightAlignX - titleW,
      y: headerTopY - 24,
      size: titleSize,
      font: fontBold,
      color: cCharcoal
    });

    // Subtle horizontal divider line below header
    const headerDividerY = headerTopY - actualLogoHeight - 12;
    page.drawLine({
      start: { x: marginX, y: headerDividerY },
      end: { x: rightAlignX, y: headerDividerY },
      thickness: 1,
      color: cBorder
    });

    // 5. Meta Section: 'Billed to:' (Client CIF data) on left, Invoice No. & Dynamic Date on right
    const metaTopY = headerDividerY - 20;

    // Left Column: 'Billed to:' (Client CIF data)
    page.drawText('Billed to:', {
      x: marginX,
      y: metaTopY,
      size: 9.5,
      font: fontBold,
      color: cEmerald
    });

    const client = docData.client || {};
    const clientName = client.billingName || client.organizationName || client.fullName || docData.clientName || 'Valued Client';
    const companyName = client.companyName || '';
    const clientAddr = client.billingAddress || client.address || docData.clientAddress || 'Dhaka, Bangladesh';
    const clientCityCountry = [client.city, client.country, client.postalCode].filter(Boolean).join(', ');
    const clientContact = [client.phone, client.email].filter(Boolean).join('  •  ');

    let curClientY = metaTopY - 14;
    page.drawText(clientName, {
      x: marginX,
      y: curClientY,
      size: 11,
      font: fontBold,
      color: cCharcoal
    });
    curClientY -= 12;

    if (companyName && companyName.toLowerCase() !== clientName.toLowerCase()) {
      page.drawText(companyName, {
        x: marginX,
        y: curClientY,
        size: 9,
        font: fontBold,
        color: cEmeraldDark
      });
      curClientY -= 11;
    }

    const addrLines = wrapText(clientAddr, 42);
    addrLines.slice(0, 2).forEach(line => {
      page.drawText(line, {
        x: marginX,
        y: curClientY,
        size: 8.5,
        font: fontRegular,
        color: cMuted
      });
      curClientY -= 10.5;
    });

    if (clientCityCountry) {
      page.drawText(clientCityCountry, {
        x: marginX,
        y: curClientY,
        size: 8.5,
        font: fontRegular,
        color: cMuted
      });
      curClientY -= 10.5;
    }

    if (clientContact) {
      page.drawText(clientContact, {
        x: marginX,
        y: curClientY,
        size: 8,
        font: fontRegular,
        color: cMuted
      });
      curClientY -= 10.5;
    }

    // Right Column: Invoice No. & Dynamic Date (and Payment Status)
    const curr = (docData.currency || 'USD').toUpperCase();
    const docNumber = docData.invoiceNumber || docData.receiptNumber || 'WHIZ-INV-2026-0001';
    const issueDate = docData.issueDate || docData.paymentDate || '08 November, 2026';
    const rawStatus = (docData.status || 'PAID').toUpperCase().replace(/_/g, ' ');
    const isPaid = rawStatus === 'PAID' || rawStatus === 'CONFIRMED' || rawStatus === 'PAID IN FULL';
    const isPartial = rawStatus === 'PARTIALLY PAID' || rawStatus === 'PARTIAL';
    const statusLabel = isPaid ? 'PAID' : (isPartial ? 'PARTIALLY PAID' : 'PAYMENT DUE');

    let curMetaY = metaTopY;
    function drawMetaLine(label, value, isBoldVal = false, valColor = cCharcoal) {
      const valW = (isBoldVal ? fontBold : fontRegular).widthOfTextAtSize(value, 9);
      const labelW = fontBold.widthOfTextAtSize(label + '  ', 9);
      page.drawText(label, {
        x: rightAlignX - valW - labelW,
        y: curMetaY,
        size: 9,
        font: fontBold,
        color: cMuted
      });
      page.drawText(value, {
        x: rightAlignX - valW,
        y: curMetaY,
        size: 9,
        font: isBoldVal ? fontBold : fontRegular,
        color: valColor
      });
      curMetaY -= 14;
    }

    drawMetaLine('Invoice No:', docNumber, true, cCharcoal);
    drawMetaLine('Invoice Date:', issueDate);
    if (docData.dueDate) {
      drawMetaLine('Due Date:', docData.dueDate);
    }
    drawMetaLine('Payment Status:', statusLabel, true, isPaid ? cEmerald : (isPartial ? cGold : cCharcoal));
    drawMetaLine('Currency:', curr, true);

    // 6. Main Data Card: Itemized table inside a sleek rounded white card container
    const items = (docData.items && docData.items.length > 0) ? docData.items : [{
      description: docData.serviceName || 'Full-Service Digital Retainer',
      quantity: 1,
      unitPriceCents: docData.amountPaidCents || docData.totalCents || 0,
      totalCents: docData.amountPaidCents || docData.totalCents || 0
    }];

    const cardTopY = Math.min(curClientY, curMetaY) - 18;
    const thHeight = 28;
    const rowHeight = 32;
    const totalBlockH = 44;
    const cardRadius = 10;
    const cardHeight = thHeight + (items.length * rowHeight) + totalBlockH;
    const cardY = cardTopY - cardHeight;

    // Draw full card border & white fill
    drawRoundedCard(page, marginX, cardY, contentWidth, cardHeight, cardRadius, {
      fillColor: cWhite,
      borderColor: cBorder,
      borderWidth: 1.2
    });

    // Draw top-rounded header row inside card
    drawTopRoundedHeader(page, marginX, cardTopY - thHeight, contentWidth, thHeight, cardRadius, cTableHeadBg);

    // Divider below table header
    page.drawLine({
      start: { x: marginX, y: cardTopY - thHeight },
      end: { x: rightAlignX, y: cardTopY - thHeight },
      thickness: 1,
      color: cBorder
    });

    // Table Column Headers
    const colDescX = marginX + 16;
    const colQtyX = marginX + 300;
    const colRateX = marginX + 365;
    const colTotalX = rightAlignX - 16;

    page.drawText('Description', {
      x: colDescX,
      y: cardTopY - 18,
      size: 9,
      font: fontBold,
      color: cCharcoal
    });
    page.drawText('Qty', {
      x: colQtyX,
      y: cardTopY - 18,
      size: 9,
      font: fontBold,
      color: cCharcoal
    });
    page.drawText('Unit Price', {
      x: colRateX,
      y: cardTopY - 18,
      size: 9,
      font: fontBold,
      color: cCharcoal
    });
    const amtLabel = 'Amount';
    const amtW = fontBold.widthOfTextAtSize(amtLabel, 9);
    page.drawText(amtLabel, {
      x: colTotalX - amtW,
      y: cardTopY - 18,
      size: 9,
      font: fontBold,
      color: cCharcoal
    });

    // Itemized Table Rows
    let curRowY = cardTopY - thHeight;
    items.forEach((item, idx) => {
      // Divider line between items
      if (idx > 0) {
        page.drawLine({
          start: { x: marginX, y: curRowY },
          end: { x: rightAlignX, y: curRowY },
          thickness: 0.6,
          color: cBorder
        });
      }

      const itemDesc = item.description || 'Digital Retainer';
      page.drawText(itemDesc, {
        x: colDescX,
        y: curRowY - 17,
        size: 9.5,
        font: fontBold,
        color: cCharcoal
      });

      const qtyStr = String(item.quantity || 1);
      page.drawText(qtyStr, {
        x: colQtyX + 4,
        y: curRowY - 17,
        size: 9,
        font: fontRegular,
        color: cCharcoal
      });

      const unitCents = item.unitPriceCents ?? item.unit_price_cents ?? (item.unitPrice ? Math.round(item.unitPrice * 100) : 0);
      const lineTotalCents = item.totalCents ?? item.total_cents ?? (item.amount ? Math.round(item.amount * 100) : (unitCents * (item.quantity || 1)));

      page.drawText(formatMoney(unitCents, curr), {
        x: colRateX,
        y: curRowY - 17,
        size: 9,
        font: fontRegular,
        color: cCharcoal
      });

      const lineTotalStr = formatMoney(lineTotalCents, curr);
      const lineW = fontBold.widthOfTextAtSize(lineTotalStr, 9.5);
      page.drawText(lineTotalStr, {
        x: colTotalX - lineW,
        y: curRowY - 17,
        size: 9.5,
        font: fontBold,
        color: cCharcoal
      });

      curRowY -= rowHeight;
    });

    // 7. Total Block: Solid block of the brand's primary color (Deep Green) at bottom of rounded card
    const subtotalCents = docData.subtotalCents ?? docData.subtotal_cents ?? (docData.subtotal ? Math.round(docData.subtotal * 100) : 0);
    const taxCents = docData.taxCents ?? docData.tax_cents ?? 0;
    const totalCents = docData.totalInvoiceAmountCents ?? docData.totalCents ?? docData.total_cents ?? (docData.total ? Math.round(docData.total * 100) : (subtotalCents + taxCents || items.reduce((s, i) => s + (i.totalCents || 0), 0)));
    const totalFormatted = formatMoney(totalCents, curr);

    drawBottomRoundedTotalBlock(page, marginX, cardY, contentWidth, totalBlockH, cardRadius, cEmerald);

    // Crisp White Text: 'Total Amount' on left, Value on right
    page.drawText('Total Amount', {
      x: marginX + 18,
      y: cardY + (totalBlockH / 2) - 4,
      size: 11.5,
      font: fontBold,
      color: cWhite
    });

    const totValW = fontBold.widthOfTextAtSize(totalFormatted, 13.5);
    page.drawText(totalFormatted, {
      x: rightAlignX - 18 - totValW,
      y: cardY + (totalBlockH / 2) - 5,
      size: 13.5,
      font: fontBold,
      color: cWhite
    });

    // 8. Payment Info & Agency Details (Bottom section, NO duplicate address)
    const bottomSecY = cardY - 26;

    // Left: 'Payment Info:'
    page.drawText('Payment Info:', {
      x: marginX,
      y: bottomSecY,
      size: 9,
      font: fontBold,
      color: cEmerald
    });

    const acctDetails = docData.paymentAccountDetails || {
      providerName: 'Bkash / Bank Transfer',
      accountName: 'Md Kazi Abdur Rahim Emon',
      accountNumber: '+880 1560066374'
    };

    let curPayY = bottomSecY - 13;
    function drawPayInfoRow(lbl, val) {
      page.drawText(lbl, {
        x: marginX,
        y: curPayY,
        size: 8,
        font: fontBold,
        color: cMuted
      });
      page.drawText(val, {
        x: marginX + 80,
        y: curPayY,
        size: 8,
        font: fontRegular,
        color: cCharcoal
      });
      curPayY -= 11.5;
    }

    drawPayInfoRow('Payment Method:', docData.paymentMethod || 'Mobile Banking (MFS) / Bank Wire');
    drawPayInfoRow('Account Name:', acctDetails.accountName || 'Md Kazi Abdur Rahim Emon');
    drawPayInfoRow('Account Number:', acctDetails.accountNumber || '+880 1560066374');
    if (acctDetails.bankName) {
      drawPayInfoRow('Bank / Branch:', `${acctDetails.bankName}${acctDetails.branchName ? ' (' + acctDetails.branchName + ')' : ''}`);
    }

    // Right: Agency Contact & Address (Single authoritative occurrence, NO duplication)
    const issuer = docData.issuer || docData.agency || {
      name: 'Whiz Studio',
      address: 'House 53, Road 7, Block A, Mirpur 12, Dhaka 1216, Bangladesh',
      phone: '+880 1815127022',
      email: 'info@whizstudio.art',
      website: 'whizstudio.art'
    };

    const agencyColX = marginX + (contentWidth / 2) + 20;
    page.drawText('Issued by:', {
      x: agencyColX,
      y: bottomSecY,
      size: 9,
      font: fontBold,
      color: cEmerald
    });

    let curAgencyY = bottomSecY - 13;
    page.drawText(issuer.name || 'Whiz Studio', {
      x: agencyColX,
      y: curAgencyY,
      size: 9,
      font: fontBold,
      color: cCharcoal
    });
    curAgencyY -= 11.5;

    page.drawText(issuer.address || 'House 53, Road 7, Block A, Mirpur 12, Dhaka 1216, Bangladesh', {
      x: agencyColX,
      y: curAgencyY,
      size: 7.8,
      font: fontRegular,
      color: cMuted
    });
    curAgencyY -= 10.5;

    const agencyContact = `Phone: ${issuer.phone || '+880 1815127022'}  •  Email: ${issuer.email || 'info@whizstudio.art'}`;
    page.drawText(agencyContact, {
      x: agencyColX,
      y: curAgencyY,
      size: 7.8,
      font: fontRegular,
      color: cMuted
    });
    curAgencyY -= 10.5;

    page.drawText(`Website: ${issuer.website ? issuer.website.replace(/^https?:\/\//, '') : 'whizstudio.art'}`, {
      x: agencyColX,
      y: curAgencyY,
      size: 7.8,
      font: fontRegular,
      color: cMuted
    });

    // 9. Mandatory Footer (Centered, system-generated notice, zero physical signature block)
    const footerY = 28;
    page.drawLine({
      start: { x: marginX, y: footerY + 16 },
      end: { x: rightAlignX, y: footerY + 16 },
      thickness: 0.8,
      color: cBorder
    });

    const disclaimerText = 'This is a system-generated online invoice. No physical signature or seal is required.';
    const discW = fontRegular.widthOfTextAtSize(disclaimerText, 8);
    page.drawText(disclaimerText, {
      x: (width - discW) / 2,
      y: footerY + 4,
      size: 8,
      font: fontOblique,
      color: cMuted
    });

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
