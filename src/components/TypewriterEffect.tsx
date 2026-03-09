import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const words = ["Internships", "Talent", "Opportunities", "Careers", "Growth"];

export function TypewriterEffect() {
  const [currentWord, setCurrentWord] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const word = words[currentWord];
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          setText(word.substring(0, text.length + 1));
          if (text.length + 1 === word.length) {
            setTimeout(() => setIsDeleting(true), 1500);
          }
        } else {
          setText(word.substring(0, text.length - 1));
          if (text.length === 0) {
            setIsDeleting(false);
            setCurrentWord((prev) => (prev + 1) % words.length);
          }
        }
      },
      isDeleting ? 50 : 100
    );
    return () => clearTimeout(timeout);
  }, [text, isDeleting, currentWord]);

  return (
    <motion.span
      className="text-primary inline-block min-w-[180px] text-left"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {text}
      <motion.span
        className="inline-block w-[3px] h-[1em] bg-primary ml-0.5 align-text-bottom"
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
      />
    </motion.span>
  );
}
