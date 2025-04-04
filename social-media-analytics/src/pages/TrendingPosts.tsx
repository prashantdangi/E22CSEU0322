import React from 'react';
import { useQuery } from 'react-query';
import { fetchUsers, fetchAllPosts, fetchPostComments } from '../services/api';
import { getTrendingPosts, getRandomImage } from '../utils/dataProcessing';

interface Post {
  id: string;
  userId: string;
  title: string;
  body: string;
}

interface Comment {
  id: string;
  name: string;
  body: string;
}

interface ApiError {
  message: string;
}

function TrendingPosts() {
  // Fetch users
  const usersQuery = useQuery<Record<string, string>, ApiError>('users', fetchUsers);
  
  // Fetch all posts
  const postsQuery = useQuery<Post[], ApiError>('allPosts', fetchAllPosts, {
    enabled: !!usersQuery.data
  });
  
  // State to store comment data for all posts
  const [commentsData, setCommentsData] = React.useState<Record<string, Comment[]>>({});
  
  // Fetch comments for each post when posts are loaded
  React.useEffect(() => {
    if (postsQuery.data) {
      // Create a map to store post comments
      const commentMap: Record<string, Comment[]> = {};
      
      // Fetch comments for each post
      const fetchComments = async () => {
        const commentPromises = postsQuery.data.map(post =>
          fetchPostComments(post.id)
            .then(comments => {
              commentMap[post.id] = comments;
              return comments;
            })
            .catch(err => {
              console.error(`Error fetching comments for post ${post.id}:`, err);
              commentMap[post.id] = [];
              return [];
            })
        );
        
        await Promise.all(commentPromises);
        setCommentsData(commentMap);
      };
      
      fetchComments();
    }
  }, [postsQuery.data]);
  
  // Calculate trending posts once we have posts and comments
  const trendingPosts = React.useMemo(() => {
    if (postsQuery.data && Object.keys(commentsData).length > 0) {
      return getTrendingPosts(postsQuery.data, commentsData);
    }
    return [];
  }, [postsQuery.data, commentsData]);
  
  // Loading state
  if (postsQuery.isLoading || usersQuery.isLoading || Object.keys(commentsData).length === 0) {
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
        <strong>Error:</strong> {(postsQuery.error as ApiError)?.message || (usersQuery.error as ApiError)?.message}
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Trending Posts</h2>
      
      {trendingPosts.length > 0 ? (
        <div className="space-y-6">
          {trendingPosts.map(post => {
            const postComments = commentsData[post.id] || [];
            const userName = usersQuery.data?.[post.userId] || `Unknown (${post.userId})`;
            
            return (
              <div key={post.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="md:flex">
                  <div className="md:flex-shrink-0">
                    <img 
                      className="h-48 w-full object-cover md:w-48" 
                      src={getRandomImage(post.id)} 
                      alt={post.title} 
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center">
                      <img 
                        className="h-10 w-10 rounded-full mr-3" 
                        src={getRandomImage(post.userId)} 
                        alt={userName} 
                      />
                      <p className="text-indigo-500 font-semibold">{userName}</p>
                    </div>
                    <h3 className="mt-3 text-xl font-bold text-gray-900">{post.title}</h3>
                    <p className="mt-2 text-gray-600">{post.body}</p>
                    
                    <div className="mt-4 flex items-center">
                      <span className="text-sm text-gray-500">
                        <strong>{postComments.length}</strong> comments
                      </span>
                      <span className="mx-2 text-gray-300">|</span>
                      <span className="text-sm text-gray-500">Trending</span>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-gray-50 border-t">
                  <h4 className="font-bold text-gray-700 mb-2">Top Comments</h4>
                  <div className="space-y-3">
                    {postComments.slice(0, 3).map(comment => (
                      <div key={comment.id} className="bg-white p-3 rounded border">
                        <p className="font-semibold text-sm text-gray-700">{comment.name}</p>
                        <p className="text-sm text-gray-600">{comment.body}</p>
                      </div>
                    ))}
                    {postComments.length > 3 && (
                      <p className="text-sm text-blue-500 font-medium">
                        + {postComments.length - 3} more comments
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-10">
          <p>No trending posts available</p>
        </div>
      )}
    </div>
  );
}

export default TrendingPosts; 