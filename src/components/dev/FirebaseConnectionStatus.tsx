/**
 * Firebase Connection Status Indicator
 *
 * A subtle UI component that shows Firebase connection status.
 * Intended for development/debugging use or as a status indicator in admin panels.
 *
 * Usage:
 *   import { FirebaseConnectionStatus } from '@/components/dev/FirebaseConnectionStatus';
 *
 *   // Compact badge style (default)
 *   <FirebaseConnectionStatus />
 *
 *   // Detailed card style
 *   <FirebaseConnectionStatus variant="detailed" />
 *
 *   // Show in mock mode indicator
 *   <FirebaseConnectionStatus showMockStatus />
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Wifi,
  WifiOff,
  Database,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  quickConnectivityCheck,
  checkFirebaseConfig,
} from '@/services/firebase/firebaseTester';
import { isFirebaseConfigured } from '@/config/firebase';

type ConnectionState = 'connected' | 'disconnected' | 'checking' | 'error';

interface FirebaseConnectionStatusProps {
  variant?: 'badge' | 'detailed' | 'minimal';
  showMockStatus?: boolean;
  onStatusChange?: (status: ConnectionState) => void;
  refreshInterval?: number; // in milliseconds, 0 to disable
  className?: string;
}

export const FirebaseConnectionStatus: React.FC<FirebaseConnectionStatusProps> = ({
  variant = 'badge',
  showMockStatus = false,
  onStatusChange,
  refreshInterval = 0,
  className = '',
}) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [config] = useState<ReturnType<typeof checkFirebaseConfig> | null>(() => checkFirebaseConfig());

  const checkConnection = useCallback(async () => {
    setConnectionState('checking');
    setError(null);

    try {
      const isConnected = await quickConnectivityCheck();
      const newState = isConnected ? 'connected' : 'disconnected';
      setConnectionState(newState);
      setLastChecked(new Date());
      onStatusChange?.(newState);
    } catch (err) {
      setConnectionState('error');
      setError(err instanceof Error ? err.message : 'Connection check failed');
      onStatusChange?.('error');
    }
  }, [onStatusChange]);

  // Initial check
  useEffect(() => {
    // We use setTimeout to defer the check to avoid 
    // synchronous setState within the effect body
    const timer = setTimeout(() => {
      checkConnection();
    }, 0);
    return () => clearTimeout(timer);
  }, [checkConnection]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(checkConnection, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, checkConnection]);

  // Determine if in mock mode
  const isMockMode = !isFirebaseConfigured();

  const getStatusIcon = () => {
    switch (connectionState) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'checking':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    if (isMockMode && showMockStatus) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Database className="h-3 w-3" />
          Mock Mode
        </Badge>
      );
    }

    switch (connectionState) {
      case 'connected':
        return (
          <Badge variant="default" className="gap-1 bg-green-500">
            <CheckCircle className="h-3 w-3" />
            Connected
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Disconnected
          </Badge>
        );
      case 'checking':
        return (
          <Badge variant="outline" className="gap-1">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Checking...
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="secondary" className="gap-1 text-amber-600">
            <AlertTriangle className="h-3 w-3" />
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  // Minimal variant - just the icon
  if (variant === 'minimal') {
    return (
      <div className={`inline-flex items-center ${className}`} title={`Firebase: ${connectionState}`}>
        {getStatusIcon()}
      </div>
    );
  }

  // Badge variant - compact status badge
  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {getStatusBadge()}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={checkConnection}
          disabled={connectionState === 'checking'}
        >
          <RefreshCw className={`h-3 w-3 ${connectionState === 'checking' ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    );
  }

  // Detailed variant - full card with information
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Firebase Status
          </span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Configuration Info */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Configuration</span>
            <span className={config?.isConfigured ? 'text-green-600' : 'text-amber-600'}>
              {config?.isConfigured ? 'Configured' : 'Not Configured'}
            </span>
          </div>
          {config?.projectId && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Project ID</span>
              <span className="font-mono">{config.projectId}</span>
            </div>
          )}
          {config?.authDomain && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Auth Domain</span>
              <span className="font-mono text-xs">{config.authDomain}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Emulator Mode</span>
            <span>{config?.hasEmulator ? 'Enabled' : 'Disabled'}</span>
          </div>
          {lastChecked && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Checked</span>
              <span>{lastChecked.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Mock Mode Warning */}
        {isMockMode && showMockStatus && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Running in mock mode. Firebase operations will use local mock data instead of the
              actual Firebase backend.
            </AlertDescription>
          </Alert>
        )}

        {/* Refresh Button */}
        <Button
          onClick={checkConnection}
          disabled={connectionState === 'checking'}
          className="w-full"
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${connectionState === 'checking' ? 'animate-spin' : ''}`} />
          {connectionState === 'checking' ? 'Checking...' : 'Refresh Status'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default FirebaseConnectionStatus;
