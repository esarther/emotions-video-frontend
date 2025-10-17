import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, Upload, X, Save, Play, Trash2, Edit2, GripVertical, Music } from 'lucide-react';

const BACKEND_URL = 'https://sensational-naiad-e44c75.netlify.app';

// UUID v4 validation
function isValidUuidV4(value) {
  const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4.test(String(value || ''));
}

// Retrieve the active project ID from the URL or localStorage
function getActiveProjectId() {
  try {
    const path = typeof window !== 'undefined' ? (window.location.pathname || '') : '';
    // Support /project/[id] or /projects/[id]
    const match = path.match(/\/(projects?)\/([^/]+)/i);
    if (match && isValidUuidV4(match[2])) return match[2];

    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const qp = params.get('projectId') || params.get('id') || '';
    if (isValidUuidV4(qp)) return qp;

    // LocalStorage fallbacks
    if (typeof window !== 'undefined' && window.localStorage) {
      const direct = window.localStorage.getItem('projectId');
      if (isValidUuidV4(direct)) return direct;

      // Common keys that may store a project object with an id
      const commonProjectKeys = ['currentProject', 'activeProject'];
      for (const k of commonProjectKeys) {
        try {
          const raw = window.localStorage.getItem(k);
          if (raw) {
            const obj = JSON.parse(raw);
            if (obj && isValidUuidV4(obj.id)) return obj.id;
          }
        } catch (_) {
          // ignore parse issues
        }
      }

      // As a last resort, scan localStorage for any UUID-looking value
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        try {
          const val = window.localStorage.getItem(key);
          if (isValidUuidV4(val)) return val;
        } catch (_) {
          // ignore parse issues
        }
      }
    }
  } catch (_) {
    // ignore environment errors
  }
  return '';
}

