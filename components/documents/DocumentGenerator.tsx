'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, FileText, Download, Eye, RefreshCw, 
  AlertCircle, CheckCircle2, Loader2, Calendar, MapPin, Building, User, Clock, X
} from 'lucide-react';

interface Person {
  lastName: string;
  firstName: string;
}

interface FormData {
  wohnungsgeber: {
    name: string;
    street: string;
    zip: string;
    city: string;
  };
  owner: {
    name: string;
  };
  moveInDate: string;
  property: {
    street: string;
    additionalInfo: string;
    zip: string;
    city: string;
  };
  persons: Person[];
  issueDate: string;
  issuePlace: string;
}

interface JobStep {
  step: string;
  timestamp: string;
  completed: boolean;
}

interface JobState {
  id: string;
  documentId: string;
  templateName?: string;
  status: 'QUEUED' | 'PROCESSING' | 'GENERATING' | 'VERIFYING' | 'COMPLETED' | 'FAILED';
  progress: number;
  stepMessage: string;
  steps: JobStep[];
  errorMessage?: string;
  downloadUrl?: string;
  previewUrl?: string;
  fileName?: string;
  fileSize?: number;
}

interface HistoryRecord {
  id: string;
  documentId: string;
  templateId: string;
  templateName: string;
  fileName: string;
  fileSize: number;
  status: string;
  createdAt: string;
  downloadUrl: string;
  previewUrl: string;
  customerName?: string;
}

const initialFormState: FormData = {
  wohnungsgeber: {
    name: 'Izz & Hameed Dienstleistung UG',
    street: 'Moabit 58',
    zip: '10555',
    city: 'Berlin',
  },
  owner: {
    name: '',
  },
  moveInDate: new Date().toISOString().split('T')[0],
  property: {
    street: 'Warschauer Straße 46',
    additionalInfo: 'Hinterhaus 2 Etage C/O Shibal',
    zip: '10234',
    city: 'Berlin',
  },
  persons: [{ lastName: 'Chavan', firstName: 'Angelina Peter' }],
  issueDate: new Date().toISOString().split('T')[0],
  issuePlace: 'Berlin',
};

