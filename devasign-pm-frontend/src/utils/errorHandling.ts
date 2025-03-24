// Utility to extract friendly error messages from various error objects
export const getErrorMessage = (error: any): string => {
    if (!error) {
      return 'An unknown error occurred';
    }
    
    // If it's a string, return it directly
    if (typeof error === 'string') {
      return error;
    }
    
    // If it has a friendlyMessage property (from our axios interceptor)
    if (error.friendlyMessage) {
      return error.friendlyMessage;
    }
    
    // Standard Error object
    if (error.message) {
      return error.message;
    }
    
    // Axios error response
    if (error.response && error.response.data) {
      // Our API format
      if (error.response.data.error) {
        return error.response.data.error;
      }
      
      // Other formats
      if (error.response.data.message) {
        return error.response.data.message;
      }
      
      // If data itself is a string
      if (typeof error.response.data === 'string') {
        return error.response.data;
      }
    }
    
    // Network error
    if (error.request && !error.response) {
      return 'Network error. Please check your connection.';
    }
    
    // Default fallback
    return 'An error occurred. Please try again.';
  };
  
  // Function to safely parse JWT without library
  export const parseJWT = (token: string) => {
    try {
      // Split the token and get the payload part
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
          .join('')
      );
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT:', error);
      return null;
    }
  };
  
  // Check if token is expired
  export const isTokenExpired = (token: string) => {
    try {
      const decoded = parseJWT(token);
      if (!decoded || !decoded.exp) {
        return true;
      }
      
      // exp is in seconds, Date.now() is in milliseconds
      return decoded.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  };