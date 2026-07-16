import React, { useState } from 'react';
import { Language } from '../types';
import { Mail, Lock, UserCheck, ShieldAlert, Award, LogIn } from 'lucide-react';

interface AuthModalProps {
  onLoginSuccess: (userProfile: { uid: string; email: string; role: 'user' | 'moderator' | 'authority'; displayName?: string }) => void;
  lang: Language;
  t: Record<string, string>;
  onClose?: () => void;
}

export default function AuthModal({ onLoginSuccess, lang, t, onClose }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isRTL = lang === 'ar';

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    // Simple robust login simulation
    setTimeout(() => {
      if (!email.includes('@')) {
        setErrorMsg(isRTL ? "الرجاء إدخال بريد إلكتروني صالح." : "Veuillez entrer un email valide.");
        setLoading(false);
        return;
      }

      const role = email.includes('moderator') 
        ? 'moderator' 
        : email.includes('authority') || email.includes('protection')
        ? 'authority' 
        : 'user';

      onLoginSuccess({
        uid: 'user-' + Date.now(),
        email: email,
        role: role,
        displayName: email.split('@')[0].toUpperCase()
      });
      setLoading(false);
      if (onClose) onClose();
    }, 800);
  };

  // Demo direct login options for ease of use in the iframe
  const handleQuickLogin = (role: 'user' | 'moderator' | 'authority') => {
    let demoEmail = 'citizen.helper@firewatch.dz';
    if (role === 'moderator') demoEmail = 'volunteer.moderator@firewatch.dz';
    if (role === 'authority') demoEmail = 'civil.protection@firewatch.dz';

    onLoginSuccess({
      uid: `demo-${role}-${Date.now()}`,
      email: demoEmail,
      role: role,
      displayName: role.toUpperCase()
    });
    if (onClose) onClose();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-6 max-w-sm w-full mx-auto">
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center mb-3">
          <LogIn className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">{t.loginRegister}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {isRTL ? "قم بالاتصال للمشاركة في تأكيد ومراقبة الوضع." : "Connectez-vous pour participer au signalement actif."}
        </p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs p-3 rounded-xl border border-red-100 dark:border-red-900 mb-4 font-semibold">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Main Credentials form */}
      <form onSubmit={handleAuth} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">{t.email}</label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="email"
              required
              placeholder="e.g. name@firewatch.dz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500 dark:text-slate-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">{t.password}</label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500 dark:text-slate-200"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow transition"
        >
          {loading ? t.loading : t.loginRegister}
        </button>
      </form>

      {/* Quick Demo roles credentials switcher */}
      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
        <span className="block text-[10px] text-center font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
          ⚡ {t.loginAsDemo}
        </span>
        <div className="space-y-1.5">
          {/* Quick User */}
          <button
            type="button"
            onClick={() => handleQuickLogin('user')}
            className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-xs font-bold transition flex items-center justify-between"
          >
            <span className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              <span>{t.roleUser}</span>
            </span>
            <span className="text-[9px] font-mono opacity-80">citizen@firewatch.dz</span>
          </button>

          {/* Quick Moderator */}
          <button
            type="button"
            onClick={() => handleQuickLogin('moderator')}
            className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/30 text-amber-800 dark:text-amber-400 rounded-xl border border-amber-100 dark:border-amber-900/40 text-xs font-bold transition flex items-center justify-between"
          >
            <span className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>{t.roleModerator}</span>
            </span>
            <span className="text-[9px] font-mono opacity-80">volunteer@firewatch.dz</span>
          </button>

          {/* Quick Authority */}
          <button
            type="button"
            onClick={() => handleQuickLogin('authority')}
            className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-800 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/40 text-xs font-bold transition flex items-center justify-between"
          >
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{t.roleAuthority}</span>
            </span>
            <span className="text-[9px] font-mono opacity-80">protection@firewatch.dz</span>
          </button>
        </div>
      </div>
    </div>
  );
}
