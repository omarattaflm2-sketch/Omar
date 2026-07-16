import { Language } from '../types';
import { Phone, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

interface EmergencyPageProps {
  lang: Language;
  t: Record<string, string>;
}

export default function EmergencyPage({ lang, t }: EmergencyPageProps) {
  const isRTL = lang === 'ar';

  const instructions = [
    {
      title: isRTL ? "1. التبليغ والإنذار الفوري" : "1. Alerte Immédiate",
      desc: isRTL 
        ? "اتصل فوراً بالحماية المدنية (1021 أو 14) أو مصالح الغابات (1070). حدد بدقة اسم المنطقة، أقرب نقطة معلمية وحجم الحريق التقريبي."
        : "Appelez immédiatement la Protection Civile (1021 ou 14) ou la Direction des Forêts (1070). Indiquez la commune, le lieu-dit et l'importance du foyer."
    },
    {
      title: isRTL ? "2. حماية التنفس والهروب" : "2. Protection et Évacuation",
      desc: isRTL
        ? "غطِ أنفك وفمك بقطعة قماش مبللة بالماء لتجنب الاختناق بالدخان المتصاعد. غادر فوراً المنطقة المتضررة في اتجاه عكس هبوب الرياح."
        : "Couvrez-vous les voies respiratoires avec un linge humide pour éviter l'asphyxie. Évacuez les lieux immédiatement dans la direction opposée au vent."
    },
    {
      title: isRTL ? "3. تأمين المنازل القريبة" : "3. Sécurisation des Habitations",
      desc: isRTL
        ? "أغلق جميع النوافذ، الأبواب وفتحات التهوية لمنع تسرب الجمر والدخان. افتح رشاشات المياه على الجدران والأسطح القريبة إن أمكن."
        : "Fermez toutes les fenêtres, volets et bouches d'aération pour bloquer les flammèches. Arrosez les façades et toits en bois si possible."
    },
    {
      title: isRTL ? "4. تتبع توجيهات السلطات" : "4. Respect des Consignes",
      desc: isRTL
        ? "افسح الطريق الوطني لسيارات الإسعاف وصهاريج الإطفاء. لا تقم بالتقاط الصور الشخصية بالقرب من بؤر الخطر الشديد."
        : "Libérez les voies d'accès pour les camions de pompiers. Évitez de vous approcher des fronts de flammes pour prendre des photos."
    }
  ];

  return (
    <div id="emergency_guide_wrapper" className="space-y-6">
      {/* emergency numbers section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact 1: Protection Civile */}
        <div className="bg-red-600 text-white p-6 rounded-2xl shadow-lg border border-red-500 relative overflow-hidden flex flex-col justify-between min-h-[160px] group">
          <div className="absolute right-0 bottom-0 opacity-10">
            <Phone className="w-40 h-40 transform translate-x-10 translate-y-10" />
          </div>
          <div>
            <span className="bg-red-800 text-red-100 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {t.civilProtection}
            </span>
            <h3 className="text-xl font-bold mt-2.5">
              {isRTL ? "الرقم الأخضر للحماية المدنية الجزائرية" : "Protection Civile Algérienne"}
            </h3>
            <p className="text-xs text-red-100 mt-1.5 opacity-90 leading-relaxed">
              {isRTL 
                ? "لطلب الإغاثة والإنقاذ العاجل في حالات الحرائق، الحوادث أو المساعدة الطبية الطارئة."
                : "Numéro d'urgence national gratuit disponible 24h/24 pour l'évacuation des populations et l'extinction."}
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between gap-3">
            <span className="text-4xl font-black font-mono tracking-wider">1021 / 14</span>
            <a 
              href="tel:1021" 
              className="px-5 py-2.5 bg-white text-red-600 font-bold rounded-xl hover:bg-red-50 transition text-xs shadow"
            >
              📞 {t.emergencyCall}
            </a>
          </div>
        </div>

        {/* Contact 2: Forest Directorate */}
        <div className="bg-emerald-800 text-white p-6 rounded-2xl shadow-lg border border-emerald-700 relative overflow-hidden flex flex-col justify-between min-h-[160px]">
          <div className="absolute right-0 bottom-0 opacity-10">
            <Phone className="w-40 h-40 transform translate-x-10 translate-y-10" />
          </div>
          <div>
            <span className="bg-emerald-950 text-emerald-100 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {t.forestDirectorate}
            </span>
            <h3 className="text-xl font-bold mt-2.5">
              {isRTL ? "مكافحة حرائق الغابات والتبليغ" : "Direction Générale des Forêts"}
            </h3>
            <p className="text-xs text-emerald-100 mt-1.5 opacity-90 leading-relaxed">
              {isRTL 
                ? "للتبليغ عن أي دخان مشبوه، بؤرة اشتعال أو قطع وحرق عشوائي للأشجار في الفضاء الغابي."
                : "Ligne verte nationale dédiée au signalement précoce des départs de feux et à la protection forestière."}
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between gap-3">
            <span className="text-4xl font-black font-mono tracking-wider">1070</span>
            <a 
              href="tel:1070" 
              className="px-5 py-2.5 bg-white text-emerald-800 font-bold rounded-xl hover:bg-emerald-50 transition text-xs shadow"
            >
              📞 {t.emergencyCall}
            </a>
          </div>
        </div>
      </div>

      {/* Safety instructions detail */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5.5 h-5.5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">{t.safetyInstructions}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isRTL ? "دليل السلوك الصحيح أثناء الأزمات والحرائق" : "Guide de survie et comportement citoyen face aux feux"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {instructions.map((inst, index) => (
            <div 
              key={index} 
              className="p-4 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-100/60 dark:border-slate-800/60"
            >
              <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1.5">{inst.title}</h5>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{inst.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Safety checklist FAQ card */}
      <div className="bg-slate-50 dark:bg-slate-950/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4">
        <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl">
          <HelpCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1 text-center sm:text-left">
          <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            {isRTL ? "كيف تنقذ غاباتنا وحياتك؟" : "Comment pouvez-vous sauver nos forêts et des vies ?"}
          </h5>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            {isRTL 
              ? "إن التبليغ المبكر والسريع عبر تطبيق 'Algeria Fire Watch' يساهم بنسبة 80% في السيطرة الفورية على بؤر الاشتعال قبل توسعها. استخدام الكاميرا وموقع الـ GPS يوفر معلومات دقيقة لغرف العمليات."
              : "Le signalement précoce via notre application permet d'éteindre 80% des départs de feux avant qu'ils ne se propagent. Votre réactivité sauve des forêts."}
          </p>
        </div>
      </div>
    </div>
  );
}
