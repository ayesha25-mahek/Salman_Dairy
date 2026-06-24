import { Customer, MilkEntry, Payment } from './seedData';

export interface CustomerBillingSummary {
  totalMilkConsumed: number;
  totalBilled: number;
  totalPaid: number;
  pendingAmount: number;
  lastPaymentDate: string | null;
  status: 'Paid' | 'Partially Paid' | 'Pending';
  monthlyConsumption: number;
  monthlyBill: number;
}

export const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate();
};

export const formatCurrency = (amount: number): string => {
  return `Rs. ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

/**
 * Calculates billing summary for a specific customer
 */
export const calculateCustomerBilling = (
  customer: Customer,
  milkEntries: MilkEntry[],
  payments: Payment[],
  currentYear = 2026,
  currentMonth = 6 // June
): CustomerBillingSummary => {
  const customerEntries = milkEntries.filter(e => e.customer_id === customer.id);
  const customerPayments = payments.filter(p => p.customer_id === customer.id);

  // 1. Total Milk Consumed
  const totalMilkConsumed = customerEntries.reduce((sum, entry) => sum + Number(entry.quantity), 0);

  // 2. Total Billed Amount (Each entry has quantity * rate)
  // Note: if rate changed historically, we can compute, but as per requirement, we use customer.rate_per_liter
  const totalBilled = totalMilkConsumed * customer.rate_per_liter;

  // 3. Total Paid
  const totalPaid = customerPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  // 4. Pending Amount
  const pendingAmount = totalBilled - totalPaid;

  // 5. Last Payment Date
  let lastPaymentDate: string | null = null;
  if (customerPayments.length > 0) {
    const sortedPayments = [...customerPayments].sort(
      (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
    );
    lastPaymentDate = sortedPayments[0].payment_date;
  }

  // 6. Status Badge
  let status: 'Paid' | 'Partially Paid' | 'Pending' = 'Pending';
  if (pendingAmount <= 0) {
    status = 'Paid';
  } else if (totalPaid > 0) {
    status = 'Partially Paid';
  }

  // 7. Monthly Consumption (Current Month)
  const monthString = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const currentMonthEntries = customerEntries.filter(e => e.date.startsWith(monthString));
  const monthlyConsumption = currentMonthEntries.reduce((sum, entry) => sum + Number(entry.quantity), 0);
  const monthlyBill = monthlyConsumption * customer.rate_per_liter;

  return {
    totalMilkConsumed,
    totalBilled,
    totalPaid,
    pendingAmount: pendingAmount > 0 ? pendingAmount : 0,
    lastPaymentDate,
    status,
    monthlyConsumption,
    monthlyBill
  };
};

/**
 * Calculates dashboard-wide totals
 */
export const calculateDashboardStats = (
  customers: Customer[],
  milkEntries: MilkEntry[],
  payments: Payment[],
  currentDate = '2026-06-24'
) => {
  const currentYear = new Date(currentDate).getFullYear();
  const currentMonth = new Date(currentDate).getMonth() + 1;

  let todaySalesLiters = 0;
  let monthlyRevenue = 0;
  let totalPending = 0;
  let totalCollected = 0;

  // Today's Sales
  const todayEntries = milkEntries.filter(e => e.date === currentDate);
  todayEntries.forEach(entry => {
    const cust = customers.find(c => c.id === entry.customer_id);
    if (cust) {
      todaySalesLiters += Number(entry.quantity) * cust.rate_per_liter;
    }
  });

  // Calculate for all customers
  customers.forEach(customer => {
    const summary = calculateCustomerBilling(customer, milkEntries, payments, currentYear, currentMonth);
    monthlyRevenue += summary.monthlyBill;
    totalPending += summary.pendingAmount;
    totalCollected += summary.totalPaid;
  });

  return {
    todaySales: todaySalesLiters,
    monthlyRevenue,
    pendingPayments: totalPending,
    collectedPayments: totalCollected
  };
};
