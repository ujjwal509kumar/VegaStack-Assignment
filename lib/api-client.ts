// API client with automatic token validation and logout on tampering

export const apiClient = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('accessToken');
  
  // Add authorization header if token exists
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Check if response indicates invalid/tampered token
    if (response.status === 401) {
      const data = await response.json().catch(() => ({}));
      
      // If server indicates we should logout
      if (data.shouldLogout || data.error?.includes('Invalid') || data.error?.includes('tampered')) {
        console.error('Token is invalid or tampered - logging out');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        throw new Error('Session expired or invalid. Please login again.');
      }
    }

    return response;
  } catch (error) {
    // Network errors or other issues
    throw error;
  }
};

// Helper function to make authenticated requests
export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    window.location.href = '/login';
    throw new Error('No authentication token found');
  }

  // Basic client-side token format validation
  if (token.split('.').length !== 3) {
    console.error('Invalid token format detected - logging out');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
    throw new Error('Invalid token format');
  }

  return apiClient(url, options);
};
