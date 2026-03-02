/**
 * Agent API Functions
 * 
 * These functions provide the agent system API endpoints
 * as defined in AI_AGENT_ARCHITECTURE.md
 */

import { AgentCheck, AgentIssue } from '@/types';
import { FileParser, fileParser } from '@/agents/services/FileParser';
import { DrawingType, DrawingData, ProjectInfo } from '@/types/agent';
import { agentOrchestrator } from '@/orchestrator/AgentOrchestrator';
import { auditLogger, AuditEventType } from '@/orchestrator/AuditLogger';
import { getAgentLogs, getProjectAgentLogs } from '@/services/firebase/agentService';

// Types matching the architecture document
export interface AgentAnalysisRequest {
  drawingId: string;
  filename: string;
  fileUrl: string;
  file: File | Blob;
  drawingType: DrawingType;
  projectInfo: ProjectInfo;
}

export interface AgentAnalysisResult {
  drawingId: string;
  filename: string;
  status: 'analyzing' | 'completed' | 'failed';
  results: AgentResult[];
  orchestratorScore: number;
  createdAt: Date;
  completedAt?: Date;
  summary?: {
    totalFindings: number;
    bySeverity: Record<string, number>;
    complianceScore: number;
  };
}

export interface AgentResult {
  agentId: string;
  agentName: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  accuracy: number;
  issues: AgentIssue[];
  processingTime?: number;
  completedAt?: Date;
  complianceScore?: number;
}

export interface AgentOverrideRequest {
  drawingId: string;
  agentId: string;
  issueId: string;
  reason: string;
  overriddenBy: string;
}

export interface AgentAccuracyMetrics {
  agents: AgentAccuracy[];
  overallAccuracy: number;
  threshold: number;
  belowThresholdAgents: string[];
}

export interface AgentAccuracy {
  agentId: string;
  agentName: string;
  accuracy: number;
  totalChecks: number;
  successfulChecks: number;
  lastUpdated: Date;
}

export interface ReportGenerationRequest {
  drawingId?: string;
  projectId: string;
  reportType: 'compliance_summary' | 'detailed_findings' | 'project_report' | 'executive_summary';
  format: 'json' | 'csv' | 'html';
  includeCharts?: boolean;
}

export interface ReportGenerationResult {
  reportId: string;
  projectId: string;
  type: string;
  format: string;
  generatedAt: Date;
  downloadUrl?: string;
  data?: unknown;
}

// API Functions

/**
 * Parse a drawing file
 */
export async function parseDrawingFile(
  file: File | Blob,
  drawingId: string,
  projectId: string,
  drawingType: DrawingType
): Promise<DrawingData> {
  // Validate file
  const validation = fileParser.validateFile(file);
  if (!validation.valid) {
    throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
  }

  // Parse the file
  const drawingData = await fileParser.parse(
    file,
    drawingId,
    projectId,
    drawingType,
    {
      extractText: true,
      extractDimensions: true,
      extractSymbols: true,
      extractLayers: true,
      extractMetadata: true,
      detectElements: true,
      ocrEnabled: false
    }
  );

  return drawingData;
}

/**
 * POST /api/agents/analyze
 * Submit a drawing for analysis by all agents
 */
