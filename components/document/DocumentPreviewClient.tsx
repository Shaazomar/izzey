'use client';

import React, { useState, useRef, useEffect } from 'react';
import BaseTemplate, { DocumentData } from './BaseTemplate';
import { Printer, Download, ArrowLeft, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { deleteQuotation } from '@/app/actions/quotes';
import { deleteInvoice } from '@/app/actions/invoices';

interface DocumentPreviewClientProps {
  data: DocumentData;
  backUrl: string;
  documentId?: string;
}

export default function DocumentPreviewClient({ data, backUrl, documentId }: DocumentPreviewClientProps) {
  const router = useRouter();
  const [scale, setScale] = useState(1);
  const [deleting, setDeleting] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDelete = async () => {
    const id = documentId || (data as any).id;
    if (!id) return;
    const docName = data.type === 'quotation' ? 'quotation' : 'invoice';
    if (!confirm(`Are you sure you want to delete this ${docName} (${data.number})?`)) return;

    setDeleting(true);
    let res;
    if (data.type === 'quotation') {
      res = await deleteQuotation(id);
    } else {
      res = await deleteInvoice(id);
    }
    setDeleting(false);

    if (res.success) {
      router.push(backUrl);
    } else {
      alert(res.error || `Failed to delete ${docName}.`);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current) {
        const parentWidth = wrapperRef.current.clientWidth;
        const targetWidth = 794; // approx width of A4 (210mm) in pixels
        const availableWidth = parentWidth - 32; // 16px padding on left/right

        if (availableWidth < targetWidth) {
          const factor = availableWidth / targetWidth;
          setScale(factor);
        } else {
          setScale(1);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const timer = setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F2F0E9] text-dark font-body relative flex flex-col print:bg-white print:p-0">
      {/* Top Preview Bar - Hidden on Print */}
      <div className="no-print h-16 border-b border-black/5 bg-[#EAE8E2] px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push(backUrl)}
            className="p-2 rounded-xl hover:bg-black/5 text-dark/70 hover:text-dark transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="h-4 w-px bg-black/10 hidden sm:block"></div>
          <div>
            <h2 className="font-heading font-extrabold text-sm tracking-tight text-[#102B6A]">
              {data.type === 'quotation' ? 'OFFER PREVIEW' : 'INVOICE PREVIEW'}
            </h2>
            <p className="text-[10px] text-dark/50 font-mono">{data.number}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Delete Button */}
          {(documentId || (data as any).id) && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>{deleting ? 'Deleting...' : 'Delete'}</span>
            </button>
          )}

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="bg-dark hover:bg-dark/95 text-background px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>

          {/* Generate PDF Button */}
          <button
            onClick={handlePrint}
            className="bg-[#CC5833] hover:bg-[#CC5833]/95 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Generate PDF</span>
          </button>
        </div>
      </div>

      {/* Centered Document Wrapper */}
      <div 
        ref={wrapperRef}
        className="flex-1 p-4 sm:p-8 md:p-12 overflow-x-auto flex justify-center items-start print:p-0 print:m-0 print:bg-white print:block"
      >
        <div 
          style={{ 
            transform: `scale(${scale})`, 
            transformOrigin: 'top center',
            marginBottom: scale < 1 ? `calc(-297mm * ${1 - scale})` : '0px',
            width: '210mm'
          }}
          className="bg-white shadow-2xl border border-black/5 rounded-[2rem] overflow-hidden print:shadow-none print:border-none print:rounded-none print:p-0 print:m-0 shrink-0 transition-transform duration-200"
        >
          <BaseTemplate data={data} />
        </div>
      </div>
    </div>
  );
}
