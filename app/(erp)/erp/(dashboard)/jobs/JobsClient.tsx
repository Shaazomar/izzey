'use client';

import React, { useState } from 'react';
import { updateJobStatus, updateJobAssignments, saveManagementCosts, uploadJobImage } from '@/app/actions/jobs';
import { useSession } from 'next-auth/react';
import { 
  Calendar, CheckCircle2, Play, AlertCircle, XCircle, Plus, Eye, X, 
  UserPlus, Upload, ShieldAlert, Euro, Image as ImageIcon 
} from 'lucide-react';
import { JobStatus, JobImageType } from '@prisma/client';

interface JobsClientProps {
  initialJobs: any[];
  employees: any[];
}

export default function JobsClient({ initialJobs, employees }: JobsClientProps) {
  const [jobs, setJobs] = useState(initialJobs);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  
  // Modals state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [costsModalOpen, setCostsModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [error, setError] = useState('');

  const { data: session } = useSession();
  const userRole = session?.user?.role || 'EMPLOYEE';

  const handleUpdateStatus = async (id: string, status: JobStatus) => {
    const res = await updateJobStatus(id, status);
    if (res.success && res.data) {
      setJobs(jobs.map(j => j.id === id ? { ...j, status: res.data.status, completionDate: res.data.completionDate } : j));
      if (selectedJob?.id === id) {
        setSelectedJob({ ...selectedJob, status: res.data.status, completionDate: res.data.completionDate });
      }
    }
  };

  const handleAssignEmployees = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    const selectedEmpIds = formData.getAll('employeeIds') as string[];

    const res = await updateJobAssignments(selectedJob.id, selectedEmpIds);
    if (res.success) {
      // Refresh selected job assignment list
      const updatedAssignments = selectedEmpIds.map(empId => {
        const emp = employees.find(e => e.id === empId);
        return { employee: emp };
      });
      const updatedJob = { ...selectedJob, assignments: updatedAssignments };
      setSelectedJob(updatedJob);
      setJobs(jobs.map(j => j.id === selectedJob.id ? updatedJob : j));
      setAssignModalOpen(false);
    } else {
      setError(res.error || 'Failed to update assignments');
    }
  };

  const handleSaveCosts = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    const rawData = Object.fromEntries(formData.entries());

    const payload = {
      jobId: selectedJob.id,
      realLabourCost: Number(rawData.realLabourCost),
      bonuses: Number(rawData.bonuses),
      commission: Number(rawData.commission),
      materialCost: Number(rawData.materialCost),
      hiddenCosts: Number(rawData.hiddenCosts),
      notes: rawData.notes as string,
    };

    const res = await saveManagementCosts(payload);
    if (res.success && res.data) {
      const updatedJob = { ...selectedJob, managementCost: res.data };
      setSelectedJob(updatedJob);
      setJobs(jobs.map(j => j.id === selectedJob.id ? updatedJob : j));
      setCostsModalOpen(false);
    } else {
      setError(res.error || 'Failed to save costs');
    }
  };

  const handleUploadImage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    const rawData = Object.fromEntries(formData.entries());

    const res = await uploadJobImage(selectedJob.id, rawData.url as string, rawData.type as JobImageType);
    if (res.success && res.data) {
      const updatedImages = [...(selectedJob.images || []), res.data];
      const updatedJob = { ...selectedJob, images: updatedImages };
      setSelectedJob(updatedJob);
      setJobs(jobs.map(j => j.id === selectedJob.id ? updatedJob : j));
      setImageModalOpen(false);
    } else {
      setError(res.error || 'Failed to record image url');
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Jobs List */}
        <div className="bg-[#EAE8E2] border border-black/5 rounded-3xl p-6 shadow-sm xl:col-span-2 space-y-4 text-dark">
          <h2 className="font-heading font-extrabold text-lg">JOBS SCHEDULE</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono select-none">
              <thead>
                <tr className="border-b border-black/10 text-dark/50 font-bold uppercase tracking-wider">
                  <th className="pb-3">START DATE</th>
                  <th className="pb-3">CUSTOMER / LOCATION</th>
                  <th className="pb-3">ASSIGNED WORKERS</th>
                  <th className="pb-3">STATUS</th>
                  <th className="pb-3 text-right">AUDIT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-black/5 transition-colors">
                    <td className="py-4 pr-2 font-bold">{new Date(j.startDate).toLocaleDateString('de-DE')}</td>
                    <td className="py-4 pr-2">
                      <div className="font-bold text-dark font-body text-xs">{j.quotation?.customer.name}</div>
                      <div className="text-[10px] text-dark/65">{j.quotation?.property.address}, {j.quotation?.property.city}</div>
                    </td>
                    <td className="py-4 pr-2">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {j.assignments.map((asg: any) => (
                          <span key={asg.employee.id} className="bg-black/5 text-[9px] px-1.5 py-0.5 rounded text-dark/70 font-sans">
                            {asg.employee.name}
                          </span>
                        ))}
                        {j.assignments.length === 0 && <span className="text-dark/40 italic">Unassigned</span>}
                      </div>
                    </td>
                    <td className="py-4 pr-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        j.status === 'COMPLETED' 
                          ? 'bg-[#2E4036]/15 text-[#2E4036]' 
                          : j.status === 'IN_PROGRESS' 
                            ? 'bg-[#CC5833]/15 text-[#CC5833]' 
                            : j.status === 'SCHEDULED'
                              ? 'bg-yellow-600/15 text-yellow-700'
                              : 'bg-red-500/15 text-red-600'
                      }`}>
                        {j.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => setSelectedJob(j)}
                        className="p-1.5 rounded-lg hover:bg-black/5 text-dark/60 hover:text-dark transition-all inline-flex items-center"
                        title="Audit Job"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {jobs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-dark/40">
                      NO JOBS SCHEDULED IN THIS RANGE
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Job Audit panel details */}
        <div className="space-y-6">
          {selectedJob ? (
            <div className="bg-[#EAE8E2] border border-black/5 rounded-3xl p-6 shadow-sm space-y-6 relative animate-fade-in text-dark">
              
              <button 
                onClick={() => setSelectedJob(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-black/5 text-dark/40 hover:text-dark"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-2 pt-2">
                <p className="text-[10px] font-bold font-mono text-dark/40 tracking-widest uppercase">JOB DETAILED AUDIT</p>
                <h3 className="font-heading font-black text-lg leading-tight">
                  {selectedJob.quotation?.customer.name}
                </h3>
                <p className="text-xs text-dark/60 font-mono">
                  Coordinates: {selectedJob.quotation?.property.address}, {selectedJob.quotation?.property.city}
                </p>
              </div>

              {/* Status Select action and Assign Employee Button */}
              <div className="flex flex-wrap gap-2">
                <select
                  value={selectedJob.status}
                  onChange={(e) => handleUpdateStatus(selectedJob.id, e.target.value as JobStatus)}
                  className="flex-1 bg-background border border-black/5 rounded-xl px-3 py-2 text-xs focus:outline-none font-bold"
                >
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>

                {userRole !== 'EMPLOYEE' && (
                  <button
                    onClick={() => {
                      setError('');
                      setAssignModalOpen(true);
                    }}
                    className="bg-accent hover:bg-[#CC5833]/90 text-white p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Assign</span>
                  </button>
                )}
              </div>

              {/* Assignments list */}
              <div className="space-y-2">
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider">Dispatched Cleaners</h4>
                <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                  {selectedJob.assignments?.map((asg: any) => (
                    <span key={asg.employee.id} className="bg-background border border-black/5 px-2.5 py-1 rounded-lg">
                      {asg.employee.name}
                    </span>
                  ))}
                  {(!selectedJob.assignments || selectedJob.assignments.length === 0) && (
                    <p className="text-xs text-dark/40 italic font-mono">No cleaners dispatched.</p>
                  )}
                </div>
              </div>

              {/* Image ledger logs (Before / After) */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-black/5 pb-1">
                  <h4 className="font-heading font-bold text-xs uppercase tracking-wider">Before & After Images</h4>
                  <button
                    onClick={() => {
                      setError('');
                      setImageModalOpen(true);
                    }}
                    className="text-xs text-accent font-mono font-bold flex items-center gap-0.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center text-[10px] font-mono">
                  {selectedJob.images?.map((img: any) => (
                    <div key={img.id} className="bg-background border border-black/5 p-2 rounded-xl space-y-1.5">
                      <div className="relative aspect-video w-full rounded-lg bg-black/5 overflow-hidden flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-dark/20" />
                      </div>
                      <div className="flex justify-between px-1">
                        <span className="font-bold text-accent">{img.type}</span>
                        <a href={img.url} target="_blank" rel="noreferrer" className="underline text-[#CC5833]">Link</a>
                      </div>
                    </div>
                  ))}
                  {(!selectedJob.images || selectedJob.images.length === 0) && (
                    <p className="col-span-2 text-xs text-dark/40 italic font-mono py-2">No photo logs.</p>
                  )}
                </div>
              </div>

              {/* Super Admin Management Cost Section (Mode 2) */}
              {userRole === 'SUPER_ADMIN' && (
                <div className="bg-[#CC5833]/5 border border-[#CC5833]/15 p-4 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-heading font-bold text-xs text-[#CC5833] flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" />
                      <span>MANAGEMENT JOB COSTS</span>
                    </h4>
                    <button
                      onClick={() => {
                        setError('');
                        setCostsModalOpen(true);
                      }}
                      className="text-[10px] font-mono font-bold text-[#CC5833] border border-[#CC5833]/25 px-2 py-0.5 rounded"
                    >
                      Modify
                    </button>
                  </div>

                  {selectedJob.managementCost ? (
                    <div className="font-mono text-xs space-y-2">
                      <div className="flex justify-between border-b border-[#CC5833]/10 pb-1">
                        <span>Real Labour Cost:</span>
                        <span>€{Number(selectedJob.managementCost.realLabourCost).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#CC5833]/10 pb-1">
                        <span>Materials & Fuel:</span>
                        <span>€{Number(selectedJob.managementCost.materialCost).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#CC5833]/10 pb-1">
                        <span>Bonus & Comm:</span>
                        <span>€{(Number(selectedJob.managementCost.bonuses) + Number(selectedJob.managementCost.commission)).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#CC5833]/10 pb-1">
                        <span>Hidden Costs:</span>
                        <span>€{Number(selectedJob.managementCost.hiddenCosts).toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-dark/45 italic font-mono text-center">No costs logged.</p>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="bg-[#EAE8E2] border border-black/5 border-dashed rounded-3xl p-8 text-center text-dark/40 text-sm font-mono flex flex-col items-center justify-center min-h-[300px]">
              <Calendar className="w-12 h-12 text-dark/10 mb-4" />
              <span>Select an assignment from the schedule to dispatch cleaners, log photos, or modify details.</span>
            </div>
          )}
        </div>

      </div>

      {/* Assign Employees Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#EAE8E2] rounded-3xl p-8 shadow-2xl border border-black/5 relative animate-scale-up font-body text-dark">
            <button
              onClick={() => setAssignModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-black/5 text-dark/40"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-heading font-extrabold text-xl mb-6">Dispatch Cleaners</h3>
            
            <form onSubmit={handleAssignEmployees} className="space-y-4">
              <div className="flex flex-col space-y-1.5 max-h-60 overflow-y-auto">
                <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase mb-1">SELECT DISPATCH EMPLOYEES</label>
                {employees.map(emp => {
                  const isAssigned = selectedJob.assignments?.some((a: any) => a.employee.id === emp.id);
                  return (
                    <div key={emp.id} className="flex items-center gap-2.5 p-2 bg-background border border-black/5 rounded-xl text-xs font-mono">
                      <input 
                        type="checkbox" 
                        name="employeeIds" 
                        value={emp.id}
                        defaultChecked={isAssigned}
                        id={`emp-${emp.id}`}
                        className="w-4 h-4 accent-accent cursor-pointer"
                      />
                      <label htmlFor={`emp-${emp.id}`} className="cursor-pointer font-bold">{emp.name} ({emp.role})</label>
                    </div>
                  );
                })}
              </div>

              {error && <div className="text-red-500 text-xs text-center font-mono">{error}</div>}

              <button type="submit" className="w-full bg-[#CC5833] hover:bg-[#CC5833]/90 text-white rounded-xl py-3 text-xs font-bold tracking-wide transition-colors">
                UPDATE DISPATCH ASSIGNMENTS
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Upload Image Modal */}
      {imageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#EAE8E2] rounded-3xl p-8 shadow-2xl border border-black/5 relative animate-scale-up font-body text-dark">
            <button
              onClick={() => setImageModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-black/5 text-dark/40"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-heading font-extrabold text-xl mb-6">Log Photo Entry</h3>
            
            <form onSubmit={handleUploadImage} className="space-y-4">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">IMAGE CDN URL</label>
                <input type="url" name="url" required className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-accent font-mono" placeholder="https://..." />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">IMAGE TYPE Classification</label>
                <select name="type" required defaultValue="BEFORE" className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none cursor-pointer">
                  <option value="BEFORE">BEFORE START</option>
                  <option value="AFTER">AFTER COMPLETION</option>
                </select>
              </div>

              {error && <div className="text-red-500 text-xs text-center font-mono">{error}</div>}

              <button type="submit" className="w-full bg-[#CC5833] hover:bg-[#CC5833]/90 text-white rounded-xl py-3 text-xs font-bold tracking-wide transition-colors">
                RECORD IMAGE LOG
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modify Management Costs Modal */}
      {costsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#EAE8E2] rounded-3xl p-8 shadow-2xl border border-black/5 relative animate-scale-up font-body text-dark">
            <button
              onClick={() => setCostsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-black/5 text-dark/40"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-heading font-extrabold text-xl mb-6">Adjust Internal Costs</h3>
            
            <form onSubmit={handleSaveCosts} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">REAL LABOUR (€)</label>
                  <input 
                    type="number" 
                    name="realLabourCost" 
                    required 
                    min="0" 
                    step="any"
                    defaultValue={Number(selectedJob.managementCost?.realLabourCost || 0)}
                    className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-accent font-mono" 
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">BONUSES (€)</label>
                  <input 
                    type="number" 
                    name="bonuses" 
                    required 
                    min="0" 
                    step="any"
                    defaultValue={Number(selectedJob.managementCost?.bonuses || 0)}
                    className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-accent font-mono" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">COMMISSION (€)</label>
                  <input 
                    type="number" 
                    name="commission" 
                    required 
                    min="0" 
                    step="any"
                    defaultValue={Number(selectedJob.managementCost?.commission || 0)}
                    className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-accent font-mono" 
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">MATERIALS COST (€)</label>
                  <input 
                    type="number" 
                    name="materialCost" 
                    required 
                    min="0" 
                    step="any"
                    defaultValue={Number(selectedJob.managementCost?.materialCost || 0)}
                    className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-accent font-mono" 
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">HIDDEN INDIRECT COSTS (€)</label>
                <input 
                  type="number" 
                  name="hiddenCosts" 
                  required 
                  min="0" 
                  step="any"
                  defaultValue={Number(selectedJob.managementCost?.hiddenCosts || 0)}
                  className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-accent font-mono" 
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold font-mono tracking-wider text-dark/60 uppercase">COST DETAILS NOTES</label>
                <textarea name="notes" rows={2} className="bg-background border border-black/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none" placeholder="Fuel cost breakdown, chemical logs..." defaultValue={selectedJob.managementCost?.notes || ''}></textarea>
              </div>

              {error && <div className="text-red-500 text-xs text-center font-mono">{error}</div>}

              <button type="submit" className="w-full bg-[#CC5833] hover:bg-[#CC5833]/90 text-white rounded-xl py-3 text-xs font-bold tracking-wide transition-colors">
                SAVE ADJUSTED COSTS
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
