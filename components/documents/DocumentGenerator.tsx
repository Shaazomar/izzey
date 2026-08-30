'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, FileText, Download, Eye, RefreshCw, 
  AlertCircle, Calendar, MapPin, Building, User, ChevronRight, Check
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
  moveInDate: '',
  property: {
    street: '',
    additionalInfo: '',
    zip: '',
    city: '',
  },
  persons: [{ lastName: '', firstName: '' }],
  issueDate: new Date().toISOString().split('T')[0],
  issuePlace: 'Berlin',
};

export default function DocumentGenerator() {
  const [formData, setFormData] = useState<FormData>(initialFormState);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<boolean>(false);

  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.wohnungsgeber.name.trim()) errors['wohnungsgeber.name'] = 'Name / Firma is required';
    if (!formData.wohnungsgeber.street.trim()) errors['wohnungsgeber.street'] = 'Straße, Haus-Nr. is required';
    if (!formData.wohnungsgeber.zip.trim()) errors['wohnungsgeber.zip'] = 'PLZ is required';
    if (!formData.wohnungsgeber.city.trim()) errors['wohnungsgeber.city'] = 'Ort is required';
    
    if (!formData.moveInDate) errors['moveInDate'] = 'Einzugsdatum is required';
    
    if (!formData.property.street.trim()) errors['property.street'] = 'Straße, Haus-Nr. is required';
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

  // Handles state changes for nested fields
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
    // Clear validation error if any
    const errKey = `${section}.${field}`;
    if (validationErrors[errKey]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[errKey];
        return next;
      });
    }
  };

  // Person Table modifications
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
    // Restrict adding more than 10 people (capping based on physical template rows)
    if (formData.persons.length >= 10) {
      setError('A maximum of 10 people can be added to fit the template layout.');
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

  // Helper to generate filename based on names or dates
  const getOutputFilename = (): string => {
    const firstPerson = formData.persons[0];
    if (firstPerson && firstPerson.lastName && firstPerson.firstName) {
      const sanitizedLastName = firstPerson.lastName.replace(/[^a-zA-Z0-9]/g, '_');
      const sanitizedFirstName = firstPerson.firstName.replace(/[^a-zA-Z0-9]/g, '_');
      return `Wohnungsgeberbestaetigung_${sanitizedLastName}_${sanitizedFirstName}.pdf`;
    }
    const dateStr = formData.issueDate || new Date().toISOString().split('T')[0];
    return `Wohnungsgeberbestaetigung_${dateStr}.pdf`;
  };

  // Generate PDF from API
  const generateDocument = async (isDownloadAfter = false): Promise<Blob | null> => {
    setError('');
    setSuccess(false);

    if (!validateForm()) {
      setError('Please correct the validation errors in the form.');
      return null;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/erp/documents/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Server returned an error generating the PDF.');
      }

      const blob = await response.blob();
      setPdfBlob(blob);

      // Create new blob url
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      const newUrl = URL.createObjectURL(blob);
      setPdfBlobUrl(newUrl);
      setSuccess(true);

      if (isDownloadAfter) {
        const link = document.createElement('a');
        link.href = newUrl;
        link.download = getOutputFilename();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      return blob;
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate PDF document.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (pdfBlobUrl) {
      const link = document.createElement('a');
      link.href = pdfBlobUrl;
      link.download = getOutputFilename();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleNewDocument = () => {
    setFormData(initialFormState);
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setPdfBlobUrl(null);
    setPdfBlob(null);
    setError('');
    setSuccess(false);
    setValidationErrors({});
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT PANEL: Form Fields (7/12 grid) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2.5 shadow-2xs">
            <AlertCircle className="w-4.5 h-4.5 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success notification */}
        {success && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 shadow-2xs">
            <Check className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
            <span>Document generated successfully! Check the preview on the right.</span>
          </div>
        )}

        {/* SECTION 1: Wohnungsgeber (Pre-filled) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="w-4.5 h-4.5 text-[#2E4036]" />
            <h3 className="font-heading font-extrabold text-sm text-slate-800 uppercase tracking-wider">
              Wohnungsgeber (Landlord)
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Name / Firma</label>
              <input 
                type="text"
                value={formData.wohnungsgeber.name}
                onChange={e => handleNestedChange('wohnungsgeber', 'name', e.target.value)}
                className={`w-full bg-slate-50 border ${validationErrors['wohnungsgeber.name'] ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-[#2E4036]'} rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white transition-all`}
              />
              {validationErrors['wohnungsgeber.name'] && (
                <p className="text-[10px] text-red-500 font-bold mt-1">{validationErrors['wohnungsgeber.name']}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Straße, Haus-Nr.</label>
              <input 
                type="text"
                value={formData.wohnungsgeber.street}
                onChange={e => handleNestedChange('wohnungsgeber', 'street', e.target.value)}
                className={`w-full bg-slate-50 border ${validationErrors['wohnungsgeber.street'] ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-[#2E4036]'} rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white transition-all`}
              />
              {validationErrors['wohnungsgeber.street'] && (
                <p className="text-[10px] text-red-500 font-bold mt-1">{validationErrors['wohnungsgeber.street']}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">PLZ</label>
                <input 
                  type="text"
                  value={formData.wohnungsgeber.zip}
                  onChange={e => handleNestedChange('wohnungsgeber', 'zip', e.target.value)}
                  className={`w-full bg-slate-50 border ${validationErrors['wohnungsgeber.zip'] ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-[#2E4036]'} rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white transition-all`}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Ort</label>
                <input 
                  type="text"
                  value={formData.wohnungsgeber.city}
                  onChange={e => handleNestedChange('wohnungsgeber', 'city', e.target.value)}
                  className={`w-full bg-slate-50 border ${validationErrors['wohnungsgeber.city'] ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-[#2E4036]'} rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white transition-all`}
                />
              </div>
              {(validationErrors['wohnungsgeber.zip'] || validationErrors['wohnungsgeber.city']) && (
                <p className="text-[10px] text-red-500 font-bold mt-1 col-span-3">PLZ and Ort are required</p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: Eigentümer der Wohnung (Optional) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-4.5 h-4.5 text-[#2E4036]" />
            <h3 className="font-heading font-extrabold text-sm text-slate-800 uppercase tracking-wider">
              Eigentümer der Wohnung (Property Owner)
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-500 font-mono px-2 py-0.5 rounded ml-auto">Optional</span>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Familienname, Vorname bzw. Bezeichnung (Owner Details)
            </label>
            <input 
              type="text"
              placeholder="Leave empty if same as Wohnungsgeber"
              value={formData.owner.name}
              onChange={e => handleNestedChange('owner', 'name', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-[#2E4036] rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white transition-all"
            />
            <p className="text-[9px] text-slate-400 font-medium mt-1.5">
              Only required to be filled if the Wohnungsgeber is not the property owner.
            </p>
          </div>
        </div>

        {/* SECTION 3: Einzug (Move-In Date) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calendar className="w-4.5 h-4.5 text-[#2E4036]" />
            <h3 className="font-heading font-extrabold text-sm text-slate-800 uppercase tracking-wider">
              Einzug (Move-In)
            </h3>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Einzugsdatum</label>
            <div className="relative">
              <input 
                type="date"
                value={formData.moveInDate}
                onChange={e => {
                  setFormData(prev => ({ ...prev, moveInDate: e.target.value }));
                  if (validationErrors['moveInDate']) {
                    setValidationErrors(prev => {
                      const next = { ...prev };
                      delete next['moveInDate'];
                      return next;
                    });
                  }
                }}
                className={`w-full bg-slate-50 border ${validationErrors['moveInDate'] ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-[#2E4036]'} rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white transition-all`}
              />
            </div>
            {validationErrors['moveInDate'] && (
              <p className="text-[10px] text-red-500 font-bold mt-1">{validationErrors['moveInDate']}</p>
            )}
          </div>
        </div>

        {/* SECTION 4: Wohnung (Property Address) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <MapPin className="w-4.5 h-4.5 text-[#2E4036]" />
            <h3 className="font-heading font-extrabold text-sm text-slate-800 uppercase tracking-wider">
              Wohnung (Property Address)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Straße, Haus-Nr.</label>
              <input 
                type="text"
                placeholder="e.g. Warschauer Straße 46"
                value={formData.property.street}
                onChange={e => handleNestedChange('property', 'street', e.target.value)}
                className={`w-full bg-slate-50 border ${validationErrors['property.street'] ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-[#2E4036]'} rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white transition-all`}
              />
              {validationErrors['property.street'] && (
                <p className="text-[10px] text-red-500 font-bold mt-1">{validationErrors['property.street']}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Zusatzangaben (e.g. Wohnungsnummer, ID, Etage)
              </label>
              <input 
                type="text"
                placeholder="e.g. Hinterhaus 2 Etage C/O Shibal"
                value={formData.property.additionalInfo}
                onChange={e => handleNestedChange('property', 'additionalInfo', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#2E4036] rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white transition-all"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 md:col-span-2">
              <div className="col-span-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">PLZ</label>
                <input 
                  type="text"
                  placeholder="10243"
                  value={formData.property.zip}
                  onChange={e => handleNestedChange('property', 'zip', e.target.value)}
                  className={`w-full bg-slate-50 border ${validationErrors['property.zip'] ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-[#2E4036]'} rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white transition-all`}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Ort</label>
                <input 
                  type="text"
                  placeholder="Berlin"
                  value={formData.property.city}
                  onChange={e => handleNestedChange('property', 'city', e.target.value)}
                  className={`w-full bg-slate-50 border ${validationErrors['property.city'] ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-[#2E4036]'} rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white transition-all`}
                />
              </div>
              {(validationErrors['property.zip'] || validationErrors['property.city']) && (
                <p className="text-[10px] text-red-500 font-bold mt-1 col-span-3">PLZ and Ort are required</p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 5: Eingezogene Personen (Persons Moving In) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-4.5 h-4.5 text-[#2E4036]" />
            <h3 className="font-heading font-extrabold text-sm text-slate-800 uppercase tracking-wider">
              Eingezogene Personen (Residents)
            </h3>
          </div>

          <div className="space-y-3">
            {formData.persons.map((person, idx) => (
              <div key={idx} className="flex gap-3 items-start bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-mono bg-[#2E4036]/10 text-[#2E4036] w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-2 font-bold">
                  {idx + 1}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Familienname</label>
                    <input 
                      type="text"
                      placeholder="e.g. Chavan"
                      value={person.lastName}
                      onChange={e => handlePersonChange(idx, 'lastName', e.target.value)}
                      className={`w-full bg-white border ${validationErrors[`persons.${idx}.lastName`] ? 'border-red-400' : 'border-slate-200 focus:border-[#2E4036]'} rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none transition-all`}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Vorname</label>
                    <input 
                      type="text"
                      placeholder="e.g. Angelina Peter"
                      value={person.firstName}
                      onChange={e => handlePersonChange(idx, 'firstName', e.target.value)}
                      className={`w-full bg-white border ${validationErrors[`persons.${idx}.firstName`] ? 'border-red-400' : 'border-slate-200 focus:border-[#2E4036]'} rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none transition-all`}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removePerson(idx)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors mt-4 cursor-pointer"
                  title="Remove Person"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addPerson}
              className="w-full py-2.5 border border-dashed border-slate-200 hover:border-[#2E4036] hover:bg-slate-50 text-slate-500 hover:text-[#2E4036] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Person hinzufügen</span>
            </button>
          </div>
        </div>

        {/* SECTION 6: Datum (Document Date) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calendar className="w-4.5 h-4.5 text-[#2E4036]" />
            <h3 className="font-heading font-extrabold text-sm text-slate-800 uppercase tracking-wider">
              Datum & Ausstellungsort (Date & Location)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Ausstellungsort</label>
              <input 
                type="text"
                value={formData.issuePlace}
                onChange={e => setFormData(prev => ({ ...prev, issuePlace: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#2E4036] rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Datum</label>
              <input 
                type="date"
                value={formData.issueDate}
                onChange={e => {
                  setFormData(prev => ({ ...prev, issueDate: e.target.value }));
                  if (validationErrors['issueDate']) {
                    setValidationErrors(prev => {
                      const next = { ...prev };
                      delete next['issueDate'];
                      return next;
                    });
                  }
                }}
                className={`w-full bg-slate-50 border ${validationErrors['issueDate'] ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-[#2E4036]'} rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white transition-all`}
              />
              {validationErrors['issueDate'] && (
                <p className="text-[10px] text-red-500 font-bold mt-1">{validationErrors['issueDate']}</p>
              )}
            </div>
          </div>
        </div>

        {/* PRIMARY ACTIONS: Create / Preview */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => generateDocument(false)}
            disabled={loading}
            className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            <span>PDF VORSCHAU</span>
          </button>

          <button
            type="button"
            onClick={() => generateDocument(true)}
            disabled={loading}
            className="flex-1 bg-[#2E4036] hover:bg-[#1C2C23] text-white py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>PDF ERSTELLEN</span>
          </button>
        </div>

      </div>

      {/* RIGHT PANEL: Sticky Live PDF Preview (5/12 grid) */}
      <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
        
        {/* Preview Actions bar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between text-xs">
          <span className="font-heading font-extrabold text-slate-700 tracking-wider uppercase text-[10px]">
            Live PDF Document Preview
          </span>

          {pdfBlobUrl && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="bg-[#CC5833] hover:bg-[#B34524] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>PDF HERUNTERLADEN</span>
              </button>

              <button
                type="button"
                onClick={handleNewDocument}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
              >
                NEUES DOKUMENT
              </button>
            </div>
          )}
        </div>

        {/* Embedded Iframe Preview Area */}
        <div className="border border-slate-200/85 rounded-2xl overflow-hidden bg-slate-100 aspect-[1/1.414] w-full flex items-center justify-center relative shadow-xs">
          {pdfBlobUrl ? (
            <object 
              data={pdfBlobUrl} 
              type="application/pdf"
              className="w-full h-full border-none"
            >
              <div className="p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-700">Preview Not Supported In Browser</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Your current browser or device does not support inline PDF viewing. Please download the document directly to verify it.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="bg-[#2E4036] hover:bg-[#1C2C23] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer mx-auto flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
              </div>
            </object>
          ) : (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-200/60 flex items-center justify-center text-slate-400 mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700">No Preview Generated Yet</p>
                <p className="text-[10px] text-slate-400 leading-relaxed max-w-xs mt-1">
                  Fill in the form on the left and click <b>PDF VORSCHAU</b> to generate the actual document and preview it here.
                </p>
              </div>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex flex-col items-center justify-center gap-3 z-10">
              <RefreshCw className="w-8 h-8 text-[#2E4036] animate-spin" />
              <span className="text-xs font-bold text-slate-700">Generating document...</span>
            </div>
          )}
        </div>

        {/* Informational tip */}
        <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-[10px] text-slate-500 font-medium leading-relaxed">
          <b>Note on visual accuracy:</b> The preview uses your browser's native PDF renderer to display the actual output. Double-check all boxes before final printing or downloading.
        </div>

      </div>
    </div>
  );
}
