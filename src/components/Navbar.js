// src/components/Navbar.js - VERSION CORRIGÉE
import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav style={{
      backgroundColor: '#1e293b',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <h1 style={{ 
          color: '#fff', 
          margin: 0,
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}>
          🎬 E-Motions Video
        </h1>
      </Link>
      
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link to="/" style={{
          color: '#fff',
          textDecoration: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          transition: 'background-color 0.3s'
        }}>
          Accueil
        </Link>
        <Link to="/editor" style={{
          color: '#fff',
          textDecoration: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          backgroundColor: '#3b82f6',
          transition: 'background-color 0.3s'
        }}>
          Créer ma vidéo
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;