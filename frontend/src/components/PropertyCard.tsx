'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Square, TrendingUp, Star } from 'lucide-react';
import { Property, formatPrice, formatArea } from '@/lib/api';

interface PropertyCardProps {
  property: Property;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const getPropertyTypeIcon = (type: string) => {
    switch (type) {
      case 'Жилые помещения':
        return '🏠';
      case 'Нежилые помещения':
        return '🏢';
      case 'Машино-места':
        return '🚗';
      case 'Гараж-боксы':
        return '🏗️';
      default:
        return '🏠';
    }
  };

  const getTransactionTypeColor = (type: string) => {
    return type === 'Продажа' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
  };

  return (
    <Link href={`/property/${property._id}`} className="block group">
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden min-h-[300px] h-full flex flex-col">
        {/* Image */}
        <div className="relative h-48 overflow-hidden shrink-0">
          {property.images && property.images.length > 0 ? (
            <Image
              src={property.images[0]}
              alt={property.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-4xl">{getPropertyTypeIcon(property.type)}</span>
            </div>
          )}
          {/* Featured badge */}
          {property.isFeatured && (
            <div className="absolute top-3 left-3 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
              <Star className="h-3 w-3 fill-current" />
              <span>Рекомендуем</span>
            </div>
          )}
          {/* Transaction type badge */}
          <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(property.transactionType)}`}>
            {property.transactionType}
          </div>
          {/* Investment return badge on image */}
          {property.investmentReturn && (
            <div className="absolute bottom-3 right-3 bg-white/90 rounded-full px-4 py-2 flex items-center shadow-lg border border-green-200">
              <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
              <span className="text-green-700 font-semibold text-xs whitespace-nowrap">
                до {property.investmentReturn}% годовых
              </span>
            </div>
          )}
        </div>
        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate group-hover:text-blue-600 transition-colors" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {property.title}
          </h3>
          {/* Short description */}
          <p className="text-gray-600 text-sm mb-3 line-clamp-2" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {property.shortDescription}
          </p>
          {/* Property details */}
          <div className="space-y-2 mb-4">
            {/* Property type */}
            <div className="mb-3 pb-3 border-b border-gray-100">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {property.type}
              </span>
            </div>
            {/* Location */}
            <div className="flex items-center text-gray-500 text-sm">
              <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="truncate">{property.location}</span>
            </div>
            {/* Area */}
            <div className="flex items-center text-gray-500 text-sm">
              <Square className="h-4 w-4 mr-1 flex-shrink-0" />
              <span>{formatArea(property.area)}</span>
            </div>

          </div>
          <div className="flex flex-col gap-1 mt-auto">
            {/* Price */}
            <p className="text-xl font-bold text-gray-900">
              {formatPrice(property.price)}
            </p>
            {/* Investment return (removed from here) */}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;

