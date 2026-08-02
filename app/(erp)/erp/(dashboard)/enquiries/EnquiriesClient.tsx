'use client';

import React, { useState } from 'react';
import { 
  updateEnquiryStatus, 
  updateEnquiryNotes, 
  deleteEnquiry, 
  convertToCustomer 
} from '@/app/actions/enquiries';
import { 
  Search, Mail, Phone, MapPin, Calendar, Clock, 
  Trash2, Eye, X, CheckCircle, UserPlus, Info, 
  Inbox, Sparkles, RefreshCw, AlertCircle
} from 'lucide-react';
import { EnquiryStatus } from '@prisma/client';

interface EnquiriesClientProps {
  initialEnquiries: any[];
}

export default function EnquiriesClient({ initialEnquiries }: EnquiriesClientProps) {
  const [enquiries, setEnquiries] = useState(initialEnquiries);
  const [search, setSearch] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);
  
  // Action states
  const [loading, setLoading] = useState<string | null>(null); // tracks converting status
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [noteEdit, setNoteEdit] = useState('');

  // Search filter
  const filteredEnquiries = enquiries.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    e.address.toLowerCase().includes(search.toLowerCase()) ||
    e.service.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectEnquiry = (enquiry: any) => {
    setSelectedEnquiry(enquiry);
    setNoteEdit(enquiry.notes || '');
    setError('');
    setSuccessMsg('');
  };

  const handleStatusChange = async (id: string, newStatus: EnquiryStatus) => {
    setError('');
    setSuccessMsg('');
    const res = await updateEnquiryStatus(id, newStatus);
    if (res.success && res.data) {
      const updated = enquiries.map(e => e.id === id ? { ...e, status: newStatus } : e);
      setEnquiries(updated);
      setSelectedEnquiry(res.data);
      setSuccessMsg(`Status updated to ${newStatus}`);
    } else {
      setError(res.error || 'Failed to update status');
    }
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiry) return;
    setError('');
    setSuccessMsg('');
    const res = await updateEnquiryNotes(selectedEnquiry.id, noteEdit);
    if (res.success && res.data) {
      const updated = enquiries.map(item => item.id === selectedEnquiry.id ? { ...item, notes: noteEdit } : item);
      setEnquiries(updated);
      setSelectedEnquiry(res.data);
      setSuccessMsg('Notes saved successfully');
    } else {
      setError(res.error || 'Failed to save notes');
    }
  };

  const handleDeleteEnquiry = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this enquiry? This action is irreversible.')) return;
    setError('');
    setSuccessMsg('');
    const res = await deleteEnquiry(id);
    if (res.success) {
      setEnquiries(enquiries.filter(e => e.id !== id));
      if (selectedEnquiry?.id === id) setSelectedEnquiry(null);
      setSuccessMsg('Enquiry deleted');
    } else {
      setError(res.error || 'Failed to delete enquiry');
    }
  };

  const handleConvertToCustomer = async (id: string) => {
    setError('');
    setSuccessMsg('');
    setLoading('converting');
    
    const res = await convertToCustomer(id);
    
    setLoading(null);
    if (res.success && res.data) {
      // Update local enquiries list
      const updated = enquiries.map(item => item.id === id ? { ...item, status: 'CONVERTED' as EnquiryStatus } : item);
      setEnquiries(updated);
      
      // Update currently active detail view
      if (selectedEnquiry?.id === id) {
        setSelectedEnquiry({ ...selectedEnquiry, status: 'CONVERTED' });
      }
      
      setSuccessMsg('Successfully converted enquiry into customer and registered property specifications!');
    } else {
      setError(res.error || 'Failed to convert enquiry');
    }
  };

  // Helper for services display label
  const formatService = (srv: string) => {
    switch (srv) {
      case 'cleaning': return 'Professional Cleaning';
      case 'moving': return 'Relocation Logistics';
      case 'property': return 'Property Management';
      case 'mixed': return 'Combined Dispatch';
      default: return srv.charAt(0).toUpperCase() + srv.slice(1);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-dark/40" />
          <input
            type="text"
            placeholder="Search enquiries by name, email, services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#EAE8E2] border border-black/5 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors text-dark"
          />
        </div>

        <div className="text-xs font-mono font-bold text-slate-500 bg-white/60 px-3 py-1.5 rounded-lg border border-slate-200 self-center">
          Active Leads: {enquiries.filter(e => e.status === 'PENDING').length}
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Enquiries List */}
        <div className="bg-[#EAE8E2] border border-black/5 rounded-3xl p-6 shadow-sm xl:col-span-2 space-y-4">
          <h2 className="font-heading font-extrabold text-lg text-dark">INBOUND PORTAL ENTRIES</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono select-none">
              <thead>
                <tr className="border-b border-black/10 text-dark/50 font-bold uppercase tracking-wider">
                  <th className="pb-3">NAME / CONTACT</th>
                  <th className="pb-3">SPECIFICATIONS</th>
                  <th className="pb-3">PREFERRED TIME</th>
                  <th className="pb-3">STATUS</th>
                  <th className="pb-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 text-dark">
                {filteredEnquiries.map((e) => (
                  <tr key={e.id} className="hover:bg-black/5 transition-colors group">
                    <td className="py-3.5 pr-2">
                      <div className="font-bold font-body text-sm text-dark">{e.name}</div>
                      <div className="text-[10px] text-dark/60 mt-0.5">{e.email}</div>
                      {e.phone && <div className="text-[10px] text-dark/40 mt-0.5">{e.phone}</div>}
                    </td>
                    <td className="py-3.5 pr-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        e.service === 'cleaning' ? 'bg-[#2E4036]/10 text-[#2E4036]' :
                        e.service === 'moving' ? 'bg-[#CC5833]/10 text-[#CC5833]' :
                        e.service === 'property' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {formatService(e.service)}
                      </span>
                      <div className="text-[10px] text-dark/60 truncate max-w-[150px] mt-1">{e.address}</div>
                    </td>
                    <td className="py-3.5 pr-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-accent" />
                        <span>{e.date}</span>
                      </div>
                      <div className="flex items-center gap-1 text-dark/50 mt-0.5">
                        <Clock className="w-3 h-3 text-dark/40" />
                        <span>{e.time}</span>
                      </div>
                    </td>
                    <td className="py-3.5 pr-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold tracking-wider ${
                        e.status === 'PENDING' ? 'bg-[#CC5833]/15 text-[#CC5833]' :
                        e.status === 'CONTACTED' ? 'bg-blue-100 text-blue-800' :
                        e.status === 'CONVERTED' ? 'bg-[#2E4036]/15 text-[#2E4036]' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right space-x-1">
                      <button
                        onClick={() => handleSelectEnquiry(e)}
                        className="p-1.5 rounded-lg hover:bg-black/5 text-dark/60 hover:text-dark transition-all inline-flex items-center"
                        title="View specifications"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEnquiry(e.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500/60 hover:text-red-600 transition-all inline-flex items-center"
                        title="Delete enquiry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredEnquiries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-dark/40">
                      NO BOOKING REQUESTS RECORDED IN THIS RANGE
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Detail / CRM Controller */}
        <div className="space-y-6">
          {selectedEnquiry ? (
            <div className="bg-[#EAE8E2] border border-black/5 rounded-3xl p-6 shadow-sm space-y-6 relative animate-fade-in text-dark">
              
              <button 
                onClick={() => setSelectedEnquiry(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-black/5 text-dark/40 hover:text-dark"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-2 pt-2">
                <p className="text-[10px] font-bold font-mono text-dark/40 tracking-widest uppercase">ENQUIRY CONTROL PANEL</p>
                <h3 className="font-heading font-black text-xl leading-tight">{selectedEnquiry.name}</h3>
                <p className="text-xs font-mono text-[#CC5833] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Requested Service: {formatService(selectedEnquiry.service)}</span>
                </p>
              </div>

              {/* Status Selector */}
              <div className="bg-white/40 p-4 rounded-2xl border border-black/5 space-y-2">
                <label className="text-[10px] font-bold font-mono text-dark/50 uppercase block">Status Parameter</label>
                <select
                  value={selectedEnquiry.status}
                  onChange={(e) => handleStatusChange(selectedEnquiry.id, e.target.value as EnquiryStatus)}
                  className="bg-white border border-black/10 rounded-xl px-3 py-2 text-xs font-bold text-dark focus:outline-none w-full cursor-pointer"
                >
                  <option value="PENDING">PENDING (Clay)</option>
                  <option value="CONTACTED">CONTACTED (Blue)</option>
                  <option value="CONVERTED">CONVERTED (Moss)</option>
                  <option value="ARCHIVED">ARCHIVED (Gray)</option>
                </select>
              </div>

              {/* Contact Specifications Matrix */}
              <div className="space-y-3 font-mono text-xs border-t border-b border-black/5 py-4">
                <div className="flex items-center gap-2 text-dark/80">
                  <Mail className="w-3.5 h-3.5 text-dark/40" />
                  <a href={`mailto:${selectedEnquiry.email}`} className="hover:underline truncate">{selectedEnquiry.email}</a>
                </div>
                {selectedEnquiry.phone && (
                  <div className="flex items-center gap-2 text-dark/80">
                    <Phone className="w-3.5 h-3.5 text-dark/40" />
                    <a href={`tel:${selectedEnquiry.phone}`} className="hover:underline">{selectedEnquiry.phone}</a>
                  </div>
                )}
                <div className="flex items-start gap-2 text-dark/80">
                  <MapPin className="w-3.5 h-3.5 text-dark/40 mt-0.5" />
                  <span>{selectedEnquiry.address}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-black/5 mt-2">
                  <div className="flex items-center gap-1.5 text-dark/70">
                    <Calendar className="w-3.5 h-3.5 text-accent" />
                    <span>{selectedEnquiry.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-dark/70">
                    <Clock className="w-3.5 h-3.5 text-dark/40" />
                    <span>{selectedEnquiry.time}</span>
                  </div>
                </div>
              </div>

              {/* Conversion Module */}
              {selectedEnquiry.status !== 'CONVERTED' ? (
                <div className="bg-[#2E4036]/10 border border-[#2E4036]/20 p-5 rounded-2xl space-y-3">
                  <div className="flex gap-2">
                    <UserPlus className="w-5 h-5 text-[#2E4036] shrink-0" />
                    <div className="text-xs">
                      <p className="font-bold text-[#2E4036]">Convert to Client Profile</p>
                      <p className="text-slate-600 mt-0.5 font-mono text-[10px]">
                        Instantly registers a corporate/individual Customer record and binds the specified location parameter as a Property object.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleConvertToCustomer(selectedEnquiry.id)}
                    disabled={loading === 'converting'}
                    className="w-full bg-[#2E4036] hover:bg-[#1E2E25] disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 uppercase tracking-wider"
                  >
                    {loading === 'converting' ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing Registry...</span>
                      </>
                    ) : (
                      <span>Create Client Profile</span>
                    )}
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex gap-2 text-xs">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold text-emerald-800">Conversion Complete</p>
                    <p className="text-emerald-700 mt-0.5 font-mono text-[10px]">
                      This enquiry has been successfully migrated to the Customer Ledger.
                    </p>
                  </div>
                </div>
              )}

              {/* Internal Notes CRM */}
              <form onSubmit={handleSaveNotes} className="space-y-2">
                <label className="text-[10px] font-bold font-mono text-dark/50 uppercase block">CRM Internal Notes</label>
                <textarea
                  value={noteEdit}
                  onChange={(e) => setNoteEdit(e.target.value)}
                  rows={3}
                  className="w-full bg-white border border-black/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent text-dark font-mono"
                  placeholder="Insert client call summary, dispatch references, or specific requirements..."
                ></textarea>
                <button
                  type="submit"
                  className="w-full bg-[#CC5833] hover:bg-[#B74826] text-white text-xs font-bold py-2.5 rounded-xl transition-colors tracking-wider"
                >
                  SAVE NOTES
                </button>
              </form>

              {/* Success/Error Alerts */}
              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] rounded-xl flex items-center gap-2 font-semibold">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] rounded-xl flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-[#EAE8E2] border border-black/5 border-dashed rounded-3xl p-8 text-center text-dark/40 text-sm font-mono flex flex-col items-center justify-center min-h-[300px]">
              <Inbox className="w-12 h-12 text-dark/10 mb-4" />
              <span>Select an entry from the portal ledger to access communication and registry parameters.</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
