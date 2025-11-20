import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  Upload, X, Image as ImageIcon, Video, File, Trash2, Search, Filter,
  Grid, List, Download, Eye, RotateCw, Crop, CheckCircle2, AlertCircle,
  Loader2, Play, Pause, Volume2, Maximize2, ChevronDown, ChevronUp,
  Palette, Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline
} from 'lucide-react';
import { useUpload } from '../hooks/useUpload';
import { supabase } from '../lib/supabase';

// Sous-composant ProgressBar
const ProgressBar = React.memo(({ progress, speed, timeRemaining, formatFileSize, formatTime }) => (
  <div className="w-full">
    <div className="flex justify-between items-center mb-1">
      <span className="text-xs font-medium text-gray-700">{Math.round(progress)}%</span>
      <div className="flex items-center space-x-2 text-xs text-gray-500">
        {speed > 0 && (
          <>
            <span>{formatFileSize(speed)}/s</span>
            {timeRemaining && <span>• {formatTime(timeRemaining)}</span>}
          </>
        )}
      </div>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
));

// Sous-composant FilePreview
const FilePreview = React.memo(({
  file,
  onRemove,
  onPreview,
  viewMode,
  isSelected,
  onSelect,
}) => {
  const [imageError, setImageError] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState(null);

  useEffect(() => {
    if (file.type?.startsWith('video/') && file.cloudinary_url) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = file.cloudinary_url;
      video.onloadedmetadata = () => {
        setVideoMetadata({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
        });
      };
    }
  }, [file]);

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const isImage = file.type?.startsWith('image/') || file.file_type === 'image';
  const isVideo = file.type?.startsWith('video/') || file.file_type === 'video';
  const previewUrl = file.cloudinary_url || file.url || file.preview;

  if (viewMode === 'list') {
    return (
      <div
        className={`flex items-center space-x-4 p-4 bg-white rounded-lg border-2 transition-all cursor-pointer ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => onSelect && onSelect(file.id)}
      >
        <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
          {isImage && previewUrl && !imageError ? (
            <img
              src={previewUrl}
              alt={file.file_name || file.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : isVideo && previewUrl ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <Play className="w-6 h-6 text-white" />
            </div>
          ) : (
            <File className="w-8 h-8 text-gray-400 m-auto" />
          )}
          <div className="absolute top-1 right-1">
            {isImage ? (
              <ImageIcon className="w-4 h-4 text-white bg-black bg-opacity-50 rounded p-0.5" />
            ) : (
              <Video className="w-4 h-4 text-white bg-black bg-opacity-50 rounded p-0.5" />
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">{file.file_name || file.name}</h4>
          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
            <span>{formatFileSize(file.file_size || file.size)}</span>
            {isVideo && videoMetadata && (
              <>
                <span>{formatDuration(videoMetadata.duration)}</span>
                <span>{videoMetadata.width}x{videoMetadata.height}</span>
              </>
            )}
            <span>{formatDate(file.created_at || file.uploadDate)}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {onPreview && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPreview(file);
              }}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
              title="Prévisualiser"
            >
              <Eye className="w-5 h-5" />
            </button>
          )}
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(file.id);
              }}
              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
              title="Supprimer"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative group bg-white rounded-lg border-2 overflow-hidden transition-all cursor-pointer ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => onSelect && onSelect(file.id)}
    >
      <div className="aspect-square relative">
        {isImage && previewUrl && !imageError ? (
          <img
            src={previewUrl}
            alt={file.file_name || file.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : isVideo && previewUrl ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-900 relative">
            <video
              src={previewUrl}
              className="w-full h-full object-cover"
              muted
              preload="metadata"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <Play className="w-6 h-6 text-white ml-1" />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <File className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Overlay avec infos */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
            <p className="text-sm font-medium truncate mb-1">{file.file_name || file.name}</p>
            <div className="flex items-center justify-between text-xs">
              <span>{formatFileSize(file.file_size || file.size)}</span>
              {isVideo && videoMetadata && (
                <span className="flex items-center space-x-1">
                  <Video className="w-3 h-3" />
                  <span>{formatDuration(videoMetadata.duration)}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Badge type */}
        <div className="absolute top-2 left-2">
          {isImage ? (
            <div className="bg-blue-500 text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center space-x-1">
              <ImageIcon className="w-3 h-3" />
              <span>Photo</span>
            </div>
          ) : (
            <div className="bg-green-500 text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center space-x-1">
              <Video className="w-3 h-3" />
              <span>Vidéo</span>
            </div>
          )}
        </div>

        {/* Boutons actions */}
        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onPreview && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPreview(file);
              }}
              className="p-2 bg-white hover:bg-gray-100 rounded-lg shadow-lg transition"
              title="Prévisualiser"
            >
              <Eye className="w-4 h-4 text-gray-700" />
            </button>
          )}
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(file.id);
              }}
              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg transition"
              title="Supprimer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Résolution vidéo */}
        {isVideo && videoMetadata && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-medium">
            {videoMetadata.width}x{videoMetadata.height}
          </div>
        )}
      </div>
    </div>
  );
});

// Sous-composant ChapterStyleEditor
const ChapterStyleEditor = React.memo(({ chapterStyle, onStyleChange, chapter }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const fonts = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
    'Poppins', 'Playfair Display', 'Merriweather', 'Raleway', 'Nunito'
  ];

  const animations = [
    { value: 'fade', label: 'Fondu' },
    { value: 'slide', label: 'Glissement' },
    { value: 'zoom', label: 'Zoom' },
    { value: 'none', label: 'Aucune' },
  ];

  const textAlignments = [
    { value: 'left', icon: AlignLeft, label: 'Gauche' },
    { value: 'center', icon: AlignCenter, label: 'Centre' },
    { value: 'right', icon: AlignRight, label: 'Droite' },
  ];

  const style = chapterStyle || {
    font: 'Inter',
    fontSize: '2xl',
    textColor: '#ffffff',
    backgroundColor: '#1a1a1a',
    textStyle: { bold: false, italic: false, underline: false },
    textAlign: 'center',
    animation: 'fade',
    duration: 3,
  };

  const updateStyle = (updates) => {
    onStyleChange({ ...style, ...updates });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-2"
      >
        <div className="flex items-center space-x-2">
          <Palette className="w-5 h-5 text-gray-600" />
          <span className="font-semibold text-gray-800">Personnaliser le slide "{chapter}"</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          {/* Police */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Type className="w-4 h-4 inline mr-1" />
              Police de caractères
            </label>
            <select
              value={style.font}
              onChange={(e) => updateStyle({ font: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {fonts.map(font => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>

          {/* Taille */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taille du texte
            </label>
            <div className="flex space-x-2">
              {['sm', 'base', 'lg', 'xl', '2xl', '3xl'].map(size => (
                <button
                  key={size}
                  onClick={() => updateStyle({ fontSize: size })}
                  className={`px-4 py-2 rounded-lg border transition ${
                    style.fontSize === size
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Couleurs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Couleur du texte
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={style.textColor}
                  onChange={(e) => updateStyle({ textColor: e.target.value })}
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={style.textColor}
                  onChange={(e) => updateStyle({ textColor: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="#ffffff"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Couleur de fond
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={style.backgroundColor}
                  onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={style.backgroundColor}
                  onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="#1a1a1a"
                />
              </div>
            </div>
          </div>

          {/* Style texte */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Style du texte
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => updateStyle({
                  textStyle: { ...style.textStyle, bold: !style.textStyle.bold }
                })}
                className={`p-2 rounded-lg border transition ${
                  style.textStyle.bold
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
                title="Gras"
              >
                <Bold className="w-5 h-5" />
              </button>
              <button
                onClick={() => updateStyle({
                  textStyle: { ...style.textStyle, italic: !style.textStyle.italic }
                })}
                className={`p-2 rounded-lg border transition ${
                  style.textStyle.italic
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
                title="Italique"
              >
                <Italic className="w-5 h-5" />
              </button>
              <button
                onClick={() => updateStyle({
                  textStyle: { ...style.textStyle, underline: !style.textStyle.underline }
                })}
                className={`p-2 rounded-lg border transition ${
                  style.textStyle.underline
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
                title="Souligné"
              >
                <Underline className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Alignement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Position du texte
            </label>
            <div className="flex space-x-2">
              {textAlignments.map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => updateStyle({ textAlign: value })}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg border transition ${
                    style.textAlign === value
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Animation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Animation d'entrée
            </label>
            <select
              value={style.animation}
              onChange={(e) => updateStyle({ animation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {animations.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Durée */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Durée d'affichage : {style.duration} secondes
            </label>
            <input
              type="range"
              min="2"
              max="10"
              value={style.duration}
              onChange={(e) => updateStyle({ duration: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>2s</span>
              <span>10s</span>
            </div>
          </div>

          {/* Prévisualisation */}
          <div className="pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aperçu
            </label>
            <div
              className="p-8 rounded-lg text-center transition-all"
              style={{
                backgroundColor: style.backgroundColor,
                color: style.textColor,
                fontFamily: style.font,
                fontSize: `var(--text-${style.fontSize})`,
                fontWeight: style.textStyle.bold ? 'bold' : 'normal',
                fontStyle: style.textStyle.italic ? 'italic' : 'normal',
                textDecoration: style.textStyle.underline ? 'underline' : 'none',
                textAlign: style.textAlign,
              }}
            >
              <div className={`transition-all ${
                style.animation === 'fade' ? 'opacity-100' :
                style.animation === 'slide' ? 'translate-x-0' :
                style.animation === 'zoom' ? 'scale-100' : ''
              }`}>
                {chapter}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// Composant principal MediaUpload
const MediaUpload = ({
  projectId,
  userEmail,
  chapter,
  chapterStyle: initialChapterStyle,
  onUploadComplete,
  maxFileSize = 500,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/x-msvideo'],
  allowFolderUpload = true,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'image' | 'video'
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'name' | 'size' | 'type'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [previewFile, setPreviewFile] = useState(null);
  const [chapterStyle, setChapterStyle] = useState(initialChapterStyle || {
    font: 'Inter',
    fontSize: '2xl',
    textColor: '#ffffff',
    backgroundColor: '#1a1a1a',
    textStyle: { bold: false, italic: false, underline: false },
    textAlign: 'center',
    animation: 'fade',
    duration: 3,
  });
  const [showStats, setShowStats] = useState(false);

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const { uploadStatus, uploadProgress, uploadSpeed, timeRemaining, currentUploads, uploadFiles, cancelAllUploads, resetUpload, formatFileSize, formatTime } = useUpload();

  // Charger les fichiers depuis localStorage au montage
  useEffect(() => {
    const savedFiles = localStorage.getItem(`mediaFiles_${projectId}`);
    if (savedFiles) {
      try {
        setUploadedFiles(JSON.parse(savedFiles));
      } catch (error) {
        console.error('Error loading saved files:', error);
      }
    }
  }, [projectId]);

  // Sauvegarder les fichiers dans localStorage
  useEffect(() => {
    if (uploadedFiles.length > 0) {
      localStorage.setItem(`mediaFiles_${projectId}`, JSON.stringify(uploadedFiles));
    }
  }, [uploadedFiles, projectId]);

  // Sauvegarder dans Supabase après upload
  const saveToSupabase = async (fileData, cloudinaryUrl) => {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .insert({
          project_id: projectId,
          user_email: userEmail,
          file_name: fileData.name,
          file_type: fileData.type.startsWith('image/') ? 'image' : 'video',
          file_size: fileData.size,
          cloudinary_url: cloudinaryUrl,
          chapter: chapter,
          chapter_style: chapterStyle,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      throw error;
    }
  };

  // Valider les fichiers
  const validateFiles = (files) => {
    const errors = [];
    const validFiles = [];

    Array.from(files).forEach(file => {
      // Vérifier la taille
      if (file.size > maxFileSize * 1024 * 1024) {
        errors.push({
          file: file.name,
          error: `Fichier trop volumineux. Taille max: ${maxFileSize}MB`,
        });
        return;
      }

      // Vérifier le format
      const isValidFormat = acceptedFormats.some(format => {
        if (format.includes('*')) {
          return file.type.startsWith(format.replace('*', ''));
        }
        return file.type === format || file.name.toLowerCase().endsWith(format.split('/')[1]);
      });

      if (!isValidFormat && acceptedFormats.length > 0) {
        errors.push({
          file: file.name,
          error: `Format non supporté. Formats acceptés: ${acceptedFormats.join(', ')}`,
        });
        return;
      }

      validFiles.push(file);
    });

    return { validFiles, errors };
  };

  // Gérer l'upload des fichiers
  const handleUpload = useCallback(async (files) => {
    const { validFiles, errors } = validateFiles(files);

    if (errors.length > 0) {
      errors.forEach(({ file, error }) => {
        console.error(`❌ ${file}: ${error}`);
        // Ici on pourrait ajouter des toasts
      });
    }

    if (validFiles.length === 0) return;

    // Créer des entrées temporaires
    const tempFiles = validFiles.map(file => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      file_name: file.name,
      file_type: file.type.startsWith('image/') ? 'image' : 'video',
      file_size: file.size,
      type: file.type,
      name: file.name,
      size: file.size,
      preview: URL.createObjectURL(file),
      uploading: true,
      cloudinary_url: null,
      chapter: chapter,
      created_at: new Date().toISOString(),
    }));

    setUploadedFiles(prev => [...prev, ...tempFiles]);

    // Uploader les fichiers
    const { results, errors: uploadErrors } = await uploadFiles(
      validFiles,
      projectId,
      userEmail,
      chapter,
      chapterStyle,
      async (uploadResults, uploadErrs) => {
        // Mettre à jour les fichiers avec les URLs Cloudinary
        const updatedFiles = tempFiles.map((tempFile, index) => {
          const result = uploadResults.find(r => r.file.name === tempFile.name);
          if (result && result.result && result.result.files && result.result.files[0]) {
            const uploaded = result.result.files[0];
            return {
              ...tempFile,
              cloudinary_url: uploaded.cloudinaryUrl || uploaded.url,
              uploading: false,
              publicId: uploaded.publicId,
            };
          }
          return {
            ...tempFile,
            uploading: false,
            error: true,
          };
        });

        setUploadedFiles(prev => {
          const newFiles = prev.map(file => {
            const updated = updatedFiles.find(uf => uf.id === file.id);
            return updated || file;
          });
          return newFiles;
        });

        // Sauvegarder dans Supabase
        for (const result of uploadResults) {
          if (result.result && result.result.files && result.result.files[0]) {
            const uploaded = result.result.files[0];
            const tempFile = tempFiles.find(tf => tf.name === result.file.name);
            if (tempFile) {
              try {
                const supabaseData = await saveToSupabase(result.file, uploaded.cloudinaryUrl || uploaded.url);
                setUploadedFiles(prev => prev.map(f =>
                  f.id === tempFile.id
                    ? { ...f, id: supabaseData.id, supabase_id: supabaseData.id }
                    : f
                ));
              } catch (error) {
                console.error('Error saving to Supabase:', error);
              }
            }
          }
        }

        // Appeler le callback
        if (onUploadComplete) {
          const completedFiles = updatedFiles.filter(f => !f.error && f.cloudinary_url);
          onUploadComplete(completedFiles);
        }

        // Réinitialiser après un délai
        setTimeout(() => {
          resetUpload();
        }, 2000);
      }
    );
  }, [projectId, userEmail, chapter, chapterStyle, uploadFiles, onUploadComplete]);

  // Gérer le drag & drop
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }, [handleUpload]);

  // Gérer la sélection de fichiers
  const handleFileSelect = useCallback((e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files);
    }
  }, [handleUpload]);

  // Gérer l'upload de dossier
  const handleFolderSelect = useCallback((e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files);
    }
  }, [handleUpload]);

  // Supprimer un fichier
  const handleRemove = async (fileId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
      return;
    }

    try {
      // Supprimer de Supabase si l'ID existe
      const file = uploadedFiles.find(f => f.id === fileId);
      if (file && file.supabase_id) {
        const { error } = await supabase
          .from('media_files')
          .delete()
          .eq('id', file.supabase_id);

        if (error) {
          console.error('Error deleting from Supabase:', error);
        }
      }

      // Supprimer de l'état local
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
      setSelectedFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    } catch (error) {
      console.error('Error removing file:', error);
    }
  };

  // Filtrer et trier les fichiers
  const filteredAndSortedFiles = useMemo(() => {
    let filtered = uploadedFiles.filter(file => {
      // Filtrer par type
      if (filterType === 'image' && file.file_type !== 'image') return false;
      if (filterType === 'video' && file.file_type !== 'video') return false;

      // Filtrer par recherche
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const fileName = (file.file_name || file.name || '').toLowerCase();
        if (!fileName.includes(query)) return false;
      }

      return true;
    });

    // Trier
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = (a.file_name || a.name || '').localeCompare(b.file_name || b.name || '');
          break;
        case 'size':
          comparison = (a.file_size || a.size || 0) - (b.file_size || b.size || 0);
          break;
        case 'type':
          comparison = (a.file_type || '').localeCompare(b.file_type || '');
          break;
        case 'date':
        default:
          comparison = new Date(a.created_at || 0) - new Date(b.created_at || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [uploadedFiles, filterType, searchQuery, sortBy, sortOrder]);

  // Statistiques
  const stats = useMemo(() => {
    const total = uploadedFiles.length;
    const images = uploadedFiles.filter(f => f.file_type === 'image').length;
    const videos = uploadedFiles.filter(f => f.file_type === 'video').length;
    const totalSize = uploadedFiles.reduce((sum, f) => sum + (f.file_size || f.size || 0), 0);
    const byChapter = uploadedFiles.reduce((acc, f) => {
      const ch = f.chapter || 'Non défini';
      acc[ch] = (acc[ch] || 0) + 1;
      return acc;
    }, {});

    return { total, images, videos, totalSize, byChapter };
  }, [uploadedFiles]);

  // Calculer la progression globale
  const globalProgress = useMemo(() => {
    if (currentUploads.length === 0) return 0;
    const totalProgress = Object.values(uploadProgress).reduce((sum, p) => sum + p, 0);
    return totalProgress / currentUploads.length;
  }, [uploadProgress, currentUploads]);

  return (
    <div className="w-full space-y-6">
      {/* Personnalisation du chapitre */}
      <ChapterStyleEditor
        chapterStyle={chapterStyle}
        onStyleChange={setChapterStyle}
        chapter={chapter}
      />

      {/* Zone d'upload */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFormats.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        {allowFolderUpload && (
          <input
            ref={folderInputRef}
            type="file"
            multiple
            webkitdirectory=""
            directory=""
            onChange={handleFolderSelect}
            className="hidden"
          />
        )}

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
            dragActive
              ? 'border-blue-500 bg-blue-50 scale-105'
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {dragActive ? 'Déposez vos fichiers ici' : 'Glissez vos médias ici'}
              </h3>
              <p className="text-gray-500 mb-4">ou cliquez pour parcourir vos fichiers</p>
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition flex items-center space-x-2"
                >
                  <Upload className="w-5 h-5" />
                  <span>Sélectionner des fichiers</span>
                </button>
                {allowFolderUpload && (
                  <button
                    onClick={() => folderInputRef.current?.click()}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition flex items-center space-x-2"
                  >
                    <File className="w-5 h-5" />
                    <span>Uploader un dossier</span>
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-4">
                Formats acceptés : JPG, PNG, WEBP, MP4, MOV, AVI • Taille max : {maxFileSize}MB
              </p>
            </div>
          </div>
        </div>

        {/* Progress globale */}
        {uploadStatus === 'uploading' && currentUploads.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="font-semibold text-blue-900">Upload en cours...</span>
              </div>
              <button
                onClick={cancelAllUploads}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Annuler
              </button>
            </div>
            <ProgressBar
              progress={globalProgress}
              speed={Object.values(uploadSpeed).reduce((sum, s) => sum + s, 0) / Object.values(uploadSpeed).length || 0}
              timeRemaining={Object.values(timeRemaining).reduce((sum, t) => sum + (t || 0), 0) / Object.values(timeRemaining).length || null}
              formatFileSize={formatFileSize}
              formatTime={formatTime}
            />
            <div className="mt-3 space-y-2">
              {currentUploads.map(upload => (
                <div key={upload.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 truncate flex-1">{upload.file.name}</span>
                  <div className="flex items-center space-x-3 ml-4">
                    <span className="text-gray-500">{Math.round(uploadProgress[upload.id] || 0)}%</span>
                    {uploadSpeed[upload.id] > 0 && (
                      <span className="text-gray-500">{formatFileSize(uploadSpeed[upload.id])}/s</span>
                    )}
                    {upload.status === 'completed' && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                    {upload.status === 'error' && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Barre d'outils */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition ${
                    viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Vue grille"
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition ${
                    viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Vue liste"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tous les types</option>
                <option value="image">Photos uniquement</option>
                <option value="video">Vidéos uniquement</option>
              </select>

              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [by, order] = e.target.value.split('-');
                  setSortBy(by);
                  setSortOrder(order);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date-desc">Plus récent</option>
                <option value="date-asc">Plus ancien</option>
                <option value="name-asc">Nom (A-Z)</option>
                <option value="name-desc">Nom (Z-A)</option>
                <option value="size-desc">Plus gros</option>
                <option value="size-asc">Plus petit</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowStats(!showStats)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                Statistiques
              </button>
              {selectedFiles.size > 0 && (
                <button
                  onClick={() => {
                    selectedFiles.forEach(id => handleRemove(id));
                    setSelectedFiles(new Set());
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition flex items-center space-x-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer ({selectedFiles.size})</span>
                </button>
              )}
            </div>
          </div>

          {/* Statistiques */}
          {showStats && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">Total</div>
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">Photos</div>
                <div className="text-2xl font-bold text-green-600">{stats.images}</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">Vidéos</div>
                <div className="text-2xl font-bold text-purple-600">{stats.videos}</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">Taille totale</div>
                <div className="text-2xl font-bold text-orange-600">{formatFileSize(stats.totalSize)}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grille/Liste des fichiers */}
      {filteredAndSortedFiles.length > 0 ? (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
              : 'space-y-2'
          }
        >
          {filteredAndSortedFiles.map(file => (
            <FilePreview
              key={file.id}
              file={file}
              onRemove={handleRemove}
              onPreview={setPreviewFile}
              viewMode={viewMode}
              isSelected={selectedFiles.has(file.id)}
              onSelect={(id) => {
                setSelectedFiles(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(id)) {
                    newSet.delete(id);
                  } else {
                    newSet.add(id);
                  }
                  return newSet;
                });
              }}
            />
          ))}
        </div>
      ) : uploadedFiles.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Aucun média uploadé</h3>
          <p className="text-gray-500">Commencez par glisser-déposer ou sélectionner des fichiers</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Aucun résultat</h3>
          <p className="text-gray-500">Aucun fichier ne correspond à vos critères de recherche</p>
        </div>
      )}

      {/* Modal de prévisualisation */}
      {previewFile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div className="relative max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewFile(null)}
              className="absolute top-4 right-4 z-10 bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg transition"
            >
              <X className="w-6 h-6 text-gray-800" />
            </button>
            {previewFile.file_type === 'image' || previewFile.type?.startsWith('image/') ? (
              <img
                src={previewFile.cloudinary_url || previewFile.url || previewFile.preview}
                alt={previewFile.file_name || previewFile.name}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
            ) : (
              <video
                src={previewFile.cloudinary_url || previewFile.url || previewFile.preview}
                controls
                className="max-w-full max-h-[90vh] rounded-lg"
                autoPlay
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaUpload;

