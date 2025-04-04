import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import TopUsers from './pages/TopUsers';
import TrendingPosts from './pages/TrendingPosts';
import Feed from './pages/Feed';
import './App.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="app-container">
          <header className="bg-blue-600 text-white p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
              <h1 className="text-2xl font-bold">Social Media Analytics</h1>
              <nav>
                <ul className="flex space-x-6">
                  <li>
                    <Link to="/" className="hover:text-blue-200 transition-colors">
                      Top Users
                    </Link>
                  </li>
                  <li>
                    <Link to="/trending" className="hover:text-blue-200 transition-colors">
                      Trending Posts
                    </Link>
                  </li>
                  <li>
                    <Link to="/feed" className="hover:text-blue-200 transition-colors">
                      Feed
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          </header>
          
          <main className="container mx-auto p-4 min-h-screen">
            <Routes>
              <Route path="/" element={<TopUsers />} />
              <Route path="/trending" element={<TrendingPosts />} />
              <Route path="/feed" element={<Feed />} />
            </Routes>
          </main>
          
          <footer className="bg-gray-100 border-t p-4 text-center text-gray-600">
            <div className="container mx-auto">
              <p>© {new Date().getFullYear()} Social Media Analytics Dashboard</p>
            </div>
          </footer>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App; 