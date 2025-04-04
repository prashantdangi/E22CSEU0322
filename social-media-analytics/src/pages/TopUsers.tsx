import React from 'react';
import { useQuery } from 'react-query';
import { fetchUsers, fetchAllPosts } from '../services/api';
import { getTopUsersByPostCount, getRandomImage } from '../utils/dataProcessing';

interface Post {
  id: string;
  userId: string;
  title: string;
  body: string;
}

interface ApiError {
  message: string;
}

function TopUsers() {
  // Fetch users data
  const usersQuery = useQuery<Record<string, string>, ApiError>('users', fetchUsers);
  
  // Fetch all posts data (needed to count posts per user)
  const postsQuery = useQuery<Post[], ApiError>('allPosts', fetchAllPosts, {
    // Only fetch posts after we have users
    enabled: !!usersQuery.data
  });
  
  // Compute loading and error states
  const isLoading = usersQuery.isLoading || postsQuery.isLoading;
  const error = usersQuery.error || postsQuery.error;
  
  // Compute top users once we have both users and posts
  const topUsers = React.useMemo(() => {
    if (usersQuery.data && postsQuery.data) {
      return getTopUsersByPostCount(usersQuery.data, postsQuery.data);
    }
    return [];
  }, [usersQuery.data, postsQuery.data]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Error:</strong> {(error as ApiError).message}
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Top Users</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topUsers.map((userData) => (
          <div key={userData.userId} className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
            <div className="relative h-40 bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
              <img 
                src={getRandomImage(userData.userId)} 
                alt={userData.user} 
                className="h-24 w-24 rounded-full border-4 border-white shadow-lg"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">{userData.user}</h3>
              <div className="flex items-center text-gray-600">
                <span className="text-xl font-bold text-blue-600">{userData.postCount}</span>
                <span className="ml-2">{userData.postCount === 1 ? 'Post' : 'Posts'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {topUsers.length === 0 && (
        <div className="text-center text-gray-500 py-10">
          <p>No user data available</p>
        </div>
      )}
    </div>
  );
}

export default TopUsers; 