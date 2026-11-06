// Run with: DB_URL=postgresql://... npm test   (needs a migrated, disposable database)
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import prisma from '../lib/prisma';
import { createCustomer, updateCustomer } from '../app/actions/customers';
import { CustomerSchema } from '../lib/validators';
import { invoiceToFormValues, formValuesToDocumentData } from '../lib/invoice';
import BaseTemplate from '../components/document/BaseTemplate';

const uniq = Date.now().toString(36);
const base = (over: any = {}) => ({ name: `NoMail ${uniq}`, address: 'Hauptstr. 1', city: 'Berlin', ...over });

after(async () => {
  await prisma.customer.deleteMany({ where: { name: { contains: uniq } } });
  await prisma.$disconnect();
});

test('schema: email is optional; blank counts as none; a given email must still be valid', () => {
  assert.equal(CustomerSchema.safeParse(base()).success, true);
  const blank = CustomerSchema.parse(base({ email: '   ' }));
  assert.equal(blank.email, null);
  assert.equal(CustomerSchema.parse(base({ email: null })).email, null);
  assert.equal(CustomerSchema.parse(base({ email: ' A@B.de ' })).email, 'A@B.de');
  const bad = CustomerSchema.safeParse(base({ email: 'not-an-email' }));
  assert.equal(bad.success, false);
  assert.match(bad.error!.issues[0].message, /invalid email/i);
});

test('customers can be created without email, several of them, and are stored with NULL', async () => {
  const a: any = await createCustomer(base({ name: `A ${uniq}` }));
  const b: any = await createCustomer(base({ name: `B ${uniq}`, email: '' }));
  assert.equal(a.success, true, a.error);
  assert.equal(b.success, true, b.error);
  assert.equal(a.data.email, null);
  assert.equal(b.data.email, null);
});

test('duplicate emails are still rejected; email is lower-cased', async () => {
  const email = `Dup-${uniq}@Example.DE`;
  const first: any = await createCustomer(base({ name: `C ${uniq}`, email }));
  assert.equal(first.success, true, first.error);
  assert.equal(first.data.email, email.toLowerCase());
  const second: any = await createCustomer(base({ name: `D ${uniq}`, email: email.toUpperCase() }));
  assert.equal(second.success, false);
  assert.match(second.error, /already exists/i);
});

test('update: email can be removed and added; clash with another customer still rejected', async () => {
  const c: any = await createCustomer(base({ name: `E ${uniq}`, email: `e-${uniq}@x.de` }));
  const other: any = await createCustomer(base({ name: `F ${uniq}`, email: `f-${uniq}@x.de` }));
  const cleared: any = await updateCustomer(c.data.id, base({ name: `E ${uniq}`, email: '' }));
  assert.equal(cleared.success, true, cleared.error);
  assert.equal(cleared.data.email, null);
  const clash: any = await updateCustomer(c.data.id, base({ name: `E ${uniq}`, email: `f-${uniq}@x.de` }));
  assert.equal(clash.success, false);
  const added: any = await updateCustomer(c.data.id, base({ name: `E ${uniq}`, email: `new-${uniq}@x.de` }));
  assert.equal(added.data.email, `new-${uniq}@x.de`);
  assert.ok(other.success);
});

test('invoice/quote documents render cleanly for a customer without email', async () => {
  const c: any = await createCustomer(base({ name: `G ${uniq}` }));
  const invoice: any = {
    invoiceNumber: 'X-1', customerId: c.data.id, customer: c.data, issueDate: '2026-11-01', dueDate: '2026-11-15',
    items: [{ serviceName: 'Reinigung', quantity: 1, unit: 'Std.', unitPrice: 10, discount: 0, vatPercent: 19 }],
  };
  const form = invoiceToFormValues(invoice);
  assert.equal(form.billing.email, '');
  const html = renderToStaticMarkup(React.createElement(BaseTemplate, { data: formValuesToDocumentData(form) }));
  assert.ok(html.includes(`G ${uniq}`));
  // only the provider's MAIL line remains; no empty or placeholder customer mail
  assert.equal((html.match(/MAIL:/g) || []).length, 1);
  assert.ok(!html.includes('client@example.com'));
});
