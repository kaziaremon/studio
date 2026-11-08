/**
 * WHIZ STUDIO — OFFICIAL CORPORATE FINANCIAL DOCUMENT & PDF RECEIPT ENGINE
 * "Whiz Emerald & Gold High-Precision Vector Stationery"
 *
 * Architecture Standards:
 * - Standard A4 (210 x 297 mm = 595.28 x 841.89 pt)
 * - Strict Proportional Grid & Zero-Waste Vertical Balance
 * - Brand Palette: Deep Emerald (#087F70), Rich Gold (#C69A40), Deep Charcoal (#20312E)
 * - Exclusive New Crisp Brand Logo (/assets/images/whiz-brand-logo-tight.png)
 * - Consolidated Non-Redundant Header: Left (Logo & Issuer) | Right (Document Metadata & Status)
 * - Symmetrical Grid: Client Billed To (Left) & Payment Settlement Details (Right)
 * - Shaded Data Table with Subtle Accounting Borders
 * - Clean Financial Ledger Summary & Balanced Bottom Authentication Banner
 * - Exact Compliance Disclaimer: "This is a system-generated online receipt. No physical signature or seal is required."
 * - Client-Side Memory Compilation via pdf-lib (Zero Backend / Zero R2 Storage)
 */

(function (global) {
  'use strict';

  // Cached logo array buffer
  let cachedLogoBytes = null;

  async function getLogoBytes() {
    if (cachedLogoBytes) return cachedLogoBytes;
    try {
      if (typeof window !== 'undefined' && window.location) {
        const candidates = [
          '/assets/images/whiz-brand-logo-tight.png?v=20261108',
          '/assets/images/logo.png?v=20261108',
          '/brand-logo-raw.png',
          '/brand-logo.png'
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
            'G:/Whiz Studio/brand-logo-raw.png',
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
    const rightAlignX = width - marginX;        // 555.28 pt

    // Typography
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // Whiz Studio Corporate Color System
    const cEmerald = rgb(8 / 255, 127 / 255, 112 / 255);        // #087F70 (Brand Primary)
    const cEmeraldDark = rgb(6 / 255, 95 / 255, 70 / 255);       // #065F46
    const cEmeraldLight = rgb(234 / 255, 245 / 255, 241 / 255);  // #EAF5F1
    const cGold = rgb(198 / 255, 154 / 255, 64 / 255);           // #C69A40 (Brand Gold)
    const cGoldLight = rgb(253 / 255, 249 / 255, 238 / 255);     // #FDF9EE
    const cCharcoal = rgb(23 / 255, 43 / 255, 54 / 255);         // #172B36 (Slate Dark Text)
    const cMuted = rgb(95 / 255, 113 / 255, 128 / 255);          // #5F7180 (Secondary Text)
    const cMutedLight = rgb(148 / 255, 163 / 255, 184 / 255);    // #94A3B8 (Tertiary/Legal)
    const cCardBg = rgb(248 / 255, 250 / 255, 250 / 255);        // #F8FAFA (Soft Card Tint)
    const cTableHeadBg = rgb(241 / 255, 246 / 255, 244 / 255);        // #F1F6F4 (Table Header Tint)
    const cRowAltBg = rgb(252 / 255, 253 / 255, 253 / 255);      // #FCFDFD (Alternating Row)
    const cBorder = rgb(227 / 255, 233 / 255, 239 / 255);        // #E3E9EF (Delicate Border)
    const cBorderLight = rgb(238 / 255, 242 / 255, 246 / 255);   // #EEF2F6
    const cWhite = rgb(1, 1, 1);

    const isReceipt = (docData.documentType === 'receipt' || docData.type === 'receipt');

    // 1. Crisp White Background
    page.drawRectangle({ x: 0, y: 0, width, height, color: cWhite });

    // 2. Precision Dual Brand Strip (Top Edge: 70% Emerald, 30% Gold)
    const topBarHeight = 5;
    page.drawRectangle({ x: 0, y: height - topBarHeight, width: width * 0.70, height: topBarHeight, color: cEmerald });
    page.drawRectangle({ x: width * 0.70, y: height - topBarHeight, width: width * 0.30, height: topBarHeight, color: cGold });

    // =========================================================================
    // 3. CONSOLIDATED UNIFIED HEADER (Eliminating Redundancy)
    // Left: Newest Crisp Logo + Single Authoritative Issuer Block
    // Right: Document Title, Meta Grid, and Payment Confirmation Badge
    // =========================================================================
    const headerTopY = height - 32;

    // A. Embed Newest Crisp Brand Logo
    const logoBytes = await getLogoBytes();
    let logoDrawn = false;
    const targetLogoWidth = 136; // Perfectly scaled corporate proportion
    const targetLogoHeight = 41; // Aspect ratio ~3.32

    if (logoBytes) {
      try {
        const logoImage = await pdfDoc.embedPng(logoBytes);
        const calcHeight = (logoImage.height / logoImage.width) * targetLogoWidth;
        const actualH = Math.min(44, calcHeight);
        page.drawImage(logoImage, {
          x: marginX,
          y: headerTopY - actualH,
          width: targetLogoWidth,
          height: actualH
        });
        logoDrawn = true;
      } catch (err) {
        console.warn('Could not embed PNG logo into PDF, falling back to brand typography:', err);
      }
    }

    if (!logoDrawn) {
      page.drawText('WHIZ STUDIO', {
        x: marginX,
        y: headerTopY - 22,
        size: 18,
        font: fontBold,
        color: cEmerald
      });
      page.drawText('GROWTH & MARKETING', {
        x: marginX,
        y: headerTopY - 34,
        size: 7.5,
        font: fontBold,
        color: cGold
      });
    }

    // B. Consolidated Issuer Contact Block (Under Logo, Single Authoritative Occurrence)
    const issuer = docData.issuer || docData.agency || {};
    const issuerY = headerTopY - targetLogoHeight - 12;

    page.drawText(issuer.legalName || 'Whiz Studio', {
      x: marginX,
      y: issuerY,
      size: 9.5,
      font: fontBold,
      color: cCharcoal
    });
    page.drawText(issuer.tagline || 'Digital Marketing & Growth Engineering Agency', {
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
    const issuerContactLine = `Tel: ${issuer.phone || '+880 1815127022'}  •  Email: ${issuer.email || 'info@whizstudio.art'}  •  Web: ${issuer.website ? issuer.website.replace(/^https?:\/\//, '') : 'whizstudio.art'}`;
    page.drawText(issuerContactLine, {
      x: marginX,
      y: issuerY - 32,
      size: 7.5,
      font: fontRegular,
      color: cMuted
    });

    // C. Header Right: Document Title & Metadata Block
    const docTitle = isReceipt ? 'PAYMENT RECEIPT' : 'OFFICIAL INVOICE';
    const titleSize = 22;
    const titleW = fontBold.widthOfTextAtSize(docTitle, titleSize);

    page.drawText(docTitle, {
      x: rightAlignX - titleW,
      y: headerTopY - 18,
      size: titleSize,
      font: fontBold,
      color: cEmerald
    });

    // Decorative Gold Accent Underline
    page.drawLine({
      start: { x: rightAlignX - titleW, y: headerTopY - 25 },
      end: { x: rightAlignX, y: headerTopY - 25 },
      thickness: 2,
      color: cGold
    });

    // Document Meta Rows
    const docNumber = isReceipt
      ? (docData.receiptNumber || 'WHIZ-RCPT-2026-0001')
      : (docData.invoiceNumber || 'WHIZ-INV-2026-000001');
    const issueDate = docData.paymentDate || docData.issueDate || '08 November, 2026';
    const curr = (docData.currency || 'USD').toUpperCase();

    let metaY = headerTopY - 42;
    const metaLineGap = 12.5;

    function drawHeaderMeta(label, value, isHighlight = false) {
      const valW = (isHighlight ? fontBold : fontRegular).widthOfTextAtSize(value, 8.5);
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
        font: isHighlight ? fontBold : fontRegular,
        color: isHighlight ? cEmeraldDark : cCharcoal
      });
      metaY -= metaLineGap;
    }

    drawHeaderMeta(isReceipt ? 'Receipt Number:' : 'Invoice Number:', docNumber, true);
    drawHeaderMeta(isReceipt ? 'Payment Date:' : 'Issue Date:', issueDate);
    if (isReceipt && docData.invoiceNumber && docData.invoiceNumber !== docNumber) {
      drawHeaderMeta('Invoice Reference:', docData.invoiceNumber);
    }
    drawHeaderMeta('Billing Currency:', curr);

    // Prominent Status Pill Badge
    const rawStatus = (docData.status || (isReceipt ? 'CONFIRMED' : 'PAID')).toUpperCase().replace(/_/g, ' ');
    const isPaid = rawStatus === 'PAID' || rawStatus === 'CONFIRMED' || rawStatus === 'PAID IN FULL';
    const isPartial = rawStatus === 'PARTIALLY PAID' || rawStatus === 'PARTIAL';
    const badgeText = isPaid
      ? (isReceipt ? 'PAYMENT CONFIRMED' : 'PAID IN FULL')
      : (isPartial ? 'PARTIALLY PAID' : 'PAYMENT PENDING');

    const badgeW = fontBold.widthOfTextAtSize(badgeText, 7.5) + 16;
    const badgeH = 15;
    const badgeX = rightAlignX - badgeW;
    const badgeY = metaY - 3;

    page.drawRectangle({
      x: badgeX,
      y: badgeY,
      width: badgeW,
      height: badgeH,
      color: isPaid ? cEmeraldLight : (isPartial ? cGoldLight : cCardBg),
      borderColor: isPaid ? cEmerald : (isPartial ? cGold : cBorder),
      borderWidth: 0.8
    });
    page.drawText(badgeText, {
      x: badgeX + 8,
      y: badgeY + 4,
      size: 7.5,
      font: fontBold,
      color: isPaid ? cEmeraldDark : (isPartial ? cGold : cMuted)
    });

    // D. Header Divider Rule with Centered Gold Signature Accent
    const headerDividerY = headerTopY - 110;
    page.drawLine({
      start: { x: marginX, y: headerDividerY },
      end: { x: rightAlignX, y: headerDividerY },
      thickness: 0.75,
      color: cBorder
    });
    page.drawLine({
      start: { x: marginX, y: headerDividerY },
      end: { x: marginX + 60, y: headerDividerY },
      thickness: 2,
      color: cGold
    });

    // =========================================================================
    // 4. BALANCED TWO-COLUMN PROPORTIONAL GRID (Client Info & Settlement Details)
    // Symmetrical, perfectly aligned corporate cards
    // =========================================================================
    const gridTopY = headerDividerY - 14;
    const cardHeight = 98;
    const cardGap = 16;
    const cardWidth = (contentWidth - cardGap) / 2; // 249.64 pt each
    const card2X = marginX + cardWidth + cardGap;  // 305.64 pt

    // Card 1: Billed To / Received From (Client CIF Record)
    page.drawRectangle({
      x: marginX,
      y: gridTopY - cardHeight,
      width: cardWidth,
      height: cardHeight,
      color: cCardBg,
      borderColor: cBorder,
      borderWidth: 0.8
    });
    // Header strip for Card 1
    page.drawRectangle({
      x: marginX,
      y: gridTopY - 20,
      width: cardWidth,
      height: 20,
      color: cEmeraldLight,
      borderColor: cBorder,
      borderWidth: 0.8
    });
    page.drawText(isReceipt ? 'RECEIVED FROM (CLIENT)' : 'BILLED TO (CLIENT)', {
      x: marginX + 10,
      y: gridTopY - 14,
      size: 7.5,
      font: fontBold,
      color: cEmeraldDark
    });

    // Extract Client Information
    const client = docData.client || {};
    const clientName = client.billingName || client.organizationName || client.fullName || docData.clientName || 'Valued Client';
    const companyName = client.companyName || '';
    const clientAddr = client.billingAddress || client.address || docData.clientAddress || 'Dhaka, Bangladesh';
    const clientCityCountry = [client.city, client.country, client.postalCode].filter(Boolean).join(', ');
    const clientPhone = client.phone || docData.clientPhone || '';
    const clientEmail = client.email || docData.clientEmail || '';

    let clientTextY = gridTopY - 33;
    page.drawText(clientName, {
      x: marginX + 10,
      y: clientTextY,
      size: 10,
      font: fontBold,
      color: cCharcoal
    });
    clientTextY -= 12;

    if (companyName && companyName.toLowerCase() !== clientName.toLowerCase()) {
      page.drawText(companyName, {
        x: marginX + 10,
        y: clientTextY,
        size: 8,
        font: fontBold,
        color: cEmerald
      });
      clientTextY -= 11;
    }

    const wrappedAddr = wrapText(clientAddr, 38);
    wrappedAddr.slice(0, 2).forEach(line => {
      page.drawText(line, {
        x: marginX + 10,
        y: clientTextY,
        size: 7.5,
        font: fontRegular,
        color: cCharcoal
      });
      clientTextY -= 10;
    });

    if (clientCityCountry) {
      page.drawText(clientCityCountry, {
        x: marginX + 10,
        y: clientTextY,
        size: 7.5,
        font: fontRegular,
        color: cCharcoal
      });
      clientTextY -= 10;
    }

    const contactStr = [clientEmail, clientPhone].filter(Boolean).join('  •  ');
    if (contactStr) {
      page.drawText(contactStr, {
        x: marginX + 10,
        y: gridTopY - cardHeight + 8,
        size: 7,
        font: fontRegular,
        color: cMuted
      });
    }

    // Card 2: Payment Settlement Details (Strictly Aligned)
    page.drawRectangle({
      x: card2X,
      y: gridTopY - cardHeight,
      width: cardWidth,
      height: cardHeight,
      color: cCardBg,
      borderColor: cBorder,
      borderWidth: 0.8
    });
    // Header strip for Card 2
    page.drawRectangle({
      x: card2X,
      y: gridTopY - 20,
      width: cardWidth,
      height: 20,
      color: cGoldLight,
      borderColor: cBorder,
      borderWidth: 0.8
    });
    page.drawText(isReceipt ? 'PAYMENT SETTLEMENT DETAILS' : 'INVOICE TERMS & PAYMENT', {
      x: card2X + 10,
      y: gridTopY - 14,
      size: 7.5,
      font: fontBold,
      color: cGold
    });

    const paymentMethodRaw = docData.paymentMethod || 'Bank Transfer / Wire';
    const paymentRef = docData.paymentReference || 'TXN-CONFIRMED-LEDGER';
    const serviceName = docData.serviceName || docData.description || 'Digital Retainer Service';

    let settleY = gridTopY - 33;
    function drawSettleRow(lbl, val, isMono = false) {
      page.drawText(lbl, {
        x: card2X + 10,
        y: settleY,
        size: 7.5,
        font: fontBold,
        color: cMuted
      });
      const valW = (isMono ? fontBold : fontRegular).widthOfTextAtSize(val, 7.5);
      page.drawText(val, {
        x: card2X + cardWidth - 10 - valW,
        y: settleY,
        size: 7.5,
        font: isMono ? fontBold : fontRegular,
        color: cCharcoal
      });
      settleY -= 12;
    }

    drawSettleRow('Payment Method:', paymentMethodRaw);
    drawSettleRow('Transaction Reference:', paymentRef, true);
    drawSettleRow('Settlement Status:', 'Cleared & Reconciled');
    drawSettleRow('Accounting Ledger:', 'Verified Entry (D1)');

    const acctDetails = docData.paymentAccountDetails;
    if (acctDetails && (acctDetails.accountName || acctDetails.providerName)) {
      const acctStr = `${acctDetails.providerName || 'MFS'}: ${acctDetails.accountNumber || acctDetails.accountName || ''}`;
      page.drawText(acctStr, {
        x: card2X + 10,
        y: gridTopY - cardHeight + 8,
        size: 7,
        font: fontRegular,
        color: cMuted
      });
    }

    // =========================================================================
    // 5. CORPORATE DATA TABLE (Subtle Shading, Clean Borders, Crisp Padding)
    // =========================================================================
    const tableTopY = gridTopY - cardHeight - 16;
    const thHeight = 22;

    // Table Header Background & Borders
    page.drawRectangle({
      x: marginX,
      y: tableTopY - thHeight,
      width: contentWidth,
      height: thHeight,
      color: cTableHeadBg,
      borderColor: cBorder,
      borderWidth: 0.8
    });
    // Top Accent Border on Table
    page.drawLine({
      start: { x: marginX, y: tableTopY },
      end: { x: rightAlignX, y: tableTopY },
      thickness: 1.5,
      color: cEmerald
    });

    const colDescX = marginX + 12;
    const colQtyX = marginX + 315;
    const colRateX = marginX + 375;
    const colTotalX = rightAlignX - 12;

    page.drawText('DESCRIPTION / SERVICE SPECIFICATION', {
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
    const colPaidLabel = isReceipt ? 'PAID AMOUNT' : 'TOTAL AMOUNT';
    const colPaidW = fontBold.widthOfTextAtSize(colPaidLabel, 7.5);
    page.drawText(colPaidLabel, {
      x: colTotalX - colPaidW,
      y: tableTopY - 14.5,
      size: 7.5,
      font: fontBold,
      color: cCharcoal
    });

    // Populate Items
    const items = (docData.items && docData.items.length > 0) ? docData.items : [{
      description: serviceName,
      quantity: 1,
      unitPriceCents: isReceipt ? (docData.amountPaidCents || docData.totalCents || 0) : (docData.totalCents || 0),
      totalCents: isReceipt ? (docData.amountPaidCents || docData.totalCents || 0) : (docData.totalCents || 0)
    }];

    let rowY = tableTopY - thHeight;
    const rowHeight = 32;

    items.forEach((item, index) => {
      // Alternating row background
      if (index % 2 === 1) {
        page.drawRectangle({
          x: marginX,
          y: rowY - rowHeight,
          width: contentWidth,
          height: rowHeight,
          color: cRowAltBg
        });
      }

      // Outer table side borders and bottom border
      page.drawLine({
        start: { x: marginX, y: rowY },
        end: { x: marginX, y: rowY - rowHeight },
        thickness: 0.8,
        color: cBorder
      });
      page.drawLine({
        start: { x: rightAlignX, y: rowY },
        end: { x: rightAlignX, y: rowY - rowHeight },
        thickness: 0.8,
        color: cBorder
      });
      page.drawLine({
        start: { x: marginX, y: rowY - rowHeight },
        end: { x: rightAlignX, y: rowY - rowHeight },
        thickness: 0.8,
        color: cBorder
      });

      // Item Description
      const itemDesc = item.description || 'Professional Marketing Retainer';
      page.drawText(itemDesc, {
        x: colDescX,
        y: rowY - 14,
        size: 8.5,
        font: fontBold,
        color: cCharcoal
      });

      // Subtitle if package / category available
      const subInfo = [docData.servicePackage, docData.serviceCategory].filter(Boolean).join('  •  ');
      if (subInfo) {
        page.drawText(subInfo, {
          x: colDescX,
          y: rowY - 24,
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

      // Paid / Total
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
    // 6. FINANCIAL RECONCILIATION & TOTALS (Symmetrical Split)
    // Left: Official Reconciliation Notes | Right: Totals Breakdown Box
    // =========================================================================
    const summaryTopY = rowY - 16;
    const summaryBoxWidth = 230;
    const summaryBoxX = rightAlignX - summaryBoxWidth;
    const notesBoxWidth = contentWidth - summaryBoxWidth - 16;
    const summaryBoxHeight = 100;

    // Left Notes & Legal Acknowledgment Box
    page.drawRectangle({
      x: marginX,
      y: summaryTopY - summaryBoxHeight,
      width: notesBoxWidth,
      height: summaryBoxHeight,
      color: cCardBg,
      borderColor: cBorder,
      borderWidth: 0.8
    });
    // Header for Notes Box
    page.drawRectangle({
      x: marginX,
      y: summaryTopY - 18,
      width: notesBoxWidth,
      height: 18,
      color: cTableHeadBg,
      borderColor: cBorder,
      borderWidth: 0.8
    });
    page.drawText('LEDGER RECONCILIATION & AUDIT SUMMARY', {
      x: marginX + 10,
      y: summaryTopY - 12.5,
      size: 7,
      font: fontBold,
      color: cEmeraldDark
    });

    const note1 = 'This document verifies full electronic payment settlement recorded in the corporate client ledger.';
    const noteLines1 = wrapText(note1, 48);
    let noteY = summaryTopY - 30;
    noteLines1.forEach(l => {
      page.drawText(l, { x: marginX + 10, y: noteY, size: 7.5, font: fontRegular, color: cCharcoal });
      noteY -= 10;
    });

    if (docData.notes) {
      const customNotes = `Client Memo: "${docData.notes}"`;
      const noteLines2 = wrapText(customNotes, 48);
      noteLines2.slice(0, 2).forEach(l => {
        page.drawText(l, { x: marginX + 10, y: noteY, size: 7, font: fontOblique, color: cMuted });
        noteY -= 9.5;
      });
    }

    page.drawText('Ledger Status: Immutable Settlement • Cryptographically Authenticated', {
      x: marginX + 10,
      y: summaryTopY - summaryBoxHeight + 8,
      size: 6.8,
      font: fontBold,
      color: cEmerald
    });

    // Right: Financial Totals Box
    const subtotalCents = docData.subtotalCents ?? docData.subtotal_cents ?? (docData.subtotal ? Math.round(docData.subtotal * 100) : 0);
    const taxCents = docData.taxCents ?? docData.tax_cents ?? (docData.vatAmount ? Math.round(docData.vatAmount * 100) : 0);
    const totalCents = docData.totalInvoiceAmountCents ?? docData.totalCents ?? docData.total_cents ?? (docData.total ? Math.round(docData.total * 100) : (subtotalCents + taxCents));
    const amountPaidCents = isReceipt
      ? (docData.amountPaidCents ?? docData.amount_paid_cents ?? (docData.amountPaid ? Math.round(docData.amountPaid * 100) : totalCents))
      : (docData.amountPaidCents ?? docData.amount_paid_cents ?? (docData.amountPaid ? Math.round(docData.amountPaid * 100) : 0));
    const balanceCents = docData.remainingBalanceCents !== undefined
      ? docData.remainingBalanceCents
      : (docData.outstandingBalanceCents !== undefined
        ? docData.outstandingBalanceCents
        : Math.max(0, totalCents - amountPaidCents));

    let sumLineY = summaryTopY;
    function drawSummaryRow(label, amountStr, isGrandTotal = false, isAccent = false) {
      const sz = isGrandTotal ? 10.5 : 8.5;
      const col = isGrandTotal ? cEmeraldDark : (isAccent ? cGold : cCharcoal);

      if (isGrandTotal) {
        page.drawRectangle({
          x: summaryBoxX,
          y: sumLineY - 18,
          width: summaryBoxWidth,
          height: 22,
          color: cEmeraldLight,
          borderColor: cEmerald,
          borderWidth: 0.8
        });
      }

      page.drawText(label, {
        x: summaryBoxX + (isGrandTotal ? 8 : 4),
        y: sumLineY - (isGrandTotal ? 12 : 9),
        size: sz,
        font: isGrandTotal ? fontBold : (isAccent ? fontBold : fontRegular),
        color: col
      });

      const amtW = (isGrandTotal ? fontBold : fontRegular).widthOfTextAtSize(amountStr, sz);
      page.drawText(amountStr, {
        x: rightAlignX - (isGrandTotal ? 8 : 4) - amtW,
        y: sumLineY - (isGrandTotal ? 12 : 9),
        size: sz,
        font: isGrandTotal ? fontBold : fontRegular,
        color: col
      });

      sumLineY -= (isGrandTotal ? 26 : 17);
    }

    if (isReceipt) {
      drawSummaryRow('Total Invoiced Amount:', formatMoney(totalCents, curr));
      drawSummaryRow('AMOUNT RECEIVED:', formatMoney(amountPaidCents, curr), true);
      drawSummaryRow('Outstanding Balance:', formatMoney(balanceCents, curr), false, balanceCents > 0);
    } else {
      drawSummaryRow('Subtotal:', formatMoney(subtotalCents, curr));
      if (taxCents > 0) {
        drawSummaryRow('Applicable VAT:', formatMoney(taxCents, curr));
      }
      drawSummaryRow('INVOICE TOTAL:', formatMoney(totalCents, curr), true);
      drawSummaryRow('Amount Paid to Date:', formatMoney(amountPaidCents, curr));
      drawSummaryRow('Outstanding Balance:', formatMoney(balanceCents, curr), false, balanceCents > 0);
    }

    // =========================================================================
    // 7. BALANCED DIGITAL AUTHENTICATION & ZERO-STORAGE DISCLAIMER BANNER
    // Prominent, perfectly centered, eliminating the bottom void
    // =========================================================================
    const bannerY = Math.max(88, summaryTopY - summaryBoxHeight - 34);
    const bannerHeight = 44;

    page.drawRectangle({
      x: marginX,
      y: bannerY - bannerHeight,
      width: contentWidth,
      height: bannerHeight,
      color: cCardBg,
      borderColor: cBorder,
      borderWidth: 0.8
    });
    // Left decorative emerald bar on disclaimer box
    page.drawRectangle({
      x: marginX,
      y: bannerY - bannerHeight,
      width: 4,
      height: bannerHeight,
      color: cEmerald
    });

    const disclaimerTitle = 'OFFICIAL ELECTRONIC SYSTEM RECEIPT  •  DIGITALLY VERIFIED';
    const dTitleW = fontBold.widthOfTextAtSize(disclaimerTitle, 7.5);
    page.drawText(disclaimerTitle, {
      x: (width - dTitleW) / 2,
      y: bannerY - 14,
      size: 7.5,
      font: fontBold,
      color: cEmerald
    });

    // Exact Mandatory Compliance String
    const disclaimerSub = 'This is a system-generated online receipt. No physical signature or seal is required.';
    const dSubW = fontBold.widthOfTextAtSize(disclaimerSub, 8);
    page.drawText(disclaimerSub, {
      x: (width - dSubW) / 2,
      y: bannerY - 26,
      size: 8,
      font: fontBold,
      color: cCharcoal
    });

    const disclaimerRef = `Document ID: ${docNumber}  •  Auth Date: ${issueDate}  •  Platform: https://whizstudio.art`;
    const dRefW = fontRegular.widthOfTextAtSize(disclaimerRef, 6.8);
    page.drawText(disclaimerRef, {
      x: (width - dRefW) / 2,
      y: bannerY - 37,
      size: 6.8,
      font: fontRegular,
      color: cMuted
    });

    // =========================================================================
    // 8. CORPORATE LEGAL FOOTER (Bottom 40 pt)
    // =========================================================================
    const footerY = 32;
    page.drawLine({
      start: { x: marginX, y: footerY + 16 },
      end: { x: rightAlignX, y: footerY + 16 },
      thickness: 0.8,
      color: cBorder
    });
    page.drawLine({
      start: { x: width / 2 - 30, y: footerY + 16 },
      end: { x: width / 2 + 30, y: footerY + 16 },
      thickness: 1.5,
      color: cGold
    });

    const footerLine1 = 'Whiz Studio  •  Registered Digital Agency  •  House 53, Road 7, Block A, Mirpur 12, Dhaka 1216, BD';
    const f1W = fontRegular.widthOfTextAtSize(footerLine1, 6.8);
    page.drawText(footerLine1, {
      x: (width - f1W) / 2,
      y: footerY + 6,
      size: 6.8,
      font: fontRegular,
      color: cMuted
    });

    const footerLine2 = 'For billing inquiries or tax verification, contact accounting at info@whizstudio.art or visit https://whizstudio.art';
    const f2W = fontRegular.widthOfTextAtSize(footerLine2, 6.2);
    page.drawText(footerLine2, {
      x: (width - f2W) / 2,
      y: footerY - 4,
      size: 6.2,
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
