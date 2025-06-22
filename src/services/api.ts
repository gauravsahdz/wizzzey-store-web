import type { PaginatedResponse, Product, User, Order, OrderItem, ShippingAddress, CustomerInfo, Category, AvailableFilters } from '@/lib/types';
import { getMockAvailableFilters } from '@/lib/mock-data'; // For temporary filter data

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Helper interface for the actual product structure from your API
interface ApiProduct {
  _id: string;
  id: string; // API response includes both _id and id
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  discountPercentage?: number;
  imageUrl?: string;
  media?: { url: string; type: string; alt?: string; _id: string; id: string }[];
  brandId?: string;
  stock: number;
  categoryId: string;
  categoryName?: string; // If API provides this
  colors?: { name: string; code: string; _id?: string; id?: string }[];
  availableSizes?: string[];
  createdAt?: string;
  updatedAt?: string;
  ratings?: { average: number; count: number };
  lowStockThreshold?: number;
  status?: string;
  isFeatured?: boolean;
  tags?: string[];
  weight?: { value: number; unit: string };
  dimensions?: { length: number; width: number; height: number; unit: string };
  seo?: { title: string; description: string; keywords: string[] };
  slug?: string;
  sku?: string;
}

// Helper interface for the actual API response structure for products list
interface RawProductListApiResponse {
  type: "OK" | "ERROR";
  message?: string;
  data: {
    products: ApiProduct[];
    [key: string]: any;
  };
  meta: {
    timestamp?: string;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    filters?: {
        applied: Record<string, any>;
        available: {
            minPrice?: number;
            maxPrice?: number;
            [key: string]: any;
        }
    };
    sort?: any;
  };
}

// Interface for product IDs response (no meta field)
interface RawProductIdsApiResponse {
  type: "OK" | "ERROR";
  message?: string;
  data: {
    products: ApiProduct[];
    requestedIds: string[];
    foundIds: string[];
    missingIds: string[];
    [key: string]: any;
  };
}

interface RawSingleProductApiResponse {
  type: "OK" | "ERROR";
  message?: string;
  data: {
    product: ApiProduct; // The product is nested here
    [key: string]: any;
  };
  meta?: Record<string, any>; // Meta might be minimal or absent for single product
}


