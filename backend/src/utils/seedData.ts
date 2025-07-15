import mongoose from 'mongoose';
import Property from '../models/Property';
import connectDB from '../config/database';

const sampleProperties = [
  {
    title: 'Современная квартира в центре Москвы',
    description: 'Просторная 3-комнатная квартира в престижном районе с отличной транспортной доступностью. Квартира полностью отремонтирована, с качественной мебелью и техникой. Рядом развитая инфраструктура: магазины, рестораны, парки.',
    shortDescription: 'Просторная 3-комнатная квартира в престижном районе с отличной транспортной доступностью.',
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
    isFeatured: true,
    layout: '3 комнаты, кухня, 2 санузла',
    specifications: {
      rooms: 3,
      bathrooms: 2,
      parking: true,
      balcony: true,
      elevator: true,
      furnished: true
    }
  },
  {
    title: 'Офисное помещение в бизнес-центре',
    description: 'Современное офисное помещение класса А в новом бизнес-центре. Отличная локация для ведения бизнеса, развитая инфраструктура, удобная парковка. Помещение готово к заселению.',
    shortDescription: 'Современное офисное помещение класса А в новом бизнес-центре.',
    price: 120000,
    area: 150,
    location: 'Деловой центр, Москва',
    address: 'Московский проспект, 45',
    coordinates: [55.7387, 37.6032],
    type: 'Нежилые помещения',
    transactionType: 'Аренда',
    investmentReturn: 'до 30% в год',
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800'
    ],
    isFeatured: true,
    layout: 'Открытое пространство, переговорная, кухня',
    specifications: {
      parking: true,
      elevator: true,
      furnished: false
    }
  },
  {
    title: 'Машино-место в подземном паркинге',
    description: 'Удобное машино-место в охраняемом подземном паркинге жилого комплекса. Круглосуточная охрана, видеонаблюдение, удобный въезд и выезд.',
    shortDescription: 'Удобное машино-место в охраняемом подземном паркинге жилого комплекса.',
    price: 2500000,
    area: 15,
    location: 'Жилой комплекс "Северный", Москва',
    address: 'ул. Северная, 12',
    coordinates: [55.8431, 37.6156],
    type: 'Машино-места',
    transactionType: 'Продажа',
    investmentReturn: 'до 15% в год',
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
    ],
    isFeatured: false,
    layout: 'Стандартное машино-место',
    specifications: {
      parking: true
    }
  },
  {
    title: 'Гараж-бокс в кооперативе',
    description: 'Просторный гараж-бокс в охраняемом кооперативе. Есть смотровая яма, электричество, отопление. Возможность хранения автомобиля и инструментов.',
    shortDescription: 'Просторный гараж-бокс в охраняемом кооперативе с смотровой ямой.',
    price: 1800000,
    area: 24,
    location: 'Гаражный кооператив "Автолюбитель"',
    address: 'ул. Промышленная, 8',
    coordinates: [55.6892, 37.5547],
    type: 'Гараж-боксы',
    transactionType: 'Продажа',
    investmentReturn: 'до 12% в год',
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'
    ],
    isFeatured: false,
    layout: 'Гараж с смотровой ямой',
    specifications: {
      parking: true
    }
  },
  {
    title: 'Торговое помещение на первом этаже',
    description: 'Торговое помещение с отдельным входом на первом этаже жилого дома. Высокий трафик, отличная видимость, подходит для различных видов бизнеса.',
    shortDescription: 'Торговое помещение с отдельным входом на первом этаже жилого дома.',
    price: 80000,
    area: 75,
    location: 'Торговая улица, центр города',
    address: 'ул. Торговая, 23',
    coordinates: [55.7522, 37.6156],
    type: 'Нежилые помещения',
    transactionType: 'Аренда',
    investmentReturn: 'до 35% в год',
    images: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800'
    ],
    isFeatured: true,
    layout: 'Торговый зал, подсобное помещение, санузел',
    specifications: {
      parking: false,
      elevator: false,
      furnished: false
    }
  },
  {
    title: 'Студия в новостройке',
    description: 'Уютная студия в новом жилом комплексе. Современная планировка, качественная отделка, панорамные окна. Развитая инфраструктура района.',
    shortDescription: 'Уютная студия в новом жилом комплексе с современной планировкой.',
    price: 8500000,
    area: 35,
    location: 'ЖК "Новые горизонты"',
    address: 'ул. Новостроительная, 5',
    coordinates: [55.7789, 37.5899],
    type: 'Жилые помещения',
    transactionType: 'Продажа',
    investmentReturn: 'до 20% в год',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1560448204-61dc36dc98c8?w=800'
    ],
    isFeatured: false,
    layout: 'Студия, кухня-гостиная, санузел',
    specifications: {
      rooms: 1,
      bathrooms: 1,
      parking: true,
      balcony: true,
      elevator: true,
      furnished: false
    }
  }
];

export const seedDatabase = async (): Promise<void> => {
  try {
    await connectDB();
    
    // Clear existing properties
    await Property.deleteMany({});
    console.log('🗑️  Cleared existing properties');
    
    // Insert sample properties
    await Property.insertMany(sampleProperties);
    console.log('✅ Sample properties inserted successfully');
    
    console.log(`📊 Inserted ${sampleProperties.length} properties`);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed if called directly
if (require.main === module) {
  seedDatabase();
}

