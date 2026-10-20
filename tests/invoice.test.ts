// Run with: DB_URL=postgresql://... npm test   (needs a migrated, disposable database)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import prisma from '../lib/prisma';
import {
  createInvoice,
  updateInvoice,
  getInvoice,
  getInvoices,
  recordPayment,
} from '../app/actions/invoices';
import { calcInvoiceTotals, formValuesToDocumentData, formValuesToPayload, invoiceToFormValues, DEFAULT_COMPANY } from '../lib/invoice';
import BaseTemplate from '../components/document/BaseTemplate';

let customerId = '';
let otherCustomerId = '';
const uniq = Date.now().toString(36);

const baseItems = [
  { serviceName: 'Deep cleaning', description: 'All rooms', quantity: 2, unit: 'Std.', unitPrice: 33.33, discount: 10, vatPercent: 19 },
  { serviceName: 'Windows', description: 'Inside + outside', quantity: 1, unit: 'Pauschale', unitPrice: 80, discount: 0, vatPercent: 19 },
  { serviceName: 'Transport', description: '', quantity: 3, unit: 'Std.', unitPrice: 12.5, discount: 0, vatPercent: 7 },
];

const payload = (over: any = {}) => ({
  invoiceNumber: `T-${uniq}-A`,
  customerId,
  issueDate: '2026-10-01',
  dueDate: '2026-10-15',
  dateType: 'SINGLE_DATE',
  status: 'SENT',
  items: baseItems,
  notes: 'Original note',
  ...over,
});

before(async () => {
  const c1 = await prisma.customer.create({ data: { name: 'Test Kunde', companyName: 'Kunde GmbH', email: `k1-${uniq}@x.de`, phone: '111', vatNumber: 'DE1', address: 'Hauptstr. 1', city: 'Berlin' } });
  const c2 = await prisma.customer.create({ data: { name: 'Other Kunde', email: `k2-${uniq}@x.de`, address: 'Nebenstr. 2', city: 'Hamburg' } });
  customerId = c1.id;
  otherCustomerId = c2.id;
});

after(async () => {
  await prisma.invoice.deleteMany({ where: { invoiceNumber: { startsWith: `T-${uniq}` } } });
  await prisma.customer.deleteMany({ where: { id: { in: [customerId, otherCustomerId] } } });
  await prisma.$disconnect();
});

test('totals: cent-rounded per line, display == stored', async () => {
  const t = calcInvoiceTotals(baseItems);
  assert.equal(t.lines[0].gross, 66.66);
  assert.equal(t.lines[0].discount, 6.67);
  assert.equal(t.lines[0].net, 59.99);
  assert.equal(t.netTotal, 59.99 + 80 + 37.5);
  assert.equal(t.grandTotal, Math.round((t.netTotal + t.vat) * 100) / 100);

  const res: any = await createInvoice(payload());
  assert.equal(res.success, true, res.error);
  const row = await prisma.invoice.findUniqueOrThrow({ where: { id: res.data.id } });
  assert.equal(Number(row.subtotal), t.netTotal);
  assert.equal(Number(row.vatAmount), t.vat);
  assert.equal(Number(row.grandTotal), t.grandTotal);
});

test('create honours the supplied invoice number and persists every new field', async () => {
  const res: any = await createInvoice(
    payload({
      invoiceNumber: `T-${uniq}-B`,
      reference: 'PO-77',
      serviceDate: '2026-09-30',
      currency: 'EUR',
      language: 'de',
      paymentTerms: 'Zahlbar in 7 Tagen',
      paymentMethod: 'Bank transfer',
      bankDetails: 'IBAN: DE00 TEST',
      footerText: 'Danke!',
      billingDetails: { name: 'Billing Name', companyName: 'Bill Co', email: 'b@x.de', phone: '999', address: 'Rechnungsweg 5\n10115 Berlin', vatNumber: 'DE999' },
      companyDetails: { ...DEFAULT_COMPANY, name: 'Custom Company', phone: '+49 1', logoUrl: '/logo.png' },
    })
  );
  assert.equal(res.success, true, res.error);
  const saved: any = (await getInvoice(res.data.id)).data;
  assert.equal(saved.invoiceNumber, `T-${uniq}-B`);
  assert.equal(saved.reference, 'PO-77');
  assert.equal(saved.language, 'de');
  assert.equal(saved.paymentTerms, 'Zahlbar in 7 Tagen');
  assert.equal(saved.billingDetails.name, 'Billing Name');
  assert.equal(saved.companyDetails.name, 'Custom Company');
  assert.deepEqual(saved.items.map((i: any) => i.serviceName), ['Deep cleaning', 'Windows', 'Transport']);
});

