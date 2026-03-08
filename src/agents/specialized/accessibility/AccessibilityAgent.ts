/**
 * Accessibility Agent
 * 
 * Validates accessibility compliance against NBR Part S (SANS 10400-S):
 * - Wheelchair access ramps
 * - Door widths (900mm min)
 * - Grab rails in bathrooms
 * - Tactile indicators
 * - Accessible parking
 * - Lift access
 * - Ramp gradients (1:12 max)
 * - Handrail specifications
 * - WC cubicle dimensions
 * - Visual indicators
 */

import { Agent } from '../../base/Agent';
import {
  AgentConfig,
  AgentResult,
  AgentContext,
  ComplianceRule,
  ComplianceResult,
  DrawingData,
  ProjectInfo,
  Finding,
  Severity,
  DrawingType
} from '@/types/agent';

export class AccessibilityAgent extends Agent {
  private accessibilityRules: ComplianceRule[];

  constructor(config: AgentConfig) {
    super(config);
    this.accessibilityRules = this.initializeAccessibilityRules();
  }

  /**
   * Get rule IDs for this agent
   */
  getRuleIds(): string[] {
    return [
      'ACC-001', 'ACC-002', 'ACC-003', 'ACC-004', 'ACC-005',
      'ACC-006', 'ACC-007', 'ACC-008', 'ACC-009', 'ACC-010'
    ];
  }

  /**
   * Initialize accessibility compliance rules (NBR Part S)
   */
  private initializeAccessibilityRules(): ComplianceRule[] {
    return [
      {
        id: 'ACC-001',
        name: 'Wheelchair Access Ramps',
        description: 'Ramps must be provided for wheelchair access where steps exist',
        standard: 'NBR Part S',
        category: 'accessibility',
        severity: Severity.CRITICAL,
        checkType: 'presence',
        requirement: 'Ramps must be provided for wheelchair access at all level changes',
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'ACC-002',
        name: 'Door Widths',
        description: 'Accessible doors must have minimum clear width of 900mm',
        standard: 'NBR Part S',
        category: 'accessibility',
        severity: Severity.HIGH,
        checkType: 'dimension',
        requirement: 'Accessible doors must have minimum clear width of 900mm',
        thresholds: { min: 900, unit: 'mm' },
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'ACC-003',
        name: 'Grab Rails in Bathrooms',
        description: 'Grab rails must be provided in accessible bathrooms',
        standard: 'NBR Part S',
        category: 'accessibility',
        severity: Severity.HIGH,
        checkType: 'presence',
        requirement: 'Grab rails must be provided in accessible toilets and showers',
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'ACC-004',
        name: 'Tactile Indicators',
        description: 'Tactile indicators must be provided at hazard locations',
        standard: 'NBR Part S',
        category: 'accessibility',
        severity: Severity.MEDIUM,
        checkType: 'presence',
        requirement: 'Tactile indicators must be provided at stair nosings and hazard locations',
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'ACC-005',
        name: 'Accessible Parking',
        description: 'Accessible parking bays must be provided',
        standard: 'NBR Part S',
        category: 'accessibility',
        severity: Severity.HIGH,
        checkType: 'calculation',
        requirement: 'Accessible parking bays must be provided (1 per 50, minimum 1)',
        thresholds: { min: 1, unit: 'bays' },
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'ACC-006',
        name: 'Lift Access',
        description: 'Lift access must be provided for multi-story buildings',
        standard: 'NBR Part S',
        category: 'accessibility',
        severity: Severity.HIGH,
        checkType: 'presence',
        requirement: 'Accessible lift must be provided in buildings with more than one floor',
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'ACC-007',
        name: 'Ramp Gradients',
        description: 'Ramp gradients must not exceed 1:12',
        standard: 'NBR Part S',
        category: 'accessibility',
        severity: Severity.CRITICAL,
        checkType: 'calculation',
        requirement: 'Ramp gradients must not exceed 1:12 (8.33%)',
        thresholds: { max: 8.33, unit: '%' },
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'ACC-008',
        name: 'Handrail Specifications',
        description: 'Handrails must meet specified requirements',
        standard: 'NBR Part S',
        category: 'accessibility',
        severity: Severity.HIGH,
        checkType: 'presence',
        requirement: 'Handrails must be provided on both sides of ramps and stairs at 900mm height',
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'ACC-009',
        name: 'WC Cubicle Dimensions',
        description: 'Accessible WC cubicles must meet minimum dimensions',
        standard: 'NBR Part S',
        category: 'accessibility',
        severity: Severity.HIGH,
        checkType: 'dimension',
        requirement: 'Accessible WC cubicles must have minimum dimensions of 1500mm x 1500mm',
        thresholds: { min: 1500, unit: 'mm' },
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'ACC-010',
        name: 'Visual Indicators',
        description: 'Visual indicators must be provided for hearing impaired',
        standard: 'NBR Part S',
        category: 'accessibility',
        severity: Severity.MEDIUM,
        checkType: 'presence',
        requirement: 'Visual alarms and indicators must be provided in public areas',
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      }
    ];
  }

