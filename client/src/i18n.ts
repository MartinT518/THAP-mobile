import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import et from "./locales/et.json";
import fi from "./locales/fi.json";
import sv from "./locales/sv.json";
import no from "./locales/no.json";
import da from "./locales/da.json";
import de from "./locales/de.json";
import fr from "./locales/fr.json";
import es from "./locales/es.json";
import it from "./locales/it.json";
import pt from "./locales/pt.json";
import pl from "./locales/pl.json";
import ru from "./locales/ru.json";
import zh from "./locales/zh.json";

const resources = {
  en: { translation: en },
  et: { translation: et },
  fi: { translation: fi },
  sv: { translation: sv },
  no: { translation: no },
  da: { translation: da },
  de: { translation: de },
  fr: { translation: fr },
  es: { translation: es },
  it: { translation: it },
  pt: { translation: pt },
  pl: { translation: pl },
  ru: { translation: ru },
  zh: { translation: zh },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "thap_language",
      caches: ["localStorage"],
    },
  });

export default i18n;
