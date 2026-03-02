/**
 * Base Agent Class for SANS 10400 Compliance Agents
 * 
 * This abstract base class provides the foundation for all compliance agents
 * with configuration management, state management, error handling, and metrics tracking.
 */

import {
  AgentConfig,
  AgentMetrics,
  AgentStatus,
  AgentResult,
  AgentCheckRequest,
  AgentCheckResult,
  AgentContext,
  DrawingData,
  ProjectInfo,
  ComplianceRule,
  ComplianceResult,
  Finding,
  Severity,
  calculateComplianceScore
} from '@/types/agent';

/**
 * Abstract base class for all SANS 10400 compliance agents
 */
export abstract class Agent {
  // Configuration
  protected config: AgentConfig;
  
  // State
  protected status: AgentStatus;
  protected metrics: AgentMetrics;
  
  // Error handling
  protected lastError?: Error;
  protected retryCount: number;
  
  // Rules cache
  protected rules: ComplianceRule[];
  
  constructor(config: AgentConfig) {
    this.config = config;
    this.status = AgentStatus.IDLE;
    this.metrics = this.initializeMetrics();
    this.retryCount = 0;
    this.rules = [];
  }
  
  /**
   * Initialize agent metrics
   */
  private initializeMetrics(): AgentMetrics {
    return {
      checksToday: 0,
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      averageProcessingTime: 0,
      accuracy: 0,
      lastActive: new Date(),
      errorCount: 0
    };
  }
  
  // ==========================================================================
  // Configuration Management
  // ==========================================================================
  
  /**
   * Get agent ID
   */
  get id(): string {
    return this.config.id;
  }
  
  /**
   * Get agent name
   */
  get name(): string {
    return this.config.name;
  }
  
  /**
   * Get agent version
   */
  get version(): string {
    return this.config.version;
  }
  
  /**
   * Get current status
   */
  get currentStatus(): AgentStatus {
    return this.status;
  }
  
  /**
   * Get agent metrics
   */
  get agentMetrics(): AgentMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Check if agent is enabled
   */
  get isEnabled(): boolean {
    return this.config.enabled;
  }
  
  /**
   * Set agent enabled state
   */
  set enabled(value: boolean) {
    this.config.enabled = value;
  }
  
  /**
   * Get supported drawing types
   */
  get supportedDrawingTypes(): string[] {
    return this.config.supportedDrawingTypes;
  }
  
  /**
   * Get supported standards
   */
  get supportedStandards(): string[] {
    return this.config.supportedStandards;
  }
  
  /**
   * Get agent capabilities
   */
  get capabilities(): string[] {
    return this.config.capabilities;
  }
  
  // ==========================================================================
  // State Management
  // ==========================================================================
  
  /**
   * Set agent status
   */
  protected setStatus(status: AgentStatus): void {
    this.status = status;
    if (status === AgentStatus.ACTIVE) {
      this.metrics.lastActive = new Date();
    }
  }
  
  /**
   * Activate the agent
   */
  async activate(): Promise<void> {
    if (!this.config.enabled) {
      throw new Error(`Agent ${this.config.id} is disabled`);
    }
    this.setStatus(AgentStatus.ACTIVE);
    await this.loadRules();
  }
  
  /**
   * Deactivate the agent
   */
  async deactivate(): Promise<void> {
    this.setStatus(AgentStatus.IDLE);
  }
  
  /**
   * Pause the agent
   */
  async pause(): Promise<void> {
    if (this.status !== AgentStatus.ACTIVE) {
      throw new Error('Cannot pause agent that is not active');
    }
    this.setStatus(AgentStatus.PAUSED);
  }
  
  /**
   * Resume the agent
   */
  async resume(): Promise<void> {
    if (this.status !== AgentStatus.PAUSED) {
      throw new Error('Cannot resume agent that is not paused');
    }
    this.setStatus(AgentStatus.ACTIVE);
  }
  
  /**
   * Set error state
   */
  protected setError(error: Error): void {
    this.status = AgentStatus.ERROR;
    this.lastError = error;
    this.metrics.errorCount++;
  }
  
  // ==========================================================================
  // Rules Management
  // ==========================================================================
  
  /**
   * Load rules for this agent
   * Must be implemented by subclasses
   */
  protected async loadRules(): Promise<void> {
    // Override in subclasses to load specific rules
    this.rules = await this.fetchRules();
  }
  
