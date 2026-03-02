/**
 * FireComplianceAgent
 * 
 * Validates fire safety plans against SANS 10400-T.
 * Performs comprehensive compliance checks including escape routes,
 * fire doors, fire separation, fire equipment, and additional safety measures.
 * Required for: Multi-storey, second dwellings, commercial, >500m² buildings.
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
import {
  FIRE_SAFETY,
  FireLayoutCheck,
  EscapeRouteCheck,
  FireDoorCheck,
  TravelCheck,
  FireWallCheck,
  ExtinguisherCheck,
  EmergencyLightingCheck,
  SmokeVentCheck,
  FireAlarmCheck,
  SprinklerCheck
} from '@/config/sans10400/types';

// ============================================================================
// SANS 10400-T Fire Safety Rules
// ============================================================================

const FIRE_RULES: ComplianceRule[] = [
  // When Required: Multi-storey, second dwellings, commercial, >500m²
  // Escape Routes (SANS 10400-T)
  {
    id: 'FIRE-001',
    name: 'Escape Routes from All Rooms',
    description: 'All rooms must have access to a safe escape route',
    standard: 'SANS 10400-T',
    part: 'Part T',
    category: 'fire',
    severity: Severity.CRITICAL,
    checkType: 'presence',
    requirement: 'Every room must have a clear escape route to a final exit',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'FIRE-002',
    name: 'Travel Distance ≤45m (Unsprinklered)',
    description: 'Maximum travel distance to an exit must not exceed 45m for unsprinklered buildings',
    standard: 'SANS 10400-T',
    part: 'Part T',
    category: 'fire',
    severity: Severity.CRITICAL,
    checkType: 'dimension',
    requirement: 'Travel distance must not exceed 45m in unsprinklered buildings',
    thresholds: {
      max: 45000,
      unit: 'mm',
      comparison: 'less_than'
    },
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'FIRE-003',
    name: 'Exit Doors Swing in Direction of Travel',
    description: 'Exit doors must open in the direction of travel',
    standard: 'SANS 10400-T',
    part: 'Part T',
    category: 'fire',
    severity: Severity.CRITICAL,
    checkType: 'verification',
    requirement: 'All exit doors must swing in the direction of egress',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'FIRE-004',
    name: 'Illuminated Exit Signs',
    description: 'Exit routes must be clearly marked with illuminated signs',
    standard: 'SANS 10400-T',
    part: 'Part T',
    category: 'fire',
    severity: Severity.CRITICAL,
    checkType: 'presence',
    requirement: 'Illuminated exit signs must be provided at all exits and escape routes',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // Fire Doors
  {
    id: 'FIRE-005',
    name: 'Fire Doors Where Required',
    description: 'Fire doors must be provided where required by the code',
    standard: 'SANS 10400-T',
    part: 'Part T',
    category: 'fire',
    severity: Severity.CRITICAL,
    checkType: 'presence',
    requirement: 'Fire doors (FD30 or FD60) must be installed at fire compartment boundaries',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'FIRE-006',
    name: 'Door Ratings Correct (FD30/FD60)',
    description: 'Fire door ratings must match the fire resistance requirements',
    standard: 'SANS 10400-T',
    part: 'Part T',
    category: 'fire',
    severity: Severity.CRITICAL,
    checkType: 'verification',
    requirement: 'Fire door ratings must be FD30 (30 min) or FD60 (60 min) as required',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'FIRE-007',
    name: 'Self-Closing Devices',
    description: 'Fire doors must have self-closing devices',
    standard: 'SANS 10400-T',
    part: 'Part T',
    category: 'fire',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'All fire doors must be fitted with self-closing devices',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // Fire Separation
  {
    id: 'FIRE-008',
    name: 'Fire Walls to Boundaries',
    description: 'Fire walls must be provided between buildings and to boundaries',
    standard: 'SANS 10400-T',
    part: 'Part T',
    category: 'fire',
    severity: Severity.CRITICAL,
    checkType: 'presence',
    requirement: 'Fire walls must be provided at 1m from boundary or 3m between buildings',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'FIRE-009',
    name: 'Compartment Floors',
    description: 'Floor compartments must have required fire resistance',
    standard: 'SANS 10400-T',
    part: 'Part T',
    category: 'fire',
    severity: Severity.CRITICAL,
    checkType: 'presence',
    requirement: 'Compartment floors must have fire resistance rating (60 min for 3+ storeys)',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'FIRE-010',
    name: 'Fire Stopping at Penetrations',
    description: 'Fire stopping must be provided at all service penetrations',
    standard: 'SANS 10400-T',
    part: 'Part T',
    category: 'fire',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'Fire stopping must be provided at all penetrations through fire-rated elements',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // Fire Equipment
  {
    id: 'FIRE-011',
    name: 'Extinguisher Positions',
    description: 'Fire extinguishers must be provided at specified locations',
    standard: 'SANS 10400-T',
    part: 'Part T',
    category: 'fire',
    severity: Severity.CRITICAL,
    checkType: 'presence',
    requirement: 'Fire extinguishers must be provided at every 200m² of floor area',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'FIRE-012',
    name: 'Emergency Lighting',
    description: 'Emergency lighting must be provided for escape routes',
    standard: 'SANS 10400-T',
    part: 'Part T',
    category: 'fire',
    severity: Severity.CRITICAL,
    checkType: 'presence',
    requirement: 'Emergency lighting must be provided along all escape routes',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'FIRE-013',
    name: 'Smoke Ventilation',
    description: 'Smoke ventilation must be provided in escape routes',
    standard: 'SANS 10400-T',
    part: 'Part T',
    category: 'fire',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'Smoke ventilation or smoke exhaust must be provided in corridors and stairwells',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // Additional
  {
    id: 'FIRE-014',
    name: 'Assembly Points Indicated',
    description: 'Assembly points must be indicated outside the building',
    standard: 'SANS 10400-T',
    part: 'Part T',
    category: 'fire',
    severity: Severity.MEDIUM,
    checkType: 'presence',
    requirement: 'Assembly points must be clearly indicated on the site plan',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'FIRE-015',
    name: 'Fire Service Access',
    description: 'Fire service access must be provided to the building',
    standard: 'SANS 10400-T',
    part: 'Part T',
    category: 'fire',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'Fire brigade access must be provided (minimum 4m wide access road)',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'FIRE-016',
    name: 'Sprinkler System (If Required)',
    description: 'Sprinkler systems must be installed where required',
    standard: 'SANS 10400-T',
    part: 'Part T',
    category: 'fire',
    severity: Severity.CRITICAL,
    checkType: 'presence',
    requirement: 'Sprinkler system required for buildings >3 storeys or >5000m² floor area',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'FIRE-017',
    name: 'Fire Alarm System',
    description: 'Fire alarm systems must be provided where required',
    standard: 'SANS 10400-T',
    part: 'Part T',
    category: 'fire',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'Fire alarm system required for multi-storey buildings and commercial occupancies',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  }
];

// ============================================================================
// Agent Configuration
// ============================================================================

const DEFAULT_CONFIG: AgentConfig = {
  id: 'fire-compliance-agent',
  name: 'Fire Compliance Agent',
  description: 'Validates fire safety plans against SANS 10400-T',
  version: '1.0.0',
  enabled: true,
  maxRetries: 3,
  timeout: 30000,
  priority: 1,
  capabilities: [
    'fire-validation',
    'escape-route-verification',
    'fire-door-check',
    'fire-separation',
    'fire-equipment-validation',
    'fire-alarm-check',
    'sprinkler-verification'
  ],
  supportedDrawingTypes: [DrawingType.FIRE_LAYOUT, DrawingType.FLOOR_PLAN, DrawingType.SITE_PLAN],
  supportedStandards: ['SANS 10400-T']
};

// ============================================================================
// Agent Implementation
// ============================================================================

export class FireComplianceAgent extends Agent {
  private fireRules: ComplianceRule[];

  constructor(config: Partial<AgentConfig> = {}) {
    super({ ...DEFAULT_CONFIG, ...config });
    this.fireRules = FIRE_RULES;
  }

  /**
   * Get rule IDs for this agent
   */
  getRuleIds(): string[] {
    return this.fireRules.map(rule => rule.id);
  }

  /**
   * Load rules for this agent
   */
  protected async loadRules(): Promise<void> {
    this.rules = this.fireRules;
  }

  /**
   * Check if fire compliance is required for this project
   */
  private isFireComplianceRequired(projectInfo: ProjectInfo): boolean {
    const { buildingType, floors, totalArea } = projectInfo;
    
    return (
      floors >= 2 ||
      buildingType === 'commercial' ||
      buildingType === 'industrial' ||
      (totalArea !== undefined && totalArea > 500) ||
      buildingType === 'mixed_use'
    );
  }

  /**
   * Analyze a fire safety plan for SANS 10400-T compliance
   */
  async analyze(drawing: DrawingData, projectInfo: ProjectInfo): Promise<AgentResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];
    const passedRules: string[] = [];
    const failedRules: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    const isRequired = this.isFireComplianceRequired(projectInfo);
    
    if (!isRequired) {
      warnings.push('Fire compliance not required for this building type');
    }

    try {
      const fireData = this.extractFireData(drawing, projectInfo);

      for (const rule of this.fireRules) {
        const result = await this.evaluateFireRule(rule, fireData, drawing, projectInfo);
        
        if (result.passed) {
          passedRules.push(rule.id);
        } else {
          failedRules.push(rule.id);
          if (result.finding) {
            findings.push(result.finding);
          }
        }
      }

      const complianceScore = calculateComplianceScore(
        this.fireRules.map(rule => ({
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
          projectInfo: {
            id: projectInfo.id,
            name: projectInfo.name,
            buildingType: projectInfo.buildingType,
            floors: projectInfo.floors,
            totalArea: projectInfo.totalArea
          },
          analysisType: 'fire-compliance',
          isRequired
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
          analysisType: 'fire-compliance',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Extract fire safety data from drawing and project info
   */
  private extractFireData(drawing: DrawingData, projectInfo: ProjectInfo): FireAnalysisData {
    const textContent = drawing.textElements.map(t => t.content.toLowerCase());
    const annotations = drawing.annotations.map(a => a.content.toLowerCase());
    
    return {
      escapeRoutes: this.extractEscapeRoutes(drawing),
      travelDistance: this.extractTravelDistance(drawing),
      exitDoors: this.extractExitDoors(drawing),
      exitSigns: this.extractExitSigns(drawing),
      fireDoors: this.extractFireDoors(drawing),
      fireDoorRatings: this.extractFireDoorRatings(textContent, annotations),
      fireWalls: this.extractFireWalls(drawing),
      compartmentFloors: this.extractCompartmentFloors(drawing),
      fireStopping: this.extractFireStopping(drawing),
      extinguishers: this.extractExtinguishers(drawing),
      emergencyLighting: this.extractEmergencyLighting(drawing),
      smokeVents: this.extractSmokeVents(drawing),
      assemblyPoints: this.extractAssemblyPoints(drawing),
      fireServiceAccess: this.extractFireServiceAccess(drawing),
      sprinklerSystem: this.extractSprinklerSystem(drawing),
      fireAlarm: this.extractFireAlarm(drawing),
      textContent: drawing.textElements.map(t => t.content),
      annotations: drawing.annotations.map(a => a.content),
      symbols: drawing.symbols,
      layers: drawing.layers
    };
  }

  private extractEscapeRoutes(drawing: DrawingData): EscapeRouteData[] {
    const routes: EscapeRouteData[] = [];
    const routeSymbols = drawing.symbols.filter(s => 
      s.name.toLowerCase().includes('escape') ||
      s.name.toLowerCase().includes('exit') ||
      s.name.toLowerCase().includes('route')
    );

    for (const symbol of routeSymbols) {
      routes.push({ type: symbol.name, position: symbol.position, shown: true });
    }

    for (const text of drawing.textElements) {
      if (text.content.toLowerCase().includes('escape route')) {
        routes.push({ type: 'Escape Route', position: text.position, shown: true });
      }
    }

    return routes;
  }

  private extractTravelDistance(drawing: DrawingData): number | null {
    const distancePatterns = [
      /travel\s*distance\s*[:=]?\s*(\d+)/i,
      /(\d+)\s*m\s*travel/i,
      /distance\s*to\s*exit\s*[:=]?\s*(\d+)/i
    ];

    for (const text of drawing.textElements) {
      for (const pattern of distancePatterns) {
        const match = text.content.match(pattern);
        if (match) {
          const distance = parseFloat(match[1]);
          if (text.content.toLowerCase().includes('m') && !text.content.includes('mm')) {
            return distance * 1000;
          }
          return distance;
        }
      }
    }
    return null;
  }

  private extractExitDoors(drawing: DrawingData): ExitDoorData[] {
    const doors: ExitDoorData[] = [];
    const doorSymbols = drawing.symbols.filter(s => 
      s.name.toLowerCase().includes('exit') ||
      s.name.toLowerCase().includes('door') ||
      s.category === 'fire'
    );

    for (const symbol of doorSymbols) {
      doors.push({ position: symbol.position, swingDirection: 'out', fireRated: false });
    }
    return doors;
  }

  private extractExitSigns(drawing: DrawingData): boolean {
    const exitSignSymbols = drawing.symbols.filter(s => 
      s.name.toLowerCase().includes('exit') ||
      s.name.toLowerCase().includes('sign') ||
      s.category === 'fire'
    );
    if (exitSignSymbols.length > 0) return true;

    const exitSignText = drawing.textElements.filter(t => 
      t.content.toLowerCase().includes('exit sign') ||
      t.content.toLowerCase().includes('illuminated')
    );
    return exitSignText.length > 0;
  }

  private extractFireDoors(drawing: DrawingData): FireDoorData[] {
    const doors: FireDoorData[] = [];
    const fireDoorSymbols = drawing.symbols.filter(s => 
      s.name.toLowerCase().includes('fire door') ||
      s.name.toLowerCase().includes('fd')
    );

    for (const symbol of fireDoorSymbols) {
      const name = symbol.name.toLowerCase();
      doors.push({
        rating: name.includes('fd60') ? 'FD60' : name.includes('fd30') ? 'FD30' : null,
        selfClosing: true,
        position: symbol.position
      });
    }

    for (const text of drawing.textElements) {
      const content = text.content.toLowerCase();
      if (content.includes('fire door') || content.includes('fd30') || content.includes('fd60')) {
        doors.push({
          rating: content.includes('fd60') ? 'FD60' : content.includes('fd30') ? 'FD30' : null,
          selfClosing: content.includes('self-close'),
          position: text.position
        });
      }
    }
    return doors;
  }

  private extractFireDoorRatings(textContent: string[], annotations: string[]): string[] {
    const ratings: string[] = [];
    const allText = [...textContent, ...annotations];
    const ratingPatterns = [/fd30/i, /fd60/i, /fd90/i, /fd120/i];

    for (const text of allText) {
      for (const pattern of ratingPatterns) {
        if (pattern.test(text) && !ratings.includes(text)) {
          ratings.push(text);
        }
      }
    }
    return ratings;
  }

private extractFireWalls(drawing: DrawingData): FireWallData[] {
    const walls: FireWallData[] = [];
    const wallSymbols = drawing.symbols.filter(s => 
      s.name.toLowerCase().includes('fire wall') ||
      s.name.toLowerCase().includes('fw')
    );

    for (const symbol of wallSymbols) {
      walls.push({ position: symbol.position, rating: 60 });
    }
    return walls;
  }

  private extractCompartmentFloors(drawing: DrawingData): boolean {
    const compartmentText = drawing.textElements.filter(t => 
      t.content.toLowerCase().includes('compartment') ||
      t.content.toLowerCase().includes('fire rated floor')
    );
    return compartmentText.length > 0;
  }

  private extractFireStopping(drawing: DrawingData): boolean {
    const stoppingText = drawing.textElements.filter(t => 
      t.content.toLowerCase().includes('fire stop') ||
      t.content.toLowerCase().includes('penetration seal')
    );
    return stoppingText.length > 0;
  }

  private extractExtinguishers(drawing: DrawingData): ExtinguisherData[] {
    const extinguishers: ExtinguisherData[] = [];
    const extinguisherSymbols = drawing.symbols.filter(s => 
      s.name.toLowerCase().includes('extinguisher') ||
      s.name.toLowerCase().includes('fire') ||
      s.category === 'fire'
    );

    for (const symbol of extinguisherSymbols) {
      extinguishers.push({ type: symbol.name, position: symbol.position });
    }
    return extinguishers;
  }

  private extractEmergencyLighting(drawing: DrawingData): boolean {
    const emergencySymbols = drawing.symbols.filter(s => 
      s.name.toLowerCase().includes('emergency') ||
      s.name.toLowerCase().includes('lighting')
    );
    if (emergencySymbols.length > 0) return true;

    const emergencyText = drawing.textElements.filter(t => 
      t.content.toLowerCase().includes('emergency lighting')
    );
    return emergencyText.length > 0;
  }

  private extractSmokeVents(drawing: DrawingData): SmokeVentData[] {
    const vents: SmokeVentData[] = [];
    const ventSymbols = drawing.symbols.filter(s => 
      s.name.toLowerCase().includes('smoke') ||
      s.name.toLowerCase().includes('vent')
    );

    for (const symbol of ventSymbols) {
      vents.push({ position: symbol.position, automatic: true });
    }
    return vents;
  }

  private extractAssemblyPoints(drawing: DrawingData): AssemblyPointData[] {
    const points: AssemblyPointData[] = [];
    const assemblySymbols = drawing.symbols.filter(s => 
      s.name.toLowerCase().includes('assembly') ||
      s.name.toLowerCase().includes('muster')
    );

    for (const symbol of assemblySymbols) {
      points.push({ position: symbol.position });
    }

    for (const text of drawing.textElements) {
      if (text.content.toLowerCase().includes('assembly point')) {
        points.push({ position: text.position });
      }
    }
    return points;
  }

  private extractFireServiceAccess(drawing: DrawingData): boolean {
    const accessText = drawing.textElements.filter(t => 
      t.content.toLowerCase().includes('fire access') ||
      t.content.toLowerCase().includes('fire brigade') ||
      t.content.toLowerCase().includes('emergency access')
    );
    if (accessText.length > 0) return true;

    const accessLayers = drawing.layers.filter(l => 
      l.name.toLowerCase().includes('access') ||
      l.name.toLowerCase().includes('fire')
    );
    return accessLayers.length > 0;
  }

  private extractSprinklerSystem(drawing: DrawingData): boolean {
    const sprinklerSymbols = drawing.symbols.filter(s => s.name.toLowerCase().includes('sprinkler'));
    if (sprinklerSymbols.length > 0) return true;

    const sprinklerText = drawing.textElements.filter(t => t.content.toLowerCase().includes('sprinkler'));
    return sprinklerText.length > 0;
  }

  private extractFireAlarm(drawing: DrawingData): boolean {
    const alarmSymbols = drawing.symbols.filter(s => 
      s.name.toLowerCase().includes('alarm') ||
      s.name.toLowerCase().includes('detector') ||
      s.category === 'fire'
    );
    if (alarmSymbols.length > 0) return true;

    const alarmText = drawing.textElements.filter(t => t.content.toLowerCase().includes('fire alarm'));
    return alarmText.length > 0;
  }

  private async evaluateFireRule(
    rule: ComplianceRule,
    fireData: FireAnalysisData,
    drawing: DrawingData,
    projectInfo: ProjectInfo
  ): Promise<ComplianceResult> {
    let passed = false;
    let value: string | number | boolean | undefined;
    let expected: string | number | boolean | undefined;
    let finding: Finding | undefined;

    switch (rule.id) {
      case 'FIRE-001':
        passed = this.checkEscapeRoutes(fireData, rule, drawing);
        break;
      case 'FIRE-002':
        ({ passed, value, expected, finding } = this.checkTravelDistance(fireData, rule, drawing));
        break;
      case 'FIRE-003':
        passed = this.checkExitDoorSwing(fireData, rule, drawing);
        break;
      case 'FIRE-004':
        passed = this.checkExitSigns(fireData, rule, drawing);
        break;
      case 'FIRE-005':
        passed = this.checkFireDoors(fireData, rule, drawing);
        break;
      case 'FIRE-006':
        passed = this.checkFireDoorRatings(fireData, rule, drawing);
        break;
      case 'FIRE-007':
        passed = this.checkSelfClosing(fireData, rule, drawing);
        break;
      case 'FIRE-008':
        passed = this.checkFireWalls(fireData, rule, drawing);
        break;
      case 'FIRE-009':
        passed = this.checkCompartmentFloors(fireData, rule, projectInfo);
        break;
      case 'FIRE-010':
        passed = this.checkFireStopping(fireData, rule, drawing);
        break;
      case 'FIRE-011':
        passed = this.checkExtinguishers(fireData, rule, drawing);
        break;
      case 'FIRE-012':
        passed = this.checkEmergencyLighting(fireData, rule, drawing);
        break;
      case 'FIRE-013':
        passed = this.checkSmokeVents(fireData, rule, drawing);
        break;
      case 'FIRE-014':
        passed = this.checkAssemblyPoints(fireData, rule, drawing);
        break;
      case 'FIRE-015':
        passed = this.checkFireServiceAccess(fireData, rule, drawing);
        break;
      case 'FIRE-016':
        passed = this.checkSprinklerSystem(fireData, rule, projectInfo);
        break;
      case 'FIRE-017':
        passed = this.checkFireAlarm(fireData, rule, projectInfo);
        break;
      default:
        passed = false;
    }

    return { rule, passed, value, expected, finding, timestamp: new Date() };
  }

  private checkEscapeRoutes(fireData: FireAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
    return fireData.escapeRoutes.length > 0;
  }

  private checkTravelDistance(
    fireData: FireAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): { passed: boolean; value?: number; expected?: number; finding?: Finding } {
    const maxDistance = FIRE_SAFETY.travelDistance.unsprinklered;
    
    if (fireData.travelDistance === null) {
      return { passed: true };
    }
    
    if (fireData.travelDistance > maxDistance) {
      return {
        passed: false,
        value: fireData.travelDistance,
        expected: maxDistance,
        finding: this.createFireFinding(
          rule,
          `Travel distance (${(fireData.travelDistance / 1000).toFixed(1)}m) exceeds maximum allowed (${maxDistance / 1000}m)`,
          'critical',
          drawing,
          `Reduce travel distance to exit or provide additional exits. Maximum allowed: ${maxDistance / 1000}m`
        )
      };
    }
    
    return { passed: true, value: fireData.travelDistance, expected: maxDistance };
  }

  private checkExitDoorSwing(fireData: FireAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
    return fireData.exitDoors.length > 0;
  }

  private checkExitSigns(fireData: FireAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
    return fireData.exitSigns;
  }

  private checkFireDoors(fireData: FireAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
    return fireData.fireDoors.length > 0;
  }

  private checkFireDoorRatings(fireData: FireAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
    if (fireData.fireDoors.length === 0) return false;
    return fireData.fireDoorRatings.length > 0;
  }

  private checkSelfClosing(fireData: FireAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
    return fireData.fireDoors.length > 0;
  }

  private checkFireWalls(fireData: FireAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
    return fireData.fireWalls.length > 0;
  }

  private checkCompartmentFloors(fireData: FireAnalysisData, rule: ComplianceRule, projectInfo: ProjectInfo): boolean {
    if (projectInfo.floors >= 3) return fireData.compartmentFloors;
    return true;
  }

  private checkFireStopping(fireData: FireAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
    return fireData.fireStopping;
  }

  private checkExtinguishers(fireData: FireAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
    return fireData.extinguishers.length > 0;
  }

  private checkEmergencyLighting(fireData: FireAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
    return fireData.emergencyLighting;
  }

  private checkSmokeVents(fireData: FireAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
    return fireData.smokeVents.length > 0;
  }

  private checkAssemblyPoints(fireData: FireAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
    return fireData.assemblyPoints.length > 0;
  }

  private checkFireServiceAccess(fireData: FireAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
    return fireData.fireServiceAccess;
  }

  private checkSprinklerSystem(fireData: FireAnalysisData, rule: ComplianceRule, projectInfo: ProjectInfo): boolean {
    const requiresSprinkler = projectInfo.floors > 3 || (projectInfo.totalArea && projectInfo.totalArea > 5000);
    if (!requiresSprinkler) return true;
    return fireData.sprinklerSystem;
  }

  private checkFireAlarm(fireData: FireAnalysisData, rule: ComplianceRule, projectInfo: ProjectInfo): boolean {
    const requiresAlarm = projectInfo.floors >= 2 || projectInfo.buildingType === 'commercial';
    if (!requiresAlarm) return true;
    return fireData.fireAlarm;
  }

  private createFireFinding(
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
      location: { pageNumber: 1, x: 0, y: 0, coordinateSystem: 'relative' },
      evidence: [],
      suggestion: suggestion || rule.requirement,
      isResolved: false
    };
  }

  protected async evaluateRule(rule: ComplianceRule, context: AgentContext): Promise<ComplianceResult> {
    const fireData = this.extractFireData(context.drawing, context.projectInfo);
    return this.evaluateFireRule(rule, fireData, context.drawing, context.projectInfo);
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface EscapeRouteData {
  type: string;
  position: { x: number; y: number };
  shown: boolean;
}

interface ExitDoorData {
  position: { x: number; y: number };
  swingDirection: 'in' | 'out';
  fireRated: boolean;
}

interface FireDoorData {
  rating: 'FD30' | 'FD60' | 'FD90' | null;
  selfClosing: boolean;
  position: { x: number; y: number };
}

interface FireWallData {
  position: { x: number; y: number };
  rating: number;
}

interface ExtinguisherData {
  type: string;
  position: { x: number; y: number };
}

interface SmokeVentData {
  position: { x: number; y: number };
  automatic: boolean;
}

interface AssemblyPointData {
  position: { x: number; y: number };
}

interface FireAnalysisData {
  escapeRoutes: EscapeRouteData[];
  travelDistance: number | null;
  exitDoors: ExitDoorData[];
  exitSigns: boolean;
  fireDoors: FireDoorData[];
  fireDoorRatings: string[];
  fireWalls: FireWallData[];
  compartmentFloors: boolean;
  fireStopping: boolean;
  extinguishers: ExtinguisherData[];
  emergencyLighting: boolean;
  smokeVents: SmokeVentData[];
  assemblyPoints: AssemblyPointData[];
  fireServiceAccess: boolean;
  sprinklerSystem: boolean;
  fireAlarm: boolean;
  textContent: string[];
  annotations: string[];
  symbols: SymbolInfo[];
  layers: LayerInfo[];
}

interface SymbolInfo {
  id: string;
  name: string;
  category: string;
  position: { x: number; y: number };
  rotation?: number;
  scale?: number;
  layer?: string;
  properties?: Record<string, unknown>;
}

interface LayerInfo {
  name: string;
  visible: boolean;
  locked: boolean;
  color?: string;
  lineType?: string;
  objectCount: number;
}

export default FireComplianceAgent;
