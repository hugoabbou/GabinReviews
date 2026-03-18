'use client';

import React, { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    // 1. STOPPE le rechargement de la page
    e.preventDefault();
    e.stopPropagation();

    console.log("Bouton cliqué !");
    
    // 2. ENVOIE la requête
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        localStorage.setItem('reviewshub_logged', 'true');
        window.location.href = '/';
      } else {
        alert("Erreur : Identifiants incorrects (vérifie ton API)");
      }
    } catch (err) {
      alert("Erreur : Impossible de contacter l'API");
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff' }}>
      <form onSubmit={handleSubmit} style={{ background: '#111', padding: '30px', borderRadius: '12px', border: '1px solid #333', width: '320px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h2 style={{ textAlign: 'center' }}>ReviewsHub</h2>
        
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="Email" 
          required 
          style={{ padding: '12px', background: '#000', color: '#fff', border: '1px solid #333', borderRadius: '6px' }}
        />
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="Mot de passe" 
          required 
          style={{ padding: '12px', background: '#000', color: '#fff', border: '1px solid #333', borderRadius: '6px' }}
        />
        
        <button 
          type="submit" 
          style={{ padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Se connecter
        </button>
      </form>
    </div>
  );
}