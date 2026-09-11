import fs from 'fs';
import path from 'path';
import { generateWohnungsgeberPDF, WohnungsgeberData } from './template-engine';
import { verifyPDF } from './pdf-verifier';

export type JobStatus = 'QUEUED' | 'PROCESSING' | 'GENERATING' | 'VERIFYING' | 'COMPLETED' | 'FAILED';

export interface DocumentJobStep {
  step: string;
  timestamp: string;
  completed: boolean;
}

export interface DocumentJob {
  id: string;
  documentId: string;
  templateId: string;
  templateName: string;
  status: JobStatus;
  progress: number;
  stepMessage: string;
  steps: DocumentJobStep[];
  inputData: any;
  errorMessage?: string;
  downloadUrl?: string;
  previewUrl?: string;
  fileName?: string;
  fileSize?: number;
  createdAt: string;
  completedAt?: string;
}

export interface DocumentHistoryRecord {
  id: string;
  documentId: string;
  templateId: string;
  templateName: string;
  fileName: string;
  fileSize: number;
  status: JobStatus;
  createdAt: string;
  downloadUrl: string;
  previewUrl: string;
  customerName?: string;
}

// In-memory jobs map & history list backed by disk persistence
const globalJobs = new Map<string, DocumentJob>();
const globalHistory: DocumentHistoryRecord[] = [];

// Storage directory setup
const STORAGE_DIR = path.join(process.cwd(), 'storage/documents');
const HISTORY_FILE = path.join(process.cwd(), 'storage/history.json');

function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
  if (fs.existsSync(HISTORY_FILE)) {
    try {
      const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
      const records = JSON.parse(data);
      if (Array.isArray(records) && globalHistory.length === 0) {
        globalHistory.push(...records);
      }
    } catch (e) {
      console.error('Failed to load history store:', e);
    }
  }
}

