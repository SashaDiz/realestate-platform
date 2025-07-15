const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Property {
  _id: string;
  title: string;
  description: string;
  shortDescription: string;
  price: number;
  area: number;
  location: string;
  address: string;
  coordinates: [number, number];
  type: 'Жилые помещения' | 'Нежилые помещения' | 'Машино-места' | 'Гараж-боксы';
  transactionType: 'Продажа' | 'Аренда';
  investmentReturn?: number;
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
  formSubmissions: number;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyFilters {
  type?: string;
  transactionType?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  minInvestmentReturn?: number;
  maxInvestmentReturn?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PropertyResponse {
  properties: Property[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Utility functions
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export const formatArea = (area: number): string => {
  return `${area} м²`;
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('adminToken');
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Properties API
  async getProperties(filters: PropertyFilters = {}): Promise<PropertyResponse> {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const endpoint = `/properties${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<PropertyResponse>(endpoint);
  }

  async getPropertyTypeStats(): Promise<Record<string, number>> {
    return this.request<Record<string, number>>('/properties/stats/types');
  }

  async getPropertyById(id: string): Promise<Property> {
    return this.request<Property>(`/properties/${id}`);
  }

  async createProperty(propertyData: Partial<Property>): Promise<Property> {
    return this.request<Property>('/properties', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
  }

  async updateProperty(id: string, propertyData: Partial<Property>): Promise<Property> {
    return this.request<Property>(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(propertyData),
    });
  }

  async deleteProperty(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/properties/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleFeatured(id: string): Promise<Property> {
    return this.request<Property>(`/properties/${id}/featured`, {
      method: 'PATCH',
    });
  }

  async submitContactForm(id: string): Promise<{ message: string; formSubmissions: number }> {
    return this.request<{ message: string; formSubmissions: number }>(`/properties/${id}/submit`, {
      method: 'POST',
    });
  }

  // Auth API
  async login(username: string, password: string, rememberMe: boolean = false): Promise<{
    message: string;
    token: string;
    admin: { id: string; username: string; lastLogin: string };
  }> {
    const response = await this.request<{
      message: string;
      token: string;
      admin: { id: string; username: string; lastLogin: string };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, rememberMe }),
    });

    // Store token in localStorage
    if (typeof window !== 'undefined' && response.token) {
      localStorage.setItem('adminToken', response.token);
    }

    return response;
  }

  async logout(): Promise<{ message: string }> {
    const response = await this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });

    // Remove token from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
    }

    return response;
  }

  async checkAuth(): Promise<{ message: string; isAuthenticated: boolean }> {
    return this.request<{ message: string; isAuthenticated: boolean }>('/auth/check');
  }
}

export const api = new ApiClient();

