/**
 * Knowledge Types
 * These interfaces define the structure of our knowledge data
 */

export interface FileSource {
  id: string;
  name?: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: string | number;
  size?: string;
  content: string;
  extractedInformation?: any;
  processingStatus:
    | "pending"
    | "optimizing"
    | "processing"
    | "completed"
    | "failed";
  processingError?: string;
  status?: string;
  originalSize?: number;
  optimizedSize?: number;
  sizeReduction?: number;
  optimizationInfo?: string;
  createdAt: string | Date;
  isActive: boolean;

  // Add any additional properties that might be in the API response
  [key: string]: any;
}

export interface TextSource {
  id: string;
  title: string;
  description: string;
  content: string;
  size: string;
  createdAt: string | Date;
  isActive?: boolean;
}

export interface QASource {
  id: string;
  title: string;
  question: string;
  answer: string;
}

export interface LinkSource {
  id: string;
  url: string;
  size: string;
  status: string;
}

export interface SourcesSummary {
  text: { count: number; size: string };
  links: { count: number; size: string };
  qa: { count: number; size: string };
  mongodb: { count: number; size: string };
  sheets: { count: number; size: string };
  totalSize: string;
  quota: string;
}
