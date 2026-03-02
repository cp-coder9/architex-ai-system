/**
 * Audit Logger Service
 * 
 * Comprehensive audit logging:
 * - Operation tracking
 * - Agent activities logged
 * - User actions recorded
 * - Timestamp tracking
 * - Export capabilities
 */

/**
 * Audit log entry types
 */
export enum AuditEventType {
  // Agent events
  AGENT_START = 'agent_start',
  AGENT_COMPLETE = 'agent_complete',
  AGENT_ERROR = 'agent_error',
  AGENT_PAUSE = 'agent_pause',
  AGENT_RESUME = 'agent_resume',
  
  // Drawing events
  DRAWING_UPLOAD = 'drawing_upload',
  DRAWING_PARSE = 'drawing_parse',
  DRAWING_DELETE = 'drawing_delete',
  DRAWING_ANALYZE = 'drawing_analyze',
  
  // Project events
  PROJECT_CREATE = 'project_create',
  PROJECT_UPDATE = 'project_update',
  PROJECT_DELETE = 'project_delete',
  PROJECT_SUBMIT = 'project_submit',
  
  // User events
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_ACTION = 'user_action',
  
  // Compliance events
  COMPLIANCE_CHECK = 'compliance_check',
  FINDING_CREATE = 'finding_create',
  FINDING_RESOLVE = 'finding_resolve',
  FINDING_OVERRIDE = 'finding_override',
  
  // System events
  SYSTEM_ERROR = 'system_error',
  SYSTEM_BACKUP = 'system_backup',
  CONFIG_CHANGE = 'config_change'
}

/**
 * Audit log severity
 */
export enum AuditSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Audit log entry
 */
export interface AuditEntry {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  userName?: string;
  sessionId?: string;
  projectId?: string;
  drawingId?: string;
  agentId?: string;
  description: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  duration?: number;
  status: 'success' | 'failure' | 'pending';
  errorMessage?: string;
}

/**
 * Audit filter options
 */
export interface AuditFilter {
  eventTypes?: AuditEventType[];
  severities?: AuditSeverity[];
  userId?: string;
  projectId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: 'success' | 'failure' | 'pending';
  searchTerm?: string;
}

/**
 * Audit logger configuration
 */
export interface AuditLoggerConfig {
  enableConsoleLog: boolean;
  enableFileLog: boolean;
  enableRemoteLog: boolean;
  logRetentionDays: number;
  includeUserAgent: boolean;
  includeIpAddress: boolean;
  minSeverity: AuditSeverity;
}

/**
 * Audit Logger class
 */
export class AuditLogger {
  private entries: AuditEntry[] = [];
  private config: AuditLoggerConfig;
  private listeners: ((entry: AuditEntry) => void)[] = [];

  constructor(config?: Partial<AuditLoggerConfig>) {
    this.config = {
      enableConsoleLog: true,
      enableFileLog: true,
      enableRemoteLog: false,
      logRetentionDays: 90,
      includeUserAgent: true,
      includeIpAddress: true,
      minSeverity: AuditSeverity.DEBUG,
      ...config
    };
  }

  /**
   * Log an audit entry
   */
  log(
    eventType: AuditEventType,
    description: string,
    options?: {
      severity?: AuditSeverity;
      userId?: string;
      userName?: string;
      sessionId?: string;
      projectId?: string;
      drawingId?: string;
      agentId?: string;
      details?: Record<string, unknown>;
      ipAddress?: string;
      userAgent?: string;
      duration?: number;
      status?: 'success' | 'failure' | 'pending';
      errorMessage?: string;
    }
  ): AuditEntry {
    const severity = options?.severity || this.mapEventTypeToSeverity(eventType);
    
    // Check if we should log based on min severity
    if (!this.shouldLog(severity)) {
      return {} as AuditEntry;
    }

    const entry: AuditEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      eventType,
      severity,
      userId: options?.userId,
      userName: options?.userName,
      sessionId: options?.sessionId,
      projectId: options?.projectId,
      drawingId: options?.drawingId,
      agentId: options?.agentId,
      description,
      details: options?.details,
      ipAddress: this.config.includeIpAddress ? options?.ipAddress : undefined,
      userAgent: this.config.includeUserAgent ? options?.userAgent : undefined,
      duration: options?.duration,
      status: options?.status || 'success',
      errorMessage: options?.errorMessage
    };

    // Store entry
    this.entries.push(entry);

    // Log to console in development
    if (this.config.enableConsoleLog) {
      this.logToConsole(entry);
    }

