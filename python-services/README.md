# LangChain Docling Document Processing Service

This Python service provides document processing capabilities using LangChain's Docling integration, seamlessly integrated with the Chat Agency Spark Node.js backend.

## Features

- **LangChain Integration**: Uses the official LangChain Docling integration
- **Advanced Document Parsing**: Supports PDF, DOCX, DOC, PPTX, HTML, and TXT files
- **Dual Export Modes**: Markdown output or structured chunks for RAG workflows
- **Rich Metadata**: Comprehensive document metadata extraction
- **Table & Structure Preservation**: Maintains complex document layouts
- **Chunk-based Processing**: Perfect for advanced RAG implementations
- **RESTful API**: FastAPI-based service with automatic documentation

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd python-services
pip install -r requirements.txt
```

Key dependency:
```bash
pip install -qU langchain-docling
```

### 2. Environment Variables

Create a `.env` file in the `python-services` directory:

```env
DOCLING_SERVICE_PORT=8001
```

### 3. Start the Service

#### Option A: Using the startup script (Recommended)
```bash
python start_docling_service.py
```

#### Option B: Direct uvicorn command
```bash
uvicorn docling_service:app --host 0.0.0.0 --port 8001 --reload
```

### 4. Verify Service is Running

- Health check: http://localhost:8001/health
- API documentation: http://localhost:8001/docs
- Supported formats: http://localhost:8001/supported-formats

## API Endpoints

### POST /process-document
Upload and process a document file with export type selection.

**Request**: Multipart form data with file and export_type
**Parameters**:
- `file`: Document file to process
- `export_type`: "markdown" or "chunks"

**Response**: 
```json
{
  "success": true,
  "markdown_content": "# Document Title\n\nContent...",
  "metadata": {
    "processing_method": "langchain_docling",
    "export_type": "markdown",
    "total_length": 1024
  },
  "chunks": null
}
```

### POST /process-document-path
Process a document by file path (internal use).

### GET /supported-formats
Get supported file formats and export types.

### GET /health
Service health check with integration information.

## Export Types

### Markdown Mode (`export_type: "markdown"`)
- Returns clean, structured markdown
- Preserves document hierarchy
- Ideal for general document processing
- Single combined output

### Chunks Mode (`export_type: "chunks"`)
- Returns structured document chunks
- Perfect for RAG workflows
- Rich metadata per chunk
- Relationship-aware chunking

## Integration with Node.js Backend

The Node.js backend automatically uses this service through the `DoclingIntegrationService` class:

```javascript
const DoclingIntegrationService = require('./services/doclingIntegrationService');
const doclingService = new DoclingIntegrationService();

// Process for markdown
const result = await doclingService.processDocument(filePath, fileType, 'markdown');

// Process for RAG chunks
const ragResult = await doclingService.processDocumentForRAG(filePath, fileType);
```

## LangChain Integration Benefits

1. **Standardized Interface**: Uses LangChain's document loader pattern
2. **Rich Document Objects**: Full LangChain Document objects with metadata
3. **Ecosystem Compatibility**: Works with other LangChain components
4. **Advanced Chunking**: Built-in intelligent chunking strategies
5. **Metadata Preservation**: Rich metadata throughout the pipeline

## Fallback Behavior

If the LangChain Docling service is unavailable, the system automatically falls back to the legacy document processing methods (pdf-parse, mammoth, etc.).

## Testing

Run the integration test from the backend directory:

```bash
cd backend
npm run test-docling
```

## Supported File Formats

- **PDF**: Including complex layouts and scanned documents
- **Microsoft Word**: .docx, .doc
- **PowerPoint**: .pptx
- **HTML**: Web pages and HTML documents
- **Text**: .txt files

## Advanced Features

### Chunk Processing for RAG
```python
from langchain_docling import DoclingLoader
from langchain_docling.loader import ExportType

loader = DoclingLoader(
    file_path="document.pdf",
    export_type=ExportType.DOC_CHUNKS
)
chunks = loader.load()
```

### Metadata-Rich Processing
Each processed document includes:
- Document structure information
- Processing method details
- Export type configuration
- Content statistics
- Original file metadata

## Configuration

### Service Configuration
- **Port**: Configurable via `DOCLING_SERVICE_PORT`
- **Timeout**: 60 seconds for document processing
- **CORS**: Enabled for development (configure for production)

### LangChain Docling Options
- **Export Types**: Markdown or document chunks
- **Chunking**: Intelligent document-aware chunking
- **Metadata**: Rich metadata extraction

## Troubleshooting

### Service Won't Start

1. Check Python version (requires Python 3.8+)
2. Install LangChain Docling: `pip install -qU langchain-docling`
3. Verify all dependencies: `pip install -r requirements.txt`
4. Check port availability: `netstat -an | grep 8001`

### Processing Errors

1. Verify file format is supported
2. Check file size and complexity
3. Review service logs for specific errors
4. Test with simple documents first

### Integration Issues

1. Verify service is running: `curl http://localhost:8001/health`
2. Check `DOCLING_SERVICE_URL` in Node.js backend `.env`
3. Review network connectivity

## Production Deployment

### Docker Setup
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8001

CMD ["uvicorn", "docling_service:app", "--host", "0.0.0.0", "--port", "8001"]
```

### Process Manager (PM2)
```json
{
  "name": "langchain-docling-service",
  "script": "uvicorn",
  "args": "docling_service:app --host 0.0.0.0 --port 8001",
  "cwd": "/path/to/python-services",
  "instances": 1,
  "exec_mode": "fork"
}
```

## Development

### Adding New Features
1. Modify `docling_service.py` for new endpoints
2. Update `DoclingIntegrationService` in Node.js backend
3. Add tests to `test-docling-integration.js`
4. Update documentation

### LangChain Integration
The service leverages LangChain's document loader pattern:
- Consistent interface across document types
- Rich metadata preservation
- Seamless integration with LangChain ecosystem
- Advanced chunking strategies

## Next Steps

1. **Test with various document types** to ensure compatibility
2. **Implement caching** for frequently processed documents
3. **Add custom chunking strategies** for specific use cases
4. **Integrate with vector databases** for RAG workflows
5. **Add document preprocessing** options
