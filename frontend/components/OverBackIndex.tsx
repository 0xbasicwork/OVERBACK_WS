const fetchIndex = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/index');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Received data:', data);
    if (!data || !Array.isArray(data)) {
      throw new Error('Invalid data format');
    }
    return data;
  } catch (error) {
    console.error('Error fetching index:', error);
    throw error;
  }
}; 