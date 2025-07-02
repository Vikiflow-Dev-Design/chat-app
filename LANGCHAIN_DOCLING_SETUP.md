# LangChain Docling Integration Setup Guide

This guide will help you set up the new LangChain Docling-powered document processing system for Chat Agency Spark.

## Overview

We've implemented a hybrid document processing system that uses LangChain's official Docling integration for superior document parsing while maintaining backward compatibility with the existing system.

### Key Features

- **LangChain Integration**: Uses the official LangChain Docling document loader
- **Dual Export Modes**: Markdown output or structured chunks for advanced RAG workflows
- **Advanced Document Parsing**: Better handling of PDFs, DOCX, PPTX, HTML files
- **Structured Output**: Clean, hierarchical content with preserved formatting
- **Rich Metadata**: Comprehensive document metadata for intelligent processing
- **Chunk-based Processing**: Perfect for relationship-based chunking strategies
- **Fallback System**: Automatically falls back to legacy processing if service unavailable

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd python-services
pip install -r requirements.txt
```

Key dependency (latest version):
```bash
pip install -qU langchain-docling
```

### 2. Install Node.js Dependencies

```bash
cd backend
npm install
```

The following dependencies have been added:
- `form-data`: For multipart form uploads
- `node-fetch`: For HTTP requests to Python service

### 3. Environment Configuration

The backend `.env` file has been updated with:
```env
DOCLING_SERVICE_URL=http://localhost:8001
```

### 4. Start the LangChain Docling Service

#### Option A: Using the startup script (Recommended)
```bash
cd python-services
python start_docling_service.py
```

#### Option B: Direct uvicorn command
```bash
cd python-services
uvicorn docling_service:app --host 0.0.0.0 --port 8001 --reload
```

### 5. Start the Node.js Backend

```bash
cd backend
npm run dev
```

### 6. Test the Integration

```bash
cd backend
npm run test-docling
```

## How It Works

### Document Processing Flow

1. **File Upload**: User uploads a document through the frontend
2. **LangChain Docling Processing**: System processes with LangChain Docling service
3. **Export Mode Selection**: Choose between markdown or chunks export
4. **Fallback**: If LangChain Docling fails, falls back to legacy processing
5. **Rich Output**: Returns structured content with comprehensive metadata
6. **RAG Integration**: Chunks mode provides perfect input for advanced RAG workflows

### Export Modes

#### Markdown Mode
- Clean, structured markdown output
- Preserves document hierarchy
- Ideal for general document processing
- Single combined document

#### Chunks Mode
- Structured document chunks with metadata
- Perfect for RAG workflows
- Relationship-aware chunking
- Rich metadata per chunk

### API Endpoints

#### LangChain Docling Service (Python - Port 8001)
- `GET /health` - Health check with integration info
- `POST /process-document` - Process uploaded file with export type
- `POST /process-document-path` - Process file by path
- `GET /supported-formats` - Get supported formats and export types

#### Node.js Backend Integration
- Automatic integration through `DoclingIntegrationService`
- Backward compatible with existing `processDocument()` function
- Enhanced `processDocumentWithDocling()` for full metadata access
- New `processDocumentForRAG()` for chunk-based processing

## File Structure

```
python-services/
├── docling_service.py          # LangChain Docling service
├── start_docling_service.py    # Startup script with dependency checks
├── requirements.txt            # Python dependencies (langchain-docling)
├── .env.example               # Environment template
└── README.md                  # Detailed service documentation

backend/
├── services/
│   └── doclingIntegrationService.js  # Node.js integration
├── utils/
│   └── documentProcessor.js          # Updated with LangChain Docling support
└── test-docling-integration.js       # Comprehensive integration tests
```

## Testing

### 1. Service Health Check
```bash
curl http://localhost:8001/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "langchain-docling-processor",
  "integration": "langchain-docling"
}
```

### 2. Supported Formats Check
```bash
curl http://localhost:8001/supported-formats
```

### 3. Document Processing Test
```bash
cd backend
npm run test-docling
```

### 4. Manual Testing
Upload a document through the frontend and check console logs for:
- "Processing document with LangChain Docling"
- "LangChain Docling processing successful"
- Export type and metadata information

## Advanced Usage

### Chunk-based Processing for RAG
```javascript
const doclingService = new DoclingIntegrationService();

// Process document for RAG workflows
const result = await doclingService.processDocumentForRAG(filePath, fileType);

