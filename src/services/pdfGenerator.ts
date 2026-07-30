import { jsPDF } from 'jspdf';
import { Customer, MilkEntry, Payment } from '../utils/seedData';
import { calculateCustomerBilling, formatCurrency } from '../utils/calculations';

/**
 * Exports the monthly milk register for all customers to a CSV file
 */
export const exportRegisterToCSV = (
  customers: Customer[],
  milkEntries: MilkEntry[],
  year: number,
  month: number
) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
  
  // Headers
  let csvContent = `Salman Dairy Milk Register - ${monthName} ${year}\n`;
  csvContent += `Customer Code,Customer Name,Rate/L,`;
  for (let d = 1; d <= daysInMonth; d++) {
    csvContent += `${d},`;
  }
  csvContent += `Total Litres,Total Bill\n`;

  // Rows
  customers.forEach(customer => {
    const custEntries = milkEntries.filter(
      e => e.customer_id === customer.id && e.date.startsWith(`${year}-${String(month).padStart(2, '0')}`)
    );
    
    let row = `"${customer.customer_code}","${customer.name}",${customer.rate_per_liter},`;
    let totalLitres = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const entry = custEntries.find(e => e.date === dateStr);
      const qty = entry ? Number(entry.quantity) : 0;
      row += `${qty},`;
      totalLitres += qty;
    }

    const totalBill = totalLitres * customer.rate_per_liter;
    row += `${totalLitres},${totalBill}\n`;
    csvContent += row;
  });

  // Download trigger
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Salman_Dairy_Register_${monthName}_${year}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Opens a print window with a beautifully styled printable invoice/receipt for a single customer
 */
