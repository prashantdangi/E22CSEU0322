
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://20.244.56.144/evaluation-service';
const ACCESS_TOKEN = process.env.REACT_APP_ACCESS_TOKEN;

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${ACCESS_TOKEN}`
});

export const fetchUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const fetchUserPosts = async (userId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/posts`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} for user ${userId}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching posts for user ${userId}:`, error);
    throw error;
  }
};

export const fetchAllPosts = async () => {
  try {
    // First fetch all users
    const users = await fetchUsers();
    
    if (!users || !Object.keys(users).length) {
      throw new Error('No users found');
    }
    
    // Then fetch posts for each user and combine them
    const postsPromises = Object.keys(users).map(userId => 
      fetchUserPosts(userId)
        .then(posts => {
          if (!Array.isArray(posts)) {
            console.warn(`Invalid posts data for user ${userId}`);
            return [];
          }
          return posts.map((post: any) => ({ ...post, userId }));
        })
        .catch(err => {
          console.error(`Error fetching posts for user ${userId}:`, err);
          return []; // Return empty array on error to avoid breaking the entire flow
        })
    );
    
    const postsArrays = await Promise.all(postsPromises);
    return postsArrays.flat();
  } catch (error) {
    console.error('Error in fetchAllPosts:', error);
    throw error;
  }
};

export const fetchPostComments = async (postId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} for post ${postId}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching comments for post ${postId}:`, error);
    throw error;
  }
};