interface ApiUser {
  _id: string;
  id?: string; // API might send id or _id
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

interface AuthResponseData {
  token: string;
  user?: ApiUser; // User data might be returned directly on login/register
}

interface ProfileResponseData {
  user: ApiUser;
}

interface ApiOrder {
    _id: string;
    id?: string;
    customerId: string;
    customerInfo?: CustomerInfo;
    items: OrderItem[];
    status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
    totalAmount: number;
    shippingAddress: ShippingAddress;
    createdAt: string;
    updatedAt?: string;
}

interface CreateOrderResponseData {
    order: ApiOrder;
}

// New interface for paginated orders response
interface RawPaginatedOrdersApiResponse {
  type: "OK" | "ERROR";
  message?: string;
  data: {
    orders: ApiOrder[];
    [key: string]: any;
  };
  meta: {
    timestamp?: string;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}


// Generic API response type
interface ApiResponse<T> {
  type: "OK" | "ERROR";
  message?: string;
  data?: T;
  error?: string; // Some APIs might use 'error' field for messages
  errors?: { field?: string; message: string }[]; // For validation errors
}

interface ApiCategory {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  // other fields if present
}

interface RawCategoryListApiResponse {
  type: "OK" | "ERROR";
  message?: string;
  data: {
    categories: ApiCategory[];
    [key: string]: any; // Allow other properties if API sends them
  };
  // Add meta if your categories API has pagination/meta
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    // ... any other meta fields
  };
}


/**
 * A generic function to fetch data from an API endpoint.
 * @param endpoint The API endpoint to fetch from (e.g., '/products').
 * @param options Optional request options (e.g., method, headers, body).
 * @param isProtected Whether the endpoint requires authentication.
 * @returns A promise that resolves with the fetched data.
 * @throws An error if the API request fails.
 */
async function fetchFromAPI<T>(endpoint: string, options: RequestInit = {}, isProtected: boolean = false): Promise<T> {
  if (!API_BASE_URL) {
    const errorMsg = "API_BASE_URL is not defined. Please set NEXT_PUBLIC_API_BASE_URL in your .env.local file (e.g., NEXT_PUBLIC_API_BASE_URL=http://localhost:3000) and restart the Next.js dev server.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  const url = `${API_BASE_URL}${endpoint}`;

  const requestOptions: RequestInit = { ...options };

  if (!requestOptions.headers) {
    requestOptions.headers = new Headers();
  }
  if (!(requestOptions.headers instanceof Headers)) {
    requestOptions.headers = new Headers(requestOptions.headers as HeadersInit);
  }

  if (!requestOptions.headers.has('Content-Type') && !(options?.body instanceof FormData) && options.method !== 'GET' && options.method !== 'HEAD') {
    requestOptions.headers.append('Content-Type', 'application/json');
  }

  if (isProtected) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (token) {
      requestOptions.headers.append('Authorization', `Bearer ${token}`);
    } else {
      console.warn(`Attempted to call protected endpoint ${endpoint} without a token.`);
      // Consider throwing an error or redirecting to login if token is essential
      // For now, let it proceed, and the API will likely return a 401/403
    }
  }

  try {
    const response = await fetch(url, requestOptions);
    const contentType = response.headers.get("content-type");

    let responseData: any; // Use 'any' to handle various error response shapes
    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json();
    } else if (response.ok && response.status === 204) {
        return {} as T;
    } else if (!response.ok && !contentType?.includes("application/json")) {
         throw new Error(`API request to ${endpoint} failed with status ${response.status}: ${response.statusText}. Response was not JSON.`);
    }


    if (!response.ok) {
      let apiMessage: string | undefined = undefined;
      let validationErrorsMessage: string | undefined = undefined;

      if (responseData) {
        // Check for top-level message or error
        if (typeof responseData.message === 'string' && responseData.message.trim() !== '') {
          apiMessage = responseData.message.trim();
        } else if (typeof responseData.error === 'string' && responseData.error.trim() !== '') {
          apiMessage = responseData.error.trim();
        }

        // Check for detailed validation errors
        if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
          validationErrorsMessage = responseData.errors
            .map((err: { field?: string; message: string; }) => {
              // Ensure err.message is a string, provide fallback if not
              const msgPart = typeof err.message === 'string' ? err.message : 'Invalid error structure';
              return err.field ? `${err.field}: ${msgPart}` : msgPart;
            })
            .join('; ');
        }
      }

      let finalErrorMessage: string;

      // Determine if the primary apiMessage is just a numeric status code (e.g., "400", "500")
      const isApiMessageJustStatusCode = apiMessage && /^\d{3}$/.test(apiMessage) && !isNaN(parseInt(apiMessage));

      if (apiMessage && !isApiMessageJustStatusCode) {
        // Use the API's message if it's descriptive
        finalErrorMessage = apiMessage;
        if (validationErrorsMessage) {
          // Append validation details if they also exist
          finalErrorMessage += `. Details: ${validationErrorsMessage}`;
        }
      } else if (validationErrorsMessage) {
        // If no good primary message, but validation errors exist
        finalErrorMessage = `Invalid input. Details: ${validationErrorsMessage}`;
      } else {
        // Fallback to a generic message based on status
        finalErrorMessage = `Request to ${endpoint} failed with status ${response.status}`;
        if (response.statusText) {
          finalErrorMessage += `: ${response.statusText}`;
        }
        // Add more specific advice based on common HTTP error codes
        if (response.status === 400) {
          finalErrorMessage += `. Please check the submitted data.`;
        } else if (response.status === 401) {
          finalErrorMessage += `. Authentication required. Please log in.`;
        } else if (response.status === 403) {
          finalErrorMessage += `. You do not have permission to perform this action.`;
        } else if (response.status >= 500) {
          finalErrorMessage += `. The server encountered an error. Please try again later.`;
        } else {
          finalErrorMessage += `. Please try again.`; // General fallback
        }
      }

      const error = new Error(finalErrorMessage) as any;
      error.status = response.status;
      error.response = responseData; // Keep for potential debugging access
      throw error;
    }

    return responseData as T;

  } catch (error: any) {
    console.error(`Error fetching from API endpoint ${endpoint}:`, error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
        const detailedMessage = `Failed to fetch from ${url}. This could be due to several reasons:
1. The API server at ${API_BASE_URL} might not be running or accessible. Please ensure your backend is running.
2. There might be a CORS (Cross-Origin Resource Sharing) issue. Ensure the server is configured to accept requests from this origin (your Next.js app's URL).
3. A network connectivity problem. Check your internet connection.
Original error: ${error.message}`;
        console.error(detailedMessage);
        throw new Error(detailedMessage);
    }
    // If error already has a status (meaning it was an API error we processed), re-throw it.
    // Otherwise, wrap it if it's an unexpected error during the fetch process.
    if (error.status) {
       throw error;
    }
    throw new Error(`An unknown error occurred while fetching from ${url}. Original error: ${error.message || String(error)}`);
  }
}

