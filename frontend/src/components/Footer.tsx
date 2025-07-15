import React from 'react';
import Link from 'next/link';
import { Building2, Phone, Mail, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">PropertyHub</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Ваш надежный партнер в мире недвижимости. Мы помогаем найти идеальные объекты для инвестиций и жизни.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Быстрые ссылки</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Все объекты
                </Link>
              </li>
              <li>
                <Link href="/karta" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Карта
                </Link>
              </li>
              <li>
                <Link href="/kontakty" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Контакты
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Контактная информация</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm">+7 (495) 123-45-67</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm">info@propertyhub.ru</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300 text-sm">
                  г. Москва, ул. Тверская, 15<br />
                  офис 301
                </span>
              </div>
            </div>
          </div>

          {/* Working Hours */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Режим работы</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex justify-between">
                <span>Пн - Пт:</span>
                <span>9:00 - 19:00</span>
              </div>
              <div className="flex justify-between">
                <span>Суббота:</span>
                <span>10:00 - 16:00</span>
              </div>
              <div className="flex justify-between">
                <span>Воскресенье:</span>
                <span>Выходной</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              &copy; 2024 PropertyHub. Все права защищены.
            </p>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Политика конфиденциальности
              </Link>
              <Link href="/admin" className="text-gray-600 hover:text-gray-500 transition-colors">
                Админ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

