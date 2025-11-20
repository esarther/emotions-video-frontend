import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Video, FolderOpen, User } from 'lucide-react';

function Navbar() {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Video className="w-8 h-8 text-purple-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              E-Motions Video
            </span>
          </Link>

          {/* Navigation principale */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg transition ${
                isActive('/') 
                  ? 'bg-purple-50 text-purple-600 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Accueil
            </Link>
            
            <Link
              to="/editor"
              className={`px-4 py-2 rounded-lg transition flex items-center space-x-2 ${
                isActive('/editor') 
                  ? 'bg-purple-50 text-purple-600 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Video size={18} />
              <span>Éditeur</span>
            </Link>
            
            <Link
              to="/projects"
              className={`px-4 py-2 rounded-lg transition flex items-center space-x-2 ${
                isActive('/projects') 
                  ? 'bg-purple-50 text-purple-600 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FolderOpen size={18} />
              <span>Mes Projets</span>
            </Link>
          </div>

          {/* Boutons utilisateur */}
          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="hidden sm:flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition"
            >
              <User size={18} />
              <span>Connexion</span>
            </Link>
            
            <Link
              to="/editor"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:opacity-90 transition font-medium"
            >
              Créer une vidéo
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;