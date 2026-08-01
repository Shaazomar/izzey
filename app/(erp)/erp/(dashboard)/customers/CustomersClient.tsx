'use client';

import React, { useState } from 'react';
import { createCustomer, addProperty, deleteCustomer, deleteProperty } from '@/app/actions/customers';
import { Plus, Search, Building, User, Mail, Phone, MapPin, X, Trash2, Eye } from 'lucide-react';

interface CustomersClientProps {
  initialCustomers: any[];
}

export default function CustomersClient({ initialCustomers }: CustomersClientProps) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  
  // Modals state
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [error, setError] = useState('');

  // Search filter
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.companyName && c.companyName.toLowerCase().includes(search.toLowerCase())) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const res = await createCustomer(data);
    if (res.success && res.data) {
      setCustomers([res.data, ...customers]);
      setCustomerModalOpen(false);
    } else {
      setError(res.error || 'Failed to create customer');
    }
  };

  const handleAddProperty = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    const rawData = Object.fromEntries(formData.entries());
    const data = {
      ...rawData,
      customerId: selectedCustomer.id,
    };

    const res = await addProperty(data);
    if (res.success && res.data) {
      const updatedProperties = [res.data, ...(selectedCustomer.properties || [])];
      const updatedCustomer = { ...selectedCustomer, properties: updatedProperties };
      setSelectedCustomer(updatedCustomer);
      
      // Update list
      setCustomers(customers.map(c => c.id === selectedCustomer.id ? { ...c, properties: updatedProperties } : c));
      setPropertyModalOpen(false);
    } else {
      setError(res.error || 'Failed to add property');
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer? This will remove all properties, invoices, and quotes associated.')) return;
    const res = await deleteCustomer(id);
    if (res.success) {
      setCustomers(customers.filter(c => c.id !== id));
      if (selectedCustomer?.id === id) setSelectedCustomer(null);
    }
  };

  const handleDeleteProperty = async (propId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    const res = await deleteProperty(propId, selectedCustomer.id);
    if (res.success) {
      const updatedProperties = selectedCustomer.properties.filter((p: any) => p.id !== propId);
      const updatedCustomer = { ...selectedCustomer, properties: updatedProperties };
      setSelectedCustomer(updatedCustomer);
      setCustomers(customers.map(c => c.id === selectedCustomer.id ? { ...c, properties: updatedProperties } : c));
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
            placeholder="Search customers by name, company, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#EAE8E2] border border-black/5 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <button
          onClick={() => {
            setError('');
            setCustomerModalOpen(true);
          }}
          className="bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#CC5833]/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer</span>
        </button>
      </div>

      {/* Main Customers Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Customers List */}
        <div className="bg-[#EAE8E2] border border-black/5 rounded-3xl p-6 shadow-sm xl:col-span-2 space-y-4">
          <h2 className="font-heading font-extrabold text-lg">CUSTOMER LEDGER</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono select-none">
              <thead>
                <tr className="border-b border-black/10 text-dark/50 font-bold uppercase tracking-wider">
                  <th className="pb-3">NAME / COMPANY</th>
                  <th className="pb-3">EMAIL / PHONE</th>
                  <th className="pb-3">LOCATION</th>
                  <th className="pb-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-black/5 transition-colors group">
                    <td className="py-3.5 pr-2">
                      <div className="font-bold font-body text-sm text-dark">{c.name}</div>
                      {c.companyName && (
                        <div className="text-[10px] font-mono text-dark/50 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-accent" />
                          <span>{c.companyName}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 pr-2">
                      <div>{c.email}</div>
                      {c.phone && <div className="text-dark/50 mt-0.5">{c.phone}</div>}
                    </td>
                    <td className="py-3.5 pr-2">
                      <div>{c.city}</div>
                      <div className="text-dark/40 text-[10px] uppercase mt-0.5">{c.country}</div>
                    </td>
                    <td className="py-3.5 text-right space-x-1">
                      <button
                        onClick={async () => {
                          const res = await fetch(`/api/customers/${c.id}`).then(r => r.json());
                          if (res.success) {
                            setSelectedCustomer(res.data);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-black/5 text-dark/60 hover:text-dark transition-all inline-flex items-center"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(c.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500/60 hover:text-red-600 transition-all inline-flex items-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-dark/40">
                      NO CUSTOMERS RECORDED IN THIS RANGE
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Customer Details Side Drawer */}
        <div className="space-y-6">
          {selectedCustomer ? (
            <div className="bg-[#EAE8E2] border border-black/5 rounded-3xl p-6 shadow-sm space-y-6 relative animate-fade-in">
              
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-black/5 text-dark/40 hover:text-dark"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-2 pt-2">
                <p className="text-[10px] font-bold font-mono text-dark/40 tracking-widest uppercase">CUSTOMER SUMMARY</p>
                <h3 className="font-heading font-black text-xl leading-tight">{selectedCustomer.name}</h3>
                {selectedCustomer.companyName && (
                  <p className="text-xs font-mono text-accent flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5" />
                    <span>{selectedCustomer.companyName}</span>
                  </p>
                )}
              </div>

              {/* Info Matrix */}
              <div className="space-y-3 font-mono text-xs border-t border-b border-black/5 py-4">
                <div className="flex items-center gap-2 text-dark/80">
                  <Mail className="w-3.5 h-3.5 text-dark/40" />
                  <span className="truncate">{selectedCustomer.email}</span>
                </div>
                {selectedCustomer.phone && (
                  <div className="flex items-center gap-2 text-dark/80">
                    <Phone className="w-3.5 h-3.5 text-dark/40" />
                    <span>{selectedCustomer.phone}</span>
                  </div>
                )}
                {selectedCustomer.vatNumber && (
                  <div className="flex items-center gap-2 text-dark/80">
                    <span className="font-bold text-[10px] bg-black/5 px-1.5 py-0.5 rounded text-dark/50">VAT ID</span>
                    <span>{selectedCustomer.vatNumber}</span>
                  </div>
                )}
                <div className="flex items-start gap-2 text-dark/80">
                  <MapPin className="w-3.5 h-3.5 text-dark/40 mt-0.5" />
                  <span>
                    {selectedCustomer.address},<br />
                    {selectedCustomer.city}, {selectedCustomer.country}
                  </span>
                </div>
              </div>

              {/* Properties Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-heading font-bold text-sm">Registered Properties</h4>
                  <button
                    onClick={() => {
                      setError('');
                      setPropertyModalOpen(true);
                    }}
                    className="p-1 rounded-lg hover:bg-black/5 text-accent inline-flex items-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedCustomer.properties?.map((prop: any) => (
                    <div key={prop.id} className="bg-background border border-black/5 p-3 rounded-xl flex justify-between items-center gap-4 text-xs font-mono">
                      <div>
                        <div>{prop.address}</div>
                        <div className="text-[10px] text-dark/40">{prop.postalCode} {prop.city}</div>
                      </div>
                      <button
                        onClick={() => handleDeleteProperty(prop.id)}
                        className="text-red-500/60 hover:text-red-600 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {(!selectedCustomer.properties || selectedCustomer.properties.length === 0) && (
                    <p className="text-xs text-dark/40 italic text-center font-mono py-2">
                      No properties registered.
                    </p>
                  )}
                </div>
              </div>

              {/* Analytics Summaries */}
              <div className="grid grid-cols-2 gap-4 pt-2 text-xs font-mono text-center">
                <div className="bg-background border border-black/5 p-3 rounded-xl">
                  <div className="text-dark/40 text-[10px] uppercase">Quotations</div>
                  <div className="text-lg font-heading font-extrabold text-dark mt-1">
                    {selectedCustomer.quotations?.length || 0}
                  </div>
                </div>
                <div className="bg-background border border-black/5 p-3 rounded-xl">
                  <div className="text-dark/40 text-[10px] uppercase">Invoices</div>
                  <div className="text-lg font-heading font-extrabold text-dark mt-1">
                    {selectedCustomer.invoices?.length || 0}
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-[#EAE8E2] border border-black/5 border-dashed rounded-3xl p-8 text-center text-dark/40 text-sm font-mono flex flex-col items-center justify-center min-h-[300px]">
              <User className="w-12 h-12 text-dark/10 mb-4" />
              <span>Select a customer to view complete profile parameters.</span>
            </div>
          )}
        </div>

      </div>

      {/* Customer Modal dialog */}
      {customerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#EAE8E2] rounded-3xl p-8 shadow-2xl border border-black/5 relative animate-scale-up font-body text-dark">
            <button
              onClick={() => setCustomerModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-black/5 text-dark/40"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-heading font-extrabold text-xl mb-6">Create Customer Profile</h3>
            
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">NAME</label>
                  <input type="text" name="name" required className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-accent" placeholder="John Doe" />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">COMPANY NAME</label>
                  <input type="text" name="companyName" className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-accent" placeholder="Optional" />
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">EMAIL ADDRESS</label>
                <input type="email" name="email" required className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-accent" placeholder="john@example.com" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">PHONE NUMBER</label>
                  <input type="text" name="phone" className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-accent" placeholder="+49..." />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">VAT NUMBER (USt-IdNr.)</label>
                  <input type="text" name="vatNumber" className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-accent" placeholder="e.g. DE123..." />
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">STREET ADDRESS</label>
                <input type="text" name="address" required className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-accent" placeholder="Alt Moabit 58" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">CITY</label>
                  <input type="text" name="city" required className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-accent" placeholder="Berlin" />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">COUNTRY</label>
                  <input type="text" name="country" required defaultValue="Germany" className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-accent" />
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">INTERNAL NOTES</label>
                <textarea name="notes" rows={2} className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-accent" placeholder="Additional parameters..."></textarea>
              </div>

              {error && <div className="text-red-500 text-xs text-center font-mono">{error}</div>}

              <button type="submit" className="w-full bg-[#CC5833] hover:bg-[#CC5833]/90 text-white rounded-xl py-3 text-xs font-bold tracking-wide transition-colors">
                SAVE CUSTOMER PROFILE
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Property Modal dialog */}
      {propertyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#EAE8E2] rounded-3xl p-8 shadow-2xl border border-black/5 relative animate-scale-up font-body text-dark">
            <button
              onClick={() => setPropertyModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-black/5 text-dark/40"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-heading font-extrabold text-xl mb-6">Register Property</h3>
            
            <form onSubmit={handleAddProperty} className="space-y-4">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">STREET ADDRESS</label>
                <input type="text" name="address" required className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-accent" placeholder="Müllerstraße 12" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">POSTAL CODE</label>
                  <input type="text" name="postalCode" required className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-accent" placeholder="13353" />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">CITY</label>
                  <input type="text" name="city" required className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-accent" placeholder="Berlin" />
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">COUNTRY</label>
                <input type="text" name="country" required defaultValue="Germany" className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-accent" />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">PROPERTY NOTES</label>
                <textarea name="notes" rows={2} className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-accent" placeholder="Building specs, floor, elevator status..."></textarea>
              </div>

              {error && <div className="text-red-500 text-xs text-center font-mono">{error}</div>}

              <button type="submit" className="w-full bg-[#CC5833] hover:bg-[#CC5833]/90 text-white rounded-xl py-3 text-xs font-bold tracking-wide transition-colors">
                REGISTER PROPERTY
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
