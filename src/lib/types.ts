export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'User';
  avatarUrl?: string;
  phone?: string; 
  shippingAddress?: ShippingAddress;
  billingAddress?: ShippingAddress;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  images: string[];
  inStock: boolean;
  createdAt?: string;
  updatedAt?: string;
  categoryName?: string; // For display purposes
  colors?: { name: string; code: string; id?: string; _id?: string }[];
  availableSizes?: string[];
  imageUrl?: string;
  media?: { url: string }[];
  compareAtPrice?: number;
  costPrice?: number;
  discountPercentage?: number;
  ratings?: { average: number; count: number };
  lowStockThreshold?: number;
  stock?: number;
  status?: string;
  isFeatured?: boolean;
  brandId?: string;
  tags?: string[];
  weight?: { value: number; unit: string };
  dimensions?: { length: number; width: number; height: number; unit: string };
  seo?: { title: string; description: string; keywords: string[] };
  slug?: string;
  sku?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string | null;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  productId: string;
  productName?: string; // For display
  productImage?: string; // For display
  quantity: number;
  price: number; // Price at the time of order
  brandId?: string;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  shippingAddress: string; // Stringified version for the API
  billingAddress?: string; // Optional
}

export interface Order {
  id: string;
  customerId: string;
  customerInfo?: CustomerInfo; // Optional if API doesn't always return it on GET
  items: OrderItem[];
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  totalAmount: number;
  shippingAddress: ShippingAddress; // Detailed object for app use
  createdAt: string; // Will be a string from mock, can be Date object
  updatedAt?: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

// This represents the available filter options to be passed to FilterPanel
export interface AvailableFilters {
  categories: Category[];
  priceRange: { min: number; max: number }; // This will be a sensible default or from product API meta
}

// This represents the filters applied by the user, used for constructing API queries or client-side filtering
export interface AppliedFilters {
  categoryId?: string; // Single category ID for API
  priceRange?: [number, number];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  // Add other filterable attributes if needed for client-side or specific API calls
}


export interface PaginatedResponse<T> {
  type: "OK" | "ERROR";
  message?: string;
  data: {
    items: T[];
    [key: string]: any; // For products, categories etc.
  };
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters?: { // This structure can hold what the API returns under 'meta.filters'
    applied: Record<string, any>;
    available: { // To hold potential min/max price from products API
        minPrice?: number;
        maxPrice?: number;
        [key: string]: any;
    };
  };
  sort?: {
    by: string;
    order: 'asc' | 'desc';
  };
}
