import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, TestTube, Database, Brain } from 'lucide-react';
import { toast } from 'sonner';

interface RAGTestResult {
  success: boolean;
  answer: string;
  chunks_used?: Array<{
    id: string;
    chunk_index: number;
    document_section: string;
    preview: string;
  }>;
  metadata?: {
    reasoning: string;
    confidence: number;
    total_chunks_available: number;
    chunks_retrieved: number;
    response_time_ms: number;
  };
  fallback_used: boolean;
  response_type: string;
  reason?: string;
}

interface CacheStats {
  exists: boolean;
  chatbotId?: string;
  lastUpdated?: string;
  expiresAt?: string;
  totalChunks?: number;
  isValid?: boolean;
  memorySize?: number;
}

interface IntelligentRAGTestProps {
  chatbotId: string;
}

export const IntelligentRAGTest: React.FC<IntelligentRAGTestProps> = ({ chatbotId }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RAGTestResult | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [isLoadingCache, setIsLoadingCache] = useState(false);

  const testQuery = async () => {
    if (!query.trim()) {
      toast.error('Please enter a query to test');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/intelligent-rag/test-query/${chatbotId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ query: query.trim() })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.result);
        toast.success('Query test completed successfully');
      } else {
        toast.error(`Test failed: ${data.error}`);
        setResult(null);
      }
    } catch (error) {
      console.error('Error testing query:', error);
      toast.error('Failed to test query');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getCacheStats = async () => {
    setIsLoadingCache(true);
    try {
      const response = await fetch(`/api/intelligent-rag/cache/status/${chatbotId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setCacheStats(data.cache_status);
        toast.success('Cache stats loaded');
      } else {
        toast.error(`Failed to get cache stats: ${data.error}`);
      }
    } catch (error) {
      console.error('Error getting cache stats:', error);
      toast.error('Failed to get cache stats');
    } finally {
      setIsLoadingCache(false);
    }
  };

  const refreshCache = async () => {
    try {
      const response = await fetch(`/api/intelligent-rag/cache/refresh/${chatbotId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Cache refreshed successfully');
        getCacheStats(); // Refresh the stats
      } else {
        toast.error(`Failed to refresh cache: ${data.error}`);
      }
    } catch (error) {
      console.error('Error refreshing cache:', error);
      toast.error('Failed to refresh cache');
    }
  };

  const getResponseTypeColor = (type: string) => {
    switch (type) {
      case 'intelligent_rag':
        return 'bg-green-100 text-green-800';
      case 'behavior_prompt_fallback':
        return 'bg-yellow-100 text-yellow-800';
      case 'clarification_request':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Intelligent RAG System Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter your test query (e.g., 'who is victor exekiel')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && testQuery()}
              className="flex-1"
            />
            <Button onClick={testQuery} disabled={isLoading || !query.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Test Query
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={getCacheStats} disabled={isLoadingCache}>
              {isLoadingCache ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              Get Cache Stats
            </Button>
            <Button variant="outline" onClick={refreshCache}>
              <Brain className="h-4 w-4" />
              Refresh Cache
            </Button>
          </div>
        </CardContent>
      </Card>

      {cacheStats && (
        <Card>
          <CardHeader>
            <CardTitle>Cache Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Cache Exists:</span>
                <Badge variant={cacheStats.exists ? "default" : "destructive"} className="ml-2">
                  {cacheStats.exists ? "Yes" : "No"}
                </Badge>
              </div>
              {cacheStats.exists && (
                <>
                  <div>
                    <span className="font-medium">Total Chunks:</span>
                    <span className="ml-2">{cacheStats.totalChunks || 0}</span>
                  </div>
                  <div>
                    <span className="font-medium">Is Valid:</span>
                    <Badge variant={cacheStats.isValid ? "default" : "destructive"} className="ml-2">
                      {cacheStats.isValid ? "Yes" : "Expired"}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Last Updated:</span>
                    <span className="ml-2 text-xs">
                      {cacheStats.lastUpdated ? new Date(cacheStats.lastUpdated).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Memory Size:</span>
                    <span className="ml-2">{cacheStats.memorySize ? `${Math.round(cacheStats.memorySize / 1024)} KB` : 'N/A'}</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Test Result
              <div className="flex gap-2">
                <Badge className={getResponseTypeColor(result.response_type)}>
                  {result.response_type}
                </Badge>
                <Badge variant={result.fallback_used ? "destructive" : "default"}>
                  {result.fallback_used ? "Fallback Used" : "Primary System"}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Answer:</h4>
              <Textarea
                value={result.answer}
                readOnly
                className="min-h-[100px] resize-none"
              />
            </div>

            {result.chunks_used && result.chunks_used.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Chunks Used ({result.chunks_used.length}):</h4>
                <div className="space-y-2">
                  {result.chunks_used.map((chunk, index) => (
                    <div key={chunk.id} className="border rounded p-3 text-sm">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">Chunk {chunk.chunk_index + 1}</span>
                        <Badge variant="outline">{chunk.document_section}</Badge>
                      </div>
                      <p className="text-gray-600">{chunk.preview}</p>
                      <p className="text-xs text-gray-400 mt-1">ID: {chunk.id}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.metadata && (
              <div>
                <h4 className="font-medium mb-2">Metadata:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Reasoning:</span>
                    <p className="text-gray-600 mt-1">{result.metadata.reasoning}</p>
                  </div>
                  <div>
                    <span className="font-medium">Confidence:</span>
                    <span className="ml-2">{(result.metadata.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="font-medium">Total Chunks Available:</span>
                    <span className="ml-2">{result.metadata.total_chunks_available}</span>
                  </div>
                  <div>
                    <span className="font-medium">Chunks Retrieved:</span>
                    <span className="ml-2">{result.metadata.chunks_retrieved}</span>
                  </div>
                  <div>
                    <span className="font-medium">Response Time:</span>
                    <span className="ml-2">{result.metadata.response_time_ms}ms</span>
                  </div>
                </div>
              </div>
            )}

            {result.reason && (
              <div>
                <h4 className="font-medium mb-2">Reason:</h4>
                <p className="text-gray-600">{result.reason}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
