'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Search, Filter, Building2, Car, Warehouse, Home, X } from 'lucide-react';
import { api, Property, PropertyFilters, formatPrice, formatArea } from '@/lib/api';

// Dynamically import map components to avoid SSR issues
// Удаляю динамические импорты react-leaflet и L, связанные с картой
// Динамический импорт MapView
const MapView = dynamic(() => import('./MapView'), { ssr: false });

// Типы для CustomDropdown
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

export default function MapPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [viewMode] = useState<'grid' | 'list'>('list');
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [properties, filters, searchTerm]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getProperties({ limit: 100 });
      setProperties(response.properties);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке объектов');
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...properties];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(property =>
        property.title.toLowerCase().includes(term) ||
        property.description.toLowerCase().includes(term) ||
        property.location.toLowerCase().includes(term) ||
        property.address.toLowerCase().includes(term)
      );
    }

    // Type filter
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(property => property.type === filters.type);
    }

    // Transaction type filter
    if (filters.transactionType && filters.transactionType !== 'all') {
      filtered = filtered.filter(property => property.transactionType === filters.transactionType);
    }

    // Price range filter
    if (filters.minPrice) {
      filtered = filtered.filter(property => property.price >= filters.minPrice!);
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(property => property.price <= filters.maxPrice!);
    }

    // Area range filter
    if (filters.minArea) {
      filtered = filtered.filter(property => property.area >= filters.minArea!);
    }
    if (filters.maxArea) {
      filtered = filtered.filter(property => property.area <= filters.maxArea!);
    }

    // Investment return filter (диапазон)
    if (filters.minInvestmentReturn !== undefined) {
      filtered = filtered.filter(property => property.investmentReturn !== undefined && property.investmentReturn >= filters.minInvestmentReturn!);
    }
    if (filters.maxInvestmentReturn !== undefined) {
      filtered = filtered.filter(property => property.investmentReturn !== undefined && property.investmentReturn <= filters.maxInvestmentReturn!);
    }

    setFilteredProperties(filtered);
  };

  const getPropertyTypeIcon = (type: string) => {
    switch (type) {
      case 'Жилые помещения':
        return <Home className="h-4 w-4" />;
      case 'Нежилые помещения':
        return <Building2 className="h-4 w-4" />;
      case 'Машино-места':
        return <Car className="h-4 w-4" />;
      case 'Гараж-боксы':
        return <Warehouse className="h-4 w-4" />;
      default:
        return <Building2 className="h-4 w-4" />;
    }
  };

  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'Жилые помещения':
        return '#10B981'; // green
      case 'Нежилые помещения':
        return '#3B82F6'; // blue
      case 'Машино-места':
        return '#F59E0B'; // yellow
      case 'Гараж-боксы':
        return '#EF4444'; // red
      default:
        return '#6B7280'; // gray
    }
  };

  // Удаляю функцию getCircleIcon, так как она теперь используется только в MapView

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Ошибка загрузки</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchProperties}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
        showSidebar ? 'w-96' : 'w-0'
      } overflow-hidden flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Карта объектов</h1>
            <button
              onClick={() => setShowSidebar(false)}
              className="p-2 hover:bg-gray-100 rounded-md"
              aria-label="Закрыть панель фильтров"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Поиск объектов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{ fontSize: 'var(--text-sm)' }}
            />
          </div>

          {/* Filters */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Тип недвижимости
              </label>
              <CustomDropdown
                value={filters.type || 'all'}
                onChange={v => setFilters(prev => ({ ...prev, type: v === 'all' ? undefined : v }))}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Тип сделки
              </label>
              <CustomDropdown
                value={filters.transactionType || 'all'}
                onChange={v => setFilters(prev => ({ ...prev, transactionType: v === 'all' ? undefined : v }))}
                options={[
                  { value: 'all', label: 'Все сделки' },
                  { value: 'Продажа', label: 'Продажа' },
                  { value: 'Аренда', label: 'Аренда' },
                ]}
                className=""
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Доходность
              </label>
              <CustomDropdown
                value={(() => {
                  if (filters.minInvestmentReturn === undefined && filters.maxInvestmentReturn === undefined) return 'all';
                  if (filters.minInvestmentReturn === 0 && filters.maxInvestmentReturn === 10) return 'up-to-10';
                  if (filters.minInvestmentReturn === 10 && filters.maxInvestmentReturn === 20) return '10-20';
                  if (filters.minInvestmentReturn === 20 && filters.maxInvestmentReturn === 30) return '20-30';
                  if (filters.minInvestmentReturn === 30 && filters.maxInvestmentReturn === undefined) return 'over-30';
                  return 'all';
                })()}
                onChange={v => {
                  let min: number | undefined = undefined;
                  let max: number | undefined = undefined;
                  switch (v) {
                    case 'up-to-10': min = 0; max = 10; break;
                    case '10-20': min = 10; max = 20; break;
                    case '20-30': min = 20; max = 30; break;
                    case 'over-30': min = 30; max = undefined; break;
                    case 'all': default: min = undefined; max = undefined; break;
                  }
                  setFilters(prev => ({ ...prev, minInvestmentReturn: min, maxInvestmentReturn: max }));
                }}
                options={[
                  { value: 'all', label: 'Любая доходность' },
                  { value: 'up-to-10', label: 'До 10% в год' },
                  { value: '10-20', label: '10–20% в год' },
                  { value: '20-30', label: '20–30% в год' },
                  { value: 'over-30', label: 'Свыше 30% в год' },
                ]}
                className=""
              />
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-600">
              Найдено: {filteredProperties.length}
            </span>
          </div>
        </div>

        {/* Properties List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4' : 'space-y-4'}>
            {filteredProperties.map((property) => (
              <div
                key={property._id}
                className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => window.open(`/property/${property._id}`, '_blank')}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 p-2 rounded-md" style={{ backgroundColor: getMarkerColor(property.type) }}>
                    {getPropertyTypeIcon(property.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {property.title}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {property.location}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-medium text-blue-600">
                        {formatPrice(property.price)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatArea(property.area)}
                      </span>
                    </div>
                    {property.investmentReturn && (
                      <div className="text-xs text-green-600 mt-1">
                        Доходность: до {property.investmentReturn}% годовых
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="p-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Легенда</h3>
          <div className="space-y-2">
            {[
              { type: 'Жилые помещения', color: '#10B981' },
              { type: 'Нежилые помещения', color: '#3B82F6' },
              { type: 'Машино-места', color: '#F59E0B' },
              { type: 'Гараж-боксы', color: '#EF4444' }
            ].map(({ type, color }) => (
              <div key={type} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-600">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        {/* Toggle Sidebar Button */}
        {!showSidebar && (
          <button
            onClick={() => setShowSidebar(true)}
            className="absolute top-4 left-4 z-10 bg-white p-2 rounded-md shadow-md hover:bg-gray-50"
            aria-label="Открыть панель фильтров"
            title="Открыть панель фильтров"
          >
            <Filter className="h-5 w-5" />
          </button>
        )}

        {/* Map */}
        <div className="h-full w-full">
          <MapView filteredProperties={filteredProperties} />
        </div>
      </div>
    </div>
  );
}

