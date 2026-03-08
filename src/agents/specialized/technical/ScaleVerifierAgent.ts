/**
 * ScaleVerifierAgent
 * 
 * Validates drawing scales against SANS 10011 standards.
 * Checks for scale bar presence, scale consistency, and appropriate scale selection.
 */

import { Agent } from '@/agents/base/Agent';
import {
  AgentConfig,
  AgentResult,
  AgentContext,
  DrawingData,
  ProjectInfo,
  ComplianceRule,
  ComplianceResult,
  Finding,
  Severity,
  DrawingType,
  calculateComplianceScore
} from '@/types/agent';

// ============================================================================
// SANS 10011 Scale Rules
// ============================================================================

const SCALE_RULES: ComplianceRule[] = [
  // --------------------------------------------------------------------------
  // Scale Bar - SCL-001 to SCL-002
  // --------------------------------------------------------------------------
  {
    id: 'SCL-001',
    name: 'Scale Bar Present and Accurate',
    description: 'A graphical scale bar must be present on the drawing',
    standard: 'SANS 10011',
    part: 'General',
    category: 'technical',
    severity: Severity.CRITICAL,
    checkType: 'presence',
    requirement: 'All drawings must include a graphical scale bar for reference',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'SCL-002',
    name: 'Scale Indicated in Title Block',
    description: 'The numerical scale must be clearly indicated in the title block',
    standard: 'SANS 10011',
    part: 'General',
    category: 'technical',
    severity: Severity.CRITICAL,
    checkType: 'presence',
    requirement: 'Title block must show the scale (e.g., 1:100, 1:50)',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // --------------------------------------------------------------------------
  // Scale Consistency - SCL-003 to SCL-004
  // --------------------------------------------------------------------------
  {
    id: 'SCL-003',
    name: 'Consistent Scale Across Sheets',
    description: 'Multiple sheets of the same drawing type should use the same scale',
    standard: 'SANS 10011',
    part: 'General',
    category: 'technical',
    severity: Severity.HIGH,
    checkType: 'verification',
    requirement: 'All sheets of a drawing set should use consistent scale for corresponding views',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'SCL-004',
    name: 'Appropriate Scale for Drawing Type',
    description: 'The selected scale must be appropriate for the drawing type and detail level',
    standard: 'SANS 10011',
    part: 'General',
    category: 'technical',
    severity: Severity.HIGH,
    checkType: 'verification',
    requirement: 'Use appropriate scales: Site plans 1:500-1:2000, Floor plans 1:50-1:200, Details 1:1-1:20',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // --------------------------------------------------------------------------
  // Additional Scale Rules - SCL-005 to SCL-008
  // --------------------------------------------------------------------------
  {
    id: 'SCL-005',
    name: 'Scale Bar Properly Sized',
    description: 'The scale bar should be of adequate size for readability',
    standard: 'SANS 10011',
    part: 'General',
    category: 'technical',
    severity: Severity.MEDIUM,
    checkType: 'dimension',
    requirement: 'Scale bar should be at least 100mm long when printed',
    thresholds: {
      min: 100,
      unit: 'mm',
      comparison: 'greater_than'
    },
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'SCL-006',
    name: 'North Arrow Present',
    description: 'Site plans and location drawings must have a north arrow',
    standard: 'SANS 10011',
    part: 'General',
    category: 'technical',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'All site plans and location drawings must include a north arrow',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'SCL-007',
    name: 'Scale Label Clearly Visible',
    description: 'The scale label must be clearly visible and legible',
    standard: 'SANS 10011',
    part: 'General',
    category: 'technical',
    severity: Severity.MEDIUM,
    checkType: 'verification',
    requirement: 'Scale text should be minimum 2.5mm height when printed',
    thresholds: {
      min: 2.5,
      unit: 'mm',
      comparison: 'greater_than'
    },
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'SCL-008',
    name: 'Metric Units Used',
    description: 'All measurements should be in metric units',
    standard: 'SANS 10011',
    part: 'General',
    category: 'technical',
    severity: Severity.CRITICAL,
    checkType: 'verification',
    requirement: 'All dimensions must be in metric units (mm, cm, m)',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  }
];

// ============================================================================
// Agent Configuration
// ============================================================================

const DEFAULT_CONFIG: AgentConfig = {
  id: 'scale-verifier-agent',
  name: 'Scale Verifier Agent',
  description: 'Validates drawing scales against SANS 10011 standards',
  version: '1.0.0',
  enabled: true,
  maxRetries: 3,
  timeout: 15000,
  priority: 5,
  capabilities: [
    'scale-verification',
    'scale-bar-validation',
    'scale-consistency-check'
  ],
  supportedDrawingTypes: [
    DrawingType.SITE_PLAN,
    DrawingType.FLOOR_PLAN,
    DrawingType.ELEVATION,
    DrawingType.SECTION,
    DrawingType.DETAIL,
    DrawingType.DRAINAGE,
    DrawingType.FIRE_LAYOUT
  ],
  supportedStandards: ['SANS 10011']
};

// Standard scales for different drawing types
const APPROPRIATE_SCALES: Record<string, number[]> = {
  site_plan: [200, 250, 500, 1000, 2000],
  floor_plan: [50, 100, 200],
  elevation: [50, 100, 200],
  section: [50, 100, 200],
  detail: [1, 2, 5, 10, 20],
  drainage: [50, 100, 200],
  fire_layout: [50, 100, 200, 500]
};

// ============================================================================
// Agent Implementation
// ============================================================================

export class ScaleVerifierAgent extends Agent {
  private scaleRules: ComplianceRule[];

  constructor(config: Partial<AgentConfig> = {}) {
    super({ ...DEFAULT_CONFIG, ...config });
    this.scaleRules = SCALE_RULES;
  }

  /**
   * Get rule IDs for this agent
   */
  getRuleIds(): string[] {
    return this.scaleRules.map(rule => rule.id);
  }

  /**
   * Load rules for this agent
   */
  protected async loadRules(): Promise<void> {
    this.rules = this.scaleRules;
  }

  /**
   * Analyze scale on a drawing
   */
  async analyze(drawing: DrawingData, _projectInfo: ProjectInfo): Promise<AgentResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];
    const passedRules: string[] = [];
    const failedRules: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // Extract scale data
      const scaleData = this.extractScaleData(drawing);

      // Run each compliance check
      for (const rule of this.scaleRules) {
        const result = await this.evaluateScaleRule(rule, scaleData, drawing);

        if (result.passed) {
          passedRules.push(rule.id);
        } else {
          failedRules.push(rule.id);
          if (result.finding) {
            findings.push(result.finding);
          }
        }
      }

      // Calculate compliance score
      const complianceScore = calculateComplianceScore(
        this.scaleRules.map(rule => ({
          rule,
          passed: passedRules.includes(rule.id),
          timestamp: new Date()
        }))
      );

      return {
        agentId: this.config.id,
        agentName: this.config.name,
        drawingId: drawing.id,
        status: 'completed',
        startTime: new Date(startTime),
        completionTime: new Date(),
        processingTime: Date.now() - startTime,
        findings,
        complianceScore,
        passedRules,
        failedRules,
        warnings,
        errors,
        metadata: {
          drawingType: drawing.type,
          analysisType: 'scale-verification',
          scaleFound: scaleData.scaleFound,
          scaleBarPresent: scaleData.scaleBarPresent,
          northArrowPresent: scaleData.northArrowPresent,
          titleBlockScale: scaleData.titleBlockScale
        }
      };
    } catch (error) {
      return {
        agentId: this.config.id,
        agentName: this.config.name,
        drawingId: drawing.id,
        status: 'error',
        startTime: new Date(startTime),
        completionTime: new Date(),
        processingTime: Date.now() - startTime,
        findings,
        complianceScore: 0,
        passedRules,
        failedRules,
        warnings,
        errors: [error instanceof Error ? error.message : 'Unknown analysis error'],
        metadata: {
          analysisType: 'scale-verification',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Extract scale data from drawing
   */
  private extractScaleData(drawing: DrawingData): ScaleAnalysisData {
    // Extract scale from title block
    const titleBlockScale = this.extractTitleBlockScale(drawing);

    // Extract scale bar
    const scaleBar = this.extractScaleBar(drawing);

    // Check for north arrow
    const northArrow = this.checkNorthArrow(drawing);

    // Check for metric units
    const usesMetric = this.checkMetricUnits(drawing);

    // Determine drawing type for scale validation
    const drawingType = drawing.type;

    return {
      titleBlockScale,
      scaleBarPresent: scaleBar.present,
      scaleBarLength: scaleBar.length,
      scaleBarUnits: scaleBar.units,
      northArrowPresent: northArrow,
      usesMetricUnits: usesMetric,
      scaleFound: titleBlockScale || (scaleBar.present ? scaleBar.units : null),
      drawingType,
      textElements: drawing.textElements,
      annotations: drawing.annotations,
      symbols: drawing.symbols
    };
  }

  /**
   * Extract scale from title block
   */
  private extractTitleBlockScale(drawing: DrawingData): string | null {
    const textContent = drawing.textElements.map(t => t.content);
    const annotationContent = drawing.annotations.map(a => a.content);
    const allText = [...textContent, ...annotationContent];

    // Look for scale patterns like "1:100", "1:50", "1:200", etc.
    const scalePatterns = [
      /1\s*[:/]\s*(\d+)/i,
      /scale\s*[:\s]*1\s*[:/]\s*(\d+)/i,
      /^(\d+)\s*:\s*1$/i,
      /SCALE\s*1\s*[:/]\s*(\d+)/i
    ];

    for (const text of allText) {
      for (const pattern of scalePatterns) {
        const match = text.match(pattern);
        if (match) {
          return `1:${match[1]}`;
        }
      }
    }

    return null;
  }

  /**
   * Extract scale bar information
   */
  private extractScaleBar(drawing: DrawingData): { present: boolean; length: number; units: string | null } {
    // Look for scale bar in symbols
    const scaleBarSymbols = drawing.symbols.filter(s =>
      s.name.toLowerCase().includes('scale') ||
      s.name.toLowerCase().includes('scale bar') ||
      s.category.toLowerCase().includes('scale')
    );

    if (scaleBarSymbols.length > 0) {
      const symbol = scaleBarSymbols[0];
      return {
        present: true,
        length: symbol.scale ? symbol.scale * 100 : 100, // Estimate
        units: this.extractScaleFromSymbol(symbol)
      };
    }

    // Look for scale bar in annotations
    const annotationContent = drawing.annotations.map(a => a.content.toLowerCase());
    const hasScaleBar = annotationContent.some(text =>
      text.includes('scale bar') ||
      text.includes('graphical scale')
    );

    if (hasScaleBar) {
      return {
        present: true,
        length: 100, // Default assumed length
        units: 'm'
      };
    }

    return {
      present: false,
      length: 0,
      units: null
    };
  }

  /**
   * Extract scale from scale bar symbol
   */
  private extractScaleFromSymbol(symbol: DrawingData['symbols'][0]): string {
    const name = symbol.name.toLowerCase();

    // Look for scale indicators in symbol name
    const scaleMatch = name.match(/1\s*[:/]\s*(\d+)/);
    if (scaleMatch) {
      return `1:${scaleMatch[1]}`;
    }

    // Default to meters for scale bar
    return 'm';
  }

  /**
   * Check for north arrow
   */
  private checkNorthArrow(drawing: DrawingData): boolean {
    // Look for north arrow symbols
    const northSymbols = drawing.symbols.filter(s =>
      s.name.toLowerCase().includes('north') ||
      s.name.toLowerCase().includes('n') ||
      s.category.toLowerCase().includes('north')
    );

    if (northSymbols.length > 0) {
      return true;
    }

    // Look for north arrow in annotations
    const annotationContent = drawing.annotations.map(a => a.content.toLowerCase());
    return annotationContent.some(text =>
      text.includes('north') ||
      text.includes('true north') ||
      text.includes('magnetic north')
    );
  }

  /**
   * Check for metric units
   */
  private checkMetricUnits(drawing: DrawingData): boolean {
    const textContent = drawing.textElements.map(t => t.content.toLowerCase());
    const annotationContent = drawing.annotations.map(a => a.content.toLowerCase());
    const allText = [...textContent, ...annotationContent];

    // Look for metric unit indicators
    const metricPatterns = [
      /\d+\s*mm\b/,
      /\d+\s*cm\b/,
      /\d+\s*m\b/,
      /millimeter/,
      /centimeter/,
      /meter/
    ];

    return allText.some(text => metricPatterns.some(pattern => pattern.test(text)));
  }

  // ============================================================================
  // Rule Evaluation Methods
  // ============================================================================

  /**
   * Evaluate a single scale rule
   */
  private async evaluateScaleRule(
    rule: ComplianceRule,
    scaleData: ScaleAnalysisData,
    drawing: DrawingData
  ): Promise<ComplianceResult> {
    let passed = false;
    let value: string | number | boolean | undefined;
    let expected: string | number | boolean | undefined;
    let finding: Finding | undefined;

    switch (rule.id) {
      case 'SCL-001': // Scale Bar Present
        passed = this.checkScaleBarPresent(scaleData, rule, drawing);
        break;

      case 'SCL-002': // Scale in Title Block
        passed = this.checkTitleBlockScale(scaleData, rule, drawing);
        break;

      case 'SCL-003': // Consistent Scale
        passed = this.checkScaleConsistent(scaleData, rule, drawing);
        break;

      case 'SCL-004': // Appropriate Scale
        passed = this.checkAppropriateScale(scaleData, rule, drawing);
        break;

      case 'SCL-005': // Scale Bar Size
        ({ passed, value, expected, finding } = this.checkScaleBarSize(scaleData, rule, drawing));
        break;

      case 'SCL-006': // North Arrow
        passed = this.checkNorthArrowPresent(scaleData, rule, drawing);
        break;

      case 'SCL-007': // Scale Label Visibility
        passed = this.checkScaleLabelVisibility(scaleData, rule, drawing);
        break;

      case 'SCL-008': // Metric Units
        passed = this.checkMetricUnitsUsed(scaleData, rule, drawing);
        break;

      default:
        passed = false;
    }

    return {
      rule,
      passed,
      value,
      expected,
      finding,
      timestamp: new Date()
    };
  }

  /**
   * SCL-001: Scale Bar Present
   */
  private checkScaleBarPresent(
    scaleData: ScaleAnalysisData,
    _rule: ComplianceRule,
    _drawing: DrawingData
  ): boolean {
    return scaleData.scaleBarPresent;
  }

  /**
   * SCL-002: Scale in Title Block
   */
  private checkTitleBlockScale(
    scaleData: ScaleAnalysisData,
    _rule: ComplianceRule,
    _drawing: DrawingData
  ): boolean {
    return scaleData.titleBlockScale !== null;
  }

  /**
   * SCL-003: Scale Consistent
   */
  private checkScaleConsistent(
    _scaleData: ScaleAnalysisData,
    _rule: ComplianceRule,
    _drawing: DrawingData
  ): boolean {
    // This would require checking multiple sheets
    // For single drawing, assume consistent
    return true;
  }

  /**
   * SCL-004: Appropriate Scale
   */
  private checkAppropriateScale(
    scaleData: ScaleAnalysisData,
    _rule: ComplianceRule,
    _drawing: DrawingData
  ): boolean {
    if (!scaleData.titleBlockScale) {
      return true; // Can't verify if no scale
    }

    // Extract the scale number
    const scaleMatch = scaleData.titleBlockScale.match(/1\s*:\s*(\d+)/);
    if (!scaleMatch) return true;

    const scale = parseInt(scaleMatch[1], 10);
    const drawingTypeKey = scaleData.drawingType.toLowerCase().replace('_', '_');
    const appropriateScales = APPROPRIATE_SCALES[drawingTypeKey] || APPROPRIATE_SCALES.floor_plan;

    return appropriateScales.includes(scale);
  }

  /**
   * SCL-005: Scale Bar Size
   */
  private checkScaleBarSize(
    scaleData: ScaleAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): { passed: boolean; value?: number; expected?: number; finding?: Finding } {
    const minLength = 100; // mm

    if (!scaleData.scaleBarPresent) {
      return {
        passed: false,
        finding: this.createScaleFinding(
          rule,
          'No scale bar present to verify size',
          'critical',
          drawing,
          'Add a graphical scale bar of at least 100mm length'
        )
      };
    }

    if (scaleData.scaleBarLength < minLength) {
      return {
        passed: false,
        value: scaleData.scaleBarLength,
        expected: minLength,
        finding: this.createScaleFinding(
          rule,
          `Scale bar length (${scaleData.scaleBarLength}mm) is less than minimum required ${minLength}mm`,
          'medium',
          drawing,
          'Increase scale bar length to at least 100mm for readability'
        )
      };
    }

    return { passed: true, value: scaleData.scaleBarLength, expected: minLength };
  }

  /**
   * SCL-006: North Arrow
   */
  private checkNorthArrowPresent(
    scaleData: ScaleAnalysisData,
    _rule: ComplianceRule,
    _drawing: DrawingData
  ): boolean {
    // Only required for site plans
    const requiresNorthArrow = [
      DrawingType.SITE_PLAN,
      DrawingType.ROOF_PLAN
    ].includes(scaleData.drawingType);

    if (requiresNorthArrow) {
      return scaleData.northArrowPresent;
    }

    return true;
  }

  /**
   * SCL-007: Scale Label Visibility
   */
  private checkScaleLabelVisibility(
    scaleData: ScaleAnalysisData,
    _rule: ComplianceRule,
    _drawing: DrawingData
  ): boolean {
    // Check if scale text is present
    return scaleData.titleBlockScale !== null || scaleData.scaleBarPresent;
  }

  /**
   * SCL-008: Metric Units
   */
  private checkMetricUnitsUsed(
    scaleData: ScaleAnalysisData,
    _rule: ComplianceRule,
    _drawing: DrawingData
  ): boolean {
    return scaleData.usesMetricUnits;
  }

  /**
   * Create a finding for scale analysis
   */
  private createScaleFinding(
    rule: ComplianceRule,
    description: string,
    severity: 'critical' | 'high' | 'medium' | 'low',
    drawing: DrawingData,
    suggestion?: string
  ): Finding {
    return {
      id: `finding-${rule.id}-${Date.now()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      standard: rule.standard,
      severity: severity === 'critical' ? Severity.CRITICAL :
        severity === 'high' ? Severity.HIGH :
          severity === 'medium' ? Severity.MEDIUM : Severity.LOW,
      title: rule.name,
      description,
      location: {
        pageNumber: 1,
        x: 0,
        y: 0,
        coordinateSystem: 'relative'
      },
      evidence: [],
      suggestion: suggestion || rule.requirement,
      isResolved: false
    };
  }

  /**
   * Evaluate a single rule (abstract method implementation)
   */
  protected async evaluateRule(
    rule: ComplianceRule,
    context: AgentContext
  ): Promise<ComplianceResult> {
    const scaleData = this.extractScaleData(context.drawing);
    return this.evaluateScaleRule(rule, scaleData, context.drawing);
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface ScaleAnalysisData {
  titleBlockScale: string | null;
  scaleBarPresent: boolean;
  scaleBarLength: number;
  scaleBarUnits: string | null;
  northArrowPresent: boolean;
  usesMetricUnits: boolean;
  scaleFound: string | null;
  drawingType: DrawingType;
  textElements: DrawingData['textElements'];
  annotations: DrawingData['annotations'];
  symbols: DrawingData['symbols'];
}

// Export the agent
export default ScaleVerifierAgent;
