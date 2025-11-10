import React from "react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const languages = [
    { code: "fr", name: t('language.fr'), flag: "🇫🇷" },
    { code: "en", name: t('language.en'), flag: "🇬🇧" },
    { code: "es", name: t('language.es'), flag: "🇪🇸" },
    { code: "de", name: t('language.de'), flag: "🇩🇪" },
    { code: "zh", name: t('language.zh'), flag: "🇨🇳" },
    { code: "ar", name: t('language.ar'), flag: "🇸🇦" }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('i18nextLng', langCode);
    
    // Apply RTL for Arabic
    if (langCode === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  };

  return (
    <div className="flex items-center gap-2" data-testid="language-switcher">
      <Globe className="w-4 h-4 text-gray-500" />
      <Select value={i18n.language} onValueChange={changeLanguage}>
        <SelectTrigger className="w-[180px]" data-testid="language-select">
          <SelectValue>
            <span className="flex items-center gap-2">
              <span>{currentLanguage.flag}</span>
              <span>{currentLanguage.name}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code} data-testid={`lang-${lang.code}`}>
              <span className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSwitcher;
