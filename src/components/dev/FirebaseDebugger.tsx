/**
 * Firebase Debugger Component
 *
 * A development-only component for testing and verifying Firebase functionality.
 * Provides a UI for running Firebase tests, viewing results, and managing test data.
 *
 * Usage:
 *   import { FirebaseDebugger } from '@/components/dev/FirebaseDebugger';
 *   // In your component:
 *   {import.meta.env.DEV && <FirebaseDebugger />}
 *
 * Or add to a debug page:
 *   /debug/firebase
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  RefreshCw,
  Database,
  Shield,
  Server,
  Activity,
  Wifi,
  WifiOff,
  Trash2,
  Download,
} from 'lucide-react';
import {
  runFirebaseTestSuite,
  quickConnectivityCheck,
  checkFirebaseConfig,
  verifyCollections,
  type TestResult,
  type FirebaseTestSuite,
} from '@/services/firebase/firebaseTester';
import {
  seedTestData,
  clearTestData,
  getSeededDataSummary,
} from '@/services/firebase/seedData';
// Removed unused isFirebaseConfigured import
import { COLLECTIONS } from '@/services/firebase/utils';

interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: Date | null;
  isChecking: boolean;
}

export const FirebaseDebugger: React.FC = () => {
  const [testResults, setTestResults] = useState<FirebaseTestSuite | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    lastChecked: null,
    isChecking: false,
  });
  const [config, setConfig] = useState<ReturnType<typeof checkFirebaseConfig> | null>(null);
  const [collectionStatus, setCollectionStatus] = useState<TestResult[]>([]);
  const [isCheckingCollections, setIsCheckingCollections] = useState(false);
  const [seedStatus, setSeedStatus] = useState<{
    isSeeding: boolean;
    isClearing: boolean;
    summary: ReturnType<typeof getSeededDataSummary> | null;
  }>({
    isSeeding: false,
    isClearing: false,
    summary: null,
  });



  const checkConnection = useCallback(async () => {
    setConnectionStatus((prev) => ({ ...prev, isChecking: true }));
    const isConnected = await quickConnectivityCheck();
    setConnectionStatus({
      isConnected,
      lastChecked: new Date(),
      isChecking: false,
    });
  }, []);

  const loadSeedSummary = useCallback(() => {
    setSeedStatus((prev) => ({
      ...prev,
      summary: getSeededDataSummary(),
    }));
  }, []);

  // Load initial state
  useEffect(() => {
    setConfig(checkFirebaseConfig());
    checkConnection();
    loadSeedSummary();
  }, [checkConnection, loadSeedSummary]);

  const runTests = async () => {
    setIsRunningTests(true);
    try {
      const results = await runFirebaseTestSuite();
      setTestResults(results);
    } catch (error) {
      console.error('Test suite failed:', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  const checkCollections = async () => {
    setIsCheckingCollections(true);
    try {
      const collections = Object.values(COLLECTIONS);
      const results = await verifyCollections(collections);
      setCollectionStatus(results);
    } catch (error) {
      console.error('Collection check failed:', error);
    } finally {
      setIsCheckingCollections(false);
    }
  };

  const handleSeedData = async () => {
    setSeedStatus((prev) => ({ ...prev, isSeeding: true }));
    try {
      await seedTestData();
      loadSeedSummary();
    } catch (error) {
      console.error('Seeding failed:', error);
    } finally {
      setSeedStatus((prev) => ({ ...prev, isSeeding: false }));
    }
  };

  const handleClearData = async () => {
    setSeedStatus((prev) => ({ ...prev, isClearing: true }));
    try {
      await clearTestData();
      loadSeedSummary();
    } catch (error) {
      console.error('Clearing failed:', error);
    } finally {
      setSeedStatus((prev) => ({ ...prev, isClearing: false }));
    }
  };

  const exportResults = () => {
    if (!testResults) return;

    const data = {
      ...testResults,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firebase-test-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getOverallStatusBadge = (status: FirebaseTestSuite['overallStatus']) => {
    switch (status) {
      case 'passed':
        return <Badge className="bg-green-500">All Tests Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive">All Tests Failed</Badge>;
      case 'partial':
        return <Badge variant="secondary">Partial Success</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Don't render in production
  if (!import.meta.env.DEV) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Development Only</AlertTitle>
        <AlertDescription>
          This component is only available in development mode.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Firebase Debugger</h1>
          <p className="text-muted-foreground">
            Test and verify Firebase functionality
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {connectionStatus.isConnected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            <span className={connectionStatus.isConnected ? 'text-green-600' : 'text-red-600'}>
              {connectionStatus.isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkConnection}
            disabled={connectionStatus.isChecking}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${connectionStatus.isChecking ? 'animate-spin' : ''}`} />
            Check
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="seed">Test Data</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Configuration Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Firebase Configuration
              </CardTitle>
              <CardDescription>
                Current Firebase configuration status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Status</span>
                  <div className="flex items-center gap-2 mt-1">
                    {config?.isConfigured ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-600 font-medium">Configured</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-red-600 font-medium">Not Configured</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Project ID</span>
                  <p className="font-mono text-sm mt-1">
                    {config?.projectId || 'Not set'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Auth Domain</span>
                  <p className="font-mono text-sm mt-1">
                    {config?.authDomain || 'Not set'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Emulator Mode</span>
                  <p className="font-mono text-sm mt-1">
                    {config?.hasEmulator ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>

              {config?.missingVars && config.missingVars.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Missing Environment Variables</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside mt-2">
                      {config.missingVars.map((varName) => (
                        <li key={varName} className="font-mono text-sm">
                          {varName}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button onClick={runTests} disabled={isRunningTests || !config?.isConfigured}>
                  <Play className="h-4 w-4 mr-2" />
                  {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
                </Button>
                <Button variant="outline" onClick={checkCollections} disabled={isCheckingCollections}>
                  <Database className="h-4 w-4 mr-2" />
                  Check Collections
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSeedData}
                  disabled={seedStatus.isSeeding || !config?.isConfigured}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Seed Test Data
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Last Test Results Summary */}
          {testResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Last Test Results
                  </span>
                  {getOverallStatusBadge(testResults.overallStatus)}
                </CardTitle>
                <CardDescription>
                  Run at: {testResults.timestamp.toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{testResults.summary.total}</div>
                    <div className="text-sm text-muted-foreground">Total Tests</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {testResults.summary.passed}
                    </div>
                    <div className="text-sm text-muted-foreground">Passed</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {testResults.summary.failed}
                    </div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Test Results</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportResults}
                disabled={!testResults}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm" onClick={runTests} disabled={isRunningTests}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRunningTests ? 'animate-spin' : ''}`} />
                Run Tests
              </Button>
            </div>
          </div>

          {testResults ? (
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {testResults.tests.map((test, index) => (
                  <Card key={index} className={test.passed ? 'border-green-200' : 'border-red-200'}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(test.passed)}
                          <div>
                            <p className="font-medium">{test.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Duration: {test.duration}ms
                            </p>
                          </div>
                        </div>
                        <Badge variant={test.passed ? 'default' : 'destructive'}>
                          {test.passed ? 'PASSED' : 'FAILED'}
                        </Badge>
                      </div>
                      {test.error && (
                        <Alert variant="destructive" className="mt-3">
                          <AlertDescription>{test.error}</AlertDescription>
                        </Alert>
                      )}
                      {test.details && (
                        <Accordion type="single" collapsible className="mt-2">
                          <AccordionItem value="details">
                            <AccordionTrigger className="text-sm">
                              View Details
                            </AccordionTrigger>
                            <AccordionContent>
                              <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                                {JSON.stringify(test.details, null, 2)}
                              </pre>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tests have been run yet.</p>
                <Button onClick={runTests} className="mt-4" disabled={isRunningTests}>
                  Run Tests
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="collections" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Collection Status</h2>
            <Button onClick={checkCollections} disabled={isCheckingCollections}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isCheckingCollections ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {collectionStatus.length > 0 ? (
            <div className="grid gap-2">
              {collectionStatus.map((result, index) => (
                <Card key={index} className={result.passed ? 'border-green-200' : 'border-red-200'}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.passed)}
                        <div>
                          <p className="font-medium">{result.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {result.passed
                              ? `${result.details?.documentCount || 0} documents`
                              : result.error}
                          </p>
                        </div>
                      </div>
                      <Badge variant={result.passed ? 'default' : 'destructive'}>
                        {result.passed ? 'ACCESSIBLE' : 'ERROR'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Click "Refresh" to check collection status.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="seed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Test Data Management
              </CardTitle>
              <CardDescription>
                Create or remove test data for development and testing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button
                  onClick={handleSeedData}
                  disabled={seedStatus.isSeeding || !config?.isConfigured}
                >
                  <Database className="h-4 w-4 mr-2" />
                  {seedStatus.isSeeding ? 'Seeding...' : 'Seed Test Data'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleClearData}
                  disabled={seedStatus.isClearing || !config?.isConfigured}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {seedStatus.isClearing ? 'Clearing...' : 'Clear Test Data'}
                </Button>
              </div>

              <Separator />

              {seedStatus.summary && seedStatus.summary.totalCreated > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Seeded Data Summary</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Users</span>
                      <span className="font-mono">{seedStatus.summary.users}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Projects</span>
                      <span className="font-mono">{seedStatus.summary.projects}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Drawings</span>
                      <span className="font-mono">{seedStatus.summary.drawings}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Invoices</span>
                      <span className="font-mono">{seedStatus.summary.invoices}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Time Entries</span>
                      <span className="font-mono">{seedStatus.summary.timeEntries}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Comments</span>
                      <span className="font-mono">{seedStatus.summary.comments}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Total created: {seedStatus.summary.totalCreated}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last seeded: {seedStatus.summary.lastSeeded?.toLocaleString() || 'Never'}
                  </p>
                </div>
              )}

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Development Only</AlertTitle>
                <AlertDescription>
                  Test data is created with the prefix "test_" and should not be used in production.
                  Use the "Clear Test Data" button to remove all seeded data.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FirebaseDebugger;