const mapApiProductToProduct = (apiProduct: ApiProduct): Product => {
  let images: string[] = [];
  const baseUrl = API_BASE_URL || '';

  if (apiProduct.media && apiProduct.media.length > 0) {
    images = apiProduct.media.map(m =>
      m.url.startsWith('http') || m.url.startsWith('data:') ? m.url : `${baseUrl}${m.url.startsWith('/') ? m.url : '/' + m.url}`
    );
  } else if (apiProduct.imageUrl) {
    images = [
      apiProduct.imageUrl.startsWith('http') || apiProduct.imageUrl.startsWith('data:') ? apiProduct.imageUrl : `${baseUrl}${apiProduct.imageUrl.startsWith('/') ? apiProduct.imageUrl : '/' + apiProduct.imageUrl}`
    ];
  }

  if (images.length === 0) {
      images.push(`https://placehold.co/600x800.png?text=${encodeURIComponent(apiProduct.name)}`);
  }

  return {
    id: apiProduct.id || apiProduct._id,
    name: apiProduct.name,
    description: apiProduct.description,
    price: apiProduct.price,
    compareAtPrice: apiProduct.compareAtPrice,
    costPrice: apiProduct.costPrice,
    discountPercentage: apiProduct.discountPercentage,
    categoryId: apiProduct.categoryId,
    categoryName: apiProduct.categoryName,
    images: images,
    imageUrl: apiProduct.imageUrl,
    media: apiProduct.media,
    inStock: apiProduct.stock > 0,
    stock: apiProduct.stock,
    colors: apiProduct.colors,
    availableSizes: apiProduct.availableSizes,
    brandId: apiProduct.brandId,
    ratings: apiProduct.ratings,
    lowStockThreshold: apiProduct.lowStockThreshold,
    status: apiProduct.status,
    isFeatured: apiProduct.isFeatured,
    tags: apiProduct.tags,
    weight: apiProduct.weight,
    dimensions: apiProduct.dimensions,
    seo: apiProduct.seo,
    slug: apiProduct.slug,
    sku: apiProduct.sku,
    createdAt: apiProduct.createdAt,
    updatedAt: apiProduct.updatedAt,
  };
};

const mapApiOrderToOrder = (apiOrder: ApiOrder): Order => {
  const baseUrl = API_BASE_URL || '';
  return {
    id: apiOrder.id || apiOrder._id,
    customerId: apiOrder.customerId,
    customerInfo: apiOrder.customerInfo,
    items: apiOrder.items.map(item => {
      let productImage = item.productImage || "https://placehold.co/100x100.png";
      if (productImage && !(productImage.startsWith('http') || productImage.startsWith('data:'))) {
          productImage = `${baseUrl}${productImage.startsWith('/') ? productImage : '/' + productImage}`;
      }
      return {
        ...item,
        productName: item.productName || "Product Name Unavailable",
        productImage: productImage,
        brandId: item.brandId,
      };
    }),
    status: apiOrder.status,
    totalAmount: apiOrder.totalAmount,
    shippingAddress: apiOrder.shippingAddress,
    createdAt: apiOrder.createdAt,
    updatedAt: apiOrder.updatedAt,
  };
};

export interface FetchProductsParams {
  page?: number;
  limit?: number;
  categoryId?: string; // API expects single categoryId
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  name?: string;
  inStock?: boolean;
  product_ids?: string[]; // Array of product IDs to fetch specific products
}