export default function DocumentGenerator() {
  const [formData, setFormData] = useState<FormData>(initialFormState);
  const [currentJob, setCurrentJob] = useState<JobState | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // History & Modal State
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('Document Preview');

  // Load history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  // Poll job status until COMPLETED or FAILED
  useEffect(() => {
    if (!currentJob || !isProcessing) return;

    if (currentJob.status === 'COMPLETED' || currentJob.status === 'FAILED') {
      setIsProcessing(false);
      if (currentJob.status === 'COMPLETED') {
        fetchHistory();
      }
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/documents/jobs/${currentJob.id}`);
        const data = await res.json();
        if (data.success && data.job) {
          setCurrentJob(data.job);
          if (data.job.status === 'COMPLETED' || data.job.status === 'FAILED') {
            setIsProcessing(false);
            if (data.job.status === 'COMPLETED') {
              fetchHistory();
            }
          }
        }
      } catch (err) {
        console.error('Error polling job status:', err);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [currentJob, isProcessing]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/documents/history');
      const data = await res.json();
      if (data.success && data.history) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const deleteHistoryRecord = async (documentId: string) => {
    try {
      const res = await fetch(`/api/documents/history?documentId=${documentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setHistory(prev => prev.filter(item => item.documentId !== documentId));
      }
    } catch (err) {
      console.error('Failed to delete history record:', err);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.wohnungsgeber.name.trim()) errors['wohnungsgeber.name'] = 'Name / Firma is required';
    if (!formData.wohnungsgeber.street.trim()) errors['wohnungsgeber.street'] = 'Straße is required';
    if (!formData.wohnungsgeber.zip.trim()) errors['wohnungsgeber.zip'] = 'PLZ is required';
    if (!formData.wohnungsgeber.city.trim()) errors['wohnungsgeber.city'] = 'Ort is required';
    
    if (!formData.moveInDate) errors['moveInDate'] = 'Einzugsdatum is required';
    
    if (!formData.property.street.trim()) errors['property.street'] = 'Wohnung Straße is required';
    if (!formData.property.zip.trim()) errors['property.zip'] = 'PLZ is required';
    if (!formData.property.city.trim()) errors['property.city'] = 'Ort is required';

    if (formData.persons.length === 0) {
      errors['persons'] = 'At least one person is required';
    } else {
      formData.persons.forEach((person, idx) => {
        if (!person.lastName.trim()) errors[`persons.${idx}.lastName`] = 'Familienname is required';
        if (!person.firstName.trim()) errors[`persons.${idx}.firstName`] = 'Vorname is required';
      });
    }

    if (!formData.issueDate) errors['issueDate'] = 'Datum is required';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNestedChange = (
    section: 'wohnungsgeber' | 'owner' | 'property',
    field: string,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      }
    }));
    const errKey = `${section}.${field}`;
    if (validationErrors[errKey]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[errKey];
        return next;
      });
    }
  };

  const handlePersonChange = (idx: number, field: keyof Person, value: string) => {
    const updatedPersons = [...formData.persons];
    updatedPersons[idx][field] = value;
    setFormData(prev => ({ ...prev, persons: updatedPersons }));

    const errKey = `persons.${idx}.${field}`;
    if (validationErrors[errKey]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[errKey];
        return next;
      });
    }
  };

  const addPerson = () => {
    if (formData.persons.length >= 7) {
      setError('Maximum 7 people allowed per document page.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      persons: [...prev.persons, { lastName: '', firstName: '' }],
    }));
    setError('');
  };

  const removePerson = (idx: number) => {
    if (formData.persons.length === 1) {
      setError('At least one person must remain in the document.');
      return;
    }
    const updatedPersons = formData.persons.filter((_, i) => i !== idx);
    setFormData(prev => ({ ...prev, persons: updatedPersons }));
    setError('');
  };

  const handleStartGeneration = async () => {
    setError('');
    setCurrentJob(null);

    if (!validateForm()) {
      setError('Please correct the validation errors in the form.');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/erp/documents/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setIsProcessing(false);
        setError(data.error || 'Failed to initialize document generation job.');
        return;
      }

      // Fetch initial job state
      const jobRes = await fetch(`/api/documents/jobs/${data.jobId}`);
      const jobData = await jobRes.json();

      if (jobData.success && jobData.job) {
        setCurrentJob(jobData.job);
      }
    } catch (err: any) {
      console.error('Error starting document job:', err);
      setIsProcessing(false);
      setError(err?.message || 'Network error occurred while connecting to server.');
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8 font-body text-slate-900 pb-12">
      {/* 1. MAIN FORM CARD */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#2E4036] text-white flex items-center justify-center font-bold shadow-md">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-xl tracking-tight text-slate-900">
                Wohnungsgeberbestätigung (§ 19 BMG)
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Official German Landlord Confirmation Document Generator
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFormData(initialFormState);
                setError('');
                setValidationErrors({});
                setCurrentJob(null);
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Form</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-mono flex items-center gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleStartGeneration(); }} className="space-y-8">
          
          {/* SECTION 1: WOHNUNGSGEBER */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#2E4036] uppercase tracking-wider">
              <Building className="w-4 h-4 text-[#CC5833]" />
              <span>1. Angaben zum Wohnungsgeber (Vermieter / Company)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="md:col-span-2">
                <label className="block text-slate-500 font-bold uppercase mb-1">
                  Name / Firma des Wohnungsgebers *
                </label>
                <input
                  type="text"
                  value={formData.wohnungsgeber.name}
                  onChange={(e) => handleNestedChange('wohnungsgeber', 'name', e.target.value)}
                  placeholder="z. B. Izz & Hameed Dienstleistung UG"
                  className={`w-full bg-slate-50 border ${validationErrors['wohnungsgeber.name'] ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'} rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#2E4036] transition-colors`}
                />
                {validationErrors['wohnungsgeber.name'] && (
                  <span className="text-[10px] text-rose-500 font-bold mt-1 block">{validationErrors['wohnungsgeber.name']}</span>
                )}
              </div>

              <div>
                <label className="block text-slate-500 font-bold uppercase mb-1">Straße, Haus-Nr. *</label>
                <input
                  type="text"
                  value={formData.wohnungsgeber.street}
                  onChange={(e) => handleNestedChange('wohnungsgeber', 'street', e.target.value)}
                  placeholder="z. B. Alt-Moabit 58"
                  className={`w-full bg-slate-50 border ${validationErrors['wohnungsgeber.street'] ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'} rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#2E4036] transition-colors`}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-500 font-bold uppercase mb-1">PLZ *</label>
                  <input
                    type="text"
                    value={formData.wohnungsgeber.zip}
                    onChange={(e) => handleNestedChange('wohnungsgeber', 'zip', e.target.value)}
                    placeholder="10555"
                    className={`w-full bg-slate-50 border ${validationErrors['wohnungsgeber.zip'] ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'} rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#2E4036] transition-colors`}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-500 font-bold uppercase mb-1">Ort *</label>
                  <input
                    type="text"
                    value={formData.wohnungsgeber.city}
                    onChange={(e) => handleNestedChange('wohnungsgeber', 'city', e.target.value)}
                    placeholder="Berlin"
                    className={`w-full bg-slate-50 border ${validationErrors['wohnungsgeber.city'] ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'} rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#2E4036] transition-colors`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: EIGENTÜMER & EINZUGSDATUM */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#2E4036] uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-[#CC5833]" />
              <span>2. Eigentümer & Einzugsdatum</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="md:col-span-2">
                <label className="block text-slate-500 font-bold uppercase mb-1">
                  Name des Eigentümers <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.owner.name}
                  onChange={(e) => handleNestedChange('owner', 'name', e.target.value)}
                  placeholder="Nur ausfüllen, wenn nicht identisch mit Wohnungsgeber"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#2E4036] transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold uppercase mb-1">Einzugsdatum *</label>
                <input
                  type="date"
                  value={formData.moveInDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, moveInDate: e.target.value }))}
                  className={`w-full bg-slate-50 border ${validationErrors['moveInDate'] ? 'border-rose-400' : 'border-slate-200'} rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#2E4036] transition-colors`}
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: WOHNUNG */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#2E4036] uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-[#CC5833]" />
              <span>3. Anschrift der bezogenen Wohnung</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="block text-slate-500 font-bold uppercase mb-1">Straße, Haus-Nr. *</label>
                <input
                  type="text"
                  value={formData.property.street}
                  onChange={(e) => handleNestedChange('property', 'street', e.target.value)}
                  placeholder="z. B. Warschauer Straße 46"
                  className={`w-full bg-slate-50 border ${validationErrors['property.street'] ? 'border-rose-400' : 'border-slate-200'} rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#2E4036] transition-colors`}
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold uppercase mb-1">
                  Zusatzangaben <span className="text-slate-400 font-normal">(Stockwerk, C/O)</span>
                </label>
                <input
                  type="text"
                  value={formData.property.additionalInfo}
                  onChange={(e) => handleNestedChange('property', 'additionalInfo', e.target.value)}
                  placeholder="z. B. Hinterhaus 2 Etage C/O Shibal"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#2E4036] transition-colors"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-500 font-bold uppercase mb-1">PLZ *</label>
                  <input
                    type="text"
                    value={formData.property.zip}
                    onChange={(e) => handleNestedChange('property', 'zip', e.target.value)}
                    placeholder="10234"
                    className={`w-full bg-slate-50 border ${validationErrors['property.zip'] ? 'border-rose-400' : 'border-slate-200'} rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#2E4036] transition-colors`}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-500 font-bold uppercase mb-1">Ort *</label>
                  <input
                    type="text"
                    value={formData.property.city}
                    onChange={(e) => handleNestedChange('property', 'city', e.target.value)}
                    placeholder="Berlin"
                    className={`w-full bg-slate-50 border ${validationErrors['property.city'] ? 'border-rose-400' : 'border-slate-200'} rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#2E4036] transition-colors`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: EINGEZO GENE PERSONEN TABLE */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#2E4036] uppercase tracking-wider">
                <User className="w-4 h-4 text-[#CC5833]" />
                <span>4. Eingezogene Personen</span>
              </div>
              <button
                type="button"
                onClick={addPerson}
                className="text-xs font-mono font-bold text-[#CC5833] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Person hinzufügen</span>
              </button>
            </div>

            <div className="space-y-3">
              {formData.persons.map((person, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-xs font-mono">
                  <span className="w-6 h-6 rounded-full bg-[#2E4036]/10 text-[#2E4036] font-bold flex items-center justify-center text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                    <input
                      type="text"
                      placeholder="Familienname *"
                      value={person.lastName}
                      onChange={(e) => handlePersonChange(idx, 'lastName', e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#2E4036]"
                    />
                    <input
                      type="text"
                      placeholder="Vornamen *"
                      value={person.firstName}
                      onChange={(e) => handlePersonChange(idx, 'firstName', e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#2E4036]"
                    />
                  </div>
                  {formData.persons.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePerson(idx)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 5: ISSUE DATE & PLACE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs font-mono">
            <div>
              <label className="block text-slate-500 font-bold uppercase mb-1">Ausstellungsort</label>
              <input
                type="text"
                value={formData.issuePlace}
                onChange={(e) => setFormData(prev => ({ ...prev, issuePlace: e.target.value }))}
                placeholder="Berlin"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#2E4036]"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-bold uppercase mb-1">Ausstellungsdatum *</label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#2E4036]"
              />
            </div>
          </div>

          {/* GENERATE SUBMIT BUTTON */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isProcessing}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-2.5 ${
                isProcessing
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-[#2E4036] hover:bg-[#1E2E25] cursor-pointer hover:shadow-lg'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Document...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Generate Document PDF</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 2. REAL-TIME JOB PROGRESS CARD */}
      {currentJob && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-md space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Generation Job Status</span>
              <h3 className="font-heading font-extrabold text-lg text-slate-900 flex items-center gap-2">
                <span>{currentJob.templateName}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                  currentJob.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                  currentJob.status === 'FAILED' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {currentJob.status}
                </span>
              </h3>
            </div>
            {currentJob.fileName && (
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
                {currentJob.fileName}
              </span>
            )}
          </div>

          {/* Live Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono font-bold text-slate-600">
              <span>{currentJob.stepMessage}</span>
              <span>{currentJob.progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  currentJob.status === 'COMPLETED' ? 'bg-emerald-600' :
                  currentJob.status === 'FAILED' ? 'bg-rose-600' : 'bg-[#CC5833]'
                }`}
                style={{ width: `${currentJob.progress}%` }}
              />
            </div>
          </div>

          {/* Step Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono pt-2">
            {currentJob.steps.map((step, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 ${
                  step.completed
                    ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-900'
                    : 'bg-slate-50 border-slate-200/60 text-slate-400'
                }`}
              >
                {step.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-300 shrink-0" />
                )}
                <span className="font-medium text-[11px] leading-tight">{step.step}</span>
              </div>
            ))}
          </div>

          {/* Job Completion Action Buttons */}
          {currentJob.status === 'COMPLETED' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-emerald-950">Document Ready for Download</h4>
                  <p className="text-xs text-emerald-700 font-mono">
                    File Size: {formatBytes(currentJob.fileSize)} • Verified & Stored
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewPdfUrl(currentJob.previewUrl || `/api/documents/${currentJob.documentId}/preview`);
                    setPreviewTitle(currentJob.fileName || 'Wohnungsgeberbestätigung.pdf');
                  }}
                  className="flex-1 sm:flex-initial bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-[#2E4036]" />
                  <span>Preview PDF</span>
                </button>

                <a
                  href={currentJob.downloadUrl || `/api/documents/${currentJob.documentId}/download`}
                  download={currentJob.fileName}
                  className="flex-1 sm:flex-initial bg-[#CC5833] hover:bg-[#CC5833]/90 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </a>
              </div>
            </div>
          )}

          {currentJob.status === 'FAILED' && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-800 text-xs font-mono space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-900">
                <AlertCircle className="w-4 h-4" />
                <span>Generation Error</span>
              </div>
              <p>{currentJob.errorMessage || 'An error occurred during PDF generation.'}</p>
            </div>
          )}
        </div>
      )}

      {/* 3. DOCUMENT HISTORY TABLE */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-extrabold text-lg text-slate-900">Document History</h3>
            <p className="text-xs text-slate-500 font-mono">
              View, preview, and download previously generated documents.
            </p>
          </div>
          <button
            onClick={fetchHistory}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Refresh History"
          >
            <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {history.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-mono text-xs border border-dashed border-slate-200 rounded-2xl">
            No generated documents in history yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                  <th className="py-3 px-4 font-bold">Document Name</th>
                  <th className="py-3 px-4 font-bold">Client / Inhabitant</th>
                  <th className="py-3 px-4 font-bold">Created Date</th>
                  <th className="py-3 px-4 font-bold">Size</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {history.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#2E4036]">
                      {rec.fileName}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {rec.customerName || 'Client'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(rec.createdAt).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {formatBytes(rec.fileSize)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setPreviewPdfUrl(rec.previewUrl);
                            setPreviewTitle(rec.fileName);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>
                        <a
                          href={rec.downloadUrl}
                          download={rec.fileName}
                          className="px-3 py-1.5 rounded-lg bg-[#2E4036] hover:bg-[#1E2E25] text-white font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                        <button
                          onClick={() => deleteHistoryRecord(rec.documentId)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. INLINE PDF PREVIEW MODAL */}
      {previewPdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in font-body">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl h-[85vh] shadow-2xl flex flex-col overflow-hidden relative">
            {/* Modal Header */}
            <div className="bg-[#2E4036] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#CC5833]" />
                <h3 className="font-bold text-sm font-mono tracking-tight">{previewTitle}</h3>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={previewPdfUrl.replace('/preview', '/download')}
                  download={previewTitle}
                  className="bg-[#CC5833] hover:bg-[#CC5833]/90 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setPreviewPdfUrl(null)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal PDF Viewer Iframe */}
            <div className="flex-1 bg-slate-100 relative overflow-hidden">
              <iframe
                src={previewPdfUrl}
                className="w-full h-full border-none"
                title="PDF Document Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
