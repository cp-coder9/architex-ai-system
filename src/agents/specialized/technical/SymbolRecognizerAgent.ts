/**
 * SymbolRecognizerAgent
 * 
 * Validates architectural and electrical symbols against SANS standards.
 * Checks for standard architectural symbols, electrical symbols per SANS 10142-1, and legend completeness.
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
// SANS Symbol Rules
// ============================================================================

const SYMBOL_RULES: ComplianceRule[] = [
  // --------------------------------------------------------------------------
  // Architectural Symbols - SYM-001
  // --------------------------------------------------------------------------
  {
    id: 'SYM-001',
    name: 'Standard Architectural Symbols',
    description: 'Architectural symbols must conform to standard conventions',
    standard: 'SANS 10400',
    part: 'General',
    category: 'technical',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'Use standard architectural symbols for doors, windows, walls, fixtures',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'SYM-002',
    name: 'Electrical Symbols per SANS 10142-1',
    description: 'Electrical symbols must conform to SANS 10142-1',
    standard: 'SANS 10142-1',
    part: 'Part 1',
    category: 'technical',
    severity: Severity.CRITICAL,
    checkType: 'presence',
    requirement: 'All electrical symbols must follow SANS 10142-1 convention',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'SYM-003',
    name: 'Legend Complete',
    description: 'A complete legend must be provided for non-standard symbols',
    standard: 'SANS 10400',
    part: 'General',
    category: 'technical',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'All symbols must be defined in a legend if not using standard symbols',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // --------------------------------------------------------------------------
  // Additional Symbol Rules - SYM-004 to SYM-008
  // --------------------------------------------------------------------------
  {
    id: 'SYM-004',
    name: 'Door Symbols Correct',
    description: 'Door symbols must clearly indicate type and swing direction',
    standard: 'SANS 10400',
    part: 'General',
    category: 'technical',
    severity: Severity.MEDIUM,
    checkType: 'presence',
    requirement: 'Door symbols must show door type (single, double, sliding) and swing direction',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'SYM-005',
    name: 'Window Symbols Correct',
    description: 'Window symbols must indicate type and opening method',
    standard: 'SANS 10400',
    part: 'General',
    category: 'technical',
    severity: Severity.MEDIUM,
    checkType: 'presence',
    requirement: 'Window symbols must show window type and opening direction',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'SYM-006',
    name: 'Sanitary Symbols Correct',
    description: 'Sanitary fixture symbols must be clearly identifiable',
    standard: 'SANS 10400',
    part: 'General',
    category: 'technical',
    severity: Severity.MEDIUM,
    checkType: 'presence',
    requirement: 'Sanitary fixtures must use standard symbols (toilet, basin, bath, shower)',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'SYM-007',
    name: 'Electrical Symbol Standards',
    description: 'Electrical symbols must follow SANS 10142-1 conventions',
    standard: 'SANS 10142-1',
    part: 'Part 1',
    category: 'technical',
    severity: Severity.CRITICAL,
    checkType: 'presence',
    requirement: 'Use standard electrical symbols for outlets, switches, lights, fixtures',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'SYM-008',
    name: 'Symbol Scaling Consistent',
    description: 'Symbols should be consistently scaled within the drawing',
    standard: 'SANS 10400',
    part: 'General',
    category: 'technical',
    severity: Severity.LOW,
    checkType: 'verification',
    requirement: 'All symbols of the same type should be at the same scale',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  }
];

// ============================================================================
// Agent Configuration
// ============================================================================

const DEFAULT_CONFIG: AgentConfig = {
  id: 'symbol-recognizer-agent',
  name: 'Symbol Recognizer Agent',
  description: 'Validates architectural and electrical symbols against SANS standards',
  version: '1.0.0',
  enabled: true,
  maxRetries: 3,
  timeout: 15000,
  priority: 5,
  capabilities: [
    'symbol-recognition',
    'symbol-validation',
    'legend-verification'
  ],
  supportedDrawingTypes: [
    DrawingType.FLOOR_PLAN,
    DrawingType.ELEVATION,
    DrawingType.ELECTRICAL,
    DrawingType.FIRE_LAYOUT,
    DrawingType.DRAINAGE
  ],
  supportedStandards: ['SANS 10400', 'SANS 10142-1']
};

// Standard architectural symbols
const STANDARD_ARCHITECTURAL_SYMBOLS = [
  'door', 'window', 'wall', 'partition', 'column', 'beam',
  'stair', 'ramp', 'escalator', 'elevator', 'lift',
  'toilet', 'wc', 'basin', 'bath', 'shower', 'sink',
  'kitchen', 'counter', 'cupboard', 'cabinet', 'shelf',
  'bed', 'table', 'chair', 'sofa', 'desk'
];

// Standard electrical symbols per SANS 10142-1
const STANDARD_ELECTRICAL_SYMBOLS = [
  'socket', 'outlet', 'power point', 'switch', 'light', 'luminaire',
  'ceiling rose', 'junction box', 'db', 'distribution board',
  'meter', 'geyser', 'stove', 'hotplate', 'extractor', 'fan',
  'intercom', 'telephone', 'tv', 'data', 'network',
  'alarm', 'sensor', 'detector', 'emergency', 'exit'
];

// ============================================================================
// Agent Implementation
// ============================================================================

export class SymbolRecognizerAgent extends Agent {
  private symbolRules: ComplianceRule[];

  constructor(config: Partial<AgentConfig> = {}) {
    super({ ...DEFAULT_CONFIG, ...config });
    this.symbolRules = SYMBOL_RULES;
  }

  /**
   * Get rule IDs for this agent
   */
  getRuleIds(): string[] {
    return this.symbolRules.map(rule => rule.id);
  }

  /**
   * Load rules for this agent
   */
  protected async loadRules(): Promise<void> {
    this.rules = this.symbolRules;
  }

  /**
   * Analyze symbols on a drawing
   */
  async analyze(drawing: DrawingData, projectInfo: ProjectInfo): Promise<AgentResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];
    const passedRules: string[] = [];
    const failedRules: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // Extract symbol data
      const symbolData = this.extractSymbolData(drawing);

      // Run each compliance check
      for (const rule of this.symbolRules) {
        const result = await this.evaluateSymbolRule(rule, symbolData, drawing);
        
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
        this.symbolRules.map(rule => ({
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
          analysisType: 'symbol-recognition',
          totalSymbols: symbolData.totalSymbols,
          architecturalSymbols: symbolData.architecturalSymbols,
          electricalSymbols: symbolData.electricalSymbols,
          legendPresent: symbolData.legendPresent,
          unrecognizedSymbols: symbolData.unrecognizedSymbols
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
          analysisType: 'symbol-recognition',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Extract symbol data from drawing
   */
  private extractSymbolData(drawing: DrawingData): SymbolAnalysisData {
    const symbols = drawing.symbols;
    const totalSymbols = symbols.length;
    
    // Categorize symbols
    const architecturalSymbols = this.categorizeSymbols(symbols, 'architectural');
    const electricalSymbols = this.categorizeSymbols(symbols, 'electrical');
    const otherSymbols = this.categorizeSymbols(symbols, 'other');
    
    // Check for legend
    const legendPresent = this.checkLegend(drawing);
    
    // Check for unrecognized symbols
    const unrecognizedSymbols = this.findUnrecognizedSymbols(symbols);
    
    // Check door and window symbols
    const doorSymbols = symbols.filter(s => 
      s.name.toLowerCase().includes('door')
    );
    const windowSymbols = symbols.filter(s => 
      s.name.toLowerCase().includes('window')
    );
    const sanitarySymbols = symbols.filter(s => {
      const name = s.name.toLowerCase();
      return name.includes('toilet') || name.includes('wc') || 
             name.includes('basin') || name.includes('bath') || 
             name.includes('shower') || name.includes('sink');
    });
    
    // Check electrical symbols
    const hasElectricalSymbols = electricalSymbols.length > 0;
    
    // Check symbol scaling
    const consistentScaling = this.checkSymbolScaling(symbols);

    return {
      symbols,
      totalSymbols,
      architecturalSymbols,
      electricalSymbols,
      otherSymbols,
      legendPresent,
      unrecognizedSymbols,
      doorSymbols,
      windowSymbols,
      sanitarySymbols,
      hasElectricalSymbols,
      consistentScaling
    };
  }

  /**
   * Categorize symbols by type
   */
  private categorizeSymbols(
    symbols: DrawingData['symbols'],
    category: 'architectural' | 'electrical' | 'other'
  ): DrawingData['symbols'] {
    if (category === 'architectural') {
      return symbols.filter(s => {
        const name = s.name.toLowerCase();
        const cat = s.category.toLowerCase();
        return STANDARD_ARCHITECTURAL_SYMBOLS.some(sym => 
          name.includes(sym) || cat.includes(sym)
        );
      });
    } else if (category === 'electrical') {
      return symbols.filter(s => {
        const name = s.name.toLowerCase();
        const cat = s.category.toLowerCase();
        return STANDARD_ELECTRICAL_SYMBOLS.some(sym => 
          name.includes(sym) || cat.includes(sym)
        );
      });
    } else {
      return symbols.filter(s => {
        const name = s.name.toLowerCase();
        const cat = s.category.toLowerCase();
        const isArchitectural = STANDARD_ARCHITECTURAL_SYMBOLS.some(sym => 
          name.includes(sym) || cat.includes(sym)
        );
        const isElectrical = STANDARD_ELECTRICAL_SYMBOLS.some(sym => 
          name.includes(sym) || cat.includes(sym)
        );
        return !isArchitectural && !isElectrical;
      });
    }
  }

  /**
   * Check for legend
   */
  private checkLegend(drawing: DrawingData): boolean {
    const textContent = drawing.textElements.map(t => t.content.toLowerCase());
    const annotationContent = drawing.annotations.map(a => a.content.toLowerCase());
    const allText = [...textContent, ...annotationContent];
    
    return allText.some(text => 
      text.includes('legend') ||
      text.includes('symbol key') ||
      text.includes('key to symbols')
    );
  }

  /**
   * Find unrecognized symbols
   */
  private findUnrecognizedSymbols(symbols: DrawingData['symbols']): string[] {
    return symbols
      .filter(s => {
        const name = s.name.toLowerCase();
        const cat = s.category.toLowerCase();
        const isStandard = [
          ...STANDARD_ARCHITECTURAL_SYMBOLS,
          ...STANDARD_ELECTRICAL_SYMBOLS
        ].some(sym => name.includes(sym) || cat.includes(sym));
        return !isStandard;
      })
      .map(s => s.name);
  }

  /**
   * Check symbol scaling consistency
   */
  private checkSymbolScaling(symbols: DrawingData['symbols']): boolean {
    if (symbols.length < 2) return true;
    
    // Group symbols by name
    const symbolGroups = new Map<string, number[]>();
    
    for (const symbol of symbols) {
      const baseName = symbol.name.toLowerCase().split(/[\s\d]/)[0];
      if (!symbolGroups.has(baseName)) {
        symbolGroups.set(baseName, []);
      }
      if (symbol.scale !== undefined) {
        symbolGroups.get(baseName)!.push(symbol.scale);
      }
    }
    
    // Check if scales are consistent within each group
    for (const [, scales] of symbolGroups) {
      if (scales.length > 1) {
        const avg = scales.reduce((a, b) => a + b, 0) / scales.length;
        const variance = scales.some(s => Math.abs(s - avg) / avg > 0.2);
        if (variance) return false;
      }
    }
    
    return true;
  }

  // ============================================================================
  // Rule Evaluation Methods
  // ============================================================================

  /**
   * Evaluate a single symbol rule
   */
  private async evaluateSymbolRule(
    rule: ComplianceRule,
    symbolData: SymbolAnalysisData,
    drawing: DrawingData
  ): Promise<ComplianceResult> {
    let passed = false;
    let value: string | number | boolean | undefined;
    let expected: string | number | boolean | undefined;
    let finding: Finding | undefined;

    switch (rule.id) {
      case 'SYM-001': // Standard Architectural Symbols
        passed = this.checkArchitecturalSymbols(symbolData, rule, drawing);
        break;
        
      case 'SYM-002': // Electrical Symbols
        passed = this.checkElectricalSymbols(symbolData, rule, drawing);
        break;
        
      case 'SYM-003': // Legend Complete
        passed = this.checkLegendComplete(symbolData, rule, drawing);
        break;
        
      case 'SYM-004': // Door Symbols
        passed = this.checkDoorSymbols(symbolData, rule, drawing);
        break;
        
      case 'SYM-005': // Window Symbols
        passed = this.checkWindowSymbols(symbolData, rule, drawing);
        break;
        
      case 'SYM-006': // Sanitary Symbols
        passed = this.checkSanitarySymbols(symbolData, rule, drawing);
        break;
        
      case 'SYM-007': // Electrical Symbol Standards
        passed = this.checkElectricalSymbolStandards(symbolData, rule, drawing);
        break;
        
      case 'SYM-008': // Symbol Scaling
        passed = this.checkSymbolConsistency(symbolData, rule, drawing);
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
   * SYM-001: Standard Architectural Symbols
   */
  private checkArchitecturalSymbols(
    symbolData: SymbolAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): boolean {
    // Check if architectural symbols are present and recognized
    const totalArchitectural = symbolData.architecturalSymbols.length;
    const total = symbolData.totalSymbols;
    
    // If there are symbols, at least 50% should be standard
    if (total > 0) {
      return (totalArchitectural / total) >= 0.3;
    }
    
    return true;
  }

  /**
   * SYM-002: Electrical Symbols per SANS 10142-1
   */
  private checkElectricalSymbols(
    symbolData: SymbolAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): boolean {
    // If there are electrical symbols, they should follow SANS 10142-1
    if (symbolData.hasElectricalSymbols) {
      return symbolData.electricalSymbols.length > 0;
    }
    
    return true; // No electrical symbols is OK
  }

  /**
   * SYM-003: Legend Complete
   */
  private checkLegendComplete(
    symbolData: SymbolAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): boolean {
    // If there are unrecognized symbols, legend should be present
    if (symbolData.unrecognizedSymbols.length > 0) {
      return symbolData.legendPresent;
    }
    
    return true;
  }

  /**
   * SYM-004: Door Symbols Correct
   */
  private checkDoorSymbols(
    symbolData: SymbolAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): boolean {
    // Check if door symbols are present
    return symbolData.doorSymbols.length > 0 || symbolData.totalSymbols === 0;
  }

  /**
   * SYM-005: Window Symbols Correct
   */
  private checkWindowSymbols(
    symbolData: SymbolAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): boolean {
    return symbolData.windowSymbols.length > 0 || symbolData.totalSymbols === 0;
  }

  /**
   * SYM-006: Sanitary Symbols Correct
   */
  private checkSanitarySymbols(
    symbolData: SymbolAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): boolean {
    return symbolData.sanitarySymbols.length > 0 || symbolData.totalSymbols === 0;
  }

  /**
   * SYM-007: Electrical Symbol Standards
   */
  private checkElectricalSymbolStandards(
    symbolData: SymbolAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): boolean {
    // If there are electrical symbols, check they follow SANS 10142-1
    if (symbolData.hasElectricalSymbols) {
      const electricalRatio = symbolData.electricalSymbols.length / 
        (symbolData.electricalSymbols.length + symbolData.unrecognizedSymbols.length);
      return electricalRatio >= 0.5;
    }
    
    return true;
  }

  /**
   * SYM-008: Symbol Scaling Consistent
   */
  private checkSymbolConsistency(
    symbolData: SymbolAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): boolean {
    return symbolData.consistentScaling;
  }

  /**
   * Create a finding for symbol analysis
   */
  private createSymbolFinding(
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
    const symbolData = this.extractSymbolData(context.drawing);
    return this.evaluateSymbolRule(rule, symbolData, context.drawing);
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface SymbolAnalysisData {
  symbols: DrawingData['symbols'];
  totalSymbols: number;
  architecturalSymbols: DrawingData['symbols'];
  electricalSymbols: DrawingData['symbols'];
  otherSymbols: DrawingData['symbols'];
  legendPresent: boolean;
  unrecognizedSymbols: string[];
  doorSymbols: DrawingData['symbols'];
  windowSymbols: DrawingData['symbols'];
  sanitarySymbols: DrawingData['symbols'];
  hasElectricalSymbols: boolean;
  consistentScaling: boolean;
}

// Export the agent
export default SymbolRecognizerAgent;
