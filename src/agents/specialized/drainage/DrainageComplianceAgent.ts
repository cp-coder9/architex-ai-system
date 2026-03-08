/**
 * DrainageComplianceAgent
 * 
 * Validates drainage plans against SANS 10400-P and SANS 10252.
 * Performs comprehensive compliance checks including pipe systems,
 * sanitary fixtures, municipal connections, inspection points, and ventilation.
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
import {
  // Constants removed as they are unused
} from '@/config/sans10400/types';

// ============================================================================
// SANS 10400-P and SANS 10252 Drainage Rules
// ============================================================================

const DRAINAGE_RULES: ComplianceRule[] = [
  // Pipe Systems (SANS 10252)
  {
    id: 'DRN-001',
    name: 'Pipe Sizes Indicated',
    description: 'All drainage pipe diameters must be clearly indicated on the drainage plan',
    standard: 'SANS 10252',
    part: 'Part 1',
    category: 'drainage',
    severity: Severity.CRITICAL,
    checkType: 'presence',
    requirement: 'Pipe diameters must be shown (e.g., 100mm soil pipe, 50mm waste pipe)',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'DRN-002',
    name: 'Gradients/Fall Percentages Indicated',
    description: 'Pipe gradients or fall percentages must be clearly indicated',
    standard: 'SANS 10252',
    part: 'Part 1',
    category: 'drainage',
    severity: Severity.CRITICAL,
    checkType: 'dimension',
    requirement: 'Gradients must be indicated for all horizontal pipe runs (minimum 1:60 for soil, 1:40 for waste)',
    thresholds: {
      min: 1.5,
      unit: '%',
      comparison: 'greater_than'
    },
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'DRN-003',
    name: 'Pipe Materials Specified',
    description: 'All pipe materials must be clearly specified',
    standard: 'SANS 10252',
    part: 'Part 1',
    category: 'drainage',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'Pipe materials (e.g., PVC, HDPE, cast iron, copper) must be specified',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'DRN-004',
    name: 'Pipe Connections Correct',
    description: 'Pipe connections must be properly indicated with correct fittings',
    standard: 'SANS 10252',
    part: 'Part 1',
    category: 'drainage',
    severity: Severity.HIGH,
    checkType: 'verification',
    requirement: 'All pipe connections, bends, junctions, and fittings must be clearly shown',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // Sanitary Fixtures (SANS 10252)
  {
    id: 'DRN-005',
    name: 'Floor Gullies Positioned Correctly',
    description: 'Floor gullies must be correctly positioned with proper trapped Gullies',
    standard: 'SANS 10252',
    part: 'Part 1',
    category: 'drainage',
    severity: Severity.CRITICAL,
    checkType: 'presence',
    requirement: 'Floor gullies must be shown at all wet areas (showers, bathrooms, laundry)',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'DRN-006',
    name: 'Waste Pipe Connections Proper',
    description: 'All waste pipe connections must be properly indicated',
    standard: 'SANS 10252',
    part: 'Part 1',
    category: 'drainage',
    severity: Severity.CRITICAL,
    checkType: 'presence',
    requirement: 'Waste pipes from basins, sinks, baths, and showers must connect to the drainage system',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'DRN-007',
    name: 'Traps Installed',
    description: 'All sanitary fixtures must have properly indicated traps',
    standard: 'SANS 10252',
    part: 'Part 1',
    category: 'drainage',
    severity: Severity.CRITICAL,
    checkType: 'presence',
    requirement: 'Traps (P-trap, S-trap) must be indicated for all waste outlets',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // Municipal Connection (SANS 10400-P)
  {
    id: 'DRN-008',
    name: 'Connection to Municipal Sewer Shown',
    description: 'Connection point to municipal sewer must be clearly shown',
    standard: 'SANS 10400-P',
    part: 'Part P',
    category: 'drainage',
    severity: Severity.CRITICAL,
    checkType: 'presence',
    requirement: 'Connection to municipal sewer or approved on-site system must be clearly indicated',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'DRN-009',
    name: 'Connection Point Accessible',
    description: 'The sewer connection point must be accessible for maintenance',
    standard: 'SANS 10400-P',
    part: 'Part P',
    category: 'drainage',
    severity: Severity.HIGH,
    checkType: 'verification',
    requirement: 'Connection point must be accessible and within 3m of the boundary',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // Inspection Points (SANS 10252)
  {
    id: 'DRN-010',
    name: 'Manholes at Junctions',
    description: 'Manholes must be provided at all pipe junctions and changes in direction',
    standard: 'SANS 10252',
    part: 'Part 1',
    category: 'drainage',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'Manholes or inspection chambers required at junctions, bends, and direction changes',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'DRN-011',
    name: 'Cleanouts Provided',
    description: 'Cleanouts must be provided at appropriate locations',
    standard: 'SANS 10252',
    part: 'Part 1',
    category: 'drainage',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'Cleanouts must be provided at the head of each branch drain and at changes of direction',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'DRN-012',
    name: 'Inspection Chamber Locations',
    description: 'Inspection chambers must be shown at all required locations',
    standard: 'SANS 10252',
    part: 'Part 1',
    category: 'drainage',
    severity: Severity.MEDIUM,
    checkType: 'presence',
    requirement: 'Inspection chamber locations must be clearly indicated',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // Ventilation (SANS 10252)
  {
    id: 'DRN-013',
    name: 'Vent Pipes Shown',
    description: 'Ventilation pipes must be shown on the drainage plan',
    standard: 'SANS 10252',
    part: 'Part 1',
    category: 'drainage',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'Vent pipes must be shown extending from drainage system to outside atmosphere',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'DRN-014',
    name: 'Vent Termination Correct',
    description: 'Vent pipe terminations must comply with requirements',
    standard: 'SANS 10252',
    part: 'Part 1',
    category: 'drainage',
    severity: Severity.HIGH,
    checkType: 'verification',
    requirement: 'Vent termination must be at least 3m from windows, doors, or air intakes',
    thresholds: {
      min: 3000,
      unit: 'mm',
      comparison: 'greater_than'
    },
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // Water Supply (SANS 10252)
  {
    id: 'DRN-015',
    name: 'Cold Water Layout',
    description: 'Cold water distribution layout must be shown',
    standard: 'SANS 10252',
    part: 'Part 1',
    category: 'drainage',
    severity: Severity.CRITICAL,
    checkType: 'presence',
    requirement: 'Cold water pipe layout from meter to all fixtures must be clearly shown',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'DRN-016',
    name: 'Hot Water Layout',
    description: 'Hot water distribution layout must be shown',
    standard: 'SANS 10252',
    part: 'Part 1',
    category: 'drainage',
    severity: Severity.CRITICAL,
    checkType: 'presence',
    requirement: 'Hot water pipe layout from geyser/heat pump to all fixtures must be clearly shown',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  }
];

// ============================================================================
// Agent Configuration
// ============================================================================

const DEFAULT_CONFIG: AgentConfig = {
  id: 'drainage-compliance-agent',
  name: 'Drainage Compliance Agent',
  description: 'Validates drainage plans against SANS 10400-P and SANS 10252',
  version: '1.0.0',
  enabled: true,
  maxRetries: 3,
  timeout: 30000,
  priority: 1,
  capabilities: [
    'drainage-validation',
    'pipe-system-verification',
    'sanitary-fixture-check',
    'municipal-connection',
    'inspection-points',
    'ventilation-check',
    'water-supply-validation'
  ],
  supportedDrawingTypes: [DrawingType.DRAINAGE, DrawingType.FLOOR_PLAN],
  supportedStandards: ['SANS 10400-P', 'SANS 10252']
};

// ============================================================================
// Agent Implementation
// ============================================================================

export class DrainageComplianceAgent extends Agent {
  private drainageRules: ComplianceRule[];

  constructor(config: Partial<AgentConfig> = {}) {
    super({ ...DEFAULT_CONFIG, ...config });
    this.drainageRules = DRAINAGE_RULES;
  }

  /**
   * Get rule IDs for this agent
   */
  getRuleIds(): string[] {
    return this.drainageRules.map(rule => rule.id);
  }

  /**
   * Load rules for this agent
   */
  protected async loadRules(): Promise<void> {
    this.rules = this.drainageRules;
  }

  /**
   * Analyze a drainage plan for SANS 10400-P and SANS 10252 compliance
   */
  async analyze(drawing: DrawingData, projectInfo: ProjectInfo): Promise<AgentResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];
    const passedRules: string[] = [];
    const failedRules: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // Extract relevant data from the drawing
      const drainageData = this.extractDrainageData(drawing, projectInfo);

      // Run each compliance check
      for (const rule of this.drainageRules) {
        const result = await this.evaluateDrainageRule(rule, drainageData, drawing);

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
        this.drainageRules.map(rule => ({
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
            floors: projectInfo.floors
          },
          analysisType: 'drainage-compliance'
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
          analysisType: 'drainage-compliance',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Extract drainage data from drawing and project info
   */
  private extractDrainageData(drawing: DrawingData, _projectInfo: ProjectInfo): DrainageAnalysisData {
    const textContent = drawing.textElements.map(t => t.content.toLowerCase());
    const annotations = drawing.annotations.map(a => a.content.toLowerCase());

    return {
      // Pipe systems
      pipeSizes: this.extractPipeSizes(drawing),
      gradients: this.extractGradients(drawing),
      pipeMaterials: this.extractPipeMaterials(textContent, annotations),
      connections: this.extractConnections(drawing),

      // Sanitary fixtures
      floorGullies: this.extractFloorGullies(drawing),
      wasteConnections: this.extractWasteConnections(drawing),
      traps: this.extractTraps(drawing),

      // Municipal connection
      municipalConnection: this.hasMunicipalConnection(textContent, annotations),
      connectionPoint: this.extractConnectionPoint(drawing),

      // Inspection points
      manholes: this.extractManholes(drawing),
      cleanouts: this.extractCleanouts(drawing),
      inspectionChambers: this.extractInspectionChambers(drawing),

      // Ventilation
      ventPipes: this.extractVentPipes(drawing),
      ventTermination: this.extractVentTermination(textContent, annotations),

      // Water supply
      coldWaterLayout: this.hasColdWaterLayout(drawing),
      hotWaterLayout: this.hasHotWaterLayout(drawing),

      // Raw data
      textContent: drawing.textElements.map(t => t.content),
      annotations: drawing.annotations.map(a => a.content),
      symbols: drawing.symbols,
      layers: drawing.layers,
      dimensions: drawing.dimensions
    };
  }

  /**
   * Extract pipe sizes from drawing
   */
  private extractPipeSizes(drawing: DrawingData): PipeSizeData {
    const result: PipeSizeData = {
      soilPipes: [],
      wastePipes: [],
      ventPipes: [],
      rainwaterPipes: []
    };

    // Look for pipe size annotations
    const sizePatterns = [
      /(\d+)\s*mm/i,
      /(\d+)\s*ø/i,
      /pipe\s*size\s*[:=]?\s*(\d+)/i,
      /(\d+)\s*mm\s*soil/i,
      /(\d+)\s*mm\s*waste/i,
      /(\d+)\s*mm\s*vent/i,
      /(\d+)\s*mm\s*rw/i
    ];

    for (const text of drawing.textElements) {
      for (const pattern of sizePatterns) {
        const match = text.content.match(pattern);
        if (match) {
          const size = parseInt(match[1]);
          const content = text.content.toLowerCase();

          if (content.includes('soil') || content.includes('stack')) {
            result.soilPipes.push(size);
          } else if (content.includes('waste')) {
            result.wastePipes.push(size);
          } else if (content.includes('vent')) {
            result.ventPipes.push(size);
          } else if (content.includes('rw') || content.includes('rainwater')) {
            result.rainwaterPipes.push(size);
          } else {
            // Default to waste pipe
            result.wastePipes.push(size);
          }
        }
      }
    }

    return result;
  }

  /**
   * Extract gradients from drawing
   */
  private extractGradients(drawing: DrawingData): GradientData {
    const result: GradientData = {
      soilGradients: [],
      wasteGradients: [],
      generalGradients: []
    };

    const gradientPatterns = [
      /(\d+)\s*[:/]\s*(\d+)/i,
      /gradient\s*[:=]?\s*1\s*:\s*(\d+)/i,
      /fall\s*[:=]?\s*(\d+)%/i,
      /1\s*:\s*(\d+)/i
    ];

    for (const text of drawing.textElements) {
      for (const pattern of gradientPatterns) {
        const match = text.content.match(pattern);
        if (match) {
          let gradient: number;

          if (text.content.includes('%')) {
            gradient = parseFloat(match[1]);
          } else if (match[2]) {
            gradient = (parseInt(match[1]) / parseInt(match[2])) * 100;
          } else {
            gradient = (1 / parseInt(match[1])) * 100;
          }

          const content = text.content.toLowerCase();
          if (content.includes('soil')) {
            result.soilGradients.push(gradient);
          } else if (content.includes('waste')) {
            result.wasteGradients.push(gradient);
          } else {
            result.generalGradients.push(gradient);
          }
        }
      }
    }

    return result;
  }

  /**
   * Extract pipe materials
   */
  private extractPipeMaterials(textContent: string[], annotations: string[]): string[] {
    const materials: string[] = [];
    const allText = [...textContent, ...annotations];

    const materialPatterns = [
      /pvc/i,
      /hdpe/i,
      /upvc/i,
      /cast\s*iron/i,
      /copper/i,
      /galvanized/i,
      /steel/i,
      /pp/i,
      /polypropylene/i
    ];

    for (const text of allText) {
      for (const pattern of materialPatterns) {
        if (pattern.test(text) && !materials.includes(text)) {
          materials.push(text);
        }
      }
    }

    return materials;
  }

  /**
   * Extract connections
   */
  private extractConnections(drawing: DrawingData): ConnectionData[] {
    const connections: ConnectionData[] = [];

    // Look for connection symbols
    const connectionSymbols = drawing.symbols.filter(s =>
      s.name.toLowerCase().includes('connection') ||
      s.name.toLowerCase().includes('junction') ||
      s.category === 'drainage'
    );

    for (const symbol of connectionSymbols) {
      connections.push({
        type: symbol.name,
        position: symbol.position
      });
    }

    return connections;
  }

  /**
   * Extract floor gullies
   */
  private extractFloorGullies(drawing: DrawingData): GulleyData[] {
    const gullies: GulleyData[] = [];

    // Look for gully symbols
    const gullySymbols = drawing.symbols.filter(s =>
      s.name.toLowerCase().includes('gully') ||
      s.name.toLowerCase().includes('floor') ||
      s.category === 'drainage'
    );

    for (const symbol of gullySymbols) {
      gullies.push({
        type: symbol.name.toLowerCase().includes('floor') ? 'floor' : 'gutter',
        position: symbol.position
      });
    }

    // Look for gully text
    for (const text of drawing.textElements) {
      if (text.content.toLowerCase().includes('gully')) {
        gullies.push({
          type: 'floor',
          position: text.position
        });
      }
    }

    return gullies;
  }

  /**
   * Extract waste connections
   */
  private extractWasteConnections(drawing: DrawingData): string[] {
    const connections: string[] = [];

    const wasteTypes = ['basin', 'sink', 'bath', 'shower', 'wc', 'toilet', 'urinal', 'laundry'];

    for (const text of drawing.textElements) {
      const content = text.content.toLowerCase();
      for (const type of wasteTypes) {
        if (content.includes(type) && content.includes('waste')) {
          connections.push(type);
        }
      }
    }

    return [...new Set(connections)];
  }

  /**
   * Extract traps
   */
  private extractTraps(drawing: DrawingData): boolean {
    const trapText = drawing.textElements.filter(t =>
      t.content.toLowerCase().includes('trap') ||
      t.content.toLowerCase().includes('p-trap') ||
      t.content.toLowerCase().includes('s-trap')
    );

    return trapText.length > 0;
  }

  /**
   * Check for municipal connection
   */
  private hasMunicipalConnection(textContent: string[], annotations: string[]): boolean {
    const allText = [...textContent, ...annotations];

    const patterns = [
      /municipal\s*sewer/i,
      /sewer\s*connection/i,
      /municipal\s*connection/i,
      /boundary\s*connection/i,
      /sewer\s*main/i
    ];

    return allText.some(text => patterns.some(pattern => pattern.test(text)));
  }

  /**
   * Extract connection point
   */
  private extractConnectionPoint(drawing: DrawingData): { x: number; y: number } | null {
    // Look for connection point symbol
    const connectionSymbols = drawing.symbols.filter(s =>
      s.name.toLowerCase().includes('connection') ||
      s.name.toLowerCase().includes('outlet')
    );

    if (connectionSymbols.length > 0) {
      return connectionSymbols[0].position;
    }

    // Look for boundary line
    const boundaryLayers = drawing.layers.filter(l =>
      l.name.toLowerCase().includes('boundary') ||
      l.name.toLowerCase().includes('property')
    );

    if (boundaryLayers.length > 0) {
      // Return a position near the boundary
      return { x: 0, y: 0 };
    }

    return null;
  }

  /**
   * Extract manholes
   */
  private extractManholes(drawing: DrawingData): ManholeData[] {
    const manholes: ManholeData[] = [];

    // Look for manhole symbols
    const manholeSymbols = drawing.symbols.filter(s =>
      s.name.toLowerCase().includes('manhole') ||
      s.name.toLowerCase().includes('mh') ||
      s.name.toLowerCase().includes('inspection')
    );

    for (const symbol of manholeSymbols) {
      manholes.push({
        type: 'manhole',
        position: symbol.position
      });
    }

    // Look for manhole text
    for (const text of drawing.textElements) {
      if (text.content.toLowerCase().includes('manhole')) {
        manholes.push({
          type: 'manhole',
          position: text.position
        });
      }
    }

    return manholes;
  }

  /**
   * Extract cleanouts
   */
  private extractCleanouts(drawing: DrawingData): CleanoutData[] {
    const cleanouts: CleanoutData[] = [];

    // Look for cleanout symbols
    const cleanoutSymbols = drawing.symbols.filter(s =>
      s.name.toLowerCase().includes('cleanout') ||
      s.name.toLowerCase().includes('co') ||
      s.name.toLowerCase().includes('access')
    );

    for (const symbol of cleanoutSymbols) {
      cleanouts.push({
        type: 'cleanout',
        position: symbol.position
      });
    }

    // Look for cleanout text
    for (const text of drawing.textElements) {
      if (text.content.toLowerCase().includes('cleanout') || text.content.toLowerCase().includes('c.o.')) {
        cleanouts.push({
          type: 'cleanout',
          position: text.position
        });
      }
    }

    return cleanouts;
  }

  /**
   * Extract inspection chambers
   */
  private extractInspectionChambers(drawing: DrawingData): InspectionChamberData[] {
    const chambers: InspectionChamberData[] = [];

    // Look for inspection chamber symbols
    const chamberSymbols = drawing.symbols.filter(s =>
      s.name.toLowerCase().includes('inspection') ||
      s.name.toLowerCase().includes('chamber') ||
      s.name.toLowerCase().includes('ic')
    );

    for (const symbol of chamberSymbols) {
      chambers.push({
        type: 'inspection chamber',
        position: symbol.position
      });
    }

    return chambers;
  }

  /**
   * Extract vent pipes
   */
  private extractVentPipes(drawing: DrawingData): VentPipeData[] {
    const vents: VentPipeData[] = [];

    // Look for vent symbols
    const ventSymbols = drawing.symbols.filter(s =>
      s.name.toLowerCase().includes('vent') ||
      s.category === 'drainage'
    );

    for (const symbol of ventSymbols) {
      vents.push({
        position: symbol.position,
        shown: true
      });
    }

    // Look for vent text
    for (const text of drawing.textElements) {
      if (text.content.toLowerCase().includes('vent')) {
        vents.push({
          position: text.position,
          shown: true
        });
      }
    }

    return vents;
  }

  /**
   * Extract vent termination
   */
  private extractVentTermination(textContent: string[], annotations: string[]): number | null {
    const allText = [...textContent, ...annotations];

    const terminationPatterns = [
      /vent\s*height\s*[:=]?\s*(\d+)/i,
      /termination\s*height\s*[:=]?\s*(\d+)/i,
      /(\d+)\s*mm\s*above/i
    ];

    for (const text of allText) {
      for (const pattern of terminationPatterns) {
        const match = text.match(pattern);
        if (match) {
          return parseInt(match[1]);
        }
      }
    }

    return null;
  }

  /**
   * Check for cold water layout
   */
  private hasColdWaterLayout(drawing: DrawingData): boolean {
    const coldWaterIndicators = drawing.symbols.filter(s =>
      s.name.toLowerCase().includes('cold') ||
      s.name.toLowerCase().includes('cws') ||
      s.name.toLowerCase().includes('water') ||
      s.category === 'plumbing'
    );

    if (coldWaterIndicators.length > 0) return true;

    const coldWaterText = drawing.textElements.filter(t =>
      t.content.toLowerCase().includes('cold water') ||
      t.content.toLowerCase().includes('cws') ||
      t.content.toLowerCase().includes(' potable')
    );

    return coldWaterText.length > 0;
  }

  /**
   * Check for hot water layout
   */
  private hasHotWaterLayout(drawing: DrawingData): boolean {
    const hotWaterIndicators = drawing.symbols.filter(s =>
      s.name.toLowerCase().includes('hot') ||
      s.name.toLowerCase().includes('hws') ||
      s.name.toLowerCase().includes('geyser') ||
      s.category === 'plumbing'
    );

    if (hotWaterIndicators.length > 0) return true;

    const hotWaterText = drawing.textElements.filter(t =>
      t.content.toLowerCase().includes('hot water') ||
      t.content.toLowerCase().includes('hws')
    );

    return hotWaterText.length > 0;
  }

  /**
   * Evaluate a single drainage rule
   */
  private async evaluateDrainageRule(
    rule: ComplianceRule,
    drainageData: DrainageAnalysisData,
    drawing: DrawingData
  ): Promise<ComplianceResult> {
    let passed = false;
    let value: string | number | boolean | undefined;
    let expected: string | number | boolean | undefined;
    let finding: Finding | undefined;

    switch (rule.id) {
      case 'DRN-001': // Pipe Sizes Indicated
        passed = this.checkPipeSizesPresent(drainageData, rule, drawing);
        break;
      case 'DRN-002': // Gradients Indicated
        passed = this.checkGradientsPresent(drainageData, rule, drawing);
        break;
      case 'DRN-003': // Pipe Materials Specified
        passed = this.checkPipeMaterials(drainageData, rule, drawing);
        break;
      case 'DRN-004': // Pipe Connections
        passed = this.checkPipeConnections(drainageData, rule, drawing);
        break;
      case 'DRN-005': // Floor Gullies
        passed = this.checkFloorGullies(drainageData, rule, drawing);
        break;
      case 'DRN-006': // Waste Connections
        passed = this.checkWasteConnections(drainageData, rule, drawing);
        break;
      case 'DRN-007': // Traps
        passed = this.checkTraps(drainageData, rule, drawing);
        break;
      case 'DRN-008': // Municipal Connection
        passed = this.checkMunicipalConnection(drainageData, rule, drawing);
        break;
      case 'DRN-009': // Connection Point Accessible
        passed = this.checkConnectionPointAccessible(drainageData, rule, drawing);
        break;
      case 'DRN-010': // Manholes
        passed = this.checkManholes(drainageData, rule, drawing);
        break;
      case 'DRN-011': // Cleanouts
        passed = this.checkCleanouts(drainageData, rule, drawing);
        break;
      case 'DRN-012': // Inspection Chambers
        passed = this.checkInspectionChambers(drainageData, rule, drawing);
        break;
      case 'DRN-013': // Vent Pipes
        passed = this.checkVentPipes(drainageData, rule, drawing);
        break;
      case 'DRN-014': // Vent Termination
        passed = this.checkVentTermination(drainageData, rule, drawing);
        break;
      case 'DRN-015': // Cold Water Layout
        passed = this.checkColdWaterLayout(drainageData, rule, drawing);
        break;
      case 'DRN-016': // Hot Water Layout
        passed = this.checkHotWaterLayout(drainageData, rule, drawing);
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
   * Check DRN-001: Pipe Sizes Indicated
   */
  private checkPipeSizesPresent(drainageData: DrainageAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    const { pipeSizes } = drainageData;
    const hasSoilPipes = pipeSizes.soilPipes.length > 0;
    const hasWastePipes = pipeSizes.wastePipes.length > 0;
    const hasVentPipes = pipeSizes.ventPipes.length > 0;

    return hasSoilPipes || hasWastePipes || hasVentPipes;
  }

  /**
   * Check DRN-002: Gradients Indicated
   */
  private checkGradientsPresent(drainageData: DrainageAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    const { gradients } = drainageData;
    return gradients.soilGradients.length > 0 ||
      gradients.wasteGradients.length > 0 ||
      gradients.generalGradients.length > 0;
  }

  /**
   * Check DRN-003: Pipe Materials Specified
   */
  private checkPipeMaterials(drainageData: DrainageAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return drainageData.pipeMaterials.length > 0;
  }

  /**
   * Check DRN-004: Pipe Connections
   */
  private checkPipeConnections(drainageData: DrainageAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    // Check if connections are indicated
    return drainageData.connections.length > 0;
  }

  /**
   * Check DRN-005: Floor Gullies
   */
  private checkFloorGullies(drainageData: DrainageAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    // For residential, expect at least one floor gully in wet areas
    return drainageData.floorGullies.length > 0;
  }

  /**
   * Check DRN-006: Waste Connections
   */
  private checkWasteConnections(drainageData: DrainageAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return drainageData.wasteConnections.length >= 3; // Minimum: sink, basin, shower/bath
  }

  /**
   * Check DRN-007: Traps
   */
  private checkTraps(drainageData: DrainageAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return drainageData.traps;
  }

  /**
   * Check DRN-008: Municipal Connection
   */
  private checkMunicipalConnection(drainageData: DrainageAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return drainageData.municipalConnection;
  }

  /**
   * Check DRN-009: Connection Point Accessible
   */
  private checkConnectionPointAccessible(drainageData: DrainageAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    // If connection point is shown, it's assumed accessible
    return drainageData.connectionPoint !== null || drainageData.municipalConnection;
  }

  /**
   * Check DRN-010: Manholes
   */
  private checkManholes(drainageData: DrainageAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    // Expect manholes at junctions
    return drainageData.manholes.length > 0;
  }

  /**
   * Check DRN-011: Cleanouts
   */
  private checkCleanouts(drainageData: DrainageAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return drainageData.cleanouts.length > 0;
  }

  /**
   * Check DRN-012: Inspection Chambers
   */
  private checkInspectionChambers(drainageData: DrainageAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return drainageData.inspectionChambers.length > 0 || drainageData.manholes.length > 0;
  }

  /**
   * Check DRN-013: Vent Pipes
   */
  private checkVentPipes(drainageData: DrainageAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return drainageData.ventPipes.length > 0;
  }

  /**
   * Check DRN-014: Vent Termination
   */
  private checkVentTermination(drainageData: DrainageAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    // If vent termination height is shown, check if it's >= 3m
    if (drainageData.ventTermination !== null) {
      return drainageData.ventTermination >= 3000;
    }
    // If vent pipes are shown but no height, assume compliance
    return drainageData.ventPipes.length > 0;
  }

  /**
   * Check DRN-015: Cold Water Layout
   */
  private checkColdWaterLayout(drainageData: DrainageAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return drainageData.coldWaterLayout;
  }

  /**
   * Check DRN-016: Hot Water Layout
   */
  private checkHotWaterLayout(drainageData: DrainageAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return drainageData.hotWaterLayout;
  }

  /**
   * Evaluate a single rule (abstract method implementation)
   */
  protected async evaluateRule(
    rule: ComplianceRule,
    context: AgentContext
  ): Promise<ComplianceResult> {
    const drainageData = this.extractDrainageData(context.drawing, context.projectInfo);
    return this.evaluateDrainageRule(rule, drainageData, context.drawing);
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface PipeSizeData {
  soilPipes: number[];
  wastePipes: number[];
  ventPipes: number[];
  rainwaterPipes: number[];
}

interface GradientData {
  soilGradients: number[];
  wasteGradients: number[];
  generalGradients: number[];
}

interface ConnectionData {
  type: string;
  position: { x: number; y: number };
}

interface GulleyData {
  type: string;
  position: { x: number; y: number };
}

interface ManholeData {
  type: string;
  position: { x: number; y: number };
}

interface CleanoutData {
  type: string;
  position: { x: number; y: number };
}

interface InspectionChamberData {
  type: string;
  position: { x: number; y: number };
}

interface VentPipeData {
  position: { x: number; y: number };
  shown: boolean;
}

interface DrainageAnalysisData {
  pipeSizes: PipeSizeData;
  gradients: GradientData;
  pipeMaterials: string[];
  connections: ConnectionData[];
  floorGullies: GulleyData[];
  wasteConnections: string[];
  traps: boolean;
  municipalConnection: boolean;
  connectionPoint: { x: number; y: number } | null;
  manholes: ManholeData[];
  cleanouts: CleanoutData[];
  inspectionChambers: InspectionChamberData[];
  ventPipes: VentPipeData[];
  ventTermination: number | null;
  coldWaterLayout: boolean;
  hotWaterLayout: boolean;
  textContent: string[];
  annotations: string[];
  symbols: SymbolInfo[];
  layers: LayerInfo[];
  dimensions: DimensionInfo[];
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

interface DimensionInfo {
  id: string;
  value: number;
  unit: string;
  type: 'linear' | 'angular' | 'radial' | 'diameter';
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  layer?: string;
}

// Export the agent
export default DrainageComplianceAgent;
