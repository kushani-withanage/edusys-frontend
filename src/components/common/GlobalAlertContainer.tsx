import React, { useState, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

export interface ActiveAlert {
  id: string;
  message: string;
  variant: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  title?: string;
}

type AlertListener = (
  message: string,
  variant: 'default' | 'destructive' | 'success' | 'warning' | 'info',
  title?: string
) => void;

class AlertManager {
  private listeners: Set<AlertListener> = new Set();

  subscribe(listener: AlertListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  showAlert(
    message: string,
    variant: 'default' | 'destructive' | 'success' | 'warning' | 'info' = 'default',
    title?: string
  ) {
    this.listeners.forEach(listener => listener(message, variant, title));
  }
}

export const alertManager = new AlertManager();

// Override default window.alert
if (typeof window !== 'undefined') {
  window.alert = (message: any) => {
    const msgStr = String(message);
    const lower = msgStr.toLowerCase();
    const isError = 
      lower.includes('fail') || 
      lower.includes('error') || 
      lower.includes('invalid') || 
      lower.includes('not match') || 
      lower.includes('cannot') || 
      lower.includes('unpaid') || 
      lower.includes('required') ||
      lower.includes('incorrect');
    
    alertManager.showAlert(
      msgStr, 
      isError ? 'destructive' : 'default', 
      isError ? 'Action Required' : 'Success'
    );
  };
}

export const GlobalAlertContainer: React.FC = () => {
  const [alerts, setAlerts] = useState<ActiveAlert[]>([]);

  useEffect(() => {
    const unsubscribe = alertManager.subscribe((message, variant, title) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newAlert: ActiveAlert = { id, message, variant, title };
      
      setAlerts(prev => [...prev, newAlert]);

      // Auto-dismiss after 4 seconds
      setTimeout(() => {
        setAlerts(prev => prev.filter(a => a.id !== id));
      }, 4000);
    });

    return () => unsubscribe();
  }, []);

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const getIcon = (variant: string) => {
    switch (variant) {
      case 'destructive':
        return <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-sky-500 mt-0.5 shrink-0" />;
    }
  };

  return (
    <div className="fixed top-6 right-6 z-50 w-full max-w-sm space-y-3 pointer-events-none">
      {alerts.map((alert) => {
        const resolvedVariant = alert.variant === 'default' ? 'success' : alert.variant;
        
        return (
          <div
            key={alert.id}
            className="pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-300"
          >
            <Alert
              variant={resolvedVariant}
              className="pr-10"
            >
              {getIcon(resolvedVariant)}
              
              <div className="flex-1">
                {alert.title && (
                  <AlertTitle>
                    {alert.title}
                  </AlertTitle>
                )}
                <AlertDescription>
                  {alert.message}
                </AlertDescription>
              </div>
              
              <button
                type="button"
                onClick={() => removeAlert(alert.id)}
                className="absolute top-3 right-3 text-[#7E8B9B] hover:text-[#111111] bg-slate-300/20 hover:bg-slate-300/50 p-1 rounded-lg transition-all cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </Alert>
          </div>
        );
      })}
    </div>
  );
};

