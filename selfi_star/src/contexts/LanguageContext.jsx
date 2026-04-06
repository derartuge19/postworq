import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

const translations = {
  en: {
    // Navigation
    home: "Home",
    forYou: "For You",
    search: "Search",
    explore: "Explore",
    reels: "Reels",
    followingTab: "Following",
    inbox: "Inbox",
    messages: "Messages",
    notifications: "Notifications",
    bookmarks: "Bookmarks",
    create: "Create",
    profile: "Profile",
    settings: "Settings",
    logout: "Logout",
    login: "Login",
    signUp: "Sign Up",
    campaigns: "Campaigns",
    winners: "Winners",
    suggestions: "Suggestions",
    recommended: "Recommended for You",
    
    // Actions
    like: "Like",
    comment: "Comment",
    share: "Share",
    save: "Save",
    saved: "Saved",
    follow: "Follow",
    following: "Following",
    unfollow: "Unfollow",
    edit: "Edit",
    delete: "Delete",
    cancel: "Cancel",
    post: "Post",
    
    // Profile
    posts: "Posts",
    followers: "Followers",
    followingCount: "Following",
    editProfile: "Edit Profile",
    
    // Settings
    account: "Account",
    accountSettings: "Account Settings",
    notificationsSettings: "Notifications",
    privacy: "Privacy & Security",
    appearance: "Appearance",
    language: "Language",
    help: "Help & Support",
    darkMode: "Dark Mode",
    changePassword: "Change Password",
    downloadData: "Download Your Data",
    deleteAccount: "Delete Account",
    
    // Post
    caption: "Caption",
    hashtags: "Hashtags",
    uploadMedia: "Upload Media",
    
    // Common
    loading: "Loading...",
    noResults: "No results found",
    error: "An error occurred",
  },
  am: {
    // Navigation (Amharic)
    home: "መነሻ",
    forYou: "ለእርስዎ",
    search: "ፈልግ",
    explore: "ያስሱ",
    reels: "ሪልስ",
    followingTab: "እየተከተሉ",
    inbox: "መልዕክቶች",
    messages: "መልዕክቶች",
    notifications: "ማሳወቂያዎች",
    bookmarks: "የተቀመጡ",
    create: "ይፍጠሩ",
    profile: "መገለጫ",
    settings: "ቅንብሮች",
    logout: "ውጣ",
    login: "ግባ",
    signUp: "ይመዝገቡ",
    campaigns: "ዘመቻዎች",
    winners: "አሸናፊዎች",
    suggestions: "ጥቆማዎች",
    recommended: "ለእርስዎ የሚመከር",
    
    // Actions
    like: "አስደስት",
    comment: "አስተያየት",
    share: "አጋራ",
    save: "አስቀምጥ",
    saved: "ተቀምጧል",
    follow: "ተከተል",
    following: "እየተከተሉ",
    unfollow: "አትከተል",
    edit: "አርትዕ",
    delete: "ሰርዝ",
    cancel: "ሰርዝ",
    post: "ለጥፍ",
    
    // Profile
    posts: "ልጥፎች",
    followers: "ተከታዮች",
    followingCount: "እየተከተሉ",
    editProfile: "መገለጫ አርትዕ",
    
    // Settings
    account: "መለያ",
    accountSettings: "የመለያ ቅንብሮች",
    notificationsSettings: "ማሳወቂያዎች",
    privacy: "ግላዊነት እና ደህንነት",
    appearance: "መልክ",
    language: "ቋንቋ",
    help: "እገዛ እና ድጋፍ",
    darkMode: "ጨለማ ሁነታ",
    changePassword: "የይለፍ ቃል ቀይር",
    downloadData: "መረጃዎን አውርድ",
    deleteAccount: "መለያ ሰርዝ",
    
    // Post
    caption: "መግለጫ",
    hashtags: "ሃሽታጎች",
    uploadMedia: "ሚዲያ ይስቀሉ",
    
    // Common
    loading: "በመጫን ላይ...",
    noResults: "ምንም ውጤት አልተገኘም",
    error: "ስህተት ተከስቷል",
  },
  es: {
    // Navigation (Spanish)
    home: "Inicio",
    forYou: "Para Ti",
    search: "Buscar",
    explore: "Explorar",
    reels: "Reels",
    followingTab: "Siguiendo",
    inbox: "Bandeja",
    messages: "Mensajes",
    notifications: "Notificaciones",
    bookmarks: "Guardados",
    create: "Crear",
    profile: "Perfil",
    settings: "Ajustes",
    logout: "Cerrar Sesión",
    login: "Iniciar Sesión",
    signUp: "Registrarse",
    campaigns: "Campañas",
    winners: "Ganadores",
    suggestions: "Sugerencias",
    recommended: "Recomendado para Ti",
    
    // Actions
    like: "Me Gusta",
    comment: "Comentar",
    share: "Compartir",
    save: "Guardar",
    saved: "Guardado",
    follow: "Seguir",
    following: "Siguiendo",
    unfollow: "Dejar de Seguir",
    edit: "Editar",
    delete: "Eliminar",
    cancel: "Cancelar",
    post: "Publicar",
    
    // Profile
    posts: "Publicaciones",
    followers: "Seguidores",
    followingCount: "Siguiendo",
    editProfile: "Editar Perfil",
    
    // Settings
    account: "Cuenta",
    accountSettings: "Configuración de Cuenta",
    notificationsSettings: "Notificaciones",
    privacy: "Privacidad y Seguridad",
    appearance: "Apariencia",
    language: "Idioma",
    help: "Ayuda y Soporte",
    darkMode: "Modo Oscuro",
    changePassword: "Cambiar Contraseña",
    downloadData: "Descargar Tus Datos",
    deleteAccount: "Eliminar Cuenta",
    
    // Post
    caption: "Descripción",
    hashtags: "Hashtags",
    uploadMedia: "Subir Medios",
    
    // Common
    loading: "Cargando...",
    noResults: "No se encontraron resultados",
    error: "Ocurrió un error",
  },
  fr: {
    // Navigation (French)
    home: "Accueil",
    forYou: "Pour Vous",
    search: "Rechercher",
    explore: "Explorer",
    reels: "Reels",
    followingTab: "Abonnements",
    inbox: "Boîte",
    messages: "Messages",
    notifications: "Notifications",
    bookmarks: "Enregistrés",
    create: "Créer",
    profile: "Profil",
    settings: "Paramètres",
    logout: "Déconnexion",
    login: "Connexion",
    signUp: "S'inscrire",
    campaigns: "Campagnes",
    winners: "Gagnants",
    suggestions: "Suggestions",
    recommended: "Recommandé pour Vous",
    
    // Actions
    like: "J'aime",
    comment: "Commenter",
    share: "Partager",
    save: "Enregistrer",
    saved: "Enregistré",
    follow: "Suivre",
    following: "Abonné",
    unfollow: "Ne plus suivre",
    edit: "Modifier",
    delete: "Supprimer",
    cancel: "Annuler",
    post: "Publier",
    
    // Profile
    posts: "Publications",
    followers: "Abonnés",
    followingCount: "Abonnements",
    editProfile: "Modifier le Profil",
    
    // Settings
    account: "Compte",
    accountSettings: "Paramètres du Compte",
    notificationsSettings: "Notifications",
    privacy: "Confidentialité et Sécurité",
    appearance: "Apparence",
    language: "Langue",
    help: "Aide et Support",
    darkMode: "Mode Sombre",
    changePassword: "Changer le Mot de Passe",
    downloadData: "Télécharger Vos Données",
    deleteAccount: "Supprimer le Compte",
    
    // Post
    caption: "Légende",
    hashtags: "Hashtags",
    uploadMedia: "Télécharger des Médias",
    
    // Common
    loading: "Chargement...",
    noResults: "Aucun résultat trouvé",
    error: "Une erreur s'est produite",
  },
  ar: {
    // Navigation (Arabic)
    home: "الرئيسية",
    forYou: "لك",
    search: "بحث",
    explore: "استكشف",
    reels: "ريلز",
    followingTab: "المتابَعون",
    inbox: "البريد",
    messages: "الرسائل",
    notifications: "الإشعارات",
    bookmarks: "المحفوظات",
    create: "إنشاء",
    profile: "الملف الشخصي",
    settings: "الإعدادات",
    logout: "تسجيل الخروج",
    login: "تسجيل الدخول",
    signUp: "التسجيل",
    campaigns: "الحملات",
    winners: "الفائزون",
    suggestions: "الاقتراحات",
    recommended: "موصى به لك",
    
    // Actions
    like: "إعجاب",
    comment: "تعليق",
    share: "مشاركة",
    save: "حفظ",
    saved: "محفوظ",
    follow: "متابعة",
    following: "متابَع",
    unfollow: "إلغاء المتابعة",
    edit: "تعديل",
    delete: "حذف",
    cancel: "إلغاء",
    post: "نشر",
    
    // Profile
    posts: "المنشورات",
    followers: "المتابعون",
    followingCount: "المتابَعون",
    editProfile: "تعديل الملف الشخصي",
    
    // Settings
    account: "الحساب",
    accountSettings: "إعدادات الحساب",
    notificationsSettings: "الإشعارات",
    privacy: "الخصوصية والأمان",
    appearance: "المظهر",
    language: "اللغة",
    help: "المساعدة والدعم",
    darkMode: "الوضع الداكن",
    changePassword: "تغيير كلمة المرور",
    downloadData: "تنزيل بياناتك",
    deleteAccount: "حذف الحساب",
    
    // Post
    caption: "التعليق",
    hashtags: "الوسوم",
    uploadMedia: "تحميل الوسائط",
    
    // Common
    loading: "جارٍ التحميل...",
    noResults: "لم يتم العثور على نتائج",
    error: "حدث خطأ",
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    
    // Set document direction for RTL languages
    if (language === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
