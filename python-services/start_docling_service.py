#!/usr/bin/env python3
"""
Startup script for LangChain Docling Document Processing Service
"""

import os
import sys
import subprocess
import time
import requests
from pathlib import Path

def check_dependencies():
    """Check if required dependencies are installed"""
    try:
        import langchain_docling
        import fastapi
        import uvicorn
        print("✅ All required dependencies are installed")
        print(f"✅ LangChain Docling integration available")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Please install dependencies with: pip install -r requirements.txt")
        print("Key dependency: pip install -qU langchain-docling")
        return False

def check_service_health(port=8001, max_retries=30):
    """Check if the service is running and healthy"""
    url = f"http://localhost:{port}/health"
    
    for i in range(max_retries):
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ LangChain Docling service is healthy at port {port}")
                print(f"✅ Service: {data.get('service', 'unknown')}")
                print(f"✅ Integration: {data.get('integration', 'unknown')}")
                return True
        except requests.exceptions.RequestException:
            pass
        
        if i < max_retries - 1:
            print(f"⏳ Waiting for service to start... ({i+1}/{max_retries})")
            time.sleep(2)
    
    print(f"❌ Service failed to start after {max_retries * 2} seconds")
    return False

def start_service():
    """Start the LangChain Docling service"""
    if not check_dependencies():
        return False
    
    port = int(os.getenv("DOCLING_SERVICE_PORT", 8001))
    
    print(f"🚀 Starting LangChain Docling Document Processing Service on port {port}")
    print(f"🔗 Integration: LangChain Docling")
    
    # Get the directory of this script
    script_dir = Path(__file__).parent
    service_file = script_dir / "docling_service.py"
    
    if not service_file.exists():
        print(f"❌ Service file not found: {service_file}")
        return False
    
    try:
        # Start the service
        process = subprocess.Popen([
            sys.executable, "-m", "uvicorn", 
            "docling_service:app",
            "--host", "0.0.0.0",
            "--port", str(port),
            "--reload"
        ], cwd=script_dir)
        
        print(f"📋 Service started with PID: {process.pid}")
        
        # Wait a moment for the service to start
        time.sleep(3)
        
        # Check if service is healthy
        if check_service_health(port):
            print("🎉 LangChain Docling service started successfully!")
            print(f"📍 Service URL: http://localhost:{port}")
            print(f"📍 Health check: http://localhost:{port}/health")
            print(f"📍 API docs: http://localhost:{port}/docs")
            print(f"📍 Supported formats: http://localhost:{port}/supported-formats")
            print("\n📋 Available export types:")
            print("  - markdown: Clean markdown output")
            print("  - chunks: Structured chunks for RAG workflows")
            return True
        else:
            print("❌ Service failed to start properly")
            process.terminate()
            return False
            
    except Exception as e:
        print(f"❌ Error starting service: {e}")
        return False

def show_usage():
    """Show usage information"""
    print("\n📖 Usage Information:")
    print("1. Install dependencies: pip install -r requirements.txt")
    print("2. Start service: python start_docling_service.py")
    print("3. Test integration: cd ../backend && npm run test-docling")
    print("\n🔧 Environment Variables:")
    print("  DOCLING_SERVICE_PORT=8001  # Service port")
    print("\n📚 API Endpoints:")
    print("  POST /process-document      # Upload and process file")
    print("  POST /process-document-path # Process file by path")
    print("  GET  /supported-formats     # Get supported formats")
    print("  GET  /health               # Health check")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] in ['--help', '-h']:
        show_usage()
        sys.exit(0)
    
    success = start_service()
    if not success:
        print("\n❌ Failed to start LangChain Docling service")
        show_usage()
        sys.exit(1)
