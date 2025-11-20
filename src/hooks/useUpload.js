import { useState, useCallback, useRef } from 'react';

// Construire l'URL de base sans slash final
const getApiUrl = () => {
  const baseUrl = process.env.REACT_APP_API_URL || 'https://sensational-naiad-e44c75.netlify.app';
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

const API_URL = getApiUrl();
// Utiliser l'endpoint Netlify Functions comme dans api.js
const UPLOAD_ENDPOINT = `${API_URL}/.netlify/functions/upload`;
const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
const MAX_RETRIES = 3;
const MAX_CONCURRENT_UPLOADS = 3;

export const useUpload = () => {
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle' | 'uploading' | 'completed' | 'error'
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadSpeed, setUploadSpeed] = useState({});
  const [timeRemaining, setTimeRemaining] = useState({});
  const [currentUploads, setCurrentUploads] = useState([]);
  const abortControllersRef = useRef({});

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const calculateSpeed = (loaded, startTime) => {
    const elapsed = (Date.now() - startTime) / 1000; // seconds
    return elapsed > 0 ? loaded / elapsed : 0;
  };

  const calculateTimeRemaining = (loaded, total, speed) => {
    if (speed === 0) return null;
    const remaining = total - loaded;
    const seconds = remaining / speed;
    return seconds;
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds === Infinity) return '--';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const uploadChunked = async (file, onProgress, retryCount = 0) => {
    const fileId = `${file.name}-${file.size}-${file.lastModified}`;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    
    try {
      // Initialize upload
      const initResponse = await fetch(`${API_URL}/.netlify/functions/upload/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          totalChunks,
        }),
      });

      if (!initResponse.ok) {
        throw new Error('Failed to initialize upload');
      }

      const { uploadId } = await initResponse.json();

      // Upload chunks
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('uploadId', uploadId);
        formData.append('chunkIndex', chunkIndex);
        formData.append('totalChunks', totalChunks);
        formData.append('fileName', file.name);

        const chunkResponse = await fetch(`${API_URL}/.netlify/functions/upload/chunk`, {
          method: 'POST',
          body: formData,
        });

        if (!chunkResponse.ok) {
          throw new Error(`Failed to upload chunk ${chunkIndex}`);
        }

        const loaded = end;
        const progress = (loaded / file.size) * 100;
        onProgress(progress, loaded, file.size);
      }

      // Finalize upload
      const finalizeResponse = await fetch(`${API_URL}/.netlify/functions/upload/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uploadId, fileName: file.name }),
      });

      if (!finalizeResponse.ok) {
        throw new Error('Failed to finalize upload');
      }

      return await finalizeResponse.json();
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying upload for ${file.name} (attempt ${retryCount + 1})`);
        return uploadChunked(file, onProgress, retryCount + 1);
      }
      throw error;
    }
  };

  const uploadFile = async (file, projectId, userEmail, chapter, chapterStyle, onProgress) => {
    const fileId = `${file.name}-${file.size}-${file.lastModified}`;
    const startTime = Date.now();
    const abortController = new AbortController();
    abortControllersRef.current[fileId] = abortController;

    try {
      // Use chunked upload for files > 100MB
      if (file.size > 100 * 1024 * 1024) {
        return await uploadChunked(file, (progress, loaded, total) => {
          const speed = calculateSpeed(loaded, startTime);
          const remaining = calculateTimeRemaining(loaded, total, speed);
          
          setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
          setUploadSpeed(prev => ({ ...prev, [fileId]: speed }));
          setTimeRemaining(prev => ({ ...prev, [fileId]: remaining }));
          
          if (onProgress) onProgress(progress, loaded, total, speed, remaining);
        });
      }

      // Standard upload for smaller files
      const formData = new FormData();
      formData.append('media', file);
      formData.append('projectId', projectId);
      formData.append('userEmail', userEmail);
      formData.append('chapter', chapter);
      if (chapterStyle) {
        formData.append('chapterStyle', JSON.stringify(chapterStyle));
      }

      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            const speed = calculateSpeed(e.loaded, startTime);
            const remaining = calculateTimeRemaining(e.loaded, e.total, speed);

            setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
            setUploadSpeed(prev => ({ ...prev, [fileId]: speed }));
            setTimeRemaining(prev => ({ ...prev, [fileId]: remaining }));

            if (onProgress) onProgress(progress, e.loaded, e.total, speed, remaining);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              let response;
              const responseText = xhr.responseText;
              if (!responseText || responseText.trim() === '') {
                reject(new Error('Réponse vide du serveur'));
                return;
              }
              try {
                response = JSON.parse(responseText);
              } catch (parseError) {
                console.error('Erreur parsing JSON:', responseText);
                reject(new Error(`Réponse invalide du serveur: ${responseText.substring(0, 100)}`));
                return;
              }
              
              // Gérer différents formats de réponse
              if (response.files && response.files.length > 0) {
                resolve(response);
              } else if (response.file) {
                resolve({ files: [response.file] });
              } else if (response.cloudinaryUrl || response.url) {
                resolve({
                  files: [{
                    cloudinaryUrl: response.cloudinaryUrl || response.url,
                    publicId: response.publicId,
                    originalName: file.name
                  }]
                });
              } else if (response.success) {
                resolve(response);
              } else {
                reject(new Error('Format de réponse inattendu du serveur'));
              }
            } catch (error) {
              reject(new Error(`Erreur lors du traitement de la réponse: ${error.message}`));
            }
          } else {
            // Erreur HTTP
            let errorMessage = `Upload failed with status ${xhr.status}`;
            try {
              const errorData = JSON.parse(xhr.responseText);
              errorMessage = errorData.error || errorData.message || errorMessage;
            } catch (e) {
              if (xhr.responseText) {
                errorMessage = xhr.responseText.substring(0, 200);
              }
            }
            reject(new Error(errorMessage));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Erreur réseau lors de l\'upload'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload annulé'));
        });

        console.log('📤 [useUpload] Upload vers:', UPLOAD_ENDPOINT);
        console.log('📦 [useUpload] Fichier:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        xhr.open('POST', UPLOAD_ENDPOINT);
        // Ne pas mettre de Content-Type header, le navigateur le fait automatiquement pour FormData
        xhr.send(formData);

        abortController.signal.addEventListener('abort', () => {
          xhr.abort();
        });
      });
    } catch (error) {
      throw error;
    } finally {
      delete abortControllersRef.current[fileId];
    }
  };

  const uploadFiles = useCallback(async (files, projectId, userEmail, chapter, chapterStyle, onComplete) => {
    const fileArray = Array.from(files);
    setUploadStatus('uploading');
    setCurrentUploads(fileArray.map(f => ({
      id: `${f.name}-${f.size}-${f.lastModified}`,
      file: f,
      status: 'pending',
    })));

    const uploadQueue = [...fileArray];
    const activeUploads = new Set();
    const results = [];
    const errors = [];

    const processQueue = async () => {
      while (uploadQueue.length > 0 || activeUploads.size > 0) {
        // Start new uploads if we have capacity
        while (activeUploads.size < MAX_CONCURRENT_UPLOADS && uploadQueue.length > 0) {
          const file = uploadQueue.shift();
          const fileId = `${file.name}-${file.size}-${file.lastModified}`;
          activeUploads.add(fileId);

          uploadFile(file, projectId, userEmail, chapter, chapterStyle, (progress, loaded, total, speed, remaining) => {
            // Progress updates handled by state
          })
            .then((result) => {
              results.push({ file, result });
              setCurrentUploads(prev => prev.map(upload =>
                upload.id === fileId
                  ? { ...upload, status: 'completed', result }
                  : upload
              ));
            })
            .catch((error) => {
              errors.push({ file, error });
              setCurrentUploads(prev => prev.map(upload =>
                upload.id === fileId
                  ? { ...upload, status: 'error', error: error.message }
                  : upload
              ));
            })
            .finally(() => {
              activeUploads.delete(fileId);
            });
        }

        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    };

    await processQueue();

    setUploadStatus(results.length > 0 ? 'completed' : 'error');
    
    // Call onComplete with results and errors
    if (onComplete) {
      onComplete(results, errors);
    }

    return { results, errors };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancelUpload = useCallback((fileId) => {
    if (abortControllersRef.current[fileId]) {
      abortControllersRef.current[fileId].abort();
      delete abortControllersRef.current[fileId];
    }
  }, []);

  const cancelAllUploads = useCallback(() => {
    Object.keys(abortControllersRef.current).forEach(fileId => {
      cancelUpload(fileId);
    });
    setUploadStatus('idle');
    setCurrentUploads([]);
    setUploadProgress({});
    setUploadSpeed({});
    setTimeRemaining({});
  }, [cancelUpload]);

  const resetUpload = useCallback(() => {
    setUploadStatus('idle');
    setCurrentUploads([]);
    setUploadProgress({});
    setUploadSpeed({});
    setTimeRemaining({});
  }, []);

  return {
    uploadStatus,
    uploadProgress,
    uploadSpeed,
    timeRemaining,
    currentUploads,
    uploadFiles,
    cancelUpload,
    cancelAllUploads,
    resetUpload,
    formatFileSize,
    formatTime,
  };
};

