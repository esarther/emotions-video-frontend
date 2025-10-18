import React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

export default function Home() {
  const navigate = useNavigate();

  const handleCreateProject = async () => {
    try {
      // 1️⃣ Crée un nouveau projet vide dans Supabase
      const { data, error } = await supabase
        .from("projects")
        .insert([{ title: "Nouveau projet", created_at: new Date() }])
        .select()
        .single();

      if (error) throw error;

      // 2️⃣ Récupère l’UUID et redirige vers l’éditeur
      const projectId = data.id;
      navigate(`/project/${projectId}/editor`);
    } catch (err) {
      console.error("Erreur création projet :", err.message);
      alert("Impossible de créer le projet, réessayez plus tard.");
    }
  };

  return (
    <div className="home-container">
      <h1 className="text-3xl font-bold mb-6">Bienvenue sur E-Motions Video</h1>
      <p className="mb-8">
        Créez une vidéo collaborative pour une occasion spéciale 🎉
      </p>
      <button
        onClick={handleCreateProject}
        className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
      >
        Créer ma vidéo
      </button>
    </div>
  );
}
