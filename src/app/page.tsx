'use client';

import React, { useState, useEffect } from 'react';
import { Grid3X3, List, TrendingUp, Building2, Car, Warehouse, Home } from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import PropertyFilters from '@/components/PropertyFilters';
import { api, Property, PropertyFilters as Filters, PropertyResponse } from '@/lib/api';

export default function HomePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  const [filters, setFilters] = useState<Filters>({
    page: 1,
    limit: 12,
    sortBy: 'featured',
    sortOrder: 'desc'
  });

  const [propertyTypeStats, setPropertyTypeStats] = useState<Record<string, number>>({});
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Fetch properties
  const fetchProperties = async (currentFilters: Filters) => {
    try {
      setLoading(true);
      setError(null);
      const response: PropertyResponse = await api.getProperties(currentFilters);
      setProperties(response.properties);
      setPagination(response.pagination);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при загрузке объектов';
      
      // Show user-friendly message for database initialization errors
      if (errorMessage.includes('Database not initialized') || errorMessage.includes('not configured')) {
        setError('База данных не инициализирована. Пожалуйста, инициализируйте базу данных через админ-панель.');
      } else if (errorMessage.includes('connection failed')) {
        setError('Ошибка подключения к базе данных. Проверьте настройки подключения.');
      } else {
        setError(errorMessage);
      }
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load properties on component mount and filter changes
  useEffect(() => {
    fetchProperties(filters);
  }, [filters]);

  // Load property type stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError(null);
        const stats = await api.getPropertyTypeStats();
        setPropertyTypeStats(stats);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Ошибка при загрузке статистики';
        
        // Don't show error for database initialization - it's expected on first load
        if (errorMessage.includes('Database not initialized') || errorMessage.includes('not configured')) {
          // Silently fail - database will be initialized later
          setPropertyTypeStats({});
        } else if (errorMessage.includes('connection failed')) {
          setStatsError('Ошибка подключения к базе данных');
        } else {
          setStatsError(errorMessage);
        }
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 12,
      sortBy: 'featured',
      sortOrder: 'desc'
    });
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Ошибка загрузки</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchProperties(filters)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Каталог недвижимости для инвестиций
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Найдите объекты с высокой доходностью и начните инвестировать уже сегодня
            </p>
            <div className="flex items-center justify-center space-x-8 text-blue-100">
              <div className="flex items-center">
                <TrendingUp className="h-6 w-6 mr-2" />
                <span>До 30% годовых</span>
              </div>
              <div className="flex items-center">
                <Building2 className="h-6 w-6 mr-2" />
                <span>{pagination.total} объектов</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Property Type Stats */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statsLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="text-center p-4 rounded-lg bg-gray-50 animate-pulse">
                  <div className="h-8 w-8 mx-auto mb-2 bg-gray-200 rounded-full" />
                  <div className="h-6 w-12 mx-auto mb-1 bg-gray-200 rounded" />
                  <div className="h-4 w-20 mx-auto bg-gray-100 rounded" />
                </div>
              ))
            ) : statsError ? (
              <div className="col-span-4 text-center text-red-500">{statsError}</div>
            ) : (
              [
                { type: 'Жилые помещения', icon: Home },
                { type: 'Нежилые помещения', icon: Building2 },
                { type: 'Машино-места', icon: Car },
                { type: 'Гараж-боксы', icon: Warehouse },
              ].map(({ type, icon: Icon }) => (
                <div key={type} className="text-center p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <Icon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-gray-900">{propertyTypeStats[type] || 0}</div>
                  <div className="text-sm text-gray-600">{type}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <PropertyFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />

        {/* Results Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Объекты недвижимости
            </h2>
            <p className="text-gray-600">
              Найдено {pagination.total} объектов
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid3X3 className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Properties Grid/List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-300"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-full"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Объекты не найдены
            </h3>
            <p className="text-gray-600 mb-4">
              Попробуйте изменить параметры поиска или очистить фильтры
            </p>
            <button
              onClick={handleClearFilters}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Очистить фильтры
            </button>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid'
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1'
          }`}>
            {properties.map((property) => (
              <PropertyCard key={property._id} property={property} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center mt-8">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Предыдущая
              </button>

              {[...Array(pagination.pages)].map((_, i) => {
                const page = i + 1;
                const isCurrentPage = page === pagination.page;

                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      isCurrentPage
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Следующая
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
