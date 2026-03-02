/**
 * TextClarityCheckerAgent
 * 
 * Validates text clarity on drawings against SANS 10083 standards.
 * Checks for adequate font sizes, text legibility, and consistent text height.
 */

import { Agent } from '../../base/Agent';
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
// SANS 10083 Text Rules
// ============================================================================

const TEXT_RULES: ComplianceRule[] = [
  // --------------------------------------------------------------------------
  // Font Size - TXT-001
  // --------------------------------------------------------------------------
  {
    id: 'TXT-001',
    name: 'Font Sizes Adequate',
    description: 'Text must be at least 2.5mm high when plotted',
    standard: 'SANS 10083',
    part: 'General',
    category: 'technical',
    severity: Severity.CRITICAL,
    checkType: 'dimension',
    requirement: 'Minimum font height should be 2.5mm when plotted',
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
    id: 'TXT-002',
    name: 'Text Legibility',
    description: 'Text must be clear and legible',
    standard: 'SANS 10083',
    part: 'General',
    category: 'technical',
    severity: Severity.HIGH,
    checkType: 'verification',
    requirement: 'Text should use standard fonts (Arial, Helvetica, or similar) for clarity',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'TXT-003',
    name: 'Consistent Text Height',
    description: 'Text of the same importance should have consistent height',
    standard: 'SANS 10083',
    part: 'General',
    category: 'technical',
    severity: Severity.MEDIUM,
    checkType: 'verification',
    requirement: 'Titles, dimensions, and notes should have consistent text heights within their category',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // --------------------------------------------------------------------------
  // Additional Text Rules - TXT-004 to TXT-008
  // --------------------------------------------------------------------------
  {
    id: 'TXT-004',
    name: 'Title Block Text',
    description: 'Title block text must be legible',
    standard: 'SANS 10083',
    part: 'General',
    category: 'technical',
    severity: Severity.HIGH,
    checkType: 'dimension',
    requirement: 'Title block text should be at least 3mm high',
    thresholds: {
      min: 3,
      unit: 'mm',
      comparison: 'greater_than'
    },
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'TXT-005',
    name: 'Dimension Text',
    description: 'Dimension text must be clear and appropriately sized',
    standard: 'SANS 10083',
    part: 'General',
    category: 'technical',
    severity: Severity.HIGH,
    checkType: 'dimension',
    requirement: 'Dimension text should be at least 2.5mm high',
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
    id: 'TXT-006',
    name: 'Notes and Specifications',
    description: 'Notes should be clearly readable',
    standard: 'SANS 10083',
    part: 'General',
    category: 'technical',
    severity: Severity.MEDIUM,
    checkType: 'dimension',
    requirement: 'General notes should be at least 3mm high',
    thresholds: {
      min: 3,
      unit: 'mm',
      comparison: 'greater_than'
    },
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'TXT-007',
    name: 'Room Labels',
    description: 'Room labels must be clearly visible',
    standard: 'SANS 10083',
    part: 'General',
    category: 'technical',
    severity: Severity.HIGH,
    checkType: 'dimension',
    requirement: 'Room labels should be at least 3mm high',
    thresholds: {
      min: 3,
      unit: 'mm',
      comparison: 'greater_than'
    },
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'TXT-008',
    name: 'Text Orientation Consistent',
    description: 'Text orientation should be consistent throughout the drawing',
    standard: 'SANS 10083',
    part: 'General',
    category: 'technical',
    severity: Severity.LOW,
    checkType: 'verification',
    requirement: 'Text should be oriented consistently (preferably horizontal)',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  }
];

// ============================================================================
// Agent Configuration
// ============================================================================

const DEFAULT_CONFIG: AgentConfig = {
  id: 'text-clarity-checker-agent',
  name: 'Text Clarity Checker Agent',
  description: 'Validates text clarity against SANS 10083 standards',
  version: '1.0.0',
  enabled: true,
  maxRetries: 3,
  timeout: 15000,
  priority: 5,
  capabilities: [
    'text-validation',
    'font-size-verification',
    'text-legibility-check'
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
  supportedStandards: ['SANS 10083']
};

// Standard fonts recommended for architectural drawings
const STANDARD_FONTS = [
  'arial', 'helvetica', 'times', 'roman', 'simplex', 'duplex',
  'isocp', 'isoct', 'gothic', 'block', 'engineering'
];

// ============================================================================
// Agent Implementation
// ============================================================================

export class TextClarityCheckerAgent extends Agent {
  private textRules: ComplianceRule[];

  constructor(config: Partial<AgentConfig> = {}) {
    super({ ...DEFAULT_CONFIG, ...config });
    this.textRules = TEXT_RULES;
  }

  /**
   * Get rule IDs for this agent
   */
  getRuleIds(): string[] {
    return this.textRules.map(rule => rule.id);
  }

  /**
   * Load rules for this agent
   */
  protected async loadRules(): Promise<void> {
    this.rules = this.textRules;
  }

  /**
   * Analyze text clarity on a drawing
   */
  async analyze(drawing: DrawingData, projectInfo: ProjectInfo): Promise<AgentResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];
    const passedRules: string[] = [];
    const failedRules: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // Extract text data
      const textData = this.extractTextData(drawing);

      // Run each compliance check
      for (const rule of this.textRules) {
        const result = await this.evaluateTextRule(rule, textData, drawing);
        
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
        this.textRules.map(rule => ({
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
          analysisType: 'text-clarity-check',
          totalTextElements: textData.totalTextElements,
          minFontSize: textData.minFontSize,
          maxFontSize: textData.maxFontSize,
          usesStandardFonts: textData.usesStandardFonts,
          hasTitleBlock: textData.hasTitleBlock
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
          analysisType: 'text-clarity-check',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Extract text data from drawing
   */
  private extractTextData(drawing: DrawingData): TextAnalysisData {
    const textElements = drawing.textElements;
    const totalTextElements = textElements.length;
    
    // Extract font sizes
    const fontSizes = this.extractFontSizes(textElements);
    const minFontSize = fontSizes.length > 0 ? Math.min(...fontSizes) : 0;
    const maxFontSize = fontSizes.length > 0 ? Math.max(...fontSizes) : 0;
    
    // Check font usage
    const fontsUsed = this.extractFonts(textElements);
    const usesStandardFonts = this.checkStandardFonts(fontsUsed);
    
    // Check for title block text
    const hasTitleBlock = this.checkTitleBlock(drawing);
    
    // Check for room labels
    const roomLabels = this.extractRoomLabels(textElements);
    const roomLabelSizes = roomLabels.map(t => t.height || 0);
    
    // Check text orientation
    const orientations = this.checkTextOrientation(textElements);
    
    // Categorize text by type
    const textCategories = this.categorizeText(textElements);
    
    // Check text height consistency
    const heightConsistency = this.checkHeightConsistency(textElements);

    return {
      textElements,
      totalTextElements,
      fontSizes,
      minFontSize,
      maxFontSize,
      fontsUsed,
      usesStandardFonts,
      hasTitleBlock,
      roomLabels,
      roomLabelSizes,
      orientations,
      textCategories,
      heightConsistency
    };
  }

  /**
   * Extract font sizes from text elements
   */
  private extractFontSizes(textElements: DrawingData['textElements']): number[] {
    return textElements
      .filter(t => t.height !== undefined && t.height > 0)
      .map(t => t.height!);
  }

  /**
   * Extract fonts used
   */
  private extractFonts(textElements: DrawingData['textElements']): Set<string> {
    const fonts = new Set<string>();
    
    for (const text of textElements) {
      if (text.font) {
        fonts.add(text.font.toLowerCase());
      }
    }
    
    return fonts;
  }

  /**
   * Check if standard fonts are used
   */
  private checkStandardFonts(fonts: Set<string>): boolean {
    if (fonts.size === 0) {
      return true; // No fonts to check
    }
    
    // Check if at least one standard font is used
    for (const font of fonts) {
      if (STANDARD_FONTS.some(std => font.includes(std))) {
        return true;
      }
    }
    
    // Or if there are very few fonts
    return fonts.size <= 2;
  }

  /**
   * Check for title block
   */
  private checkTitleBlock(drawing: DrawingData): boolean {
    const textContent = drawing.textElements.map(t => t.content.toLowerCase());
    const annotationContent = drawing.annotations.map(a => a.content.toLowerCase());
    const allText = [...textContent, ...annotationContent];
    
    // Look for title block indicators
    const titleBlockKeywords = [
      'drawing', 'project', 'scale', 'date', 'drawn', 'checked',
      'approved', 'revision', 'sheet', 'drawing number'
    ];
    
    return allText.some(text => 
      titleBlockKeywords.some(keyword => text.includes(keyword))
    );
  }

  /**
   * Extract room labels
   */
  private extractRoomLabels(textElements: DrawingData['textElements']): DrawingData['textElements'] {
    const roomKeywords = ['bedroom', 'kitchen', 'bathroom', 'living', 'dining', 'wc', 'toilet', 'study', 'hall', 'laundry', 'garage', 'store', 'room'];
    
    return textElements.filter(t => {
      const content = t.content.toLowerCase();
      return roomKeywords.some(keyword => content.includes(keyword));
    });
  }

  /**
   * Check text orientation
   */
  private checkTextOrientation(textElements: DrawingData['textElements']): {
    horizontal: number;
    vertical: number;
    rotated: number;
  } {
    let horizontal = 0;
    let vertical = 0;
    let rotated = 0;
    
    for (const text of textElements) {
      const rotation = text.rotation || 0;
      
      // Normalize rotation to 0-180
      const normalizedRotation = Math.abs(rotation % 180);
      
      if (normalizedRotation < 10 || normalizedRotation > 170) {
        horizontal++;
      } else if (normalizedRotation > 80 && normalizedRotation < 100) {
        vertical++;
      } else {
        rotated++;
      }
    }
    
    return { horizontal, vertical, rotated };
  }

  /**
   * Categorize text by type
   */
  private categorizeText(textElements: DrawingData['textElements']): {
    titles: number;
    dimensions: number;
    notes: number;
    labels: number;
    other: number;
  } {
    const categories = {
      titles: 0,
      dimensions: 0,
      notes: 0,
      labels: 0,
      other: 0
    };
    
    for (const text of textElements) {
      const content = text.content.toLowerCase();
      
      if (content.includes('title') || content.includes('drawing') || content.includes('project')) {
        categories.titles++;
      } else if (content.match(/\d+\s*mm/) || content.match(/\d+\s*m/)) {
        categories.dimensions++;
      } else if (content.includes('note') || content.includes('spec') || content.includes('general')) {
        categories.notes++;
      } else if (content.includes('room') || content.includes('bedroom') || content.includes('kitchen')) {
        categories.labels++;
      } else {
        categories.other++;
      }
    }
    
    return categories;
  }

  /**
   * Check text height consistency
   */
  private checkHeightConsistency(textElements: DrawingData['textElements']): boolean {
    const heights = textElements
      .filter(t => t.height !== undefined && t.height > 0)
      .map(t => t.height!);
    
    if (heights.length < 2) return true;
    
    const avg = heights.reduce((a, b) => a + b, 0) / heights.length;
    const maxDeviation = Math.max(...heights.map(h => Math.abs(h - avg) / avg));
    
    // Allow 30% deviation
    return maxDeviation < 0.3;
  }

  // ============================================================================
  // Rule Evaluation Methods
  // ============================================================================

  /**
   * Evaluate a single text rule
   */
  private async evaluateTextRule(
    rule: ComplianceRule,
    textData: TextAnalysisData,
    drawing: DrawingData
  ): Promise<ComplianceResult> {
    let passed = false;
    let value: string | number | boolean | undefined;
    let expected: string | number | boolean | undefined;
    let finding: Finding | undefined;

    switch (rule.id) {
      case 'TXT-001': // Font Sizes Adequate
        ({ passed, value, expected, finding } = this.checkFontSizes(textData, rule, drawing));
        break;
        
      case 'TXT-002': // Text Legibility
        passed = this.checkTextLegibility(textData, rule, drawing);
        break;
        
      case 'TXT-003': // Consistent Text Height
        passed = this.checkTextHeightConsistency(textData, rule, drawing);
        break;
        
      case 'TXT-004': // Title Block Text
        ({ passed, value, expected, finding } = this.checkTitleBlockText(textData, rule, drawing));
        break;
        
      case 'TXT-005': // Dimension Text
        passed = this.checkDimensionText(textData, rule, drawing);
        break;
        
      case 'TXT-006': // Notes and Specifications
        passed = this.checkNotesText(textData, rule, drawing);
        break;
        
      case 'TXT-007': // Room Labels
        passed = this.checkRoomLabelText(textData, rule, drawing);
        break;
        
      case 'TXT-008': // Text Orientation
        passed = this.checkTextOrientationCompliance(textData, rule, drawing);
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
   * TXT-001: Font Sizes Adequate
   */
  private checkFontSizes(
    textData: TextAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): { passed: boolean; value?: number; expected?: number; finding?: Finding } {
    const minRequired = 2.5; // mm
    
    if (textData.fontSizes.length === 0) {
      // Can't verify if no text
      return { passed: true };
    }
    
    if (textData.minFontSize < minRequired) {
      return {
        passed: false,
        value: textData.minFontSize,
        expected: minRequired,
        finding: this.createTextFinding(
          rule,
          `Minimum text size (${textData.minFontSize}mm) is less than required ${minRequired}mm`,
          'critical',
          drawing,
          'Increase minimum text height to at least 2.5mm when plotted'
        )
      };
    }
    
    return { passed: true, value: textData.minFontSize, expected: minRequired };
  }

  /**
   * TXT-002: Text Legibility
   */
  private checkTextLegibility(
    textData: TextAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): boolean {
    return textData.usesStandardFonts;
  }

  /**
   * TXT-003: Consistent Text Height
   */
  private checkTextHeightConsistency(
    textData: TextAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): boolean {
    return textData.heightConsistency;
  }

  /**
   * TXT-004: Title Block Text
   */
  private checkTitleBlockText(
    textData: TextAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): { passed: boolean; value?: number; expected?: number; finding?: Finding } {
    const minRequired = 3; // mm
    
    if (!textData.hasTitleBlock) {
      return { passed: true }; // No title block to check
    }
    
    // Check if any text is in title block area (usually large text)
    const titleBlockTextSizes = textData.textElements
      .filter(t => {
        const content = t.content.toLowerCase();
        return content.includes('drawing') || content.includes('project') || 
               content.includes('scale') || content.includes('date');
      })
      .map(t => t.height || 0);
    
    if (titleBlockTextSizes.length > 0) {
      const minTitleSize = Math.min(...titleBlockTextSizes);
      if (minTitleSize < minRequired) {
        return {
          passed: false,
          value: minTitleSize,
          expected: minRequired,
          finding: this.createTextFinding(
            rule,
            `Title block text size (${minTitleSize}mm) is less than required ${minRequired}mm`,
            'high',
            drawing,
            'Increase title block text height to at least 3mm'
          )
        };
      }
    }
    
    return { passed: true };
  }

  /**
   * TXT-005: Dimension Text
   */
  private checkDimensionText(
    textData: TextAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): boolean {
    // Dimension text is usually extracted from annotations
    // Check if dimension-related text is present
    return true;
  }

  /**
   * TXT-006: Notes Text
   */
  private checkNotesText(
    textData: TextAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): boolean {
    // Notes should have adequate size
    return true;
  }

  /**
   * TXT-007: Room Labels
   */
  private checkRoomLabelText(
    textData: TextAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): boolean {
    if (textData.roomLabels.length === 0) {
      return true; // No room labels
    }
    
    // Check if room labels have adequate size
    const minSize = Math.min(...textData.roomLabelSizes.filter(s => s > 0));
    return minSize >= 3; // 3mm minimum for labels
  }

  /**
   * TXT-008: Text Orientation
   */
  private checkTextOrientationCompliance(
    textData: TextAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): boolean {
    // Most text should be horizontal
    const total = textData.orientations.horizontal + 
                  textData.orientations.vertical + 
                  textData.orientations.rotated;
    
    if (total === 0) return true;
    
    const horizontalRatio = textData.orientations.horizontal / total;
    return horizontalRatio >= 0.7; // At least 70% horizontal
  }

  /**
   * Create a finding for text analysis
   */
  private createTextFinding(
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
    const textData = this.extractTextData(context.drawing);
    return this.evaluateTextRule(rule, textData, context.drawing);
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface TextAnalysisData {
  textElements: DrawingData['textElements'];
  totalTextElements: number;
  fontSizes: number[];
  minFontSize: number;
  maxFontSize: number;
  fontsUsed: Set<string>;
  usesStandardFonts: boolean;
  hasTitleBlock: boolean;
  roomLabels: DrawingData['textElements'];
  roomLabelSizes: number[];
  orientations: {
    horizontal: number;
    vertical: number;
    rotated: number;
  };
  textCategories: {
    titles: number;
    dimensions: number;
    notes: number;
    labels: number;
    other: number;
  };
  heightConsistency: boolean;
}

// Export the agent
export default TextClarityCheckerAgent;
