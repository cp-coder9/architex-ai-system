/**
 * SANS 10400 Compliance Agent Type Definitions
 * 
 * Core types for the compliance agent system including agent interfaces,
 * compliance rules, findings, and severity levels.
 */

// ============================================================================
// Enums
// ============================================================================

/**
 * Agent status enum representing the current state of an agent
 */
export enum AgentStatus {
  ACTIVE = 'active',
  IDLE = 'idle',
  PAUSED = 'paused',
  ERROR = 'error',
  PROCESSING = 'processing'
}

/**
 * Severity levels for compliance findings
 */
export enum Severity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

/**
 * Drawing type enumeration for SANS 10400 compliance
 */
export enum DrawingType {
  SITE_PLAN = 'site_plan',
  FLOOR_PLAN = 'floor_plan',
  ELEVATION = 'elevation',
  SECTION = 'section',
  DETAIL = 'detail',
  DRAINAGE = 'drainage',
  FIRE_LAYOUT = 'fire_layout',
  ROOF_PLAN = 'roof_plan',
  ELECTRICAL = 'electrical',
  THREE_D_RENDER = '3d_render'
}

// ============================================================================
// Core Interfaces
// ============================================================================

/**
 * Agent configuration interface
 */
export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  maxRetries: number;
  timeout: number; // milliseconds
  priority: number;
  capabilities: string[];
  supportedDrawingTypes: DrawingType[];
  supportedStandards: string[];
}

/**
 * Agent metrics for tracking performance
 */
export interface AgentMetrics {
  checksToday: number;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  averageProcessingTime: number; // milliseconds
  accuracy: number;
  lastActive: Date;
  lastCheckAt?: Date;
  errorCount: number;
}

/**
 * Location interface for findings within drawings
 */
export interface Location {
  pageNumber?: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  coordinateSystem?: 'absolute' | 'relative';
  layer?: string;
  elementId?: string;
}

/**
 * Evidence interface for supporting documentation
 */
export interface Evidence {
  type: 'screenshot' | 'measurement' | 'calculation' | 'reference' | 'image';
  data: string | Record<string, unknown>;
  description: string;
  timestamp: Date;
  source?: string;
}

/**
 * Finding interface representing a compliance issue
 */
export interface Finding {
  id: string;
  ruleId: string;
  ruleName: string;
  standard: string;
  severity: Severity;
  title: string;
  description: string;
  location?: Location;
  evidence: Evidence[];
  suggestion?: string;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  overrideReason?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Agent result interface for analysis results
 */
export interface AgentResult {
  agentId: string;
  agentName: string;
  drawingId: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  startTime: Date;
  completionTime?: Date;
  processingTime?: number;
  findings: Finding[];
  complianceScore: number;
  passedRules: string[];
  failedRules: string[];
  warnings: string[];
  errors: string[];
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Compliance Rule Interfaces
// ============================================================================

/**
 * Compliance rule interface with all SANS 10400 fields
 */
export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  standard: string; // e.g., 'SANS 10400-A', 'SANS 10252'
  part?: string; // e.g., 'Part A', 'Part XA'
  category: 'site' | 'floor_plan' | 'elevation' | 'section' | 'drainage' | 'fire' | 'energy' | 'accessibility' | 'structural' | 'technical' | 'final' | 'municipal';
  severity: Severity;
  checkType: 'presence' | 'dimension' | 'calculation' | 'verification' | 'document';
  
  // Rule requirements
  requirement: string;
  minRequirements?: string[];
  calculation?: string;
  
  // Thresholds
  thresholds?: {
    min?: number;
    max?: number;
    unit?: string;
    comparison?: 'greater_than' | 'less_than' | 'equals' | 'between';
  };
  
  // Related rules
  relatedRules?: string[];
  dependsOn?: string[];
  
  // Metadata
  effectiveDate?: Date;
  lastUpdated: Date;
  version: string;
  isActive: boolean;
}

/**
 * Compliance result interface for rule evaluation
 */
export interface ComplianceResult {
  rule: ComplianceRule;
  passed: boolean;
  value?: number | string | boolean;
  expected?: number | string | boolean;
  tolerance?: number;
  finding?: Finding;
  calculationDetails?: {
    formula: string;
    inputs: Record<string, number>;
    result: number;
    unit?: string;
  };
  timestamp: Date;
}

// ============================================================================
// Drawing Data Interfaces
// ============================================================================

/**
 * Drawing data interface for parsed drawings
 */
export interface DrawingData {
  id: string;
  projectId: string;
  name: string;
  type: DrawingType;
  fileUrl: string;
  version: number;
  
