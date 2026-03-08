/**
 * AgentOrchestrator
 * 
 * Main orchestrator that coordinates all compliance agents.
 * Handles task queue management, agent distribution, result compilation,
 * conflict detection, error recovery, and audit logging.
 */

import { Agent } from '@/agents/base/Agent';
import {
  AgentResult,
  AgentStatus,
  DrawingData,
  ProjectInfo,
  DrawingType,
  Finding,
  Severity
} from '@/types/agent';

// Import all compliance agents
import { SitePlanComplianceAgent } from '@/agents/specialized/siteplan';
import { FloorPlanComplianceAgent } from '@/agents/specialized/floorplan';
import { ElevationComplianceAgent } from '@/agents/specialized/elevation';
import { SectionComplianceAgent } from '@/agents/specialized/section';
import { DrainageComplianceAgent } from '@/agents/specialized/drainage';
import { FireComplianceAgent } from '@/agents/specialized/fire';
import { EnergyComplianceAgent } from '@/agents/specialized/energy';

// Import technical validation agents
import {
  DimensionValidatorAgent,
  ScaleVerifierAgent,
  LayerAnalyzerAgent,
  SymbolRecognizerAgent,
  TextClarityCheckerAgent
} from '@/agents/specialized/technical';

// ============================================================================
// Types
// ============================================================================

export interface OrchestratorConfig {
  maxConcurrentAgents: number;
  taskTimeout: number;
  enableParallelExecution: boolean;
  enableConflictDetection: boolean;
  enableErrorRecovery: boolean;
  enableAuditLogging: boolean;
}

export interface OrchestratorTask {
  id: string;
  drawing: DrawingData;
  projectInfo: ProjectInfo;
  agents: string[];
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: OrchestratorResult;
  error?: string;
}

export interface OrchestratorResult {
  taskId: string;
  drawingId: string;
  overallComplianceScore: number;
  agentResults: AgentResult[];
  allFindings: Finding[];
  conflicts: ConflictResult[];
  processingTime: number;
  timestamp: Date;
}

export interface ConflictResult {
  ruleId1: string;
  ruleId2: string;
  type: 'contradiction' | 'overlap' | 'gap';
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: string;
  agentId?: string;
  taskId?: string;
  drawingId?: string;
  details: Record<string, unknown>;
  userId?: string;
}

export interface AgentMetrics {
  agentId: string;
  agentName: string;
  status: AgentStatus;
  tasksCompleted: number;
  tasksFailed: number;
  averageProcessingTime: number;
  lastExecution?: Date;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_ORCHESTRATOR_CONFIG: OrchestratorConfig = {
  maxConcurrentAgents: 5,
  taskTimeout: 300000, // 5 minutes
  enableParallelExecution: true,
  enableConflictDetection: true,
  enableErrorRecovery: true,
  enableAuditLogging: true
};

// ============================================================================
// Agent Orchestrator Implementation
// ============================================================================

export class AgentOrchestrator {
  // Configuration
  private config: OrchestratorConfig;

  // Agent registry
  private agents: Map<string, Agent>;
  private agentMetrics: Map<string, AgentMetrics>;

  // Task management
  private taskQueue: OrchestratorTask[];
  private activeTasks: Map<string, OrchestratorTask>;

  // Audit logging
  private auditLog: AuditLogEntry[];

  // Circuit breaker state
  private circuitBreakerState: Map<string, {
    failures: number;
    lastFailure: Date;
    isOpen: boolean;
  }>;

  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = { ...DEFAULT_ORCHESTRATOR_CONFIG, ...config };
    this.agents = new Map();
    this.agentMetrics = new Map();
    this.taskQueue = [];
    this.activeTasks = new Map();
    this.auditLog = [];
    this.circuitBreakerState = new Map();

    // Initialize all agents
    this.initializeAgents();
  }

