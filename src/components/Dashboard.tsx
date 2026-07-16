import { Wildfire, Language } from '../types';
import { Flame, TrendingUp, AlertTriangle, ShieldCheck, Activity, Award } from 'lucide-react';

interface DashboardProps {
  wildfires: Wildfire[];
  satelliteHotspots: any[];
  lang: Language;
  t: Record<string, string>;
}

export default function Dashboard({ wildfires, satelliteHotspots, lang, t }: DashboardProps) {
  const isRTL = lang === 'ar';

  // Stats calculation
  const totalFires = wildfires.length;
  const activeFires = wildfires.filter(f => f.status === 'Active').length;
  const controlledFires = wildfires.filter(f => f.status === 'Controlled').length;
  const extinguishedFires = wildfires.filter(f => f.status === 'Extinguished').length;

  const totalBurnedArea = wildfires.reduce((acc, f) => acc + (f.burnedArea || 0), 0);
  
  // Fires today: reported in the last 24 hours
  const firesToday = wildfires.filter(f => {
    const hoursSinceCreated = (Date.now() - new Date(f.createdAt).getTime()) / 3600000;
    return hoursSinceCreated <= 24;
  }).length;

  // Most affected Wilayas calculation
  const wilayaStats: Record<string, { count: number; area: number }> = {};
  wildfires.forEach(f => {
    if (!wilayaStats[f.wilaya]) {
      wilayaStats[f.wilaya] = { count: 0, area: 0 };
    }
    wilayaStats[f.wilaya].count += 1;
    if (f.status === 'Active') {
      wilayaStats[f.wilaya].area += (f.burnedArea || 0);
    }
  });

  const topWilayas = Object.entries(wilayaStats)
    .map(([name, stat]) => ({ name, count: stat.count, area: stat.area }))
    .sort((a, b) => b.count - a.count || b.area - a.area)
    .slice(0, 5);

  // Severe and Critical fires
  const criticalCount = wildfires.filter(f => f.severity === 'Critical').length;
  const highCount = wildfires.filter(f => f.severity === 'High').length;
  const mediumCount = wildfires.filter(f => f.severity === 'Medium').length;
  const lowCount = wildfires.filter(f => f.severity === 'Low').length;

  return (
    <div id="dashboard_panel_wrapper" className="space-y-6">
      {/* Dynamic Key Indicators Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Active Fires */}
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 p-5 rounded-2xl flex items-center gap-4 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1.5 bg-rose-500"></div>
          <div className="p-3 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">{t.activeFires}</p>
            <h3 className="text-2xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-1">{activeFires}</h3>
          </div>
        </div>

        {/* Stat 2: Controlled & Extinguished */}
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 p-5 rounded-2xl flex items-center gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1.5 bg-orange-500"></div>
          <div className="p-3 bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">{t.controlledFires}</p>
            <h3 className="text-2xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-1">{controlledFires}</h3>
          </div>
        </div>

        {/* Stat 3: Burned Area */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 p-5 rounded-2xl flex items-center gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1.5 bg-amber-500"></div>
          <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">{t.totalBurnedArea}</p>
            <h3 className="text-2xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-1">
              {totalBurnedArea} <span className="text-xs font-sans font-normal text-slate-500">{t.hectares}</span>
            </h3>
          </div>
        </div>

        {/* Stat 4: Fires Today */}
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-5 rounded-2xl flex items-center gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1.5 bg-emerald-500"></div>
          <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{t.firesToday}</p>
            <h3 className="text-2xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-1">{firesToday}</h3>
          </div>
        </div>
      </div>

      {/* Analytics Charts & Most Affected Wilayas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Fires by Status (SVG-based donut) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-4">{t.firesByStatus}</h4>
          
          <div className="flex flex-col items-center justify-center py-4">
            {totalFires === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500">{t.noActiveFires}</p>
            ) : (
              <>
                {/* SVG Semi-Donut or Pie representation */}
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" strokeWidth="3" className="dark:stroke-slate-800" />
                    
                    {/* Active Slice */}
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="3.2"
                      strokeDasharray={`${(activeFires / totalFires) * 100} ${100 - (activeFires / totalFires) * 100}`}
                      strokeDashoffset="0"
                    />
                    
                    {/* Controlled Slice */}
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="3.2"
                      strokeDasharray={`${(controlledFires / totalFires) * 100} ${100 - (controlledFires / totalFires) * 100}`}
                      strokeDashoffset={`-${(activeFires / totalFires) * 100}`}
                    />

                    {/* Extinguished Slice */}
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3.2"
                      strokeDasharray={`${(extinguishedFires / totalFires) * 100} ${100 - (extinguishedFires / totalFires) * 100}`}
                      strokeDashoffset={`-${((activeFires + controlledFires) / totalFires) * 100}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold font-mono text-slate-800 dark:text-slate-100">{totalFires}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{t.totalFires}</span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="grid grid-cols-3 gap-2 w-full mt-6 text-center text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <div className="flex flex-col items-center">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500"></span>{t.active}</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 mt-1">{activeFires}</span>
                  </div>
                  <div className="flex flex-col items-center border-x border-slate-100 dark:border-slate-800 px-1">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500"></span>{t.controlled}</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 mt-1">{controlledFires}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"></span>{t.extinguished}</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 mt-1">{extinguishedFires}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Chart 2: Severity distribution bars */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-4">{t.firesBySeverity}</h4>
          
          <div className="space-y-4 py-1">
            {/* Critical Row */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-red-700 dark:text-red-400">{t.critical}</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{criticalCount}</span>
              </div>
              <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-600 rounded-full transition-all duration-500"
                  style={{ width: `${totalFires ? (criticalCount / totalFires) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* High Row */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-orange-600 dark:text-orange-400">{t.high}</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{highCount}</span>
              </div>
              <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${totalFires ? (highCount / totalFires) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Medium Row */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-amber-500 dark:text-amber-400">{t.medium}</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{mediumCount}</span>
              </div>
              <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${totalFires ? (mediumCount / totalFires) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Low Row */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-emerald-600 dark:text-emerald-400">{t.low}</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{lowCount}</span>
              </div>
              <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${totalFires ? (lowCount / totalFires) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Most affected Wilayas leaderboard */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-4">{t.mostAffectedWilayas}</h4>
          
          <div className="space-y-3">
            {topWilayas.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">{t.noActiveFires}</p>
            ) : (
              topWilayas.map((wilaya, index) => (
                <div 
                  key={wilaya.name} 
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold font-mono">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{wilaya.name}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        {wilaya.count} {lang === 'ar' ? "بلاغات مسجلة" : "signalements"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-red-600 dark:text-red-400 font-mono">
                      {wilaya.area} <span className="text-[10px] font-sans font-normal text-slate-400">ha</span>
                    </p>
                    <p className="text-[9px] text-slate-400 font-mono">
                      {lang === 'ar' ? "مساحة محروقة" : "zone brûlée"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Satellite hot spots section */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10">
          <svg className="w-64 h-64 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
          </svg>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-3.5 w-3.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
            </span>
            <h4 className="text-base font-bold text-slate-100">{t.satelliteHotspots} (NASA FIRMS / Copernicus)</h4>
          </div>
          <span className="bg-red-500/20 text-red-400 text-[10px] uppercase font-bold px-3 py-1 rounded-full border border-red-500/30">
            📡 LIVE TELEMETRY
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl mb-6">
          {t.satelliteIntro}
        </p>

        {/* Hotspot grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {satelliteHotspots.map((spot, index) => (
            <div key={spot.id || index} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-mono text-slate-400 font-bold">📍 {spot.lat.toFixed(3)}, {spot.lng.toFixed(3)}</span>
                <span className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded font-semibold border border-red-500/20">
                  {spot.sensor}
                </span>
              </div>
              <h5 className="font-bold text-slate-200 text-sm mb-1">{spot.wilaya}</h5>
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-900 text-[11px] text-slate-400">
                <div>
                  <span className="block text-[10px] text-slate-500">Confidence</span>
                  <span className="font-bold text-red-500 font-mono">{spot.confidence}%</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500">Temp</span>
                  <span className="font-bold text-amber-500 font-mono">{Math.round(spot.brightness - 273.15)}°C</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