  // Extracted data
  layers: LayerInfo[];
  dimensions: ExtractedDimension[];
  annotations: AnnotationInfo[];
  symbols: SymbolInfo[];
  textElements: TextElement[];
  
  // Metadata
  scale?: string;
  units?: 'mm' | 'cm' | 'm';
  coordinateSystem?: string;
  boundingBox?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  
  // Parsing metadata
  parsedAt: Date;
  parserVersion: string;
  warnings: string[];
}

/**
 * Layer information interface
 */
export interface LayerInfo {
  name: string;
  visible: boolean;
  locked: boolean;
  color?: string;
  lineType?: string;
  objectCount: number;
}

/**
 * Extracted dimension interface
 */
export interface ExtractedDimension {
  id: string;
  value: number;
  unit: string;
  type: 'linear' | 'angular' | 'radial' | 'diameter';
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  layer?: string;
}

/**
 * Annotation information interface
 */
export interface AnnotationInfo {
  id: string;
  type: 'text' | 'dimension' | 'leader' | 'block' | 'image';
  content: string;
  position: { x: number; y: number };
  layer?: string;
  style?: Record<string, unknown>;
}

/**
 * Symbol information interface
 */
export interface SymbolInfo {
  id: string;
  name: string;
  category: string;
  position: { x: number; y: number };
  rotation?: number;
  scale?: number;
  layer?: string;
  properties?: Record<string, unknown>;
}

/**
 * Text element interface
 */
export interface TextElement {
  id: string;
  content: string;
  position: { x: number; y: number };
  height?: number;
  font?: string;
  layer?: string;
  rotation?: number;
}

// ============================================================================
// Agent Context Interfaces
// ============================================================================

/**
 * Agent context for analysis
 */
export interface AgentContext {
  drawing: DrawingData;
  projectInfo: ProjectInfo;
  previousResults?: AgentResult[];
  userId?: string;
  sessionId?: string;
}

/**
 * Project information interface
 */
export interface ProjectInfo {
  id: string;
  name: string;
  description?: string;
  address?: string;
  erfNumber?: string;
  zoning?: string;
  buildingType: 'residential' | 'commercial' | 'industrial' | 'mixed_use';
  floors: number;
  totalArea?: number;
  occupancy?: number;
  ownerName?: string;
  architectName?: string;
  municipality?: string;
  submittedAt?: Date;
}

// ============================================================================
// Agent Check Interfaces
// ============================================================================

/**
 * Agent check request interface
 */
export interface AgentCheckRequest {
  drawingId: string;
  drawingData: DrawingData;
  projectInfo: ProjectInfo;
  ruleIds?: string[];
  userId?: string;
  sessionId?: string;
  options?: {
    skipCache?: boolean;
    generateReport?: boolean;
    includeEvidence?: boolean;
  };
}

/**
 * Agent check result interface
 */
export interface AgentCheckResult {
  requestId: string;
  agentId: string;
  drawingId: string;
  status: 'success' | 'partial' | 'failed';
  results: ComplianceResult[];
  summary: {
    totalRules: number;
    passed: number;
    failed: number;
    complianceScore: number;
  };
  processingTime: number;
  timestamp: Date;
  errors?: string[];
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Type guard for checking if a rule is active
 */
export function isRuleActive(rule: ComplianceRule): boolean {
  return rule.isActive && (!rule.effectiveDate || new Date(rule.effectiveDate) <= new Date());
}

/**
 * Type guard for checking severity level
 */
export function isCriticalOrHigh(severity: Severity): boolean {
  return severity === Severity.CRITICAL || severity === Severity.HIGH;
}

/**
 * Calculate compliance score from results
 */
export function calculateComplianceScore(results: ComplianceResult[]): number {
  if (results.length === 0) return 0;
  const passed = results.filter(r => r.passed).length;
  return Math.round((passed / results.length) * 100);
}
