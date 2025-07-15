import mongoose, { Document, Schema } from 'mongoose';

export interface IProperty extends Document {
  title: string;
  description: string;
  shortDescription: string;
  price: number;
  area: number;
  location: string;
  address: string;
  coordinates: [number, number]; // [latitude, longitude]
  type: 'Жилые помещения' | 'Нежилые помещения' | 'Машино-места' | 'Гараж-боксы';
  transactionType: 'Продажа' | 'Аренда';
  investmentReturn?: number; // доходность в процентах, например 15 (означает 15%)
  images: string[];
  isFeatured: boolean;
  layout?: string;
  specifications: {
    rooms?: number;
    bathrooms?: number;
    parking?: boolean;
    balcony?: boolean;
    elevator?: boolean;
    furnished?: boolean;
  };
  views: number;
  submissions: number;
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  shortDescription: {
    type: String,
    required: true,
    maxlength: 300
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  area: {
    type: Number,
    required: true,
    min: 0
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  coordinates: {
    type: [Number],
    required: true,
    validate: {
      validator: function(v: number[]) {
        return v.length === 2 &&
               v[0] >= -90 && v[0] <= 90 &&
               v[1] >= -180 && v[1] <= 180;
      },
      message: 'Coordinates must be [latitude, longitude] with valid ranges'
    }
  },
  type: {
    type: String,
    required: true,
    enum: ['Жилые помещения', 'Нежилые помещения', 'Машино-места', 'Гараж-боксы']
  },
  transactionType: {
    type: String,
    required: true,
    enum: ['Продажа', 'Аренда']
  },
  investmentReturn: {
    type: Number,
    min: 0,
    max: 100,
  },
  images: [{
    type: String,
    required: true
  }],
  isFeatured: {
    type: Boolean,
    default: false
  },
  layout: {
    type: String,
    trim: true
  },
  specifications: {
    rooms: {
      type: Number,
      min: 0
    },
    bathrooms: {
      type: Number,
      min: 0
    },
    parking: {
      type: Boolean,
      default: false
    },
    balcony: {
      type: Boolean,
      default: false
    },
    elevator: {
      type: Boolean,
      default: false
    },
    furnished: {
      type: Boolean,
      default: false
    }
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  submissions: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Index for better query performance
PropertySchema.index({ isFeatured: -1, createdAt: -1 });
PropertySchema.index({ type: 1 });
PropertySchema.index({ transactionType: 1 });
PropertySchema.index({ price: 1 });
PropertySchema.index({ area: 1 });
PropertySchema.index({ coordinates: '2dsphere' });

export default mongoose.model<IProperty>('Property', PropertySchema);

