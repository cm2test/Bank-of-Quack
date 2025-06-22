import React, { useState, useEffect } from "react";

interface TypewriterTextProps {
  text: string;
  speed?: number;
  pause?: number;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 120,
  pause = 1000,
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);

  useEffect(() => {
    let ticker: NodeJS.Timeout;
    const handleTyping = () => {
      const fullText = text;
      const updatedText = isDeleting
        ? fullText.substring(0, displayedText.length - 1)
        : fullText.substring(0, displayedText.length + 1);

      setDisplayedText(updatedText);

      if (!isDeleting && updatedText === fullText) {
        setIsDeleting(true);
        ticker = setTimeout(() => {}, pause);
      } else if (isDeleting && updatedText === "") {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };

    ticker = setTimeout(handleTyping, speed);

    return () => clearTimeout(ticker);
  }, [displayedText, isDeleting, loopNum, pause, speed, text]);

  return <span className="typewriter">{displayedText}</span>;
};

export default TypewriterText;
