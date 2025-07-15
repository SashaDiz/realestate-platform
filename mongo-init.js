// MongoDB initialization script
db = db.getSiblingDB('real-estate-directory');

// Create collections
db.createCollection('properties');
db.createCollection('admins');

// Create indexes for better performance
db.properties.createIndex({ "title": "text", "description": "text", "location": "text" });
db.properties.createIndex({ "type": 1 });
db.properties.createIndex({ "transactionType": 1 });
db.properties.createIndex({ "price": 1 });
db.properties.createIndex({ "area": 1 });
db.properties.createIndex({ "isFeatured": 1 });
db.properties.createIndex({ "createdAt": -1 });
db.properties.createIndex({ "coordinates": "2dsphere" });

// Админ-пользователь должен создаваться через API или seed-скрипт, используя переменные окружения для безопасности.

// Insert sample properties
db.properties.insertMany([
  {
    title: 'Современная квартира в центре Москвы',
    description: 'Просторная 3-комнатная квартира в престижном районе с отличной транспортной доступностью. Квартира полностью отремонтирована, с качественной отделкой и современной техникой.',
    shortDescription: 'Просторная 3-комнатная квартира в престижном районе',
    price: 15000000,
    area: 85,
    location: 'Центральный район, Москва',
    address: 'ул. Тверская, 15',
    coordinates: [55.7558, 37.6176],
    type: 'Жилые помещения',
    transactionType: 'Продажа',
    investmentReturn: 'до 25% в год',
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1560448075-bb485b067938?w=800'
    ],
    layout: '3 комнаты, кухня, 2 санузла',
    specifications: {
      rooms: 3,
      bathrooms: 2,
      parking: true,
      balcony: true,
      elevator: true,
      furnished: false
    },
    isFeatured: true,
    views: 245,
    formSubmissions: 12,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Офисное помещение в бизнес-центре',
    description: 'Современное офисное помещение в престижном бизнес-центре класса А. Отличная локация, развитая инфраструктура, высокие потолки, панорамные окна.',
    shortDescription: 'Современное офисное помещение в бизнес-центре класса А',
    price: 25000000,
    area: 120,
    location: 'Деловой центр, Москва',
    address: 'Московский проспект, 45',
    coordinates: [55.7387, 37.6032],
    type: 'Нежилые помещения',
    transactionType: 'Продажа',
    investmentReturn: 'до 30% в год',
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800'
    ],
    layout: 'Открытое пространство, переговорные, кухня',
    specifications: {
      rooms: 5,
      bathrooms: 2,
      parking: true,
      balcony: false,
      elevator: true,
      furnished: true
    },
    isFeatured: true,
    views: 189,
    formSubmissions: 8,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Машино-место в подземном паркинге',
    description: 'Удобное машино-место в охраняемом подземном паркинге жилого комплекса. Круглосуточная охрана, видеонаблюдение, удобный въезд.',
    shortDescription: 'Машино-место в охраняемом подземном паркинге',
    price: 2500000,
    area: 15,
    location: 'Жилой комплекс "Северный", Москва',
    address: 'ул. Северная, 28',
    coordinates: [55.8431, 37.6156],
    type: 'Машино-места',
    transactionType: 'Продажа',
    investmentReturn: 'до 15% в год',
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
    ],
    layout: 'Стандартное машино-место',
    specifications: {
      rooms: 0,
      bathrooms: 0,
      parking: true,
      balcony: false,
      elevator: true,
      furnished: false
    },
    isFeatured: false,
    views: 67,
    formSubmissions: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('Database initialized successfully!');
print('Sample data inserted.');
print('Indexes created for optimal performance.');

