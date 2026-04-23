"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AccordionProps {
  question: string;
  answer: string;
}

export default function Accordion({ question, answer }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-[var(--color-border-light)] rounded-xl overflow-hidden bg-white/50 backdrop-blur-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 sm:px-8 sm:py-5 flex items-center justify-between text-left hover:bg-[var(--color-bg-warm)]/50 transition-colors duration-200"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-[var(--color-text)] text-sm sm:text-base pr-4">
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-[var(--color-text-muted)]" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-6 pb-4 sm:px-8 sm:pb-5 text-[var(--color-text-secondary)] text-sm sm:text-base leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
