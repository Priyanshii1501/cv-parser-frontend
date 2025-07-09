import React, { useCallback, useState } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadedFile {
  id: string;
  file: File;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  parsedData?: any;
  errorMessage?: string;
}

const FileUpload: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const acceptedTypes = ['.pdf', '.doc', '.docx'];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const validateFile = (file: File): boolean => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      alert(`File type not supported. Please upload ${acceptedTypes.join(', ')} files only.`);
      return false;
    }
    if (file.size > maxFileSize) {
      alert('File size too large. Please upload files smaller than 10MB.');
      return false;
    }
    return true;
  };

  const uploadToBackend = async (fileId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file); // rename to "file", matching FastAPI parameter

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setFiles(prev => prev.map(f =>
            f.id === fileId ? { ...f, progress } : f
          ));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            setFiles(prev => prev.map(f =>
              f.id === fileId ? {
                ...f,
                status: 'success',
                progress: 100,
                parsedData: response // directly JSON object
              } : f
            ));
          } catch {
            setFiles(prev => prev.map(f =>
              f.id === fileId ? {
                ...f,
                status: 'error',
                errorMessage: 'Failed to parse server response'
              } : f
            ));
          }
        } else {
          setFiles(prev => prev.map(f =>
            f.id === fileId ? {
              ...f,
              status: 'error',
              errorMessage: `Upload failed: ${xhr.statusText}`
            } : f
          ));
        }
      });

      xhr.addEventListener('error', () => {
        setFiles(prev => prev.map(f =>
          f.id === fileId ? {
            ...f,
            status: 'error',
            errorMessage: 'Network error occurred'
          } : f
        ));
      });

      xhr.open(
        "POST",
        "https://cv-parser-backend-q0mn.onrender.com/parse_resume/"
      );
      xhr.send(formData);

    } catch {
      setFiles(prev => prev.map(f =>
        f.id === fileId ? {
          ...f,
          status: 'error',
          errorMessage: 'Upload failed'
        } : f
      ));
    }
  };


  const handleFiles = (fileList: FileList) => {
    const validFiles = Array.from(fileList).filter(validateFile);
    
    const newFiles: UploadedFile[] = validFiles.map(file => ({
      id: Date.now() + Math.random().toString(),
      file,
      status: 'uploading',
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Upload each file to backend
    newFiles.forEach(uploadedFile => {
      uploadToBackend(uploadedFile.id, uploadedFile.file);
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          isDragOver
            ? 'border-blue-400 bg-blue-50 scale-105'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-4">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
            isDragOver ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            <Upload className={`w-8 h-8 ${isDragOver ? 'text-blue-600' : 'text-gray-600'}`} />
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Drop your resume files here
            </h3>
            <p className="text-gray-600 mb-4">
              or <span className="text-blue-600 font-medium">browse</span> to choose files
            </p>
          </div>
          
          <div className="text-sm text-gray-500">
            <p>Supported formats: PDF, DOC, DOCX</p>
            <p>Maximum file size: 10MB</p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-8 space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">Uploaded Files</h4>
          
          <div className="space-y-3">
            {files.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${
                      uploadedFile.status === 'success' ? 'bg-green-100' :
                      uploadedFile.status === 'error' ? 'bg-red-100' : 'bg-blue-100'
                    }`}>
                      {uploadedFile.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : uploadedFile.status === 'error' ? (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <File className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {uploadedFile.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(uploadedFile.file.size)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {uploadedFile.status === 'uploading' && (
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadedFile.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-10">
                          {Math.round(uploadedFile.progress)}%
                        </span>
                      </div>
                    )}
                    
                    {uploadedFile.status === 'success' && (
                      <span className="text-xs text-green-600 font-medium">Parsed</span>
                    )}
                    
                    {uploadedFile.status === 'error' && (
                      <span className="text-xs text-red-600 font-medium">Failed</span>
                    )}
                    
                    <button
                      onClick={() => removeFile(uploadedFile.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Show parsed data for successful uploads */}
                {uploadedFile.status === 'success' && uploadedFile.parsedData && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <h5 className="text-sm font-medium text-green-800 mb-2">Parsed Information:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div><span className="font-medium">Name:</span> {uploadedFile.parsedData.name}</div>
                      <div><span className="font-medium">Email:</span> {uploadedFile.parsedData.email}</div>
                      <div><span className="font-medium">Phone:</span> {uploadedFile.parsedData.phone}</div>
                      <div><span className="font-medium">Job Title:</span> {uploadedFile.parsedData.job_title}</div>
                    </div>
                    {uploadedFile.parsedData.skills && (
                      <div className="mt-2">
                        <span className="font-medium text-xs">Skills:</span>
                        <p className="text-xs text-gray-600 mt-1">{uploadedFile.parsedData.skills}</p>
                      </div>
                    )}
                    {uploadedFile.parsedData.experience && (
                      <div className="mt-2">
                        <span className="font-medium text-xs">Experience:</span>
                        <p className="text-xs text-gray-600 mt-1">{uploadedFile.parsedData.experience}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Show error message for failed uploads */}
                {uploadedFile.status === 'error' && uploadedFile.errorMessage && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-800">
                      <span className="font-medium">Error:</span> {uploadedFile.errorMessage}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;