  /**
   * Initialize all available agents
   */
  private initializeAgents(): void {
    // Compliance Agents
    const complianceAgents: Agent[] = [
      new SitePlanComplianceAgent(),
      new FloorPlanComplianceAgent(),
      new ElevationComplianceAgent(),
      new SectionComplianceAgent(),
      new DrainageComplianceAgent(),
      new FireComplianceAgent(),
      new EnergyComplianceAgent()
    ];

    // Technical Validation Agents
    const technicalAgents: Agent[] = [
      new DimensionValidatorAgent(),
      new ScaleVerifierAgent(),
      new LayerAnalyzerAgent(),
      new SymbolRecognizerAgent(),
      new TextClarityCheckerAgent()
    ];

    // Register all agents
    [...complianceAgents, ...technicalAgents].forEach(agent => {
      this.agents.set(agent.id, agent);
      this.agentMetrics.set(agent.id, {
        agentId: agent.id,
        agentName: agent.name,
        status: AgentStatus.IDLE,
        tasksCompleted: 0,
        tasksFailed: 0,
        averageProcessingTime: 0
      });
    });

    this.logAudit('SYSTEM', 'All agents initialized', {
      totalAgents: this.agents.size,
      complianceAgents: complianceAgents.length,
      technicalAgents: technicalAgents.length
    });
  }

  /**
   * Submit a drawing for compliance analysis
   */
  async analyzeDrawing(
    drawing: DrawingData,
    projectInfo: ProjectInfo,
    options?: {
      agentIds?: string[];
      priority?: number;
      parallel?: boolean;
    }
  ): Promise<OrchestratorResult> {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    this.logAudit('TASK_SUBMITTED', undefined, {
      taskId,
      drawingId: drawing.id,
      drawingType: drawing.type,
      projectId: projectInfo.id
    });

    try {
      // Determine which agents to run based on drawing type
      const agentIds = options?.agentIds || this.getAgentsForDrawingType(drawing.type);

      this.logAudit('AGENTS_SELECTED', undefined, {
        taskId,
        agentIds,
        drawingType: drawing.type
      });

      // Execute agents
      const agentResults = await this.executeAgents(
        taskId,
        agentIds,
        drawing,
        projectInfo,
        options?.parallel ?? this.config.enableParallelExecution
      );

      // Detect conflicts
      const conflicts = this.config.enableConflictDetection
        ? this.detectConflicts(agentResults)
        : [];

      // Compile findings
      const allFindings = this.compileFindings(agentResults);

      // Calculate overall compliance score
      const overallComplianceScore = this.calculateOverallScore(agentResults);

      const result: OrchestratorResult = {
        taskId,
        drawingId: drawing.id,
        overallComplianceScore,
        agentResults,
        allFindings,
        conflicts,
        processingTime: Date.now() - startTime,
        timestamp: new Date()
      };

      this.logAudit('TASK_COMPLETED', undefined, {
        taskId,
        overallComplianceScore,
        findingsCount: allFindings.length,
        conflictsCount: conflicts.length,
        processingTime: result.processingTime
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logAudit('TASK_FAILED', undefined, {
        taskId,
        error: errorMessage
      });

      throw new Error(`Analysis failed: ${errorMessage}`);
    }
  }

  /**
   * Get appropriate agents for a drawing type
   */
  private getAgentsForDrawingType(drawingType: DrawingType): string[] {
    const agentMap: Record<DrawingType, string[]> = {
      [DrawingType.SITE_PLAN]: [
        'siteplan-compliance-agent',
        'scale-verifier-agent',
        'layer-analyzer-agent'
      ],
      [DrawingType.FLOOR_PLAN]: [
        'floorplan-compliance-agent',
        'dimension-validator-agent',
        'scale-verifier-agent',
        'layer-analyzer-agent',
        'symbol-recognizer-agent',
        'text-clarity-checker-agent'
      ],
      [DrawingType.ELEVATION]: [
        'elevation-compliance-agent',
        'dimension-validator-agent',
        'scale-verifier-agent',
        'text-clarity-checker-agent'
      ],
      [DrawingType.SECTION]: [
        'section-compliance-agent',
        'dimension-validator-agent',
        'scale-verifier-agent',
        'layer-analyzer-agent'
      ],
      [DrawingType.DETAIL]: [
        'dimension-validator-agent',
        'scale-verifier-agent',
        'text-clarity-checker-agent'
      ],
      [DrawingType.DRAINAGE]: [
        'drainage-compliance-agent',
        'scale-verifier-agent',
        'symbol-recognizer-agent'
      ],
      [DrawingType.FIRE_LAYOUT]: [
        'fire-compliance-agent',
        'scale-verifier-agent',
        'symbol-recognizer-agent'
      ],
      [DrawingType.ROOF_PLAN]: [
        'elevation-compliance-agent',
        'scale-verifier-agent',
        'layer-analyzer-agent'
      ],
      [DrawingType.ELECTRICAL]: [
        'scale-verifier-agent',
        'layer-analyzer-agent',
        'symbol-recognizer-agent',
        'text-clarity-checker-agent'
      ],
      [DrawingType.THREE_D_RENDER]: [
        'scale-verifier-agent',
        'text-clarity-checker-agent'
      ]
    };

    return agentMap[drawingType] || [];
  }

  /**
   * Execute multiple agents
   */
  private async executeAgents(
    taskId: string,
    agentIds: string[],
    drawing: DrawingData,
    projectInfo: ProjectInfo,
    parallel: boolean
  ): Promise<AgentResult[]> {
    const results: AgentResult[] = [];

    if (parallel) {
      // Execute agents in parallel batches
      const batchSize = this.config.maxConcurrentAgents;
      for (let i = 0; i < agentIds.length; i += batchSize) {
        const batch = agentIds.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(agentId => this.executeSingleAgent(taskId, agentId, drawing, projectInfo))
        );
        results.push(...batchResults.filter(r => r !== null) as AgentResult[]);
      }
    } else {
      // Execute agents sequentially
      for (const agentId of agentIds) {
        const result = await this.executeSingleAgent(taskId, agentId, drawing, projectInfo);
        if (result) {
          results.push(result);
        }
      }
    }

    return results;
  }

  /**
   * Execute a single agent
   */
  private async executeSingleAgent(
    taskId: string,
    agentId: string,
    drawing: DrawingData,
    projectInfo: ProjectInfo
  ): Promise<AgentResult | null> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      this.logAudit('AGENT_NOT_FOUND', agentId, { taskId, agentId });
      return null;
    }

