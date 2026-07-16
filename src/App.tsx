import { useState, useEffect } from 'react';
import { Wildfire, Language, Theme, NotificationAlert } from './types';
import { translations } from './lib/translations';

// Subcomponents
import MapComponent from './components/MapComponent';
import Dashboard from './components/Dashboard';
import ReportForm from './components/ReportForm';
import VerificationPortal from './components/VerificationPortal';
import EmergencyPage from './components/EmergencyPage';
import AuthModal from './components/AuthModal';

// Lucide Icons
import { 
  Flame, 
  Map, 
  BarChart3, 
  AlertOctagon, 
  ShieldCheck, 
  PhoneCall, 
  User, 
  LogOut, 
  Sun, 
  Moon, 
  Globe, 
  Compass,
  WifiOff,
  Bell,
  Check,
  X
} from 'lucide-react';

export default function App() {
  // Locale / Language State
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('firewatch_lang') as Language) || 'ar';
  });

  // Theme State
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('firewatch_theme') as Theme) || 'dark';
  });

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'map' | 'report' | 'dashboard' | 'moderation' | 'emergency'>('map');

  // Database / Data States
  const [wildfires, setWildfires] = useState<Wildfire[]>([]);
  const [satelliteHotspots, setSatelliteHotspots] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<NotificationAlert[]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeframeFilter, setTimeframeFilter] = useState<string>('all');

  // User Profile Auth Simulation
  const [userProfile, setUserProfile] = useState<{
    uid: string;
    email: string;
    role: 'user' | 'moderator' | 'authority';
    displayName?: string;
  } | null>(() => {
    const saved = localStorage.getItem('firewatch_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedFireForMap, setSelectedFireForMap] = useState<Wildfire | null>(null);

  // In-app Notification Banner overlays
  const [alertBanners, setAlertBanners] = useState<any[]>([]);

  const t = translations[lang];
  const isRTL = lang === 'ar';

  // Apply visual theme to Document root (Dark/Light mode)
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('firewatch_theme', theme);
  }, [theme]);

  // Persist language option
  useEffect(() => {
    localStorage.setItem('firewatch_lang', lang);
  }, [lang]);

  // Monitor Network Connectivity & Auto Offline Upload Sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      triggerOfflineSync();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (navigator.onLine) {
      triggerOfflineSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch all fires, alerts and satellite hotspot markers from Express APIs
  const fetchAllData = async () => {
    try {
      const firesRes = await fetch('/api/wildfires');
      if (firesRes.ok) {
        const firesData = await firesRes.json();
        setWildfires(firesData);
      }

      const hotRes = await fetch('/api/satellite-hotspots');
      if (hotRes.ok) {
        const hotData = await hotRes.json();
        setSatelliteHotspots(hotData);
      }

      const notifRes = await fetch('/api/notifications');
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData);
      }
    } catch (err) {
      console.warn("Express backend disconnected or not ready, falling back to local storage models:", err);
    }
  };

  // Run fetch initially and set live polling loop (5 seconds for mock hot updates without refresh)
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      fetchAllData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Triggers offline local reports upload sync automatically when internet restores
  const triggerOfflineSync = async () => {
    const saved = localStorage.getItem('offline_reports');
    if (!saved) return;

    try {
      const list: any[] = JSON.parse(saved);
      if (list.length === 0) return;

      console.log(`[Offline Sync] Restoring ${list.length} pending reports to Express backend...`);

      for (const report of list) {
        await fetch('/api/wildfires', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: report.lat,
            lng: report.lng,
            wilaya: report.wilaya,
            commune: report.commune,
            severity: report.severity,
            description: report.description,
            imageUrl: report.imageUrl,
            reporterId: report.reporterId,
            reporterEmail: report.reporterEmail
          })
        });
      }

      // Clear local queue
      localStorage.removeItem('offline_reports');
      fetchAllData();

      // Show beautiful success notification
      addBannerAlert(
        lang === 'ar' ? "تزامن البيانات" : "Synchronisation",
        lang === 'ar' ? "تم بنجاح رفع كل التبليغات المسجلة في وضع عدم الاتصال!" : "Tous les rapports hors ligne ont été synchronisés !"
      );

    } catch (err) {
      console.error("[Offline Sync] Failed to synchronize:", err);
    }
  };

  // Helper to add custom alerts banners floating on screen
  const addBannerAlert = (title: string, message: string) => {
    const id = Date.now() + Math.random();
    setAlertBanners(prev => [...prev, { id, title, message }]);
    setTimeout(() => {
      setAlertBanners(prev => prev.filter(b => b.id !== id));
    }, 6000);
  };

  // Citizen report created
  const handleReportSubmitted = (newFire: any) => {
    fetchAllData();
    // Prompt alert banner
    addBannerAlert(
      isRTL ? "تم تسجيل البلاغ" : "Signalement Enregistré",
      isRTL 
        ? `شكراً لمساعدتك. تم حفظ بلاغك لبلدية ${newFire.commune} (${newFire.wilaya}) قيد المراجعة.`
        : `Merci pour votre aide. Rapport pour ${newFire.commune} (${newFire.wilaya}) en attente.`
    );
    setActiveTab('map');
  };

  // Moderator / volunteer approved report
  const handleVerifyReport = async (id: string) => {
    try {
      const res = await fetch(`/api/wildfires/${id}/verify`, { method: 'POST' });
      if (res.ok) {
        addBannerAlert(
          isRTL ? "تم تأكيد البلاغ" : "Signalement Confirmé",
          isRTL ? "تم نشر بؤرة الحريق للعامة للتحذير والإنقاذ." : "Le foyer de feu a été publié publiquement."
        );
        fetchAllData();
      }
    } catch (err) {
      console.error("Verification update failed", err);
    }
  };

  // Moderator / volunteer rejected / deleted report
  const handleRejectReport = async (id: string) => {
    try {
      const res = await fetch(`/api/wildfires/${id}`, { method: 'DELETE' });
      if (res.ok) {
        addBannerAlert(
          isRTL ? "تم الرفض" : "Signalement Rejeté",
          isRTL ? "تم حذف التبليغ الخاطئ من النظام." : "Le signalement erroné a été supprimé."
        );
        fetchAllData();
      }
    } catch (err) {
      console.error("Rejection action failed", err);
    }
  };

  // Rescue Authorities updated fire status
  const handleUpdateStatus = async (id: string, status: any, burnedArea: number) => {
    try {
      const res = await fetch(`/api/wildfires/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, burnedArea })
      });
      if (res.ok) {
        addBannerAlert(
          isRTL ? "تم تحديث الحالة" : "Statut Mis à jour",
          isRTL ? "تم بنجاح تعديل الوضع والمساحة المتضررة." : "Superficie et statut mis à jour avec succès."
        );
        fetchAllData();
      }
    } catch (err) {
      console.error("Status update failed", err);
    }
  };

  // Rescue Authorities broadcasted regional alert
  const handleBroadcastAlert = async (wilaya: string, title: string, message: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wilaya, title, message })
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error("Failed to broadcast notification", err);
    }
  };

  const handleLoginSuccess = (profile: any) => {
    setUserProfile(profile);
    localStorage.setItem('firewatch_user', JSON.stringify(profile));
    addBannerAlert(
      isRTL ? "تم تسجيل الدخول" : "Connexion Réussie",
      isRTL ? `مرحباً بك مجدداً ${profile.displayName}` : `Ravi de vous revoir ${profile.displayName}`
    );
  };

  const handleLogout = () => {
    setUserProfile(null);
    localStorage.removeItem('firewatch_user');
    addBannerAlert(
      isRTL ? "تم تسجيل الخروج" : "Déconnexion",
      isRTL ? "إلى اللقاء، رافقتك السلامة." : "Au revoir, restez en sécurité."
    );
  };

  // Filter and search calculations
  const filteredWildfires = wildfires.filter(fire => {
    // Only display verified fires to normal users, moderators and authorities can see unverified ones too in lists
    const isVisibleRole = userProfile?.role === 'moderator' || userProfile?.role === 'authority';
    if (!fire.isVerified && !isVisibleRole) {
      return false;
    }

    // Search query matches
    const matchesSearch = 
      fire.wilaya.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fire.commune.toLowerCase().includes(searchQuery.toLowerCase());

    // Status matching
    const matchesStatus = statusFilter === 'all' || fire.status === statusFilter;

    // Timeframe matching
    let matchesTime = true;
    if (timeframeFilter === 'last24h') {
      const hours = (Date.now() - new Date(fire.createdAt).getTime()) / 3600000;
      matchesTime = hours <= 24;
    } else if (timeframeFilter === 'last7days') {
      const days = (Date.now() - new Date(fire.createdAt).getTime()) / (3600000 * 24);
      matchesTime = days <= 7;
    }

    return matchesSearch && matchesStatus && matchesTime;
  });

  return (
    <div 
      dir={isRTL ? 'rtl' : 'ltr'} 
      className={`min-h-screen transition-colors duration-200 flex flex-col font-sans ${
        theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Banner alert overlays (Push notifications simulate) */}
      <div className="fixed top-4 left-4 right-4 z-[9999] space-y-2 pointer-events-none max-w-lg mx-auto">
        {alertBanners.map(banner => (
          <div 
            key={banner.id}
            className="pointer-events-auto bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-red-500/30 flex items-start gap-3 animate-slide-in relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 h-full w-1 bg-red-600"></div>
            <div className="p-1.5 bg-red-500/10 text-red-500 rounded-lg shrink-0">
              <Bell className="w-4 h-4 animate-swing" />
            </div>
            <div className="flex-1 space-y-0.5">
              <h5 className="font-bold text-xs text-red-400">{banner.title}</h5>
              <p className="text-[11px] text-slate-200 leading-relaxed">{banner.message}</p>
            </div>
            <button 
              onClick={() => setAlertBanners(prev => prev.filter(b => b.id !== banner.id))}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Main App Navigation Header */}
      <header className="sticky top-0 z-[1001] bg-white/90 dark:bg-slate-900/95 backdrop-blur border-b border-slate-100 dark:border-slate-800 shadow-sm px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-500/20">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-white text-base leading-tight tracking-tight">
                {t.appName}
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                {lang === 'ar' ? "الرصد والإنذار المبكر للحرائق بالجزائر" : "Surveillance précoce en Algérie"}
              </p>
            </div>
          </div>

          {/* Quick Info & Actions Row */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Offline Mode Indicator */}
            {isOffline && (
              <span className="bg-amber-500/10 text-amber-500 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-amber-500/20 flex items-center gap-1">
                <WifiOff className="w-3 h-3" />
                <span className="hidden sm:inline">{t.offlineIndicator}</span>
              </span>
            )}

            {/* Language Selector */}
            <div className="relative group">
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 flex items-center gap-1.5 text-xs font-semibold">
                <Globe className="w-4 h-4" />
                <span className="uppercase">{lang}</span>
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden hidden group-hover:block z-50 text-xs min-w-[100px]">
                <button onClick={() => setLang('ar')} className="w-full text-right px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold block">العربية</button>
                <button onClick={() => setLang('fr')} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold block">Français</button>
                <button onClick={() => setLang('en')} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold block">English</button>
              </div>
            </div>

            {/* Visual Theme Selector */}
            <button 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Simulated Auth User Switcher or trigger */}
            {userProfile ? (
              <div className="flex items-center gap-1.5">
                {/* Role badges */}
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{userProfile.displayName}</p>
                  <span className="text-[9px] bg-red-600/10 text-red-500 font-extrabold px-1.5 py-0.5 rounded-full uppercase">
                    {userProfile.role}
                  </span>
                </div>
                
                {/* Easy role cycler for preview testing */}
                <select
                  value={userProfile.role}
                  onChange={(e) => {
                    const newRole = e.target.value as any;
                    const updated = { ...userProfile, role: newRole };
                    setUserProfile(updated);
                    localStorage.setItem('firewatch_user', JSON.stringify(updated));
                    addBannerAlert(
                      isRTL ? "تم تغيير الصلاحيات" : "Rôle Modifié",
                      `Simulation: ${newRole}`
                    );
                  }}
                  className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold py-1 px-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="user">Citizen</option>
                  <option value="moderator">Moderator</option>
                  <option value="authority">Rescue Authority</option>
                </select>

                <button 
                  onClick={handleLogout}
                  className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl"
                  title={t.logout}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>{t.loginRegister}</span>
              </button>
            )}

          </div>
        </div>
      </header>

      {/* Main layout container splitting navbar with content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm space-y-1">
            <button
              onClick={() => { setActiveTab('map'); setSelectedFireForMap(null); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'map'
                  ? 'bg-red-600 text-white shadow-md shadow-red-500/10'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950'
              }`}
            >
              <Map className="w-4.5 h-4.5" />
              <span>{t.activeFiresMap}</span>
            </button>

            <button
              onClick={() => setActiveTab('report')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'report'
                  ? 'bg-red-600 text-white shadow-md shadow-red-500/10'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950'
              }`}
            >
              <AlertOctagon className="w-4.5 h-4.5" />
              <span>{t.reportFire}</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'dashboard'
                  ? 'bg-red-600 text-white shadow-md shadow-red-500/10'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950'
              }`}
            >
              <BarChart3 className="w-4.5 h-4.5" />
              <span>{t.dashboard}</span>
            </button>

            {/* Moderation section only active or highlights for mod roles */}
            <button
              onClick={() => setActiveTab('moderation')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'moderation'
                  ? 'bg-red-600 text-white shadow-md shadow-red-500/10'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950'
              }`}
            >
              <span className="flex items-center gap-3">
                <ShieldCheck className="w-4.5 h-4.5" />
                <span>{t.moderation}</span>
              </span>
              {wildfires.filter(f => !f.isVerified).length > 0 && (
                <span className="bg-amber-500 text-slate-900 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {wildfires.filter(f => !f.isVerified).length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('emergency')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'emergency'
                  ? 'bg-red-600 text-white shadow-md shadow-red-500/10'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950'
              }`}
            >
              <PhoneCall className="w-4.5 h-4.5" />
              <span>{t.emergency}</span>
            </button>
          </div>

          {/* Quick List / Search sidebar (only on Map view to keep it unified) */}
          {activeTab === 'map' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm space-y-3">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-red-500 animate-pulse" />
                <span>{isRTL ? "مراقبة البؤر النشطة" : "Foyers d'incendie"}</span>
              </h4>

              {/* Dynamic search and filters */}
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500 dark:text-slate-100"
              />

              <div className="grid grid-cols-2 gap-1.5">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400"
                >
                  <option value="all">{isRTL ? "كل الحالات" : "Tous"}</option>
                  <option value="Active">{t.active}</option>
                  <option value="Controlled">{t.controlled}</option>
                  <option value="Extinguished">{t.extinguished}</option>
                </select>

                <select
                  value={timeframeFilter}
                  onChange={(e) => setTimeframeFilter(e.target.value)}
                  className="p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400"
                >
                  <option value="all">{t.allTime}</option>
                  <option value="last24h">{t.last24h}</option>
                  <option value="last7days">{t.last7days}</option>
                </select>
              </div>

              {/* Small scroll list of filtered fires */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {filteredWildfires.length === 0 ? (
                  <p className="text-[10px] text-slate-400 text-center py-4">{t.noActiveFires}</p>
                ) : (
                  filteredWildfires.map(fire => {
                    let pillColor = 'bg-red-500/10 text-red-500 border-red-500/20';
                    if (fire.status === 'Controlled') pillColor = 'bg-orange-500/10 text-orange-500 border-orange-500/20';
                    if (fire.status === 'Extinguished') pillColor = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';

                    return (
                      <button
                        key={fire.id}
                        onClick={() => setSelectedFireForMap(fire)}
                        className={`w-full text-right p-2.5 rounded-xl border transition text-xs block text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950 ${
                          selectedFireForMap?.id === fire.id
                            ? 'border-red-500 bg-red-50/20'
                            : 'border-slate-100 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{fire.wilaya}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${pillColor}`}>
                            {t[fire.status.toLowerCase()] || fire.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{fire.commune} - {fire.description}</p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Alert broadcast widget / Notifications Feed panel */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-amber-500" />
              <span>{t.recentNotifications}</span>
            </h4>
            <div className="space-y-2 max-h-[160px] overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-[10px] text-slate-400 text-center py-2">لا توجد تنبيهات حالية.</p>
              ) : (
                notifications.map(notif => (
                  <div key={notif.id} className="p-2.5 bg-red-500/5 rounded-xl border border-red-500/10 text-[11px] leading-relaxed">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-bold text-red-600 dark:text-red-400">{notif.wilaya}</span>
                      <span className="text-[9px] text-slate-400">
                        {new Date(notif.createdAt).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{notif.title}</p>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{notif.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Display panel based on tab */}
        <div className="lg:col-span-3 h-full flex flex-col">
          {activeTab === 'map' && (
            <MapComponent
              wildfires={filteredWildfires}
              satelliteHotspots={satelliteHotspots}
              onSelectCoordinates={(lat, lng) => {
                setActiveTab('report');
                // Auto capture in report form coordinates
                const form = document.querySelector('form');
                if (form) {
                  const latInput = form.querySelector('input[type="number"]:first-of-type') as HTMLInputElement;
                  const lngInput = form.querySelector('input[type="number"]:last-of-type') as HTMLInputElement;
                  if (latInput && lngInput) {
                    latInput.value = String(lat);
                    lngInput.value = String(lng);
                  }
                }
              }}
              lang={lang}
              selectedFire={selectedFireForMap}
              onSelectFire={(fire) => setSelectedFireForMap(fire)}
              t={t}
            />
          )}

          {activeTab === 'report' && (
            <ReportForm
              onReportSubmitted={handleReportSubmitted}
              lang={lang}
              t={t}
              userProfile={userProfile}
            />
          )}

          {activeTab === 'dashboard' && (
            <Dashboard
              wildfires={wildfires}
              satelliteHotspots={satelliteHotspots}
              lang={lang}
              t={t}
            />
          )}

          {activeTab === 'moderation' && (
            <VerificationPortal
              wildfires={wildfires}
              onVerifyReport={handleVerifyReport}
              onRejectReport={handleRejectReport}
              onUpdateStatus={handleUpdateStatus}
              onBroadcastAlert={handleBroadcastAlert}
              userRole={userProfile?.role || 'user'}
              lang={lang}
              t={t}
            />
          )}

          {activeTab === 'emergency' && (
            <EmergencyPage
              lang={lang}
              t={t}
            />
          )}
        </div>

      </main>

      {/* Auth Modal Trigger wrapper */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-900 dark:hover:text-white z-50 p-1 bg-slate-50 dark:bg-slate-800 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
            <AuthModal
              onLoginSuccess={handleLoginSuccess}
              lang={lang}
              t={t}
              onClose={() => setShowAuthModal(false)}
            />
          </div>
        </div>
      )}

      {/* Humble Footer containing licensing */}
      <footer className="border-t border-slate-100 dark:border-slate-800 py-4 px-6 text-center text-[11px] text-slate-400 dark:text-slate-500 mt-auto bg-white/50 dark:bg-slate-950/20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Algeria Fire Watch. All Rights Reserved.</p>
          <p>{lang === 'ar' ? "صنع بمسؤولية لحماية أرواح وغابات الجزائر" : "Conçu avec responsabilité pour sauver les forêts et vies en Algérie."}</p>
        </div>
      </footer>
    </div>
  );
}