export const printReceipt = (
  customer: Customer,
  milkEntries: MilkEntry[],
  payments: Payment[],
  year: number,
  month: number,
  printViaIframe = false
) => {
  const billing = calculateCustomerBilling(customer, milkEntries, payments, year, month);
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
  
  const customerEntries = milkEntries
    .filter(e => e.customer_id === customer.id && e.date.startsWith(`${year}-${String(month).padStart(2, '0')}`))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let printWindow: Window | null = null;
  if (!printViaIframe) {
    printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate and print receipts.');
      return;
    }
  }

  const entriesRowsHtml = customerEntries
    .map(
      (e, idx) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 12px; font-size: 14px;">${idx + 1}</td>
        <td style="padding: 8px 12px; font-size: 14px;">${new Date(e.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
        <td style="padding: 8px 12px; font-size: 14px; text-align: right;">${e.quantity} Litres</td>
        <td style="padding: 8px 12px; font-size: 14px; text-align: right;">${formatCurrency(e.quantity * customer.rate_per_liter)}</td>
      </tr>
    `
    )
    .join('');

  const htmlContent = `
    <html>
      <head>
        <title>Invoice - ${customer.name} (${monthName} ${year})</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #334155;
            margin: 0;
            padding: 40px;
            background: #ffffff;
          }
          .receipt-container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #e2e8f0;
            padding: 40px;
            border-radius: 8px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #22c55e;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: 800;
            color: #16a34a;
          }
          .title {
            text-align: right;
            font-size: 20px;
            font-weight: 600;
            color: #475569;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .info-block h3 {
            margin: 0 0 8px 0;
            color: #64748b;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-block p {
            margin: 0 0 6px 0;
            font-size: 15px;
            font-weight: 500;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th {
            background: #f8fafc;
            text-align: left;
            padding: 12px;
            font-size: 13px;
            font-weight: 600;
            color: #475569;
            border-bottom: 1px solid #e2e8f0;
          }
          .summary-table {
            width: 300px;
            margin-left: auto;
            margin-bottom: 40px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
          }
          .summary-row.total {
            font-size: 18px;
            font-weight: 700;
            border-top: 2px solid #e2e8f0;
            padding-top: 12px;
            color: #1e293b;
          }
          .footer {
            text-align: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
            font-size: 12px;
            color: #94a3b8;
          }
          @media print {
            body { padding: 0; }
            .receipt-container { border: none; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <div>
              <div class="logo">SALMAN DAIRY</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Pure Fresh Milk Delivered Daily</div>
            </div>
            <div class="title">
              MONTHLY LEDGER BILL
              <div style="font-size: 14px; font-weight: normal; color: #64748b; margin-top: 4px;">
                ${monthName} ${year}
              </div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-block">
              <h3>Customer Information</h3>
              <p><strong>Name:</strong> ${customer.name}</p>
              <p><strong>Customer Code:</strong> ${customer.customer_code}</p>
              <p><strong>Phone:</strong> ${customer.phone || 'N/A'}</p>
              <p><strong>Address:</strong> ${customer.address || 'N/A'}</p>
            </div>
            <div class="info-block" style="text-align: right;">
              <h3>Dairy Details</h3>
              <p><strong>Dairy Name:</strong> Salman Dairy</p>
              <p><strong>Rate per Litre:</strong> ${formatCurrency(customer.rate_per_liter)}</p>
              <p><strong>Date Generated:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th>Date</th>
                <th style="text-align: right; width: 150px;">Quantity</th>
                <th style="text-align: right; width: 150px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${entriesRowsHtml}
              ${
                customerEntries.length === 0
                  ? '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #94a3b8;">No milk logs found for this month</td></tr>'
                  : ''
              }
            </tbody>
          </table>

          <div class="summary-table">
            <div class="summary-row">
              <span>Total Litres Consumed:</span>
              <span><strong>${billing.monthlyConsumption} L</strong></span>
            </div>
            <div class="summary-row">
              <span>Current Month Bill:</span>
              <span>${formatCurrency(billing.monthlyBill)}</span>
            </div>
            <div class="summary-row">
              <span>Total Dues (All Months):</span>
              <span>${formatCurrency(billing.totalBilled)}</span>
            </div>
            <div class="summary-row">
              <span>Total Paid Amount:</span>
              <span>- ${formatCurrency(billing.totalPaid)}</span>
            </div>
            <div class="summary-row total">
              <span>Remaining Balance:</span>
              <span>${formatCurrency(billing.pendingAmount)}</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for your business! For queries, please WhatsApp or call us.</p>
            <p style="margin-top: 8px;">Generated Automatically by Salman Dairy Management System</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `;

  if (printViaIframe) {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    iframe.contentWindow?.document.open();
    iframe.contentWindow?.document.write(htmlContent);
    iframe.contentWindow?.document.close();
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  } else if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
};

/**
 * Generates a professional unpaid bill PDF using jsPDF and downloads it directly
 * (no print dialog is shown — file saves straight to the user's device)
 */
export const generateAndDownloadUnpaidBillPdf = (
  customer: Customer,
  milkEntries: MilkEntry[],
  payments: Payment[],
  unpaidStartDate: string,
  todayStr: string,
  unpaidLiters: number,
  unpaidCost: number,
  pendingAmount: number
) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = 210;
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = 20;

  // ── Helper functions ──────────────────────────────────────────────
  const line = (x1: number, y1: number, x2: number, y2: number, color = '#e2e8f0') => {
    doc.setDrawColor(color);
    doc.line(x1, y1, x2, y2);
  };

  const rect = (x: number, yy: number, w: number, h: number, fillColor: string) => {
    doc.setFillColor(fillColor);
    doc.rect(x, yy, w, h, 'F');
  };

  const text = (str: string, x: number, yy: number, opts?: { size?: number; bold?: boolean; color?: string; align?: 'left' | 'center' | 'right' }) => {
    doc.setFontSize(opts?.size ?? 10);
    doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
    doc.setTextColor(opts?.color ?? '#334155');
    doc.text(str, x, yy, { align: opts?.align ?? 'left' });
  };

  // ── Header bar ────────────────────────────────────────────────────
  rect(0, 0, pageW, 32, '#0ea5e9');
  text('SALMAN DAIRY', margin, 13, { size: 18, bold: true, color: '#ffffff' });
  text('Pure Fresh Milk • Delivered Daily', margin, 20, { size: 9, color: '#bae6fd' });
  text('UNPAID BILL STATEMENT', pageW - margin, 11, { size: 13, bold: true, color: '#ffffff', align: 'right' });
  text(`Generated: ${new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageW - margin, 18, { size: 8, color: '#e0f2fe', align: 'right' });
  y = 42;

  // ── Customer info block ───────────────────────────────────────────
  rect(margin, y, contentW, 28, '#f8fafc');
  doc.setDrawColor('#e2e8f0');
  doc.rect(margin, y, contentW, 28, 'S');

  text('CUSTOMER INFORMATION', margin + 5, y + 7, { size: 7, bold: true, color: '#64748b' });
  text(customer.name, margin + 5, y + 14, { size: 13, bold: true, color: '#0f172a' });
  text(`Code: ${customer.customer_code}   •   Phone: ${customer.phone || 'N/A'}   •   Rate: Rs. ${customer.rate_per_liter}/L`, margin + 5, y + 21, { size: 8, color: '#475569' });
  if (customer.address) {
    text(`Address: ${customer.address}`, margin + 5, y + 26.5, { size: 7.5, color: '#94a3b8' });
  }
  y += 36;

  // ── Unpaid period banner ──────────────────────────────────────────
  rect(margin, y, contentW, 14, '#fff7ed');
  doc.setDrawColor('#fed7aa');
  doc.rect(margin, y, contentW, 14, 'S');
  text('BILLING PERIOD', margin + 5, y + 6, { size: 7, bold: true, color: '#c2410c' });
  text(`${unpaidStartDate}  →  ${todayStr}`, margin + 5, y + 11.5, { size: 10, bold: true, color: '#ea580c' });
  y += 22;

  // ── Milk entries table ────────────────────────────────────────────
  const unpaidEntries = milkEntries
    .filter(e => e.customer_id === customer.id && e.date >= unpaidStartDate && e.date <= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Table header
  rect(margin, y, contentW, 9, '#0ea5e9');
  text('#', margin + 4, y + 6, { size: 8, bold: true, color: '#ffffff' });
  text('Date', margin + 14, y + 6, { size: 8, bold: true, color: '#ffffff' });
  text('Quantity (Litres)', margin + 80, y + 6, { size: 8, bold: true, color: '#ffffff' });
  text('Amount (Rs.)', pageW - margin - 5, y + 6, { size: 8, bold: true, color: '#ffffff', align: 'right' });
  y += 9;

  // Table rows
  unpaidEntries.forEach((entry, idx) => {
    const rowH = 8;
    if (idx % 2 === 0) rect(margin, y, contentW, rowH, '#f8fafc');
    text(`${idx + 1}`, margin + 4, y + 5.5, { size: 8 });
    text(
      new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      margin + 14, y + 5.5, { size: 8 }
    );
    text(`${Number(entry.quantity).toFixed(1)} L`, margin + 80, y + 5.5, { size: 8 });
    text(formatCurrency(Number(entry.quantity) * customer.rate_per_liter), pageW - margin - 5, y + 5.5, { size: 8, align: 'right' });
    line(margin, y + rowH, margin + contentW, y + rowH);
    y += rowH;

    // Page break guard
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
  });

  if (unpaidEntries.length === 0) {
    text('No milk deliveries recorded for this period.', margin + contentW / 2, y + 7, { size: 9, color: '#94a3b8', align: 'center' });
    y += 14;
  }

  y += 6;

  // ── Summary box ───────────────────────────────────────────────────
  const summaryX = pageW - margin - 80;
  rect(summaryX, y, 80, 36, '#f8fafc');
  doc.setDrawColor('#e2e8f0');
  doc.rect(summaryX, y, 80, 36, 'S');

  text('Total Litres Delivered:', summaryX + 4, y + 8, { size: 8, color: '#64748b' });
  text(`${unpaidLiters.toFixed(1)} L`, summaryX + 76, y + 8, { size: 8, bold: true, align: 'right' });

  text('Period Milk Amount:', summaryX + 4, y + 16, { size: 8, color: '#64748b' });
  text(formatCurrency(unpaidCost), summaryX + 76, y + 16, { size: 8, bold: true, align: 'right' });

  line(summaryX + 4, y + 20, summaryX + 76, y + 20, '#e2e8f0');

  rect(summaryX, y + 21, 80, 15, '#fee2e2');
  text('TOTAL DUES OUTSTANDING:', summaryX + 4, y + 29, { size: 8, bold: true, color: '#dc2626' });
  text(formatCurrency(pendingAmount), summaryX + 76, y + 29, { size: 10, bold: true, color: '#dc2626', align: 'right' });

  y += 50;

  // ── Footer ────────────────────────────────────────────────────────
  line(margin, y, pageW - margin, y, '#e2e8f0');
  y += 6;
  text('Please clear your outstanding dues at the earliest. For any queries, contact Salman Dairy.', pageW / 2, y, { size: 7.5, color: '#94a3b8', align: 'center' });
  y += 5;
  text('This bill is system-generated by Salman Dairy Management System.', pageW / 2, y, { size: 7, color: '#cbd5e1', align: 'center' });

  // ── Save ──────────────────────────────────────────────────────────
  const safeDate = todayStr.replace(/-/g, '');
  doc.save(`SalmanDairy_UnpaidBill_${customer.customer_code}_${safeDate}.pdf`);
};
