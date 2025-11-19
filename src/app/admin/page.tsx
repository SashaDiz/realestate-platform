'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Star,
  StarOff,
  LogOut,
  Building2,
  Search,
  Eye,
  MessageSquare,
  X,
  Save
} from 'lucide-react';
import { api, Property, formatPrice, formatArea, formatDate } from '@/lib/api';
import Image from 'next/image';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ password: '', rememberMe: false });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'title' | 'price' | 'views' | 'formSubmissions'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [propertyForm, setPropertyForm] = useState({
    title: '',
    description: '',
    shortDescription: '',
    price: 0,
    area: 0,
    location: '',
    address: '',
    coordinates: [55.7558, 37.6176] as [number, number],
    type: 'Жилые помещения' as Property['type'],
    transactionType: 'Продажа' as Property['transactionType'],
    investmentReturn: 0,
    images: [] as string[],
    layout: '',
    specifications: {
      rooms: 0,
      bathrooms: 0,
      parking: false,
      balcony: false,
      elevator: false,
      furnished: false,
    }
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getProperties({
        sortBy,
        sortOrder,
        limit: 100
      });
      setProperties(response.properties);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке объектов');
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProperties();
    }
  }, [isAuthenticated, fetchProperties]);

  const checkAuth = async () => {
    try {
      const response = await api.checkAuth();
      setIsAuthenticated(response.isAuthenticated);
    } catch (error: any) {
      setIsAuthenticated(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      await api.login(loginForm.password, loginForm.rememberMe);
      setIsAuthenticated(true);
      setLoginForm({ password: '', rememberMe: false });
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setIsAuthenticated(false);
      setProperties([]);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleCreateProperty = () => {
    setEditingProperty(null);
    setPropertyForm({
      title: '',
      description: '',
      shortDescription: '',
      price: 0,
      area: 0,
      location: '',
      address: '',
      coordinates: [55.7558, 37.6176],
      type: 'Жилые помещения',
      transactionType: 'Продажа',
      investmentReturn: 0,
      images: [],
      layout: '',
      specifications: {
        rooms: 0,
        bathrooms: 0,
        parking: false,
        balcony: false,
        elevator: false,
        furnished: false,
      }
    });
    setShowPropertyModal(true);
  };

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setPropertyForm({
      title: property.title,
      description: property.description,
      shortDescription: property.shortDescription,
      price: property.price,
      area: property.area,
      location: property.location,
      address: property.address,
      coordinates: property.coordinates,
      type: property.type,
      transactionType: property.transactionType,
      investmentReturn: property.investmentReturn || 0,
      images: property.images,
      layout: property.layout || '',
      specifications: {
        rooms: property.specifications.rooms ?? 0,
        bathrooms: property.specifications.bathrooms ?? 0,
        parking: property.specifications.parking ?? false,
        balcony: property.specifications.balcony ?? false,
        elevator: property.specifications.elevator ?? false,
        furnished: property.specifications.furnished ?? false,
      }
    });
    setShowPropertyModal(true);
  };

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingProperty) {
        await api.updateProperty(editingProperty._id, propertyForm);
      } else {
        await api.createProperty(propertyForm);
      }
      setShowPropertyModal(false);
      fetchProperties();
    } catch (err) {
      console.error('Error saving property:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот объект?')) {
      try {
        await api.deleteProperty(id);
        fetchProperties();
      } catch (err) {
        console.error('Error deleting property:', err);
      }
    }
  };

  const handleToggleFeatured = async (id: string) => {
    try {
      await api.toggleFeatured(id);
      fetchProperties();
    } catch (err) {
      console.error('Error toggling featured:', err);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    let newImages = [...propertyForm.images];
    for (let i = 0; i < files.length && newImages.length < 10; i++) {
      const file = files[i];
      // Заглушка: читаем файл как base64 (в реальности нужен upload на сервер)
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === 'string') {
          newImages = [...newImages, ev.target.result];
          setPropertyForm(prev => ({ ...prev, images: newImages.slice(0, 10) }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (idx: number) => {
    setPropertyForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx)
    }));
  };

  const filteredProperties = properties.filter(property =>
    property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Панель администратора</h1>
            <p className="text-gray-600 mt-2">Войдите для управления объектами</p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{loginError}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Пароль
              </label>
              <input
                type="password"
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="password"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={loginForm.rememberMe}
                onChange={(e) => setLoginForm(prev => ({ ...prev, rememberMe: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                Запомнить меня
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoggingIn ? 'Вход...' : 'Войти'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">

              <h1 className="text-xl font-medium text-gray-900">Панель администратора</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleCreateProperty}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Добавить объект</span>
              </button>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Поиск объектов..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="createdAt">По дате создания</option>
                <option value="title">По названию</option>
                <option value="price">По цене</option>
                <option value="views">По просмотрам</option>
                <option value="formSubmissions">По заявкам</option>
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="desc">По убыванию</option>
                <option value="asc">По возрастанию</option>
              </select>
            </div>
          </div>
        </div>

        {/* Properties Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Загрузка...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Объект
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Цена / Площадь
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статистика
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProperties.map((property) => (
                    <tr key={property._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            {property.images.length > 0 ? (
                              <Image
                                className="h-12 w-12 rounded-lg object-cover"
                                src={property.images[0]}
                                alt={property.title}
                                width={48}
                                height={48}
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {property.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {property.location}
                            </div>
                            <div className="text-xs text-gray-400">
                              {property.type} • {property.transactionType}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatPrice(property.price)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatArea(property.area)}
                        </div>
                        {property.investmentReturn && (
                          <div className="text-xs text-green-600">
                            {property.investmentReturn}%
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            <span>{property.views}</span>
                          </div>
                          <div className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            <span>{property.formSubmissions}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {property.isFeatured && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Рекомендуем
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(property.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleToggleFeatured(property._id)}
                            className={`p-2 rounded-md transition-colors ${property.isFeatured
                                ? 'text-yellow-600 hover:bg-yellow-50'
                                : 'text-gray-400 hover:bg-gray-50'
                              }`}
                            title={property.isFeatured ? 'Убрать из рекомендуемых' : 'Добавить в рекомендуемые'}
                          >
                            {property.isFeatured ? (
                              <Star className="h-4 w-4 fill-current" />
                            ) : (
                              <StarOff className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEditProperty(property)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Редактировать"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProperty(property._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Удалить"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Property Modal */}
      {showPropertyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingProperty ? 'Редактировать объект' : 'Добавить объект'}
                </h2>
                <button
                  onClick={() => setShowPropertyModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-md"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveProperty} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название *
                  </label>
                  <input
                    type="text"
                    required
                    value={propertyForm.title}
                    onChange={(e) => setPropertyForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тип недвижимости *
                  </label>
                  <select
                    required
                    value={propertyForm.type}
                    onChange={(e) => setPropertyForm(prev => ({ ...prev, type: e.target.value as Property['type'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Жилые помещения">Жилые помещения</option>
                    <option value="Нежилые помещения">Нежилые помещения</option>
                    <option value="Машино-места">Машино-места</option>
                    <option value="Гараж-боксы">Гараж-боксы</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Цена (₽) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={propertyForm.price}
                    onChange={(e) => setPropertyForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Площадь (м²) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={propertyForm.area}
                    onChange={(e) => setPropertyForm(prev => ({ ...prev, area: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тип сделки *
                  </label>
                  <select
                    required
                    value={propertyForm.transactionType}
                    onChange={(e) => setPropertyForm(prev => ({ ...prev, transactionType: e.target.value as Property['transactionType'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Продажа">Продажа</option>
                    <option value="Аренда">Аренда</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Доходность (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={propertyForm.investmentReturn}
                    onChange={(e) => setPropertyForm(prev => ({ ...prev, investmentReturn: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Например, 15"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Местоположение *
                  </label>
                  <input
                    type="text"
                    required
                    value={propertyForm.location}
                    onChange={(e) => setPropertyForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Адрес *
                  </label>
                  <input
                    type="text"
                    required
                    value={propertyForm.address}
                    onChange={(e) => setPropertyForm(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Краткое описание *
                </label>
                <textarea
                  required
                  rows={2}
                  value={propertyForm.shortDescription}
                  onChange={(e) => setPropertyForm(prev => ({ ...prev, shortDescription: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Полное описание *
                </label>
                <textarea
                  required
                  rows={4}
                  value={propertyForm.description}
                  onChange={(e) => setPropertyForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Изображения (до 10)
                </label>
                <div
                  className="relative border-2 border-dashed border-blue-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-blue-50/30"
                  onClick={() => document.getElementById('image-upload-input')?.click()}
                  onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) {
                      // Проксируем в handleImageUpload
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.accept = 'image/*';
                      input.onchange = (ev: Event) => handleImageUpload(ev as unknown as React.ChangeEvent<HTMLInputElement>);
                      input.files = files;
                      handleImageUpload({ target: { files } } as React.ChangeEvent<HTMLInputElement>);
                    }
                  }}
                >
                  <input
                    id="image-upload-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={propertyForm.images.length >= 10}
                    className="hidden"
                  />
                  <button
                    type="button"
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mb-2"
                    disabled={propertyForm.images.length >= 10}
                    tabIndex={-1}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Загрузить изображения
                  </button>
                  <span className="text-xs text-gray-500">Перетащите файлы сюда или нажмите для выбора</span>
                </div>
                <div className="flex flex-wrap mt-2">
                  {propertyForm.images.map((img, idx) => (
                    <div key={idx} className="relative mr-2 mb-2">
                      <Image src={img} alt={`img-${idx}`} width={64} height={64} className="rounded object-cover border border-gray-300" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-0 right-0 bg-white rounded-full p-1 shadow"
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
                {propertyForm.images.length >= 10 && (
                  <p className="text-xs text-red-500">Максимум 10 изображений</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Координаты (широта, долгота)
                  </label>
                  <input
                    type="text"
                    value={propertyForm.coordinates.join(', ')}
                    onChange={e => {
                      const value = e.target.value;
                      const parts = value.split(',').map(s => parseFloat(s.trim()));
                      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                        setPropertyForm(prev => ({ ...prev, coordinates: [parts[0], parts[1]] }));
                      } else {
                        // Если невалидно, не обновляем coordinates
                        setPropertyForm(prev => ({ ...prev, coordinates: prev.coordinates }));
                      }
                    }}
                    placeholder="55.7558, 37.6176"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowPropertyModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <span className="flex items-center">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      {editingProperty ? 'Сохранение...' : 'Создание...'}
                    </span>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>{editingProperty ? 'Сохранить' : 'Создать'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