export async function fetchProducts(params: FetchProductsParams = {}): Promise<PaginatedResponse<Product>> {
  const { page = 1, limit = 9, product_ids, ...otherFilters } = params;
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('limit', String(limit));

  // Handle product_ids parameter specially - it should be passed as product_ids to the API
  if (product_ids && product_ids.length > 0) {
    query.set('product_ids', JSON.stringify(product_ids));
    console.log('Setting product_ids in query:', JSON.stringify(product_ids));
  }

  Object.entries(otherFilters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
       query.set(key, String(value));
    }
  });

  const endpoint = `/api/products?${query.toString()}`;
  console.log('API endpoint being called:', endpoint);
  
  // Use union type to handle both response structures
  const rawResponse = await fetchFromAPI<RawProductListApiResponse | RawProductIdsApiResponse>(endpoint);

  const transformedProducts: Product[] = rawResponse.data.products.map(mapApiProductToProduct);

  // Check if this is a product IDs response (has requestedIds field) or regular paginated response
  const isProductIdsResponse = 'requestedIds' in rawResponse.data;

  if (isProductIdsResponse) {
    // Handle product IDs response (no meta field)
    const productIdsResponse = rawResponse as RawProductIdsApiResponse;
    return {
      type: productIdsResponse.type,
      message: productIdsResponse.message,
      data: {
        items: transformedProducts,
      },
      pagination: {
        total: transformedProducts.length,
        page: 1,
        limit: transformedProducts.length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
      filters: {
        applied: {},
        available: {
          minPrice: undefined,
          maxPrice: undefined,
        }
      },
      sort: { by: 'createdAt', order: 'desc' },
    };
  } else {
    // Handle regular paginated response
    const paginatedResponse = rawResponse as RawProductListApiResponse;
    const availableFiltersData = paginatedResponse.meta.filters?.available || {};

    return {
      type: paginatedResponse.type,
      message: paginatedResponse.message,
      data: {
        items: transformedProducts,
      },
      pagination: {
        total: paginatedResponse.meta.total,
        page: paginatedResponse.meta.page,
        limit: paginatedResponse.meta.limit,
        totalPages: paginatedResponse.meta.totalPages,
        hasNextPage: paginatedResponse.meta.hasNextPage,
        hasPrevPage: paginatedResponse.meta.hasPrevPage,
      },
      filters: {
        applied: paginatedResponse.meta.filters?.applied || {},
        available: {
          minPrice: availableFiltersData.minPrice,
          maxPrice: availableFiltersData.maxPrice,
        }
      },
      sort: paginatedResponse.meta.sort || { by: 'createdAt', order: 'desc' },
    };
  }
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const endpoint = `/api/products?id=${id}`; // API takes product ID as a query param
  try {
    const rawResponse = await fetchFromAPI<RawSingleProductApiResponse | RawProductListApiResponse>(endpoint);

    let productData: ApiProduct | undefined;

    // Check response structure: single product or list with one product
    if ('product' in rawResponse.data) {
      productData = (rawResponse.data as {product: ApiProduct}).product;
    } else if ('products' in rawResponse.data && Array.isArray(rawResponse.data.products) && rawResponse.data.products.length > 0) {
      productData = rawResponse.data.products[0];
    }

    if (rawResponse.type === "OK" && productData) {
      return mapApiProductToProduct(productData);
    }
    if (rawResponse.type === "ERROR") {
      console.error(`Error fetching product ${id}: ${rawResponse.message}`);
      return null;
    }
    return null; // Product not found or unexpected response structure
  } catch (error: any) {
    if (error.status === 404) {
      return null; // Product not found
    }
    console.error(`Failed to fetch product by ID ${id}:`, error);
    throw error; // Re-throw other errors
  }
}


export async function fetchCategories(): Promise<Category[]> {
  const response = await fetchFromAPI<RawCategoryListApiResponse>('/api/categories');
  if (response.type === "ERROR" || !response.data || !response.data.categories) {
    throw new Error(response.message || (response as any).error || 'Failed to fetch categories');
  }

  return response.data.categories.map(apiCategory => {
    const baseUrl = API_BASE_URL || '';
    let imageUrl = apiCategory.imageUrl;
    if (imageUrl && !(imageUrl.startsWith('http') || imageUrl.startsWith('data:'))) {
      imageUrl = `${baseUrl}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
    }
    if (!imageUrl) {
        imageUrl = `https://placehold.co/300x200.png?text=${encodeURIComponent(apiCategory.name)}`;
    }
    return {
      id: apiCategory.id || apiCategory._id,
      name: apiCategory.name,
      description: apiCategory.description,
      imageUrl: imageUrl,
    };
  });
}

// This function remains to provide filter options to the FilterPanel component
export const fetchAvailableFilters = async (): Promise<AvailableFilters> => {
  // In a real scenario, this might fetch distinct filterable values from the API
  // or use metadata from the product listing endpoint if it provides it.
  // For now, we fetch categories and use a default/mock price range.
  const categories = await fetchCategories(); // Fetch actual categories

  // Try to get price range from a general product fetch if your API supports it
  // or use a sensible default.
  // This example assumes the main `fetchProducts` might return global min/max in its meta.
  // As a fallback, a wide default range.
  let minPrice = 0;
  let maxPrice = 5000; // Default max price
  try {
    // Attempt to get actual range from products data.
    // If your `/api/products` returns min/max price in its meta/filters/available section, it will be used.
    // Otherwise, the FilterPanel will use its own default.
    const productsResponse = await fetchProducts({ limit: 1 }); // Fetch minimal data to potentially get filter metadata
    if (productsResponse.filters?.available?.minPrice !== undefined) {
      minPrice = productsResponse.filters.available.minPrice;
    }
    if (productsResponse.filters?.available?.maxPrice !== undefined) {
      maxPrice = productsResponse.filters.available.maxPrice;
    }
  } catch (error) {
    console.warn("Could not fetch dynamic price range for filters, using default.", error);
  }

  return {
    categories: categories,
    priceRange: { min: minPrice, max: maxPrice },
  };
};


