import React, { useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

interface CompetenceChipsProps {
  competences: string[];
  onChange: (competences: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}

const CompetenceChips: React.FC<CompetenceChipsProps> = ({
  competences,
  onChange,
  suggestions = [],
  placeholder = 'Ajouter une compétence...',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addCompetence = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !competences.includes(trimmed)) {
      onChange([...competences, trimmed]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeCompetence = (index: number) => {
    onChange(competences.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addCompetence(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && competences.length > 0) {
      removeCompetence(competences.length - 1);
    }
  };

  const filteredSuggestions = suggestions.filter(
    (s) =>
      s.toLowerCase().includes(inputValue.toLowerCase()) &&
      !competences.includes(s)
  );

  return (
    <div ref={wrapperRef} className="relative">
      <div
        className="min-h-[42px] px-3 py-2 rounded-lg border border-neutral-300 bg-white focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all flex flex-wrap gap-2 items-center cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {competences.map((comp, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
          >
            {comp}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeCompetence(index);
              }}
              className="hover:bg-primary-200 rounded-full p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={competences.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400"
        />
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => addCompetence(suggestion)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors text-left"
            >
              <Plus className="w-3.5 h-3.5 text-neutral-400" />
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompetenceChips;