  /**
   * Fetch rules from the rules engine
   * 
   * This method is called during agent initialization to load compliance rules.
   * Subclasses can override this method to provide custom rule fetching logic,
   * or rely on the loadRules() override which is the preferred approach.
   * 
   * Default implementation returns an empty array. Subclasses should either:
   * 1. Override loadRules() to set this.rules directly with static/hardcoded rules
   * 2. Override fetchRules() to dynamically fetch rules from an external source
   * 
   * Future implementation may integrate with:
   * - Firestore 'complianceRules' collection for dynamic rule management
   * - External rules engine API
   * - Cached rules with TTL for performance
   * 
   * @returns Promise<ComplianceRule[]> Array of compliance rules to be evaluated
   * @protected
   */
  protected async fetchRules(): Promise<ComplianceRule[]> {
    // Default implementation returns empty array
    // Subclasses should override loadRules() or fetchRules() to provide actual rules
    return [];
  }
  
  /**
   * Get all rules for this agent
   */
  getRules(): ComplianceRule[] {
    return [...this.rules];
  }
  
  /**
   * Get rule by ID
   */
  getRuleById(ruleId: string): ComplianceRule | undefined {
    return this.rules.find(rule => rule.id === ruleId);
  }
  
  /**
   * Get rule IDs
   * Must be implemented by subclasses to return relevant rule IDs
   */
  abstract getRuleIds(): string[];
  
  /**
   * Filter rules by standard
   */
  protected filterRulesByStandard(standard: string): ComplianceRule[] {
    return this.rules.filter(rule => rule.standard === standard);
  }
  
  /**
   * Filter rules by category
   */
  protected filterRulesByCategory(category: string): ComplianceRule[] {
    return this.rules.filter(rule => rule.category === category);
  }
  
  // ==========================================================================
  // Core Analysis Methods
  // ==========================================================================
  
  /**
   * Analyze a drawing
   * Must be implemented by subclasses
   */
  abstract analyze(drawing: DrawingData, projectInfo: ProjectInfo): Promise<AgentResult>;
  
