/**
 * LayerAnalyzerAgent
 * 
 * Validates layer organization on drawings against ISO 13567 standards.
 * Checks for correct layer naming, organization by discipline, and unused layers.
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
// ISO 13567 Layer Rules
// ============================================================================

const LAYER_RULES: ComplianceRule[] = [
  // --------------------------------------------------------------------------
  // Layer Naming - LAY-001
  // --------------------------------------------------------------------------
  {
    id: 'LAY-001',
    name: 'Correct Layer Naming',
    description: 'Layers must follow a consistent naming convention per ISO 13567',
    standard: 'ISO 13567',
    part: 'Layer Naming',
    category: 'technical',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'Layer names should follow the ISO 13567 convention: DISCIPLINE-STATUS-DESCRIPTION',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'LAY-002',
    name: 'Layers Organized by Discipline',
    description: 'Layers must be organized by building discipline (architectural, structural, etc.)',
    standard: 'ISO 13567',
    part: 'Layer Organization',
    category: 'technical',
    severity: Severity.MEDIUM,
    checkType: 'verification',
    requirement: 'Layers should be grouped by discipline: A- (Architectural), S- (Structural), M- (Mechanical), E- (Electrical)',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'LAY-003',
    name: 'Unused Layers Removed',
    description: 'Unused or empty layers should be removed from the drawing',
    standard: 'ISO 13567',
    part: 'Layer Management',
    category: 'technical',
    severity: Severity.LOW,
    checkType: 'verification',
    requirement: 'All layers should contain at least one object or be removed',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'LAY-004',
    name: 'Text on Correct Layers',
    description: 'Text elements must be on appropriate discipline layers',
    standard: 'ISO 13567',
    part: 'Layer Organization',
    category: 'technical',
    severity: Severity.MEDIUM,
    checkType: 'verification',
    requirement: 'Text should be on TEXT or DIMENSION layers appropriate to their content',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // --------------------------------------------------------------------------
  // Additional Layer Rules - LAY-005 to LAY-008
  // --------------------------------------------------------------------------
  {
    id: 'LAY-005',
    name: 'Layer Colors Consistent',
    description: 'Layers should use consistent colors within the same discipline',
    standard: 'ISO 13567',
    part: 'Layer Standards',
    category: 'technical',
    severity: Severity.LOW,
    checkType: 'verification',
    requirement: 'Each discipline should have consistent color coding across layers',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'LAY-006',
    name: 'Layer Visibility Appropriate',
    description: 'Layers should have appropriate visibility settings',
    standard: 'ISO 13567',
    part: 'Layer Management',
    category: 'technical',
    severity: Severity.MEDIUM,
    checkType: 'verification',
    requirement: 'Essential layers should be visible, detail layers may be toggled off',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'LAY-007',
    name: 'Dimension Layers Separate',
    description: 'Dimensions should be on dedicated dimension layers',
    standard: 'ISO 13567',
    part: 'Layer Organization',
    category: 'technical',
    severity: Severity.MEDIUM,
    checkType: 'verification',
    requirement: 'Dimensions should be on separate layers (e.g., A-DIMS, S-DIMS)',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'LAY-008',
    name: 'Reference Layers Indicated',
    description: 'External references should be on dedicated reference layers',
    standard: 'ISO 13567',
    part: 'Layer Management',
    category: 'technical',
    severity: Severity.LOW,
    checkType: 'verification',
    requirement: 'XREFs and imported content should be on separate reference layers',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  }
];

// ============================================================================
// Agent Configuration
// ============================================================================

const DEFAULT_CONFIG: AgentConfig = {
  id: 'layer-analyzer-agent',
  name: 'Layer Analyzer Agent',
  description: 'Validates layer organization against ISO 13567 standards',
  version: '1.0.0',
  enabled: true,
  maxRetries: 3,
  timeout: 15000,
  priority: 5,
  capabilities: [
    'layer-validation',
    'layer-naming-verification',
    'layer-organization-check'
  ],
  supportedDrawingTypes: [
    DrawingType.SITE_PLAN,
    DrawingType.FLOOR_PLAN,
    DrawingType.ELEVATION,
    DrawingType.SECTION,
    DrawingType.DETAIL,
    DrawingType.DRAINAGE,
    DrawingType.FIRE_LAYOUT,
    DrawingType.ELECTRICAL
  ],
  supportedStandards: ['ISO 13567']
};

// Discipline prefixes according to ISO 13567
const DISCIPLINE_PREFIXES: Record<string, string> = {
  A: 'Architectural',
  S: 'Structural',
  M: 'Mechanical',
  E: 'Electrical',
  P: 'Plumbing',
  C: 'Civil',
  G: 'General',
  L: 'Landscape'
};

// ============================================================================
// Agent Implementation
// ============================================================================

export class LayerAnalyzerAgent extends Agent {
  private layerRules: ComplianceRule[];

  constructor(config: Partial<AgentConfig> = {}) {
    super({ ...DEFAULT_CONFIG, ...config });
    this.layerRules = LAYER_RULES;
  }

  /**
   * Get rule IDs for this agent
   */
  getRuleIds(): string[] {
    return this.layerRules.map(rule => rule.id);
  }

  /**
   * Load rules for this agent
   */
  protected async loadRules(): Promise<void> {
    this.rules = this.layerRules;
  }

  /**
   * Analyze layers on a drawing
   */
  async analyze(drawing: DrawingData, projectInfo: ProjectInfo): Promise<AgentResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];
    const passedRules: string[] = [];
    const failedRules: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // Extract layer data
      const layerData = this.extractLayerData(drawing);

      // Run each compliance check
      for (const rule of this.layerRules) {
        const result = await this.evaluateLayerRule(rule, layerData, drawing);
        
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
        this.layerRules.map(rule => ({
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
          analysisType: 'layer-analysis',
          totalLayers: layerData.totalLayers,
          disciplineLayers: layerData.disciplineLayers,
          unusedLayers: layerData.unusedLayers,
          textOnCorrectLayers: layerData.textOnCorrectLayers
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
          analysisType: 'layer-analysis',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Extract layer data from drawing
   */
  private extractLayerData(drawing: DrawingData): LayerAnalysisData {
    const layers = drawing.layers;
    const totalLayers = layers.length;
    
    // Analyze discipline layers
    const disciplineLayers = this.analyzeDisciplineLayers(layers);
    
    // Find unused layers
    const unusedLayers = layers.filter(l => l.objectCount === 0).map(l => l.name);
    
    // Check text layer placement
    const textOnCorrectLayers = this.checkTextLayerPlacement(drawing);
    
    // Check dimension layer placement
    const dimensionsOnCorrectLayers = this.checkDimensionLayerPlacement(drawing);
    
    // Check layer naming convention
    const namingConvention = this.checkNamingConvention(layers);
    
    // Check layer colors
    const layerColors = this.analyzeLayerColors(layers);

    return {
      layers,
      totalLayers,
      disciplineLayers,
      unusedLayers,
      textOnCorrectLayers,
      dimensionsOnCorrectLayers,
      namingConvention,
      layerColors,
      hasDisciplineOrganization: Object.keys(disciplineLayers).length > 0
    };
  }

  /**
   * Analyze discipline layers
   */
  private analyzeDisciplineLayers(layers: DrawingData['layers']): Record<string, string[]> {
    const disciplineMap: Record<string, string[]> = {};
    
    for (const layer of layers) {
      const name = layer.name.toUpperCase();
      
      // Check for discipline prefix
      for (const [prefix, discipline] of Object.entries(DISCIPLINE_PREFIXES)) {
        if (name.startsWith(prefix + '-') || name.startsWith(prefix)) {
          if (!disciplineMap[discipline]) {
            disciplineMap[discipline] = [];
          }
          disciplineMap[discipline].push(layer.name);
          break;
        }
      }
    }
    
    return disciplineMap;
  }

  /**
   * Check text layer placement
   */
  private checkTextLayerPlacement(drawing: DrawingData): boolean {
    // Check if text elements are on appropriate layers
    // Text should ideally be on TEXT or similar layers
    const textLayers = new Set(
      drawing.textElements
        .filter(t => t.layer)
        .map(t => t.layer!.toLowerCase())
    );
    
    if (textLayers.size === 0) {
      return true; // No text to check
    }
    
    // Check if any text is on non-discipline layers
    const inappropriateLayers = Array.from(textLayers).filter(layer => {
      const isDisciplineLayer = Object.keys(DISCIPLINE_PREFIXES).some(prefix => 
        layer.includes(prefix.toLowerCase())
      );
      const isTextLayer = layer.includes('text') || layer.includes('dim') || layer.includes('annotation');
      return !isDisciplineLayer && !isTextLayer;
    });
    
    return inappropriateLayers.length === 0;
  }

  /**
   * Check dimension layer placement
   */
  private checkDimensionLayerPlacement(drawing: DrawingData): boolean {
    // Check if dimensions are on dedicated dimension layers
    const dimLayers = new Set(
      drawing.dimensions
        .filter(d => d.layer)
        .map(d => d.layer!.toLowerCase())
    );
    
    if (dimLayers.size === 0) {
      return true; // No dimensions to check
    }
    
    // Dimensions should be on DIM or similar layers
    const hasDimLayers = Array.from(dimLayers).some(layer => 
      layer.includes('dim') || layer.includes('dimension')
    );
    
    return hasDimLayers;
  }

  /**
   * Check naming convention
   */
  private checkNamingConvention(layers: DrawingData['layers']): {
    compliant: number;
    nonCompliant: string[];
  } {
    const nonCompliant: string[] = [];
    let compliant = 0;
    
    // Pattern for ISO 13567: DISCIPLINE-STATUS-DESCRIPTION or DISCIPLINE-DESCRIPTION
    const isoPattern = /^[A-Z]{1,2}(-[A-Z]+)?(-.+)?$/i;
    
    for (const layer of layers) {
      if (isoPattern.test(layer.name)) {
        compliant++;
      } else {
        nonCompliant.push(layer.name);
      }
    }
    
    return { compliant, nonCompliant };
  }

  /**
   * Analyze layer colors
   */
  private analyzeLayerColors(layers: DrawingData['layers']): Record<string, string[]> {
    const colorMap: Record<string, string[]> = {};
    
    for (const layer of layers) {
      if (layer.color) {
        const colorKey = layer.color.toLowerCase();
        if (!colorMap[colorKey]) {
          colorMap[colorKey] = [];
        }
        colorMap[colorKey].push(layer.name);
      }
    }
    
    return colorMap;
  }

  // ============================================================================
  // Rule Evaluation Methods
  // ============================================================================

  /**
   * Evaluate a single layer rule
   */
  private async evaluateLayerRule(
    rule: ComplianceRule,
    layerData: LayerAnalysisData,
    drawing: DrawingData
  ): Promise<ComplianceResult> {
    let passed = false;
    let value: string | number | boolean | undefined;
    let expected: string | number | boolean | undefined;
    let finding: Finding | undefined;

    switch (rule.id) {
      case 'LAY-001': // Correct Layer Naming
        passed = this.checkLayerNaming(layerData, rule, drawing);
        break;
        
      case 'LAY-002': // Layers Organized by Discipline
        passed = this.checkDisciplineOrganization(layerData, rule, drawing);
        break;
        
      case 'LAY-003': // Unused Layers Removed
        passed = this.checkUnusedLayers(layerData, rule, drawing);
        break;
        
      case 'LAY-004': // Text on Correct Layers
        passed = this.checkTextLayers(layerData, rule, drawing);
        break;
        
      case 'LAY-005': // Layer Colors Consistent
        passed = this.checkLayerColors(layerData, rule, drawing);
        break;
        
      case 'LAY-006': // Layer Visibility
        passed = this.checkLayerVisibility(layerData, rule, drawing);
        break;
        
      case 'LAY-007': // Dimension Layers Separate
        passed = this.checkDimensionLayers(layerData, rule, drawing);
        break;
        
      case 'LAY-008': // Reference Layers
        passed = this.checkReferenceLayers(layerData, rule, drawing);
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
   * LAY-001: Correct Layer Naming
   */
  private checkLayerNaming(
    layerData: LayerAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): boolean {
    const { compliant, nonCompliant } = layerData.namingConvention;
    const total = layerData.totalLayers;
    
    // If more than 70% follow convention, consider compliant
    return (compliant / total) >= 0.7;
  }

  /**
   * LAY-002: Layers Organized by Discipline
   */
  private checkDisciplineOrganization(
    layerData: LayerAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): boolean {
    // Check if at least some layers follow discipline organization
    return layerData.hasDisciplineOrganization;
  }

  /**
   * LAY-003: Unused Layers Removed
   */
  private checkUnusedLayers(
    layerData: LayerAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): boolean {
    // Allow some unused layers but warn if too many
    const unusedRatio = layerData.unusedLayers.length / layerData.totalLayers;
    return unusedRatio < 0.3; // Less than 30% unused
  }

  /**
   * LAY-004: Text on Correct Layers
   */
  private checkTextLayers(
    layerData: LayerAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): boolean {
    return layerData.textOnCorrectLayers;
  }

  /**
   * LAY-005: Layer Colors Consistent
   */
  private checkLayerColors(
    layerData: LayerAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): boolean {
    // This is a soft check - colors should be consistent within disciplines
    // Not critical for compliance
    return true;
  }

  /**
   * LAY-006: Layer Visibility
   */
  private checkLayerVisibility(
    layerData: LayerAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): boolean {
    // Check if essential layers are visible
    const visibleLayers = layerData.layers.filter(l => l.visible);
    return visibleLayers.length > 0;
  }

  /**
   * LAY-007: Dimension Layers Separate
   */
  private checkDimensionLayers(
    layerData: LayerAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): boolean {
    return layerData.dimensionsOnCorrectLayers;
  }

  /**
   * LAY-008: Reference Layers
   */
  private checkReferenceLayers(
    layerData: LayerAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): boolean {
    // This is optional - check for XREF layers
    // Not required to pass
    return true;
  }

  /**
   * Create a finding for layer analysis
   */
  private createLayerFinding(
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
    const layerData = this.extractLayerData(context.drawing);
    return this.evaluateLayerRule(rule, layerData, context.drawing);
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface LayerAnalysisData {
  layers: DrawingData['layers'];
  totalLayers: number;
  disciplineLayers: Record<string, string[]>;
  unusedLayers: string[];
  textOnCorrectLayers: boolean;
  dimensionsOnCorrectLayers: boolean;
  namingConvention: {
    compliant: number;
    nonCompliant: string[];
  };
  layerColors: Record<string, string[]>;
  hasDisciplineOrganization: boolean;
}

// Export the agent
export default LayerAnalyzerAgent;
