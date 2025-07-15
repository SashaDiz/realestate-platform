'use client';

import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, Building2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import type { Icon } from 'leaflet';

// Динамические импорты react-leaflet
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });

export default function ContactsPage() {
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // SSR fix: создаём иконку только на клиенте
  const [companyIcon, setCompanyIcon] = useState<Icon | null>(null);
  useEffect(() => {
    import('leaflet').then(L => {
      setCompanyIcon(
        L.icon({
          iconUrl: '/marker-company.svg',
          iconSize: [48, 48],
          iconAnchor: [24, 48],
          popupAnchor: [0, -48],
        })
      );
    }).catch(e => {
      console.error('Ошибка загрузки leaflet:', e);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      setSubmitMessage('Сообщение отправлено успешно! Мы свяжемся с вами в ближайшее время.');
      setContactForm({ name: '', phone: '', email: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Свяжитесь с нами
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Мы готовы ответить на все ваши вопросы о недвижимости и помочь найти идеальный объект для инвестиций
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Контактная информация
              </h2>

              <div className="space-y-6">
                {/* Phone */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
                    <Phone className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Телефон</h3>
                    <p className="text-gray-600 mt-1">+7 (495) 123-45-67</p>
                    <p className="text-sm text-gray-500">Звонки принимаются с 9:00 до 21:00</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Email</h3>
                    <p className="text-gray-600 mt-1">info@propertyhub.ru</p>
                    <p className="text-sm text-gray-500">Ответим в течение часа</p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Адрес офиса</h3>
                    <p className="text-gray-600 mt-1">
                      г. Москва, ул. Тверская, 15<br />
                      офис 301, 3 этаж
                    </p>
                    <p className="text-sm text-gray-500">Метро Тверская, 2 минуты пешком</p>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Режим работы</h3>
                    <div className="text-gray-600 mt-1 space-y-1">
                      <p>Понедельник - Пятница: 9:00 - 19:00</p>
                      <p>Суббота: 10:00 - 16:00</p>
                      <p>Воскресенье: Выходной</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">PropertyHub</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                <strong>О компании:</strong><br />
                PropertyHub — это ведущая платформа для поиска и инвестирования в недвижимость.
                Мы специализируемся на предоставлении качественных объектов недвижимости с высокой
                доходностью для наших клиентов.
              </p>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  <strong>Лицензия:</strong> № 123456 от 01.01.2020<br />
                  <strong>ИНН:</strong> 1234567890<br />
                  <strong>ОГРН:</strong> 1234567890123
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Отправить сообщение
            </h2>

            {submitMessage && (
              <div className="mb-6 p-4 bg-green-100 border border-green-200 rounded-md">
                <p className="text-green-800">{submitMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Имя *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ваше имя"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Телефон *
                  </label>
                  <input
                    type="tel"
                    required
                    value={contactForm.phone}
                    onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тема сообщения
                </label>
                <select
                  value={contactForm.subject}
                  onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Выберите тему</option>
                  <option value="investment">Инвестиции в недвижимость</option>
                  <option value="property-search">Поиск недвижимости</option>
                  <option value="consultation">Консультация</option>
                  <option value="partnership">Партнерство</option>
                  <option value="other">Другое</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Сообщение *
                </label>
                <textarea
                  required
                  rows={6}
                  value={contactForm.message}
                  onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Расскажите подробнее о ваших потребностях..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span>Отправить сообщение</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                Отправляя форму, вы соглашаетесь с{' '}
                <a href="/privacy" className="text-blue-600 hover:text-blue-700">
                  политикой конфиденциальности
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-12">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Как нас найти
            </h2>
            <div className="h-96 rounded-lg overflow-hidden">
              <MapContainer
                center={[55.764913, 37.605049]}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
                zoomControl={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {companyIcon && (
                  <Marker
                    position={[55.764913, 37.605049]}
                    icon={companyIcon}
                  />
                )}
              </MapContainer>
            </div>
            <div className="text-center text-gray-500 mt-2">
              <p className="text-sm">г. Москва, ул. Тверская, 15</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

