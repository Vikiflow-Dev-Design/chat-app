/**
 * Test Page for Advanced RAG Upload
 * Use this page to test the Advanced RAG integration
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { AdvancedFileUpload } from '@/components/AdvancedFileUpload';
import { 
  uploadFileWithAdvancedRAG, 
  isAdvancedRAGAvailable,
  validateFileForAdvancedRAG 
} from '@/services/advancedRAGUploadService';
import { FileText, TestTube, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function TestAdvancedRAG() {
  const { toast } = useToast();
  const [testChatbotId, setTestChatbotId] = useState('test-chatbot-123');
  const [serviceStatus, setServiceStatus] = useState<{
    advanced: boolean | null;
    docling: boolean | null;
    backend: boolean | null;
  }>({
    advanced: null,
    docling: null,
    backend: null,
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkServices = async () => {
    setIsChecking(true);
    
    try {
      // Check Advanced RAG availability
      const advancedAvailable = await isAdvancedRAGAvailable();
      setServiceStatus(prev => ({ ...prev, advanced: advancedAvailable }));

      // Check backend health
      try {
        const response = await fetch('/api/system/health');
        setServiceStatus(prev => ({ ...prev, backend: response.ok }));
      } catch {
        setServiceStatus(prev => ({ ...prev, backend: false }));
      }

      // Check Docling service
      try {
        const response = await fetch('http://localhost:8001/health');
        setServiceStatus(prev => ({ ...prev, docling: response.ok }));
      } catch {
        setServiceStatus(prev => ({ ...prev, docling: false }));
      }

      toast({
        title: "Service Check Complete",
        description: `Advanced RAG: ${advancedAvailable ? '✅' : '❌'}, Backend: ${serviceStatus.backend ? '✅' : '❌'}, Docling: ${serviceStatus.docling ? '✅' : '❌'}`,
      });

    } catch (error) {
      console.error('Error checking services:', error);
      toast({
        title: "Service Check Failed",
        description: "Could not check all services",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleUploadComplete = (result: any) => {
    console.log('✅ Upload completed:', result);
    toast({
      title: "Upload Successful! 🎉",
      description: `File processed with Advanced RAG. Check console for details.`,
    });
  };

  const handleUploadError = (error: string) => {
    console.error('❌ Upload failed:', error);
    toast({
      title: "Upload Failed",
      description: error,
      variant: "destructive",
    });
  };

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <Loader2 className="h-4 w-4 animate-spin" />;
    return status ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusText = (status: boolean | null) => {
    if (status === null) return "Checking...";
    return status ? "Available" : "Unavailable";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <TestTube className="h-6 w-6 text-blue-500" />
        <h1 className="text-2xl font-bold">Advanced RAG Test Page</h1>
      </div>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded">
              <span>Advanced RAG</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(serviceStatus.advanced)}
                <span className="text-sm">{getStatusText(serviceStatus.advanced)}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded">
              <span>Backend API</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(serviceStatus.backend)}
                <span className="text-sm">{getStatusText(serviceStatus.backend)}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded">
              <span>Docling Service</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(serviceStatus.docling)}
                <span className="text-sm">{getStatusText(serviceStatus.docling)}</span>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={checkServices} 
            disabled={isChecking}
            className="w-full"
          >
            {isChecking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking Services...
              </>
            ) : (
              'Check All Services'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="chatbot-id">Test Chatbot ID</Label>
            <Input
              id="chatbot-id"
              value={testChatbotId}
              onChange={(e) => setTestChatbotId(e.target.value)}
              placeholder="Enter a test chatbot ID"
            />
            <p className="text-sm text-gray-500 mt-1">
              Use any ID for testing. The system will create knowledge entries for this ID.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* File Upload Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Advanced RAG File Upload Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          {testChatbotId ? (
            <AdvancedFileUpload
              chatbotId={testChatbotId}
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              Please enter a test chatbot ID above to enable file upload testing.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">1. Check Services</h4>
            <p className="text-sm text-gray-600">
              Click "Check All Services" to verify that all required services are running:
            </p>
            <ul className="text-sm text-gray-600 ml-4 space-y-1">
              <li>• <strong>Advanced RAG:</strong> Should be available if all services are running</li>
              <li>• <strong>Backend API:</strong> Your Node.js backend on port 5000</li>
              <li>• <strong>Docling Service:</strong> Python service on port 8001</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">2. Test File Upload</h4>
            <p className="text-sm text-gray-600">
              Upload a test document to verify the complete Advanced RAG pipeline:
            </p>
            <ul className="text-sm text-gray-600 ml-4 space-y-1">
              <li>• Create a simple .txt file with some content</li>
              <li>• Drag and drop it into the upload area</li>
              <li>• Watch for progress updates and success messages</li>
              <li>• Check browser console for detailed logs</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">3. Expected Results</h4>
            <p className="text-sm text-gray-600">
              If everything works correctly, you should see:
            </p>
            <ul className="text-sm text-gray-600 ml-4 space-y-1">
              <li>• ✅ File upload progress through all stages</li>
              <li>• ✅ Success message with chunk and relationship counts</li>
              <li>• ✅ Console logs showing Docling processing</li>
              <li>• ✅ Data stored in Supabase database</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Troubleshooting</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• If Docling is unavailable, the system will fall back to legacy processing</li>
              <li>• Check browser console for detailed error messages</li>
              <li>• Ensure all environment variables are set correctly</li>
              <li>• Verify Supabase tables exist and are accessible</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
