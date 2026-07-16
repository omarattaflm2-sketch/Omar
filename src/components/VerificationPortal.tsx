import React, { useState } from 'react';
import { Wildfire, Language, FireStatus } from '../types';
import { Check, Trash2, Edit, AlertCircle, Send, ShieldAlert, BadgeCheck } from 'lucide-react';
import { ALGERIA_WILAYAS } from '../lib/translations';

interface VerificationPortalProps {
  wildfires: Wildfire[];
  onVerifyReport: (id: string) => void;
  onRejectReport: (id: string) => void;
  onUpdateStatus: (id: string, status: FireStatus, burnedArea: number) => void;
  onBroadcastAlert: (wilaya: string, title: string, message: string) => void;
  userRole: 'user' | 'moderator' | 'authority';
  lang: Language;
  t: Record<string, string>;
}

export default function VerificationPortal({
  wildfires,
  onVerifyReport,
  onRejectReport,
  onUpdateStatus,
  onBroadcastAlert,
  userRole,
  lang,
  t
}: VerificationPortalProps) {
  const [editingFireId, setEditingFireId] = useState<string | null>(null);
  const [editedStatus, setEditedStatus] = useState<FireStatus>('Active');
  const [editedArea, setEditedArea] = useState<number>(0);

  // Broadcast Alert Form State
  const [alertWilaya, setAlertWilaya] = useState('');
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [isAlertSubmitting, setIsAlertSubmitting] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState(false);

  const isRTL = lang === 'ar';

  const pendingFires = wildfires.filter(f => !f.isVerified);
  const verifiedFires = wildfires.filter(f => f.isVerified);

  const handleStartEdit = (fire: Wildfire) => {
    setEditingFireId(fire.id);
    setEditedStatus(fire.status);
    setEditedArea(fire.burnedArea || 0);
  };

  const handleSaveEdit = (id: string) => {
    onUpdateStatus(id, editedStatus, editedArea);
    setEditingFireId(null);
  };

  const handleAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertWilaya || !alertTitle || !alertMessage) return;

    setIsAlertSubmitting(true);
    await onBroadcastAlert(alertWilaya, alertTitle, alertMessage);
    setIsAlertSubmitting(false);
    setAlertSuccess(true);
    
    // Clear form
    setAlertWilaya('');
    setAlertTitle('');
    setAlertMessage('');

    setTimeout(() => {
      setAlertSuccess(false);
    }, 4000);
  };

  return (
    <div id="verification_portal_view" className="space-y-6">
      {/* Upper header section showing roles warnings */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/15 text-red-500 rounded-xl border border-red-500/20">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">{t.moderation}</h3>
            <p className="text-xs text-slate-300">
              {isRTL 
                ? `الدور الحالي: ${t['role' + userRole.charAt(0).toUpperCase() + userRole.slice(1)] || userRole}`
                : `Rôle Actuel: ${t['role' + userRole.charAt(0).toUpperCase() + userRole.slice(1)] || userRole}`}
            </p>
          </div>
        </div>

        {userRole === 'user' && (
          <div className="bg-yellow-500/10 text-yellow-400 text-xs px-4 py-2.5 rounded-xl border border-yellow-500/20 max-w-md">
            ⚠️ {isRTL 
              ? "مستوى الحساب الحالي: مواطن. لرؤية أو اختبار بوابة مراجعة البلاغات أو إصدار تنبيهات الطوارئ، يرجى تغيير دورك إلى مشرف أو سلطة الإنقاذ من القائمة العلوية."
              : "Compte Citoyen. Pour tester l'approbation des feux ou l'envoi d'alertes régionales, veuillez sélectionner le rôle de 'Modérateur' ou d' 'Autorité' dans le sélecteur ci-dessus."}
          </div>
        )}
      </div>

      {userRole !== 'user' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: Reports verification lists */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Verification list */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                  {t.pendingVerification} ({pendingFires.length})
                </h4>
              </div>

              {pendingFires.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  🎉 {isRTL ? "كل البلاغات مراجعة ومؤكدة حالياً!" : "Tous les rapports citoyennes sont actuellement vérifiés !"}
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingFires.map(fire => (
                    <div 
                      key={fire.id}
                      className="p-4 bg-amber-50/30 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/30 rounded-xl"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                        <div>
                          <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded mr-1.5 uppercase">
                            {fire.severity}
                          </span>
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                            {fire.wilaya} ({fire.commune})
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(fire.createdAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'fr-FR')}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                        {fire.description || "No description provided."}
                      </p>

                      <div className="bg-white dark:bg-slate-950/80 border border-slate-100 dark:border-slate-850 p-2.5 rounded-lg text-[11px] mb-3 grid grid-cols-2 gap-2">
                        <div>Reporter: <span className="font-bold text-slate-700 dark:text-slate-300">{fire.reporterEmail}</span></div>
                        <div>GPS Coords: <span className="font-mono font-bold">{fire.lat.toFixed(4)}, {fire.lng.toFixed(4)}</span></div>
                        <div className="col-span-2 text-rose-700 dark:text-rose-400 font-bold flex items-center gap-1">
                          🤖 AI confidence: {fire.aiConfidence}% - {fire.aiAnalysis}
                        </div>
                      </div>

                      {/* Moderator verification action buttons */}
                      {userRole === 'moderator' || userRole === 'authority' ? (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => onRejectReport(fire.id)}
                            className="px-3 py-1.5 bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 text-xs font-bold rounded-lg border border-rose-100 dark:border-rose-900/40 hover:bg-rose-100 transition flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {t.rejectAction}
                          </button>
                          <button
                            onClick={() => onVerifyReport(fire.id)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {t.verifyAction}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Fire Monitoring Status update (Authorities only) */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-4">
                ✏️ {isRTL ? "تحديث حالة الحرائق المؤكدة" : "Suivi & Mise à jour des feux confirmés"}
              </h4>

              {verifiedFires.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">{t.noActiveFires}</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {verifiedFires.map(fire => {
                    const isEditing = editingFireId === fire.id;
                    let markerColor = 'bg-red-500';
                    if (fire.status === 'Controlled') markerColor = 'bg-orange-500';
                    if (fire.status === 'Extinguished') markerColor = 'bg-emerald-500';

                    return (
                      <div key={fire.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${markerColor}`}></span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{fire.wilaya} ({fire.commune})</span>
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono">
                              {fire.burnedArea} ha
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 max-w-md line-clamp-2">{fire.description}</p>
                        </div>

                        <div className="self-start sm:self-center">
                          {isEditing ? (
                            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                              <div className="flex gap-2">
                                <select
                                  value={editedStatus}
                                  onChange={(e) => setEditedStatus(e.target.value as FireStatus)}
                                  className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-xs"
                                >
                                  <option value="Active">{t.active}</option>
                                  <option value="Controlled">{t.controlled}</option>
                                  <option value="Extinguished">{t.extinguished}</option>
                                </select>
                                <input
                                  type="number"
                                  placeholder="Area ha"
                                  value={editedArea}
                                  onChange={(e) => setEditedArea(Number(e.target.value))}
                                  className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-xs text-center"
                                />
                              </div>
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => setEditingFireId(null)}
                                  className="px-2 py-1 text-[10px] font-bold text-slate-500"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveEdit(fire.id)}
                                  className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded hover:bg-emerald-700 transition"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            userRole === 'authority' ? (
                              <button
                                onClick={() => handleStartEdit(fire)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg border border-slate-200/50 dark:border-slate-700 flex items-center gap-1.5 transition"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                {t.updateStatus}
                              </button>
                            ) : (
                              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded flex items-center gap-1">
                                <BadgeCheck className="w-4 h-4" />
                                {t.verified}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Broadcast Emergency alert card */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-600 animate-ping"></span>
                {t.notificationTitle}
              </h4>
              <p className="text-[11px] text-slate-500 mb-4">
                {isRTL 
                  ? "إرسال تنبيهات طارئة عاجلة لسكان ولاية معينة لتوجيههم وإرشادهم." 
                  : "Envoyer une alerte géolocalisée immédiate sur les smartphones des résidents d'une Wilaya."}
              </p>

              {alertSuccess && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900 text-emerald-800 dark:text-emerald-400 text-xs font-medium mb-3">
                  ✅ {t.notificationSent}
                </div>
              )}

              <form onSubmit={handleAlertSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Target Wilaya</label>
                  <select
                    value={alertWilaya}
                    onChange={(e) => setAlertWilaya(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 dark:text-slate-200"
                  >
                    <option value="">-- Choose Wilaya --</option>
                    {ALGERIA_WILAYAS.map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Alert Title</label>
                  <input
                    type="text"
                    placeholder="e.g. حريق غابة جرجرة"
                    value={alertTitle}
                    onChange={(e) => setAlertTitle(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Instructions / Message</label>
                  <textarea
                    placeholder="e.g. يرجى إخلاء منطقة تيكجدا فوراً..."
                    value={alertMessage}
                    onChange={(e) => setAlertMessage(e.target.value)}
                    rows={4}
                    required
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 dark:text-slate-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAlertSubmitting || userRole !== 'authority'}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isAlertSubmitting ? t.loading : "Broadcast Emergency alert"}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
