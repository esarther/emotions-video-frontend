import React, { useState, useRef } from 'react';
import { ChevronRight, Trash2, Plus, Upload, X, Music as MusicIcon } from 'lucide-react';

// CONFIGURATION
const BACKEND_URL = 'https://sensational-naiad-e44c75.netlify.app';
const DEFAULT_USER_EMAIL = 'test-user@example.com';
const DEFAULT_PROJECT_ID = '776ea330-5060-4d7c-a094-2e08612b259';

function Editor() {
  const [activeStep, setActiveStep] = useState(1);
  const [occasion, setOccasion] = useState('');
  const [targetChapter, setTargetChapter] = useState(null);
  const [chapters, setChapters] = useState([
    { id: 1, name: 'Enfance', medias: [] },
    { id: 2, name: 'Famille', medias: [] }
  ]);
  const [musicMode, setMusicMode] = useState('global');
  const [globalMusic, setGlobalMusic] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(new Set());
  const fileInputRef = useRef(null);
  const musicInputRef = useRef(null);

  const steps = [
    { id: 1, title: 'Occasion', icon: '🎉' },
    { id: 2, title: 'Chapitres', icon: '📝' },
    { id: 3, title: 'Médias', icon: '📁' },
    { id: 4, title: 'Musique', icon: '🎵' },
    { id: 5, title: 'Dédicaces', icon: '💌' },
    { id: 6, title: 'Collaboration', icon: '👥' },
    { id: 7, title: 'Aperçu', icon: '👁️' },
    { id: 8, title: 'Paiement', icon: '💳' }
  ];

  // NOUVELLE FONCTION : Upload vers le backend
  const uploadToBackend = async (file, chapterName) => {
    const formData = new FormData();
    formData.append('media', file);
    formData.append('projectId', DEFAULT_PROJECT_ID);
    formData.append('chapterName', chapterName);
    formData.append('userEmail', DEFAULT_USER_EMAIL);

    try {
      const response = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur upload');
      }

      const data = await response.json();
      return data.files[0];
    } catch (error) {
      console.error('❌ Erreur upload:', error);
      throw error;
    }
  };

  const handleFiles = async (files) => {
    const fileArray = Array.from(files);
    // Accepter tous les fichiers images et vidéos
    const validFiles = fileArray.filter(file => {
      return file.type.startsWith('image/') || file.type.startsWith('video/');
    });

    if (validFiles.length > 0 && chapters.length > 0) {
      const chapterToUpdate = targetChapter || chapters[0].id;
      const chapter = chapters.find(ch => ch.id === chapterToUpdate);

      // Créer des médias temporaires
      const tempMedias = validFiles.map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        type: file.type.startsWith('image') ? 'photo' : 'video',
        url: URL.createObjectURL(file),
        file: file,
        uploading: true,
        cloudinaryUrl: null
      }));

      // Ajouter immédiatement à l'interface
      setChapters(chapters.map(ch => 
        ch.id === chapterToUpdate
          ? { ...ch, medias: [...ch.medias, ...tempMedias] }
          : ch
      ));

      // Uploader chaque fichier
      for (const media of tempMedias) {
        setUploadingFiles(prev => new Set(prev).add(media.id));
        
        try {
          const uploadedFile = await uploadToBackend(media.file, chapter.name);
          
          // Mettre à jour avec l'URL Cloudinary
          setChapters(prevChapters => 
            prevChapters.map(ch => {
              if (ch.id === chapterToUpdate) {
                return {
                  ...ch,
                  medias: ch.medias.map(m => 
                    m.id === media.id 
                      ? {
                          ...m,
                          cloudinaryUrl: uploadedFile.cloudinaryUrl,
                          url: uploadedFile.cloudinaryUrl,
                          uploading: false,
                          publicId: uploadedFile.publicId
                        }
                      : m
                  )
                };
              }
              return ch;
            })
          );

          setUploadingFiles(prev => {
            const newSet = new Set(prev);
            newSet.delete(media.id);
            return newSet;
          });

          console.log('✅ Fichier uploadé:', uploadedFile.originalName);
        } catch (error) {
          console.error('❌ Erreur upload:', media.name, error);
          
          // Marquer comme erreur
          setChapters(prevChapters => 
            prevChapters.map(ch => {
              if (ch.id === chapterToUpdate) {
                return {
                  ...ch,
                  medias: ch.medias.map(m => 
                    m.id === media.id 
                      ? { ...m, uploading: false, error: true }
                      : m
                  )
                };
              }
              return ch;
            })
          );

          setUploadingFiles(prev => {
            const newSet = new Set(prev);
            newSet.delete(media.id);
            return newSet;
          });
        }
      }
    }
  };

  const addChapter = () => {
    const newChapter = {
      id: Date.now(),
      name: `Chapitre ${chapters.length + 1}`,
      medias: [],
      music: null
    };
    setChapters([...chapters, newChapter]);
  };

  const removeChapter = (id) => {
    if (chapters.length > 1) {
      setChapters(chapters.filter(ch => ch.id !== id));
    }
  };

  const updateChapterName = (id, newName) => {
    setChapters(chapters.map(ch => 
      ch.id === id ? { ...ch, name: newName } : ch
    ));
  };

  const handleMusicUpload = (e, chapterId = null) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'audio/mpeg') {
      const musicData = {
        id: Date.now(),
        name: file.name,
        url: URL.createObjectURL(file),
        file: file
      };

      if (chapterId) {
        setChapters(chapters.map(ch =>
          ch.id === chapterId ? { ...ch, music: musicData } : ch
        ));
      } else {
        setGlobalMusic(musicData);
      }
    }
  };

  const removeMusic = (chapterId = null) => {
    if (chapterId) {
      setChapters(chapters.map(ch =>
        ch.id === chapterId ? { ...ch, music: null } : ch
      ));
    } else {
      setGlobalMusic(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removeMedia = (chapterId, mediaId) => {
    setChapters(chapters.map(ch => 
      ch.id === chapterId 
        ? { ...ch, medias: ch.medias.filter(m => m.id !== mediaId) }
        : ch
    ));
  };

  const totalMedias = chapters.reduce((sum, ch) => sum + ch.medias.length, 0);
  const totalPhotos = chapters.reduce((sum, ch) => 
    sum + ch.medias.filter(m => m.type === 'photo').length, 0
  );
  const totalVideos = chapters.reduce((sum, ch) => 
    sum + ch.medias.filter(m => m.type === 'video').length, 0
  );

  const getStepDescription = (stepId) => {
    const descriptions = {
      1: "Sélectionnez le type d'événement pour votre vidéo",
      2: "Organisez et personnalisez vos chapitres",
      3: "Glissez vos photos et vidéos dans les chapitres",
      4: "Choisissez les musiques de votre vidéo",
      5: "Ajoutez des messages de fin créatifs",
      6: "Invitez vos proches à contribuer",
      7: "Visualisez le résultat final",
      8: "Procédez au paiement pour obtenir votre vidéo"
    };
    return descriptions[stepId] || "";
  };

  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* COLONNE GAUCHE - Sidebar */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <h1 className="text-2xl font-bold mb-1">🎬 E-Motions Video</h1>
          <p className="text-sm opacity-90">Créez votre vidéo collaborative</p>
        </div>

        {/* Steps */}
        <div className="flex-1">
          {steps.map((step) => (
            <div key={step.id} className="border-b border-gray-100">
              <button
                onClick={() => setActiveStep(step.id)}
                className={`w-full flex items-center justify-between p-5 hover:bg-gray-50 transition ${
                  activeStep === step.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                    activeStep === step.id 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step.id}
                  </div>
                  <span className="font-semibold text-gray-800">{step.title}</span>
                </div>
                <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                  activeStep === step.id ? 'rotate-90' : ''
                }`} />
              </button>
              
              {/* Step Content */}
              {activeStep === step.id && (
                <div className="px-6 pb-6 bg-gray-50">
                  
                  {/* Étape 1 - Occasion */}
                  {step.id === 1 && (
                    <div className="space-y-4">
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700 mb-2 block">Choisir une occasion</span>
                        <select 
                          value={occasion}
                          onChange={(e) => setOccasion(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Choisir...</option>
                          <option value="anniversaire">🎂 Anniversaire</option>
                          <option value="mariage">💒 Mariage</option>
                          <option value="depart">👋 Départ/Retraite</option>
                          <option value="voyage">✈️ Voyage</option>
                          <option value="naissance">👶 Naissance</option>
                        </select>
                      </label>
                      {occasion && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                          ✅ Occasion sélectionnée : <strong className="capitalize">{occasion}</strong>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Étape 2 - Chapitres */}
                  {step.id === 2 && (
                    <div className="space-y-3">
                      {chapters.map((chapter) => (
                        <div key={chapter.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center space-x-3 group">
                          <span className="text-gray-400 cursor-grab">⋮⋮</span>
                          <input 
                            type="text" 
                            value={chapter.name}
                            onChange={(e) => updateChapterName(chapter.id, e.target.value)}
                            className="flex-1 border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 font-medium" 
                          />
                          <span className="text-xs text-gray-500">
                            {chapter.medias.length} média{chapter.medias.length > 1 ? 's' : ''}
                          </span>
                          <button 
                            onClick={() => removeChapter(chapter.id)}
                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                            disabled={chapters.length === 1}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={addChapter}
                        className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium flex items-center justify-center space-x-2 transition"
                      >
                        <Plus size={20} />
                        <span>Ajouter chapitre</span>
                      </button>
                    </div>
                  )}
                  
                  {/* Étape 3 - Médias */}
                  {step.id === 3 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 block">
                          📁 Ajouter les médias au chapitre :
                        </label>
                        <select
                          value={targetChapter || chapters[0]?.id}
                          onChange={(e) => setTargetChapter(Number(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                          {chapters.map(ch => (
                            <option key={ch.id} value={ch.id}>
                              {ch.name} ({ch.medias.length} média{ch.medias.length > 1 ? 's' : ''})
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium flex items-center justify-center space-x-2"
                      >
                        <Upload size={20} />
                        <span>Parcourir mes fichiers</span>
                      </button>
                      <p className="text-xs text-gray-400 text-center">
                        Tous formats acceptés : JPG, PNG, HEIC, TIFF, MP4, MOV, AVI, etc.
                      </p>
                    </div>
                  )}

                  {/* Étape 4 - Musique */}
                  {step.id === 4 && (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={musicMode === 'global'}
                            onChange={() => setMusicMode('global')}
                            className="w-4 h-4"
                          />
                          <span className="text-sm font-medium">🎵 Une musique pour toute la vidéo</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={musicMode === 'perChapter'}
                            onChange={() => setMusicMode('perChapter')}
                            className="w-4 h-4"
                          />
                          <span className="text-sm font-medium">🎼 Une musique par chapitre</span>
                        </label>
                      </div>

                      {musicMode === 'global' && (
                        <div className="mt-4">
                          {!globalMusic ? (
                            <button
                              onClick={() => musicInputRef.current?.click()}
                              className="w-full py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium flex items-center justify-center space-x-2"
                            >
                              <MusicIcon size={20} />
                              <span>Uploader un MP3</span>
                            </button>
                          ) : (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <MusicIcon className="text-purple-600" size={20} />
                                <span className="text-sm font-medium">{globalMusic.name}</span>
                              </div>
                              <button
                                onClick={() => removeMusic()}
                                className="text-red-500 hover:text-red-600"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          )}
                          <input
                            ref={musicInputRef}
                            type="file"
                            accept="audio/mpeg"
                            onChange={(e) => handleMusicUpload(e)}
                            className="hidden"
                          />
                        </div>
                      )}

                      {musicMode === 'perChapter' && (
                        <div className="text-center py-4 text-sm text-gray-500">
                          Fonctionnalité disponible dans la colonne centrale
                        </div>
                      )}
                    </div>
                  )}

                  {/* Autres étapes */}
                  {step.id > 4 && (
                    <div className="text-center py-4 text-gray-400">
                      <p>Section en construction</p>
                      <p className="text-sm mt-1">À venir prochainement</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* COLONNE CENTRALE - Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              {steps.find(s => s.id === activeStep)?.title}
            </h2>
            <p className="text-gray-500 mt-1">
              {getStepDescription(activeStep)}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Progression</span>
            <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                style={{ width: `${(activeStep / 8) * 100}%` }}
              />
            </div>
            <span className="text-sm text-gray-500">{Math.round((activeStep / 8) * 100)}%</span>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          
          {/* Upload Zone - Étape Médias */}
          {activeStep === 3 && (
            <>
              <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleChange}
                  className="hidden"
                />
                <div 
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition cursor-pointer ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  <div className="text-6xl mb-4">📁</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {dragActive ? 'Déposez vos fichiers ici' : 'Glissez vos médias ici'}
                  </h3>
                  <p className="text-gray-500">ou cliquez pour parcourir vos fichiers</p>
                  <p className="text-sm text-gray-400 mt-2">Tous formats acceptés : JPG, PNG, HEIC, TIFF, MP4, MOV, AVI, etc.</p>
                </div>
              </div>

              {/* Médias uploadés par chapitre */}
              {chapters.filter(ch => ch.medias.length > 0).map(chapter => (
                <div key={chapter.id} className="bg-white rounded-2xl shadow-sm p-8 mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    📁 {chapter.name} ({chapter.medias.length} média{chapter.medias.length > 1 ? 's' : ''})
                  </h4>
                  <div className="grid grid-cols-4 gap-4">
                    {chapter.medias.map(media => (
                      <div key={media.id} className="relative group">
                        {media.uploading ? (
                          <div className="w-full h-32 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          </div>
                        ) : media.error ? (
                          <div className="w-full h-32 bg-red-50 rounded-lg border-2 border-red-200 flex items-center justify-center">
                            <span className="text-red-600 text-sm">Erreur</span>
                          </div>
                        ) : media.type === 'photo' ? (
                          <img 
                            src={media.url} 
                            alt={media.name}
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                          />
                        ) : (
                          <video 
                            src={media.url}
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                          />
                        )}
                        <button
                          onClick={() => removeMedia(chapter.id, media.id)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-all"
                        >
                          <X size={16} />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded-md font-semibold">
                          {media.type === 'photo' ? '📸 Photo' : '🎥 Vidéo'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Timeline */}
              <div className="bg-gray-800 rounded-2xl shadow-lg p-6">
                <h4 className="text-white font-semibold mb-4">Timeline du projet</h4>
                
                <div className="space-y-3">
                  {chapters.map((chapter) => (
                    <div key={chapter.id} className="flex items-center space-x-3">
                      <div className="w-24 text-gray-400 text-sm truncate">{chapter.name}</div>
                      <div className="flex-1 h-8 bg-gray-700 rounded-lg flex items-center px-2 space-x-1">
                        {chapter.medias.map((media) => (
                          <div 
                            key={media.id}
                            className={`w-12 h-5 rounded ${media.type === 'photo' ? 'bg-blue-500' : 'bg-green-500'}`}
                            title={media.name}
                          ></div>
                        ))}
                        {chapter.medias.length === 0 && (
                          <span className="text-gray-500 text-xs">Aucun média</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Section Musique par chapitre */}
          {activeStep === 4 && musicMode === 'perChapter' && (
            <div className="space-y-6">
              {chapters.map(chapter => (
                <div key={chapter.id} className="bg-white rounded-2xl shadow-sm p-8">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    🎵 Musique - {chapter.name}
                  </h4>
                  {!chapter.music ? (
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'audio/mpeg';
                        input.onchange = (e) => handleMusicUpload(e, chapter.id);
                        input.click();
                      }}
                      className="w-full py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium flex items-center justify-center space-x-2"
                    >
                      <MusicIcon size={20} />
                      <span>Uploader un MP3</span>
                    </button>
                  ) : (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <MusicIcon className="text-purple-600" size={20} />
                        <span className="text-sm font-medium">{chapter.music.name}</span>
                      </div>
                      <button
                        onClick={() => removeMusic(chapter.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Autres étapes */}
          {activeStep !== 3 && activeStep !== 4 && (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">🚧</div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">Section en construction</h3>
              <p className="text-gray-500">Cette fonctionnalité sera disponible prochainement</p>
            </div>
          )}

        </div>
      </div>

      {/* COLONNE DROITE - Summary Panel */}
      <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-6">📊 Résumé du projet</h3>
        
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="font-semibold text-gray-800 mb-2">🎂 Occasion</div>
            <div className="text-sm text-gray-600">
              {occasion ? (
                <span className="capitalize">{occasion}</span>
              ) : (
                <span className="text-gray-400">Non définie</span>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="font-semibold text-gray-800 mb-2">📝 Chapitres ({chapters.length})</div>
            <div className="text-sm text-gray-600 space-y-1">
              {chapters.map((ch) => (
                <div key={ch.id}>• {ch.name} ({ch.medias.length} média{ch.medias.length > 1 ? 's' : ''})</div>
              ))}
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="font-semibold text-gray-800 mb-2">📁 Médias</div>
            <div className="text-sm text-gray-600">
              📸 {totalPhotos} photo{totalPhotos > 1 ? 's' : ''}<br/>
              🎥 {totalVideos} vidéo{totalVideos > 1 ? 's' : ''}
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="font-semibold text-gray-800 mb-2">🎵 Musique</div>
            <div className="text-sm text-gray-600">
              {musicMode === 'global' && globalMusic ? (
                <>Globale : {globalMusic.name}</>
              ) : musicMode === 'perChapter' ? (
                <>Par chapitre ({chapters.filter(ch => ch.music).length}/{chapters.length})</>
              ) : (
                <span className="text-gray-400">Non définie</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl p-5">
          <div className="font-semibold mb-2">💡 Astuce</div>
          <div className="text-sm opacity-90">
            {activeStep === 1 && "Choisissez l'occasion qui correspond à votre événement"}
            {activeStep === 2 && "Organisez vos chapitres par thème pour un montage cohérent"}
            {activeStep === 3 && "Les fichiers sont automatiquement uploadés vers Cloudinary"}
            {activeStep === 4 && "Choisissez une musique globale ou une par chapitre"}
            {activeStep > 4 && "Invitez vos proches pour enrichir votre vidéo !"}
          </div>
        </div>
      </div>

    </div>
  );
}

export default Editor;