export const translateText = async (text, targetLang) => {
  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        text
      )}&langpair=en|${targetLang}`
    );

    const data = await response.json();

    return (
      data.responseData?.translatedText || text
    );
  } catch (error) {
    console.error("Translation failed", error);
    return text;
  }
};

export const languageCodes = {
  English: "en",
  Tamil: "ta",
  Hindi: "hi",
  French: "fr",
};
