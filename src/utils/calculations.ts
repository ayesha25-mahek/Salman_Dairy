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

/**
 * Calculates the unpaid period, start date, unpaid milk liters, and unpaid cost based on total payments made.
 */
export const calculateCustomerUnpaidPeriod = (
  customer: Customer,
  milkEntries: MilkEntry[],
  payments: Payment[],
  todayStr = new Date().toISOString().split('T')[0]
): CustomerUnpaidPeriod => {
  const deliveries = getCustomerDailyDeliveries(customer, milkEntries, todayStr);
  const customerPayments = payments.filter(p => p.customer_id === customer.id);
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
 * Keeps track of milk first:
 * - totalMilkConsumed: Total milk delivered across all records / months
 * - paidMilkLitres: Milk volume covered by all payments (totalPaid / rate)
 * - dueMilkLitres: Remaining unpaid milk (totalMilkConsumed - paidMilkLitres)
 * - pendingAmount: Remaining unpaid bill (dueMilkLitres * rate)
 */
export const calculateCustomerBilling = (
  customer: Customer,
  milkEntries: MilkEntry[],
  payments: Payment[],
  currentYear = new Date().getFullYear(),
  currentMonth = new Date().getMonth() + 1,
  todayStr = new Date().toISOString().split('T')[0]
): CustomerBillingSummary => {
  const deliveries = getCustomerDailyDeliveries(customer, milkEntries, todayStr);
  const customerPayments = payments.filter(p => p.customer_id === customer.id);

  // 1. Total Milk Consumed across all records
  const totalMilkConsumed = deliveries.reduce((sum, entry) => sum + entry.quantity, 0);

  // 2. Total Cash Paid
  const totalPaid = customerPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  // 3. Litres of Milk Paid (subtract milk equivalent of the money paid)
  const paidMilkLitres = customer.rate_per_liter > 0 ? (totalPaid / customer.rate_per_liter) : 0;

  // 4. Due Milk (Unpaid Milk Litres = Total Milk minus Paid Milk)
  const dueMilkLitres = Math.max(0, totalMilkConsumed - paidMilkLitres);

  // 5. Total Billed Amount & Pending Amount
  const totalBilled = totalMilkConsumed * customer.rate_per_liter;
  const pendingAmount = Math.max(0, dueMilkLitres * customer.rate_per_liter);

  // 6. Last Payment Date
  let lastPaymentDate: string | null = null;
  if (customerPayments.length > 0) {
    const sortedPayments = [...customerPayments].sort(
      (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
    );
    lastPaymentDate = sortedPayments[0].payment_date;
  }

  // 7. Status Badge
  let status: 'Paid' | 'Partially Paid' | 'Pending' = 'Pending';
  if (dueMilkLitres <= 0.001 || pendingAmount <= 0) {
    status = 'Paid';
  } else if (totalPaid > 0) {
    status = 'Partially Paid';
  }

  // 8. Monthly Consumption (Current / Selected Month)
  const monthString = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const currentMonthDeliveries = deliveries.filter(d => d.date.startsWith(monthString));
  const monthlyConsumption = currentMonthDeliveries.reduce((sum, entry) => sum + entry.quantity, 0);
  const monthlyBill = monthlyConsumption * customer.rate_per_liter;

  return {
    totalMilkConsumed,
    paidMilkLitres,
    dueMilkLitres,
    totalBilled,
    totalPaid,
    pendingAmount,
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
