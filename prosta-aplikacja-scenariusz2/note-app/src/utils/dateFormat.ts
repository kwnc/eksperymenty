export const dateUtils = {
  // Format date for display
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions): string => {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };

    return new Intl.DateTimeFormat('en-US', {
      ...defaultOptions,
      ...options,
    }).format(new Date(date));
  },

  // Format relative time (e.g., "2 minutes ago")
  formatRelativeTime: (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
      return dateUtils.formatDate(date, { month: 'short', day: 'numeric', year: 'numeric' });
    }
  },

  // Check if date is today
  isToday: (date: Date): boolean => {
    const today = new Date();
    const checkDate = new Date(date);
    return (
      checkDate.getDate() === today.getDate() &&
      checkDate.getMonth() === today.getMonth() &&
      checkDate.getFullYear() === today.getFullYear()
    );
  },

  // Check if date is yesterday
  isYesterday: (date: Date): boolean => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const checkDate = new Date(date);
    return (
      checkDate.getDate() === yesterday.getDate() &&
      checkDate.getMonth() === yesterday.getMonth() &&
      checkDate.getFullYear() === yesterday.getFullYear()
    );
  },

  // Smart date formatting (Today, Yesterday, or date)
  formatSmartDate: (date: Date): string => {
    if (dateUtils.isToday(date)) {
      return `Today at ${dateUtils.formatDate(date, { hour: '2-digit', minute: '2-digit' })}`;
    } else if (dateUtils.isYesterday(date)) {
      return `Yesterday at ${dateUtils.formatDate(date, { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return dateUtils.formatDate(date);
    }
  },
};