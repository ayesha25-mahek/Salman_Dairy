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
  month: number
) => {
  const billing = calculateCustomerBilling(customer, milkEntries, payments, year, month);
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
  
  const customerEntries = milkEntries
    .filter(e => e.customer_id === customer.id && e.date.startsWith(`${year}-${String(month).padStart(2, '0')}`))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate and print receipts.');
    return;
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

  printWindow.document.write(`
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
  `);
  printWindow.document.close();
};