function Editor() {
  const [activeStep, setActiveStep] = useState(1);
  const [draggedMedia, setDraggedMedia] = useState(null);
  const [draggedChapter, setDraggedChapter] = useState(null);
  
  const [projectData, setProjectData] = useState({
    occasion: '',
    title: '',
    chapters: [
      { 
        id: '1', 
        name: '👶 Enfance', 
        medias: [],
        music: null,
        introSlide: { text: 'Enfance', font: 'Arial', color: '#000000', bgColor: '#ffffff' }
      },
      { 
        id: '2', 
        name: '❤️ Amour', 
        medias: [],
        music: null,
        introSlide: { text: 'Amour', font: 'Arial', color: '#000000', bgColor: '#ffffff' }
      },
      { 
        id: '3', 
        name: '👥 Amis', 
        medias: [],
        music: null,
        introSlide: { text: 'Amis', font: 'Arial', color: '#000000', bgColor: '#ffffff' }
      }
    ],
    globalMusic: null,
    dedication: { type: '', content: '' }
  });

  // Persist a valid projectId to localStorage when available
  useEffect(() => {
    const pid = getActiveProjectId();
    if (isValidUuidV4(pid)) {
      try {
        window.localStorage.setItem('projectId', pid);
      } catch (_) {
        // ignore storage errors
      }
    }
  }, []);

  const [editingChapter, setEditingChapter] = useState(null);
  const fileInputRef = useRef(null);
  const musicInputRef = useRef(null);
  const chapterMusicInputRef = useRef(null);
  const [targetChapter, setTargetChapter] = useState(null);
  const [targetMusicChapter, setTargetMusicChapter] = useState(null);

  const occasions = [
    '🎂 Anniversaire',
    '💒 Mariage',
    '🎓 Retraite',
    '👶 Naissance',
    '✈️ Voyage',
    '🎉 Autre'
  ];

  const fontList = ['Arial', 'Georgia', 'Courier New', 'Times New Roman', 'Verdana', 'Comic Sans MS', 'Impact'];

  // Upload vers Cloudinary en arrière-plan
  const uploadToCloudinary = async (file, chapterId, mediaId) => {
    const chapter = projectData.chapters.find(ch => ch.id === chapterId);
    const formData = new FormData();
    formData.append('media', file);
    const projectId = getActiveProjectId();
    if (!isValidUuidV4(projectId)) {
      console.error('Invalid or missing projectId. Aborting upload.');
      alert('Projet introuvable. Merci d\'ouvrir votre projet depuis une URL /project/[id] ou de réessayer.');
      return;
    }
    formData.append('projectId', projectId);
    formData.append('chapterName', chapter.name);
    formData.append('userEmail', 'user@example.com');

    try {
      const response = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setProjectData(prev => ({
          ...prev,
          chapters: prev.chapters.map(ch =>
            ch.id === chapterId
              ? {
                  ...ch,
                  medias: ch.medias.map(m =>
                    m.id === mediaId
                      ? { ...m, cloudinaryUrl: data.files[0].url, uploaded: true }
                      : m
                  )
                }
              : ch
          )
        }));
      }
    } catch (error) {
      console.log('Upload Cloudinary en arrière-plan');
    }
  };

  // Gérer l'upload des fichiers avec preview locale
  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    const chapterId = targetChapter || projectData.chapters[0]?.id;
    
    if (!chapterId) return;

    // Créer tous les médias d'un coup
    const newMedias = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        alert(`Le fichier ${file.name} n'est ni une image ni une vidéo`);
        continue;
      }

      const isVideo = file.type.startsWith('video/');
      const objectUrl = URL.createObjectURL(file);
      
      const newMedia = {
        id: Date.now() + Math.random() + i, // Ajouter i pour garantir unicité
        name: file.name,
        type: isVideo ? 'video' : 'image',
        localUrl: objectUrl,
        file: file,
        uploaded: false
      };

      newMedias.push(newMedia);
      
      // Upload en arrière-plan
      uploadToCloudinary(file, chapterId, newMedia.id);
    }

    // Ajouter tous les médias en une seule fois
    setProjectData(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch =>
        ch.id === chapterId
          ? { ...ch, medias: [...ch.medias, ...newMedias] }
          : ch
      )
    }));

    event.target.value = '';
  };

  // Drag & Drop pour les fichiers
  const handleDrop = (e, chapterId) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setTargetChapter(chapterId);
    
    const fakeEvent = { target: { files, value: '' } };
    handleFileSelect(fakeEvent);
  };

  // Drag & Drop pour réorganiser les médias
  const handleMediaDragStart = (media, chapterId) => {
    setDraggedMedia({ media, chapterId });
  };

  const handleMediaDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMediaDrop = (targetChapterId, targetIndex) => {
    if (!draggedMedia) return;

    const { media, chapterId: sourceChapterId } = draggedMedia;

    setProjectData(prev => {
      let newChapters = [...prev.chapters];
      
      newChapters = newChapters.map(ch => {
        if (ch.id === sourceChapterId) {
          return { ...ch, medias: ch.medias.filter(m => m.id !== media.id) };
        }
        return ch;
      });

      newChapters = newChapters.map(ch => {
        if (ch.id === targetChapterId) {
          const newMedias = [...ch.medias];
          newMedias.splice(targetIndex, 0, media);
          return { ...ch, medias: newMedias };
        }
        return ch;
      });

      return { ...prev, chapters: newChapters };
    });

    setDraggedMedia(null);
  };

  // Drag & Drop pour réorganiser les chapitres
  const handleChapterDragStart = (chapter) => {
    setDraggedChapter(chapter);
  };

  const handleChapterDrop = (targetIndex) => {
    if (!draggedChapter) return;

    setProjectData(prev => {
      const newChapters = [...prev.chapters];
      const currentIndex = newChapters.findIndex(ch => ch.id === draggedChapter.id);
      newChapters.splice(currentIndex, 1);
      newChapters.splice(targetIndex, 0, draggedChapter);
      return { ...prev, chapters: newChapters };
    });

    setDraggedChapter(null);
  };

  const deleteMedia = (chapterId, mediaId) => {
    setProjectData(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch =>
        ch.id === chapterId
          ? { ...ch, medias: ch.medias.filter(m => m.id !== mediaId) }
          : ch
      )
    }));
  };

  const addCustomChapter = () => {
    const name = prompt('Nom du chapitre :');
    if (!name) return;

    const newChapter = {
      id: Date.now().toString(),
      name: name,
      medias: [],
      music: null,
      introSlide: { text: name, font: 'Arial', color: '#000000', bgColor: '#ffffff' }
    };
    setProjectData(prev => ({
      ...prev,
      chapters: [...prev.chapters, newChapter]
    }));
  };

  const updateChapter = (chapterId, updates) => {
    setProjectData(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch =>
        ch.id === chapterId ? { ...ch, ...updates } : ch
      )
    }));
  };

  const deleteChapter = (chapterId) => {
    if (!window.confirm('Supprimer ce chapitre ?')) return;
    setProjectData(prev => ({
      ...prev,
      chapters: prev.chapters.filter(ch => ch.id !== chapterId)
    }));
  };

  const handleGlobalMusicSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setProjectData(prev => ({
      ...prev,
      globalMusic: {
        name: file.name,
        url: objectUrl
      }
    }));
    event.target.value = '';
  };

  const handleChapterMusicSelect = (event) => {
    const file = event.target.files[0];
    if (!file || !targetMusicChapter) return;

    const objectUrl = URL.createObjectURL(file);
    setProjectData(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch =>
        ch.id === targetMusicChapter
          ? { ...ch, music: { name: file.name, url: objectUrl } }
          : ch
      )
    }));
    event.target.value = '';
    setTargetMusicChapter(null);
  };

  const exportProject = () => {
    const dataStr = JSON.stringify(projectData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'emotions-video-project.json';
    link.click();
  };

  const stats = {
    totalMedias: projectData.chapters.reduce((acc, ch) => acc + ch.medias.length, 0),
    totalPhotos: projectData.chapters.reduce(
      (acc, ch) => acc + ch.medias.filter(m => m.type === 'image').length,
      0
    ),
    totalVideos: projectData.chapters.reduce(
      (acc, ch) => acc + ch.medias.filter(m => m.type === 'video').length,
      0
    ),
    estimatedDuration: projectData.chapters.reduce((acc, ch) => acc + (ch.medias.length * 3), 0)
  };

  const steps = [
    { id: 1, title: 'Occasion', icon: '🎉' },
    { id: 2, title: 'Chapitres', icon: '📝' },
    { id: 3, title: 'Médias', icon: '📁' },
    { id: 4, title: 'Musique', icon: '🎵' },
    { id: 5, title: 'Dédicaces', icon: '💌' },
    { id: 6, title: 'Timeline', icon: '⏱️' },
    { id: 7, title: 'Aperçu', icon: '👁️' },
    { id: 8, title: 'Export', icon: '💾' }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <h1 className="text-2xl font-bold">🎬 E-Motions Video</h1>
          <p className="text-sm opacity-90 mt-1">Création collaborative</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`w-full flex items-center justify-between p-4 border-b hover:bg-gray-50 transition ${
                activeStep === step.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{step.icon}</span>
                <span className={`font-medium ${activeStep === step.id ? 'text-indigo-600' : ''}`}>
                  {step.title}
                </span>
              </div>
              <ChevronRight className="text-gray-400" size={20} />
            </button>
          ))}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={exportProject}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
          >
            <Save size={18} />
            Exporter le projet
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={musicInputRef}
          type="file"
          accept="audio/*"
          onChange={handleGlobalMusicSelect}
          className="hidden"
        />
        <input
          ref={chapterMusicInputRef}
          type="file"
          accept="audio/*"
          onChange={handleChapterMusicSelect}
          className="hidden"
        />

        {activeStep === 1 && (
          <div>
            <h2 className="text-3xl font-bold mb-6">🎉 Choisissez l'occasion</h2>
            <div className="grid grid-cols-2 gap-4 max-w-2xl">
              {occasions.map((occ) => (
                <button
                  key={occ}
                  onClick={() => setProjectData({ ...projectData, occasion: occ })}
                  className={`p-6 rounded-xl border-2 transition hover:shadow-lg ${
                    projectData.occasion === occ
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <span className="text-4xl block mb-2">{occ.split(' ')[0]}</span>
                  <span className="font-medium">{occ.split(' ').slice(1).join(' ')}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeStep === 2 && (
          <div>
            <h2 className="text-3xl font-bold mb-6">📝 Organisez vos chapitres</h2>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Chapitres :</h3>
                <button
                  onClick={addCustomChapter}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm"
                >
                  + Ajouter un chapitre
                </button>
              </div>

              <div className="space-y-2">
                {projectData.chapters.map((chapter, index) => (
                  <div
                    key={chapter.id}
                    draggable
                    onDragStart={() => handleChapterDragStart(chapter)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleChapterDrop(index)}
                    className="bg-white p-4 rounded-lg border cursor-move hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <GripVertical size={20} className="text-gray-400" />
                        <span className="font-medium">{chapter.name}</span>
                        <span className="text-sm text-gray-500">({chapter.medias.length} médias)</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingChapter(chapter.id)}
                          className="text-indigo-600 hover:text-indigo-700"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => deleteChapter(chapter.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {editingChapter === chapter.id && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Nom du chapitre :</label>
                          <input
                            type="text"
                            value={chapter.name}
                            onChange={(e) => updateChapter(chapter.id, { name: e.target.value })}
                            className="w-full border rounded-lg px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Texte diapo intro :</label>
                          <input
                            type="text"
                            value={chapter.introSlide.text}
                            onChange={(e) => updateChapter(chapter.id, {
                              introSlide: { ...chapter.introSlide, text: e.target.value }
                            })}
                            className="w-full border rounded-lg px-3 py-2"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium mb-1">Police :</label>
                            <select
                              value={chapter.introSlide.font}
                              onChange={(e) => updateChapter(chapter.id, {
                                introSlide: { ...chapter.introSlide, font: e.target.value }
                              })}
                              className="w-full border rounded-lg px-3 py-2"
                            >
                              {fontList.map(font => (
                                <option key={font} value={font}>{font}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Couleur texte :</label>
                            <input
                              type="color"
                              value={chapter.introSlide.color}
                              onChange={(e) => updateChapter(chapter.id, {
                                introSlide: { ...chapter.introSlide, color: e.target.value }
                              })}
                              className="w-full h-10 border rounded-lg"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => setEditingChapter(null)}
                          className="text-sm text-indigo-600 hover:underline"
                        >
                          Fermer
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeStep === 3 && (
          <div>
            <h2 className="text-3xl font-bold mb-6">📁 Ajoutez vos médias</h2>

            {projectData.chapters.map((chapter) => (
              <div key={chapter.id} className="mb-8 bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">{chapter.name}</h3>
                  <button
                    onClick={() => {
                      setTargetChapter(chapter.id);
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                  >
                    <Upload size={18} />
                    Ajouter
                  </button>
                </div>

                <div
                  onDrop={(e) => handleDrop(e, chapter.id)}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 min-h-[200px]"
                >
                  {chapter.medias.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <Upload size={48} className="mx-auto mb-2 opacity-50" />
                      <p>Glissez vos fichiers ici ou cliquez sur "Ajouter"</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-4">
                      {chapter.medias.map((media, mediaIndex) => (
                        <div
                          key={media.id}
                          draggable
                          onDragStart={() => handleMediaDragStart(media, chapter.id)}
                          onDragOver={handleMediaDragOver}
                          onDrop={(e) => {
                            e.stopPropagation();
                            handleMediaDrop(chapter.id, mediaIndex);
                          }}
                          className="relative group cursor-move"
                        >
                          {media.type === 'image' ? (
                            <img
                              src={media.localUrl}
                              alt={media.name}
                              className="aspect-square object-cover rounded-lg"
                            />
                          ) : (
                            <div className="aspect-square bg-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                              <video
                                src={media.localUrl}
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                              <Play className="text-white relative z-10" size={32} />
                            </div>
                          )}
                          <button
                            onClick={() => deleteMedia(chapter.id, media.id)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                          >
                            <X size={16} />
                          </button>
                          <div className="text-xs text-gray-600 mt-1 truncate">{media.name}</div>
                          {!media.uploaded && (
                            <div className="text-xs text-orange-500">Upload en cours...</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeStep === 4 && (
          <div>
            <h2 className="text-3xl font-bold mb-6">🎵 Ajoutez la musique</h2>
            
            <div className="max-w-2xl mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold mb-4">Musique globale (toute la vidéo)</h3>
                {projectData.globalMusic ? (
                  <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Music className="text-indigo-600" size={24} />
                      <span className="font-medium">{projectData.globalMusic.name}</span>
                    </div>
                    <button
                      onClick={() => setProjectData(prev => ({ ...prev, globalMusic: null }))}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => musicInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-indigo-600 hover:bg-indigo-50 transition"
                  >
                    <Music size={32} className="mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-600">Cliquez pour ajouter une musique MP3</p>
                  </button>
                )}
              </div>
            </div>

            <div className="max-w-2xl">
              <h3 className="font-semibold mb-4">Musique par chapitre</h3>
              <div className="space-y-4">
                {projectData.chapters.map((chapter) => (
                  <div key={chapter.id} className="bg-white rounded-xl p-6 shadow-sm">
                    <h4 className="font-medium mb-3">{chapter.name}</h4>
                    {chapter.music ? (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Music size={20} />
                          <span className="text-sm">{chapter.music.name}</span>
                        </div>
                        <button
                          onClick={() => updateChapter(chapter.id, { music: null })}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setTargetMusicChapter(chapter.id);
                          chapterMusicInputRef.current?.click();
                        }}
                        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-indigo-600 hover:bg-indigo-50 transition text-sm"
                      >
                        + Ajouter une musique pour ce chapitre
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeStep === 6 && (
          <div>
            <h2 className="text-3xl font-bold mb-6">⏱️ Timeline du projet</h2>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="space-y-3">
                {projectData.chapters.map((chapter, index) => (
                  <div key={chapter.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <span className="font-mono text-sm text-gray-500 w-8">#{index + 1}</span>
                    <div className="flex-1">
                      <div className="font-semibold">{chapter.name}</div>
                      <div className="text-sm text-gray-600">
                        {chapter.medias.length} médias · ~{chapter.medias.length * 3}s
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {chapter.medias.slice(0, 4).map((media) => (
                        <div key={media.id} className="w-12 h-12 rounded overflow-hidden">
                          {media.type === 'image' && (
                            <img src={media.localUrl} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                      ))}
                      {chapter.medias.length > 4 && (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs">
                          +{chapter.medias.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Durée totale estimée :</span>
                  <span className="text-indigo-600">~{stats.estimatedDuration}s</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeStep === 7 && (
          <div>
            <h2 className="text-3xl font-bold mb-6">👁️ Prévisualisation</h2>
            <div className="bg-black rounded-xl aspect-video mb-6 flex items-center justify-center">
              <div className="text-center text-white">
                <Play size={64} className="mx-auto mb-4" />
                <p>Prévisualisation de la vidéo</p>
                <p className="text-sm text-gray-400 mt-2">
                  {stats.totalMedias} médias · ~{stats.estimatedDuration}s
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto p-6">
        <h3 className="font-bold text-lg mb-4">📊 Résumé</h3>

        {projectData.occasion && (
          <div className="bg-indigo-50 rounded-lg p-4 mb-4">
            <h4 className="font-semibold mb-2">🎉 Occasion</h4>
            <p className="text-gray-700">{projectData.occasion}</p>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-semibold mb-2">📝 Chapitres ({projectData.chapters.length})</h4>
          <ul className="text-sm space-y-1">
            {projectData.chapters.map((ch) => (
              <li key={ch.id} className="text-gray-600">
                • {ch.name} ({ch.medias.length})
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">📷 Statistiques</h4>
          <p className="text-sm text-gray-600">Total : {stats.totalMedias} médias</p>
          <p className="text-sm text-gray-600">📸 Photos : {stats.totalPhotos}</p>
          <p className="text-sm text-gray-600">🎥 Vidéos : {stats.totalVideos}</p>
          <p className="text-sm text-gray-600 mt-2">⏱️ Durée : ~{stats.estimatedDuration}s</p>
        </div>
      </div>
    </div>
  );
}

export default Editor;