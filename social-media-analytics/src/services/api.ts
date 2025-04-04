const API_BASE_URL = 'http://20.244.56.144/evaluation-service';

export const fetchUsers = async () => {
  const response = await fetch(`${API_BASE_URL}/users`);
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
};

export const fetchUserPosts = async (userId: string) => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/posts`);
  if (!response.ok) {
    throw new Error(`Failed to fetch posts for user ${userId}`);
  }
  return response.json();
};

export const fetchAllPosts = async () => {
  // First fetch all users
  const users = await fetchUsers();
  
  // Then fetch posts for each user and combine them
  const postsPromises = Object.keys(users).map(userId => 
    fetchUserPosts(userId)
      .then(posts => posts.map((post: any) => ({ ...post, userId })))
      .catch(err => {
        console.error(`Error fetching posts for user ${userId}:`, err);
        return []; // Return empty array on error to avoid breaking the entire flow
      })
  );
  
  const postsArrays = await Promise.all(postsPromises);
  // Flatten array of arrays into a single array
  return postsArrays.flat();
};

export const fetchPostComments = async (postId: string) => {
  const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`);
  if (!response.ok) {
    throw new Error(`Failed to fetch comments for post ${postId}`);
  }
  return response.json();
}; 