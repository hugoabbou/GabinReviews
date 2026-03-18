'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        window.location.href = '/';
      } else {
        setError('Email ou mot de passe incorrect');
      }
    } catch {
      setError('Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f0f12',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Space+Grotesk:wght@600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .login-input {
          width: 100%;
          padding: 11px 14px;
          background: #21212b;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #eeedf4;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color .15s;
        }
        .login-input:focus { border-color: #4f7cff; }
        .login-btn {
          width: 100%;
          padding: 12px;
          background: #4f7cff;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background .15s;
        }
        .login-btn:hover:not(:disabled) { background: #3d6bff; }
        .login-btn:disabled { background: #2a2a36; color: #5a5968; cursor: not-allowed; }
      `}</style>

      <div style={{
        background: '#18181f',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: '36px 32px',
        width: 360,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 44, height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg,#4f7cff,#7c5cfc)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, margin: '0 auto 14px',
          }}>⭐</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 700, color: '#eeedf4' }}>ReviewsHub</div>
          <div style={{ fontSize: 13, color: '#7c7b89', marginTop: 4 }}>Connectez-vous à votre espace</div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: '#7c7b89', fontWeight: 500 }}>Nom d'utilisateur</label>
            <input
              className="login-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="identifiant"
              required
              autoComplete="username"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: '#7c7b89', fontWeight: 500 }}>Mot de passe</label>
            <input
              className="login-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8,
              fontSize: 13,
              color: '#ef4444',
            }}>
              {error}
            </div>
          )}

          <button className="login-btn" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
