// Types for better error handling and type safety
interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

interface ApiError {
  status: number;
  message: string;
}

// Get environment variables with type checking and default values
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://20.244.56.144/evaluation-service';
const AUTH_CLIENT_ID = process.env.REACT_APP_AUTH_CLIENT_ID || '';
const AUTH_CLIENT_SECRET = process.env.REACT_APP_AUTH_CLIENT_SECRET || '';

// Validate environment variables
if (!AUTH_CLIENT_ID || !AUTH_CLIENT_SECRET) {
  console.error('Missing authentication credentials. Please check your .env file.');
}

// Helper function to create headers with authentication
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'auth-client-id': AUTH_CLIENT_ID,
  'auth-client-secret': AUTH_CLIENT_SECRET
});

// Generic fetch wrapper with error handling and typing
async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        status: response.status,
        message: response.statusText
      }));
      
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Request failed for ${url}:`, error);
    throw error;
  }
}

export const fetchUsers = async () => {
  try {
    return await apiRequest(`${API_BASE_URL}/users`);
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users. Please check your authentication credentials.');
  }
};

export const fetchUserPosts = async (userId: string) => {
  try {
    if (!userId) throw new Error('User ID is required');
    return await apiRequest(`${API_BASE_URL}/users/${userId}/posts`);
  } catch (error) {
    console.error(`Error fetching posts for user ${userId}:`, error);
    throw new Error(`Failed to fetch posts for user ${userId}. Please try again.`);
  }
};

export const fetchAllPosts = async () => {
  try {
    // First fetch all users
    const users = await fetchUsers();
    
    // Then fetch posts for each user and combine them
    const postsPromises = Object.keys(users).map(userId => 
      fetchUserPosts(userId)
        .then(posts => posts.map(post => ({ ...post, userId })))
        .catch(err => {
          console.error(`Error fetching posts for user ${userId}:`, err);
          return []; // Return empty array on error to avoid breaking the entire flow
        })
    );
    
    const postsArrays = await Promise.all(postsPromises);
    return postsArrays.flat();
  } catch (error) {
    console.error('Error fetching all posts:', error);
    throw new Error('Failed to fetch posts. Please check your connection and try again.');
  }
};

export const fetchPostComments = async (postId: string) => {
  try {
    if (!postId) throw new Error('Post ID is required');
    return await apiRequest(`${API_BASE_URL}/posts/${postId}/comments`);
  } catch (error) {
    console.error(`Error fetching comments for post ${postId}:`, error);
    throw new Error(`Failed to fetch comments for post ${postId}. Please try again.`);
  }
};