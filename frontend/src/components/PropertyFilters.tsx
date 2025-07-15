'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { PropertyFilters as Filters } from '@/lib/api';

interface PropertyFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onClearFilters: () => void;
}

const PropertyFilters: React.FC<PropertyFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters
}) => {
  const handleFilterChange = (key: keyof Filters, value: string | number | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value === '' ? undefined : value,
      page: 1 // Reset to first page when filters change
    });
  };

  // Новый обработчик для диапазонов
  const handleRangeChange = (
    minKey: keyof Filters,
    maxKey: keyof Filters,
    range: string
  ) => {
    let min: number | undefined = undefined;
    let max: number | undefined = undefined;
    switch (range) {
      case '0-500k':
        min = 0; max = 500000; break;
      case '500k-1m':
        min = 500000; max = 1000000; break;
      case '1m-2m':
        min = 1000000; max = 2000000; break;
      case '2m-5m':
        min = 2000000; max = 5000000; break;
      case '5m+':
        min = 5000000; max = undefined; break;
      case 'all':
      default:
        min = undefined; max = undefined; break;
    }
    onFiltersChange({
      ...filters,
      [minKey]: min,
      [maxKey]: max,
      page: 1
    });
  };

  // Новый обработчик для диапазонов площади
  const handleAreaRangeChange = (
    minKey: keyof Filters,
    maxKey: keyof Filters,
    range: string
  ) => {
    let min: number | undefined = undefined;
    let max: number | undefined = undefined;
    switch (range) {
      case '0-500':
        min = 0; max = 500; break;
      case '500-1000':
        min = 500; max = 1000; break;
      case '1000-2000':
        min = 1000; max = 2000; break;
      case '2000-5000':
        min = 2000; max = 5000; break;
      case '5000+':
        min = 5000; max = undefined; break;
      case 'all':
      default:
        min = undefined; max = undefined; break;
    }
    onFiltersChange({
      ...filters,
      [minKey]: min,
      [maxKey]: max,
      page: 1
    });
  };

  // Новый обработчик для диапазонов доходности
  const handleInvestmentReturnRangeChange = (
    minKey: keyof Filters,
    maxKey: keyof Filters,
    range: string
  ) => {
    let min: number | undefined = undefined;
    let max: number | undefined = undefined;
    switch (range) {
      case 'up-to-10':
        min = 0; max = 10; break;
      case '10-20':
        min = 10; max = 20; break;
      case '20-30':
        min = 20; max = 30; break;
      case 'over-30':
        min = 30; max = undefined; break;
      case 'all':
      default:
        min = undefined; max = undefined; break;
    }
    onFiltersChange({
      ...filters,
      [minKey]: min,
      [maxKey]: max,
      page: 1
    });
  };

  // Подсчёт активных фильтров (исключая служебные)
  const countActiveFilters = () => {
    const filterKeys = Object.keys(filters) as (keyof Filters)[];
    const serviceFields = ['page', 'limit', 'sortBy', 'sortOrder'];
    return filterKeys.reduce((count, key) => {
      if (serviceFields.includes(key as string)) return count;
      const value = filters[key];
      if (value !== undefined && value !== '' && value !== 'all') {
        // Для диапазонов: считаем только если хотя бы один край задан
        if (
          (key === 'minPrice' && filters.minPrice !== undefined) ||
          (key === 'maxPrice' && filters.maxPrice !== undefined) ||
          (key === 'minArea' && filters.minArea !== undefined) ||
          (key === 'maxArea' && filters.maxArea !== undefined)
        ) {
          // Считаем только один раз за диапазон
          if (key === 'minPrice' || key === 'minArea') return count + 1;
          return count;
        }
        return count + 1;
      }
      return count;
    }, 0);
  };
  const activeFiltersCount = countActiveFilters();

  // CustomDropdown: кастомный дропдаун с анимацией
  interface CustomDropdownOption {
    value: string;
    label: string;
  }

  interface CustomDropdownProps {
    value: string;
    options: CustomDropdownOption[];
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
  }

  const CustomDropdown: React.FC<CustomDropdownProps> = ({ value, options, onChange, placeholder, className }) => {
    const [open, setOpen] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selected = options.find(opt => opt.value === value);

    return (
      <div
        ref={ref}
        className={`relative ${className || ''}`}
        style={{ fontSize: 'var(--text-sm)' }}
      >
        <button
          type="button"
          className={`w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex justify-between items-center transition-shadow ${open ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
          onClick={() => setOpen(o => !o)}
          style={{ fontSize: 'var(--text-sm)' }}
        >
          <span>{selected ? selected.label : (placeholder || 'Выбрать')}</span>
          <svg className={`ml-2 h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </button>
        <div
          className={`absolute left-0 z-10 mt-2 bg-white border border-gray-200 rounded-md shadow-lg transition-all duration-200 origin-top ${open ? 'scale-y-100 opacity-100 pointer-events-auto' : 'scale-y-95 opacity-0 pointer-events-none'}`}
          style={{ transformOrigin: 'top', fontSize: 'var(--text-sm)', minWidth: '200px' }}
        >
          <ul className="max-h-60 overflow-auto py-1">
            {options.map(opt => (
              <li
                key={opt.value}
                className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${opt.value === value ? 'bg-blue-100 font-semibold' : ''}`}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{ fontSize: 'var(--text-sm)' }}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      {/* Search input full width */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Поиск</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по названию, описанию, адресу..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
            style={{ fontSize: 'var(--text-sm)' }}
          />
        </div>
      </div>
      <div
        className="flex flex-wrap gap-4 items-end justify-stretch"
      >
        {/* Property Type */}
        <div className="flex-1 min-w-max">
          <label className="block text-sm font-medium text-gray-700 mb-2">Тип недвижимости</label>
          <CustomDropdown
            value={filters.type || 'all'}
            onChange={v => handleFilterChange('type', v)}
            options={[
              { value: 'all', label: 'Все типы' },
              { value: 'Жилые помещения', label: 'Жилые помещения' },
              { value: 'Нежилые помещения', label: 'Нежилые помещения' },
              { value: 'Машино-места', label: 'Машино-места' },
              { value: 'Гараж-боксы', label: 'Гараж-боксы' },
            ]}
            className=""
          />
        </div>
        {/* Transaction Type */}
        <div className="flex-1 min-w-max">
          <label className="block text-sm font-medium text-gray-700 mb-2">Тип сделки</label>
          <CustomDropdown
            value={filters.transactionType || 'all'}
            onChange={v => handleFilterChange('transactionType', v)}
            options={[
              { value: 'all', label: 'Все сделки' },
              { value: 'Продажа', label: 'Продажа' },
              { value: 'Аренда', label: 'Аренда' },
            ]}
            className=""
          />
        </div>
        {/* Price Range */}
        <div className="flex-1 min-w-max">
          <label className="block text-sm font-medium text-gray-700 mb-2">Цена (₽)</label>
          <CustomDropdown
            value={(() => {
              if (filters.minPrice === undefined && filters.maxPrice === undefined) return 'all';
              if (filters.minPrice === 0 && filters.maxPrice === 500000) return '0-500k';
              if (filters.minPrice === 500000 && filters.maxPrice === 1000000) return '500k-1m';
              if (filters.minPrice === 1000000 && filters.maxPrice === 2000000) return '1m-2m';
              if (filters.minPrice === 2000000 && filters.maxPrice === 5000000) return '2m-5m';
              if (filters.minPrice === 5000000 && filters.maxPrice === undefined) return '5m+';
              return 'all';
            })()}
            onChange={v => handleRangeChange('minPrice', 'maxPrice', v)}
            options={[
              { value: 'all', label: 'Все цены' },
              { value: '0-500k', label: 'до 500 тыс. руб.' },
              { value: '500k-1m', label: '500 тыс. – 1 млн руб.' },
              { value: '1m-2m', label: '1 млн – 2 млн руб.' },
              { value: '2m-5m', label: '2 млн – 5 млн руб.' },
              { value: '5m+', label: 'свыше 5 млн руб.' },
            ]}
            className=""
          />
        </div>
        {/* Area Range */}
        <div className="flex-1 min-w-max">
          <label className="block text-sm font-medium text-gray-700 mb-2">Площадь (м²)</label>
          <CustomDropdown
            value={(() => {
              if (filters.minArea === undefined && filters.maxArea === undefined) return 'all';
              if (filters.minArea === 0 && filters.maxArea === 500) return '0-500';
              if (filters.minArea === 500 && filters.maxArea === 1000) return '500-1000';
              if (filters.minArea === 1000 && filters.maxArea === 2000) return '1000-2000';
              if (filters.minArea === 2000 && filters.maxArea === 5000) return '2000-5000';
              if (filters.minArea === 5000 && filters.maxArea === undefined) return '5000+';
              return 'all';
            })()}
            onChange={v => handleAreaRangeChange('minArea', 'maxArea', v)}
            options={[
              { value: 'all', label: 'Все площади' },
              { value: '0-500', label: 'до 500 м²' },
              { value: '500-1000', label: '500 – 1000 м²' },
              { value: '1000-2000', label: '1000 – 2000 м²' },
              { value: '2000-5000', label: '2000 – 5000 м²' },
              { value: '5000+', label: 'более 5000 м²' },
            ]}
            className=""
          />
        </div>
        {/* Investment Return */}
        <div className="flex-1 min-w-max">
          <label className="block text-sm font-medium text-gray-700 mb-2">Доходность</label>
          <CustomDropdown
            value={(() => {
              if (filters.minInvestmentReturn === undefined && filters.maxInvestmentReturn === undefined) return 'all';
              if (filters.minInvestmentReturn === 0 && filters.maxInvestmentReturn === 10) return 'up-to-10';
              if (filters.minInvestmentReturn === 10 && filters.maxInvestmentReturn === 20) return '10-20';
              if (filters.minInvestmentReturn === 20 && filters.maxInvestmentReturn === 30) return '20-30';
              if (filters.minInvestmentReturn === 30 && filters.maxInvestmentReturn === undefined) return 'over-30';
              return 'all';
            })()}
            onChange={v => handleInvestmentReturnRangeChange('minInvestmentReturn', 'maxInvestmentReturn', v)}
            options={[
              { value: 'all', label: 'Все доходности' },
              { value: 'up-to-10', label: 'до 10% в год' },
              { value: '10-20', label: '10–20% в год' },
              { value: '20-30', label: '20–30% в год' },
              { value: 'over-30', label: 'свыше 30% в год' },
            ]}
            className=""
          />
        </div>
        {/* Очистить */}
        <div className="flex items-end">
          <button
            onClick={onClearFilters}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-blue-50 hover:border-blue-400 transition-colors flex items-center gap-2 font-medium relative"
          >
            <X className="h-4 w-4" /> Очистить
            {activeFiltersCount > 0 && (
              <span className="absolute -right-2 -top-2 ml-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border-2 border-white shadow">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyFilters;

