// src/pages/Editor.js - VERSION COMPLÈTE CORRIGÉE
import React, { useState } from 'react';

const BACKEND_URL = 'https://sensational-naiad-e44c75.netlify.app';

function Editor() {
  const [currentStep, setCurrentStep] = useState(1);
  const [projectData, setProjectData] = useState({
    occasion: '',
    title: '',
    chapters: [],
    medias: [],
    music: '',
    dedication: '',
    participants: []
  });

  const [uploading, setUploading] = useState(false);

  const occasions = [
    '🎂 Anniversaire',
    '💒 Mariage',
    '🎓 Retraite',
    '👶 Naissance',
    '✈️ Voyage',
    '🎉 Autre'
  ];

  const availableChapters = [
    '👶 Enfance',
    '❤️ Amour',
    '👨‍👩‍👧‍👦 Famille',
    '👥 Amis',
    '⚽ Passions',
    '✈️ Voyages',
    '🎉 Fêtes',
    '🏖️ Lieux'
  ];

  const handleOccasionSelect = (occasion) => {
    setProjectData({ ...projectData, occasion });
  };

  const handleChapterToggle = (chapter) => {
    const chapters = projectData.chapters.includes(chapter)
      ? projectData.chapters.filter(c => c !== chapter)
      : [...projectData.chapters, chapter];
    setProjectData({ ...projectData, chapters });
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);

    try {
      const uploadedMedias = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('project_id', '776ea330-5060-4d7c-a094-2e08612b259');

        const response = await fetch(`${BACKEND_URL}/api/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        const data = await response.json();
        
        uploadedMedias.push({
          id: data.id,
          url: data.url,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          name: file.name
        });
      }

      setProjectData({
        ...projectData,
        medias: [...projectData.medias, ...uploadedMedias]
      });

      alert(`${uploadedMedias.length} fichier(s) uploadé(s) avec succès !`);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Erreur lors de l\'upload. Vérifiez votre connexion.');
    } finally {
      setUploading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Occasion', icon: '🎉' },
    { number: 2, title: 'Chapitres', icon: '📚' },
    { number: 3, title: 'Médias', icon: '📸' },
    { number: 4, title: 'Musique', icon: '🎵' },
    { number: 5, title: 'Dédicaces', icon: '💌' },
    { number: 6, title: 'Collaboration', icon: '👥' },
    { number: 7, title: 'Aperçu', icon: '👁️' },
    { number: 8, title: 'Paiement', icon: '💳' }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1e293b' }}>
              🎉 Quelle est l'occasion ?
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {occasions.map((occasion) => (
                <button
                  key={occasion}
                  onClick={() => handleOccasionSelect(occasion)}
                  style={{
                    padding: '1.5rem',
                    fontSize: '1.2rem',
                    border: projectData.occasion === occasion ? '3px solid #3b82f6' : '2px solid #e2e8f0',
                    borderRadius: '8px',
                    backgroundColor: projectData.occasion === occasion ? '#eff6ff' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    fontWeight: projectData.occasion === occasion ? 'bold' : 'normal'
                  }}
                >
                  {occasion}
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1e293b' }}>
              📚 Choisissez vos chapitres
            </h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              Sélectionnez les thèmes que vous souhaitez inclure dans votre vidéo
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {availableChapters.map((chapter) => (
                <button
                  key={chapter}
                  onClick={() => handleChapterToggle(chapter)}
                  style={{
                    padding: '1.5rem',
                    fontSize: '1.1rem',
                    border: projectData.chapters.includes(chapter) ? '3px solid #10b981' : '2px solid #e2e8f0',
                    borderRadius: '8px',
                    backgroundColor: projectData.chapters.includes(chapter) ? '#d1fae5' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    fontWeight: projectData.chapters.includes(chapter) ? 'bold' : 'normal'
                  }}
                >
                  {chapter}
                  {projectData.chapters.includes(chapter) && ' ✓'}
                </button>
              ))}
            </div>
            <p style={{ marginTop: '1rem', color: '#3b82f6', fontWeight: 'bold' }}>
              {projectData.chapters.length} chapitre(s) sélectionné(s)
            </p>
          </div>
        );

      case 3:
        return (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1e293b' }}>
              📸 Ajoutez vos photos et vidéos
            </h2>
            <div style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '8px',
              padding: '2rem',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              marginBottom: '1.5rem'
            }}>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                disabled={uploading}
                style={{ display: 'none' }}
                id="fileInput"
              />
              <label htmlFor="fileInput" style={{
                cursor: uploading ? 'not-allowed' : 'pointer',
                display: 'inline-block'
              }}>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1rem',
                  opacity: uploading ? 0.5 : 1
                }}>
                  📤
                </div>
                <p style={{ 
                  fontSize: '1.2rem', 
                  color: '#475569',
                  marginBottom: '0.5rem'
                }}>
                  {uploading ? 'Upload en cours...' : 'Cliquez pour ajouter des fichiers'}
                </p>
                <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                  Formats acceptés : JPEG, PNG, HEIC, MP4, MOV, AVI
                </p>
              </label>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '1rem'
            }}>
              {projectData.medias.map((media, index) => (
                <div key={index} style={{
                  position: 'relative',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#f1f5f9',
                  aspectRatio: '1'
                }}>
                  {media.type === 'image' ? (
                    <img
                      src={media.url}
                      alt={media.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <video
                      src={media.url}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  )}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: '#fff',
                    padding: '0.5rem',
                    fontSize: '0.75rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {media.name}
                  </div>
                </div>
              ))}
            </div>
            
            {projectData.medias.length > 0 && (
              <p style={{ marginTop: '1rem', color: '#10b981', fontWeight: 'bold' }}>
                ✅ {projectData.medias.length} fichier(s) uploadé(s)
              </p>
            )}
          </div>
        );

      case 4:
        return (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1e293b' }}>
              🎵 Choisissez votre musique
            </h2>
            <p style={{ color: '#64748b' }}>Fonctionnalité à venir...</p>
          </div>
        );

      case 5:
        return (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1e293b' }}>
              💌 Personnalisez vos dédicaces
            </h2>
            <p style={{ color: '#64748b' }}>Fonctionnalité à venir...</p>
          </div>
        );

      case 6:
        return (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1e293b' }}>
              👥 Invitez des collaborateurs
            </h2>
            <p style={{ color: '#64748b' }}>Fonctionnalité à venir...</p>
          </div>
        );

      case 7:
        return (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1e293b' }}>
              👁️ Aperçu de votre vidéo
            </h2>
            <p style={{ color: '#64748b' }}>Fonctionnalité à venir...</p>
          </div>
        );

      case 8:
        return (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1e293b' }}>
              💳 Finaliser et payer
            </h2>
            <p style={{ color: '#64748b' }}>Fonctionnalité à venir...</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', backgroundColor: '#f8fafc' }}>
      {/* Sidebar gauche - Étapes */}
      <div style={{
        width: '280px',
        backgroundColor: '#fff',
        padding: '2rem 1rem',
        borderRight: '1px solid #e2e8f0',
        overflowY: 'auto'
      }}>
        <h3 style={{ 
          fontSize: '1.2rem', 
          marginBottom: '1.5rem',
          color: '#1e293b',
          fontWeight: 'bold'
        }}>
          Étapes de création
        </h3>
        
        {steps.map((step) => (
          <div
            key={step.number}
            onClick={() => setCurrentStep(step.number)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '1rem',
              marginBottom: '0.5rem',
              borderRadius: '8px',
              backgroundColor: currentStep === step.number ? '#eff6ff' : 'transparent',
              border: currentStep === step.number ? '2px solid #3b82f6' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            <span style={{ 
              fontSize: '1.5rem', 
              marginRight: '0.75rem' 
            }}>
              {step.icon}
            </span>
            <div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#64748b',
                fontWeight: '500'
              }}>
                Étape {step.number}
              </div>
              <div style={{ 
                fontSize: '0.9rem',
                color: currentStep === step.number ? '#3b82f6' : '#1e293b',
                fontWeight: currentStep === step.number ? 'bold' : 'normal'
              }}>
                {step.title}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Zone centrale - Contenu */}
      <div style={{
        flex: 1,
        padding: '2rem',
        overflowY: 'auto'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {renderStepContent()}

          {/* Boutons de navigation */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '2rem',
            paddingTop: '2rem',
            borderTop: '1px solid #e2e8f0'
          }}>
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: currentStep === 1 ? '#e2e8f0' : '#fff',
                color: currentStep === 1 ? '#94a3b8' : '#475569',
                cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                border: '2px solid #e2e8f0'
              }}
            >
              ← Précédent
            </button>

            <button
              onClick={() => setCurrentStep(Math.min(8, currentStep + 1))}
              disabled={currentStep === 8}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: currentStep === 8 ? '#e2e8f0' : '#3b82f6',
                color: '#fff',
                cursor: currentStep === 8 ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              Suivant →
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar droite - Résumé */}
      <div style={{
        width: '320px',
        backgroundColor: '#fff',
        padding: '2rem 1rem',
        borderLeft: '1px solid #e2e8f0',
        overflowY: 'auto'
      }}>
        <h3 style={{
          fontSize: '1.2rem',
          marginBottom: '1.5rem',
          color: '#1e293b',
          fontWeight: 'bold'
        }}>
          📋 Résumé du projet
        </h3>

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>
            Occasion
          </h4>
          <p style={{ fontSize: '1rem', color: '#1e293b', fontWeight: 'bold' }}>
            {projectData.occasion || 'Non sélectionnée'}
          </p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>
            Chapitres
          </h4>
          <p style={{ fontSize: '1rem', color: '#1e293b' }}>
            {projectData.chapters.length > 0
              ? `${projectData.chapters.length} chapitre(s)`
              : 'Aucun chapitre sélectionné'}
          </p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>
            Médias
          </h4>
          <p style={{ fontSize: '1rem', color: '#1e293b' }}>
            {projectData.medias.length > 0
              ? `${projectData.medias.length} fichier(s)`
              : 'Aucun média uploadé'}
          </p>
        </div>

        <button
          style={{
            width: '100%',
            padding: '1rem',
            fontSize: '1rem',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: '#10b981',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginTop: '2rem'
          }}
        >
          💾 Sauvegarder
        </button>
      </div>
    </div>
  );
}

export default Editor;