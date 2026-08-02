import React from 'react';
import { getEnquiries } from '@/app/actions/enquiries';
import EnquiriesClient from './EnquiriesClient';

export default async function EnquiriesPage() {
  const res = await getEnquiries();
  const enquiries = res.success && res.data ? JSON.parse(JSON.stringify(res.data)) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-extrabold text-3xl tracking-tight uppercase">Enquiries</h1>
        <p className="text-sm text-slate-500">
          Monitor inbound booking requests from the web portal, update lead status parameters, and convert them to registered customer profiles.
        </p>
      </div>
      <EnquiriesClient initialEnquiries={enquiries} />
    </div>
  );
}