function saveHistoryStore() {
  try {
    ensureStorageDir();
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(globalHistory, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save history store:', e);
  }
}

function generateUniqueId(prefix = 'doc'): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${dateStr}_${randomStr}`;
}

export function createDocumentJob(templateId: string, inputData: WohnungsgeberData): DocumentJob {
  ensureStorageDir();
  const jobId = generateUniqueId('job');
  const documentId = generateUniqueId('doc');
  const now = new Date().toISOString();

  const firstPerson = inputData.persons?.[0];
  const personName = firstPerson && firstPerson.lastName
    ? `${firstPerson.lastName}_${firstPerson.firstName}`.replace(/[^a-zA-Z0-9]/g, '_')
    : 'Document';
  const fileName = `Wohnungsgeberbestaetigung_${personName}.pdf`;

  const initialSteps: DocumentJobStep[] = [
    { step: 'Input data validated', timestamp: now, completed: true },
    { step: 'Preparing template configuration', timestamp: '', completed: false },
    { step: 'Filling document fields', timestamp: '', completed: false },
    { step: 'Generating PDF document', timestamp: '', completed: false },
    { step: 'Verifying PDF structural integrity', timestamp: '', completed: false },
    { step: 'Document finalized & saved', timestamp: '', completed: false },
  ];

  const job: DocumentJob = {
    id: jobId,
    documentId,
    templateId,
    templateName: 'Wohnungsgeberbestätigung (§ 19 BMG)',
    status: 'QUEUED',
    progress: 15,
    stepMessage: 'Job queued successfully',
    steps: initialSteps,
    inputData,
    fileName,
    createdAt: now,
  };

  globalJobs.set(jobId, job);
  
  // Start job execution asynchronously
  processDocumentJob(jobId);

  return job;
}

export function getDocumentJob(jobId: string): DocumentJob | undefined {
  return globalJobs.get(jobId);
}

export function getDocumentHistory(): DocumentHistoryRecord[] {
  ensureStorageDir();
  return [...globalHistory].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getStoredDocumentPath(documentId: string): string | null {
  ensureStorageDir();
  const filePath = path.join(STORAGE_DIR, `${documentId}.pdf`);
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  return null;
}

export function deleteDocumentRecord(documentId: string): boolean {
  ensureStorageDir();
  const filePath = path.join(STORAGE_DIR, `${documentId}.pdf`);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.error(`Failed to delete PDF file ${filePath}:`, e);
    }
  }

  const index = globalHistory.findIndex(r => r.documentId === documentId);
  if (index !== -1) {
    globalHistory.splice(index, 1);
    saveHistoryStore();
    return true;
  }
  return false;
}

async function processDocumentJob(jobId: string) {
  const job = globalJobs.get(jobId);
  if (!job) return;

  try {
    // 1. PROCESSING
    job.status = 'PROCESSING';
    job.progress = 30;
    job.stepMessage = 'Preparing template configuration...';
    job.steps[1] = { step: 'Preparing template configuration', timestamp: new Date().toISOString(), completed: true };
    globalJobs.set(jobId, { ...job });

    await new Promise(res => setTimeout(res, 200));

    // 2. GENERATING
    job.status = 'GENERATING';
    job.progress = 55;
    job.stepMessage = 'Filling fields and rendering vector PDF...';
    job.steps[2] = { step: 'Filling document fields', timestamp: new Date().toISOString(), completed: true };
    job.steps[3] = { step: 'Generating PDF document', timestamp: new Date().toISOString(), completed: true };
    globalJobs.set(jobId, { ...job });

    const pdfBytes = await generateWohnungsgeberPDF(job.inputData as WohnungsgeberData);

    await new Promise(res => setTimeout(res, 200));

    // 3. VERIFYING
    job.status = 'VERIFYING';
    job.progress = 80;
    job.stepMessage = 'Verifying generated PDF file integrity...';
    job.steps[4] = { step: 'Verifying PDF structural integrity', timestamp: new Date().toISOString(), completed: true };
    globalJobs.set(jobId, { ...job });

    const verification = await verifyPDF(pdfBytes, 1);

    if (!verification.isValid) {
      throw new Error(verification.error || 'PDF verification failed.');
    }

    // Write file to disk storage
    ensureStorageDir();
    const filePath = path.join(STORAGE_DIR, `${job.documentId}.pdf`);
    fs.writeFileSync(filePath, pdfBytes);

    const completedAt = new Date().toISOString();
    const downloadUrl = `/api/documents/${job.documentId}/download`;
    const previewUrl = `/api/documents/${job.documentId}/preview`;

    // 4. COMPLETED
    job.status = 'COMPLETED';
    job.progress = 100;
    job.stepMessage = 'Document generated and verified successfully!';
    job.steps[5] = { step: 'Document finalized & saved', timestamp: completedAt, completed: true };
    job.downloadUrl = downloadUrl;
    job.previewUrl = previewUrl;
    job.fileSize = verification.fileSize;
    job.completedAt = completedAt;

    globalJobs.set(jobId, { ...job });

    // Save to history list
    const firstPerson = job.inputData.persons?.[0];
    const customerName = firstPerson
      ? `${firstPerson.firstName} ${firstPerson.lastName}`
      : 'Client';

    const historyRecord: DocumentHistoryRecord = {
      id: job.documentId,
      documentId: job.documentId,
      templateId: job.templateId,
      templateName: job.templateName,
      fileName: job.fileName || 'Wohnungsgeberbestaetigung.pdf',
      fileSize: verification.fileSize,
      status: 'COMPLETED',
      createdAt: completedAt,
      downloadUrl,
      previewUrl,
      customerName,
    };

    // Prevent duplicate entries
    const existingIdx = globalHistory.findIndex(r => r.documentId === job.documentId);
    if (existingIdx !== -1) {
      globalHistory[existingIdx] = historyRecord;
    } else {
      globalHistory.unshift(historyRecord);
    }
    saveHistoryStore();

  } catch (err: any) {
    console.error(`Error processing job ${jobId}:`, err);
    job.status = 'FAILED';
    job.progress = 0;
    job.stepMessage = `Generation failed: ${err?.message || 'Unknown error'}`;
    job.errorMessage = err?.message || 'Document generation failed. Please try again.';
    globalJobs.set(jobId, { ...job });
  }
}