    // Notify listeners
    this.notifyListeners(entry);

    // Clean up old entries
    this.cleanup();

    return entry;
  }

  /**
   * Log agent start
   */
  logAgentStart(
    agentId: string,
    agentName: string,
    context: {
      userId?: string;
      projectId?: string;
      drawingId?: string;
      sessionId?: string;
    }
  ): AuditEntry {
    return this.log(
      AuditEventType.AGENT_START,
      `Agent ${agentName} started`,
      {
        agentId,
        projectId: context.projectId,
        drawingId: context.drawingId,
        userId: context.userId,
        sessionId: context.sessionId,
        details: { agentName }
      }
    );
  }

  /**
   * Log agent completion
   */
  logAgentComplete(
    agentId: string,
    agentName: string,
    context: {
      userId?: string;
      projectId?: string;
      drawingId?: string;
      sessionId?: string;
    },
    result: {
      complianceScore: number;
      findingsCount: number;
      duration: number;
    }
  ): AuditEntry {
    return this.log(
      AuditEventType.AGENT_COMPLETE,
      `Agent ${agentName} completed`,
      {
        agentId,
        projectId: context.projectId,
        drawingId: context.drawingId,
        userId: context.userId,
        sessionId: context.sessionId,
        duration: result.duration,
        status: result.complianceScore >= 70 ? 'success' : 'failure',
        details: {
          complianceScore: result.complianceScore,
          findingsCount: result.findingsCount
        }
      }
    );
  }

  /**
   * Log drawing upload
   */
  logDrawingUpload(
    drawingId: string,
    drawingName: string,
    context: {
      userId?: string;
      projectId?: string;
      sessionId?: string;
      fileSize?: number;
    }
  ): AuditEntry {
    return this.log(
      AuditEventType.DRAWING_UPLOAD,
      `Drawing "${drawingName}" uploaded`,
      {
        drawingId,
        projectId: context.projectId,
        userId: context.userId,
        sessionId: context.sessionId,
        details: {
          fileName: drawingName,
          fileSize: context.fileSize
        }
      }
    );
  }

  /**
   * Log user action
   */
  logUserAction(
    userId: string,
    userName: string,
    action: string,
    context?: {
      projectId?: string;
      sessionId?: string;
      details?: Record<string, unknown>;
    }
  ): AuditEntry {
    return this.log(
      AuditEventType.USER_ACTION,
      action,
      {
        userId,
        userName,
        projectId: context?.projectId,
        sessionId: context?.sessionId,
        details: context?.details
      }
    );
  }

  /**
   * Log compliance check
   */
  logComplianceCheck(
    context: {
      userId?: string;
      projectId?: string;
      drawingId?: string;
      sessionId?: string;
    },
    result: {
      totalRules: number;
      passed: number;
      failed: number;
      complianceScore: number;
    }
  ): AuditEntry {
    return this.log(
      AuditEventType.COMPLIANCE_CHECK,
      `Compliance check completed: ${result.complianceScore}%`,
      {
        projectId: context.projectId,
        drawingId: context.drawingId,
        userId: context.userId,
        sessionId: context.sessionId,
        details: result
      }
    );
  }

  /**
   * Get audit entries with filtering
   */
  getEntries(filter?: AuditFilter): AuditEntry[] {
    let result = [...this.entries];

    if (!filter) return result;

    if (filter.eventTypes?.length) {
      result = result.filter(e => filter.eventTypes!.includes(e.eventType));
    }

    if (filter.severities?.length) {
      result = result.filter(e => filter.severities!.includes(e.severity));
    }

    if (filter.userId) {
      result = result.filter(e => e.userId === filter.userId);
    }

    if (filter.projectId) {
      result = result.filter(e => e.projectId === filter.projectId);
    }

    if (filter.startDate) {
      result = result.filter(e => e.timestamp >= filter.startDate!);
    }

    if (filter.endDate) {
      result = result.filter(e => e.timestamp <= filter.endDate!);
    }

    if (filter.status) {
      result = result.filter(e => e.status === filter.status);
    }

    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      result = result.filter(e => 
        e.description.toLowerCase().includes(term) ||
        e.details?.toString().toLowerCase().includes(term)
      );
    }

    return result;
  }

  /**
   * Get entries for a specific project
   */
  getProjectEntries(projectId: string): AuditEntry[] {
    return this.getEntries({ projectId });
  }

  /**
   * Get entries for a specific user
   */
  getUserEntries(userId: string): AuditEntry[] {
    return this.getEntries({ userId });
  }

  /**
   * Get entries for a specific drawing
   */
  getDrawingEntries(drawingId: string): AuditEntry[] {
    return this.getEntries({ drawingId: drawingId } as AuditFilter);
  }

  /**
   * Get statistics
   */
  getStatistics(filter?: AuditFilter): {
    totalEntries: number;
    byEventType: Record<string, number>;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
    averageComplianceScore: number;
  } {
    const entries = this.getEntries(filter);

    const byEventType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const entry of entries) {
      byEventType[entry.eventType] = (byEventType[entry.eventType] || 0) + 1;
      bySeverity[entry.severity] = (bySeverity[entry.severity] || 0) + 1;
      byStatus[entry.status] = (byStatus[entry.status] || 0) + 1;
    }

    // Calculate average compliance score from compliance check entries
    const complianceScores = entries
      .filter(e => e.eventType === AuditEventType.COMPLIANCE_CHECK)
      .map(e => e.details?.complianceScore as number)
      .filter(s => typeof s === 'number');
    
    const averageComplianceScore = complianceScores.length > 0
      ? complianceScores.reduce((a, b) => a + b, 0) / complianceScores.length
      : 0;

    return {
      totalEntries: entries.length,
      byEventType,
      bySeverity,
      byStatus,
      averageComplianceScore: Math.round(averageComplianceScore)
    };
  }

  /**
   * Export entries to JSON
   */
  exportToJSON(filter?: AuditFilter): string {
    const entries = this.getEntries(filter);
    return JSON.stringify(entries, null, 2);
  }

  /**
   * Export entries to CSV
   */
  exportToCSV(filter?: AuditFilter): string {
    const entries = this.getEntries(filter);
    const headers = [
      'ID', 'Timestamp', 'Event Type', 'Severity', 'User ID', 'Project ID',
      'Drawing ID', 'Agent ID', 'Description', 'Status', 'Duration (ms)', 'Error Message'
    ];

    const rows = entries.map(e => [
      e.id,
      e.timestamp.toISOString(),
      e.eventType,
      e.severity,
      e.userId || '',
      e.projectId || '',
      e.drawingId || '',
      e.agentId || '',
      e.description.replace(/"/g, '""'),
      e.status,
      e.duration?.toString() || '',
      e.errorMessage || ''
    ]);

    return [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
  }

  /**
   * Add listener for new entries
   */
  addListener(listener: (entry: AuditEntry) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries = [];
  }

  /**
   * Get current config
   */
  getConfig(): AuditLoggerConfig {
    return { ...this.config };
  }

  /**
   * Update config
   */
  updateConfig(config: Partial<AuditLoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private generateId(): string {
    return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private mapEventTypeToSeverity(eventType: AuditEventType): AuditSeverity {
    switch (eventType) {
      case AuditEventType.AGENT_ERROR:
      case AuditEventType.SYSTEM_ERROR:
        return AuditSeverity.ERROR;
      case AuditEventType.PROJECT_DELETE:
      case AuditEventType.DRAWING_DELETE:
        return AuditSeverity.WARNING;
      default:
        return AuditSeverity.INFO;
    }
  }

  private shouldLog(severity: AuditSeverity): boolean {
    const levels = [AuditSeverity.DEBUG, AuditSeverity.INFO, AuditSeverity.WARNING, AuditSeverity.ERROR, AuditSeverity.CRITICAL];
    const minIndex = levels.indexOf(this.config.minSeverity);
    const severityIndex = levels.indexOf(severity);
    return severityIndex >= minIndex;
  }

  private logToConsole(entry: AuditEntry): void {
    const prefix = `[${entry.timestamp.toISOString()}] [${entry.severity.toUpperCase()}]`;
    
    switch (entry.severity) {
      case AuditSeverity.ERROR:
      case AuditSeverity.CRITICAL:
        console.error(prefix, entry.description, entry);
        break;
      case AuditSeverity.WARNING:
        console.warn(prefix, entry.description, entry);
        break;
      default:
        console.log(prefix, entry.description, entry);
    }
  }

  private notifyListeners(entry: AuditEntry): void {
    for (const listener of this.listeners) {
      try {
        listener(entry);
      } catch (error) {
        console.error('Error in audit listener:', error);
      }
    }
  }

  private cleanup(): void {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.config.logRetentionDays);
    this.entries = this.entries.filter(e => e.timestamp >= cutoff);
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();
export default AuditLogger;
