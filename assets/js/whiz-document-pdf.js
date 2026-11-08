/**
 * WHIZ STUDIO — OFFICIAL CORPORATE PDF INVOICE ENGINE
 * "Standard Minimalist Corporate A4 Stationery"
 *
 * Design Architecture:
 * - Standard A4 (210 x 297 mm = 595.28 x 841.89 pt)
 * - Minimalist, Human-Designed Corporate Financial Layout (Zero AI-Style UI Boxes)
 * - Brand Palette: Deep Emerald (#087F70), Warm Gold (#C69A40), Dark Slate (#172B36), Charcoal (#20312E)
 * - Top & Bottom Framing Accents: Slim dual-tone brand bars (Deep Green & Gold) at very top and very bottom
 * - Crisp High-Resolution Official Logo Rendering (preserves exact aspect ratio, no distortion)
 * - Deduplicated Single-Occurrence Header: Logo + Company Contact Details only once at top left
 * - Document Title strictly 'INVOICE' with Gold hairline accent
 * - Clean Typography Grid: BILLED TO (Left) & PAYMENT DETAILS (Right) with zero button/pill styling
 * - Clean Accounting Data Table (DESCRIPTION, QTY, UNIT PRICE, TOTAL) with subtle divider rules
 * - Clean Right-Aligned Financial Totals with classic accounting hairlines
 * - Minimal System-Generated Compliance Footer without jargon or physical signature boxes
 * - Pure Client-Side Vector Execution via pdf-lib in browser memory (Zero server storage)
 */

