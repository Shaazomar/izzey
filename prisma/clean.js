const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting data deletion...');

  // Delete in correct order to respect constraints
  const deletedPayments = await prisma.payment.deleteMany({});
  console.log(`Deleted ${deletedPayments.count} payments.`);

  const deletedInvoiceItems = await prisma.invoiceItem.deleteMany({});
  console.log(`Deleted ${deletedInvoiceItems.count} invoice items.`);

  const deletedInvoices = await prisma.invoice.deleteMany({});
  console.log(`Deleted ${deletedInvoices.count} invoices.`);

  const deletedQuotationItems = await prisma.quotationItem.deleteMany({});
  console.log(`Deleted ${deletedQuotationItems.count} quotation items.`);

  const deletedQuotations = await prisma.quotation.deleteMany({});
  console.log(`Deleted ${deletedQuotations.count} quotations.`);

  const deletedExpenses = await prisma.expense.deleteMany({});
  console.log(`Deleted ${deletedExpenses.count} expenses.`);

  console.log('Data deletion complete!');
}

main()
  .catch((e) => {
    console.error('Error deleting data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
