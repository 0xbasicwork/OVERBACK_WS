export function parseUTCDate(dateString: string): Date {
  // Expects format: "DD/MM/YYYY HH:mm:ss UTC"
  const [datePart, timePart] = dateString.split(' ');
  const [day, month, year] = datePart.split('/');
  const [hour, minute, second] = timePart.split(':');
  
  return new Date(Date.UTC(
    parseInt(year),
    parseInt(month) - 1, // JS months are 0-based
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  ));
}

export function formatUTCDate(date: Date): string {
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC'
  }).replace(',', '') + ' UTC';
} 