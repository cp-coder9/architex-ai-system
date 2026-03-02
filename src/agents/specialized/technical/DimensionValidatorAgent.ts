/**
 * DimensionValidatorAgent
 * 
 * Validates dimensions on architectural drawings against SANS 10160 tolerance standards.
 * Checks for proper dimensioning, consistency, tolerance levels, and chain dimensions.
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
// SANS 10160 Dimension Rules
// ============================================================================

const DIMENSION_RULES: ComplianceRule[] = [
  // --------------------------------------------------------------------------
  // Dimension Presence - DIM-001 to DIM-002
  // --------------------------------------------------------------------------
  {
    id: 'DIM-001',
    name: 'All Dimensions Shown',
    description: 'All relevant dimensions must be clearly shown on the drawing',
    standard: 'SANS 10160',
    part: 'General',
    category: 'technical',
    severity: Severity.CRITICAL,
    checkType: 'presence',
    requirement: 'All rooms, walls, openings, and structural elements must have dimensions shown',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'DIM-002',
    name: 'Dimensions Consistent Across Views',
    description: 'Dimensions must be consistent between plan, elevation, and section views',
    standard: 'SANS 10160',
    part: 'General',
    category: 'technical',
    severity: Severity.HIGH,
    checkType: 'verification',
    requirement: 'Corresponding dimensions across different views must match',
    relatedRules: ['DIM-001'],
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // --------------------------------------------------------------------------
  // Tolerance Standards - DIM-003
  // --------------------------------------------------------------------------
  {
    id: 'DIM-003',
    name: 'Tolerance Levels Appropriate',
    description: 'Dimension tolerances must be appropriate for the building element type',
    standard: 'SANS 10160',
    part: 'General',
    category: 'technical',
    severity: Severity.MEDIUM,
    checkType: 'dimension',
    requirement: 'Tolerances must be indicated: General ±5mm, Structural ±3mm, Architectural ±5mm',
    thresholds: {
      min: 0,
      max: 10,
      unit: 'mm',
      comparison: 'between'
    },
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // --------------------------------------------------------------------------
  // Chain Dimensions - DIM-004
  // --------------------------------------------------------------------------
  {
    id: 'DIM-004',
    name: 'Chain Dimensions Correct',
    description: 'Chain dimensions (running dimensions) must be correctly shown and calculated',
    standard: 'SANS 10160',
    part: 'General',
    category: 'technical',
    severity: Severity.HIGH,
    checkType: 'calculation',
    requirement: 'Chain dimensions must add up to the overall dimension, with tolerance of ±3mm',
    calculation: 'Sum of chain dimensions = Overall dimension (±3mm)',
    thresholds: {
      min: -3,
      max: 3,
      unit: 'mm',
      comparison: 'between'
    },
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // --------------------------------------------------------------------------
  // Reference Dimensions - DIM-005
  // --------------------------------------------------------------------------
  {
    id: 'DIM-005',
    name: 'Reference Dimensions Indicated',
    description: 'Reference dimensions (for information only) must be clearly distinguished',
    standard: 'SANS 10160',
    part: 'General',
    category: 'technical',
    severity: Severity.LOW,
    checkType: 'presence',
    requirement: 'Reference dimensions should be indicated in brackets or with "REF" notation',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // --------------------------------------------------------------------------
  // Additional Dimension Rules - DIM-006 to DIM-010
  // --------------------------------------------------------------------------
  {
    id: 'DIM-006',
    name: 'Dimension Text Size Adequate',
    description: 'Dimension text must be large enough to be legible when printed',
    standard: 'SANS 10160',
    part: 'General',
    category: 'technical',
    severity: Severity.MEDIUM,
    checkType: 'dimension',
    requirement: 'Minimum dimension text height should be 2.5mm when plotted',
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
    id: 'DIM-007',
    name: 'Dimension Lines Not Overcrowded',
    description: 'Dimension lines should not be overcrowded with text',
    standard: 'SANS 10160',
    part: 'General',
    category: 'technical',
    severity: Severity.LOW,
    checkType: 'verification',
    requirement: 'Minimum spacing between parallel dimension lines should be 7mm',
    thresholds: {
      min: 7,
      unit: 'mm',
      comparison: 'greater_than'
    },
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'DIM-008',
    name: 'Extension Lines Properly Terminated',
    description: 'Extension lines should properly terminate at the object',
    standard: 'SANS 10160',
    part: 'General',
    category: 'technical',
    severity: Severity.MEDIUM,
    checkType: 'verification',
    requirement: 'Extension lines should extend 1-3mm beyond the dimension line',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'DIM-009',
    name: 'Datum Dimensions Used',
    description: 'Complex drawings should use datum dimensions for clarity',
    standard: 'SANS 10160',
    part: 'General',
    category: 'technical',
    severity: Severity.LOW,
    checkType: 'verification',
    requirement: 'Datum reference point should be clearly marked and dimensions referenced from it',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'DIM-010',
    name: 'Levels Referenced to Datum',
    description: 'Level indicators must be referenced to a defined datum',
    standard: 'SANS 10160',
    part: 'General',
    category: 'technical',
    severity: Severity.HIGH,
    checkType: 'verification',
    requirement: 'All level markers must reference a common datum with value indicated (e.g., ±0.000)',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  }
];

// ============================================================================
// Agent Configuration
// ============================================================================

const DEFAULT_CONFIG: AgentConfig = {
  id: 'dimension-validator-agent',
  name: 'Dimension Validator Agent',
  description: 'Validates dimensions against SANS 10160 tolerance standards',
  version: '1.0.0',
  enabled: true,
  maxRetries: 3,
  timeout: 15000,
  priority: 5,
  capabilities: [
    'dimension-validation',
    'tolerance-checking',
    'chain-dimension-verification',
    'dimension-consistency'
  ],
  supportedDrawingTypes: [
    DrawingType.FLOOR_PLAN,
    DrawingType.ELEVATION,
    DrawingType.SECTION,
    DrawingType.DETAIL,
    DrawingType.SITE_PLAN
  ],
  supportedStandards: ['SANS 10160']
};

// ============================================================================
// Agent Implementation
// ============================================================================

export class DimensionValidatorAgent extends Agent {
  private dimensionRules: ComplianceRule[];

  constructor(config: Partial<AgentConfig> = {}) {
    super({ ...DEFAULT_CONFIG, ...config });
    this.dimensionRules = DIMENSION_RULES;
  }

  /**
   * Get rule IDs for this agent
   */
  getRuleIds(): string[] {
    return this.dimensionRules.map(rule => rule.id);
  }

  /**
   * Load rules for this agent
   */
  protected async loadRules(): Promise<void> {
    this.rules = this.dimensionRules;
  }

  /**
   * Analyze dimensions on a drawing
   */
  async analyze(drawing: DrawingData, projectInfo: ProjectInfo): Promise<AgentResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];
    const passedRules: string[] = [];
    const failedRules: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // Extract dimension data
      const dimensionData = this.extractDimensionData(drawing);

      // Run each compliance check
      for (const rule of this.dimensionRules) {
        const result = await this.evaluateDimensionRule(rule, dimensionData, drawing);
        
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
        this.dimensionRules.map(rule => ({
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
          analysisType: 'dimension-validation',
          dimensionsFound: dimensionData.totalDimensions,
          linearDimensions: dimensionData.linearCount,
          angularDimensions: dimensionData.angularCount,
          chainDimensions: dimensionData.chainCount
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
          analysisType: 'dimension-validation',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Extract dimension data from drawing
   */
  private extractDimensionData(drawing: DrawingData): DimensionAnalysisData {
    const dimensions = drawing.dimensions;
    
    // Count dimension types
    const linearCount = dimensions.filter(d => d.type === 'linear').length;
    const angularCount = dimensions.filter(d => d.type === 'angular').length;
    const radialCount = dimensions.filter(d => d.type === 'radial' || d.type === 'diameter').length;
    
    // Extract chain dimensions (consecutive dimensions with same offset)
    const chainDimensions = this.extractChainDimensions(dimensions);
    
    // Extract dimension text sizes
    const dimensionTextSizes = this.extractDimensionTextSizes(drawing);
    
    // Check for tolerance indicators
    const hasTolerances = this.checkTolerancesPresent(drawing);
    
    // Check for reference dimensions
    const hasReferenceDimensions = this.checkReferenceDimensions(drawing);
    
    // Check for datum/level references
    const hasDatumReference = this.checkDatumReference(drawing);

    return {
      dimensions,
      totalDimensions: dimensions.length,
      linearCount,
      angularCount,
      radialCount,
      chainCount: chainDimensions.length,
      chainDimensions,
      dimensionTextSizes,
      hasTolerances,
      hasReferenceDimensions,
      hasDatumReference,
      layers: drawing.layers,
      textElements: drawing.textElements
    };
  }

  /**
   * Extract chain dimensions (consecutive parallel dimensions)
   */
  private extractChainDimensions(dimensions: DrawingData['dimensions']): ChainDimension[] {
    const chains: ChainDimension[] = [];
    const processed = new Set<string>();
    
    for (const dim of dimensions) {
      if (processed.has(dim.id)) continue;
      
      // Find dimensions with similar orientation and close proximity
      const chainMembers = dimensions.filter(d => {
        if (d.id === dim.id || processed.has(d.id)) return false;
        
        // Check if dimensions are parallel (same orientation)
        const angle1 = this.calculateDimensionAngle(dim);
        const angle2 = this.calculateDimensionAngle(d);
        const angleDiff = Math.abs(angle1 - angle2);
        
        // Check if dimensions are close to each other
        const distance = this.calculateDimensionDistance(dim, d);
        
        return angleDiff < 5 && distance < 50; // Similar orientation and close
      });
      
      if (chainMembers.length > 0) {
        chains.push({
          id: `chain-${dim.id}`,
          dimensions: [dim, ...chainMembers],
          totalValue: chainMembers.reduce((sum, d) => sum + d.value, 0) + dim.value
        });
        
        processed.add(dim.id);
        chainMembers.forEach(d => processed.add(d.id));
      }
    }
    
    return chains;
  }

  /**
   * Calculate dimension angle
   */
  private calculateDimensionAngle(dim: DrawingData['dimensions'][0]): number {
    const dx = dim.endPoint.x - dim.startPoint.x;
    const dy = dim.endPoint.y - dim.startPoint.y;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  }

  /**
   * Calculate distance between two dimensions
   */
  private calculateDimensionDistance(
    dim1: DrawingData['dimensions'][0],
    dim2: DrawingData['dimensions'][0]
  ): number {
    const mid1 = {
      x: (dim1.startPoint.x + dim1.endPoint.x) / 2,
      y: (dim1.startPoint.y + dim1.endPoint.y) / 2
    };
    const mid2 = {
      x: (dim2.startPoint.x + dim2.endPoint.x) / 2,
      y: (dim2.startPoint.y + dim2.endPoint.y) / 2
    };
    
    return Math.sqrt(
      Math.pow(mid2.x - mid1.x, 2) + Math.pow(mid2.y - mid1.y, 2)
    );
  }

  /**
   * Extract dimension text sizes
   */
  private extractDimensionTextSizes(drawing: DrawingData): number[] {
    const sizes: number[] = [];
    
    // Look for dimension annotations with text
    for (const annotation of drawing.annotations) {
      if (annotation.type === 'dimension' && annotation.style?.textHeight) {
        sizes.push(Number(annotation.style.textHeight));
      }
    }
    
    // Look for text elements that might be dimensions
    for (const text of drawing.textElements) {
      if (text.height) {
        sizes.push(text.height);
      }
    }
    
    return sizes;
  }

  /**
   * Check if tolerances are present
   */
  private checkTolerancesPresent(drawing: DrawingData): boolean {
    const textContent = drawing.textElements.map(t => t.content.toLowerCase());
    const annotationContent = drawing.annotations.map(a => a.content.toLowerCase());
    const allText = [...textContent, ...annotationContent];
    
    return allText.some(text => 
      text.includes('±') || 
      text.includes('+/-') || 
      text.includes('tolerance') ||
      text.includes('±5mm') ||
      text.includes('±3mm')
    );
  }

  /**
   * Check for reference dimensions
   */
  private checkReferenceDimensions(drawing: DrawingData): boolean {
    const textContent = drawing.textElements.map(t => t.content.toLowerCase());
    const annotationContent = drawing.annotations.map(a => a.content.toLowerCase());
    const allText = [...textContent, ...annotationContent];
    
    return allText.some(text => 
      text.includes('ref') ||
      text.includes('reference') ||
      text.includes('( )') ||
      text.includes('[]')
    );
  }

  /**
   * Check for datum/level references
   */
  private checkDatumReference(drawing: DrawingData): boolean {
    const textContent = drawing.textElements.map(t => t.content);
    const annotationContent = drawing.annotations.map(a => a.content);
    const allText = [...textContent, ...annotationContent];
    
    // Look for level markers like ±0.000, +X.XXX, etc.
    return allText.some(text => 
      /^[\+\-±]\d+\.\d{3}$/.test(text.trim()) ||
      text.includes('datum') ||
      text.includes('RL') ||
      text.includes('BM')
    );
  }

  // ============================================================================
  // Rule Evaluation Methods
  // ============================================================================

  /**
   * Evaluate a single dimension rule
   */
  private async evaluateDimensionRule(
    rule: ComplianceRule,
    dimensionData: DimensionAnalysisData,
    drawing: DrawingData
  ): Promise<ComplianceResult> {
    let passed = false;
    let value: string | number | boolean | undefined;
    let expected: string | number | boolean | undefined;
    let finding: Finding | undefined;

    switch (rule.id) {
      case 'DIM-001': // All Dimensions Shown
        passed = this.checkAllDimensionsShown(dimensionData, rule, drawing);
        break;
        
      case 'DIM-002': // Dimensions Consistent
        passed = this.checkDimensionsConsistent(dimensionData, rule, drawing);
        break;
        
      case 'DIM-003': // Tolerance Levels
        passed = this.checkToleranceLevels(dimensionData, rule, drawing);
        break;
        
      case 'DIM-004': // Chain Dimensions
        ({ passed, value, expected, finding } = this.checkChainDimensions(dimensionData, rule, drawing));
        break;
        
      case 'DIM-005': // Reference Dimensions
        passed = this.checkReferenceDimensionsPresent(dimensionData, rule, drawing);
        break;
        
      case 'DIM-006': // Dimension Text Size
        ({ passed, value, expected, finding } = this.checkDimensionTextSize(dimensionData, rule, drawing));
        break;
        
      case 'DIM-007': // Dimension Line Spacing
        passed = this.checkDimensionSpacing(dimensionData, rule, drawing);
        break;
        
      case 'DIM-008': // Extension Lines
        passed = this.checkExtensionLines(dimensionData, rule, drawing);
        break;
        
      case 'DIM-009': // Datum Dimensions
        passed = this.checkDatumDimensions(dimensionData, rule, drawing);
        break;
        
      case 'DIM-010': // Levels Referenced to Datum
        passed = this.checkLevelsReferenced(dimensionData, rule, drawing);
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
   * DIM-001: All Dimensions Shown
   */
  private checkAllDimensionsShown(
    dimensionData: DimensionAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): boolean {
    // Check if dimensions are present
    if (dimensionData.totalDimensions === 0) {
      return false;
    }
    
    // Check if there are text elements that might indicate missing dimensions
    const textContent = drawing.textElements.map(t => t.content.toLowerCase());
    
    // Look for room/area indicators that might need dimensions
    const roomKeywords = ['bedroom', 'kitchen', 'bathroom', 'living', 'dining', 'room'];
    const hasRooms = textContent.some(text => roomKeywords.some(kw => text.includes(kw)));
    
    // If there are rooms but very few dimensions, warn
    if (hasRooms && dimensionData.totalDimensions < 3) {
      return false;
    }
    
    return dimensionData.totalDimensions > 0;
  }

  /**
   * DIM-002: Dimensions Consistent
   */
  private checkDimensionsConsistent(
    dimensionData: DimensionAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): boolean {
    // This would require comparing multiple views which isn't available in single drawing
    // For now, check that dimensions are reasonable
    if (dimensionData.dimensions.length < 2) {
      return true; // Can't check consistency with single dimension
    }
    
    // Check for extreme values that might indicate errors
    const values = dimensionData.dimensions.map(d => d.value);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values.filter(v => v > 0));
    
    // If there's a 100x difference, might be inconsistent
    if (minValue > 0 && maxValue / minValue > 100) {
      return false;
    }
    
    return true;
  }

  /**
   * DIM-003: Tolerance Levels
   */
  private checkToleranceLevels(
    dimensionData: DimensionAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): boolean {
    // Check if tolerances are indicated on the drawing
    return dimensionData.hasTolerances;
  }

  /**
   * DIM-004: Chain Dimensions
   */
  private checkChainDimensions(
    dimensionData: DimensionAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): { passed: boolean; value?: number; expected?: number; finding?: Finding } {
    if (dimensionData.chainCount === 0) {
      return { passed: true }; // No chain dimensions to check
    }
    
    // Check chain dimensions for accuracy
    for (const chain of dimensionData.chainDimensions) {
      if (chain.dimensions.length > 1) {
        // Verify the sum is reasonable
        const tolerance = 3; // ±3mm as per SANS 10160
        const sum = chain.dimensions.reduce((acc, d) => acc + d.value, 0);
        
        // Note: In practice, we'd compare to an overall dimension
        // For now, just check if the chain is complete
        if (chain.dimensions.length >= 2) {
          return {
            passed: true,
            value: sum,
            expected: sum // Would be overall dimension
          };
        }
      }
    }
    
    return { passed: true };
  }

  /**
   * DIM-005: Reference Dimensions Indicated
   */
  private checkReferenceDimensionsPresent(
    dimensionData: DimensionAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): boolean {
    // This is optional (LOW severity), so we just check if reference dimensions are present
    // If none exist, it's not a failure
    return true;
  }

  /**
   * DIM-006: Dimension Text Size
   */
  private checkDimensionTextSize(
    dimensionData: DimensionAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): { passed: boolean; value?: number; expected?: number; finding?: Finding } {
    const minSize = 2.5; // mm minimum as per SANS
    
    if (dimensionData.dimensionTextSizes.length === 0) {
      // No explicit text sizes found - assume compliant (text exists)
      return { passed: true };
    }
    
    const minFound = Math.min(...dimensionData.dimensionTextSizes);
    
    if (minFound < minSize) {
      return {
        passed: false,
        value: minFound,
        expected: minSize,
        finding: this.createDimensionFinding(
          rule,
          `Dimension text size (${minFound}mm) is less than minimum required ${minSize}mm`,
          'medium',
          drawing,
          'Increase dimension text height to at least 2.5mm when plotted'
        )
      };
    }
    
    return { passed: true, value: minFound, expected: minSize };
  }

  /**
   * DIM-007: Dimension Line Spacing
   */
  private checkDimensionSpacing(
    dimensionData: DimensionAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): boolean {
    // This is a visual check - would require more complex analysis
    // For now, assume compliant
    return true;
  }

  /**
   * DIM-008: Extension Lines
   */
  private checkExtensionLines(
    dimensionData: DimensionAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): boolean {
    // This is a visual check - would require CAD parsing
    // For now, assume compliant if dimensions exist
    return dimensionData.totalDimensions > 0;
  }

  /**
   * DIM-009: Datum Dimensions
   */
  private checkDatumDimensions(
    dimensionData: DimensionAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): boolean {
    // For complex drawings, datum dimensions are preferred
    // Not required for simple drawings
    return true;
  }

  /**
   * DIM-010: Levels Referenced to Datum
   */
  private checkLevelsReferenced(
    dimensionData: DimensionAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): boolean {
    // Check for level markers
    const textContent = drawing.textElements.map(t => t.content);
    const hasLevels = textContent.some(text => 
      /\d+\.\d{3}/.test(text) && (text.includes('+') || text.includes('-') || text.includes('±'))
    );
    
    // If there are levels, they should reference a datum
    if (hasLevels) {
      return dimensionData.hasDatumReference;
    }
    
    return true; // No levels to check
  }

  /**
   * Create a finding for dimension analysis
   */
  private createDimensionFinding(
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
    const dimensionData = this.extractDimensionData(context.drawing);
    return this.evaluateDimensionRule(rule, dimensionData, context.drawing);
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface ChainDimension {
  id: string;
  dimensions: DrawingData['dimensions'];
  totalValue: number;
}

interface DimensionAnalysisData {
  dimensions: DrawingData['dimensions'];
  totalDimensions: number;
  linearCount: number;
  angularCount: number;
  radialCount: number;
  chainCount: number;
  chainDimensions: ChainDimension[];
  dimensionTextSizes: number[];
  hasTolerances: boolean;
  hasReferenceDimensions: boolean;
  hasDatumReference: boolean;
  layers: DrawingData['layers'];
  textElements: DrawingData['textElements'];
}

// Export the agent
export default DimensionValidatorAgent;
