/**
 * Debug Page
 *
 * A development page for testing and debugging Firebase functionality.
 * Only accessible in development mode.
 *
 * Route: /debug
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FirebaseDebugger } from '@/components/dev';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

export const DebugPage: React.FC = () => {
  const navigate = useNavigate();

  // Only allow access in development mode
  if (!import.meta.env.DEV) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            This page is only available in development mode.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-semibold">Development Tools</h1>
          </div>
          <div className="text-sm text-muted-foreground">
            Firebase Testing & Verification
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <FirebaseDebugger />
      </main>
    </div>
  );
};

export default DebugPage;
