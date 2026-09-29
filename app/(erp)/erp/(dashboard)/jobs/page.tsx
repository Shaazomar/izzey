import React from 'react';
import { getJobs, getEmployees } from '@/app/actions/jobs';
import { getQuotes } from '@/app/actions/quotes';
import JobsClient from './JobsClient';

export default async function JobsPage() {
  const [jobsRes, employeesRes, quotesRes] = await Promise.all([
    getJobs(),
    getEmployees(),
    getQuotes(),
  ]);

  const jobs = jobsRes.success && jobsRes.data ? JSON.parse(JSON.stringify(jobsRes.data)) : [];
  const employees = employeesRes.success && employeesRes.data ? JSON.parse(JSON.stringify(employeesRes.data)) : [];
  const quotes = quotesRes.success && quotesRes.data ? JSON.parse(JSON.stringify(quotesRes.data)) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-extrabold text-3xl tracking-tight">OPERATIONS SCHEDULE</h1>
        <p className="text-sm text-dark/60">
          Monitor scheduled cleanings, dispatch service personnel, upload before/after photos, and track real labor costs.
        </p>
      </div>
      <JobsClient initialJobs={jobs} employees={employees} quotes={quotes} />
    </div>
  );
}
