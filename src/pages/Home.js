import React from 'react';
import { Link } from 'react-router-dom';
import { Video, Zap, Users, Download, Play } from 'lucide-react';

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-5xl mx-auto">
          
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-full px-5 py-2 mb-8 border border-white border-opacity-30">
            <Video className="w-5 h-5 text-pink-200" />
            <span className="text-white text-sm font-semibold tracking-wide">Plateforme collaborative de montage vidéo</span>
          </div>
          
          {/* Titre principal */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold mb-8 text-white leading-tight">
            E-Motions Video
          </h1>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-pink-100">
            Créez des vidéos époustouflantes
          </h2>
          
          {/* Sous-titre */}
          <p className="text-xl md:text-2xl text-purple-100 mb-12 leading-relaxed max-w-3xl mx-auto">
            Montage automatisé de photos et vidéos pour toutes vos occasions.
            <br />
            <span className="text-pink-200 font-semibold">Exportez vers Final Cut Pro</span> pour votre touche personnelle.
          </p>

          {/* Boutons CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-20">
            <Link 
              to="/editor"
              className="group bg-white text-purple-700 px-10 py-5 rounded-2xl hover:bg-pink-50 transition-all font-bold text-xl shadow-2xl hover:shadow-pink-500/50 hover:scale-105 transform duration-300 flex items-center space-x-3"
            >
              <Play className="w-6 h-6" />
              <span>Créer ma vidéo</span>
            </Link>
            
            <button className="bg-purple-700 bg-opacity-40 backdrop-blur-md text-white px-10 py-5 rounded-2xl hover:bg-opacity-60 transition-all font-bold text-xl border-2 border-white border-opacity-30 hover:border-opacity-50">
              En savoir plus
            </button>
          </div>

          {/* Grille de fonctionnalités */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
            
            {/* Card 1 - Montage Automatisé */}
            <div className="group bg-white bg-opacity-15 backdrop-blur-lg rounded-3xl p-10 hover:bg-opacity-25 transition-all duration-300 border border-white border-opacity-30 hover:border-opacity-50 transform hover:scale-105 hover:-translate-y-2">
              <div className="bg-gradient-to-br from-pink-400 to-purple-500 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-2xl group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Montage Automatisé</h3>
              <p className="text-purple-100 text-lg leading-relaxed">
                Notre IA crée automatiquement vos vidéos à partir de vos photos et vidéos
              </p>
            </div>

            {/* Card 2 - Collaboration */}
            <div className="group bg-white bg-opacity-15 backdrop-blur-lg rounded-3xl p-10 hover:bg-opacity-25 transition-all duration-300 border border-white border-opacity-30 hover:border-opacity-50 transform hover:scale-105 hover:-translate-y-2">
              <div className="bg-gradient-to-br from-purple-400 to-indigo-500 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-2xl group-hover:scale-110 transition-transform duration-300">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Collaboration</h3>
              <p className="text-purple-100 text-lg leading-relaxed">
                Invitez vos proches à contribuer avec leurs souvenirs en temps réel
              </p>
            </div>

            {/* Card 3 - Export Final Cut */}
            <div className="group bg-white bg-opacity-15 backdrop-blur-lg rounded-3xl p-10 hover:bg-opacity-25 transition-all duration-300 border border-white border-opacity-30 hover:border-opacity-50 transform hover:scale-105 hover:-translate-y-2">
              <div className="bg-gradient-to-br from-pink-400 to-red-500 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-2xl group-hover:scale-110 transition-transform duration-300">
                <Download className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Export Final Cut</h3>
              <p className="text-purple-100 text-lg leading-relaxed">
                Exportez vers Final Cut Pro pour peaufiner votre création
              </p>
            </div>

          </div>

          {/* Section Occasions */}
          <div className="mt-32 bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-12 border border-white border-opacity-30">
            <h3 className="text-3xl font-bold text-white mb-8">Pour toutes vos occasions</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {['🎂 Anniversaire', '💒 Mariage', '👋 Départ/Retraite', '👶 Naissance', '✈️ Voyage', '🎉 Fête'].map((occasion, index) => (
                <div 
                  key={index}
                  className="bg-white bg-opacity-20 backdrop-blur-sm px-6 py-3 rounded-full text-white font-semibold text-lg border border-white border-opacity-30 hover:bg-opacity-30 transition-all cursor-pointer hover:scale-105 transform duration-200"
                >
                  {occasion}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Home;