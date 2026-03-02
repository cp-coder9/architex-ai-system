/**
 * Municipal Requirements Agent
 * 
 * Validates local by-law compliance including:
 * - Zoning compliance
 * - Floor area ratio (FAR)
 * - Site coverage
 * - Height restrictions
 * - Parking requirements
 * - Stormwater management
 * - Building lines
 * - Servitudes
 * - Access requirements
 * - Landscaping requirements
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

export class MunicipalRequirementsAgent extends Agent {
  private municipalRules: ComplianceRule[];

  constructor(config: AgentConfig) {
    super(config);
    this.municipalRules = this.initializeMunicipalRules();
  }

  /**
   * Get rule IDs for this agent
   */
  getRuleIds(): string[] {
    return [
      'MUN-001', 'MUN-002', 'MUN-003', 'MUN-004', 'MUN-005',
      'MUN-006', 'MUN-007', 'MUN-008', 'MUN-009', 'MUN-010'
    ];
  }

  /**
   * Initialize municipal requirements rules
   */
  private initializeMunicipalRules(): ComplianceRule[] {
    return [
      {
        id: 'MUN-001',
        name: 'Zoning Compliance',
        description: 'Building must comply with applicable zoning regulations',
        standard: 'Local By-Laws',
        category: 'municipal',
        severity: Severity.CRITICAL,
        checkType: 'verification',
        requirement: 'Building use must be permitted in the applicable zoning zone',
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'MUN-002',
        name: 'Floor Area Ratio (FAR)',
        description: 'Floor area ratio must not exceed municipal limits',
        standard: 'Local By-Laws',
        category: 'municipal',
        severity: Severity.CRITICAL,
        checkType: 'calculation',
        requirement: 'FAR must be calculated and must not exceed the zonal limit (typically 0.5-2.0)',
        thresholds: { max: 2.0, unit: 'ratio' },
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'MUN-003',
        name: 'Site Coverage',
        description: 'Site coverage must not exceed municipal limits',
        standard: 'Local By-Laws',
        category: 'municipal',
        severity: Severity.HIGH,
        checkType: 'calculation',
        requirement: 'Site coverage must not exceed the zonal limit (typically 30-60%)',
        thresholds: { max: 60, unit: '%' },
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'MUN-004',
        name: 'Height Restrictions',
        description: 'Building height must comply with zoning restrictions',
        standard: 'Local By-Laws',
        category: 'municipal',
        severity: Severity.HIGH,
        checkType: 'dimension',
        requirement: 'Building height must not exceed the zonal height limit',
        thresholds: { max: 12, unit: 'm' },
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'MUN-005',
        name: 'Parking Requirements',
        description: 'Adequate parking must be provided according to use',
        standard: 'Local By-Laws',
        category: 'municipal',
        severity: Severity.HIGH,
        checkType: 'calculation',
        requirement: 'Parking bays must be provided according to municipal schedule (residential: 1/50m², commercial: 1/30m²)',
        thresholds: { min: 1, unit: 'bays per m²' },
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'MUN-006',
        name: 'Stormwater Management',
        description: 'Stormwater management plan must be provided',
        standard: 'Local By-Laws',
        category: 'municipal',
        severity: Severity.HIGH,
        checkType: 'presence',
        requirement: 'Stormwater management plan must be provided showing on-site retention/disposal',
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'MUN-007',
        name: 'Building Lines',
        description: 'Building must comply with setback requirements',
        standard: 'Local By-Laws',
        category: 'municipal',
        severity: Severity.HIGH,
        checkType: 'dimension',
        requirement: 'Building must be set back from all boundaries according to zoning (typically 3-10m)',
        thresholds: { min: 3, unit: 'm' },
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'MUN-008',
        name: 'Servitudes',
        description: 'Building must not encroach on registered servitudes',
        standard: 'Local By-Laws',
        category: 'municipal',
        severity: Severity.CRITICAL,
        checkType: 'verification',
        requirement: 'Building footprint must not encroach on any registered servitudes',
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'MUN-009',
        name: 'Access Requirements',
        description: 'Adequate access must be provided',
        standard: 'Local By-Laws',
        category: 'municipal',
        severity: Severity.HIGH,
        checkType: 'verification',
        requirement: 'Vehicle access must comply with municipal engineering requirements',
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'MUN-010',
        name: 'Landscaping Requirements',
        description: 'Landscaping must be provided according to requirements',
        standard: 'Local By-Laws',
        category: 'municipal',
        severity: Severity.MEDIUM,
        checkType: 'presence',
        requirement: 'Landscaping plan must show minimum required green area (typically 10-20% of site)',
        thresholds: { min: 10, unit: '%' },
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      }
    ];
  }

  /**
   * Analyze drawings for municipal compliance
   */
  async analyze(drawing: DrawingData, projectInfo: ProjectInfo): Promise<AgentResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];
    const passedRules: string[] = [];
    const failedRules: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // This agent primarily works with site plans
      if (drawing.type !== DrawingType.SITE_PLAN) {
        warnings.push('Municipal requirements are best verified on site plans');
      }

      // Analyze text content
      const textContent = drawing.textElements.map(t => t.content.toLowerCase()).join(' ');
      const annotations = drawing.annotations.map(a => a.content.toLowerCase()).join(' ');

      // Check zoning
      findings.push(...this.checkZoningCompliance(textContent, annotations, projectInfo));

      // Check FAR
      findings.push(...this.checkFloorAreaRatio(textContent, annotations, drawing));

      // Check site coverage
      findings.push(...this.checkSiteCoverage(textContent, annotations, drawing));

      // Check height restrictions
      findings.push(...this.checkHeightRestrictions(textContent, annotations, drawing));

      // Check parking requirements
      findings.push(...this.checkParkingRequirements(textContent, annotations, drawing));

      // Check stormwater
      findings.push(...this.checkStormwaterManagement(textContent, annotations, drawing));

      // Check building lines
      findings.push(...this.checkBuildingLines(textContent, annotations, drawing));

      // Check servitudes
      findings.push(...this.checkServitudes(textContent, annotations, drawing));

      // Check access
      findings.push(...this.checkAccessRequirements(textContent, annotations, drawing));

      // Check landscaping
      findings.push(...this.checkLandscaping(textContent, annotations, drawing));

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
    let value: string | undefined;

    switch (rule.id) {
      case 'MUN-001':
        passed = this.checkZoningComplianceSimple(combinedText, context.projectInfo);
        break;
      case 'MUN-002':
        passed = this.checkFARSimple(combinedText);
        value = combinedText.match(/far\s*[:=]?\s*(\d+\.?\d*)/i)?.[1];
        break;
      case 'MUN-003':
        passed = this.checkCoverageSimple(combinedText);
        value = combinedText.match(/coverage\s*[:=]?\s*(\d+\.?\d*)%?/i)?.[1];
        break;
      case 'MUN-004':
        passed = this.checkHeightSimple(combinedText);
        value = combinedText.match(/height\s*[:=]?\s*(\d+\.?\d*)\s*m/i)?.[1];
        break;
      case 'MUN-005':
        passed = this.checkParkingSimple(combinedText);
        break;
      case 'MUN-006':
        passed = this.checkStormwaterSimple(combinedText);
        break;
      case 'MUN-007':
        passed = this.checkSetbackSimple(combinedText);
        break;
      case 'MUN-008':
        passed = this.checkServitudeSimple(combinedText);
        break;
      case 'MUN-009':
        passed = this.checkAccessSimple(combinedText);
        break;
      case 'MUN-010':
        passed = this.checkLandscapeSimple(combinedText);
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

  private checkZoningCompliance(
    text: string,
    annotations: string,
    projectInfo: ProjectInfo
  ): Finding[] {
    const findings: Finding[] = [];
    const rule = this.municipalRules.find(r => r.id === 'MUN-001')!;

    const hasZoning = /zoning|zone|residential|commercial|industrial/i.test(text + annotations);
    const zoningMatch = text.match(/zoning\s*[:=]?\s*(\w+)/i);

    // Check if project zoning matches building type
    if (projectInfo.zoning) {
      const isCompatible = this.checkZoningCompatibility(projectInfo.zoning, projectInfo.buildingType);
      if (!isCompatible) {
        findings.push(this.createFinding(rule, {} as AgentContext, {
          suggestion: `Zoning "${projectInfo.zoning}" may not be compatible with building type "${projectInfo.buildingType}"`
        }));
      }
    } else if (!hasZoning) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Zoning information must be indicated on the site plan'
      }));
    }

    return findings;
  }

  private checkFloorAreaRatio(text: string, annotations: string, drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.municipalRules.find(r => r.id === 'MUN-002')!;

    const farMatch = text.match(/far\s*[:=]?\s*(\d+\.?\d*)/i);
    const hasFAR = !!farMatch;

    if (!hasFAR) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Floor Area Ratio (FAR) must be calculated and indicated on the site plan'
      }));
    } else if (farMatch && parseFloat(farMatch[1]) > 2.0) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: `FAR of ${farMatch[1]} exceeds maximum allowed (typically 2.0)`
      }));
    }

    return findings;
  }

  private checkSiteCoverage(text: string, annotations: string, drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.municipalRules.find(r => r.id === 'MUN-003')!;

    const coverageMatch = text.match(/coverage\s*[:=]?\s*(\d+\.?\d*)%?/i);
    const hasCoverage = !!coverageMatch;

    if (!hasCoverage) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Site coverage percentage must be indicated on the site plan'
      }));
    } else if (coverageMatch && parseFloat(coverageMatch[1]) > 60) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: `Site coverage of ${coverageMatch[1]}% exceeds maximum allowed (typically 60%)`
      }));
    }

    return findings;
  }

  private checkHeightRestrictions(text: string, annotations: string, drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.municipalRules.find(r => r.id === 'MUN-004')!;

    const heightMatch = text.match(/height\s*[:=]?\s*(\d+\.?\d*)\s*m/i);
    const hasHeight = !!heightMatch;

    if (!hasHeight) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Building height must be indicated on elevation drawings'
      }));
    } else if (heightMatch && parseFloat(heightMatch[1]) > 12) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: `Building height of ${heightMatch[1]}m exceeds typical maximum (12m)`
      }));
    }

    return findings;
  }

  private checkParkingRequirements(text: string, annotations: string, drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.municipalRules.find(r => r.id === 'MUN-005')!;

    const hasParking = /parking|bays?|car.*park/i.test(text + annotations);
    const parkingCount = text.match(/(\d+)\s*parking|(\d+)\s*bays?/i);

    if (!hasParking) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Parking provision must be indicated with number of bays'
      }));
    }

    return findings;
  }

  private checkStormwaterManagement(text: string, annotations: string, drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.municipalRules.find(r => r.id === 'MUN-006')!;

    const hasStormwater = /stormwater|drainage|rain.*water|attenuation|retention/i.test(text + annotations);

    if (!hasStormwater) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Stormwater management plan must be provided showing on-site retention/disposal'
      }));
    }

    return findings;
  }

  private checkBuildingLines(text: string, annotations: string, drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.municipalRules.find(r => r.id === 'MUN-007')!;

    const hasSetback = /setback|building.*line|building.*boundary|front.*yard|side.*yard|rear.*yard/i.test(text + annotations);
    const setbackMatch = text.match(/setback\s*[:=]?\s*(\d+\.?\d*)\s*m/i);

    if (!hasSetback) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Building lines/setbacks must be indicated on the site plan'
      }));
    }

    return findings;
  }

  private checkServitudes(text: string, annotations: string, drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.municipalRules.find(r => r.id === 'MUN-008')!;

    const hasServitude = /servitude|easement|right.*of.*way|power.*line|water.*pipe/i.test(text + annotations);

    if (!hasServitude) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Any registered servitudes must be shown on the site plan'
      }));
    }

    return findings;
  }

  private checkAccessRequirements(text: string, annotations: string, drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.municipalRules.find(r => r.id === 'MUN-009')!;

    const hasAccess = /access|entrance|driveway|crossover|road.*front/i.test(text + annotations);

    if (!hasAccess) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Vehicle access points must be indicated on the site plan'
      }));
    }

    return findings;
  }

  private checkLandscaping(text: string, annotations: string, drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.municipalRules.find(r => r.id === 'MUN-010')!;

    const hasLandscaping = /landscap|tree|garden|green.*area|planting/i.test(text + annotations);
    const landscapeMatch = text.match(/landscap.*\s*(\d+\.?\d*)%?/i);

    if (!hasLandscaping) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Landscaping plan showing green area percentage must be provided'
      }));
    }

    return findings;
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private checkZoningCompatibility(zoning: string, buildingType: string): boolean {
    const residentialZones = ['residential', 'res1', 'res2', 'res3', 'r1', 'r2', 'r3', 'single', 'group'];
    const commercialZones = ['commercial', 'business', 'shop', 'office', 'retail'];
    const industrialZones = ['industrial', 'factory', 'warehouse'];

    const z = zoning.toLowerCase();
    const b = buildingType.toLowerCase();

    if (residentialZones.some(rz => z.includes(rz))) {
      return b.includes('residential');
    }
    if (commercialZones.some(cz => z.includes(cz))) {
      return b.includes('commercial');
    }
    if (industrialZones.some(iz => z.includes(iz))) {
      return b.includes('industrial');
    }

    return true; // Unknown zones default to pass
  }

  private checkZoningComplianceSimple(text: string, projectInfo: ProjectInfo): boolean {
    if (projectInfo.zoning) return true;
    return /zoning|zone/i.test(text);
  }

  private checkFARSimple(text: string): boolean {
    const farMatch = text.match(/far\s*[:=]?\s*(\d+\.?\d*)/i);
    if (!farMatch) return false;
    return parseFloat(farMatch[1]) <= 2.0;
  }

  private checkCoverageSimple(text: string): boolean {
    const coverageMatch = text.match(/coverage\s*[:=]?\s*(\d+\.?\d*)%?/i);
    if (!coverageMatch) return false;
    return parseFloat(coverageMatch[1]) <= 60;
  }

  private checkHeightSimple(text: string): boolean {
    const heightMatch = text.match(/height\s*[:=]?\s*(\d+\.?\d*)\s*m/i);
    if (!heightMatch) return true; // No height mentioned is not a failure
    return parseFloat(heightMatch[1]) <= 12;
  }

  private checkParkingSimple(text: string): boolean {
    return /parking|bays?|car.*park/i.test(text);
  }

  private checkStormwaterSimple(text: string): boolean {
    return /stormwater|drainage|rain.*water|attenuation/i.test(text);
  }

  private checkSetbackSimple(text: string): boolean {
    return /setback|building.*line/i.test(text);
  }

  private checkServitudeSimple(text: string): boolean {
    return /servitude|easement/i.test(text);
  }

  private checkAccessSimple(text: string): boolean {
    return /access|entrance|driveway/i.test(text);
  }

  private checkLandscapeSimple(text: string): boolean {
    return /landscap|tree|garden/i.test(text);
  }
}

export default MunicipalRequirementsAgent;
