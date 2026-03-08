/**
 * Structural Compliance Agent
 * 
 * Validates structural design compliance against:
 * - SANS 10160: Load Actions
 * - SANS 10137: Concrete 
 * - SANS 10182: Steel
 * - SANS 10221: Timber
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

export class StructuralComplianceAgent extends Agent {
  private structuralRules: ComplianceRule[];

  constructor(config: AgentConfig) {
    super(config);
    this.structuralRules = this.initializeStructuralRules();
  }

  /**
   * Get rule IDs for this agent
   */
  getRuleIds(): string[] {
    return [
      // SANS 10160 - Load Actions
      'STR-001', 'STR-002', 'STR-003',
      // SANS 10137 - Concrete
      'STR-004', 'STR-005', 'STR-006',
      // SANS 10182 - Steel
      'STR-007', 'STR-008',
      // SANS 10221 - Timber
      'STR-009', 'STR-010',
      // General
      'STR-011', 'STR-012'
    ];
  }

  /**
   * Initialize structural compliance rules
   */
  private initializeStructuralRules(): ComplianceRule[] {
    return [
      // SANS 10160 - Load Actions
      {
        id: 'STR-001',
        name: 'Floor Loads Indicated',
        description: 'Floor loads must be clearly indicated on structural drawings',
        standard: 'SANS 10160',
        part: 'Part 1',
        category: 'structural',
        severity: Severity.HIGH,
        checkType: 'presence',
        requirement: 'Floor loads must be specified in kN/m²',
        thresholds: { min: 1.5, unit: 'kN/m²' },
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'STR-002',
        name: 'Roof Loads Specified',
        description: 'Roof loads including dead, live, and environmental loads must be specified',
        standard: 'SANS 10160',
        part: 'Part 1',
        category: 'structural',
        severity: Severity.HIGH,
        checkType: 'presence',
        requirement: 'Roof loads must be specified including dead load, live load, and wind load',
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'STR-003',
        name: 'Wind Load Considered',
        description: 'Wind loads must be calculated and indicated according to SANS 10160-3',
        standard: 'SANS 10160',
        part: 'Part 3',
        category: 'structural',
        severity: Severity.HIGH,
        checkType: 'calculation',
        requirement: 'Wind load calculations must be provided with design wind speed and pressure',
        calculation: 'q = 0.5 * ρ * v² where ρ = 1.25 kg/m³',
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      // SANS 10137 - Concrete
      {
        id: 'STR-004',
        name: 'Concrete Grade Specified',
        description: 'Concrete grade must be specified (minimum C30/37 for structural elements)',
        standard: 'SANS 10137',
        part: 'Part 1',
        category: 'structural',
        severity: Severity.CRITICAL,
        checkType: 'presence',
        requirement: 'Concrete grade must be specified (minimum C30/37)',
        thresholds: { min: 30, unit: 'MPa' },
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'STR-005',
        name: 'Reinforcement Details Complete',
        description: 'Reinforcement details must include bar sizes, spacing, and cover',
        standard: 'SANS 10137',
        part: 'Part 1',
        category: 'structural',
        severity: Severity.CRITICAL,
        checkType: 'presence',
        requirement: 'Reinforcement details must include: bar sizes, spacing, number of bars, and laps',
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'STR-006',
        name: 'Cover to Reinforcement Indicated',
        description: 'Nominal cover to reinforcement must be indicated',
        standard: 'SANS 10137',
        part: 'Part 1',
        category: 'structural',
        severity: Severity.HIGH,
        checkType: 'presence',
        requirement: 'Cover to reinforcement must be indicated (minimum 25mm for exposed conditions)',
        thresholds: { min: 25, unit: 'mm' },
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      // SANS 10182 - Steel
      {
        id: 'STR-007',
        name: 'Steel Grade Specified',
        description: 'Structural steel grade must be specified',
        standard: 'SANS 10182',
        part: 'Part 1',
        category: 'structural',
        severity: Severity.CRITICAL,
        checkType: 'presence',
        requirement: 'Steel grade must be specified (e.g., 300WA, 350WA)',
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'STR-008',
        name: 'Connection Details Complete',
        description: 'All structural connections must have detailed drawings',
        standard: 'SANS 10182',
        part: 'Part 1',
        category: 'structural',
        severity: Severity.HIGH,
        checkType: 'presence',
        requirement: 'Connection details must be provided for all structural connections',
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      // SANS 10221 - Timber
      {
        id: 'STR-009',
        name: 'Timber Species and Grade',
        description: 'Timber species and grade must be specified',
        standard: 'SANS 10221',
        part: 'Part 1',
        category: 'structural',
        severity: Severity.HIGH,
        checkType: 'presence',
        requirement: 'Timber species and grade must be specified (e.g., Pine C24, Balau)',
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'STR-010',
        name: 'Joint Details Shown',
        description: 'Timber joint details must be shown on drawings',
        standard: 'SANS 10221',
        part: 'Part 1',
        category: 'structural',
        severity: Severity.MEDIUM,
        checkType: 'presence',
        requirement: 'Joint details must be shown including nail/screw specifications',
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      // General
      {
        id: 'STR-011',
        name: 'Foundation Design Adequate',
        description: 'Foundation design must be adequate for soil conditions',
        standard: 'SANS 10160',
        part: 'Part 4',
        category: 'structural',
        severity: Severity.CRITICAL,
        checkType: 'verification',
        requirement: 'Foundation design must be based on geotechnical report and include type, dimensions, and bearing capacity',
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'STR-012',
        name: 'Structural Calculations Referenced',
        description: 'Structural calculations must be referenced and available',
        standard: 'SANS 10137',
        part: 'General',
        category: 'structural',
        severity: Severity.HIGH,
        checkType: 'document',
        requirement: 'Structural calculations must be referenced and available for review',
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      }
    ];
  }

  /**
   * Analyze structural drawings
   */
  async analyze(drawing: DrawingData, _projectInfo: ProjectInfo): Promise<AgentResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];
    const passedRules: string[] = [];
    const failedRules: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // Check if drawing type is relevant
      const relevantTypes = [
        DrawingType.SITE_PLAN,
        DrawingType.FLOOR_PLAN,
        DrawingType.SECTION,
        DrawingType.DETAIL
      ];

      if (!relevantTypes.includes(drawing.type)) {
        warnings.push('Drawing type may not contain structural information');
      }

      // Analyze text information
      const textContent = drawing.textElements.map(t => t.content.toLowerCase()).join(' ');

      // Check SANS 10160 rules
      findings.push(...this.checkFloorLoads(textContent, drawing));
      findings.push(...this.checkRoofLoads(textContent, drawing));
      findings.push(...this.checkWindLoads(textContent, drawing));

      // Check SANS 10137 rules
      findings.push(...this.checkConcreteGrade(textContent, drawing));
      findings.push(...this.checkReinforcementDetails(textContent, drawing));
      findings.push(...this.checkCoverToReinforcement(textContent, drawing));

      // Check SANS 10182 rules
      findings.push(...this.checkSteelGrade(textContent, drawing));
      findings.push(...this.checkConnectionDetails(textContent, drawing));

      // Check SANS 10221 rules
      findings.push(...this.checkTimberDetails(textContent, drawing));

      // Check general rules
      findings.push(...this.checkFoundationDesign(textContent, drawing));
      findings.push(...this.checkStructuralCalculations(textContent, drawing));

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

    let passed = false;
    let value: string | undefined;

    switch (rule.id) {
      case 'STR-001':
        passed = this.checkFloorLoadsExist(textContent);
        value = textContent.match(/(\d+\.?\d*)\s*kN\/m2?/i)?.[1];
        break;
      case 'STR-002':
        passed = this.checkRoofLoadsExist(textContent);
        break;
      case 'STR-003':
        passed = this.checkWindLoadsExist(textContent);
        break;
      case 'STR-004':
        passed = this.checkConcreteGradeExist(textContent);
        value = textContent.match(/C(\d+)\/(\d+)/i)?.[0];
        break;
      case 'STR-005':
        passed = this.checkReinforcementExist(textContent);
        break;
      case 'STR-006':
        passed = this.checkCoverExist(textContent);
        value = textContent.match(/cover\s*(\d+)\s*mm/i)?.[1];
        break;
      case 'STR-007':
        passed = this.checkSteelGradeExist(textContent);
        value = textContent.match(/(\d+)\s*MPa|300WA|350WA/i)?.[0];
        break;
      case 'STR-008':
        passed = this.checkConnectionsExist(textContent);
        break;
      case 'STR-009':
        passed = this.checkTimberExist(textContent);
        break;
      case 'STR-010':
        passed = this.checkJointDetailsExist(textContent);
        break;
      case 'STR-011':
        passed = this.checkFoundationExist(textContent);
        break;
      case 'STR-012':
        passed = this.checkCalculationsExist(textContent);
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

  private checkFloorLoads(text: string, _drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.structuralRules.find(r => r.id === 'STR-001')!;
    
    const hasFloorLoad = /floor.*load|floor.*kN|m2.*load/i.test(text);
    const loadValue = text.match(/(\d+\.?\d*)\s*kN\/m2?/i);

    if (!hasFloorLoad) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Floor loads must be indicated in kN/m² on structural drawings'
      }));
    } else if (loadValue && parseFloat(loadValue[1]) < 1.5) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: `Floor load ${loadValue[1]} kN/m² is below minimum recommended (1.5 kN/m²)`
      }));
    }

    return findings;
  }

  private checkRoofLoads(text: string, _drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.structuralRules.find(r => r.id === 'STR-002')!;
    
    const hasRoofLoad = /roof.*load|roof.*kN|dead.*load|live.*load/i.test(text);

    if (!hasRoofLoad) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Roof loads must be specified including dead load, live load, and wind load'
      }));
    }

    return findings;
  }

  private checkWindLoads(text: string, _drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.structuralRules.find(r => r.id === 'STR-003')!;
    
    const hasWindLoad = /wind.*load|wind.*speed|wind.*pressure/i.test(text);

    if (!hasWindLoad) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Wind loads must be calculated and indicated according to SANS 10160-3'
      }));
    }

    return findings;
  }

  private checkConcreteGrade(text: string, _drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.structuralRules.find(r => r.id === 'STR-004')!;
    
    const hasConcreteGrade = /C\d+\/\d+|concrete.*grade|strength.*MPa/i.test(text);
    const gradeMatch = text.match(/C(\d+)\/(\d+)/i);

    if (!hasConcreteGrade) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Concrete grade must be specified (minimum C30/37 for structural elements)'
      }));
    } else if (gradeMatch && parseInt(gradeMatch[1]) < 30) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: `Concrete grade C${gradeMatch[1]}/${gradeMatch[2]} is below minimum recommended (C30/37)`
      }));
    }

    return findings;
  }

  private checkReinforcementDetails(text: string, _drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.structuralRules.find(r => r.id === 'STR-005')!;
    
    const hasReinforcement = /reinforcement|rebar|steel.*bar|Y\d+|Y12|Y16|Y20/i.test(text);
    const _hasBarSizes = /Y\d+|Y12|Y16|Y20|bar.*size/i.test(text);

    if (!hasReinforcement) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Reinforcement details must include bar sizes, spacing, and laps'
      }));
    }

    return findings;
  }

  private checkCoverToReinforcement(text: string, _drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.structuralRules.find(r => r.id === 'STR-006')!;
    
    const hasCover = /cover|mm.*cover/i.test(text);
    const coverMatch = text.match(/cover\s*(\d+)\s*mm/i);

    if (!hasCover) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Cover to reinforcement must be indicated (minimum 25mm for exposed conditions)'
      }));
    } else if (coverMatch && parseInt(coverMatch[1]) < 25) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: `Cover ${coverMatch[1]}mm is below minimum recommended (25mm)`
      }));
    }

    return findings;
  }

  private checkSteelGrade(text: string, _drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.structuralRules.find(r => r.id === 'STR-007')!;
    
    const hasSteelGrade = /steel.*grade|300WA|350WA|250|300|350|structural.*steel/i.test(text);

    if (!hasSteelGrade) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Structural steel grade must be specified (e.g., 300WA, 350WA)'
      }));
    }

    return findings;
  }

  private checkConnectionDetails(text: string, _drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.structuralRules.find(r => r.id === 'STR-008')!;
    
    const hasConnections = /connection|bolt|weld|plate/i.test(text);

    if (!hasConnections) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Connection details must be provided for all structural connections'
      }));
    }

    return findings;
  }

  private checkTimberDetails(text: string, _drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.structuralRules.find(r => r.id === 'STR-009')!;
    
    const hasTimber = /timber|wood|species|grade.*timber|C\d+|Balau|Pine|meranti/i.test(text);

    if (!hasTimber) {
      // Timber rules are informational - only warn if timber elements are present
      if (/timber|wood|rafter|beam.*timber/i.test(text)) {
        findings.push(this.createFinding(rule, {} as AgentContext, {
          suggestion: 'Timber species and grade must be specified'
        }));
      }
    }

    return findings;
  }

  private checkJointDetails(text: string, _drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.structuralRules.find(r => r.id === 'STR-010')!;
    
    const hasJoints = /joint|connection.*timber|nail|screw|bolt.*timber/i.test(text);

    if (/timber|wood/i.test(text) && !hasJoints) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Timber joint details must be shown on drawings'
      }));
    }

    return findings;
  }

  private checkFoundationDesign(text: string, _drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.structuralRules.find(r => r.id === 'STR-011')!;
    
    const hasFoundation = /foundation|footing|strip|raft| pile|base.*concrete/i.test(text);

    if (!hasFoundation) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Foundation design must be included and based on geotechnical report'
      }));
    }

    return findings;
  }

  private checkStructuralCalculations(text: string, _drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.structuralRules.find(r => r.id === 'STR-012')!;
    
    const hasCalcReference = /calculation|analysis|design.*report|structural.*note/i.test(text);

    // This is a document check - might be in title block or separate document
    if (!hasCalcReference) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Structural calculations must be referenced and available for review'
      }));
    }

    return findings;
  }

  // ==========================================================================
  // Helper methods for rule evaluation
  // ==========================================================================

  private checkFloorLoadsExist(text: string): boolean {
    return /floor.*load|floor.*kN|m2.*load|(\d+\.?\d*)\s*kN\/m2?/i.test(text);
  }

  private checkRoofLoadsExist(text: string): boolean {
    return /roof.*load|roof.*kN|dead.*load|live.*load/i.test(text);
  }

  private checkWindLoadsExist(text: string): boolean {
    return /wind.*load|wind.*speed|wind.*pressure/i.test(text);
  }

  private checkConcreteGradeExist(text: string): boolean {
    return /C\d+\/\d+|concrete.*grade|strength.*MPa/i.test(text);
  }

  private checkReinforcementExist(text: string): boolean {
    return /reinforcement|rebar|steel.*bar|Y\d+/i.test(text);
  }

  private checkCoverExist(text: string): boolean {
    return /cover|mm.*cover/i.test(text);
  }

  private checkSteelGradeExist(text: string): boolean {
    return /steel.*grade|300WA|350WA|250|300|350|structural.*steel/i.test(text);
  }

  private checkConnectionsExist(text: string): boolean {
    return /connection|bolt|weld|plate/i.test(text);
  }

  private checkTimberExist(text: string): boolean {
    return /timber|wood|species|grade.*timber|C\d+|Balau|Pine/i.test(text);
  }

  private checkJointDetailsExist(text: string): boolean {
    return /joint|connection.*timber|nail|screw/i.test(text);
  }

  private checkFoundationExist(text: string): boolean {
    return /foundation|footing|strip|raft|pile/i.test(text);
  }

  private checkCalculationsExist(text: string): boolean {
    return /calculation|analysis|design.*report|structural.*note/i.test(text);
  }
}

export default StructuralComplianceAgent;
