import { useState, useEffect } from "react";

export default function TypingText({ text, delay = 50, startDelay = 0 }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    setDisplayedText("");
    let timer;
    const startTimer = setTimeout(() => {
      let index = 0;
      timer = setInterval(() => {
        if (index <= text.length) {
          setDisplayedText(text.slice(0, index));
          index++;
        } else {
          clearInterval(timer);
        }
      }, delay);
    }, startDelay);

    return () => {
      clearTimeout(startTimer);
      clearInterval(timer);
    };
  }, [text, delay, startDelay]);

  return <span>{displayedText}</span>;
}
