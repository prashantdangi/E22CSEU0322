interface UserData {
  userId: string;
  user: string;
  postCount: number;
}

interface Post {
  id: string;
  userId: string;
  title: string;
  body: string;
}

export const getTopUsersByPostCount = (users: Record<string, string>, posts: Post[], limit = 5): UserData[] => {
  // Count posts by user
  const postCountByUser = posts.reduce((acc, post) => {
    const userId = post.userId;
    acc[userId] = (acc[userId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Convert to array of [userId, postCount] pairs and sort by count
  const userPostCounts = Object.entries(postCountByUser)
    .map(([userId, count]) => ({
      userId,
      user: users[userId] || `Unknown (${userId})`,
      postCount: count
    }))
    .sort((a, b) => b.postCount - a.postCount);
  
  // Return top N users
  return userPostCounts.slice(0, limit);
};

export const getTrendingPosts = (posts: Post[], comments: Record<string, any[]>) => {
  // Find max comment count
  let maxComments = 0;
  const postCommentCounts: Record<string, number> = {};
  
  // Count comments per post
  Object.entries(comments).forEach(([postId, postComments]) => {
    const count = postComments.length;
    postCommentCounts[postId] = count;
    
    if (count > maxComments) {
      maxComments = count;
    }
  });
  
  // Find all posts with max comment count
  return posts.filter(post => 
    postCommentCounts[post.id] === maxComments && maxComments > 0
  );
};

export const getRandomImage = (seed: string | number) => {
  // Use seed to generate consistent but random-looking image URLs
  const hash = String(seed).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  // Use placeholder service with seed-based dimensions for variety
  const width = 300 + Math.abs(hash % 200);
  const height = 200 + Math.abs((hash >> 4) % 150);
  
  return `/api/placeholder/${width}/${height}`;
}; 