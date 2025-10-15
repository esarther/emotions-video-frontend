import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Editor from './pages/Editor';
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/projects" element={<div className="p-8 text-center"><h1 className="text-3xl font-bold">Mes Projets - En construction</h1></div>} />
          <Route path="/login" element={<div className="p-8 text-center"><h1 className="text-3xl font-bold">Connexion - En construction</h1></div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;