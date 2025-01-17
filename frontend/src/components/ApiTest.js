'use client';
import { useState, useEffect } from 'react';

function ApiTest() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const testApi = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/test');
        const data = await response.json();
        setMessage(data.message);
      } catch (err) {
        setError('Failed to connect to API');
        console.error(err);
      }
    };

    testApi();
  }, []);

  return (
    <div>
      {message && <p>Response: {message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default ApiTest; 