import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { ViewFileDialog } from "@/components/ViewFileDialog";
import { ViewTextDialog } from "@/components/ViewTextDialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  FileText,
  Link as LinkIcon,
  Plus,
  Trash2,
  Download,
  File,
  Text,
  Globe,
  MessageSquare,
  FileQuestion,
  AlertCircle,
  X,
  Info,
  ArrowDown,
  Loader2,
  Sparkles,
  Database,
  Table,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  ShoppingCart,
  ChevronRight,
  Eye,
} from "lucide-react";
import { useChatbots } from "@/context/ChatbotContext";
import { Chatbot } from "@/types/chatbot";
import { ChatbotProductsSection } from "@/components/chatbot/ChatbotProductsSection";
import { isSupportedFileType, formatFileSize } from "@/utils/fileUpload";
import { SourcesSummary } from "@/components/sources/SourcesSummary";
import { SelectableSourceList } from "@/components/sources/SelectableSourceList";

const Sources = () => {
  const { id } = useParams();
  const { getChatbot } = useChatbots();
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [loading, setLoading] = useState(true);

  // Check URL path for tab selection
  const location = useLocation();
  const path = location.pathname;

  // Determine active tab from URL
  const getTabFromPath = (path: string) => {
    if (path.includes("/sources/file")) return "files";
    if (path.includes("/sources/text")) return "text";
    if (path.includes("/sources/website")) return "website";
    if (path.includes("/sources/qa")) return "qa";
    if (path.includes("/sources/mongodb")) return "mongodb";
    if (path.includes("/sources/sheets")) return "sheets";
    if (path.includes("/sources/notion")) return "notion";
    if (path.includes("/sources/products")) return "products";
    return "files"; // Default tab
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath(path));

  // Update URL when component mounts
  useEffect(() => {
    const basePath = window.location.pathname.split("/sources")[0];
    const tabPath = activeTab === "files" ? "file" : activeTab;
    window.history.replaceState(null, "", `${basePath}/sources/${tabPath}`);
  }, []);
  // Request ID: temp-fe-a50bd9f0-4a9a-4803-b492-c0ac49452c2a
  const { toast } = useToast();

  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<
    {
      id: string;
      name: string;
      size: string;
      status: string;
      title?: string;
      fileName?: string;
      fileType?: string;
      fileSize?: string;
      content?: string;
      extractedInformation?: string;
      processingStatus?: string;
      createdAt?: string;
    }[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [selectedText, setSelectedText] = useState<any>(null);
  const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);

  // Text input state
  const [textInput, setTextInput] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [textDescription, setTextDescription] = useState("");
  const [isSavingText, setIsSavingText] = useState(false);
  const [textSources, setTextSources] = useState<
    {
      id: string;
      title: string;
      description: string;
      content: string;
      size: string;
      isNew?: boolean;
      createdAt: string;
    }[]
  >([]);

  // Website input state
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [isFetchingLinks, setIsFetchingLinks] = useState(false);
  const [crawledLinks, setCrawledLinks] = useState<
    { url: string; status: string; size: string }[]
  >([]);

  // Q&A input state
  const [questions, setQuestions] = useState<
    { question: string; answer: string; title?: string; description?: string }[]
  >([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newQATitle, setNewQATitle] = useState("");
  const [newQADescription, setNewQADescription] = useState("");
  const [isAddingQA, setIsAddingQA] = useState(false);

  // MongoDB state
  const [mongoDbUri, setMongoDbUri] = useState("");
  const [mongoDbName, setMongoDbName] = useState("");
  const [mongoCollections, setMongoCollections] = useState<string[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [isConnectingMongo, setIsConnectingMongo] = useState(false);
  const [isMongoConnected, setIsMongoConnected] = useState(false);
  const [isImportingMongo, setIsImportingMongo] = useState(false);

  // Google Sheets state
  const [sheetsUrl, setSheetsUrl] = useState("");
  const [sheetsList, setSheetsList] = useState<{ id: string; name: string }[]>(
    []
  );
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [isConnectingSheets, setIsConnectingSheets] = useState(false);
  const [isSheetsConnected, setIsSheetsConnected] = useState(false);
  const [isImportingSheets, setIsImportingSheets] = useState(false);

  // Sources summary
  const [sourcesSummary, setSourcesSummary] = useState({
    text: { count: 0, size: "0 B" },
    links: { count: 0, size: "0 B" },
    qa: { count: 0, size: "0 B" },
    mongodb: { count: 0, size: "0 B" },
    sheets: { count: 0, size: "0 B" },
    totalSize: "0 B",
    quota: "400 KB",
  });

  // Load chatbot data and knowledge documents
  useEffect(() => {
    const loadData = async () => {
      if (id) {
        try {
          setLoading(true);

          // Load chatbot data
          const fetchedBot = await getChatbot(id);
          if (fetchedBot) {
            setChatbot(fetchedBot);
          }

          // Import and load knowledge using the new unified model
          const { getChatbotKnowledge } = await import(
            "@/services/chatbotKnowledgeService"
          );
          // Use mock token for development
          const token = "mock_jwt_token_for_development";

          const knowledge = await getChatbotKnowledge(id, token);

          // Process the knowledge sources
          const { files, texts, qaItems } = knowledge;

          // Update uploaded files
          setUploadedFiles(
            files.map((file) => ({
              id: file._id,
              name: file.fileName || "Unknown file",
              size: formatFileSize(file.fileSize || 0),
              status:
                file.processingStatus === "completed"
                  ? "Processed"
                  : "Processing",
              title: file.title,
              fileName: file.fileName,
              fileType: file.fileType,
              fileSize: formatFileSize(file.fileSize || 0),
              content: file.content,
              extractedInformation: file.extractedInformation,
              processingStatus: file.processingStatus,
              createdAt: file.createdAt,
            }))
          );

          // Update text sources
          setTextSources(
            texts.map((text) => ({
              id: text._id,
              title: text.title,
              description: text.description || "",
              content: text.content,
              size: formatFileSize(text.content.length || 0),
              createdAt: text.createdAt,
            }))
          );

          // Update Q&A items
          const allQAItems = qaItems.flatMap(
            (qaSource) => qaSource.qaItems || []
          );
          setQuestions(allQAItems);

          // Calculate total sizes
          const textSize = texts.reduce(
            (sum, text) => sum + (text.content?.length || 0),
            0
          );
          const fileSize = files.reduce(
            (sum, file) => sum + (file.fileSize || 0),
            0
          );
          const qaSize = qaItems.reduce((sum, qaSource) => {
            return (
              sum +
              (qaSource.qaItems?.reduce(
                (qaSum, qa) =>
                  qaSum + (qa.question?.length || 0) + (qa.answer?.length || 0),
                0
              ) || 0)
            );
          }, 0);

          // Update sources summary
          setSourcesSummary({
            text: {
              count: texts.length,
              size: formatFileSize(textSize),
            },
            links: { count: 0, size: "0 B" },
            qa: {
              count: qaItems.length,
              size: formatFileSize(qaSize),
            },
            mongodb: { count: 0, size: "0 B" },
            sheets: { count: 0, size: "0 B" },
            totalSize: formatFileSize(textSize + fileSize + qaSize),
            quota: "400 KB",
          });
        } catch (error) {
          console.error("Error loading data:", error);
          toast({
            title: "Error",
            description: "Failed to load data",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [id, getChatbot, toast]);

  // Handle file upload
  const handleFileUpload = useCallback(
    (uploadedFiles: FileList | null) => {
      if (!uploadedFiles) return;

      const validFiles: File[] = [];

      Array.from(uploadedFiles).forEach((file) => {
        if (isSupportedFileType(file)) {
          validFiles.push(file);
        } else {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not a supported file type. Please upload PDF, DOC, DOCX, or TXT files.`,
            variant: "destructive",
          });
        }
      });

      setFiles((prev) => [...prev, ...validFiles]);
    },
    [toast]
  );

  // Handle file upload to server
  const handleUploadToServer = async () => {
    if (!files.length || !id) return;

    setIsUploading(true);

    try {
      for (const file of files) {
        try {
          // Use mock token for development
          const token = "mock_jwt_token_for_development";

          // Import the uploadFile function from the new service
          const { uploadFile } = await import(
            "@/services/chatbotKnowledgeService"
          );

          // Upload the file using the new unified model
          const knowledge = await uploadFile(file, id, file.name, [], token);

          // Get the newly added file (last one in the files array)
          const uploadedFile = knowledge.files[knowledge.files.length - 1];

          setUploadedFiles((prev) => [
            ...prev,
            {
              id: uploadedFile._id,
              name: uploadedFile.fileName || file.name,
              size: formatFileSize(uploadedFile.fileSize || file.size),
              status:
                uploadedFile.processingStatus === "completed"
                  ? "Processed"
                  : "Processing",
            },
          ]);

          // Update sources summary
          setSourcesSummary((prev) => ({
            ...prev,
            text: {
              count: prev.text.count + 1,
              size: formatFileSize(file.size + parseInt(prev.text.size) || 0),
            },
            totalSize: formatFileSize(
              file.size + parseInt(prev.totalSize) || 0
            ),
          }));
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}. Please try again.`,
            variant: "destructive",
          });
        }
      }

      // Clear the files list after successful upload
      setFiles([]);

      toast({
        title: "Files uploaded",
        description: "Your files have been uploaded and are being processed.",
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      toast({
        title: "Upload failed",
        description:
          "An error occurred while uploading files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  // Handle file input click
  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  };

  // Handle view file
  const handleViewFile = (fileId: string) => {
    const file = uploadedFiles.find((f) => f.id === fileId);
    if (file) {
      setSelectedFile(file);
      setIsFileDialogOpen(true);
    }
  };

  // Handle delete file
  const handleDeleteFile = async (fileId: string) => {
    if (!id) return;

    try {
      // Import the deleteFileSource function from the service
      const { deleteFileSource } = await import(
        "@/services/chatbotKnowledgeService"
      );

      // Use mock token for development
      const token = "mock_jwt_token_for_development";

      // Delete the file
      await deleteFileSource(id, fileId, token);

      // Update the UI
      setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));

      toast({
        title: "File deleted",
        description: "The file has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        title: "Error",
        description: "Failed to delete the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  // View text source
  const handleViewText = (textId: string) => {
    const text = textSources.find((t) => t.id === textId);
    if (text) {
      setSelectedText(text);
      setIsTextDialogOpen(true);
    }
  };

  // Update text source
  const handleUpdateText = async (
    textId: string,
    title: string,
    description: string,
    content: string
  ) => {
    if (!id) return;

    try {
      // Import the updateTextSource function from the service
      const { updateTextSource } = await import(
        "@/services/chatbotKnowledgeService"
      );

      // Use mock token for development
      const token = "mock_jwt_token_for_development";

      // Update the text source
      await updateTextSource(
        id,
        textId,
        {
          title,
          description,
          content,
        },
        token
      );

      // Update the UI
      setTextSources((prev) =>
        prev.map((text) =>
          text.id === textId
            ? {
                ...text,
                title,
                description,
                content,
                size: formatFileSize(content.length || 0),
              }
            : text
        )
      );
    } catch (error) {
      console.error("Error updating text source:", error);
      throw error;
    }
  };

  // Delete text source
  const handleDeleteTextSource = async (textId: string) => {
    try {
      // Import the deleteTextSource function from the new service
      const { deleteTextSource } = await import(
        "@/services/chatbotKnowledgeService"
      );

      // Use mock token for development
      const token = "mock_jwt_token_for_development";

      if (!id) return;

      // Delete the text source
      await deleteTextSource(id, textId, token);

      // Remove the text source from the list
      setTextSources((prev) => prev.filter((text) => text.id !== textId));

      // Update the sources summary
      setSourcesSummary((prev) => ({
        ...prev,
        text: {
          count: Math.max(0, prev.text.count - 1),
          size: prev.text.size, // We don't have the exact size to subtract, so keep it as is
        },
      }));

      toast({
        title: "Text deleted",
        description: "The text source has been deleted.",
      });
    } catch (error) {
      console.error("Error deleting text source:", error);
      toast({
        title: "Delete failed",
        description:
          "An error occurred while deleting the text source. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Save text content
  const handleSaveText = async () => {
    if (!textInput.trim() || !id) return;

    setIsSavingText(true);

    try {
      // Import the addTextSource function from the new service
      const { addTextSource } = await import(
        "@/services/chatbotKnowledgeService"
      );

      // Use the provided title or generate a default one
      const title =
        textTitle.trim() || `Text Source ${new Date().toLocaleString()}`;

      // Use mock token for development
      const token = "mock_jwt_token_for_development";

      // Add the text source using the new unified model
      const response = await addTextSource(
        {
          chatbotId: id,
          title,
          description: textDescription.trim(),
          content: textInput,
        },
        token
      );

      // Get the newly added text source
      const newTextSource = response.texts[response.texts.length - 1];

      // Add the new text source to the list with the "new" flag
      setTextSources((prev) => [
        ...prev,
        {
          id: newTextSource._id,
          title: newTextSource.title,
          description: newTextSource.description || "",
          content: newTextSource.content,
          size: formatFileSize(newTextSource.content.length || 0),
          isNew: true,
          createdAt: newTextSource.createdAt,
        },
      ]);

      toast({
        title: "Text saved",
        description: "Your text has been saved as a knowledge source.",
      });

      // Update sources summary
      setSourcesSummary((prev) => ({
        ...prev,
        text: {
          count: prev.text.count + 1,
          size: formatFileSize(
            textInput.length + parseInt(prev.text.size) || 0
          ),
        },
        totalSize: formatFileSize(
          textInput.length + parseInt(prev.totalSize) || 0
        ),
      }));

      // Clear the inputs after successful save
      setTextInput("");
      setTextTitle("");
      setTextDescription("");
    } catch (error) {
      console.error("Error saving text:", error);
      toast({
        title: "Save failed",
        description: "An error occurred while saving text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingText(false);
    }
  };

  // Add new Q&A
  const handleAddQA = async () => {
    if (!newQuestion.trim() || !newAnswer.trim() || !id) return;

    setIsAddingQA(true);

    try {
      // Import the addQASource function from the new service
      const { addQASource } = await import(
        "@/services/chatbotKnowledgeService"
      );

      // Use mock token for development
      const token = "mock_jwt_token_for_development";

      // Use title from input or generate from question
      const title = newQATitle.trim() || `Q&A: ${newQuestion.substring(0, 50)}`;

      // Add the Q&A source using the new unified model
      await addQASource(
        {
          chatbotId: id,
          title: title,
          // Note: description might not be supported in the API yet
          qaItems: [
            {
              question: newQuestion,
              answer: newAnswer,
              // Store description in a comment if API doesn't support it directly
              comment: newQADescription.trim() || undefined,
            },
          ],
        },
        token
      );

      // Update the local state
      setQuestions((prev) => [
        ...prev,
        {
          question: newQuestion,
          answer: newAnswer,
          title: title,
          description: newQADescription.trim(),
        },
      ]);

      toast({
        title: "Q&A added",
        description:
          "Your question and answer have been added as a knowledge source.",
      });

      // Update sources summary
      const qaSize = newQuestion.length + newAnswer.length;
      setSourcesSummary((prev) => ({
        ...prev,
        qa: {
          count: prev.qa.count + 1,
          size: formatFileSize(qaSize + parseInt(prev.qa.size) || 0),
        },
        totalSize: formatFileSize(qaSize + parseInt(prev.totalSize) || 0),
      }));

      // Clear the inputs after successful save
      setNewQuestion("");
      setNewAnswer("");
      setNewQATitle("");
      setNewQADescription("");
    } catch (error) {
      console.error("Error adding Q&A:", error);
      toast({
        title: "Add failed",
        description: "An error occurred while adding Q&A. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingQA(false);
    }
  };

  // Delete Q&A
  const handleDeleteQA = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  // Delete all Q&A
  const handleDeleteAllQA = () => {
    setQuestions([]);
  };

  // Fetch website links
  const handleFetchLinks = async () => {
    if (!websiteUrl || !id) return;

    setIsFetchingLinks(true);

    try {
      // This would be replaced with actual API call to crawl website
      // Example: const links = await crawlWebsite(websiteUrl, id);

      console.log(`Fetching links from ${websiteUrl}`);

      // Simulate adding a new link
      const newLink = {
        url: websiteUrl,
        status: "Active",
        size: "8 KB",
      };

      setCrawledLinks((prev) => [...prev, newLink]);

      toast({
        title: "Links fetched",
        description: "Website links have been fetched and are being processed.",
      });

      // Clear the input after successful fetch
      setWebsiteUrl("");
    } catch (error) {
      console.error("Error fetching links:", error);
      toast({
        title: "Fetch failed",
        description:
          "An error occurred while fetching links. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingLinks(false);
    }
  };

  // Load sitemap
  const handleLoadSitemap = async () => {
    if (!sitemapUrl || !id) return;

    setIsFetchingLinks(true);

    try {
      // This would be replaced with actual API call to load sitemap
      // Example: const links = await loadSitemap(sitemapUrl, id);

      console.log(`Loading sitemap from ${sitemapUrl}`);

      // Simulate adding new links from sitemap
      const newLink = {
        url: sitemapUrl.replace("sitemap.xml", "page1.html"),
        status: "Active",
        size: "5 KB",
      };

      setCrawledLinks((prev) => [...prev, newLink]);

      toast({
        title: "Sitemap loaded",
        description: "Sitemap has been loaded and links are being processed.",
      });

      // Clear the input after successful load
      setSitemapUrl("");
    } catch (error) {
      console.error("Error loading sitemap:", error);
      toast({
        title: "Load failed",
        description:
          "An error occurred while loading sitemap. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingLinks(false);
    }
  };

  // Delete link
  const handleDeleteLink = (url: string) => {
    setCrawledLinks((prev) => prev.filter((link) => link.url !== url));
  };

  // Delete all links
  const handleDeleteAllLinks = () => {
    setCrawledLinks([]);
  };

  // MongoDB handlers
  const handleConnectMongoDB = async () => {
    if (!mongoDbUri || !mongoDbName) return;

    setIsConnectingMongo(true);

    try {
      // This would be replaced with actual API call to connect to MongoDB
      // Example: const collections = await connectToMongoDB(mongoDbUri, mongoDbName);

      console.log(`Connecting to MongoDB: ${mongoDbUri}, DB: ${mongoDbName}`);

      // Simulate a delay for connection
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate fetching collections
      const mockCollections = [
        "users",
        "products",
        "orders",
        "inventory",
        "transactions",
      ];

      setMongoCollections(mockCollections);
      setIsMongoConnected(true);

      toast({
        title: "MongoDB connected",
        description: `Successfully connected to ${mongoDbName}. ${mockCollections.length} collections found.`,
      });
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
      toast({
        title: "Connection failed",
        description:
          "Failed to connect to MongoDB. Please check your connection string and database name.",
        variant: "destructive",
      });
    } finally {
      setIsConnectingMongo(false);
    }
  };

  const handleImportMongoCollections = async () => {
    if (!selectedCollections.length || !id) return;

    setIsImportingMongo(true);

    try {
      // This would be replaced with actual API call to import collections
      // Example: await importMongoCollections(mongoDbUri, mongoDbName, selectedCollections, id);

      console.log(`Importing collections: ${selectedCollections.join(", ")}`);

      // Simulate a delay for import
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update sources summary
      setSourcesSummary((prev) => ({
        ...prev,
        mongodb: {
          count: prev.mongodb.count + selectedCollections.length,
          size: `${selectedCollections.length * 5} KB`,
        },
        totalSize: `${
          parseInt(prev.totalSize) + selectedCollections.length * 5
        } KB`,
      }));

      toast({
        title: "Collections imported",
        description: `Successfully imported ${selectedCollections.length} collections.`,
      });
    } catch (error) {
      console.error("Error importing MongoDB collections:", error);
      toast({
        title: "Import failed",
        description: "Failed to import MongoDB collections. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsImportingMongo(false);
    }
  };

  // Google Sheets handlers
  const handleConnectGoogleSheets = async () => {
    if (!sheetsUrl) return;

    setIsConnectingSheets(true);

    try {
      // This would be replaced with actual API call to connect to Google Sheets
      // Example: const sheets = await connectToGoogleSheets(sheetsUrl);

      console.log(`Connecting to Google Sheets: ${sheetsUrl}`);

      // Simulate a delay for connection
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate fetching sheets
      const mockSheets = [
        { id: "sheet1", name: "Sales Data" },
        { id: "sheet2", name: "Customer Information" },
        { id: "sheet3", name: "Product Catalog" },
      ];

      setSheetsList(mockSheets);
      setIsSheetsConnected(true);

      toast({
        title: "Google Sheets connected",
        description: `Successfully connected. ${mockSheets.length} sheets found.`,
      });
    } catch (error) {
      console.error("Error connecting to Google Sheets:", error);
      toast({
        title: "Connection failed",
        description:
          "Failed to connect to Google Sheets. Please check your URL and permissions.",
        variant: "destructive",
      });
    } finally {
      setIsConnectingSheets(false);
    }
  };

  const handleImportGoogleSheets = async () => {
    if (!selectedSheets.length || !id) return;

    setIsImportingSheets(true);

    try {
      // This would be replaced with actual API call to import sheets
      // Example: await importGoogleSheets(sheetsUrl, selectedSheets, id);

      console.log(`Importing sheets: ${selectedSheets.join(", ")}`);

      // Simulate a delay for import
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update sources summary
      setSourcesSummary((prev) => ({
        ...prev,
        sheets: {
          count: prev.sheets.count + selectedSheets.length,
          size: `${selectedSheets.length * 3} KB`,
        },
        totalSize: `${parseInt(prev.totalSize) + selectedSheets.length * 3} KB`,
      }));

      toast({
        title: "Sheets imported",
        description: `Successfully imported ${selectedSheets.length} sheets.`,
      });
    } catch (error) {
      console.error("Error importing Google Sheets:", error);
      toast({
        title: "Import failed",
        description: "Failed to import Google Sheets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsImportingSheets(false);
    }
  };

  // Show loading state while fetching chatbot data
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading sources...</p>
        </div>
      </div>
    );
  }

  // Function to handle retraining
  const handleRetrain = () => {
    // This would be replaced with actual API call to retrain the chatbot
    toast({
      title: "Retraining started",
      description:
        "Your chatbot is being retrained with the updated knowledge sources.",
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto px-4 py-6">
      {/* Left sidebar with tabs */}
      <div className="w-full lg:w-64 shrink-0">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Sources</h1>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            orientation="vertical"
            className="w-full"
          >
            <TabsList className="flex flex-row lg:flex-col items-stretch h-auto p-0 bg-transparent overflow-x-auto lg:overflow-visible">
              <TabsTrigger
                value="files"
                className="flex items-center gap-2 justify-start px-4 py-3 data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:font-medium border-b-2 lg:border-b-0 lg:border-l-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent rounded-none transition-all"
                onClick={() =>
                  window.history.pushState(
                    null,
                    "",
                    `${
                      window.location.pathname.split("/sources")[0]
                    }/sources/file`
                  )
                }
              >
                <File className="h-5 w-5" />
                <span className="hidden sm:inline">Files</span>
              </TabsTrigger>
              <TabsTrigger
                value="text"
                className="flex items-center gap-2 justify-start px-4 py-3 data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:font-medium border-b-2 lg:border-b-0 lg:border-l-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent rounded-none transition-all"
                onClick={() =>
                  window.history.pushState(
                    null,
                    "",
                    `${
                      window.location.pathname.split("/sources")[0]
                    }/sources/text`
                  )
                }
              >
                <Text className="h-5 w-5" />
                <span className="hidden sm:inline">Text</span>
              </TabsTrigger>
              <TabsTrigger
                value="website"
                className="flex items-center gap-2 justify-start px-4 py-3 data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:font-medium border-b-2 lg:border-b-0 lg:border-l-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent rounded-none transition-all"
                onClick={() =>
                  window.history.pushState(
                    null,
                    "",
                    `${
                      window.location.pathname.split("/sources")[0]
                    }/sources/website`
                  )
                }
              >
                <Globe className="h-5 w-5" />
                <span className="hidden sm:inline">Website</span>
              </TabsTrigger>
              <TabsTrigger
                value="qa"
                className="flex items-center gap-2 justify-start px-4 py-3 data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:font-medium border-b-2 lg:border-b-0 lg:border-l-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent rounded-none transition-all"
                onClick={() =>
                  window.history.pushState(
                    null,
                    "",
                    `${
                      window.location.pathname.split("/sources")[0]
                    }/sources/qa`
                  )
                }
              >
                <MessageSquare className="h-5 w-5" />
                <span className="hidden sm:inline">Q&A</span>
              </TabsTrigger>
              <TabsTrigger
                value="mongodb"
                className="flex items-center gap-2 justify-start px-4 py-3 data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:font-medium border-b-2 lg:border-b-0 lg:border-l-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent rounded-none transition-all"
                onClick={() =>
                  window.history.pushState(
                    null,
                    "",
                    `${
                      window.location.pathname.split("/sources")[0]
                    }/sources/mongodb`
                  )
                }
              >
                <Database className="h-5 w-5" />
                <span className="hidden sm:inline">MongoDB</span>
              </TabsTrigger>
              <TabsTrigger
                value="sheets"
                className="flex items-center gap-2 justify-start px-4 py-3 data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:font-medium border-b-2 lg:border-b-0 lg:border-l-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent rounded-none transition-all"
                onClick={() =>
                  window.history.pushState(
                    null,
                    "",
                    `${
                      window.location.pathname.split("/sources")[0]
                    }/sources/sheets`
                  )
                }
              >
                <Table className="h-5 w-5" />
                <span className="hidden sm:inline">Google Sheets</span>
              </TabsTrigger>
              <TabsTrigger
                value="notion"
                className="flex items-center gap-2 justify-start px-4 py-3 data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:font-medium border-b-2 lg:border-b-0 lg:border-l-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent rounded-none transition-all"
                onClick={() =>
                  window.history.pushState(
                    null,
                    "",
                    `${
                      window.location.pathname.split("/sources")[0]
                    }/sources/notion`
                  )
                }
              >
                <FileText className="h-5 w-5" />
                <span className="hidden sm:inline">Notion</span>
              </TabsTrigger>
              <TabsTrigger
                value="products"
                className="flex items-center gap-2 justify-start px-4 py-3 data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:font-medium border-b-2 lg:border-b-0 lg:border-l-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent rounded-none transition-all"
                onClick={() =>
                  window.history.pushState(
                    null,
                    "",
                    `${
                      window.location.pathname.split("/sources")[0]
                    }/sources/products`
                  )
                }
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="hidden sm:inline">Products</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Sources Summary */}
        <div className="mt-6">
          <SourcesSummary
            summary={sourcesSummary}
            onRetrain={handleRetrain}
            needsRetraining={true}
          />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Files Tab */}
          <TabsContent value="files" className="mt-0">
            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="border-b bg-gray-50/50">
                <CardTitle className="text-lg font-medium text-gray-800">
                  Files
                </CardTitle>
                <CardDescription>
                  Upload documents to enhance your chatbot's knowledge
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                    isDragging
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={handleFileInputClick}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileInputChange}
                  />
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <ArrowDown className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="mb-1 font-medium">
                    Drag & drop files here, or click to select files
                  </p>
                  <p className="text-sm text-gray-500">
                    Supported File Types:{" "}
                    <span className="font-medium">.pdf, .doc, .docx, .txt</span>
                  </p>

                  {files.length > 0 && (
                    <div className="mt-6 text-left">
                      <h3 className="font-medium mb-3 text-gray-700 flex items-center">
                        <File className="h-4 w-4 mr-2 text-primary" />
                        Selected Files
                      </h3>
                      <ul className="space-y-2">
                        {files.map((file, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100"
                          >
                            <div className="flex items-center overflow-hidden">
                              <FileText className="h-4 w-4 mr-2 text-gray-500 shrink-0" />
                              <span className="truncate">{file.name}</span>
                              <span className="ml-2 text-xs text-gray-500 shrink-0">
                                ({formatFileSize(file.size)})
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFiles(files.filter((_, i) => i !== index));
                              }}
                              disabled={isUploading}
                              className="ml-2 shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-4 flex justify-end">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUploadToServer();
                          }}
                          disabled={isUploading}
                          className="px-4 py-2"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <ArrowDown className="h-4 w-4 mr-2" />
                              Upload Files
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-8">
                    <SelectableSourceList
                      title="File Sources"
                      icon={<FileText className="h-4 w-4 text-primary" />}
                      sources={uploadedFiles.map((file) => ({
                        id: file.id,
                        title: file.name,
                        type: file.fileType || "file",
                        size: file.size,
                        isNew:
                          new Date(file.createdAt || Date.now()).getTime() >
                          Date.now() - 86400000, // 24 hours
                        lastUpdated: file.createdAt
                          ? new Date(file.createdAt).toLocaleDateString()
                          : undefined,
                      }))}
                      onView={handleViewFile}
                      onDelete={handleDeleteFile}
                      onDeleteMultiple={(ids) => {
                        // Handle multiple deletion
                        ids.forEach((id) => handleDeleteFile(id));
                      }}
                    />
                  </div>
                )}

                <div className="mt-6 flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-md">
                  <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700">
                    If you are uploading a PDF, make sure you can
                    select/highlight the text. Scanned documents may need OCR
                    processing before upload.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Text Tab */}
          <TabsContent value="text" className="mt-0">
            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="border-b bg-gray-50/50">
                <CardTitle className="text-lg font-medium text-gray-800">
                  Text
                </CardTitle>
                <CardDescription>
                  Add and process plain text-based sources to train your AI
                  Agent with precise information.
                  <a href="#" className="text-primary hover:underline ml-1">
                    Learn more
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="text-title"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Title (optional)
                      </label>
                      <Input
                        id="text-title"
                        placeholder="Ex: Refund requests"
                        className="border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                        value={textTitle}
                        onChange={(e) => setTextTitle(e.target.value)}
                        disabled={isSavingText}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="text-description"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Description (optional)
                      </label>
                      <Input
                        id="text-description"
                        placeholder="Brief description of this text source"
                        className="border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                        value={textDescription}
                        onChange={(e) => setTextDescription(e.target.value)}
                        disabled={isSavingText}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Add a short description to help identify this text
                        source
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="text-input"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Text
                      </label>
                      <Textarea
                        id="text-input"
                        placeholder="Enter your text"
                        className="min-h-[300px] resize-y border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        disabled={isSavingText}
                      />
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-500">
                          You can paste articles, documentation, or any
                          text-based knowledge.
                        </p>
                        <span className="text-xs text-gray-500">
                          {textInput.length} B
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleSaveText}
                        disabled={isSavingText || !textInput.trim()}
                        className="px-4 py-2"
                      >
                        {isSavingText ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-2" />
                            Add text snippet
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {textSources.length > 0 && (
                    <div className="mt-8 border-t pt-6">
                      <SelectableSourceList
                        title="Text Sources"
                        icon={<FileText className="h-4 w-4 text-primary" />}
                        sources={textSources.map((text) => ({
                          id: text.id,
                          title: text.title,
                          type: "text",
                          size: text.size,
                          isNew:
                            new Date(text.createdAt || Date.now()).getTime() >
                            Date.now() - 86400000, // 24 hours
                          lastUpdated: text.createdAt
                            ? new Date(text.createdAt).toLocaleDateString()
                            : undefined,
                        }))}
                        onView={handleViewText}
                        onEdit={handleViewText} // Using the same handler for edit and view
                        onDelete={handleDeleteTextSource}
                        onDeleteMultiple={(ids) => {
                          // Handle multiple deletion
                          ids.forEach((id) => handleDeleteTextSource(id));
                        }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Website Tab */}
          <TabsContent value="website" className="mt-0">
            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="border-b bg-gray-50/50">
                <CardTitle className="text-lg font-medium text-gray-800">
                  Website
                </CardTitle>
                <CardDescription>
                  Import content from websites to enhance your chatbot's
                  knowledge
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-8">
                  <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-medium mb-3 text-gray-700 flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-primary" />
                      Crawl Website
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <Input
                          placeholder="https://www.example.com"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          disabled={isFetchingLinks}
                          className="border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <Button
                        onClick={handleFetchLinks}
                        disabled={isFetchingLinks || !websiteUrl.trim()}
                        className="shrink-0"
                      >
                        {isFetchingLinks ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Fetching...
                          </>
                        ) : (
                          <>
                            <Globe className="h-4 w-4 mr-2" />
                            Fetch Links
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      This will crawl all the links starting with the URL (not
                      including files on the website).
                    </p>
                  </div>

                  <div className="relative flex items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink mx-4 text-sm text-gray-400">
                      OR
                    </span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-medium mb-3 text-gray-700 flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-primary" />
                      Submit Sitemap
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <Input
                          placeholder="https://www.example.com/sitemap.xml"
                          value={sitemapUrl}
                          onChange={(e) => setSitemapUrl(e.target.value)}
                          disabled={isFetchingLinks}
                          className="border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <Button
                        onClick={handleLoadSitemap}
                        disabled={isFetchingLinks || !sitemapUrl.trim()}
                        className="shrink-0"
                      >
                        {isFetchingLinks ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-2" />
                            Load Sitemap
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      A sitemap.xml file contains a list of all pages on a
                      website.
                    </p>
                  </div>

                  {crawledLinks.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                      <SelectableSourceList
                        title="Link Sources"
                        icon={<LinkIcon className="h-4 w-4 text-primary" />}
                        sources={crawledLinks.map((link, index) => ({
                          id: index.toString(), // Using index as ID since links might not have unique IDs
                          title: link.url,
                          type: "link",
                          size: link.size,
                          isNew: false,
                          lastUpdated: "Last scraped recently",
                        }))}
                        onDelete={(id) => {
                          const index = parseInt(id);
                          if (
                            !isNaN(index) &&
                            index >= 0 &&
                            index < crawledLinks.length
                          ) {
                            handleDeleteLink(crawledLinks[index].url);
                          }
                        }}
                        onDeleteMultiple={(ids) => {
                          // Handle multiple deletion
                          ids.forEach((id) => {
                            const index = parseInt(id);
                            if (
                              !isNaN(index) &&
                              index >= 0 &&
                              index < crawledLinks.length
                            ) {
                              handleDeleteLink(crawledLinks[index].url);
                            }
                          });
                        }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Q&A Tab */}
          <TabsContent value="qa" className="mt-0">
            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="border-b bg-gray-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-medium text-gray-800">
                    Q&A
                  </CardTitle>
                  <CardDescription>
                    Add question and answer pairs to train your chatbot
                  </CardDescription>
                </div>
                {questions.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteAllQA}
                    className="self-end sm:self-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-2 text-gray-500" />
                    Delete all
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {questions.length > 0 && (
                    <SelectableSourceList
                      title="Q&A Sources"
                      icon={<MessageSquare className="h-4 w-4 text-primary" />}
                      sources={questions.map((qa, index) => ({
                        id: index.toString(),
                        title:
                          qa.title ||
                          `Q: ${qa.question.substring(0, 50)}${
                            qa.question.length > 50 ? "..." : ""
                          }`,
                        type: "qa",
                        size: `${qa.question.length + qa.answer.length} chars`,
                        isNew: false,
                        lastUpdated: undefined,
                      }))}
                      onView={(id) => {
                        // View functionality could be added here
                        const index = parseInt(id);
                        if (
                          !isNaN(index) &&
                          index >= 0 &&
                          index < questions.length
                        ) {
                          // Could show a dialog with the full Q&A
                        }
                      }}
                      onDelete={(id) => {
                        const index = parseInt(id);
                        if (
                          !isNaN(index) &&
                          index >= 0 &&
                          index < questions.length
                        ) {
                          handleDeleteQA(index);
                        }
                      }}
                      onDeleteMultiple={(ids) => {
                        // Handle multiple deletion - need to delete in reverse order to avoid index shifting
                        const indexes = ids
                          .map((id) => parseInt(id))
                          .filter(
                            (index) =>
                              !isNaN(index) &&
                              index >= 0 &&
                              index < questions.length
                          )
                          .sort((a, b) => b - a); // Sort in descending order

                        indexes.forEach((index) => handleDeleteQA(index));
                      }}
                    />
                  )}

                  <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden mt-6">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-700 flex items-center">
                        <Plus className="h-4 w-4 mr-2 text-primary" />
                        Add New Q&A Pair
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        New
                      </Badge>
                    </div>

                    <div className="p-4">
                      <div className="mb-4">
                        <label
                          htmlFor="new-qa-title"
                          className="block text-xs font-medium text-gray-500 mb-1"
                        >
                          Title (optional)
                        </label>
                        <Input
                          id="new-qa-title"
                          placeholder="Enter a title for this Q&A pair..."
                          value={newQATitle}
                          onChange={(e) => setNewQATitle(e.target.value)}
                          className="border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                          disabled={isAddingQA}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          A descriptive title helps identify this Q&A pair. If
                          left empty, a title will be generated from the
                          question.
                        </p>
                      </div>

                      <div className="mb-4">
                        <label
                          htmlFor="new-qa-description"
                          className="block text-xs font-medium text-gray-500 mb-1"
                        >
                          Description (optional)
                        </label>
                        <Input
                          id="new-qa-description"
                          placeholder="Enter a description for this Q&A pair..."
                          value={newQADescription}
                          onChange={(e) => setNewQADescription(e.target.value)}
                          className="border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                          disabled={isAddingQA}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Add additional context or notes about this Q&A pair.
                        </p>
                      </div>

                      <div className="mb-4">
                        <label
                          htmlFor="new-question"
                          className="block text-xs font-medium text-gray-500 mb-1"
                        >
                          Question
                        </label>
                        <Textarea
                          id="new-question"
                          placeholder="Enter your question here..."
                          value={newQuestion}
                          onChange={(e) => setNewQuestion(e.target.value)}
                          className="resize-y min-h-[80px] border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                          disabled={isAddingQA}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="new-answer"
                          className="block text-xs font-medium text-gray-500 mb-1"
                        >
                          Answer
                        </label>
                        <Textarea
                          id="new-answer"
                          placeholder="Enter the answer here..."
                          value={newAnswer}
                          onChange={(e) => setNewAnswer(e.target.value)}
                          className="resize-y min-h-[120px] border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                          disabled={isAddingQA}
                        />
                      </div>

                      <div className="mt-4 flex justify-end">
                        <Button
                          onClick={handleAddQA}
                          disabled={
                            isAddingQA ||
                            !newQuestion.trim() ||
                            !newAnswer.trim()
                          }
                          className="px-4 py-2"
                        >
                          {isAddingQA ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Q&A Pair
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {questions.length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">No Q&A pairs added yet.</p>
                      <p className="text-xs mt-1">
                        Add your first question and answer pair above.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MongoDB Tab */}
          <TabsContent value="mongodb" className="mt-0">
            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="border-b bg-gray-50/50">
                <CardTitle className="text-lg font-medium text-gray-800">
                  MongoDB
                </CardTitle>
                <CardDescription>
                  Connect to MongoDB to import collections as knowledge sources
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {!isMongoConnected ? (
                  <div className="space-y-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                      <h3 className="text-sm font-medium mb-3 text-gray-700 flex items-center">
                        <Database className="h-4 w-4 mr-2 text-primary" />
                        Connect to MongoDB
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor="mongo-uri"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Connection String
                          </label>
                          <Input
                            id="mongo-uri"
                            placeholder="mongodb://username:password@host:port"
                            value={mongoDbUri}
                            onChange={(e) => setMongoDbUri(e.target.value)}
                            disabled={isConnectingMongo}
                            className="border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            The MongoDB connection string including
                            authentication details.
                          </p>
                        </div>

                        <div>
                          <label
                            htmlFor="mongo-db"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Database Name
                          </label>
                          <Input
                            id="mongo-db"
                            placeholder="my_database"
                            value={mongoDbName}
                            onChange={(e) => setMongoDbName(e.target.value)}
                            disabled={isConnectingMongo}
                            className="border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            The name of the database you want to connect to.
                          </p>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            onClick={handleConnectMongoDB}
                            disabled={
                              isConnectingMongo ||
                              !mongoDbUri.trim() ||
                              !mongoDbName.trim()
                            }
                            className="px-4 py-2"
                          >
                            {isConnectingMongo ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              <>
                                <Database className="h-4 w-4 mr-2" />
                                Connect to MongoDB
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-md">
                      <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-700">
                        <p className="font-medium mb-1">Security Note</p>
                        <p>
                          Make sure your MongoDB instance is properly secured
                          and has appropriate access controls. We recommend
                          using a read-only user for this integration.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-700 flex items-center">
                          <Database className="h-4 w-4 mr-2 text-primary" />
                          Connected to {mongoDbName}
                        </h3>
                        <Badge
                          variant="outline"
                          className="text-xs bg-green-50 text-green-700 border-green-200"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Select the collections you want to import as knowledge
                        sources.
                      </p>

                      <div className="border border-gray-200 rounded-md divide-y divide-gray-200 mb-4">
                        {mongoCollections.map((collection) => (
                          <div
                            key={collection}
                            className="flex items-center p-3 hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              id={`collection-${collection}`}
                              checked={selectedCollections.includes(collection)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCollections([
                                    ...selectedCollections,
                                    collection,
                                  ]);
                                } else {
                                  setSelectedCollections(
                                    selectedCollections.filter(
                                      (c) => c !== collection
                                    )
                                  );
                                }
                              }}
                              className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <label
                              htmlFor={`collection-${collection}`}
                              className="ml-2 block text-sm text-gray-700"
                            >
                              {collection}
                            </label>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsMongoConnected(false);
                            setMongoCollections([]);
                            setSelectedCollections([]);
                          }}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Change Connection
                        </Button>

                        <Button
                          onClick={handleImportMongoCollections}
                          disabled={
                            isImportingMongo || selectedCollections.length === 0
                          }
                        >
                          {isImportingMongo ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Importing...
                            </>
                          ) : (
                            <>
                              <ArrowDown className="h-4 w-4 mr-2" />
                              Import Selected Collections
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-md">
                      <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-700">
                        Large collections may take some time to process. You'll
                        be notified when the import is complete.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Google Sheets Tab */}
          <TabsContent value="sheets" className="mt-0">
            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="border-b bg-gray-50/50">
                <CardTitle className="text-lg font-medium text-gray-800">
                  Google Sheets
                </CardTitle>
                <CardDescription>
                  Import data from Google Sheets as knowledge sources
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {!isSheetsConnected ? (
                  <div className="space-y-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                      <h3 className="text-sm font-medium mb-3 text-gray-700 flex items-center">
                        <Table className="h-4 w-4 mr-2 text-primary" />
                        Connect to Google Sheets
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor="sheets-url"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Google Sheets URL
                          </label>
                          <Input
                            id="sheets-url"
                            placeholder="https://docs.google.com/spreadsheets/d/..."
                            value={sheetsUrl}
                            onChange={(e) => setSheetsUrl(e.target.value)}
                            disabled={isConnectingSheets}
                            className="border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            The URL of the Google Sheets document you want to
                            import.
                          </p>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            onClick={handleConnectGoogleSheets}
                            disabled={isConnectingSheets || !sheetsUrl.trim()}
                            className="px-4 py-2"
                          >
                            {isConnectingSheets ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              <>
                                <Table className="h-4 w-4 mr-2" />
                                Connect to Google Sheets
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-md">
                      <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-700">
                        <p className="font-medium mb-1">Sharing Settings</p>
                        <p>
                          Make sure your Google Sheets document is shared with
                          the appropriate permissions. The document should be
                          set to "Anyone with the link can view".
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-700 flex items-center">
                          <Table className="h-4 w-4 mr-2 text-primary" />
                          Connected to Google Sheets
                        </h3>
                        <Badge
                          variant="outline"
                          className="text-xs bg-green-50 text-green-700 border-green-200"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Select the sheets you want to import as knowledge
                        sources.
                      </p>

                      <div className="border border-gray-200 rounded-md divide-y divide-gray-200 mb-4">
                        {sheetsList.map((sheet) => (
                          <div
                            key={sheet.id}
                            className="flex items-center p-3 hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              id={`sheet-${sheet.id}`}
                              checked={selectedSheets.includes(sheet.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSheets([
                                    ...selectedSheets,
                                    sheet.id,
                                  ]);
                                } else {
                                  setSelectedSheets(
                                    selectedSheets.filter(
                                      (id) => id !== sheet.id
                                    )
                                  );
                                }
                              }}
                              className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <label
                              htmlFor={`sheet-${sheet.id}`}
                              className="ml-2 block text-sm text-gray-700"
                            >
                              {sheet.name}
                            </label>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsSheetsConnected(false);
                            setSheetsList([]);
                            setSelectedSheets([]);
                          }}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Change Connection
                        </Button>

                        <Button
                          onClick={handleImportGoogleSheets}
                          disabled={
                            isImportingSheets || selectedSheets.length === 0
                          }
                        >
                          {isImportingSheets ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Importing...
                            </>
                          ) : (
                            <>
                              <ArrowDown className="h-4 w-4 mr-2" />
                              Import Selected Sheets
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-md">
                      <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-700">
                        The first row of each sheet will be used as column
                        headers. Make sure your data is properly formatted.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notion Tab (placeholder) */}
          <TabsContent value="notion" className="mt-0">
            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="border-b bg-gray-50/50">
                <CardTitle className="text-lg font-medium text-gray-800">
                  Notion
                </CardTitle>
                <CardDescription>
                  Connect your Notion workspace to import content
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <FileText className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium mb-3 text-gray-800">
                    Connect to Notion
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-md">
                    Import your Notion pages and databases as knowledge sources
                    for your chatbot. Connect your workspace to get started.
                  </p>
                  <Button className="px-6 py-2 gap-2">
                    <FileText className="h-5 w-5" />
                    Connect Notion Account
                  </Button>
                  <p className="text-xs text-gray-400 mt-6">
                    You'll be redirected to Notion to authorize access to your
                    workspace.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="mt-0">
            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="border-b bg-gray-50/50">
                <CardTitle className="text-lg font-medium text-gray-800">
                  Products
                </CardTitle>
                <CardDescription>
                  Manage products that your chatbot can recommend to users
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {id && <ChatbotProductsSection chatbotId={id} />}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        {/* File View Dialog */}
        <ViewFileDialog
          open={isFileDialogOpen}
          onOpenChange={setIsFileDialogOpen}
          file={selectedFile}
          onDelete={handleDeleteFile}
        />

        {/* Text View Dialog */}
        <ViewTextDialog
          open={isTextDialogOpen}
          onOpenChange={setIsTextDialogOpen}
          text={selectedText}
          onDelete={handleDeleteTextSource}
          onUpdate={handleUpdateText}
        />
      </div>
    </div>
  );
};

export default Sources;