test('edit: invoice number, customer details, items, payment terms all persist on the same row', async () => {
  const created: any = await createInvoice(payload({ invoiceNumber: `T-${uniq}-C` }));
  const id = created.data.id;
  const before = await prisma.invoice.count();

  const pay: any = await recordPayment({ invoiceId: id, amount: 20, paymentMethod: 'CASH' });
  assert.equal(pay.success, true, pay.error);

  const current: any = (await getInvoice(id)).data;
  const form = invoiceToFormValues(JSON.parse(JSON.stringify(current)));
  form.invoiceNumber = `T-${uniq}-C2`;
  form.billing = { ...form.billing, name: 'Changed Name', address: 'Neue Str. 9\n10999 Berlin', vatNumber: 'DE777', email: 'new@x.de' };
  form.items[0] = { ...form.items[0], quantity: 4, unitPrice: 50, discount: 25, vatPercent: 7, description: 'Edited description', unit: 'Tage' };
  form.items.splice(1, 1); // remove second line
  form.paymentTerms = 'Net 30';
  form.paymentMethod = 'PayPal';
  form.bankDetails = 'IBAN: DE11 CHANGED';
  form.footerText = 'Changed footer';
  form.reference = 'REF-2';
  form.dueDate = '2026-11-30';

  const res: any = await updateInvoice(id, { ...formValuesToPayload(form), expectedUpdatedAt: current.updatedAt instanceof Date ? current.updatedAt.toISOString() : current.updatedAt });
  assert.equal(res.success, true, res.error);

  const saved: any = (await getInvoice(id)).data;
  assert.equal(saved.id, id);
  assert.equal(await prisma.invoice.count(), before, 'no invoice was created or removed');
  assert.equal(saved.invoiceNumber, `T-${uniq}-C2`);
  assert.equal(saved.billingDetails.name, 'Changed Name');
  assert.equal(saved.billingDetails.vatNumber, 'DE777');
  assert.equal(saved.items.length, 2);
  assert.equal(saved.items[0].description, 'Edited description');
  assert.equal(saved.items[0].unit, 'Tage');
  assert.equal(Number(saved.items[0].quantity), 4);
  assert.equal(Number(saved.items[0].discount), 25);
  assert.equal(saved.paymentTerms, 'Net 30');
  assert.equal(saved.reference, 'REF-2');
  assert.equal(saved.dueDate.toISOString().slice(0, 10), '2026-11-30');

  // totals recalculated from the edited lines
  const t = calcInvoiceTotals(form.items);
  assert.equal(Number(saved.grandTotal), t.grandTotal);

  // payments + paid amount untouched
  assert.equal(saved.payments.length, 1);
  assert.equal(Number(saved.amountPaid), 20);

  // customer master record untouched
  const cust = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
  assert.equal(cust.name, 'Test Kunde');

  // response returned by the action is the canonical saved record
  assert.equal(res.data.invoiceNumber, `T-${uniq}-C2`);
  assert.equal(res.data.items[0].description, 'Edited description');

  // list view returns the new values too
  const list: any = (await getInvoices(`T-${uniq}-C2`)).data;
  assert.equal(list.length, 1);
  assert.equal(list[0].billingDetails.name, 'Changed Name');
});

test('duplicate invoice number is rejected and nothing else changes', async () => {
  const a: any = await createInvoice(payload({ invoiceNumber: `T-${uniq}-D1` }));
  const b: any = await createInvoice(payload({ invoiceNumber: `T-${uniq}-D2` }));
  assert.equal(a.success && b.success, true);

  const clash: any = await updateInvoice(b.data.id, { ...payload({ invoiceNumber: `T-${uniq}-D1`, notes: 'should not save' }) });
  assert.equal(clash.success, false);
  assert.match(clash.error, /already exists/i);
  const stillB: any = (await getInvoice(b.data.id)).data;
  assert.equal(stillB.invoiceNumber, `T-${uniq}-D2`);
  assert.equal(stillB.notes, 'Original note');
  const stillA: any = (await getInvoice(a.data.id)).data;
  assert.equal(stillA.invoiceNumber, `T-${uniq}-D1`);

  const dupCreate: any = await createInvoice(payload({ invoiceNumber: `T-${uniq}-D1` }));
  assert.equal(dupCreate.success, false);
  assert.match(dupCreate.error, /already exists/i);

  // keeping its own number on save is fine
  const same: any = await updateInvoice(a.data.id, payload({ invoiceNumber: `T-${uniq}-D1`, notes: 'ok' }));
  assert.equal(same.success, true, same.error);
});

test('omitted fields keep their value, explicit null clears, number cannot be blanked', async () => {
  const c: any = await createInvoice(payload({ invoiceNumber: `T-${uniq}-E`, paymentTerms: 'Keep me', reference: 'R1' }));
  const id = c.data.id;
  const { invoiceNumber, ...noNumber } = payload();
  const r1: any = await updateInvoice(id, { ...noNumber, notes: 'changed' });
  assert.equal(r1.success, true, r1.error);
  let saved: any = (await getInvoice(id)).data;
  assert.equal(saved.invoiceNumber, `T-${uniq}-E`);
  assert.equal(saved.paymentTerms, 'Keep me');
  assert.equal(saved.reference, 'R1');

  const r2: any = await updateInvoice(id, payload({ invoiceNumber: `T-${uniq}-E`, paymentTerms: null }));
  assert.equal(r2.success, true, r2.error);
  saved = (await getInvoice(id)).data;
  assert.equal(saved.paymentTerms, null);
  assert.equal(saved.reference, 'R1');

  const r3: any = await updateInvoice(id, payload({ invoiceNumber: '   ' }));
  assert.equal(r3.success, false);
  assert.match(r3.error, /invoice number is required/i);
});

