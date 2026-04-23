import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

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
    settings: "Settings",
    account: "Account",
    accountSettings: "Account Settings",
    manageAccount: "Manage your account information",
    notificationsSettings: "Notifications",
    manageNotifications: "Manage your notification preferences",
    privacy: "Privacy & Security",
    controlPrivacy: "Control your privacy settings",
    appearance: "Appearance",
    customizeAppearance: "Customize how FlipStar looks",
    language: "Language",
    chooseLanguage: "Choose your preferred language",
    help: "Help & Support",
    getHelp: "Get help and support",
    darkMode: "Dark Mode",
    changePassword: "Change Password",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm New Password",
    updatePassword: "Update Password",
    downloadData: "Download Your Data",
    downloadDataDesc: "Download a copy of your posts and profile data",
    deleteAccount: "Delete Account",
    dangerZone: "Danger Zone",
    deleteWarning: "Once you delete your account, there is no going back.",
    basicInfo: "Basic Information",
    username: "Username",
    email: "Email",
    success: "Success",
    error: "Error",
    logout: "Log Out",
    likes: "Likes",
    comments: "Comments",
    follows: "Follows",
    messages: "Messages",
    privateAccount: "Private Account",
    privateAccountDesc: "Only approved followers can see your posts",
    showActivity: "Activity Status",
    showActivityDesc: "Show your activity status to others",
    version: "Version",
    editProfile: "Edit Profile",
  },
  am: {
    settings: "ቅንብሮች",
    account: "መለያ",
    accountSettings: "የመለያ ቅንብሮች",
    manageAccount: "የመለያ መረጃዎን ያስተዳድሩ",
    notificationsSettings: "ማሳወቂያዎች",
    manageNotifications: "የማሳወቂያ ምርጫዎችዎን ያስተዳድሩ",
    privacy: "ግላዊነት እና ደህንነት",
    controlPrivacy: "የግላዊነት ቅንብሮችዎን ያስተዳድሩ",
    appearance: "መልክ",
    customizeAppearance: "FlipStar እንዴት እንደሚመስል ያቀናብሩ",
    language: "ቋንቋ",
    chooseLanguage: "የሚፈልጉትን ቋንቋ ይምረጡ",
    help: "እገዛ እና ድጋፍ",
    getHelp: "እገዛ እና ድጋፍ ያግኙ",
    darkMode: "ጨለማ ሁነታ",
    changePassword: "የይለፍ ቃል ቀይር",
    currentPassword: "አሁን ያለው የይለፍ ቃል",
    newPassword: "አዲስ የይለፍ ቃል",
    confirmPassword: "አዲስ የይለፍ ቃል ያረጋግጡ",
    updatePassword: "የይለፍ ቃል ያዘምኑ",
    downloadData: "መረጃዎን አውርድ",
    downloadDataDesc: "የልጥፎችዎ እና የመገለጫ መረጃዎን ይውርዱ",
    deleteAccount: "መለያ ሰርዝ",
    dangerZone: "አደጋ አካባቢ",
    deleteWarning: "መለያዎን ካስወገዱ መመለስ የለም።",
    basicInfo: "መሰረታዊ መረጃ",
    username: "የተጠቃሚ ስም",
    email: "ኢሜይል",
    success: "አስተማማም",
    error: "ስህተት",
    logout: "ውጣ",
    likes: "አስደስቶች",
    comments: "አስተያየቶች",
    follows: "ተከታዮች",
    messages: "መልዕክቶች",
    privateAccount: "የግል መለያ",
    privateAccountDesc: "የተፈቀዱ ተከታዮች ብቻ ልጥፎችዎን ማየት ይችላሉ",
    showActivity: "የንቃት ሁኔታ",
    showActivityDesc: "የእርስዎ ንቁ ሁኔታ ለአጭር ጊዜ ለሌሎች አሳይ",
    version: "ስሪት",
    editProfile: "መገለጫ አርትዕ",
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const saved = await SecureStore.getItemAsync('language');
      if (saved) setLanguage(saved);
    } catch (e) {}
  };

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  const changeLanguage = async (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
      await SecureStore.setItemAsync('language', lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
