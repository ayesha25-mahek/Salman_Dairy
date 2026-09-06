import { Customer, MilkEntry, Payment } from './seedData';

export interface DailyDelivery {
  date: string;
  quantity: number;
  cost: number;
}

export interface CustomerUnpaidPeriod {
  unpaidStartDate: string;
  unpaidLiters: number;
  unpaidCost: number;
  unpaidDeliveries: DailyDelivery[];
}

export interface CustomerBillingSummary {
  totalMilkConsumed: number;
  paidMilkLitres: number;
  dueMilkLitres: number;
  totalBilled: number;
  totalPaid: number;
  pendingAmount: number;
  currentMonthMilkConsumed: number;
  currentMonthBill: number;
  currentMonthPaid: number;
  currentMonthPending: number;
  previousMonthMilkConsumed: number;
  previousMonthBilled: number;
  previousMonthPaid: number;
  previousMonthPending: number;
  hasOverdue: boolean;
  previousMonthName: string;
  lastPaymentDate: string | null;
  status: 'Paid' | 'Partially Paid' | 'Pending' | 'Overdue';
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
 * Resolves day-by-day milk deliveries for a customer from their registration up to a given date.
 * Respects explicit milk entries in DB, carrying forward or defaulting to default_quantity for days without explicit entries.
 */
export const getCustomerDailyDeliveries = (
  customer: Customer,
  milkEntries: MilkEntry[],
  upToDate = new Date().toISOString().split('T')[0]
): DailyDelivery[] => {
  const customerEntries = milkEntries.filter(e => e.customer_id === customer.id);
  const entryMap = new Map<string, number>();
  customerEntries.forEach(e => {
    entryMap.set(e.date, Number(e.quantity));
  });

  const createdDate = customer.created_at ? customer.created_at.split('T')[0] : upToDate;
  const deactivatedDate = customer.deactivated_at ? customer.deactivated_at.split('T')[0] : null;

  // Earliest date is either creation date or the earliest recorded milk entry
  let earliestDate = createdDate;
  customerEntries.forEach(e => {
    if (e.date < earliestDate) {
      earliestDate = e.date;
    }
  });

  if (earliestDate > upToDate) {
    return [];
  }

  const deliveries: DailyDelivery[] = [];
  const cur = new Date(earliestDate + 'T00:00:00');
  const end = new Date(upToDate + 'T00:00:00');

  while (cur <= end) {
    const year = cur.getFullYear();
    const month = String(cur.getMonth() + 1).padStart(2, '0');
    const day = String(cur.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // If deactivated and current date is after deactivation, stop
    if (deactivatedDate && dateStr > deactivatedDate) {
      break;
    }

    let qty: number;
    if (entryMap.has(dateStr)) {
      qty = entryMap.get(dateStr)!;
    } else if (dateStr >= createdDate) {
      qty = Number(customer.default_quantity || 0);
    } else {
      qty = 0;
    }

    deliveries.push({
      date: dateStr,
      quantity: qty,
      cost: qty * customer.rate_per_liter
    });

    cur.setDate(cur.getDate() + 1);
  }

  return deliveries;
};

export const BASELINE_START_DATE = '2026-09-01';

/**
 * Calculates the unpaid period, start date, unpaid milk liters, and unpaid cost based on total payments made.
 * Starts from September 1, 2026 baseline.
 */
export const calculateCustomerUnpaidPeriod = (
  customer: Customer,
  milkEntries: MilkEntry[],
  payments: Payment[],
  todayStr = new Date().toISOString().split('T')[0]
): CustomerUnpaidPeriod => {
  const allDeliveries = getCustomerDailyDeliveries(customer, milkEntries, todayStr);
  const deliveries = allDeliveries.filter(d => d.date >= BASELINE_START_DATE);
  const customerPayments = payments.filter(
    p => p.customer_id === customer.id && p.payment_date >= BASELINE_START_DATE
  );
  const totalPaid = customerPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  let coveredPaid = totalPaid;
  let firstUnpaidIndex = -1;

  for (let i = 0; i < deliveries.length; i++) {
    const delivery = deliveries[i];
    if (delivery.cost === 0) {
      continue;
    }
    if (coveredPaid >= delivery.cost) {
      coveredPaid -= delivery.cost;
    } else {
      firstUnpaidIndex = i;
      break;
    }
  }

  if (firstUnpaidIndex === -1) {
    const lastDate = deliveries.length > 0 ? deliveries[deliveries.length - 1].date : todayStr;
    return {
      unpaidStartDate: lastDate,
      unpaidLiters: 0,
      unpaidCost: 0,
      unpaidDeliveries: []
    };
  }

  const unpaidDeliveries = deliveries.slice(firstUnpaidIndex);
  const unpaidStartDate = deliveries[firstUnpaidIndex].date;
  const unpaidLiters = unpaidDeliveries.reduce((sum, d) => sum + d.quantity, 0);
  const unpaidCost = unpaidDeliveries.reduce((sum, d) => sum + d.cost, 0);

  return {
    unpaidStartDate,
    unpaidLiters,
    unpaidCost,
    unpaidDeliveries
  };
};

/**
 * Calculates billing summary for a specific customer.
 * Counts dues starting from September 1, 2026 (all prior months cleared / 0 dues).
 * - Current month pending: milk deliveries from the 1st of the active month up to now * rate_per_liter
 * - Previous month pending: unpaid balance from past months (since Sept 1, 2026) before the 1st of current month
 * - Overdue: true if previous month pending > 0 (triggers red markings from October onwards if September unpaid)
 */
export const calculateCustomerBilling = (
  customer: Customer,
  milkEntries: MilkEntry[],
  payments: Payment[],
  currentYear = new Date().getFullYear(),
  currentMonth = new Date().getMonth() + 1,
  todayStr = new Date().toISOString().split('T')[0]
): CustomerBillingSummary => {
  const allDeliveries = getCustomerDailyDeliveries(customer, milkEntries, todayStr);
  const activeCycleDeliveries = allDeliveries.filter(d => d.date >= BASELINE_START_DATE);
  const customerPayments = payments.filter(
    p => p.customer_id === customer.id && p.payment_date >= BASELINE_START_DATE
  );

  // Month identifiers
  const monthString = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const currentMonthStart = `${monthString}-01`;

  // 1. Split Deliveries into Past Months (since Sept 1, 2026) vs Active Month
  const previousDeliveries = activeCycleDeliveries.filter(d => d.date < currentMonthStart);
  const currentMonthDeliveries = activeCycleDeliveries.filter(d => d.date.startsWith(monthString));

  // 2. Past Months Calculation (since Sept 1, 2026)
  const previousMonthMilkConsumed = previousDeliveries.reduce((sum, entry) => sum + entry.quantity, 0);
  const previousMonthBilled = previousMonthMilkConsumed * customer.rate_per_liter;

  // 3. Active Month Calculation
  const currentMonthMilkConsumed = currentMonthDeliveries.reduce((sum, entry) => sum + entry.quantity, 0);
  const currentMonthBill = currentMonthMilkConsumed * customer.rate_per_liter;

  // 4. Overall Totals for Active Cycle
  const totalMilkConsumed = activeCycleDeliveries.reduce((sum, entry) => sum + entry.quantity, 0);
  const totalBilled = totalMilkConsumed * customer.rate_per_liter;
  const totalPaid = customerPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  // 5. Litres of Milk Paid & Due
  const paidMilkLitres = customer.rate_per_liter > 0 ? (totalPaid / customer.rate_per_liter) : 0;
  const dueMilkLitres = Math.max(0, totalMilkConsumed - paidMilkLitres);

  // 6. Chronological Payment Allocation (First clear past months, then active month)
  let previousMonthPaid = 0;
  let previousMonthPending = 0;
  let currentMonthPaid = 0;
  let currentMonthPending = 0;

  if (totalPaid <= previousMonthBilled) {
    previousMonthPaid = totalPaid;
    previousMonthPending = previousMonthBilled - totalPaid;
    currentMonthPaid = 0;
    currentMonthPending = currentMonthBill;
  } else {
    previousMonthPaid = previousMonthBilled;
    previousMonthPending = 0;
    const remainingForCurrent = totalPaid - previousMonthBilled;
    currentMonthPaid = Math.min(currentMonthBill, remainingForCurrent);
    currentMonthPending = Math.max(0, currentMonthBill - remainingForCurrent);
  }

  const pendingAmount = previousMonthPending + currentMonthPending;
  const hasOverdue = previousMonthPending > 0.01;

  // Previous month name for clean labeling
  const prevDate = new Date(currentYear, currentMonth - 2, 1);
  const previousMonthName = prevDate.toLocaleString('default', { month: 'long' });

  // 7. Last Payment Date (checks all payment logs)
  let lastPaymentDate: string | null = null;
  const allCustomerPayments = payments.filter(p => p.customer_id === customer.id);
  if (allCustomerPayments.length > 0) {
    const sortedPayments = [...allCustomerPayments].sort(
      (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
    );
    lastPaymentDate = sortedPayments[0].payment_date;
  }

  // 8. Status Badge
  let status: 'Paid' | 'Partially Paid' | 'Pending' | 'Overdue' = 'Pending';
  if (dueMilkLitres <= 0.001 || pendingAmount <= 0.01) {
    status = 'Paid';
  } else if (hasOverdue) {
    status = 'Overdue';
  } else if (totalPaid > 0) {
    status = 'Partially Paid';
  }

  return {
    totalMilkConsumed,
    paidMilkLitres,
    dueMilkLitres,
    totalBilled,
    totalPaid,
    pendingAmount,
    currentMonthMilkConsumed,
    currentMonthBill,
    currentMonthPaid,
    currentMonthPending,
    previousMonthMilkConsumed,
    previousMonthBilled,
    previousMonthPaid,
    previousMonthPending,
    hasOverdue,
    previousMonthName,
    lastPaymentDate,
    status,
    monthlyConsumption: currentMonthMilkConsumed,
    monthlyBill: currentMonthBill
  };
};

/**
 * Quick helper to check if a customer has overdue dues from last month
 */
export const checkCustomerOverdue = (
  customer: Customer,
  milkEntries: MilkEntry[],
  payments: Payment[],
  currentYear = new Date().getFullYear(),
  currentMonth = new Date().getMonth() + 1,
  todayStr = new Date().toISOString().split('T')[0]
) => {
  const billing = calculateCustomerBilling(customer, milkEntries, payments, currentYear, currentMonth, todayStr);
  return {
    hasOverdue: billing.hasOverdue,
    previousMonthPending: billing.previousMonthPending,
    currentMonthPending: billing.currentMonthPending,
    totalPending: billing.pendingAmount,
    previousMonthName: billing.previousMonthName
  };
};

/**
 * Calculates dashboard-wide totals
 */
export const calculateDashboardStats = (
  customers: Customer[],
  milkEntries: MilkEntry[],
  payments: Payment[],
  currentDate = new Date().toISOString().split('T')[0]
) => {
  const currentYear = new Date(currentDate).getFullYear();
  const currentMonth = new Date(currentDate).getMonth() + 1;

  let todaySalesLiters = 0;
  let todayLitresSold = 0;
  let monthlyRevenue = 0;
  let totalPending = 0;
  let totalCollected = 0;

  // Calculate for all customers
  customers.forEach(customer => {
    const deliveries = getCustomerDailyDeliveries(customer, milkEntries, currentDate);
    const todayDelivery = deliveries.find(d => d.date === currentDate);
    if (todayDelivery) {
      todayLitresSold += todayDelivery.quantity;
      todaySalesLiters += todayDelivery.cost;
    }

    const summary = calculateCustomerBilling(customer, milkEntries, payments, currentYear, currentMonth, currentDate);
    monthlyRevenue += summary.monthlyBill;
    totalPending += summary.pendingAmount;
    totalCollected += summary.totalPaid;
  });

  return {
    todaySales: todaySalesLiters,
    todayLitresSold,
    monthlyRevenue,
    pendingPayments: totalPending,
    collectedPayments: totalCollected
  };
};
