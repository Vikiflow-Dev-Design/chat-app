/**
 * Advanced File Upload Component
 * Supports both legacy and Advanced RAG upload methods
 */

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Database,
  Zap,
  Clock,
  FileCheck
} from 'lucide-react';
import {
  uploadFileWithAdvancedRAG,
  pollProcessingStatus,
  isAdvancedRAGAvailable,
  validateFileForAdvancedRAG,
  formatFileSize,
  ProcessingStatus
} from '@/services/advancedRAGUploadService';
import { uploadFile } from '@/services/fileUploadService';

interface AdvancedFileUploadProps {
  chatbotId: string;
  onUploadComplete?: (result: any) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

interface UploadingFile {
  file: File;
  title: string;
  tags: string[];
  useAdvancedRAG: boolean;
  status: 'uploading' | 'processing' | 'chunking' | 'storing' | 'embedding' | 'completed' | 'failed';
  progress: number;
  error?: string;
  fileId?: string;
  processingDetails?: any;
}

export function AdvancedFileUpload({
  chatbotId,
  onUploadComplete,
  onUploadError,
  className = ''
}: AdvancedFileUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [useAdvancedRAGByDefault, setUseAdvancedRAGByDefault] = useState(true);
  const [advancedRAGAvailable, setAdvancedRAGAvailable] = useState<boolean | null>(null);

  // Check Advanced RAG availability on mount
  React.useEffect(() => {
    checkAdvancedRAGAvailability();
  }, []);

  const checkAdvancedRAGAvailability = async () => {
    try {
      const available = await isAdvancedRAGAvailable();
      setAdvancedRAGAvailable(available);
      if (!available) {
        setUseAdvancedRAGByDefault(false);
        toast({
          title: "Advanced RAG Unavailable",
          description: "Advanced RAG processing is currently unavailable. Using legacy upload.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error checking Advanced RAG availability:', error);
      setAdvancedRAGAvailable(false);
      setUseAdvancedRAGByDefault(false);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleFiles = (files: File[]) => {
    files.forEach(file => {
      const validation = validateFileForAdvancedRAG(file);
      
      if (!validation.valid) {
        toast({
          title: "Invalid File",
          description: validation.error,
          variant: "destructive",
        });
        return;
      }

      const title = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      
      const uploadingFile: UploadingFile = {
        file,
        title,
        tags: [],
        useAdvancedRAG: useAdvancedRAGByDefault && advancedRAGAvailable !== false,
        status: 'uploading',
        progress: 0
      };

      setUploadingFiles(prev => [...prev, uploadingFile]);
      startUpload(uploadingFile);
    });
  };

  const startUpload = async (uploadingFile: UploadingFile) => {
    const updateFile = (updates: Partial<UploadingFile>) => {
      setUploadingFiles(prev => prev.map(f => 
        f.file === uploadingFile.file ? { ...f, ...updates } : f
      ));
    };

    try {
      const token = "mock_jwt_token_for_development"; // Replace with actual token

      if (uploadingFile.useAdvancedRAG) {
        // Advanced RAG Upload
        console.log('🚀 Starting Advanced RAG upload...');
        
        updateFile({ status: 'uploading', progress: 10 });

        const result = await uploadFileWithAdvancedRAG(
          uploadingFile.file,
          chatbotId,
          uploadingFile.title,
          uploadingFile.tags,
          token
        );

        console.log('✅ Advanced RAG upload completed:', result);

        // Get the file ID from the result
        const fileId = result.knowledge.files[result.knowledge.files.length - 1]._id;
        
        updateFile({ 
          status: 'processing', 
          progress: 30,
          fileId,
          processingDetails: result.processingDetails
        });

        // Poll for processing status
        await pollProcessingStatus(
          chatbotId,
          fileId,
          token,
          (status: ProcessingStatus) => {
            let progress = 30;
            let statusText: UploadingFile['status'] = 'processing';

            switch (status.status.processingStatus) {
              case 'processing':
                progress = 40;
                statusText = 'processing';
                break;
              case 'chunking':
                progress = 60;
                statusText = 'chunking';
                break;
              case 'storing':
                progress = 80;
                statusText = 'storing';
                break;
              case 'completed':
                if (status.status.embeddingStatus === 'completed') {
                  progress = 100;
                  statusText = 'completed';
                } else {
                  progress = 90;
                  statusText = 'embedding';
                }
                break;
              case 'failed':
                statusText = 'failed';
                break;
            }

            updateFile({ 
              status: statusText, 
              progress,
              error: status.status.processingError
            });
          }
        );

        updateFile({ status: 'completed', progress: 100 });

        toast({
          title: "Advanced RAG Upload Complete",
          description: `${uploadingFile.file.name} processed with ${result.processingDetails.chunking.chunksCreated} chunks and ${result.processingDetails.storage.relationshipsCreated} relationships.`,
        });

        if (onUploadComplete) {
          onUploadComplete(result);
        }

      } else {
        // Legacy Upload
        console.log('📄 Starting legacy upload...');
        
        updateFile({ status: 'uploading', progress: 20 });

        const result = await uploadFile(
          uploadingFile.file,
          chatbotId,
          uploadingFile.title,
          uploadingFile.tags,
          token
        );

        updateFile({ status: 'processing', progress: 60 });

        // Simulate processing time for legacy upload
        await new Promise(resolve => setTimeout(resolve, 2000));

        updateFile({ status: 'completed', progress: 100 });

        toast({
          title: "File Upload Complete",
          description: `${uploadingFile.file.name} uploaded successfully.`,
        });

        if (onUploadComplete) {
          onUploadComplete(result);
        }
      }

    } catch (error) {
      console.error('❌ Upload error:', error);
      
      updateFile({ 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Upload failed'
      });

      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive",
      });

      if (onUploadError) {
        onUploadError(error instanceof Error ? error.message : 'Upload failed');
      }
    }
  };

  const removeUploadingFile = (file: File) => {
    setUploadingFiles(prev => prev.filter(f => f.file !== file));
  };

  const getStatusIcon = (status: UploadingFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Upload className="h-4 w-4 text-blue-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'chunking':
        return <Database className="h-4 w-4 text-purple-500" />;
      case 'storing':
        return <Zap className="h-4 w-4 text-orange-500" />;
      case 'embedding':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: UploadingFile['status']) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing with Docling...';
      case 'chunking':
        return 'Creating relationship-based chunks...';
      case 'storing':
        return 'Storing in Supabase...';
      case 'embedding':
        return 'Generating embeddings...';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            File Upload
            {advancedRAGAvailable && (
              <Badge variant="secondary" className="ml-2">
                <Sparkles className="h-3 w-3 mr-1" />
                Advanced RAG
              </Badge>
            )}
          </CardTitle>
          
          {advancedRAGAvailable && (
            <div className="flex items-center space-x-2">
              <Switch
                id="advanced-rag"
                checked={useAdvancedRAGByDefault}
                onCheckedChange={setUseAdvancedRAGByDefault}
              />
              <Label htmlFor="advanced-rag" className="text-sm">
                Use Advanced RAG Processing
              </Label>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              className="hidden"
              multiple
              accept=".pdf,.doc,.docx,.txt,.html,.pptx"
            />
            
            <div className="flex flex-col items-center gap-4">
              <Upload className="h-12 w-12 text-gray-400" />
              <div>
                <h3 className="text-lg font-medium text-gray-700">
                  Drag and drop files here
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  or click to browse files
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Supports: PDF, DOC, DOCX, TXT, HTML, PPTX (max 50MB)
                </p>
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
              >
                Browse Files
              </Button>
            </div>
          </div>

          {/* Uploading Files */}
          {uploadingFiles.length > 0 && (
            <div className="mt-6 space-y-4">
              <h4 className="font-medium text-gray-700">Uploading Files</h4>
              
              {uploadingFiles.map((uploadingFile, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(uploadingFile.status)}
                      <span className="font-medium text-sm">
                        {uploadingFile.file.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({formatFileSize(uploadingFile.file.size)})
                      </span>
                      {uploadingFile.useAdvancedRAG && (
                        <Badge variant="secondary" className="text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Advanced RAG
                        </Badge>
                      )}
                    </div>
                    
                    {uploadingFile.status !== 'uploading' && uploadingFile.status !== 'processing' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUploadingFile(uploadingFile.file)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {getStatusText(uploadingFile.status)}
                      </span>
                      <span className="text-gray-500">
                        {uploadingFile.progress}%
                      </span>
                    </div>
                    
                    <Progress value={uploadingFile.progress} className="h-2" />
                    
                    {uploadingFile.error && (
                      <p className="text-sm text-red-600 mt-1">
                        {uploadingFile.error}
                      </p>
                    )}
                    
                    {uploadingFile.processingDetails && uploadingFile.status === 'completed' && (
                      <div className="text-xs text-gray-500 mt-2 space-y-1">
                        <div>✅ Processed with {uploadingFile.processingDetails.doclingProcessing.metadata.processing_method}</div>
                        <div>🧩 Created {uploadingFile.processingDetails.chunking.chunksCreated} chunks</div>
                        <div>🔗 {uploadingFile.processingDetails.storage.relationshipsCreated} relationships</div>
                        <div>⏱️ Completed in {uploadingFile.processingDetails.processingTime}ms</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
