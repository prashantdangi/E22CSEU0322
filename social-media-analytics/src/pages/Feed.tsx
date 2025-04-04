import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { fetchUsers, fetchAllPosts } from '../services/api';
import { getRandomImage } from '../utils/dataProcessing';

interface Post {
  id: string;
  userId: string;
  title: string;
  body: string;
}

interface ApiError {
  message: string;
}

function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  
  // Fetch users
  const usersQuery = useQuery<Record<string, string>, ApiError>('users', fetchUsers);
  
  // Fetch all posts with a shorter stale time for real-time updates
  const postsQuery = useQuery<Post[], ApiError>('allPosts', fetchAllPosts, {
    enabled: !!usersQuery.data,
    refetchInterval: 10000, // Refetch every 10 seconds for real-time feed
  });
  
  // Update posts state when data changes, sorting by newest first
  useEffect(() => {
    if (postsQuery.data) {
      const sortedPosts = [...postsQuery.data].sort((a, b) => {
        // Assuming posts have a timestamp or ID that can be used for sorting
        // If no timestamp is available, sort by ID (higher ID usually means newer)
        return Number(b.id) - Number(a.id);
      });
      
      setPosts(sortedPosts);
    }
  }, [postsQuery.data]);
  
  // Loading state
  if (postsQuery.isLoading || usersQuery.isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Error state
  if (postsQuery.error || usersQuery.error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Error:</strong> {postsQuery.error?.message || usersQuery.error?.message}
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Feed</h2>
        <button 
          onClick={() => postsQuery.refetch()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Refresh Feed
        </button>
      </div>
      
      <div className="space-y-6">
        {posts.map(post => {
          const userName = usersQuery.data?.[post.userId] || `Unknown (${post.userId})`;
          
          return (
            <div key={post.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex items-center">
                  <img 
                    className="h-10 w-10 rounded-full mr-3" 
                    src={getRandomImage(post.userId)} 
                    alt={userName} 
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{userName}</p>
                    <p className="text-xs text-gray-500">Post #{post.id}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{post.title}</h3>
                <p className="text-gray-600">{post.body}</p>
              </div>
              
              <div className="bg-gray-100">
                <img 
                  className="w-full h-64 object-cover object-center" 
                  src={getRandomImage(post.id)} 
                  alt={post.title} 
                />
              </div>
              
              <div className="p-4 flex justify-between text-sm text-gray-500">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>Like</span>
                </div>
                
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Comment</span>
                </div>
                
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>Share</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {posts.length === 0 && (
        <div className="text-center text-gray-500 py-10">
          <p>No posts available</p>
        </div>
      )}
    </div>
  );
}

export default Feed; 