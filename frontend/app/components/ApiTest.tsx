'use client';
import { useState, useEffect } from 'react';

function ApiTest() {
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

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
    <div className="bg-white/80 p-4 rounded-lg shadow">
      {message && <p className="text-black">Response: {message}</p>}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}

export default ApiTest; 