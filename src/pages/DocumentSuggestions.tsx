import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Lightbulb, 
  FileText, 
  Settings, 
  Plus,
  RefreshCw,
  Eye,
  Edit3,
  Check,
  X,
  Loader2
} from 'lucide-react';

interface DocumentSection {
  id: string;
  name: string;
  type: string;
  chunkCount: number;
  suggestions: string[];
  status: 'none' | 'generating' | 'generated' | 'error';
  lastGenerated?: Date;
}

interface DocumentInfo {
  id: string;
  name: string;
  uploadedAt: Date;
  sections: DocumentSection[];
}

const DocumentSuggestions: React.FC = () => {
  console.log('🚀 DocumentSuggestions component mounted');

  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();

  console.log('📋 URL params:', { documentId });
  console.log('🌐 Current location:', window.location.href);
  
  const [document, setDocument] = useState<DocumentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [previewSection, setPreviewSection] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editSuggestions, setEditSuggestions] = useState<string[]>([]);

  useEffect(() => {
    console.log('🚀 DocumentSuggestions useEffect triggered');
    console.log('📋 Document ID from params:', documentId);

    if (documentId) {
      console.log('✅ Document ID exists, calling fetchDocumentSections');
      fetchDocumentSections();
    } else {
      console.log('❌ No document ID found in params');
    }
  }, [documentId]);

  const fetchDocumentSections = async () => {
    console.log('🔍 fetchDocumentSections called');
    console.log('📋 Document ID:', documentId);

    try {
      console.log('⏳ Setting loading to true');
      setLoading(true);

      const apiUrl = `/api/documents/${documentId}/sections`;
      console.log('🌐 Making API call to:', apiUrl);
      console.log('🌐 Full URL would be:', window.location.origin + apiUrl);

      const response = await fetch(apiUrl);

      console.log('📡 Response received:');
      console.log('  - Status:', response.status);
      console.log('  - Status Text:', response.statusText);
      console.log('  - Headers:', Object.fromEntries(response.headers.entries()));
      console.log('  - URL:', response.url);
      console.log('  - OK:', response.ok);

      if (!response.ok) {
        console.log('❌ Response not OK, throwing error');
        throw new Error(`Failed to fetch document sections: ${response.status} ${response.statusText}`);
      }

      console.log('📄 Attempting to parse JSON response...');
      const data = await response.json();
      console.log('✅ JSON parsed successfully:', data);

      console.log('💾 Setting document data');
      setDocument(data);

    } catch (err) {
      console.error('❌ Error in fetchDocumentSections:', err);
      console.error('❌ Error type:', typeof err);
      console.error('❌ Error message:', err instanceof Error ? err.message : 'Unknown error');
      console.error('❌ Full error object:', err);

      setError(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      console.log('🏁 Setting loading to false');
      setLoading(false);
    }
  };

  const generateSectionSuggestions = async (sectionId: string) => {
    console.log('🎯 generateSectionSuggestions called for section:', sectionId);

    if (!document) {
      console.log('❌ No document available, returning');
      return;
    }

    console.log('⏳ Updating section status to generating');
    // Update section status to generating
    setDocument(prev => prev ? {
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? { ...section, status: 'generating' as const }
          : section
      )
    } : null);

    try {
      const apiUrl = `/api/documents/${documentId}/sections/${sectionId}/suggestions`;
      console.log('🌐 Making POST request to:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('📡 Generate suggestions response:');
      console.log('  - Status:', response.status);
      console.log('  - OK:', response.ok);

      if (!response.ok) {
        console.log('❌ Generate suggestions failed');
        throw new Error('Failed to generate suggestions');
      }

      const { suggestions } = await response.json();
      console.log('✅ Suggestions generated:', suggestions);
      
      // Update section with generated suggestions
      setDocument(prev => prev ? {
        ...prev,
        sections: prev.sections.map(section => 
          section.id === sectionId 
            ? { 
                ...section, 
                suggestions,
                status: 'generated' as const,
                lastGenerated: new Date()
              }
            : section
        )
      } : null);

    } catch (err) {
      console.error('❌ Error generating suggestions:', err);
      console.error('❌ Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        type: typeof err,
        sectionId
      });

      // Update section status to error
      setDocument(prev => prev ? {
        ...prev,
        sections: prev.sections.map(section =>
          section.id === sectionId
            ? { ...section, status: 'error' as const }
            : section
        )
      } : null);
    }
  };

  const generateAllSuggestions = async () => {
    if (!document) return;
    
    setGeneratingAll(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/suggestions/generate-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Failed to generate all suggestions');
      
      // Refresh the document data
      await fetchDocumentSections();
    } catch (err) {
      console.error('Error generating all suggestions:', err);
    } finally {
      setGeneratingAll(false);
    }
  };

  const startEditing = (section: DocumentSection) => {
    setEditingSection(section.id);
    setEditSuggestions([...section.suggestions]);
  };

  const saveEdits = async () => {
    if (!editingSection || !document) return;

    try {
      const response = await fetch(`/api/documents/${documentId}/sections/${editingSection}/suggestions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestions: editSuggestions })
      });

      if (!response.ok) throw new Error('Failed to save suggestions');

      // Update local state
      setDocument(prev => prev ? {
        ...prev,
        sections: prev.sections.map(section => 
          section.id === editingSection 
            ? { ...section, suggestions: [...editSuggestions] }
            : section
        )
      } : null);

      setEditingSection(null);
      setEditSuggestions([]);
    } catch (err) {
      console.error('Error saving suggestions:', err);
    }
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditSuggestions([]);
  };

  const addNewSuggestion = () => {
    setEditSuggestions(prev => [...prev, '']);
  };

  const updateSuggestion = (index: number, value: string) => {
    setEditSuggestions(prev => prev.map((suggestion, i) => 
      i === index ? value : suggestion
    ));
  };

  const removeSuggestion = (index: number) => {
    setEditSuggestions(prev => prev.filter((_, i) => i !== index));
  };

  const getSectionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'skills':
      case 'technical_skills':
        return '🛠️';
      case 'experience':
      case 'work_experience':
        return '💼';
      case 'education':
        return '🎓';
      case 'projects':
        return '🚀';
      case 'contact':
      case 'contact_info':
        return '📞';
      default:
        return '📄';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generated':
        return 'text-green-600 bg-green-50';
      case 'generating':
        return 'text-blue-600 bg-blue-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  console.log('🎨 Rendering DocumentSuggestions component');
  console.log('📊 Current state:', { loading, error, document: !!document });

  if (loading) {
    console.log('⏳ Showing loading state');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !document) {
    console.log('❌ Showing error state:', { error, hasDocument: !!document });
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-red-600 text-lg mb-4">
            {error || 'Document not found'}
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Knowledge Management
          </button>
        </div>
      </div>
    );
  }

  console.log('✅ Rendering main content with document:', document);
  console.log('📋 Document sections:', document.sections?.length || 0);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Knowledge Management
        </button>
        
        <div className="flex items-center gap-3 mb-2">
          <Lightbulb className="w-6 h-6 text-yellow-600" />
          <h1 className="text-2xl font-bold text-gray-900">Document Suggestions</h1>
        </div>
        
        <div className="flex items-center gap-2 text-gray-600">
          <FileText className="w-4 h-4" />
          <span className="font-medium">{document.name}</span>
          <span className="text-gray-400">•</span>
          <span>{document.sections.length} sections found</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={generateAllSuggestions}
          disabled={generatingAll}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {generatingAll ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Generate All Missing Suggestions
        </button>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {document.sections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            onGenerate={() => generateSectionSuggestions(section.id)}
            onPreview={() => setPreviewSection(section.id)}
            onEdit={() => startEditing(section)}
            getSectionIcon={getSectionIcon}
            getStatusColor={getStatusColor}
            isEditing={editingSection === section.id}
            editSuggestions={editSuggestions}
            onUpdateSuggestion={updateSuggestion}
            onRemoveSuggestion={removeSuggestion}
            onAddSuggestion={addNewSuggestion}
            onSaveEdits={saveEdits}
            onCancelEditing={cancelEditing}
          />
        ))}
      </div>
    </div>
  );
};

// Section Card Component
interface SectionCardProps {
  section: DocumentSection;
  onGenerate: () => void;
  onPreview: () => void;
  onEdit: () => void;
  getSectionIcon: (type: string) => string;
  getStatusColor: (status: string) => string;
  isEditing: boolean;
  editSuggestions: string[];
  onUpdateSuggestion: (index: number, value: string) => void;
  onRemoveSuggestion: (index: number) => void;
  onAddSuggestion: () => void;
  onSaveEdits: () => void;
  onCancelEditing: () => void;
}

const SectionCard: React.FC<SectionCardProps> = ({
  section,
  onGenerate,
  onPreview,
  onEdit,
  getSectionIcon,
  getStatusColor,
  isEditing,
  editSuggestions,
  onUpdateSuggestion,
  onRemoveSuggestion,
  onAddSuggestion,
  onSaveEdits,
  onCancelEditing
}) => {
  const getStatusText = (status: string) => {
    switch (status) {
      case 'generated':
        return `${section.suggestions.length} suggestions generated`;
      case 'generating':
        return 'Generating suggestions...';
      case 'error':
        return 'Error generating suggestions';
      default:
        return 'No suggestions generated';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getSectionIcon(section.type)}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{section.name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{section.chunkCount} chunks</span>
              <span className="text-gray-400">•</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(section.status)}`}>
                {getStatusText(section.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {section.status === 'generated' && !isEditing && (
            <>
              <button
                onClick={onPreview}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                title="Preview suggestions"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={onEdit}
                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg"
                title="Edit suggestions"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </>
          )}

          {section.status !== 'generating' && !isEditing && (
            <button
              onClick={onGenerate}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
            >
              {section.status === 'generated' ? (
                <>
                  <RefreshCw className="w-3 h-3" />
                  Regenerate
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3" />
                  Generate
                </>
              )}
            </button>
          )}

          {section.status === 'generating' && (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Generating...</span>
            </div>
          )}
        </div>
      </div>

      {/* Suggestions Display/Edit */}
      {section.status === 'generated' && !isEditing && section.suggestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Current Suggestions:</h4>
          {section.suggestions.map((suggestion, index) => (
            <div key={index} className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
              • {suggestion}
            </div>
          ))}
        </div>
      )}

      {/* Edit Mode */}
      {isEditing && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Edit Suggestions:</h4>

          <div className="space-y-3">
            {editSuggestions.map((suggestion, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">•</span>
                <input
                  type="text"
                  value={suggestion}
                  onChange={(e) => onUpdateSuggestion(index, e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter suggestion..."
                />
                <button
                  onClick={() => onRemoveSuggestion(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={onAddSuggestion}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add another suggestion
          </button>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={onSaveEdits}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Save Changes
            </button>
            <button
              onClick={onCancelEditing}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {section.lastGenerated && (
        <div className="mt-4 text-xs text-gray-500">
          Last generated: {new Date(section.lastGenerated).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default DocumentSuggestions;