    // Check circuit breaker
    const circuitState = this.circuitBreakerState.get(agentId);
    if (circuitState?.isOpen) {
      const timeSinceFailure = Date.now() - circuitState.lastFailure.getTime();
      if (timeSinceFailure < 30000) { // 30 seconds cooldown
        this.logAudit('AGENT_CIRCUIT_OPEN', agentId, { taskId, agentId });
        return null;
      } else {
        // Try again after cooldown
        circuitState.isOpen = false;
        circuitState.failures = 0;
      }
    }

    const agentMetrics = this.agentMetrics.get(agentId)!;
    agentMetrics.status = AgentStatus.PROCESSING;

    this.logAudit('AGENT_STARTED', agentId, { taskId, agentId });

    try {
      // Execute with timeout
      const result = await Promise.race([
        agent.analyze(drawing, projectInfo),
        this.createTimeout(this.config.taskTimeout)
      ]) as AgentResult;

      // Update metrics
      agentMetrics.status = AgentStatus.ACTIVE;
      agentMetrics.tasksCompleted++;
      agentMetrics.averageProcessingTime =
        (agentMetrics.averageProcessingTime * (agentMetrics.tasksCompleted - 1) +
          (result.processingTime || 0)) / agentMetrics.tasksCompleted;
      agentMetrics.lastExecution = new Date();

      this.logAudit('AGENT_COMPLETED', agentId, {
        taskId,
        agentId,
        complianceScore: result.complianceScore,
        processingTime: result.processingTime
      });

      return result;
    } catch (error) {
      // Update circuit breaker
      const state = this.circuitBreakerState.get(agentId) || {
        failures: 0,
        lastFailure: new Date(),
        isOpen: false
      };
      state.failures++;
      state.lastFailure = new Date();
      if (state.failures >= 3) {
        state.isOpen = true;
      }
      this.circuitBreakerState.set(agentId, state);

      // Update metrics
      agentMetrics.status = AgentStatus.ERROR;
      agentMetrics.tasksFailed++;

      this.logAudit('AGENT_FAILED', agentId, {
        taskId,
        agentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Error recovery if enabled
      if (this.config.enableErrorRecovery) {
        return this.handleAgentError(agent, drawing, projectInfo);
      }

      return null;
    }
  }

  /**
   * Handle agent error with recovery
   */
  private async handleAgentError(
    agent: Agent,
    drawing: DrawingData,
    _projectInfo: ProjectInfo
  ): Promise<AgentResult> {
    // Return a failed result with error information
    return {
      agentId: agent.id,
      agentName: agent.name,
      drawingId: drawing.id,
      status: 'error',
      startTime: new Date(),
      completionTime: new Date(),
      processingTime: 0,
      findings: [],
      complianceScore: 0,
      passedRules: [],
      failedRules: [],
      warnings: [],
      errors: ['Agent execution failed after error recovery attempts'],
      metadata: {
        errorRecovery: true
      }
    };
  }

  /**
   * Detect conflicts between agent results
   */
  private detectConflicts(agentResults: AgentResult[]): ConflictResult[] {
    const conflicts: ConflictResult[] = [];

    // Check for duplicate rule IDs across agents
    const ruleIdMap = new Map<string, { agentId: string; finding: Finding }[]>();

    for (const result of agentResults) {
      for (const finding of result.findings) {
        if (!ruleIdMap.has(finding.ruleId)) {
          ruleIdMap.set(finding.ruleId, []);
        }
        ruleIdMap.get(finding.ruleId)!.push({
          agentId: result.agentId,
          finding
        });
      }
    }

    // Find conflicts
    for (const [ruleId, agents] of ruleIdMap) {
      if (agents.length > 1) {
        // Check for conflicting severities
        const severities = new Set(agents.map(a => a.finding.severity));
        if (severities.size > 1) {
          conflicts.push({
            ruleId1: ruleId,
            ruleId2: agents.map(a => a.agentId).join(', '),
            type: 'overlap',
            description: `Rule ${ruleId} evaluated differently by multiple agents`,
            severity: 'medium'
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Compile all findings from agent results
   */
  private compileFindings(agentResults: AgentResult[]): Finding[] {
    const allFindings: Finding[] = [];
    const seenIds = new Set<string>();

    for (const result of agentResults) {
      for (const finding of result.findings) {
        // Avoid duplicates
        if (!seenIds.has(finding.id)) {
          seenIds.add(finding.id);
          allFindings.push(finding);
        }
      }
    }

    // Sort by severity
    const severityOrder = {
      [Severity.CRITICAL]: 0,
      [Severity.HIGH]: 1,
      [Severity.MEDIUM]: 2,
      [Severity.LOW]: 3
    };

    return allFindings.sort((a, b) =>
      severityOrder[a.severity] - severityOrder[b.severity]
    );
  }

  /**
   * Calculate overall compliance score
   */
  private calculateOverallScore(agentResults: AgentResult[]): number {
    if (agentResults.length === 0) return 0;

    const totalScore = agentResults.reduce((sum, r) => sum + r.complianceScore, 0);
    return Math.round(totalScore / agentResults.length);
  }

  /**
   * Create a timeout promise
   */
  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Task timeout')), ms)
    );
  }

  /**
   * Log audit entry
   */
  private logAudit(action: string, agentId?: string, details: Record<string, unknown> = {}): void {
    if (!this.config.enableAuditLogging) return;

    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      action,
      agentId,
      details
    };

    this.auditLog.push(entry);

    // Keep only last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog.shift();
    }
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Get all registered agents
   */
  getAgents(): Map<string, Agent> {
    return new Map(this.agents);
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get agent metrics
   */
  getAgentMetrics(agentId?: string): AgentMetrics | Map<string, AgentMetrics> {
    if (agentId) {
      return this.agentMetrics.get(agentId)!;
    }
    return new Map(this.agentMetrics);
  }

  /**
   * Get audit log
   */
  getAuditLog(limit?: number): AuditLogEntry[] {
    if (limit) {
      return this.auditLog.slice(-limit);
    }
    return [...this.auditLog];
  }

  /**
   * Get orchestrator status
   */
  getStatus(): {
    totalAgents: number;
    activeAgents: number;
    queueLength: number;
    auditLogSize: number;
  } {
    let activeAgents = 0;
    for (const [, metrics] of this.agentMetrics) {
      if (metrics.status === AgentStatus.PROCESSING || metrics.status === AgentStatus.ACTIVE) {
        activeAgents++;
      }
    }

    return {
      totalAgents: this.agents.size,
      activeAgents,
      queueLength: this.taskQueue.length,
      auditLogSize: this.auditLog.length
    };
  }

  /**
   * Enable/disable an agent
   */
  setAgentEnabled(agentId: string, enabled: boolean): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.enabled = enabled;
      this.logAudit('AGENT_STATUS_CHANGED', agentId, { enabled });
    }
  }

  /**
   * Clear audit log
   */
  clearAuditLog(): void {
    this.auditLog = [];
    this.logAudit('AUDIT_CLEARED', undefined, {});
  }
}

// Export singleton instance
export const agentOrchestrator = new AgentOrchestrator();

// Export default
export default AgentOrchestrator;
