import React, { createContext, useContext, useEffect, useState } from 'react';

type Lang = 'en' | 'ar';

const translations: Record<Lang, Record<string, string>> = {
  en: {
    nav_home: 'Home',
    nav_workouts: 'Workouts',
    nav_steps: 'Steps',
    nav_analytics: 'Analytics',
    nav_coaching: 'Coaching',
    nav_community: 'Community',
    nav_chat: 'Chat',
    nav_tools: 'Tools',
    nav_profile: 'Profile',
    fitway_hub: 'Fitway Hub',
    sign_out: 'Sign Out',
    premium_coaching_title: 'Premium Coaching',
    premium_coaching_desc: 'Get personalized guidance, form checks, and custom plans from our certified expert trainers.',
    my_sessions: 'My Sessions',
    book_with: 'Book with {coach}',
    date_label: 'Date',
    time_label: 'Time',
    note_label: 'Note',
    booking_requested: 'Booking requested. Check My Sessions for confirmation.',
    booking_failed: 'Failed to request booking.',
    upcoming_sessions: 'Upcoming Sessions',
    form_check_review: 'Form Check & Review',
    with_coach: 'with {coach}',
    tomorrow_label: 'Tomorrow',
    premium_feature_title: 'Premium Feature',
    premium_feature_desc: 'Unlock advanced analytics to track your weight trends, detailed activity breakdown, and performance metrics.',
    advanced_analytics: 'Advanced Analytics',
    generate_ai_insights: 'Generate AI Insights',
    summary: 'Summary',
    loading: 'Loading...',
    total_steps: 'Total Steps',
    total_distance: 'Total Distance',
    total_calories: 'Total Calories',
    premium_sessions: 'Premium Sessions',
    recent_sessions: 'Recent Sessions',
    performance_metrics: 'Performance Metrics',
    avg_daily_steps: 'Avg. Daily Steps',
    total_sessions: 'Total Sessions',
    calories_burned: 'Calories Burned',
    consistency: 'Consistency',
    contacts: 'Contacts',
    groups: 'Groups',
    search_placeholder: 'Search...',
    now: 'Now',
    role_coach: 'Coach',
    role_user: 'User',
    type_message_placeholder: 'Type a message...',
    select_contact_start: 'Select a contact to start chatting',
    personal_coaching: 'Personal Coaching',
    book: 'Book',
    chat: 'Chat',
    premium_feature: 'Premium Feature',
    activity_tracker: 'Activity Tracker',
    activity_sub: 'Track your daily activity with precision',
    workouts_title: 'Workout Programs',
    browse: 'Browse',
    my_plan: 'My Plan',
    premium: 'Premium',
    today_label: 'Today',
    default_upper_body: 'Upper Body Power',
    default_today_notes: '45 mins • Dumbbells • Assigned by your coach',
    start: 'Start',
    my_workout_plan: 'My Workout Plan',
    my_workout_plan_placeholder: 'Your coach-selected workout plan will appear here. If you have a private coach they can add sessions and progress.',
    my_nutrition_plan: 'My Nutrition Plan',
    my_nutrition_placeholder: 'Your coach can provide daily meal plans and macros here.',
    workout_complete: 'Workout complete! You earned {pts} point(s).',
    greeting_hello: 'Hello, {name}! 👋',
    ready_goals: 'Ready to crush your goals today?',
    stat_steps: 'Steps',
    stat_calories: 'Calories',
    stat_water: 'Water',
    stat_activity: 'Activity',
    ai_performance_analysis: 'AI Performance Analysis',
    performance_rating: 'Performance Rating',
    health_advice: 'Health Advice',
    motivational_message: 'Motivational Message',
    tomorrows_goal: "Tomorrow's Goal",
    todays_plan_title: "Today's Plan",
    view_calendar: 'View Calendar',
    start_workout: 'Start Workout',
    quick_tools: 'Quick Tools',
    tool_bmi_calc: 'BMI Calc',
    tool_macros: 'Macros',
    tool_steps: 'Steps',
    tool_water: 'Water',
    default_day_label: 'Day 14 • Push Day',
    back_online_sync: 'Back online! Syncing offline data...',
    offline_saved: 'You are offline. Steps will be saved locally and synced when online.',
    geolocation_not_supported: 'Geolocation is not supported on this device or browser.',
    failed_start_tracking: 'Failed to start tracking',
    todays_summary: "Today's Summary",
    no_data_today_start: 'No data for today. Start tracking!',
    profile_title: 'My Profile',
    premium_member: 'Premium Member',
    upgrade_premium: 'Upgrade to Premium',
    physical_stats: 'Physical Stats',
    save_changes: 'Save Changes',
    edit_stats: 'Edit Stats',
    height_label: 'Height',
    weight_label: 'Weight',
    settings: 'Settings',
    account_details: 'Account Details',
    hide: 'Hide',
    edit: 'Edit',
    name_label: 'Name',
    email_label: 'Email',
    save: 'Save',
    cancel: 'Cancel',
    notifications: 'Notifications',
    language_label: 'Language',
    theme: 'Theme',
    dark: 'Dark',
    light: 'Light',
  },
  ar: {
    nav_home: 'الصفحة الرئيسية',
    nav_workouts: 'التمارين',
    nav_steps: 'الخطوات',
    nav_analytics: 'التحليلات',
    nav_coaching: 'التدريب',
    nav_community: 'المجتمع',
    nav_chat: 'الدردشة',
    nav_tools: 'الأدوات',
    nav_profile: 'الملف الشخصي',
    fitway_hub: 'مركز فيت واي',
    
    personal_coaching: 'التدريب الشخصي',
    book: 'حجز',
    chat: 'دردشة',
    premium_feature: 'ميزة مدفوعة',
    activity_tracker: 'متتبع النشاط',
    activity_sub: 'تتبع نشاطك اليومي بدقة',
    workouts_title: 'برامج التمرين',
    browse: 'تصفح',
    my_plan: 'خطيطي',
    premium: 'مدفوع',
    today_label: 'اليوم',
    default_upper_body: 'قوة الجزء العلوي',
    default_today_notes: '45 دقيقة • دامبلز • مخصص من مدربك',
    start: 'ابدأ',
    my_workout_plan: 'خطتي للتمارين',
    my_workout_plan_placeholder: 'ستظهر خطة التمرين التي يحددها مدربك هنا. يمكن للمدرب إضافة جلسات وتقدم خاص لك.',
    my_nutrition_plan: 'خطة التغذية',
    my_nutrition_placeholder: 'يمكن لمدربك تقديم خطط وجبات يومية ومكوناتها هنا.',
    workout_complete: 'انتهى التمرين! ربحت {pts} نقاط.',
    greeting_hello: 'مرحبًا، {name}! 👋',
    ready_goals: 'هل أنت مستعد لتحقيق أهدافك اليوم؟',
    stat_steps: 'الخطوات',
    stat_calories: 'السعرات',
    stat_water: 'الماء',
    stat_activity: 'النشاط',
    ai_performance_analysis: 'تحليل الأداء بواسطة الذكاء الاصطناعي',
    performance_rating: 'تقييم الأداء',
    health_advice: 'نصيحة صحية',
    motivational_message: 'رسالة تحفيزية',
    tomorrows_goal: 'هدف الغد',
    todays_plan_title: 'خطة اليوم',
    view_calendar: 'عرض التقويم',
    start_workout: 'ابدأ التمرين',
    quick_tools: 'الأدوات السريعة',
    tool_bmi_calc: 'حساب مؤشر الكتلة',
    tool_macros: 'المغذيات',
    tool_steps: 'الخطوات',
    tool_water: 'الماء',
    default_day_label: 'اليوم 14 • يوم دفع',
    back_online_sync: 'تم الاتصال بالإنترنت! مزامنة البيانات المحلية...',
    offline_saved: 'أنت غير متصل. سيتم حفظ الخطوات محليًا ومزامنتها عند الاتصال.',
    geolocation_not_supported: 'الموقع الجغرافي غير مدعوم على هذا الجهاز أو المتصفح.',
    failed_start_tracking: 'فشل في بدء التتبع',
    todays_summary: 'ملخص اليوم',
    no_data_today_start: 'لا توجد بيانات لليوم. ابدأ التتبع!',
    profile_title: 'ملفي',
    premium_member: 'عضو بريميوم',
    upgrade_premium: 'الترقية إلى بريميوم',
    physical_stats: 'القياسات البدنية',
    save_changes: 'حفظ التغييرات',
    edit_stats: 'تعديل القياسات',
    height_label: 'الطول',
    weight_label: 'الوزن',
    settings: 'الإعدادات',
    account_details: 'تفاصيل الحساب',
    hide: 'إخفاء',
    edit: 'تعديل',
    name_label: 'الاسم',
    email_label: 'البريد الإلكتروني',
    save: 'حفظ',
    cancel: 'إلغاء',
    notifications: 'الإشعارات',
    language_label: 'اللغة',
    theme: 'المظهر',
    dark: 'داكن',
    light: 'فاتح',
    sign_out: 'تسجيل الخروج',
    premium_coaching_title: 'التدريب المميز',
    premium_coaching_desc: 'احصل على إرشاد شخصي، فحوصات الأداء، وخطط مخصصة من مدربينا المعتمدين.',
    my_sessions: 'جلساتي',
    book_with: 'الحجز مع {coach}',
    date_label: 'التاريخ',
    time_label: 'الوقت',
    note_label: 'ملاحظة',
    booking_requested: 'تم طلب الحجز. تحقق من جلساتي للتأكيد.',
    booking_failed: 'فشل في طلب الحجز.',
    upcoming_sessions: 'الجلسات القادمة',
    form_check_review: 'مراجعة وفحص التقنية',
    with_coach: 'مع {coach}',
    tomorrow_label: 'غدًا',
    premium_feature_title: 'ميزة مميزة',
    premium_feature_desc: 'افتح تحليلات متقدمة لتتبع اتجاهات وزنك، وتحليل النشاط التفصيلي، وقياسات الأداء.',
    advanced_analytics: 'تحليلات متقدمة',
    generate_ai_insights: 'توليد رؤى بالذكاء الاصطناعي',
    summary: 'الملخص',
    loading: 'جارٍ التحميل...',
    total_steps: 'إجمالي الخطوات',
    total_distance: 'إجمالي المسافة',
    total_calories: 'إجمالي السعرات',
    premium_sessions: 'جلسات مميزة',
    recent_sessions: 'الجلسات الأخيرة',
    performance_metrics: 'مقاييس الأداء',
    avg_daily_steps: 'متوسط الخطوات اليومية',
    total_sessions: 'إجمالي الجلسات',
    calories_burned: 'السعرات المحروقة',
    consistency: 'الاتساق',
    contacts: 'جهات الاتصال',
    groups: 'المجموعات',
    search_placeholder: 'بحث...',
    now: 'الآن',
    role_coach: 'مدرب',
    role_user: 'مستخدم',
    type_message_placeholder: 'اكتب رسالة...',
    select_contact_start: 'اختر جهة اتصال لبدء المحادثة',
  }
};

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('fithub_lang') as Lang) || 'en');

  useEffect(() => {
    localStorage.setItem('fithub_lang', lang);
    // set document direction
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    // Runtime DOM translation fallback: map visible English strings to translations
    try {
      // build reverse map from English text -> key
      const enMap: Record<string, string> = {};
      Object.keys(translations['en']).forEach(k => {
        const v = translations['en'][k];
        if (typeof v === 'string' && v.trim().length > 0) enMap[v.trim()] = k;
      });

      const applyTranslation = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const txt = node.textContent?.trim();
          if (txt && enMap[txt]) {
            const key = enMap[txt];
            const translated = translations[lang]?.[key] || translations['en'][key];
            if (translated && translated !== txt) node.textContent = node.textContent?.replace(txt, translated) || node.textContent;
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          // translate placeholders on inputs
          if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
            const ph = (el as HTMLInputElement).placeholder?.trim();
            if (ph && enMap[ph]) {
              const key = enMap[ph];
              (el as HTMLInputElement).placeholder = translations[lang]?.[key] || translations['en'][key] || ph;
            }
          }
          // translate value for buttons
          if (el.tagName === 'BUTTON') {
            const text = el.textContent?.trim();
            if (text && enMap[text]) {
              const key = enMap[text];
              const translated = translations[lang]?.[key] || translations['en'][key];
              if (translated && translated !== text) el.textContent = translated;
            }
          }
        }
      };

      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null);
      let n: Node | null = walker.currentNode;
      while ((n = walker.nextNode())) {
        try { applyTranslation(n); } catch (e) { /* ignore individual node errors */ }
      }
    } catch (e) {
      // ignore DOM translation errors
      console.debug('DOM i18n fallback failed', e);
    }
  }, [lang]);

  const t = (key: string) => {
    return translations[lang][key] || translations['en'][key] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
