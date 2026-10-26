import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { ALL_COUNTRIES, detectUserCountry, type Country } from './countries';

export type { Country };
export { ALL_COUNTRIES };

export const CountryFlag: React.FC<{ code: string; flag: string; className?: string }> = ({
  code,
  flag,
  className = 'w-5 h-3.5',
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <span className="text-base leading-none select-none">{flag}</span>;
  }

  return (
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      alt={`${code} flag`}
      className={`inline-block object-cover rounded-xs border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs shrink-0 ${className}`}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
};

export interface PhoneInputProps {
  value: string; // E.164 string e.g. "+14155552671" or ""
  onChange: (e164Value: string) => void;
  defaultCountry?: string; // Optional ISO 2-letter code override (e.g. 'US', 'IN'). If omitted, auto-detected dynamically!
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  hasError?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  defaultCountry,
  placeholder = '555 0199',
  disabled = false,
  className = '',
  hasError = false,
}) => {
  // Dynamically resolve default country from user's browser/timezone or provided override
  const [selectedCountry, setSelectedCountry] = useState<Country>(() => {
    if (value && value.startsWith('+')) {
      const matched = ALL_COUNTRIES.find((c) => value.startsWith(c.dial));
      if (matched) return matched;
    }
    return defaultCountry
      ? ALL_COUNTRIES.find((c) => c.code === defaultCountry.toUpperCase()) || detectUserCountry()
      : detectUserCountry();
  });

  const [localNumber, setLocalNumber] = useState<string>(() => {
    if (value && value.startsWith('+')) {
      const matched = ALL_COUNTRIES.find((c) => value.startsWith(c.dial));
      if (matched) {
        return value.slice(matched.dial.length).replace(/\D/g, '');
      }
    }
    return '';
  });

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync state if external value changes (e.g. form reset or server load)
  useEffect(() => {
    if (!value) {
      setLocalNumber('');
      return;
    }
    if (value.startsWith('+')) {
      const matched = ALL_COUNTRIES.find((c) => value.startsWith(c.dial));
      if (matched) {
        if (matched.code !== selectedCountry.code) {
          setSelectedCountry(matched);
        }
        setLocalNumber(value.slice(matched.dial.length).replace(/\D/g, ''));
      }
    }
  }, [value]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Filter countries by search query across name, dial code, and ISO code
  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_COUNTRIES;
    return ALL_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [search]);

  // Update parent with E.164 string or empty string
  const updatePhoneNumber = (country: Country, numberStr: string) => {
    const digitsOnly = numberStr.replace(/\D/g, '');
    if (!digitsOnly) {
      onChange(''); // Pass empty string when no local digits exist
    } else {
      onChange(`${country.dial}${digitsOnly}`);
    }
  };

  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearch('');
    updatePhoneNumber(country, localNumber);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow keyboard navigation, deletion, shortcuts
    if (
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'Tab' ||
      e.key === 'Escape' ||
      e.key === 'Enter' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'Home' ||
      e.key === 'End' ||
      e.ctrlKey ||
      e.metaKey
    ) {
      return;
    }
    // Block any key that is not a numeric digit 0-9
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '');
    setLocalNumber(digitsOnly);
    updatePhoneNumber(selectedCountry, digitsOnly);
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`flex items-center rounded-lg border bg-zinc-50/50 dark:bg-zinc-950/40 focus-within:bg-white dark:focus-within:bg-zinc-900 transition-all overflow-visible ${
          hasError
            ? 'border-red-500/80 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20'
            : 'border-zinc-200 dark:border-zinc-800 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 focus-within:ring-2 focus-within:ring-zinc-950/5 dark:focus-within:ring-zinc-100/5'
        }`}
      >
        {/* Country Selector Trigger */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className="flex items-center gap-1.5 px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-colors text-xs font-medium text-zinc-800 dark:text-zinc-200 shrink-0 cursor-pointer disabled:opacity-50 select-none h-10"
        >
          <CountryFlag code={selectedCountry.code} flag={selectedCountry.flag} />
          <span className="text-xs font-mono font-medium text-zinc-600 dark:text-zinc-400">
            {selectedCountry.dial}
          </span>
          <ChevronDown
            className={`h-3 w-3 text-zinc-400 transition-transform duration-150 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Local Number Input */}
        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          disabled={disabled}
          placeholder={placeholder}
          value={localNumber}
          onChange={handleNumberChange}
          onKeyDown={handleKeyDown}
          autoComplete="tel-national"
          className="w-full h-10 px-3 bg-transparent text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none font-mono"
        />
      </div>

      {/* Country Dropdown Popover */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 left-0 top-full mt-1.5 w-76 max-h-72 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl shadow-zinc-950/10 dark:shadow-2xl dark:shadow-black/70 overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-100"
        >
          {/* Search Field */}
          <div className="p-2 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/30">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-zinc-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search country or dial code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
              />
            </div>
          </div>

          {/* List of Countries (All 245+ ISO 3166-1 Entries) */}
          <div className="overflow-y-auto divide-y divide-zinc-50 dark:divide-zinc-800/40 p-1">
            {filteredCountries.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500">
                No matching countries found
              </div>
            ) : (
              filteredCountries.map((country) => {
                const isSelected = country.code === selectedCountry.code;
                return (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleSelectCountry(country)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg transition-colors text-left cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-100 dark:bg-zinc-800 font-medium text-zinc-950 dark:text-white'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <CountryFlag code={country.code} flag={country.flag} />
                      <span className="truncate">{country.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="font-mono text-zinc-400 dark:text-zinc-500 text-[11px]">
                        {country.dial}
                      </span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-zinc-950 dark:text-white" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