  /**
   * Process an agent check request
   */
  async processCheck(request: AgentCheckRequest): Promise<AgentCheckResult> {
    const startTime = Date.now();
    const requestId = `${this.config.id}-${Date.now()}`;
    
    try {
      this.setStatus(AgentStatus.PROCESSING);
      
      // Build context
      const context: AgentContext = {
        drawing: request.drawingData,
        projectInfo: request.projectInfo,
        userId: request.userId,
        sessionId: request.sessionId
      };
      
      // Run analysis
      const result = await this.analyze(context.drawing, context.projectInfo);
      
      // Evaluate rules
      const ruleIds = request.ruleIds || this.getRuleIds();
      const results = await this.evaluateRules(context, ruleIds);
      
      // Update metrics
      this.updateMetrics(true, Date.now() - startTime);
      
      return {
        requestId,
        agentId: this.config.id,
        drawingId: request.drawingId,
        status: 'success',
        results,
        summary: {
          totalRules: results.length,
          passed: results.filter(r => r.passed).length,
          failed: results.filter(r => !r.passed).length,
          complianceScore: calculateComplianceScore(results)
        },
        processingTime: Date.now() - startTime,
        timestamp: new Date()
      };
    } catch (error) {
      this.setStatus(AgentStatus.ERROR);
      this.updateMetrics(false, Date.now() - startTime);
      
      return {
        requestId,
        agentId: this.config.id,
        drawingId: request.drawingId,
        status: 'failed',
        results: [],
        summary: {
          totalRules: 0,
          passed: 0,
          failed: 0,
          complianceScore: 0
        },
        processingTime: Date.now() - startTime,
        timestamp: new Date(),
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
  
  /**
   * Evaluate specific rules against the drawing
   */
  protected async evaluateRules(
    context: AgentContext,
    ruleIds: string[]
  ): Promise<ComplianceResult[]> {
    const results: ComplianceResult[] = [];
    
    for (const ruleId of ruleIds) {
      const rule = this.getRuleById(ruleId);
      if (!rule) continue;
      
      try {
        const result = await this.evaluateRule(rule, context);
        results.push(result);
      } catch (error) {
        results.push({
          rule,
          passed: false,
          finding: this.createErrorFinding(rule, error),
          timestamp: new Date()
        });
      }
    }
    
    return results;
  }
  
  /**
   * Evaluate a single rule
   * Must be implemented by subclasses for specific rule types
   */
  protected abstract evaluateRule(
    rule: ComplianceRule,
    context: AgentContext
  ): Promise<ComplianceResult>;
  
  // ==========================================================================
  // Error Handling and Retry Logic
  // ==========================================================================
  
  /**
   * Execute with retry logic
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    customRetryCount?: number
  ): Promise<T> {
    const maxRetries = customRetryCount ?? this.config.maxRetries;
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        this.retryCount = attempt;
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries) {
          const delay = this.calculateBackoff(attempt);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError || new Error('Operation failed after retries');
  }
  
  /**
   * Calculate exponential backoff delay
   */
  protected calculateBackoff(attempt: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    return delay + Math.random() * 1000; // Add jitter
  }
  
  /**
   * Sleep for specified milliseconds
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Create error finding
   */
  protected createErrorFinding(rule: ComplianceRule, error: unknown): Finding {
    return {
      id: `error-${rule.id}-${Date.now()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      standard: rule.standard,
      severity: Severity.HIGH,
      title: 'Rule Evaluation Error',
      description: error instanceof Error ? error.message : 'Unknown error during rule evaluation',
      evidence: [],
      isResolved: false
    };
  }
  
  // ==========================================================================
  // Metrics Tracking
  // ==========================================================================
  
  /**
   * Update metrics after a check
   */
  protected updateMetrics(success: boolean, processingTime: number): void {
    const now = new Date();
    const isToday = now.toDateString() === this.metrics.lastActive.toDateString();
    
    this.metrics.totalChecks++;
    this.metrics.checksToday = isToday ? this.metrics.checksToday + 1 : 1;
    this.metrics.lastCheckAt = now;
    
    if (success) {
      this.metrics.successfulChecks++;
    } else {
      this.metrics.failedChecks++;
    }
    
    // Update average processing time using exponential moving average
    const alpha = 0.2;
    this.metrics.averageProcessingTime = 
      (alpha * processingTime + (1 - alpha) * this.metrics.averageProcessingTime);
    
    // Update accuracy
    if (this.metrics.totalChecks > 0) {
      this.metrics.accuracy = 
        (this.metrics.successfulChecks / this.metrics.totalChecks) * 100;
    }
    
    this.setStatus(AgentStatus.ACTIVE);
  }
  
  /**
   * Get accuracy metrics
   */
  getAccuracyMetrics(): {
    accuracy: number;
    totalChecks: number;
    averageProcessingTime: number;
  } {
    return {
      accuracy: this.metrics.accuracy,
      totalChecks: this.metrics.totalChecks,
      averageProcessingTime: this.metrics.averageProcessingTime
    };
  }
  
  /**
   * Reset daily metrics
   */
  resetDailyMetrics(): void {
    this.metrics.checksToday = 0;
  }
  
  /**
   * Get last error
   */
  getLastError(): Error | undefined {
    return this.lastError;
  }
  
  // ==========================================================================
  // Helper Methods
  // ==========================================================================
  
  /**
   * Create a finding from a failed rule
   */
  protected createFinding(
    rule: ComplianceRule,
    context: AgentContext,
    details?: {
      location?: Finding['location'];
      evidence?: Finding['evidence'];
      suggestion?: string;
    }
  ): Finding {
    return {
      id: `finding-${rule.id}-${Date.now()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      standard: rule.standard,
      severity: rule.severity,
      title: rule.name,
      description: rule.description,
      location: details?.location,
      evidence: details?.evidence || [],
      suggestion: details?.suggestion || rule.requirement,
      isResolved: false
    };
  }
  
  /**
   * Validate required data is present
   */
  protected validateRequiredData(
    context: AgentContext,
    requiredFields: string[]
  ): { valid: boolean; missing: string[] } {
    const missing: string[] = [];
    
    for (const field of requiredFields) {
      const value = this.getNestedValue(context, field);
      if (value === undefined || value === null) {
        missing.push(field);
      }
    }
    
    return {
      valid: missing.length === 0,
      missing
    };
  }
  
  /**
   * Get nested value from object using dot notation
   */
  protected getNestedValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce((acc: unknown, part: string) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, obj);
  }
  
  // ==========================================================================
  // Lifecycle Methods
  // ==========================================================================
  
  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    await this.loadRules();
    this.setStatus(AgentStatus.IDLE);
  }
  
  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.setStatus(AgentStatus.IDLE);
    this.rules = [];
  }
  
  /**
   * Get agent health status
   */
  getHealthStatus(): {
    status: AgentStatus;
    isHealthy: boolean;
    metrics: AgentMetrics;
    lastError?: string;
  } {
    return {
      status: this.status,
      isHealthy: this.status !== AgentStatus.ERROR && this.config.enabled,
      metrics: this.agentMetrics,
      lastError: this.lastError?.message
    };
  }
}

// Export common agent types
export type { AgentStatus as Status, Severity as FindingSeverity };

// Agent class is already exported at declaration (line 28)
export default Agent;
