'use client';

import React, { useState } from 'react';
import { getFinancialSummary, getJobsAnalytics } from '@/app/actions/reports';
import { AreaChart, Landmark, TrendingUp, TrendingDown, Download, Table, FileText } from 'lucide-react';

interface ReportsClientProps {
  initialSummary: any;
  initialJobsAnalytics: any[];
  mode: 'OFFICIAL' | 'MANAGEMENT';
}

export default function ReportsClient({ initialSummary, initialJobsAnalytics, mode }: ReportsClientProps) {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    d.setDate(1); // Start of previous month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [summary, setSummary] = useState(initialSummary);
  const [jobsAnalytics, setJobsAnalytics] = useState(initialJobsAnalytics);
  const [loading, setLoading] = useState(false);

  const handleFetchData = async () => {
    setLoading(true);
    try {
      const sDate = new Date(startDate);
      const eDate = new Date(endDate);
      eDate.setHours(23, 59, 59, 999);

      const [summaryRes, jobsRes] = await Promise.all([
        getFinancialSummary(sDate, eDate, mode),
        getJobsAnalytics(sDate, eDate),
      ]);

      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }
      if (jobsRes.success && jobsRes.data) {
        setJobsAnalytics(jobsRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    let csvRows = [];
    let filename = '';

    if (mode === 'OFFICIAL') {
      filename = `Official_Report_${startDate}_to_${endDate}.csv`;
      csvRows.push(['Izzey Clean ERP - Official Financial books']);
      csvRows.push([`Range: ${startDate} to ${endDate}`]);
      csvRows.push([]);
      csvRows.push(['Metric Title', 'Value (€)']);
      csvRows.push(['Official Gross Revenue (incl. VAT)', Number(summary.revenue).toFixed(2)]);
      csvRows.push(['Official Net Revenue (subtotal)', Number(summary.subtotalRevenue).toFixed(2)]);
      csvRows.push(['VAT Tax Collected', Number(summary.vatCollected).toFixed(2)]);
      csvRows.push(['Official Expenses', Number(summary.expenses).toFixed(2)]);
      csvRows.push(['Official Net Profit', Number(summary.netProfit).toFixed(2)]);
    } else {
      filename = `Management_Analytics_Report_${startDate}_to_${endDate}.csv`;
      csvRows.push(['Izzey Clean ERP - Management Analytics']);
      csvRows.push([`Range: ${startDate} to ${endDate}`]);
      csvRows.push([]);
      csvRows.push(['Metric Title', 'Value (€)']);
      csvRows.push(['Actual Gross Revenue (incl. VAT)', Number(summary.revenue).toFixed(2)]);
      csvRows.push(['Actual Net Revenue (subtotal)', Number(summary.subtotalRevenue).toFixed(2)]);
      csvRows.push(['Real Labour cost', Number(summary.realLabourCost).toFixed(2)]);
      csvRows.push(['Materials Cost', Number(summary.materialCost).toFixed(2)]);
      csvRows.push(['Commissions Paid', Number(summary.commission).toFixed(2)]);
      csvRows.push(['Bonuses Paid', Number(summary.bonuses).toFixed(2)]);
      csvRows.push(['Hidden Indirect Costs', Number(summary.hiddenCosts).toFixed(2)]);
      csvRows.push(['Other Unofficial Expenses', Number(summary.expenses).toFixed(2)]);
      csvRows.push(['Management Net Profit', Number(summary.netProfit).toFixed(2)]);
      csvRows.push(['Margin Percent (%)', Number(summary.profitMargin).toFixed(1)]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.map(e => e.map(val => `"${val}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 text-dark">
      
      {/* Date Filter Selection Panel */}
      <div className="bg-[#EAE8E2] border border-black/5 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-end gap-4">
        <div className="flex flex-col space-y-1 w-full md:w-auto">
          <label className="text-[10px] font-bold font-mono text-dark/50 uppercase tracking-wider">Start Date</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-background border border-black/5 rounded-xl px-4 py-2.5 text-xs focus:outline-none" 
          />
        </div>

        <div className="flex flex-col space-y-1 w-full md:w-auto">
          <label className="text-[10px] font-bold font-mono text-dark/50 uppercase tracking-wider">End Date</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-background border border-black/5 rounded-xl px-4 py-2.5 text-xs focus:outline-none" 
          />
        </div>

        <button
          onClick={handleFetchData}
          disabled={loading}
          className="bg-accent text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#CC5833]/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Compiling Summary...' : 'Update Parameters'}
        </button>

        <button
          onClick={handleExportCSV}
          className="border border-[#2E4036]/20 bg-[#2E4036]/5 hover:bg-[#2E4036]/10 text-[#2E4036] px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ml-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Ledger</span>
        </button>
      </div>

      {mode === 'OFFICIAL' ? (
        
        /* OFFICIAL MODE 1 SHEETS */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#EAE8E2] border border-black/5 p-6 rounded-3xl shadow-sm space-y-2">
            <p className="text-[10px] font-bold font-mono text-dark/40 uppercase tracking-widest">OFFICIAL REVENUE</p>
            <p className="text-3xl font-heading font-black text-dark">
              €{Number(summary.subtotalRevenue).toFixed(2)} <span className="text-xs font-mono text-dark/50 font-normal">(Net)</span>
            </p>
            <p className="text-[10px] font-mono text-dark/50">
              Gross (incl. VAT): €{Number(summary.revenue).toFixed(2)} | VAT: €{Number(summary.vatCollected).toFixed(2)}
            </p>
          </div>

          <div className="bg-[#EAE8E2] border border-black/5 p-6 rounded-3xl shadow-sm space-y-2">
            <p className="text-[10px] font-bold font-mono text-dark/40 uppercase tracking-widest">TAX DEDUCTIBLE EXPENSES</p>
            <p className="text-3xl font-heading font-black text-[#CC5833]">€{Number(summary.expenses).toFixed(2)}</p>
            <p className="text-[10px] font-mono text-dark/50">Total operating invoice logs</p>
          </div>

          <div className="bg-[#EAE8E2] border border-black/5 p-6 rounded-3xl shadow-sm space-y-2">
            <p className="text-[10px] font-bold font-mono text-dark/40 uppercase tracking-widest">TAXABLE NET PROFIT</p>
            <p className="text-3xl font-heading font-black text-[#2E4036]">€{Number(summary.netProfit).toFixed(2)}</p>
            <p className="text-[10px] font-mono text-dark/50">Official P&L books parameters</p>
          </div>
        </div>

      ) : (
        
        /* MANAGEMENT MODE 2 SHEETS (SUPER_ADMIN ONLY) */
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="bg-[#EAE8E2] border border-black/5 p-6 rounded-3xl shadow-sm space-y-2">
              <p className="text-[10px] font-bold font-mono text-dark/40 uppercase tracking-widest">ACTUAL REVENUE</p>
              <p className="text-2xl font-heading font-black text-dark">
                €{Number(summary.subtotalRevenue).toFixed(2)} <span className="text-xs font-mono text-dark/50 font-normal">(Net)</span>
              </p>
              <p className="text-[10px] font-mono text-dark/50">Gross: €{Number(summary.revenue).toFixed(2)}</p>
            </div>

            <div className="bg-[#EAE8E2] border border-black/5 p-6 rounded-3xl shadow-sm space-y-2">
              <p className="text-[10px] font-bold font-mono text-dark/40 uppercase tracking-widest">LABOUR & BONUSES</p>
              <p className="text-2xl font-heading font-black text-[#CC5833]">
                €{(Number(summary.realLabourCost) + Number(summary.bonuses)).toFixed(2)}
              </p>
            </div>

            <div className="bg-[#EAE8E2] border border-black/5 p-6 rounded-3xl shadow-sm space-y-2">
              <p className="text-[10px] font-bold font-mono text-dark/40 uppercase tracking-widest">ACTUAL NET PROFIT</p>
              <p className="text-2xl font-heading font-black text-[#2E4036]">€{Number(summary.netProfit).toFixed(2)}</p>
            </div>

            <div className="bg-[#EAE8E2] border border-black/5 p-6 rounded-3xl shadow-sm space-y-2">
              <p className="text-[10px] font-bold font-mono text-dark/40 uppercase tracking-widest">NET MARGIN (%)</p>
              <p className="text-2xl font-heading font-black text-[#2E4036]">{Number(summary.profitMargin).toFixed(1)}%</p>
            </div>

          </div>

          {/* Job Level Cost margins Table (only visible in Mode 2!) */}
          <div className="bg-[#EAE8E2] border border-black/5 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Table className="w-5 h-5 text-accent" />
              <h3 className="font-heading font-extrabold text-md uppercase">ACTUAL MARGINS PER CLEANING JOB</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-black/10 text-dark/50 font-bold uppercase tracking-wider">
                    <th className="pb-3">OFFER</th>
                    <th className="pb-3">CUSTOMER</th>
                    <th className="pb-3">REVENUE</th>
                    <th className="pb-3">LABOUR COST</th>
                    <th className="pb-3">MATERIALS / HIDDEN</th>
                    <th className="pb-3">NET PROFIT</th>
                    <th className="pb-3 text-right">MARGIN (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {jobsAnalytics.map((j) => (
                    <tr key={j.id} className="hover:bg-black/5 transition-colors">
                      <td className="py-3 pr-2 font-bold">{j.quoteNumber}</td>
                      <td className="py-3 pr-2 font-body text-xs font-bold">{j.customerName}</td>
                      <td className="py-3 pr-2 font-bold">€{j.revenue.toFixed(2)}</td>
                      <td className="py-3 pr-2 text-red-600">€{j.labour.toFixed(2)}</td>
                      <td className="py-3 pr-2 text-red-600">€{(j.material + j.hidden).toFixed(2)}</td>
                      <td className="py-3 pr-2 text-green-700 font-bold">€{j.profit.toFixed(2)}</td>
                      <td className="py-3 pr-2 text-right font-bold text-[#2E4036]">
                        {j.margin.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                  {jobsAnalytics.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-dark/45">
                        NO COMPLETED JOBS RECORDED IN THIS DATE RANGE
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      )}

    </div>
  );
}
