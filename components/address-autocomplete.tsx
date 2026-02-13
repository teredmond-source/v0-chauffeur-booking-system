"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Loader2 } from "lucide-react";

interface Prediction {
  description: string;
  placeId: string;
}

interface AddressAutocompleteProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  required?: boolean;
}

export function AddressAutocomplete({
  id,
  value,
  onChange,
  placeholder,
  label,
  required,
}: AddressAutocompleteProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPredictions = useCallback(async (input: string) => {
    if (input.length < 2) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/places?input=${encodeURIComponent(input)}`);
      const data = await res.json();
      setPredictions(data.predictions || []);
      setIsOpen((data.predictions || []).length > 0);
      setHighlightIndex(-1);
    } catch {
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPredictions(val);
    }, 300);
  };

  const handleSelect = (description: string) => {
    onChange(description);
    setPredictions([]);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || predictions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < predictions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : predictions.length - 1));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      handleSelect(predictions[highlightIndex].description);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <label htmlFor={id} className="mb-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
        <MapPin className="h-3.5 w-3.5 text-accent" />
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (predictions.length > 0) setIsOpen(true); }}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-lg border border-muted-foreground/30 bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Start typing an address or Eircode. Ireland only.
      </p>

      {isOpen && predictions.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-card shadow-lg">
          {predictions.map((prediction, idx) => (
            <li key={prediction.placeId}>
              <button
                type="button"
                onClick={() => handleSelect(prediction.description)}
                className={`flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors ${
                  idx === highlightIndex
                    ? "bg-accent/10 text-foreground"
                    : "text-foreground hover:bg-secondary/50"
                }`}
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                <span>{prediction.description}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
