import apiClient from './apiConfig';

// Define or import ProfileData and UserProfile types
interface ProfileData {
  // Define the properties of ProfileData here
  name: string;
  email: string;
}

interface UserProfile {
  // Define the properties of UserProfile here
  id: string;
  name: string;
  email: string;
}

export const authService = {
  // Initialize wallet authentication
  initWalletAuth: async (stellarAddress: string): Promise<{ success: boolean, data: { message: string, nonce: string }, error?: string }> => {
    try {
      const response = await apiClient.post('/auth/init', { 
        stellarAddress 
      });
      return response.data;
    } catch (error: any) {
      console.error('Init wallet auth error:', error);
      
      // Create a better error message for the user
      let errorMessage = 'Failed to connect to authentication server';
      
      if (error.response && error.response.status === 404) {
        errorMessage = 'Authentication API endpoint not found. Please check API configuration.';
        console.error('API URL configured incorrectly. Check NEXT_PUBLIC_API_URL in .env.local');
      }
      
      return {
        success: false,
        data: { message: '', nonce: '' },
        error: errorMessage
      };
    }
  },
  
  // Verify wallet signature
  verifyWalletAuth: async (stellarAddress: string, signature: string): Promise<{ success: boolean, token?: string, user?: any, error?: string }> => {
    try {
      const response = await apiClient.post('/auth/verify', {
        stellarAddress,
        signature
      });
      return response.data;
    } catch (error: any) {
      console.error('Verify wallet auth error:', error);
      
      // Create a better error message for the user
      let errorMessage = 'Failed to verify wallet signature';
      
      if (error.response && error.response.status === 404) {
        errorMessage = 'Authentication API endpoint not found. Please check API configuration.';
      } else if (error.response && error.response.status === 401) {
        errorMessage = 'Invalid signature. Please try again.';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  },
  
  // Get current user profile
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },
  
  // Update user profile
  updateProfile: async (profileData: ProfileData): Promise<UserProfile> => {
    try {
      const response = await apiClient.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },
  
  // Logout (client-side only)
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    // Backend doesn't need to be called for JWT logout
    return Promise.resolve({ success: true });
  }
};