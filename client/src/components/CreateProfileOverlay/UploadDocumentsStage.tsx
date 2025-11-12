import { useProfileCreation } from "../../context/ProfileCreationContext";
import { useState } from "react";
import { type DocumentData } from "../../types/profileTypes";
import { Upload, File, Trash } from "lucide-react";

const UploadDocumentsStage: React.FC<{
  onNext: () => void;
  onBack: () => void;
}> = ({ onNext, onBack }) => {
  const { data, updateData } = useProfileCreation();
  const [documents, setDocuments] = useState<DocumentData[]>(data.documents);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    const newDocs: DocumentData[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      await new Promise((resolve) => setTimeout(resolve, 500));
      const mockDoc: DocumentData = {
        _id: `doc_${Date.now()}_${i}`,
        documentName: file.name,
        documentUrl: `https://s3.example.com/${file.name}`,
        file: file,
      };
      newDocs.push(mockDoc);
    }

    setDocuments([...documents, ...newDocs]);
    setUploading(false);
  };

  const handleDelete = (id: string) => {
    setDocuments(documents.filter((doc) => doc._id !== id));
  };

  const handleNext = () => {
    if (documents.length === 0) {
      alert("Please upload at least one document");
      return;
    }
    updateData({ documents });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Upload Documents
        </h2>
        <p className="text-text-secondary">
          Upload the documents you want to reconcile
        </p>
      </div>

      <div className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-bg hover:bg-bg-dark transition-colors">
        <Upload className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
        <p className="text-text-primary font-medium mb-2">
          Drag and drop files here
        </p>
        <p className="text-text-tertiary text-sm mb-4">or click to browse</p>
        <label className="inline-block px-6 py-2 bg-primary text-text-inverted rounded-lg cursor-pointer hover:opacity-90 transition-opacity">
          Choose Files
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.csv,.xlsx,.xls"
          />
        </label>
      </div>

      {uploading && (
        <div className="text-center py-4">
          <div className="inline-block w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary text-sm mt-2">Uploading...</p>
        </div>
      )}

      {documents.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-text-primary">
            Uploaded Documents ({documents.length})
          </h3>
          {documents.map((doc) => (
            <div
              key={doc._id}
              className="flex items-center justify-between p-4 bg-bg-light border border-border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <File className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-text-primary font-medium">
                    {doc.documentName}
                  </p>
                  <p className="text-text-tertiary text-xs">Ready to process</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(doc._id)}
                className="p-2 text-danger hover:text-danger/70 rounded-lg transition-colors"
              >
                <Trash className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-bg border border-border text-text-primary rounded-xl font-semibold hover:bg-bg-dark transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-bg-button text-text-inverted rounded-xl font-semibold hover:opacity-90 transition-opacity"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default UploadDocumentsStage;
