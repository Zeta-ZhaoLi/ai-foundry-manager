import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

// ================== Types ==================

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface NotificationContextValue {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  // Convenience methods
  info: (title: string, message?: string, options?: Partial<Notification>) => string;
  success: (title: string, message?: string, options?: Partial<Notification>) => string;
  warning: (title: string, message?: string, options?: Partial<Notification>) => string;
  error: (title: string, message?: string, options?: Partial<Notification>) => string;
}

// ================== Context ==================

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const useNotification = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// ================== Icons ==================

const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
    />
  </svg>
);

const SuccessIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const WarningIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
    />
  </svg>
);

const ErrorIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
    />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ================== NotificationItem ==================

interface NotificationItemProps {
  notification: Notification;
  onDismiss: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onDismiss }) => {
  const [isLeaving, setIsLeaving] = useState(false);
  const timerRef = useRef<number | null>(null);

  const handleDismiss = useCallback(() => {
    setIsLeaving(true);
    setTimeout(onDismiss, 200);
  }, [onDismiss]);

  useEffect(() => {
    const duration = notification.duration ?? 5000;
    if (duration > 0) {
      timerRef.current = window.setTimeout(handleDismiss, duration);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [notification.duration, handleDismiss]);

  const typeConfig = {
    info: {
      icon: InfoIcon,
      bgClass: 'bg-blue-900/90 border-blue-700',
      iconClass: 'text-blue-400',
    },
    success: {
      icon: SuccessIcon,
      bgClass: 'bg-green-900/90 border-green-700',
      iconClass: 'text-green-400',
    },
    warning: {
      icon: WarningIcon,
      bgClass: 'bg-yellow-900/90 border-yellow-700',
      iconClass: 'text-yellow-400',
    },
    error: {
      icon: ErrorIcon,
      bgClass: 'bg-red-900/90 border-red-700',
      iconClass: 'text-red-400',
    },
  };

  const config = typeConfig[notification.type];
  const Icon = config.icon;

  return (
    <div
      className={clsx(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm',
        'transition-all duration-200',
        config.bgClass,
        isLeaving ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
      )}
      role="alert"
    >
      <Icon className={clsx('w-5 h-5 flex-shrink-0 mt-0.5', config.iconClass)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{notification.title}</p>
        {notification.message && (
          <p className="mt-1 text-xs text-gray-300">{notification.message}</p>
        )}
        {notification.action && (
          <button
            type="button"
            onClick={notification.action.onClick}
            className={clsx(
              'mt-2 text-xs font-medium',
              config.iconClass,
              'hover:underline transition-colors'
            )}
          >
            {notification.action.label}
          </button>
        )}
      </div>
      {notification.dismissible !== false && (
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 -m-1 text-gray-400 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

// ================== NotificationContainer ==================

interface NotificationContainerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onDismiss,
  position = 'top-right',
}) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  if (notifications.length === 0) return null;

  return createPortal(
    <div
      className={clsx(
        'fixed z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none',
        positionClasses[position]
      )}
      aria-live="polite"
      aria-label="Notifications"
    >
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <NotificationItem
            notification={notification}
            onDismiss={() => onDismiss(notification.id)}
          />
        </div>
      ))}
    </div>,
    document.body
  );
};

// ================== NotificationProvider ==================

export interface NotificationProviderProps {
  children: React.ReactNode;
  position?: NotificationContainerProps['position'];
  maxNotifications?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  position = 'top-right',
  maxNotifications = 5,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const generateId = useCallback(() => {
    return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id'>): string => {
      const id = generateId();
      setNotifications((prev) => {
        const newNotifications = [{ ...notification, id }, ...prev];
        return newNotifications.slice(0, maxNotifications);
      });
      return id;
    },
    [generateId, maxNotifications]
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const info = useCallback(
    (title: string, message?: string, options?: Partial<Notification>): string => {
      return addNotification({ type: 'info', title, message, ...options });
    },
    [addNotification]
  );

  const success = useCallback(
    (title: string, message?: string, options?: Partial<Notification>): string => {
      return addNotification({ type: 'success', title, message, ...options });
    },
    [addNotification]
  );

  const warning = useCallback(
    (title: string, message?: string, options?: Partial<Notification>): string => {
      return addNotification({ type: 'warning', title, message, ...options });
    },
    [addNotification]
  );

  const error = useCallback(
    (title: string, message?: string, options?: Partial<Notification>): string => {
      return addNotification({ type: 'error', title, message, ...options });
    },
    [addNotification]
  );

  const value: NotificationContextValue = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    info,
    success,
    warning,
    error,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer
        notifications={notifications}
        onDismiss={removeNotification}
        position={position}
      />
    </NotificationContext.Provider>
  );
};

NotificationProvider.displayName = 'NotificationProvider';
