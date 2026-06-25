export const formatDuration = (seconds: number) => {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
};

export const formatCurrency = (value: number) => new Intl.NumberFormat('en-US').format(value) + ' IRR';

export const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(iso));
