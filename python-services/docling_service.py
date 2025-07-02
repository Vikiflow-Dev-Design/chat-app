"""
Docling Document Processing Service
Handles document parsing and conversion to markdown using LangChain Docling integration
"""

import os
import json
import tempfile
from pathlib import Path
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv

# Import LangChain Docling components
from langchain_docling import DoclingLoader
from langchain_docling.loader import ExportType

# Load environment variables
load_dotenv()

app = FastAPI(title="LangChain Docling Document Processing Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DocumentProcessingResult(BaseModel):
    """Response model for document processing"""
    success: bool
    markdown_content: str
    metadata: Dict[str, Any]
    chunks: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None

class DoclingProcessor:
    """Main LangChain Docling document processor"""

    def __init__(self):
        """Initialize the LangChain Docling processor"""
        print("Initializing LangChain Docling processor...")

    def process_document(self, file_path: str, export_type: str = "markdown") -> DocumentProcessingResult:
        """
        Process a document using LangChain Docling and convert it to markdown

        Args:
            file_path: Path to the document file
            export_type: Export type - "markdown" or "chunks"

        Returns:
            DocumentProcessingResult with markdown content and metadata
        """
        try:
            print(f"Processing document with LangChain Docling: {file_path}")

            # Check if file exists and get extension
            if not os.path.exists(file_path):
                raise ValueError(f"File not found: {file_path}")

            file_extension = Path(file_path).suffix.lower()
            print(f"File extension: {file_extension}")

            # For .txt files, read content directly and return as markdown
            if file_extension == '.txt':
                print("Processing .txt file directly")
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                metadata = {
                    "processing_method": "langchain_docling_txt",
                    "export_type": export_type,
                    "file_type": "txt",
                    "total_length": len(content),
                    "file_size": os.path.getsize(file_path)
                }

                if export_type.lower() == "chunks":
                    # Simple chunking for txt files
                    lines = content.split('\n')
                    chunks = []
                    current_chunk = ""
                    chunk_id = 0

                    for line in lines:
                        if len(current_chunk) + len(line) > 500:  # Simple chunk size limit
                            if current_chunk.strip():
                                chunks.append({
                                    "chunk_id": chunk_id,
                                    "content": current_chunk.strip(),
                                    "metadata": {"chunk_index": chunk_id, "source": file_path}
                                })
                                chunk_id += 1
                            current_chunk = line + '\n'
                        else:
                            current_chunk += line + '\n'

                    # Add final chunk
                    if current_chunk.strip():
                        chunks.append({
                            "chunk_id": chunk_id,
                            "content": current_chunk.strip(),
                            "metadata": {"chunk_index": chunk_id, "source": file_path}
                        })

                    metadata["total_chunks"] = len(chunks)

                    return DocumentProcessingResult(
                        success=True,
                        markdown_content=content,
                        metadata=metadata,
                        chunks=chunks
                    )
                else:
                    return DocumentProcessingResult(
                        success=True,
                        markdown_content=content,
                        metadata=metadata
                    )

            # Determine export type for other file formats
            if export_type.lower() == "chunks":
                export_mode = ExportType.DOC_CHUNKS
            else:
                export_mode = ExportType.MARKDOWN

            # Initialize DoclingLoader for non-txt files
            loader = DoclingLoader(
                file_path=file_path,
                export_type=export_mode
            )

            # Load documents
            docs = loader.load()

            if not docs:
                raise ValueError("No documents were processed")

            print(f"Successfully processed {len(docs)} document(s)")

            # Process results based on export type
            if export_mode == ExportType.MARKDOWN:
                # For markdown mode, combine all documents
                markdown_content = "\n\n".join([doc.page_content for doc in docs])

                # Extract metadata from first document
                metadata = docs[0].metadata if docs else {}

                # Add processing info
                metadata.update({
                    "processing_method": "langchain_docling",
                    "export_type": "markdown",
                    "total_documents": len(docs),
                    "total_length": len(markdown_content)
                })

                return DocumentProcessingResult(
                    success=True,
                    markdown_content=markdown_content,
                    metadata=metadata
                )

            else:  # DOC_CHUNKS mode
                # For chunks mode, return structured chunks
                chunks = []
                total_content = ""

                for i, doc in enumerate(docs):
                    chunk_data = {
                        "chunk_id": i,
                        "content": doc.page_content,
                        "metadata": doc.metadata
                    }
                    chunks.append(chunk_data)
                    total_content += doc.page_content + "\n\n"

                # Create combined metadata
                combined_metadata = {
                    "processing_method": "langchain_docling",
                    "export_type": "chunks",
                    "total_chunks": len(chunks),
                    "total_length": len(total_content)
                }

                # Add metadata from first chunk if available
                if chunks and chunks[0]["metadata"]:
                    combined_metadata.update(chunks[0]["metadata"])

                return DocumentProcessingResult(
                    success=True,
                    markdown_content=total_content.strip(),
                    metadata=combined_metadata,
                    chunks=chunks
                )

        except Exception as e:
            print(f"Error processing document: {str(e)}")
            return DocumentProcessingResult(
                success=False,
                markdown_content="",
                metadata={},
                error=str(e)
            )

# Initialize processor
processor = DoclingProcessor()

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "LangChain Docling Document Processing Service is running"}

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "service": "langchain-docling-processor",
        "version": "1.0.0",
        "integration": "langchain-docling"
    }

@app.post("/process-document", response_model=DocumentProcessingResult)
async def process_document_endpoint(
    file: UploadFile = File(...),
    export_type: str = "markdown"
):
    """
    Process an uploaded document and return markdown content using LangChain Docling

    Args:
        file: Uploaded document file
        export_type: Export type - "markdown" or "chunks"

    Returns:
        DocumentProcessingResult with markdown content and metadata
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Get file extension
    file_extension = Path(file.filename).suffix.lower()
    supported_formats = ['.pdf', '.docx', '.doc', '.pptx', '.html', '.txt']

    if file_extension not in supported_formats:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format: {file_extension}. Supported formats: {supported_formats}"
        )

    # Create temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
        try:
            # Write uploaded file to temporary location
            content = await file.read()
            temp_file.write(content)
            temp_file.flush()

            # Process the document
            result = processor.process_document(temp_file.name, export_type)

            return result

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_file.name)
            except:
                pass

@app.post("/process-document-path")
async def process_document_by_path(
    file_path: str,
    export_type: str = "markdown"
):
    """
    Process a document by file path using LangChain Docling

    Args:
        file_path: Path to the document file
        export_type: Export type - "markdown" or "chunks"

    Returns:
        DocumentProcessingResult with markdown content and metadata
    """
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    try:
        result = processor.process_document(file_path, export_type)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

@app.get("/supported-formats")
async def get_supported_formats():
    """Get list of supported file formats"""
    return {
        "supported_formats": ['.pdf', '.docx', '.doc', '.pptx', '.html', '.txt'],
        "export_types": ["markdown", "chunks"],
        "description": "LangChain Docling integration supports various document formats"
    }

if __name__ == "__main__":
    port = int(os.getenv("DOCLING_SERVICE_PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
