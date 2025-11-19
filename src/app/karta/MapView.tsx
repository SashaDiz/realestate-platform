"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import { Property } from '@/lib/api';
import { useMap } from 'react-leaflet';

// Динамические импорты react-leaflet
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const ZoomControl = dynamic(() => import('react-leaflet').then(mod => mod.ZoomControl), { ssr: false });

import { formatPrice, formatArea } from '@/lib/api';

// Функция для создания кастомной иконки-кружочка
const getCircleIcon = (color: string) => {
  return L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 0 2px rgba(0,0,0,0.15);"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });
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

// Компонент для управления scrollWheelZoom по Ctrl
function CtrlWheelZoomHandler() {
  const map = useMap() as L.Map | null;
  React.useEffect(() => {
    if (!map) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        map.scrollWheelZoom.enable();
      } else {
        map.scrollWheelZoom.disable();
      }
    };
    const container = map.getContainer();
    container.addEventListener('wheel', handleWheel, { passive: false });
    // Отключаем scrollWheelZoom по умолчанию
    map.scrollWheelZoom.disable();
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [map]);
  return null;
}

interface MapViewProps {
  filteredProperties: Property[];
}

const MapView: React.FC<MapViewProps> = ({ filteredProperties }) => {
  // useEffect для предотвращения скролла страницы при взаимодействии с zoomControl
  React.useEffect(() => {
    // Ждём появления DOM-элемента zoom-контрола
    const interval = setInterval(() => {
      const zoomControl = document.querySelector('.leaflet-control-zoom');
      if (zoomControl) {
        // wheel
        zoomControl.addEventListener('wheel', (e) => {
          e.preventDefault();
          e.stopPropagation();
        }, { passive: false });
        // touchpad pinch/zoom
        zoomControl.addEventListener('touchmove', (e) => {
          e.preventDefault();
          e.stopPropagation();
        }, { passive: false });
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <MapContainer
      center={[55.7558, 37.6176]} // Moscow coordinates
      zoom={10}
      style={{ height: '100%', width: '100%', zIndex: 0 }}
      scrollWheelZoom={false}
      zoomControl={false} // отключаем стандартный контрол
    >
      {/* Обработчик Ctrl+wheel */}
      <CtrlWheelZoomHandler />
      {/* Кастомный zoomControl в правом нижнем углу */}
      <ZoomControl position="bottomright" />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {filteredProperties.map((property) => (
        <Marker
          key={property._id}
          position={property.coordinates}
          icon={getCircleIcon(getMarkerColor(property.type))}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <h3 className="font-medium text-gray-900 mb-2">
                {property.title}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {property.shortDescription}
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Цена:</span>
                  <span className="font-medium text-blue-600">
                    {formatPrice(property.price)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Площадь:</span>
                  <span className="font-medium">
                    {formatArea(property.area)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Тип:</span>
                  <span className="font-medium">
                    {property.type}
                  </span>
                </div>
                {property.investmentReturn && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Доходность:</span>
                    <span className="font-medium text-green-600">
                      {property.investmentReturn}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => window.open(`/property/${property._id}`, '_blank')}
                className="w-full mt-3 bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Подробнее
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapView;