// Access structured chunks
result.chunks.forEach(chunk => {
  console.log('Chunk content:', chunk.content);
  console.log('Chunk metadata:', chunk.metadata);
});
```

### Metadata-Rich Processing
```javascript
// Process with full metadata
const result = await doclingService.processDocument(filePath, fileType, 'chunks');

console.log('Processing method:', result.metadata.processing_method);
console.log('Total chunks:', result.metadata.total_chunks);
console.log('Export type:', result.metadata.export_type);
```

## Troubleshooting

### LangChain Docling Service Issues

1. **Service won't start**
   - Check Python version (requires 3.8+)
   - Install LangChain Docling: `pip install -qU langchain-docling`
   - Verify all dependencies: `pip install -r requirements.txt`
   - Check port availability: `netstat -an | grep 8001`

2. **Import errors**
   - Ensure LangChain Docling is installed: `pip list | grep langchain-docling`
   - Try reinstalling: `pip uninstall langchain-docling && pip install -qU langchain-docling`

3. **Processing errors**
   - Check file format support
   - Verify file isn't corrupted
   - Review service logs for specific errors

### Integration Issues

1. **Node.js can't connect to service**
   - Verify service is running: `curl http://localhost:8001/health`
   - Check `DOCLING_SERVICE_URL` in backend `.env`
   - Review firewall settings

2. **Fallback to legacy processing**
   - This is normal if LangChain Docling service is unavailable
   - Check console logs for specific error messages
   - Verify service health endpoint

## Production Deployment

### Docker Compose Setup
```yaml
version: '3.8'
services:
  langchain-docling-service:
    build: ./python-services
    ports:
      - "8001:8001"
    environment:
      - DOCLING_SERVICE_PORT=8001
    restart: unless-stopped

  backend:
    build: ./backend
    ports:
      - "4000:4000"
    environment:
      - DOCLING_SERVICE_URL=http://langchain-docling-service:8001
    depends_on:
      - langchain-docling-service
    restart: unless-stopped
```

### Process Manager (PM2)
```json
{
  "apps": [
    {
      "name": "langchain-docling-service",
      "script": "uvicorn",
      "args": "docling_service:app --host 0.0.0.0 --port 8001",
      "cwd": "/path/to/python-services",
      "instances": 1,
      "exec_mode": "fork"
    },
    {
      "name": "backend",
      "script": "server.js",
      "cwd": "/path/to/backend",
      "instances": 1,
      "exec_mode": "fork",
      "env": {
        "DOCLING_SERVICE_URL": "http://localhost:8001"
      }
    }
  ]
}
```

## Benefits

### LangChain Integration Advantages
- **Standardized Interface**: Uses LangChain's document loader pattern
- **Rich Document Objects**: Full LangChain Document objects with metadata
- **Ecosystem Compatibility**: Works seamlessly with other LangChain components
- **Advanced Chunking**: Built-in intelligent chunking strategies
- **Metadata Preservation**: Rich metadata throughout the processing pipeline

### Enhanced RAG Workflows
- **Chunk-based Processing**: Perfect for relationship-based chunking
- **Rich Metadata**: Enables intelligent metadata filtering
- **Document Structure**: Preserves hierarchical document information
- **Flexible Export**: Choose between markdown or chunks based on use case

### System Reliability
- **Graceful Fallback**: System continues working even if service unavailable
- **Error Handling**: Comprehensive error handling and logging
- **Performance**: Efficient processing with configurable timeouts
- **Scalability**: Can be deployed as separate microservice

## Next Steps

1. **Test with various document types** to ensure compatibility
2. **Implement relationship-based chunking** using the chunks export mode
3. **Add metadata-driven query processing** for intelligent retrieval
4. **Integrate with vector databases** for enhanced RAG workflows
5. **Implement caching** for frequently processed documents
6. **Add custom chunking strategies** based on document structure

## Support

For issues or questions:
1. Check the service logs in both Python and Node.js services
2. Review the troubleshooting section above
3. Test with the provided integration test script
4. Verify LangChain Docling installation: `pip list | grep langchain-docling`
5. Check LangChain Docling documentation: https://python.langchain.com/docs/integrations/document_loaders/docling/

## Integration Complete! 🎉

Your Chat Agency Spark project now has:
- ✅ LangChain Docling integration for superior document processing
- ✅ Dual export modes (markdown & chunks) for flexible workflows
- ✅ Rich metadata extraction for intelligent processing
- ✅ Fallback system for reliability
- ✅ Perfect foundation for advanced RAG workflows with relationship-based chunking