export async function analyzeDrawing(request: AgentAnalysisRequest): Promise<AgentAnalysisResult> {
  // Use real orchestrator to analyze drawing
  const drawingData: DrawingData = {
    id: request.drawingId,
    projectId: request.projectInfo.id,
    type: request.drawingType,
    filename: request.filename,
    content: request.file,
    metadata: {
      uploadDate: new Date(),
      fileSize: request.file instanceof File ? request.file.size : 0,
      fileType: request.file instanceof File ? request.file.type : 'application/octet-stream',
    }
  };

  try {
    const result = await agentOrchestrator.analyzeDrawing(drawingData, request.projectInfo);

    // Transform orchestrator result to AgentAnalysisResult format
    return {
      drawingId: request.drawingId,
      filename: request.filename,
      status: 'completed',
      results: result.agentResults.map(ar => ({
        agentId: ar.agentId,
        agentName: ar.agentName,
        status: ar.status === 'error' ? 'error' : 'completed',
        accuracy: ar.complianceScore || 0,
        issues: ar.findings?.map(f => ({
          id: f.id,
          type: mapFindingTypeToIssueType(f.type),
          severity: f.severity,
          description: f.description,
          location: f.location,
          suggestion: f.suggestion,
          isResolved: f.isResolved || false,
        })) || [],
        processingTime: ar.processingTime,
        completedAt: ar.completionTime,
        complianceScore: ar.complianceScore,
      })),
      orchestratorScore: result.overallComplianceScore,
      createdAt: result.timestamp,
      completedAt: new Date(),
      summary: {
        totalFindings: result.allFindings.length,
        bySeverity: countFindingsBySeverity(result.allFindings),
        complianceScore: result.overallComplianceScore,
      }
    };
  } catch (error) {
    console.error('[AgentAPI] Analysis failed:', error);
    throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * GET /api/agents/results/{drawingId}
 * Get analysis results for a specific drawing
 * TODO: Implement Firestore fetching for historical analysis results
 */
export async function getAnalysisResults(drawingId: string): Promise<AgentAnalysisResult | null> {
  try {
    // Try to get recent audit logs for this drawing to reconstruct results
    const auditEntries = auditLogger.getEntries({
      drawingId,
      eventTypes: [AuditEventType.AGENT_COMPLETE, AuditEventType.COMPLIANCE_CHECK],
    });

    if (auditEntries.length === 0) {
      // No results found in audit log
      return null;
    }

    // Get the most recent compliance check entry
    const complianceEntry = auditEntries.find(e => e.eventType === AuditEventType.COMPLIANCE_CHECK);
    
    // Get agent logs from Firestore for more detailed results
    const agentLogs = await getAgentLogs(drawingId, 100);

    // Reconstruct results from available data
    const agentResults: AgentResult[] = [];
    const agents = getAllAgents();

    for (const agent of agents) {
      const agentLogEntries = auditEntries.filter(e => e.agentId === agent.id);
      const completedEntry = agentLogEntries.find(e => e.eventType === AuditEventType.AGENT_COMPLETE);

      if (completedEntry) {
        agentResults.push({
          agentId: agent.id,
          agentName: agent.name,
          status: 'completed',
          accuracy: completedEntry.details?.complianceScore as number || 0,
          issues: [], // Issues would need to be fetched from a separate store
          processingTime: completedEntry.duration,
          completedAt: completedEntry.timestamp,
          complianceScore: completedEntry.details?.complianceScore as number || 0,
        });
      }
    }

    const orchestratorScore = complianceEntry?.details?.complianceScore as number || 0;

    return {
      drawingId,
      filename: `drawing-${drawingId}.dwg`,
      status: 'completed',
      results: agentResults,
      orchestratorScore,
      createdAt: auditEntries[0]?.timestamp || new Date(),
      completedAt: complianceEntry?.timestamp || new Date(),
      summary: {
        totalFindings: complianceEntry?.details?.failed as number || 0,
        bySeverity: { critical: 0, high: 0, medium: 0, low: 0 }, // Would need to calculate from actual findings
        complianceScore: orchestratorScore,
      }
    };
  } catch (error) {
    console.error('[AgentAPI] Error fetching analysis results:', error);
    return null;
  }
}

/**
 * POST /api/agents/override
 * Override an agent's decision on an issue
 * TODO: Implement with Firestore integration for persistence
 */
export async function overrideAgentDecision(request: AgentOverrideRequest): Promise<{ success: boolean; message: string }> {
  try {
    // Log the override action
    auditLogger.log(AuditEventType.FINDING_OVERRIDE, 
      `Issue ${request.issueId} overridden by ${request.overriddenBy}`,
      {
        agentId: request.agentId,
        drawingId: request.drawingId,
        details: {
          issueId: request.issueId,
          reason: request.reason,
          overriddenBy: request.overriddenBy,
        },
        status: 'success',
      }
    );

    return {
      success: true,
      message: `Issue ${request.issueId} overridden by ${request.overriddenBy}. Reason: ${request.reason}`,
    };
  } catch (error) {
    console.error('[AgentAPI] Error overriding agent decision:', error);
    return {
      success: false,
      message: `Failed to override issue: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * GET /api/agents/accuracy
 * Get accuracy metrics for all agents
 * Uses real orchestrator metrics
 */
export async function getAgentAccuracyMetrics(): Promise<AgentAccuracyMetrics> {
  try {
    const agentMetrics = agentOrchestrator.getAgentMetrics() as Map<string, {
      agentId: string;
      agentName: string;
      tasksCompleted: number;
      tasksFailed: number;
      averageProcessingTime: number;
    }>;

    const agentAccuracy: AgentAccuracy[] = [];

    for (const [, metrics] of agentMetrics) {
      const totalChecks = metrics.tasksCompleted + metrics.tasksFailed;
      const successfulChecks = metrics.tasksCompleted;
      // Calculate accuracy based on successful vs failed tasks
      const accuracy = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0;

      agentAccuracy.push({
        agentId: metrics.agentId,
        agentName: metrics.agentName,
        accuracy: Math.round(accuracy * 100) / 100,
        totalChecks,
        successfulChecks,
        lastUpdated: new Date(),
      });
    }

    const overallAccuracy = agentAccuracy.length > 0
      ? agentAccuracy.reduce((sum, a) => sum + a.accuracy, 0) / agentAccuracy.length
      : 0;

    const belowThresholdAgents = agentAccuracy
      .filter(a => a.accuracy < 98)
      .map(a => a.agentId);

    return {
      agents: agentAccuracy,
      overallAccuracy: Math.round(overallAccuracy * 100) / 100,
      threshold: 98,
      belowThresholdAgents,
    };
  } catch (error) {
    console.error('[AgentAPI] Error fetching agent accuracy metrics:', error);
    // Return empty metrics on error
    return {
      agents: [],
      overallAccuracy: 0,
      threshold: 98,
      belowThresholdAgents: [],
    };
  }
}

/**
 * Generate compliance report
 * TODO: Implement full report generation with Firestore persistence
 */
export async function generateReport(request: ReportGenerationRequest): Promise<ReportGenerationResult> {
  try {
    // Log report generation attempt
    auditLogger.log(
      AuditEventType.USER_ACTION,
      `Report generated: ${request.reportType}`,
      {
        projectId: request.projectId,
        drawingId: request.drawingId,
        details: {
          reportType: request.reportType,
          format: request.format,
          includeCharts: request.includeCharts,
        }
      }
    );

    const reportId = `report-${Date.now()}`;

    return {
      reportId,
      projectId: request.projectId,
      type: request.reportType,
      format: request.format,
      generatedAt: new Date(),
      downloadUrl: `/api/reports/${reportId}/download`,
    };
  } catch (error) {
    console.error('[AgentAPI] Error generating report:', error);
    throw new Error(`Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to get all 14 agents including new specialized agents
export function getAllAgents() {
  return [
    // Technical Validation Agents
    {
      id: 'dimension-validator-agent',
      name: 'Dimension Validator',
      type: 'validator',
      status: 'active' as const,
      checksToday: 45,
      checksTotal: 1250,
      avgProcessingTime: '3.2s',
      accuracy: 98.5,
      lastActive: new Date(),
      capabilities: ['Length Verification', 'Width Check', 'Height Validation', 'Tolerance Analysis'],
    },
    {
      id: 'scale-verifier-agent',
      name: 'Scale Verifier',
      type: 'validator',
      status: 'active' as const,
      checksToday: 52,
      checksTotal: 1500,
      avgProcessingTime: '2.8s',
      accuracy: 99.1,
      lastActive: new Date(),
      capabilities: ['Scale Consistency', 'Proportion Check', 'Unit Conversion'],
    },
    {
      id: 'layer-analyzer-agent',
      name: 'Layer Analyzer',
      type: 'analyzer',
      status: 'idle' as const,
      checksToday: 38,
      checksTotal: 980,
      avgProcessingTime: '4.1s',
      accuracy: 97.8,
      lastActive: new Date(Date.now() - 1000 * 60 * 5),
      capabilities: ['Layer Naming', 'Organization Check', 'Visibility Settings'],
    },
    {
      id: 'symbol-recognizer-agent',
      name: 'Symbol Recognizer',
      type: 'analyzer',
      status: 'active' as const,
      checksToday: 42,
      checksTotal: 1100,
      avgProcessingTime: '3.5s',
      accuracy: 98.2,
      lastActive: new Date(),
      capabilities: ['Symbol Detection', 'Notation Check', 'Standard Verification'],
    },
    {
      id: 'text-clarity-checker-agent',
      name: 'Text Clarity Checker',
      type: 'reviewer',
      status: 'active' as const,
      checksToday: 35,
      checksTotal: 850,
      avgProcessingTime: '2.5s',
      accuracy: 96.9,
      lastActive: new Date(),
      capabilities: ['Font Size Check', 'Text Placement', 'Readability Analysis'],
    },
    // SANS 10400 Specialized Agents
    {
      id: 'siteplan-compliance-agent',
      name: 'Site Plan Compliance Agent',
      type: 'compliance',
      status: 'active' as const,
      checksToday: 28,
      checksTotal: 720,
      avgProcessingTime: '4.5s',
      accuracy: 97.5,
      lastActive: new Date(),
      capabilities: ['SANS 10400-A', 'Boundary Requirements', 'Site Access', 'Drainage'],
    },
    {
      id: 'floorplan-compliance-agent',
      name: 'Floor Plan Compliance Agent',
      type: 'compliance',
      status: 'active' as const,
      checksToday: 31,
      checksTotal: 790,
      avgProcessingTime: '4.8s',
      accuracy: 98.7,
      lastActive: new Date(),
      capabilities: ['SANS 10400-A', 'SANS 10400-O', 'Room Dimensions', 'Sanitary Facilities'],
    },
    {
      id: 'elevation-compliance-agent',
      name: 'Elevation Compliance Agent',
      type: 'compliance',
      status: 'active' as const,
      checksToday: 25,
      checksTotal: 680,
      avgProcessingTime: '4.2s',
      accuracy: 98.9,
      lastActive: new Date(),
      capabilities: ['SANS 10400-A', 'SANS 10400-T', 'Height Restrictions', 'Visual Impact'],
    },
    {
      id: 'section-compliance-agent',
      name: 'Section Compliance Agent',
      type: 'compliance',
      status: 'active' as const,
      checksToday: 22,
      checksTotal: 620,
      avgProcessingTime: '4.0s',
      accuracy: 98.5,
      lastActive: new Date(),
      capabilities: ['SANS 10400-A', 'SANS 10400-K', 'Structural Elements', 'Clearances'],
    },
    {
      id: 'drainage-compliance-agent',
      name: 'Drainage Compliance Agent',
      type: 'compliance',
      status: 'active' as const,
      checksToday: 20,
      checksTotal: 550,
      avgProcessingTime: '3.8s',
      accuracy: 98.2,
      lastActive: new Date(),
      capabilities: ['SANS 10400-P', 'SANS 10252', 'Drainage Layout', 'Stormwater'],
    },
    {
      id: 'fire-compliance-agent',
      name: 'Fire Compliance Agent',
      type: 'compliance',
      status: 'active' as const,
      checksToday: 24,
      checksTotal: 650,
      avgProcessingTime: '5.2s',
      accuracy: 99.0,
      lastActive: new Date(),
      capabilities: ['SANS 10400-T', 'Escape Routes', 'Fire Doors', 'Detection Systems'],
    },
    {
      id: 'energy-compliance-agent',
      name: 'Energy Compliance Agent',
      type: 'compliance',
      status: 'active' as const,
      checksToday: 19,
      checksTotal: 520,
      avgProcessingTime: '4.5s',
      accuracy: 97.8,
      lastActive: new Date(),
      capabilities: ['SANS 10400-XA', 'Thermal Performance', 'Insulation', 'Energy Rating'],
    },
    // NEW: Specialized Compliance Agents
    {
      id: 'structural-compliance-agent',
      name: 'Structural Compliance Agent',
      type: 'compliance',
      status: 'active' as const,
      checksToday: 15,
      checksTotal: 380,
      avgProcessingTime: '6.5s',
      accuracy: 98.8,
      lastActive: new Date(),
      capabilities: ['SANS 10160', 'SANS 10137', 'SANS 10182', 'SANS 10221', 'Load Actions', 'Concrete', 'Steel', 'Timber'],
    },
    {
      id: 'municipal-requirements-agent',
      name: 'Municipal Requirements Agent',
      type: 'compliance',
      status: 'active' as const,
      checksToday: 18,
      checksTotal: 450,
      avgProcessingTime: '5.5s',
      accuracy: 96.4,
      lastActive: new Date(),
      capabilities: ['Zoning Compliance', 'FAR', 'Site Coverage', 'Parking', 'Stormwater', 'Building Lines'],
    },
    {
      id: 'accessibility-compliance-agent',
      name: 'Accessibility Agent',
      type: 'compliance',
      status: 'active' as const,
      checksToday: 16,
      checksTotal: 410,
      avgProcessingTime: '4.8s',
      accuracy: 97.9,
      lastActive: new Date(),
      capabilities: ['NBR Part S', 'Wheelchair Access', 'Ramps', 'Door Widths', 'Grab Rails', 'WC Cubicles'],
    },
    {
      id: 'final-review-agent',
      name: 'Final Review Agent',
      type: 'reviewer',
      status: 'active' as const,
      checksToday: 22,
      checksTotal: 620,
      avgProcessingTime: '8.5s',
      accuracy: 99.3,
      lastActive: new Date(),
      capabilities: ['Comprehensive Review', 'Cross-Reference Check', 'Quality Control', 'Submission Completeness'],
    },
  ];
}

// Orchestrator types
export interface OrchestratorStatus {
  isActive: boolean;
  currentTask: string | null;
  taskQueue: number;
  completedTasks: number;
  failedTasks: number;
  conflictsDetected: number;
  conflictsResolved: number;
  lastUpdate: Date;
}

export interface TaskDelegation {
  taskId: string;
  drawingId: string;
  assignedAgents: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
}

export interface ConflictResolution {
  conflictId: string;
  taskId: string;
  conflictingAgents: string[];
  issue: string;
  status: 'detected' | 'reassigned' | 'escalated' | 'resolved';
  resolvedBy?: string;
  resolution?: string;
  detectedAt: Date;
  resolvedAt?: Date;
}

/**
 * Get current orchestrator status
 * Uses real orchestrator status
 */
export async function getOrchestratorStatus(): Promise<OrchestratorStatus> {
  try {
    const status = agentOrchestrator.getStatus();
    const agentMetrics = agentOrchestrator.getAgentMetrics() as Map<string, { tasksFailed: number }>;

    // Calculate failed tasks from agent metrics
    let totalFailedTasks = 0;
    for (const [, metrics] of agentMetrics) {
      totalFailedTasks += metrics.tasksFailed;
    }

    return {
      isActive: status.activeAgents > 0,
      currentTask: status.activeAgents > 0 ? `Processing with ${status.activeAgents} agents` : null,
      taskQueue: status.queueLength,
      completedTasks: status.auditLogSize, // Using audit log size as proxy for completed tasks
      failedTasks: totalFailedTasks,
      conflictsDetected: 0, // Would need to track conflicts separately
      conflictsResolved: 0,
      lastUpdate: new Date(),
    };
  } catch (error) {
    console.error('[AgentAPI] Error fetching orchestrator status:', error);
    // Return default status on error
    return {
      isActive: false,
      currentTask: null,
      taskQueue: 0,
      completedTasks: 0,
      failedTasks: 0,
      conflictsDetected: 0,
      conflictsResolved: 0,
      lastUpdate: new Date(),
    };
  }
}

/**
 * Get task delegation flow
 * Uses audit logger to get recent task activity
 */
export async function getTaskDelegationFlow(): Promise<TaskDelegation[]> {
  try {
    // Get recent audit entries for task-related events
    const auditEntries = auditLogger.getEntries({
      eventTypes: [AuditEventType.AGENT_START, AuditEventType.AGENT_COMPLETE],
    });

    // Group entries by task/drawing
    const taskMap = new Map<string, TaskDelegation>();

    for (const entry of auditEntries) {
      const drawingId = entry.drawingId || 'unknown';
      const taskId = entry.details?.taskId as string || `task-${drawingId}`;

      if (!taskMap.has(taskId)) {
        taskMap.set(taskId, {
          taskId,
          drawingId,
          assignedAgents: [],
          status: 'pending',
          startedAt: entry.timestamp,
        });
      }

      const task = taskMap.get(taskId)!;

      if (entry.agentId && !task.assignedAgents.includes(entry.agentId)) {
        task.assignedAgents.push(entry.agentId);
      }

      if (entry.eventType === AuditEventType.AGENT_COMPLETE) {
        task.status = 'completed';
        task.completedAt = entry.timestamp;
      } else if (entry.eventType === AuditEventType.AGENT_START && task.status === 'pending') {
        task.status = 'in_progress';
      }
    }

    return Array.from(taskMap.values());
  } catch (error) {
    console.error('[AgentAPI] Error fetching task delegation flow:', error);
    return [];
  }
}

/**
 * Get conflict resolution status
 * TODO: Implement proper conflict tracking with Firestore persistence
 */
export async function getConflictResolution(): Promise<ConflictResolution[]> {
  try {
    // Currently conflicts are detected during analysis but not persisted separately
    // This would need a dedicated Firestore collection for conflict tracking
    // For now, return empty array - conflicts are logged in audit log
    
    const auditEntries = auditLogger.getEntries({
      eventTypes: [AuditEventType.SYSTEM_ERROR],
    });

    // Filter entries that might indicate conflicts
    const conflictEntries = auditEntries.filter(e => 
      e.description.toLowerCase().includes('conflict') ||
      e.description.toLowerCase().includes('disagreement')
    );

    return conflictEntries.map((entry, index) => ({
      conflictId: `conflict-${index}`,
      taskId: entry.details?.taskId as string || 'unknown',
      conflictingAgents: entry.agentId ? [entry.agentId] : [],
      issue: entry.description,
      status: 'detected',
      detectedAt: entry.timestamp,
    }));
  } catch (error) {
    console.error('[AgentAPI] Error fetching conflict resolutions:', error);
    return [];
  }
}

// Helper functions
function mapFindingTypeToIssueType(findingType: string): AgentIssue['type'] {
  const typeMap: Record<string, AgentIssue['type']> = {
    'compliance': 'compliance',
    'dimension': 'dimension',
    'scale': 'scale',
    'annotation': 'annotation',
    'layer': 'layer',
    'symbol': 'symbol',
    'text': 'annotation',
    'error': 'other',
  };
  return typeMap[findingType] || 'other';
}

function countFindingsBySeverity(findings: { severity: string }[]): Record<string, number> {
  const bySeverity: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  
  for (const finding of findings) {
    const severity = finding.severity.toLowerCase();
    if (severity in bySeverity) {
      bySeverity[severity] = (bySeverity[severity] || 0) + 1;
    }
  }
  
  return bySeverity;
}

// File Parser Exports
export { fileParser } from '@/agents/services/FileParser';
export type { ParseOptions, FileMetadata, DetectedElement } from '@/agents/services/FileParser';
