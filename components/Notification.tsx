import React, { useEffect, useState } from 'react';
import { CheckIcon, ErrorIcon } from './icons';

interface NotificationProps {
  notification: {
    message: string;
    type: 'success' | 'error';
  } | null;
}

const Notification: React.FC<NotificationProps> = ({ notification }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 4500); // A little shorter than the removal timer in App.tsx
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [notification]);

  if (!notification) {
    return null;
  }

  const isSuccess = notification.type === 'success';
  const bgColor = isSuccess ? 'bg-green-900/60' : 'bg-red-900/60';
  const borderColor = isSuccess ? 'border-green-700/50' : 'border-red-700/50';
  const textColor = isSuccess ? 'text-green-300' : 'text-red-300';
  const Icon = isSuccess ? CheckIcon : ErrorIcon;

  return (
    <div 
      className={`fixed top-5 right-5 z-[100] w-full max-w-sm p-4 rounded-lg shadow-lg border backdrop-blur-md transition-all duration-300 ease-in-out ${bgColor} ${borderColor} ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
      role="alert"
    >
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className={`w-6 h-6 ${textColor}`} />
        </div>
        <div className="ml-3">
          <p className={`text-sm font-medium ${textColor}`}>
            {notification.message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Notification;