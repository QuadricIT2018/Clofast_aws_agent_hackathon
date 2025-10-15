import { useEffect, useState } from "react";
import {
  FileText,
  File,
  FileSpreadsheet,
  X,
  Eye,
  Download,
  Database,
  CheckSquare,
  Square,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { getDocumentsByProfile } from "../../api/documentAPI";
import { extractDocumentData } from "../../api/extractionAPI";
import { showErrorToast, showSuccessToast } from "../../utils/toast";
import { useReconciliation } from "../../hooks/useReconciliation";
import { type DocumentData, type DocumentFile } from "../../types/profileTypes";
// Types

interface Profile {
  _id: string;
  profileName: string;
  profileDescription: string;
  numberOfDocuments: number;
  numberOfUnReconciledDocuments: number;
  numberOfReconciledDocuments: number;
  numberOfDiscrepancyDocuments: number;
}

interface DataSourcesProps {
  profile: Profile;
  onReconciliationStateChange?: (enabled: boolean) => void;
}

const DataSources = ({
  profile,
  onReconciliationStateChange,
}: DataSourcesProps) => {
  const [activeTab, setActiveTab] = useState<"dataSources" | "documents">(
    "dataSources"
  );
  const { selectedDocuments, setSelectedDocuments } = useReconciliation();
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDataSources, setSelectedDataSources] = useState<Set<string>>(
    new Set()
  );
  const [viewingDataSource, setViewingDataSource] =
    useState<DocumentData | null>(null);
  const [viewingDocument, setViewingDocument] = useState<DocumentData | null>(
    null
  );

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        if (!profile?._id) return;
        const docs = await getDocumentsByProfile(profile._id);
        setDocuments(docs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [profile]);

  useEffect(() => {
    // Notify parent component when exactly 2 data sources are selected
    const canReconcile = selectedDataSources.size === 2;
    onReconciliationStateChange?.(canReconcile);
  }, [selectedDataSources, onReconciliationStateChange]);

  const dataSourceDocuments = documents.filter(
    (doc) => doc.dataSource && Object.keys(doc.dataSource).length > 0
  );
  const allDocuments = documents;

  const getFileIcon = (mimetype?: string) => {
    if (!mimetype) return <File className="w-5 h-5" />;

    if (mimetype.includes("pdf")) return <FileText className="w-5 h-5" />;
    if (
      mimetype.includes("spreadsheet") ||
      mimetype.includes("excel") ||
      mimetype.includes("csv")
    )
      return <FileSpreadsheet className="w-5 h-5" />;
    if (mimetype.includes("word") || mimetype.includes("document"))
      return <FileText className="w-5 h-5" />;

    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

 const toggleDataSourceSelection = (docId: string) => {
   setSelectedDataSources((prev) => {
     const newSet = new Set(prev);
     if (newSet.has(docId)) newSet.delete(docId);
     else if (newSet.size < 2) newSet.add(docId);

     const selectedDocs = documents.filter((doc) => newSet.has(doc._id));
     setSelectedDocuments(selectedDocs);
     return newSet;
   });
 };


  const handleExtract = async (doc: DocumentData) => {
    try {
      const result = await extractDocumentData(doc._id);
      showSuccessToast("Document data extracted and saved successfully!");
      console.log("Extraction complete:", result);
    } catch (error) {
      showErrorToast(
        "Failed to extract data from the document. Please try again."
      );
      console.error("Extraction failed:", error);
    }
  };

  useEffect(() => {
    // When documents are fetched or context changes, sync the local state
    if (documents.length > 0 && selectedDocuments.length > 0) {
      const syncedSet = new Set(selectedDocuments.map((doc) => doc._id));
      setSelectedDataSources(syncedSet);
    }
  }, [documents, selectedDocuments]);


  return (
    <div className="w-full">
      {/* Floating Tab Switcher */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-bg-light dark:bg-d-bg-light rounded-xl p-1 border border-border dark:border-d-border shadow-sm">
          <button
            onClick={() => setActiveTab("dataSources")}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
              activeTab === "dataSources"
                ? "bg-bg-button dark:bg-d-bg-button text-text-inverted dark:text-d-text-inverted shadow-sm"
                : "text-text-secondary dark:text-d-text-secondary hover:text-text-primary dark:hover:text-d-text-primary"
            }`}
          >
            Data Sources
            {dataSourceDocuments.length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-bg text-text-secondary">
                {dataSourceDocuments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
              activeTab === "documents"
                ? "bg-bg-button dark:bg-d-bg-button text-text-inverted dark:text-d-text-inverted shadow-sm"
                : "text-text-secondary dark:text-d-text-secondary hover:text-text-primary dark:hover:text-d-text-primary"
            }`}
          >
            Documents
            {allDocuments.length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-bg text-text-secondary">
                {allDocuments.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Reconciliation Info Banner */}
      {activeTab === "dataSources" && dataSourceDocuments.length >= 2 && (
        <div
          className={`mb-6 p-4 rounded-lg border transition-all duration-200 ${
            selectedDataSources.size === 2
              ? "bg-success/10 border-success dark:border-success/50"
              : "bg-info/10 border-info dark:border-info/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <AlertCircle
              className={`w-5 h-5 ${
                selectedDataSources.size === 2 ? "text-success" : "text-info"
              }`}
            />
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  selectedDataSources.size === 2
                    ? "text-success dark:text-success"
                    : "text-info dark:text-info"
                }`}
              >
                {selectedDataSources.size === 2
                  ? "✓ Two data sources selected - Reconciliation enabled"
                  : `Select ${2 - selectedDataSources.size} more data source${
                      selectedDataSources.size === 1 ? "" : "s"
                    } to enable reconciliation`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="bg-bg-light dark:bg-d-bg-light border border-border dark:border-d-border rounded-xl p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary dark:border-d-primary"></div>
          </div>
        ) : (
          <>
            {/* Data Sources Tab */}
            {activeTab === "dataSources" && (
              <>
                {dataSourceDocuments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Database className="w-16 h-16 text-text-tertiary dark:text-d-text-tertiary mb-4" />
                    <h3 className="text-lg font-semibold text-text-primary dark:text-d-text-primary mb-2">
                      No data sources available yet
                    </h3>
                    <p className="text-text-secondary dark:text-d-text-secondary max-w-md">
                      Extract data from your documents to create data sources
                      that can be used for reconciliation.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dataSourceDocuments.map((doc) => {
                      const isSelected = selectedDataSources.has(doc._id);
                      const canSelect =
                        selectedDataSources.size < 2 || isSelected;

                      return (
                        <div
                          key={doc._id}
                          className={`group relative bg-bg dark:bg-d-bg rounded-xl p-5 border transition-all duration-200 hover:shadow-md ${
                            isSelected
                              ? "border-primary dark:border-d-primary ring-2 ring-primary/20 dark:ring-d-primary/20"
                              : "border-border dark:border-d-border hover:border-text-tertiary dark:hover:border-d-text-tertiary"
                          }`}
                        >
                          {/* Selection Checkbox */}
                          <button
                            onClick={() => toggleDataSourceSelection(doc._id)}
                            disabled={!canSelect}
                            className={`absolute top-4 right-4 transition-opacity ${
                              canSelect
                                ? "opacity-100"
                                : "opacity-30 cursor-not-allowed"
                            }`}
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-primary dark:text-d-primary" />
                            ) : (
                              <Square className="w-5 h-5 text-text-tertiary dark:text-d-text-tertiary hover:text-primary dark:hover:text-d-primary" />
                            )}
                          </button>

                          <div className="flex items-start gap-3 mb-4 pr-8">
                            <div className="p-2 bg-primary/10 dark:bg-d-primary/10 rounded-lg text-primary dark:text-d-primary">
                              <Database className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-text-primary dark:text-d-text-primary truncate">
                                {doc.documentName}
                              </h4>
                              <p className="text-sm text-text-secondary dark:text-d-text-secondary mt-1">
                                {doc.dataSource?.headers &&
                                Array.isArray(doc.dataSource.headers)
                                  ? `${doc.dataSource.headers.length} columns`
                                  : "Data extracted"}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => setViewingDataSource(doc)}
                            className="w-full px-4 py-2 bg-bg-button dark:bg-d-bg-button text-text-inverted dark:text-d-text-inverted rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            View Data
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Documents Tab */}
            {activeTab === "documents" && (
              <>
                {allDocuments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <FileText className="w-16 h-16 text-text-tertiary dark:text-d-text-tertiary mb-4" />
                    <h3 className="text-lg font-semibold text-text-primary dark:text-d-text-primary mb-2">
                      No documents found
                    </h3>
                    <p className="text-text-secondary dark:text-d-text-secondary max-w-md">
                      Upload documents to {profile.profileName} to get started.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allDocuments.map((doc) => {
                      const hasDataSource =
                        doc.dataSource &&
                        Object.keys(doc.dataSource).length > 0;
                      const fileInfo = doc.file as DocumentFile | undefined;

                      return (
                        <div
                          key={doc._id}
                          className="group bg-bg dark:bg-d-bg rounded-xl p-5 border border-border dark:border-d-border hover:border-text-tertiary dark:hover:border-d-text-tertiary hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-start gap-3 mb-4">
                            <div className="p-2 bg-bg-light dark:bg-d-bg-light rounded-lg text-text-secondary dark:text-d-text-secondary">
                              {getFileIcon(fileInfo?.mimetype)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-text-primary dark:text-d-text-primary truncate">
                                {doc.documentName}
                              </h4>
                              {fileInfo && (
                                <p className="text-sm text-text-secondary dark:text-d-text-secondary mt-1">
                                  {formatFileSize(fileInfo.size)}
                                </p>
                              )}

                              {/* ✅ Extraction Status */}
                              <div className="mt-2">
                                {hasDataSource ? (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/30">
                                    <CheckCircle className="w-3 h-3" />
                                    Extracted
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/30">
                                    <AlertTriangle className="w-3 h-3" />
                                    Not Extracted
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => setViewingDocument(doc)}
                              className="flex-1 px-3 py-2 bg-bg-light dark:bg-d-bg-light border border-border dark:border-d-border text-text-primary dark:text-d-text-primary rounded-lg hover:bg-bg-dark dark:hover:bg-d-bg-dark transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>

                            {!hasDataSource && (
                              <button
                                onClick={() => handleExtract(doc)}
                                className="flex-1 px-3 py-2 bg-primary dark:bg-d-primary text-text-inverted dark:text-d-text-inverted rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm font-medium"
                              >
                                <Download className="w-4 h-4" />
                                Extract
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Data Source Viewer Modal */}
      {viewingDataSource && (
        <div className="fixed inset-0 bg-bg-navbar/80 dark:bg-d-bg-navbar/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-light dark:bg-d-bg-light rounded-xl border border-border dark:border-d-border shadow-2xl max-w-6xl w-full max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border dark:border-d-border">
              <div>
                <h3 className="text-xl font-semibold text-text-primary dark:text-d-text-primary">
                  {viewingDataSource.documentName}
                </h3>
                <p className="text-sm text-text-secondary dark:text-d-text-secondary mt-1">
                  Data Source View
                </p>
              </div>
              <button
                onClick={() => setViewingDataSource(null)}
                className="p-2 hover:bg-bg dark:hover:bg-d-bg rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-secondary dark:text-d-text-secondary" />
              </button>
            </div>

            {/* Spreadsheet View */}
            {/* Spreadsheet View */}
            <div className="flex-1 overflow-auto p-6">
              {viewingDataSource.dataSource && (
                <div className="overflow-x-auto">
                  {Array.isArray(viewingDataSource.dataSource) ? (
                    // Handle array of objects (your actual data format)
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          {viewingDataSource.dataSource.length > 0 &&
                            Object.keys(viewingDataSource.dataSource[0]).map(
                              (header, idx) => (
                                <th
                                  key={idx}
                                  className="px-4 py-3 text-left text-sm font-semibold text-text-primary dark:text-d-text-primary bg-bg dark:bg-d-bg border border-border dark:border-d-border sticky top-0 whitespace-nowrap"
                                >
                                  {header}
                                </th>
                              )
                            )}
                        </tr>
                      </thead>
                      <tbody>
                        {viewingDataSource.dataSource.map(
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          (row: any, rowIdx: number) => (
                            <tr
                              key={rowIdx}
                              className="hover:bg-bg/50 dark:hover:bg-d-bg/50 transition-colors"
                            >
                              {Object.values(row).map(
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                (cell: any, cellIdx: number) => (
                                  <td
                                    key={cellIdx}
                                    className="px-4 py-3 text-sm text-text-secondary dark:text-d-text-secondary border border-border dark:border-d-border whitespace-nowrap"
                                  >
                                    {cell !== null && cell !== undefined
                                      ? String(cell)
                                      : "-"}
                                  </td>
                                )
                              )}
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  ) : (
                    // Fallback for headers/rows format
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          {(
                            viewingDataSource.dataSource.headers as string[]
                          )?.map((header, idx) => (
                            <th
                              key={idx}
                              className="px-4 py-3 text-left text-sm font-semibold text-text-primary dark:text-d-text-primary bg-bg dark:bg-d-bg border border-border dark:border-d-border sticky top-0"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
                        {(viewingDataSource.dataSource.rows as any[][])?.map(
                          (row, rowIdx) => (
                            <tr
                              key={rowIdx}
                              className="hover:bg-bg/50 dark:hover:bg-d-bg/50 transition-colors"
                            >
                              {row.map((cell, cellIdx) => (
                                <td
                                  key={cellIdx}
                                  className="px-4 py-3 text-sm text-text-secondary dark:text-d-text-secondary border border-border dark:border-d-border"
                                >
                                  {String(cell)}
                                </td>
                              ))}
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 bg-bg-navbar/80 dark:bg-d-bg-navbar/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-light dark:bg-d-bg-light rounded-xl border border-border dark:border-d-border shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border dark:border-d-border">
              <div>
                <h3 className="text-xl font-semibold text-text-primary dark:text-d-text-primary">
                  {viewingDocument.documentName}
                </h3>
                <p className="text-sm text-text-secondary dark:text-d-text-secondary mt-1">
                  Document Preview
                </p>
              </div>
              <button
                onClick={() => setViewingDocument(null)}
                className="p-2 hover:bg-bg dark:hover:bg-d-bg rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-secondary dark:text-d-text-secondary" />
              </button>
            </div>

            {/* Document Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="p-6 bg-bg dark:bg-d-bg rounded-lg mb-4">
                  {getFileIcon(
                    (viewingDocument.file as DocumentFile)?.mimetype
                  )}
                </div>
                <h4 className="text-lg font-medium text-text-primary dark:text-d-text-primary mb-2">
                  Document Preview
                </h4>
                <p className="text-text-secondary dark:text-d-text-secondary mb-4">
                  Preview functionality will be implemented based on file type
                </p>
                <a
                  href={viewingDocument.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-primary dark:bg-d-primary text-text-inverted dark:text-d-text-inverted rounded-lg hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Open Document
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSources;
