'use client';

import React from 'react';

export default function Loading() {
  return (
    <div className="p-6 space-y-6 animate-pulse select-none">
      {/* Skeleton Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-200 rounded-lg"></div>
          <div className="h-3.5 w-64 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="h-10 w-36 bg-slate-200 rounded-xl self-start sm:self-auto"></div>
      </div>

      {/* Skeleton KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs flex items-start justify-between">
            <div className="space-y-2.5 flex-1">
              <div className="h-3 w-20 bg-slate-200 rounded"></div>
              <div className="h-6 w-16 bg-slate-200 rounded"></div>
              <div className="h-3.5 w-24 bg-slate-200 rounded"></div>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
          </div>
        ))}
      </div>

      {/* Skeleton Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table Card */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/60 shadow-xs p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-5 w-32 bg-slate-200 rounded-lg"></div>
            <div className="h-8 w-24 bg-slate-200 rounded-lg"></div>
          </div>
          <div className="h-8 w-full bg-slate-100 rounded-lg"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-slate-200 rounded-full"></div>
                  <div className="h-4 w-36 bg-slate-200 rounded"></div>
                </div>
                <div className="h-4 w-12 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Side Card */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/60 shadow-xs p-6 space-y-6">
          <div className="h-5 w-24 bg-slate-200 rounded-lg"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="w-10 h-10 rounded-xl bg-slate-200"></div>
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-24 bg-slate-200 rounded"></div>
                  <div className="h-2 w-16 bg-slate-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
