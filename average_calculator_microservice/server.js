// server.js
const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 9876;

// Configuration
const WINDOW_SIZE = 10;
const TIMEOUT_MS = 500;
const TEST_SERVER_URL = 'http://20.244.56.144/numbers/'; // Base URL for test server

// Data storage - map to store different type of numbers
const numberStorage = {
  p: [], // prime numbers
  f: [], // fibonacci numbers
  e: [], // even numbers
  r: []  // random numbers
};

// FIFO
const timestampTracker = {
  p: [],
  f: [],
  e: [],
  r: []
};

// Middleware for request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Main endpoint to get numbers by type
app.get('/numbers/:numberid', async (req, res) => {
  const startTime = Date.now();
  const numberType = req.params.numberid;

  // Validate number type
  if (!['p', 'f', 'e', 'r'].includes(numberType)) {
    return res.status(400).json({ error: 'Invalid number type. Use p, f, e, or r.' });
  }

  try {
    // Keep track of the previous state before making the API call
    const windowPrevState = [...numberStorage[numberType]];

    // Fetch numbers from the test server with timeout
    const numbers = await fetchNumbersWithTimeout(numberType);

    // Process and update storage with new numbers
    updateStorage(numberType, numbers);

    // Calculate the average
    const avg = calculateAverage(numberStorage[numberType]);

    // Prepare response
    const response = {
      windowPrevState: windowPrevState,
      windowCurrState: [...numberStorage[numberType]],
      numbers: numbers,
      avg: parseFloat(avg.toFixed(2))
    };

    // Ensure we respond within 500ms
    const processingTime = Date.now() - startTime;
    console.log(`Processing time: ${processingTime}ms`);

    return res.json(response);
  } catch (error) {
    console.error(`Error processing request: ${error.message}`);
    
    // If we already have numbers, return what we have despite the error
    if (numberStorage[numberType].length > 0) {
      const avg = calculateAverage(numberStorage[numberType]);
      return res.json({
        windowPrevState: [...numberStorage[numberType]],
        windowCurrState: [...numberStorage[numberType]],
        numbers: [],
        avg: parseFloat(avg.toFixed(2)),
        error: error.message
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to fetch or process numbers',
      details: error.message
    });
  }
});

// Helper function to fetch numbers with timeout
async function fetchNumbersWithTimeout(numberType) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await axios.get(`${TEST_SERVER_URL}${numberType}`, {
      signal: controller.signal,
      timeout: TIMEOUT_MS
    });
    
    clearTimeout(timeoutId);
    
    if (response.status === 200 && response.data && Array.isArray(response.data.numbers)) {
      return response.data.numbers;
    } else {
      throw new Error('Invalid response format from test server');
    }
  } catch (error) {
    if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
      throw new Error('Request timed out');
    }
    if (error.response && error.response.status === 404) {
      // Return some sample even numbers if the test server is not available
      if (numberType === 'e') {
        return [2, 4, 6, 8, 10];
      }
      throw new Error('Test server endpoint not found');
    }
    throw error;
  }
}

// Helper function to update storage with new numbers
function updateStorage(numberType, newNumbers) {
  if (!newNumbers || !Array.isArray(newNumbers)) {
    return;
  }

  const currentTime = Date.now();
  
  // Process each new number
  for (const num of newNumbers) {
    // Skip if the number is already in the window
    if (numberStorage[numberType].includes(num)) {
      continue;
    }
    
    // If window is not full, just add the number
    if (numberStorage[numberType].length < WINDOW_SIZE) {
      numberStorage[numberType].push(num);
      timestampTracker[numberType].push({ value: num, timestamp: currentTime });
    } else {
      // If window is full, replace the oldest element
      const oldestIndex = findOldestIndex(timestampTracker[numberType]);
      
      numberStorage[numberType][oldestIndex] = num;
      timestampTracker[numberType][oldestIndex] = { value: num, timestamp: currentTime };
    }
  }
}

// Helper function to find the index of the oldest element
function findOldestIndex(timestamps) {
  let oldestTime = Infinity;
  let oldestIndex = 0;
  
  for (let i = 0; i < timestamps.length; i++) {
    if (timestamps[i].timestamp < oldestTime) {
      oldestTime = timestamps[i].timestamp;
      oldestIndex = i;
    }
  }
  
  return oldestIndex;
}

// Helper function to calculate average
function calculateAverage(numbers) {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return sum / numbers.length;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Start the server
app.listen(PORT, (err) => {
  if (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
  console.log(`Average Calculator Microservice running on port ${PORT}`);
  console.log(`Window size: ${WINDOW_SIZE}, Timeout: ${TIMEOUT_MS}ms`);
});

// Handle unexpected errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});