  /**
   * Analyze drawings for accessibility compliance
   */
  async analyze(drawing: DrawingData, projectInfo: ProjectInfo): Promise<AgentResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];
    const passedRules: string[] = [];
    const failedRules: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // Accessibility is relevant to floor plans, sections, and site plans
      const relevantTypes = [
        DrawingType.FLOOR_PLAN,
        DrawingType.SECTION,
        DrawingType.SITE_PLAN
      ];

      if (!relevantTypes.includes(drawing.type)) {
        warnings.push('Accessibility requirements are best verified on floor plans');
      }

      // Analyze text content
      const textContent = drawing.textElements.map(t => t.content.toLowerCase()).join(' ');
      const annotations = drawing.annotations.map(a => a.content.toLowerCase()).join(' ');

      // Check ramp requirements
      findings.push(...this.checkWheelchairRamps(textContent, annotations, drawing));
      findings.push(...this.checkRampGradients(textContent, annotations, drawing));
      findings.push(...this.checkHandrails(textContent, annotations, drawing));

      // Check door widths
      findings.push(...this.checkDoorWidths(textContent, annotations, drawing));

      // Check bathroom accessibility
      findings.push(...this.checkGrabRails(textContent, annotations, drawing));
      findings.push(...this.checkWCCubicles(textContent, annotations, drawing));

      // Check parking
      findings.push(...this.checkAccessibleParking(textContent, annotations, drawing));

      // Check lift
      findings.push(...this.checkLiftAccess(textContent, annotations, projectInfo));

      // Check tactile and visual indicators
      findings.push(...this.checkTactileIndicators(textContent, annotations, drawing));
      findings.push(...this.checkVisualIndicators(textContent, annotations, drawing));

      // Categorize findings
      for (const finding of findings) {
        if (finding.isResolved) {
          passedRules.push(finding.ruleId);
        } else {
          failedRules.push(finding.ruleId);
        }
      }

      // Calculate compliance score
      const totalRules = this.getRuleIds().length;
      const passed = findings.filter(f => f.isResolved).length;
      const complianceScore = Math.round((passed / totalRules) * 100);

      return {
        agentId: this.id,
        agentName: this.name,
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
        errors
      };
    } catch (error) {
      return {
        agentId: this.id,
        agentName: this.name,
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
        errors: [...errors, error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Evaluate a single rule
   */
  protected async evaluateRule(
    rule: ComplianceRule,
    context: AgentContext
  ): Promise<ComplianceResult> {
    const textContent = context.drawing.textElements
      .map(t => t.content.toLowerCase())
      .join(' ');

    const annotations = context.drawing.annotations
      .map(a => a.content.toLowerCase())
      .join(' ');

    const combinedText = textContent + ' ' + annotations;

    let passed = false;
    let value: string | number | undefined;

    switch (rule.id) {
      case 'ACC-001':
        passed = this.checkRampsExist(combinedText);
        break;
      case 'ACC-002':
        passed = this.checkDoorWidth(combinedText);
        value = this.extractDoorWidth(combinedText);
        break;
      case 'ACC-003':
        passed = this.checkGrabRailsExist(combinedText);
        break;
      case 'ACC-004':
        passed = this.checkTactileExist(combinedText);
        break;
      case 'ACC-005':
        passed = this.checkAccessibleParkingExist(combinedText);
        break;
      case 'ACC-006':
        passed = this.checkLiftExist(combinedText, context.projectInfo);
        break;
      case 'ACC-007':
        passed = this.checkRampGradient(combinedText);
        value = this.extractRampGradient(combinedText);
        break;
      case 'ACC-008':
        passed = this.checkHandrailExist(combinedText);
        break;
      case 'ACC-009':
        passed = this.checkWCDimensions(combinedText);
        value = this.extractWCDimension(combinedText);
        break;
      case 'ACC-010':
        passed = this.checkVisualExist(combinedText);
        break;
      default:
        passed = false;
    }

    return {
      rule,
      passed,
      value,
      finding: passed ? undefined : this.createFinding(rule, context),
      timestamp: new Date()
    };
  }

  // ==========================================================================
  // Rule Check Methods
  // ==========================================================================

  private checkWheelchairRamps(text: string, annotations: string, _drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.accessibilityRules.find(r => r.id === 'ACC-001')!;

    const hasRamp = /ramp|access.*ramp|wheelchair.*ramp/i.test(text + annotations);

    if (!hasRamp) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Wheelchair accessible ramps must be provided at all level changes'
      }));
    }

    return findings;
  }

  private checkRampGradients(text: string, _annotations: string, _drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.accessibilityRules.find(r => r.id === 'ACC-007')!;

    const gradientMatch = text.match(/gradient\s*[:=]?\s*1\s*:\s*(\d+)|(\d+)\s*%/i);
    
    if (/ramp/i.test(text)) {
      if (!gradientMatch) {
        findings.push(this.createFinding(rule, {} as AgentContext, {
          suggestion: 'Ramp gradient must be indicated and must not exceed 1:12 (8.33%)'
        }));
      } else {
        const _ratio = gradientMatch[1] ? parseInt(gradientMatch[1]) : parseFloat(gradientMatch[2]) / 100 * 12;
        if (gradientMatch[1] && parseInt(gradientMatch[1]) < 12) {
          findings.push(this.createFinding(rule, {} as AgentContext, {
            suggestion: `Ramp gradient 1:${gradientMatch[1]} exceeds maximum allowed (1:12)`
          }));
        }
      }
    }

    return findings;
  }

  private checkHandrails(text: string, annotations: string, _drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.accessibilityRules.find(r => r.id === 'ACC-008')!;

    const hasHandrail = /handrail|hand.*rail|rail.*both/i.test(text + annotations);

    if (/ramp|stair|steps/i.test(text) && !hasHandrail) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Handrails must be provided on both sides of ramps and stairs'
      }));
    }

    return findings;
  }

  private checkDoorWidths(text: string, _annotations: string, _drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.accessibilityRules.find(r => r.id === 'ACC-002')!;

    const doorWidthMatch = text.match(/door.*(\d+)\s*mm|width.*(\d+)\s*mm|(\d+)\s*mm.*door/i);
    
    if (/door|access/i.test(text)) {
      if (!doorWidthMatch) {
        findings.push(this.createFinding(rule, {} as AgentContext, {
          suggestion: 'Accessible door widths must be indicated (minimum 900mm clear width)'
        }));
      }
    }

    return findings;
  }

  private checkGrabRails(text: string, annotations: string, _drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.accessibilityRules.find(r => r.id === 'ACC-003')!;

    const hasGrabRail = /grab.*rail|support.*rail|handle/i.test(text + annotations);

    if (/bathroom|toilet|shower|wc/i.test(text) && !hasGrabRail) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Grab rails must be provided in accessible bathrooms and toilets'
      }));
    }

    return findings;
  }

  private checkWCCubicles(text: string, _annotations: string, _drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.accessibilityRules.find(r => r.id === 'ACC-009')!;

    const wcMatch = text.match(/wc.*(\d+)\s*mm|toilet.*(\d+)\s*mm/i);
    
    if (/accessible.*wc|disabled.*wc|wheelchair.*toilet/i.test(text)) {
      if (!wcMatch) {
        findings.push(this.createFinding(rule, {} as AgentContext, {
          suggestion: 'Accessible WC cubicle dimensions must be indicated (minimum 1500mm x 1500mm)'
        }));
      }
    }

    return findings;
  }

  private checkAccessibleParking(text: string, annotations: string, _drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.accessibilityRules.find(r => r.id === 'ACC-005')!;

    const hasParking = /accessible.*parking|disabled.*parking|wheelchair.*parking/i.test(text + annotations);

    if (!hasParking) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Accessible parking bays must be provided (1 per 50, minimum 1)'
      }));
    }

    return findings;
  }

  private checkLiftAccess(text: string, annotations: string, projectInfo: ProjectInfo): Finding[] {
    const findings: Finding[] = [];
    const rule = this.accessibilityRules.find(r => r.id === 'ACC-006')!;

    const hasLift = /lift|elevator/i.test(text + annotations);

    // Check if building has multiple floors
    if (projectInfo.floors > 1 && !hasLift) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Accessible lift must be provided in buildings with more than one floor'
      }));
    }

    return findings;
  }

  private checkTactileIndicators(text: string, annotations: string, _drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.accessibilityRules.find(r => r.id === 'ACC-004')!;

    const hasTactile = /tactile|warning.*strip|hazard.*indicator/i.test(text + annotations);

    if (/stair|step|platform|level.*change/i.test(text) && !hasTactile) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Tactile indicators should be provided at hazard locations'
      }));
    }

    return findings;
  }

  private checkVisualIndicators(text: string, annotations: string, _drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.accessibilityRules.find(r => r.id === 'ACC-010')!;

    const hasVisual = /visual.*alarm|indicator.*light|strobe/i.test(text + annotations);

    if (/public.*area|hallway|corridor|assembly/i.test(text) && !hasVisual) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Visual indicators should be provided in public areas for hearing impaired'
      }));
    }

    return findings;
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private checkRampsExist(text: string): boolean {
    return /ramp|access.*ramp/i.test(text);
  }

  private checkDoorWidth(text: string): boolean {
    const width = this.extractDoorWidth(text);
    if (!width) return true; // Not mentioned is not a failure
    return width >= 900;
  }

  private extractDoorWidth(text: string): number | undefined {
    const match = text.match(/door.*(\d+)\s*mm|width.*(\d+)\s*mm|(\d+)\s*mm.*door/i);
    if (!match) return undefined;
    return parseInt(match[1] || match[2] || match[3]);
  }

  private checkGrabRailsExist(text: string): boolean {
    return /grab.*rail|support.*rail/i.test(text);
  }

  private checkTactileExist(text: string): boolean {
    return /tactile|warning.*strip/i.test(text);
  }

  private checkAccessibleParkingExist(text: string): boolean {
    return /accessible.*parking|disabled.*parking/i.test(text);
  }

  private checkLiftExist(text: string, projectInfo: ProjectInfo): boolean {
    if (projectInfo.floors <= 1) return true; // No lift needed for single story
    return /lift|elevator/i.test(text);
  }

  private checkRampGradient(text: string): boolean {
    const gradient = this.extractRampGradient(text);
    if (!gradient) return true;
    return gradient <= 8.33; // 1:12 = 8.33%
  }

  private extractRampGradient(text: string): number | undefined {
    const match = text.match(/gradient\s*[:=]?\s*1\s*:\s*(\d+)/i);
    if (match) {
      return (1 / parseInt(match[1])) * 100;
    }
    const percentMatch = text.match(/(\d+\.?\d*)\s*%/i);
    if (percentMatch) {
      return parseFloat(percentMatch[1]);
    }
    return undefined;
  }

  private checkHandrailExist(text: string): boolean {
    return /handrail|hand.*rail/i.test(text);
  }

  private checkWCDimensions(text: string): boolean {
    const dim = this.extractWCDimension(text);
    if (!dim) return true;
    return dim >= 1500;
  }

  private extractWCDimension(text: string): number | undefined {
    const match = text.match(/wc.*(\d+)\s*mm|toilet.*(\d+)\s*mm/i);
    if (!match) return undefined;
    return parseInt(match[1] || match[2]);
  }

  private checkVisualExist(text: string): boolean {
    return /visual.*alarm|indicator.*light/i.test(text);
  }
}

export default AccessibilityAgent;