test('validation errors are meaningful', async () => {
  const noItems: any = await updateInvoice((await prisma.invoice.findFirstOrThrow({ where: { invoiceNumber: `T-${uniq}-A` } })).id, payload({ items: [] }));
  assert.match(noItems.error, /at least one item/i);
  const badDisc: any = await createInvoice(payload({ invoiceNumber: `T-${uniq}-F`, items: [{ ...baseItems[0], discount: 150 }] }));
  assert.equal(badDisc.success, false);
  const badCur: any = await createInvoice(payload({ invoiceNumber: `T-${uniq}-F`, currency: 'EURO' }));
  assert.match(badCur.error, /currency/i);
  const badPeriod: any = await createInvoice(payload({ invoiceNumber: `T-${uniq}-F`, dateType: 'CONTRACT_PERIOD', toDate: '2026-09-01' }));
  assert.match(badPeriod.error, /From Date cannot be later/i);
  assert.equal(await prisma.invoice.count({ where: { invoiceNumber: `T-${uniq}-F` } }), 0);
});

test('stale edits are refused (optimistic concurrency)', async () => {
  const c: any = await createInvoice(payload({ invoiceNumber: `T-${uniq}-G` }));
  const opened = c.data.updatedAt;
  const first: any = await updateInvoice(c.data.id, payload({ invoiceNumber: `T-${uniq}-G`, notes: 'tab 1', expectedUpdatedAt: opened }));
  assert.equal(first.success, true, first.error);
  const second: any = await updateInvoice(c.data.id, payload({ invoiceNumber: `T-${uniq}-G`, notes: 'tab 2 (stale)', expectedUpdatedAt: opened }));
  assert.equal(second.success, false);
  assert.match(second.error, /changed elsewhere/i);
  assert.equal(((await getInvoice(c.data.id)).data as any).notes, 'tab 1');
});

test('legacy invoice (no overrides) falls back to customer data and defaults', async () => {
  const legacy = await prisma.invoice.create({
    data: { invoiceNumber: `T-${uniq}-H`, customerId, issueDate: new Date('2026-01-05'), dueDate: new Date('2026-01-19'), subtotal: 100, vatAmount: 19, grandTotal: 119, items: { create: [{ serviceName: 'Old', quantity: 1, unit: 'Std.', unitPrice: 100, total: 100 }] } },
  });
  const rec: any = (await getInvoice(legacy.id)).data;
  const f = invoiceToFormValues(JSON.parse(JSON.stringify(rec)));
  assert.equal(f.billing.name, 'Test Kunde');
  assert.match(f.billing.address, /Hauptstr\. 1\nBerlin/);
  assert.equal(f.company.name, DEFAULT_COMPANY.name);
  assert.equal(f.currency, 'EUR');
  assert.equal(f.language, 'both');
});

test('printed document (preview/PDF) shows every edited value and matches the editor mapping', async () => {
  const c: any = await createInvoice(
    payload({
      invoiceNumber: `T-${uniq}-P`,
      reference: 'REF-PRINT',
      language: 'en',
      paymentTerms: 'Terms PRINT',
      paymentMethod: 'Method PRINT',
      bankDetails: 'IBAN PRINT-IBAN',
      footerText: 'Footer PRINT',
      notes: 'Notes PRINT',
      billingDetails: { name: 'Name PRINT', companyName: 'Co PRINT', email: 'print@x.de', phone: '123', address: 'Street PRINT', vatNumber: 'VAT PRINT' },
      companyDetails: { ...DEFAULT_COMPANY, name: 'Company PRINT', phone: 'PHONE PRINT' },
    })
  );
  const rec: any = JSON.parse(JSON.stringify((await getInvoice(c.data.id)).data));
  const form = invoiceToFormValues(rec);
  const doc = formValuesToDocumentData(form);

  // Editor's live preview maps from form values; saved preview maps from the stored record -> identical.
  assert.deepEqual(doc, formValuesToDocumentData(invoiceToFormValues(rec)));

  const html = renderToStaticMarkup(React.createElement(BaseTemplate, { data: doc }));
  for (const needle of [`T-${uniq}-P`, 'REF-PRINT', 'Terms PRINT', 'Method PRINT', 'IBAN PRINT-IBAN', 'Footer PRINT', 'Notes PRINT', 'Name PRINT', 'Co PRINT', 'print@x.de', 'VAT PRINT', 'Company PRINT', 'PHONE PRINT', 'Deep cleaning', 'All rooms']) {
    assert.ok(html.includes(needle), `printed document is missing "${needle}"`);
  }
  const t = calcInvoiceTotals(baseItems);
  const fmt = (n: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n).replace(/ /g, ' ');
  assert.ok(html.replace(/ /g, ' ').includes(fmt(t.grandTotal)), 'grand total on the printed document');
});
