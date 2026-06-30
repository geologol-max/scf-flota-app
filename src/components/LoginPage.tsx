import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Truck, Lock, Mail, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

interface LoginPageProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  error: string | null;
  loading: boolean;
}

export default function LoginPage({ onSignIn, error, loading }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    await onSignIn(email.trim(), password);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" id="login-page">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="bg-slate-950 border-b border-slate-800 p-8 text-center">
            <div className="w-14 h-14 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Truck className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">SCF Flota</h1>
            <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mt-1">
              Sistema de Control de Flota
            </p>
          </div>

          {/* Form */}
          <div className="p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-sm font-semibold text-slate-200">Iniciar Sesión</h2>
              <p className="text-xs text-slate-500 mt-1">
                Ingresa tus credenciales de acceso al sistema
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" id="login-form">

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@empresa.cl"
                    required
                    autoComplete="email"
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg pl-10 pr-4 py-3 placeholder:text-slate-600 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="login-password" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg pl-10 pr-10 py-3 placeholder:text-slate-600 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    id="toggle-password-visibility"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-start gap-2.5 bg-rose-950/50 border border-rose-900 rounded-lg p-3"
                  id="login-error-message"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
                </motion.div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !email.trim() || !password.trim()}
                id="login-submit-btn"
                className="w-full bg-white hover:bg-slate-100 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-bold text-sm py-3 rounded-lg transition-all flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Ingresar al sistema'
                )}
              </button>
            </form>

            {/* Footer note */}
            <p className="text-center text-[11px] text-slate-600 leading-relaxed">
              Acceso restringido a personal autorizado.<br />
              ¿Sin acceso? Contacta al administrador del sistema.
            </p>
          </div>
        </div>

        {/* Bottom tag */}
        <p className="text-center text-[10px] text-slate-700 mt-4 font-mono uppercase tracking-widest">
          SCF © 2026 · Acceso seguro
        </p>
      </motion.div>
    </div>
  );
}
