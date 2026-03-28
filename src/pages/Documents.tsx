import React, { useState, useRef } from "react";
import { useStore } from "../store/StoreContext";
import { DocumentItem } from "../types";
import { Search, FileText, Download, Trash2, Plus, Paperclip, FolderOpen, FileArchive } from "lucide-react";
import { cn } from "../lib/utils";
import { v4 as uuidv4 } from "uuid";
import { useTranslation } from "../hooks/useTranslation";

export default function Documents() {
  const { data, addDocument, deleteDocument, uploadFile } = useStore();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"templates" | "others">("templates");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = async (url: string, fileName: string) => {
    console.log('Attempting download:', { url, fileName });
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download error, falling back to new tab:', error);
      window.open(url, '_blank');
    }
  };

  const filteredDocuments = (data.documents || []).filter(
    (doc) => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === "templates" ? !doc.clientId : !!doc.clientId;
      return matchesSearch && matchesTab;
    }
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const publicUrl = await uploadFile(file);
      setIsUploading(false);

      if (publicUrl) {
        const newDoc: DocumentItem = {
          id: uuidv4(),
          name: file.name,
          url: publicUrl,
          type: file.type || "application/octet-stream",
          size: file.size,
          createdAt: new Date().toISOString()
        };
        addDocument(newDoc);
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t("documents")}</h1>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full sm:w-auto bg-primary-gradient text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg flex items-center justify-center space-x-1.5 md:space-x-2 hover:opacity-90 transition-all shadow-md shadow-blue-200 text-xs md:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          <span>{isUploading ? t("uploading") : t("addDocument")}</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
          <button
            className={cn("px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center", activeTab === "templates" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300")}
            onClick={() => setActiveTab("templates")}
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Modèles & Templates
          </button>
          <button
            className={cn("px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center", activeTab === "others" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300")}
            onClick={() => setActiveTab("others")}
          >
            <FileArchive className="w-4 h-4 mr-2" />
            Autres Documents
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t("searchDocumentPlaceholder")}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col hover:border-primary transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-3 bg-blue-50 rounded-lg text-primary">
                    <FileText className="w-8 h-8" />
                  </div>
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title={t("delete")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-medium text-gray-900 truncate mb-1" title={doc.name}>
                  {doc.name}
                </h3>
                <div className="flex justify-between items-center mt-auto pt-3">
                  <span className="text-xs text-gray-500">
                    {doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : t("unknownSize")}
                  </span>
                  {doc.clientId && (
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      Client
                    </span>
                  )}
                  <button
                    onClick={() => handleDownload(doc.url, doc.name)}
                    className="text-primary hover:text-primary-dark text-sm font-medium flex items-center space-x-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t("download")}</span>
                  </button>
                </div>
              </div>
            ))}
            {filteredDocuments.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                {t("noDocumentsFound")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
