// Client-side authentication utilities

export const checkTokenValidity = async (): Promise<boolean> => {
  const token = localStorage.getItem('accessToken');
  if (!token) return false;

  try {
    // Try to use the token with a simple endpoint
    const response = await fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      // Token is invalid or expired
      return false;
    }

    return response.ok;
  } catch (error) {
    return false;
  }
};

export const logout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  window.location.href = '/login';
};

export const validateAndRedirect = async () => {
  const isValid = await checkTokenValidity();
  if (!isValid) {
    logout();
  }
};

// Decode JWT without verification (client-side only for reading payload)
export const decodeToken = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

// Check if token is expired (client-side check)
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
};

// Validate token format and expiry before making requests
export const validateTokenBeforeRequest = (): boolean => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    logout();
    return false;
  }

  // Check if token format is valid
  if (token.split('.').length !== 3) {
    console.error('Invalid token format - logging out');
    logout();
    return false;
  }

  // Check if token is expired
  if (isTokenExpired(token)) {
    console.error('Token expired - logging out');
    logout();
    return false;
  }

  return true;
};