(function (global) {
  'use strict';

  let cachedLogoBytes = null;

  async function getLogoBytes() {
    if (cachedLogoBytes) return cachedLogoBytes;
    try {
      if (typeof window !== 'undefined' && window.location) {
        // Fetch official company logo without changing the file
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
    const cTableHeadBg = rgb(248 / 255, 250 / 255, 252 / 255);    // #F8FAFC (Subtle Table Header Tint)
    const cRowAltBg = rgb(253 / 255, 254 / 255, 254 / 255);      // #FDFEFE
    const cBorder = rgb(226 / 255, 232 / 255, 240 / 255);        // #E2E8F0 (Subtle Hairline)
    const cBorderDark = rgb(203 / 255, 213 / 255, 225 / 255);    // #CBD5E1
    const cWhite = rgb(1, 1, 1);

    // 1. Crisp White Page Canvas
    page.drawRectangle({ x: 0, y: 0, width, height, color: cWhite });

    // 2. Top Framing Accent (Slim horizontal bar: 70% Deep Green, 30% Gold)
    const accentBarH = 4.5;
    page.drawRectangle({ x: 0, y: height - accentBarH, width: width * 0.70, height: accentBarH, color: cEmerald });
    page.drawRectangle({ x: width * 0.70, y: height - accentBarH, width: width * 0.30, height: accentBarH, color: cGold });

    // 3. Bottom Framing Accent (Matching slim bar at very bottom)
    page.drawRectangle({ x: 0, y: 0, width: width * 0.70, height: accentBarH, color: cEmerald });
    page.drawRectangle({ x: width * 0.70, y: 0, width: width * 0.30, height: accentBarH, color: cGold });

    // =========================================================================
    // 4. CONSOLIDATED MINIMALIST HEADER (Strictly Deduplicated)
    // Left: Crisp Logo + Single Company Contact Block
    // Right: Document Title 'INVOICE' + Clean Typographic Metadata
    // =========================================================================
    const headerTopY = height - 28;

    // A. Official Company Logo Rendering (Clean, High-Quality, Exact Aspect Ratio)
    const logoBytes = await getLogoBytes();
    let logoDrawn = false;
    let actualLogoHeight = 44;

    if (logoBytes) {
      try {
        const logoImage = await pdfDoc.embedPng(logoBytes);
        // Calculate true aspect ratio
        const logoAspect = logoImage.height / logoImage.width;
        const targetLogoWidth = 138;
        actualLogoHeight = targetLogoWidth * logoAspect; // Native proportional height

        page.drawImage(logoImage, {
          x: marginX,
          y: headerTopY - actualLogoHeight,
          width: targetLogoWidth,
          height: actualLogoHeight
        });
        logoDrawn = true;
      } catch (err) {
        console.warn('Could not embed PNG logo into PDF, falling back to clean brand typography:', err);
      }
    }

    if (!logoDrawn) {
      page.drawText('WHIZ STUDIO', {
        x: marginX,
        y: headerTopY - 18,
        size: 18,
        font: fontBold,
        color: cEmerald
      });
      actualLogoHeight = 24;
    }

    // B. Single Authoritative Company Information Block (Directly beneath logo)
    const issuer = docData.issuer || docData.agency || {};
    const issuerY = headerTopY - actualLogoHeight - 12;

    page.drawText(issuer.legalName || 'Whiz Studio', {
      x: marginX,
      y: issuerY,
      size: 9.5,
      font: fontBold,
      color: cCharcoal
    });
    page.drawText(issuer.tagline || 'Digital Marketing & Growth Agency', {
      x: marginX,
      y: issuerY - 11,
      size: 7.5,
      font: fontRegular,
      color: cMuted
    });
    page.drawText(issuer.address || 'House 53, Road 7, Block A, Mirpur 12, Dhaka 1216, Bangladesh', {
      x: marginX,
      y: issuerY - 21.5,
      size: 7.5,
      font: fontRegular,
      color: cMuted
    });
    const issuerContactLine = `Phone: ${issuer.phone || '+880 1815127022'}  •  Email: ${issuer.email || 'info@whizstudio.art'}  •  Web: ${issuer.website ? issuer.website.replace(/^https?:\/\//, '') : 'whizstudio.art'}`;
    page.drawText(issuerContactLine, {
      x: marginX,
      y: issuerY - 32,
      size: 7.5,
      font: fontRegular,
      color: cMuted
    });

    // C. Header Right: Document Title Strictly 'INVOICE'
    const docTitle = 'INVOICE';
    const titleSize = 26;
    const titleW = fontBold.widthOfTextAtSize(docTitle, titleSize);

    page.drawText(docTitle, {
      x: rightAlignX - titleW,
      y: headerTopY - 16,
      size: titleSize,
      font: fontBold,
      color: cEmerald
    });

    // Subtle Gold Hairline Accent below title
    page.drawLine({
      start: { x: rightAlignX - titleW, y: headerTopY - 22 },
      end: { x: rightAlignX, y: headerTopY - 22 },
      thickness: 1.5,
      color: cGold
    });

    // Clean Typographic Metadata (No Button/Pill UI Boxes)
    const docNumber = docData.invoiceNumber || docData.receiptNumber || 'WHIZ-INV-2026-0001';
    const issueDate = docData.issueDate || docData.paymentDate || '08 November, 2026';
    const curr = (docData.currency || 'USD').toUpperCase();
    const rawStatus = (docData.status || 'PAID').toUpperCase().replace(/_/g, ' ');
    const isPaid = rawStatus === 'PAID' || rawStatus === 'CONFIRMED' || rawStatus === 'PAID IN FULL';
    const isPartial = rawStatus === 'PARTIALLY PAID' || rawStatus === 'PARTIAL';
    const statusText = isPaid ? 'PAID' : (isPartial ? 'PARTIALLY PAID' : 'PAYMENT DUE');

    let metaY = headerTopY - 38;
    const metaLineGap = 13;

    function drawHeaderMeta(label, value, isBoldVal = false, valColor = cCharcoal) {
      const valW = (isBoldVal ? fontBold : fontRegular).widthOfTextAtSize(value, 8.5);
      const labelW = fontBold.widthOfTextAtSize(label + '  ', 8.5);
      page.drawText(label, {
        x: rightAlignX - valW - labelW,
        y: metaY,
        size: 8.5,
        font: fontBold,
        color: cMuted
      });
      page.drawText(value, {
        x: rightAlignX - valW,
        y: metaY,
        size: 8.5,
        font: isBoldVal ? fontBold : fontRegular,
        color: valColor
      });
      metaY -= metaLineGap;
    }

    drawHeaderMeta('Invoice Number:', docNumber, true, cCharcoal);
    drawHeaderMeta('Invoice Date:', issueDate);
    if (docData.dueDate) {
      drawHeaderMeta('Due Date:', docData.dueDate);
    }
    // Clean Typographic Status (No Pill/Web Button Outline)
    drawHeaderMeta('Payment Status:', statusText, true, isPaid ? cEmerald : (isPartial ? cGold : cCharcoal));
    drawHeaderMeta('Currency:', curr);

    // D. Header Horizontal Divider Rule
    const headerDividerY = headerTopY - 105;
    page.drawLine({
      start: { x: marginX, y: headerDividerY },
      end: { x: rightAlignX, y: headerDividerY },
      thickness: 0.75,
      color: cBorder
    });

    // =========================================================================
    // 5. BILLED TO & PAYMENT DETAILS (Clean Typographic 2-Column Section)
    // Completely removed AI-style boxed cards, outlines, and badges
    // =========================================================================
    const sectionTopY = headerDividerY - 18;
    const col2X = marginX + (contentWidth / 2) + 12;

    // Left Column: BILLED TO
    page.drawText('BILLED TO:', {
      x: marginX,
      y: sectionTopY,
      size: 8,
      font: fontBold,
      color: cEmerald
    });

    const client = docData.client || {};
    const clientName = client.billingName || client.organizationName || client.fullName || docData.clientName || 'Valued Client';
    const companyName = client.companyName || '';
    const clientAddr = client.billingAddress || client.address || docData.clientAddress || 'Dhaka, Bangladesh';
    const clientCityCountry = [client.city, client.country, client.postalCode].filter(Boolean).join(', ');
    const clientPhone = client.phone || docData.clientPhone || '';
    const clientEmail = client.email || docData.clientEmail || '';

    let clientCurY = sectionTopY - 14;
    page.drawText(clientName, {
      x: marginX,
      y: clientCurY,
      size: 10.5,
      font: fontBold,
      color: cCharcoal
    });
    clientCurY -= 12;

    if (companyName && companyName.toLowerCase() !== clientName.toLowerCase()) {
      page.drawText(companyName, {
        x: marginX,
        y: clientCurY,
        size: 8.5,
        font: fontBold,
        color: cEmeraldDark
      });
      clientCurY -= 11;
    }

    const wrappedAddr = wrapText(clientAddr, 42);
    wrappedAddr.slice(0, 2).forEach(line => {
      page.drawText(line, {
        x: marginX,
        y: clientCurY,
        size: 8,
        font: fontRegular,
        color: cMuted
      });
      clientCurY -= 10.5;
    });

    if (clientCityCountry) {
      page.drawText(clientCityCountry, {
        x: marginX,
        y: clientCurY,
        size: 8,
        font: fontRegular,
        color: cMuted
      });
      clientCurY -= 10.5;
    }

    const contactStr = [clientEmail, clientPhone].filter(Boolean).join('  •  ');
    if (contactStr) {
      page.drawText(contactStr, {
        x: marginX,
        y: clientCurY,
        size: 7.5,
        font: fontRegular,
        color: cMuted
      });
    }

    // Right Column: PAYMENT & SETTLEMENT DETAILS (Clean Minimalist Typography)
    page.drawText('PAYMENT DETAILS:', {
      x: col2X,
      y: sectionTopY,
      size: 8,
      font: fontBold,
      color: cEmerald
    });

    const paymentMethodRaw = docData.paymentMethod || 'Bank Transfer / Wire';
    const paymentRef = docData.paymentReference || 'TXN-CONFIRMED';
    const serviceName = docData.serviceName || docData.description || 'Digital Retainer Service';

    let rightCurY = sectionTopY - 14;
    function drawDetailRow(lbl, val, isBoldVal = false) {
      page.drawText(lbl, {
        x: col2X,
        y: rightCurY,
        size: 8,
        font: fontBold,
        color: cMuted
      });
      page.drawText(val, {
        x: col2X + 96,
        y: rightCurY,
        size: 8,
        font: isBoldVal ? fontBold : fontRegular,
        color: cCharcoal
      });
      rightCurY -= 12;
    }

    drawDetailRow('Payment Method:', paymentMethodRaw);
    drawDetailRow('Transaction Ref:', paymentRef, true);
    drawDetailRow('Payment Date:', issueDate);
    drawDetailRow('Settlement:', 'Cleared & Reconciled');

    const acctDetails = docData.paymentAccountDetails;
    if (acctDetails && (acctDetails.accountName || acctDetails.providerName)) {
      const acctStr = `${acctDetails.providerName || 'Account'}: ${acctDetails.accountNumber || acctDetails.accountName || ''}`;
      drawDetailRow('Settlement Acct:', acctStr);
    }

    // =========================================================================
    // 6. ITEMIZED ACCOUNTING DATA TABLE
    // Clean subtle borders, light gray header row, clear typography
    // =========================================================================
    const tableTopY = sectionTopY - 78;
    const thHeight = 22;

    // Shaded Header Row Background
    page.drawRectangle({
      x: marginX,
      y: tableTopY - thHeight,
      width: contentWidth,
      height: thHeight,
      color: cTableHeadBg
    });

    // Top and Bottom Subtle Table Dividers
    page.drawLine({
      start: { x: marginX, y: tableTopY },
      end: { x: rightAlignX, y: tableTopY },
      thickness: 1,
      color: cBorderDark
    });
    page.drawLine({
      start: { x: marginX, y: tableTopY - thHeight },
      end: { x: rightAlignX, y: tableTopY - thHeight },
      thickness: 0.8,
      color: cBorderDark
    });

    const colDescX = marginX + 8;
    const colQtyX = marginX + 310;
    const colRateX = marginX + 380;
    const colTotalX = rightAlignX - 8;

    page.drawText('DESCRIPTION', {
      x: colDescX,
      y: tableTopY - 14.5,
      size: 7.5,
      font: fontBold,
      color: cCharcoal
    });
    page.drawText('QTY', {
      x: colQtyX,
      y: tableTopY - 14.5,
      size: 7.5,
      font: fontBold,
      color: cCharcoal
    });
    page.drawText('UNIT PRICE', {
      x: colRateX,
      y: tableTopY - 14.5,
      size: 7.5,
      font: fontBold,
      color: cCharcoal
    });
    const colTotalLabel = 'TOTAL';
    const colTotalW = fontBold.widthOfTextAtSize(colTotalLabel, 7.5);
    page.drawText(colTotalLabel, {
      x: colTotalX - colTotalW,
      y: tableTopY - 14.5,
      size: 7.5,
      font: fontBold,
      color: cCharcoal
    });

    // Populate Itemized Rows
    const items = (docData.items && docData.items.length > 0) ? docData.items : [{
      description: serviceName,
      quantity: 1,
      unitPriceCents: docData.amountPaidCents || docData.totalCents || 0,
      totalCents: docData.amountPaidCents || docData.totalCents || 0
    }];

    let rowY = tableTopY - thHeight;
    const rowHeight = 30;

    items.forEach((item, index) => {
      if (index % 2 === 1) {
        page.drawRectangle({
          x: marginX,
          y: rowY - rowHeight,
          width: contentWidth,
          height: rowHeight,
          color: cRowAltBg
        });
      }

      // Subtle hairline row divider
      page.drawLine({
        start: { x: marginX, y: rowY - rowHeight },
        end: { x: rightAlignX, y: rowY - rowHeight },
        thickness: 0.5,
        color: cBorder
      });

      // Description
      const itemDesc = item.description || 'Professional Marketing Retainer';
      page.drawText(itemDesc, {
        x: colDescX,
        y: rowY - 14,
        size: 8.5,
        font: fontBold,
        color: cCharcoal
      });

      // Sub-package/category if present
      const subInfo = [docData.servicePackage, docData.serviceCategory].filter(Boolean).join('  •  ');
      if (subInfo) {
        page.drawText(subInfo, {
          x: colDescX,
          y: rowY - 23,
          size: 7,
          font: fontRegular,
          color: cMuted
        });
      }

      // Qty
      const qtyStr = String(item.quantity || 1);
      page.drawText(qtyStr, {
        x: colQtyX + 4,
        y: rowY - 15,
        size: 8.5,
        font: fontRegular,
        color: cCharcoal
      });

      // Unit Price
      const itemUnitCents = item.unitPriceCents ?? item.unit_price_cents ?? (item.unitPrice ? Math.round(item.unitPrice * 100) : 0);
      const itemTotalCents = item.totalCents ?? item.total_cents ?? (item.amount ? Math.round(item.amount * 100) : (itemUnitCents * (item.quantity || 1)));

      page.drawText(formatMoney(itemUnitCents, curr), {
        x: colRateX,
        y: rowY - 15,
        size: 8.5,
        font: fontRegular,
        color: cCharcoal
      });

      // Line Total
      const totalStr = formatMoney(itemTotalCents, curr);
      const totalStrW = fontBold.widthOfTextAtSize(totalStr, 8.5);
      page.drawText(totalStr, {
        x: colTotalX - totalStrW,
        y: rowY - 15,
        size: 8.5,
        font: fontBold,
        color: cCharcoal
      });

      rowY -= rowHeight;
    });

    // =========================================================================
    // 7. FINANCIAL TOTALS SECTION (Clean Right-Aligned Typography)
    // Strictly removed tinted AI-style UI boxes around amounts
    // =========================================================================
    const totalsTopY = rowY - 16;
    const totalsWidth = 220;
    const totalsX = rightAlignX - totalsWidth;

    const subtotalCents = docData.subtotalCents ?? docData.subtotal_cents ?? (docData.subtotal ? Math.round(docData.subtotal * 100) : 0);
    const taxCents = docData.taxCents ?? docData.tax_cents ?? (docData.vatAmount ? Math.round(docData.vatAmount * 100) : 0);
    const totalCents = docData.totalInvoiceAmountCents ?? docData.totalCents ?? docData.total_cents ?? (docData.total ? Math.round(docData.total * 100) : (subtotalCents + taxCents));
    const amountPaidCents = docData.amountPaidCents ?? docData.amount_paid_cents ?? (docData.amountPaid ? Math.round(docData.amountPaid * 100) : totalCents);
    const balanceCents = docData.remainingBalanceCents !== undefined
      ? docData.remainingBalanceCents
      : (docData.outstandingBalanceCents !== undefined
        ? docData.outstandingBalanceCents
        : Math.max(0, totalCents - amountPaidCents));

    // Optional Clean Notes on Left (No Fluff/Jargon)
    if (docData.notes) {
      const notesLeftWidth = contentWidth - totalsWidth - 24;
      page.drawText('Notes:', {
        x: marginX,
        y: totalsTopY - 4,
        size: 8,
        font: fontBold,
        color: cEmerald
      });
      const cleanNoteLines = wrapText(docData.notes, 52);
      cleanNoteLines.slice(0, 3).forEach((line, idx) => {
        page.drawText(line, {
          x: marginX,
          y: totalsTopY - 16 - (idx * 10.5),
          size: 7.5,
          font: fontRegular,
          color: cMuted
        });
      });
    }

    // Right-Aligned Accounting Totals (Clean Lines & Fonts)
    let curTotalY = totalsTopY;
    function drawAccountingRow(label, amtStr, isBold = false, isAccent = false) {
      const sz = isBold ? 9.5 : 8.5;
      page.drawText(label, {
        x: totalsX,
        y: curTotalY - 8,
        size: sz,
        font: isBold ? fontBold : fontRegular,
        color: isAccent ? cEmerald : cCharcoal
      });
      const amtW = (isBold ? fontBold : fontRegular).widthOfTextAtSize(amtStr, sz);
      page.drawText(amtStr, {
        x: rightAlignX - amtW,
        y: curTotalY - 8,
        size: sz,
        font: isBold ? fontBold : fontRegular,
        color: isAccent ? cEmerald : cCharcoal
      });
      curTotalY -= 15;
    }

    drawAccountingRow('Subtotal:', formatMoney(totalCents, curr));
    drawAccountingRow('Amount Paid:', formatMoney(amountPaidCents, curr), true, isPaid);

    // Subtle divider above Total Due
    page.drawLine({
      start: { x: totalsX, y: curTotalY - 2 },
      end: { x: rightAlignX, y: curTotalY - 2 },
      thickness: 0.8,
      color: cBorderDark
    });
    curTotalY -= 4;

    // Total Due
    const balanceStr = formatMoney(balanceCents, curr);
    const balW = fontBold.widthOfTextAtSize(balanceStr, 11);
    page.drawText('TOTAL DUE:', {
      x: totalsX,
      y: curTotalY - 10,
      size: 11,
      font: fontBold,
      color: cCharcoal
    });
    page.drawText(balanceStr, {
      x: rightAlignX - balW,
      y: curTotalY - 10,
      size: 11,
      font: fontBold,
      color: balanceCents > 0 ? cGold : cCharcoal
    });

    // Double bottom accounting underline under Total Due
    page.drawLine({
      start: { x: totalsX, y: curTotalY - 16 },
      end: { x: rightAlignX, y: curTotalY - 16 },
      thickness: 0.6,
      color: cBorderDark
    });
    page.drawLine({
      start: { x: totalsX, y: curTotalY - 18.5 },
      end: { x: rightAlignX, y: curTotalY - 18.5 },
      thickness: 0.6,
      color: cBorderDark
    });

    // =========================================================================
    // 8. MINIMAL SYSTEM-GENERATED COMPLIANCE FOOTER
    // Clean, professional, zero redundant address or jargon
    // =========================================================================
    const footerY = 32;

    // Footer Divider Line
    page.drawLine({
      start: { x: marginX, y: footerY + 18 },
      end: { x: rightAlignX, y: footerY + 18 },
      thickness: 0.75,
      color: cBorder
    });
    // Centered Gold Hairline Notch
    page.drawLine({
      start: { x: width / 2 - 28, y: footerY + 18 },
      end: { x: width / 2 + 28, y: footerY + 18 },
      thickness: 1.5,
      color: cGold
    });

    const disclaimerText = 'This is a system-generated online invoice. No physical signature or seal is required.';
    const discW = fontRegular.widthOfTextAtSize(disclaimerText, 7.5);
    page.drawText(disclaimerText, {
      x: (width - discW) / 2,
      y: footerY + 6,
      size: 7.5,
      font: fontOblique,
      color: cMuted
    });

    const footerBottom = 'Whiz Studio  •  House 53, Road 7, Block A, Mirpur 12, Dhaka 1216, Bangladesh  •  https://whizstudio.art';
    const fBottomW = fontRegular.widthOfTextAtSize(footerBottom, 6.8);
    page.drawText(footerBottom, {
      x: (width - fBottomW) / 2,
      y: footerY - 4,
      size: 6.8,
      font: fontRegular,
      color: cMutedLight
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