// Authentication API functions
export async function loginUser(credentials: { email: string; pass: string }): Promise<AuthResponseData> {
  const response = await fetchFromAPI<ApiResponse<AuthResponseData>>(`/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({email: credentials.email, password: credentials.pass}),
  });
  if (response.type === "ERROR" || !response.data) {
    throw new Error(response.message || (response as any).error || 'Login failed');
  }
  return response.data;
}

export async function registerUser(userData: { name: string; email: string; pass: string }): Promise<AuthResponseData> {
   const response = await fetchFromAPI<ApiResponse<AuthResponseData>>(`/api/auth/register`, {
    method: 'POST',
    body: JSON.stringify({name: userData.name, email: userData.email, password: userData.pass}),
  });
  if (response.type === "ERROR" || !response.data) {
    throw new Error(response.message || (response as any).error || 'Registration failed');
  }
  return response.data;
}

export async function fetchUserProfile(): Promise<User> {
  const response = await fetchFromAPI<ApiResponse<ProfileResponseData>>(`/api/auth/profile`, {}, true);
  if (response.type === "ERROR" || !response.data || !response.data.user) {
    throw new Error(response.message || (response as any).error || 'Failed to fetch user profile');
  }
  const apiUser = response.data.user;
  return {
    id: apiUser._id || apiUser.id!,
    name: apiUser.name,
    email: apiUser.email,
    role: apiUser.role,
    avatarUrl: apiUser.avatarUrl,
    phone: apiUser.phone,
    shippingAddress: apiUser.shippingAddress,
    billingAddress: apiUser.billingAddress,
    createdAt: apiUser.createdAt,
    updatedAt: apiUser.updatedAt,
  };
}

export interface UpdateUserProfilePayload {
  phone?: string;
  shippingAddress?: ShippingAddress;
  billingAddress?: ShippingAddress;
}

export async function updateUserProfile(payload: UpdateUserProfilePayload): Promise<User> {
  const response = await fetchFromAPI<ApiResponse<{ user: ApiUser }>>(`/api/auth/profile`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, true);

  if (response.type === "ERROR" || !response.data || !response.data.user) {
    throw new Error(response.message || (response as any).error || 'Failed to update user profile');
  }
  const apiUser = response.data.user;
  return {
    id: apiUser._id || apiUser.id!,
    name: apiUser.name,
    email: apiUser.email,
    role: apiUser.role,
    avatarUrl: apiUser.avatarUrl,
    phone: apiUser.phone,
    shippingAddress: apiUser.shippingAddress,
    billingAddress: apiUser.billingAddress,
    createdAt: apiUser.createdAt,
    updatedAt: apiUser.updatedAt,
  };
}

// Order API functions
interface CreateOrderPayload {
  items: OrderItem[];
  customerInfo: CustomerInfo;
  shippingAddress: ShippingAddress;
  totalAmount: number;
  paymentMethod: string;
}

export async function createOrderApi(orderData: CreateOrderPayload): Promise<Order> {
  const response = await fetchFromAPI<ApiResponse<CreateOrderResponseData>>(`/api/orders`, {
    method: 'POST',
    body: JSON.stringify(orderData),
  }, true);

  if (response.type === "ERROR" || !response.data || !response.data.order) {
    throw new Error(response.message || (response as any).error || 'Failed to create order');
  }
  const apiOrder = response.data.order;
  return mapApiOrderToOrder(apiOrder);
}

export async function fetchMyOrders(
  page: number = 1,
  limit: number = 10,
  sortBy: string = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<Order[]> { // For now, returning Order[] as component expects, not full PaginatedResponse<Order>
  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortBy: sortBy,
    sortOrder: sortOrder,
  });
  const endpoint = `/api/orders/my-orders?${queryParams.toString()}`;

  const response = await fetchFromAPI<RawPaginatedOrdersApiResponse>(endpoint, {}, true);

  if (response.type === "ERROR" || !response.data || !response.data.orders) {
    throw new Error(response.message || (response as any).error || 'Failed to fetch orders');
  }
  // The API response is paginated, but for now, the component expects Order[] directly from this page.
  return response.data.orders.map(mapApiOrderToOrder);
}
