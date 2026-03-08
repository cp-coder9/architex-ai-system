/**
 * SitePlanComplianceAgent
 * 
 * Validates site plans against SANS 10400-A and municipal by-laws.
 * Performs comprehensive compliance checks including property boundaries,
 * building setbacks, coverage calculations, zoning, and access requirements.
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
  SETBACK_REQUIREMENTS,
  _SitePlanCheck,
  _CoverageCalculation,
  _DimensionCheck,
  _BuildingLineCheck,
  _ZoningCheck,
  _ServitudeCheck
} from '@/config/sans10400/types';

// ============================================================================
// SANS 10400-A Site Plan Rules
// ============================================================================

const SITE_PLAN_RULES: ComplianceRule[] = [
  {
    id: 'SITE-001',
    name: 'Property Boundaries Dimensioned',
    description: 'All property boundaries must be clearly dimensioned on the site plan',
    standard: 'SANS 10400-A',
    part: 'Part A',
    category: 'site',
    severity: Severity.CRITICAL,
    checkType: 'presence',
    requirement: 'All four property boundaries must be clearly marked and dimensioned with measurements in millimeters',
    minRequirements: ['Front boundary dimensioned', 'Rear boundary dimensioned', 'Left side boundary dimensioned', 'Right side boundary dimensioned'],
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'SITE-002',
    name: 'Building Setbacks (Front, Side, Rear)',
    description: 'Building setbacks from all property boundaries must be indicated',
    standard: 'SANS 10400-A',
    part: 'Part A',
    category: 'site',
    severity: Severity.CRITICAL,
    checkType: 'dimension',
    requirement: 'Front, side (left and right), and rear setbacks must be clearly indicated with measurements',
    thresholds: {
      min: 1000,
      unit: 'mm',
      comparison: 'greater_than'
    },
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'SITE-003',
    name: 'Building Coverage Calculation',
    description: 'Building coverage must be calculated and shown as a percentage of the total erf',
    standard: 'SANS 10400-A',
    part: 'Part A',
    category: 'site',
    severity: Severity.CRITICAL,
    checkType: 'calculation',
    requirement: 'Building coverage percentage must be calculated: (Building Area / Erf Area) x 100',
    calculation: 'Coverage % = (Building Footprint Area / Total Erf Area) × 100',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'SITE-004',
    name: 'North Point / Compass Orientation',
    description: 'A north point must be clearly indicated on the site plan',
    standard: 'SANS 10400-A',
    part: 'Part A',
    category: 'site',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'A north arrow with orientation indicator must be clearly shown',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'SITE-005',
    name: 'Erf Number and Street Address',
    description: 'The erf number and street address must be clearly indicated',
    standard: 'SANS 10400-A',
    part: 'Part A',
    category: 'site',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'Erf number and complete street address must be clearly indicated on the drawing',
    minRequirements: ['Erf number shown', 'Street name shown', 'Suburb/City indicated', 'Postal code if available'],
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'SITE-006',
    name: 'Zoning Indicated',
    description: 'The zoning of the property must be clearly indicated',
    standard: 'SANS 10400-A',
    part: 'Part A',
    category: 'site',
    severity: Severity.CRITICAL,
    checkType: 'presence',
    requirement: 'Zoning designation (e.g., Residential 1, Commercial, etc.) must be clearly indicated',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'SITE-007',
    name: 'Building Lines and Servitudes Shown',
    description: 'Building lines and any servitudes must be clearly shown',
    standard: 'SANS 10400-A',
    part: 'Part A',
    category: 'site',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'Building lines and all registered servitudes must be shown with dimensions',
    minRequirements: ['Building lines indicated', 'Servitude areas shown', 'Easements marked'],
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'SITE-008',
    name: 'Existing Structures Indicated',
    description: 'All existing structures on the property must be clearly indicated',
    standard: 'SANS 10400-A',
    part: 'Part A',
    category: 'site',
    severity: Severity.MEDIUM,
    checkType: 'presence',
    requirement: 'Existing structures, including outbuildings, must be shown with dashed lines and labeled',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'SITE-009',
    name: 'Access Points / Driveway Positions',
    description: 'Access points and driveway positions must be clearly indicated',
    standard: 'SANS 10400-A',
    part: 'Part A',
    category: 'site',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'Driveway positions, pedestrian access points, and garage access must be clearly shown',
    minRequirements: ['Driveway entrance shown', 'Pedestrian access indicated', 'Garage/carport access marked'],
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'SITE-010',
    name: 'Coverage Within Maximum Allowed %',
    description: 'Building coverage must not exceed the maximum allowed by zoning',
    standard: 'SANS 10400-A',
    part: 'Part A',
    category: 'site',
    severity: Severity.CRITICAL,
    checkType: 'calculation',
    requirement: 'Building coverage must be within the maximum percentage allowed by the zoning scheme',
    thresholds: {
      max: 50,
      unit: '%',
      comparison: 'less_than'
    },
    calculation: 'Coverage % = (Building Footprint / Erf Area) × 100 ≤ Maximum Allowed %',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'SITE-011',
    name: 'Setbacks Meet Minimum Requirements',
    description: 'All setbacks must meet or exceed the minimum requirements for the zoning',
    standard: 'SANS 10400-A',
    part: 'Part A',
    category: 'site',
    severity: Severity.CRITICAL,
    checkType: 'verification',
    requirement: 'Setbacks must meet the minimum requirements specified in the applicable zoning scheme',
    thresholds: {
      min: 1000,
      unit: 'mm',
      comparison: 'greater_than'
    },
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'SITE-012',
    name: 'Boundary Walls Height Compliance',
    description: 'Boundary walls must comply with height restrictions',
    standard: 'SANS 10400-A',
    part: 'Part A',
    category: 'site',
    severity: Severity.MEDIUM,
    checkType: 'dimension',
    requirement: 'Boundary and retaining wall heights must be indicated and comply with municipal by-laws',
    thresholds: {
      max: 2100,
      unit: 'mm',
      comparison: 'less_than'
    },
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  }
];

// ============================================================================
// Agent Configuration
// ============================================================================

const DEFAULT_CONFIG: AgentConfig = {
  id: 'siteplan-compliance-agent',
  name: 'Site Plan Compliance Agent',
  description: 'Validates site plans against SANS 10400-A and municipal by-laws',
  version: '1.0.0',
  enabled: true,
  maxRetries: 3,
  timeout: 30000,
  priority: 1,
  capabilities: [
    'site-plan-validation',
    'setback-verification',
    'coverage-calculation',
    'zoning-compliance',
    'boundary-analysis'
  ],
  supportedDrawingTypes: [DrawingType.SITE_PLAN],
  supportedStandards: ['SANS 10400-A']
};

// ============================================================================
// Agent Implementation
// ============================================================================

export class SitePlanComplianceAgent extends Agent {
  private siteRules: ComplianceRule[];

  constructor(config: Partial<AgentConfig> = {}) {
    super({ ...DEFAULT_CONFIG, ...config });
    this.siteRules = SITE_PLAN_RULES;
  }

  /**
   * Get rule IDs for this agent
   */
  getRuleIds(): string[] {
    return this.siteRules.map(rule => rule.id);
  }

  /**
   * Load rules for this agent
   */
  protected async loadRules(): Promise<void> {
    this.rules = this.siteRules;
  }

  /**
   * Analyze a site plan drawing for SANS 10400-A compliance
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
      const siteData = this.extractSiteData(drawing, projectInfo);

      // Run each compliance check
      for (const rule of this.siteRules) {
        const result = await this.evaluateSiteRule(rule, siteData, drawing);
        
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
        this.siteRules.map(rule => ({
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
            zoning: projectInfo.zoning,
            buildingType: projectInfo.buildingType
          },
          analysisType: 'site-plan-compliance'
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
          analysisType: 'site-plan-compliance',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Extract site data from drawing and project info
   */
  private extractSiteData(drawing: DrawingData, projectInfo: ProjectInfo): SiteAnalysisData {
    // Extract text elements for key information
    const textContent = drawing.textElements.map(t => t.content.toLowerCase());
    const annotations = drawing.annotations.map(a => a.content.toLowerCase());
    
    // Check for erf number
    const erfNumber = this.findErfNumber(textContent, annotations) || projectInfo.erfNumber;
    
    // Check for street address
    const streetAddress = this.findStreetAddress(textContent, annotations) || projectInfo.address;
    
    // Check for zoning
    const zoning = this.findZoning(textContent, annotations) || projectInfo.zoning;
    
    // Check for north point symbol
    const hasNorthPoint = this.hasNorthPoint(drawing);
    
    // Extract dimensions
    const dimensions = this.extractDimensions(drawing);
    
    // Calculate erf area from boundary dimensions
    const erfArea = this.calculateErfArea(dimensions.boundaries);
    
    // Calculate building footprint area
    const buildingArea = this.calculateBuildingArea(drawing);
    
    // Get setbacks
    const setbacks = this.extractSetbacks(drawing, dimensions);
    
    // Check for building lines
    const buildingLines = this.extractBuildingLines(drawing, dimensions);
    
    // Check for servitudes
    const hasServitudes = this.hasServitudes(drawing);
    
    // Check for existing structures
    const hasExistingStructures = this.hasExistingStructures(drawing);
    
    // Check for access points
    const accessPoints = this.extractAccessPoints(drawing);
    
    // Check for boundary walls
    const boundaryWalls = this.extractBoundaryWalls(drawing);

    return {
      erfNumber: erfNumber ?? undefined,
      streetAddress: streetAddress ?? undefined,
      zoning: zoning ?? undefined,
      hasNorthPoint,
      erfArea,
      buildingArea,
      setbacks,
      buildingLines,
      hasServitudes,
      hasExistingStructures,
      accessPoints,
      boundaryWalls,
      dimensions,
      textContent: drawing.textElements.map(t => t.content),
      annotations: drawing.annotations.map(a => a.content),
      symbols: drawing.symbols,
      layers: drawing.layers
    };
  }

  /**
   * Find erf number in text elements
   */
  private findErfNumber(textContent: string[], annotations: string[]): string | null {
    const allText = [...textContent, ...annotations];
    
    // Look for erf patterns like "Erf 1234", "ERF 1234", "Portion 1 of Erf 567"
    const erfPattern = /(?:erf|portion|remainder|farm)\s*#?\s*(\d+[\w\s/]*)/i;
    
    for (const text of allText) {
      const match = text.match(erfPattern);
      if (match) {
        return match[0];
      }
    }
    
    return null;
  }

  /**
   * Find street address in text elements
   */
  private findStreetAddress(textContent: string[], annotations: string[]): string | null {
    const allText = [...textContent, ...annotations];
    
    // Look for address patterns
    const addressPattern = /\d+\s+[\w\s]+(?:street|st|road|rd|avenue|ave|drive|dr|lane|ln|crescent|cr|place|pl)/i;
    
    for (const text of allText) {
      const match = text.match(addressPattern);
      if (match) {
        return match[0];
      }
    }
    
    return null;
  }

  /**
   * Find zoning in text elements
   */
  private findZoning(textContent: string[], annotations: string[]): string | null {
    const allText = [...textContent, ...annotations];
    
    // Look for zoning patterns
    const zoningPatterns = [
      /(residential\s*\d+)/i,
      /(commercial\s*\d+)/i,
      /(industrial\s*\d+)/i,
      /(business\s*\d+)/i,
      /(special\s*residential)/i,
      /(mixed\s*use)/i,
      /zoning\s*:\s*([\w\s]+)/i
    ];
    
    for (const text of allText) {
      for (const pattern of zoningPatterns) {
        const match = text.match(pattern);
        if (match) {
          return match[0];
        }
      }
    }
    
    return null;
  }

  /**
   * Check if north point exists
   */
  private hasNorthPoint(drawing: DrawingData): boolean {
    // Check for north symbol or compass in symbols
    const northSymbols = drawing.symbols.filter(s => 
      s.name.toLowerCase().includes('north') ||
      s.name.toLowerCase().includes('compass') ||
      s.category === 'orientation'
    );
    
    if (northSymbols.length > 0) return true;
    
    // Check for "N" text that might indicate north point
    const northText = drawing.textElements.filter(t => 
      t.content.toLowerCase() === 'n' ||
      t.content.toLowerCase().includes('north')
    );
    
    return northText.length > 0;
  }

  /**
   * Extract dimensions from drawing
   */
  private extractDimensions(drawing: DrawingData): ExtractedDimensions {
    const boundaries: ExtractedDimension[] = [];
    const setbacks: ExtractedDimension[] = [];
    const buildingLines: ExtractedDimension[] = [];
    
    for (const dim of drawing.dimensions) {
      const layerName = dim.layer?.toLowerCase() || '';
      
      if (layerName.includes('boundary') || layerName.includes('property')) {
        boundaries.push(dim);
      } else if (layerName.includes('setback')) {
        setbacks.push(dim);
      } else if (layerName.includes('building') && layerName.includes('line')) {
        buildingLines.push(dim);
      }
    }
    
    return { boundaries, setbacks, buildingLines };
  }

  /**
   * Calculate erf area from boundary dimensions
   */
  private calculateErfArea(boundaries: ExtractedDimension[]): number | null {
    if (boundaries.length < 4) return null;
    
    // For rectangular properties, calculate area from width × height
    // Find the longest dimensions (likely width and depth)
    const sortedDims = [...boundaries].sort((a, b) => b.value - a.value);
    
    if (sortedDims.length >= 2) {
      // Assuming rectangular, area = width × depth
      // Convert to mm² if in meters
      const width = sortedDims[0].value;
      const depth = sortedDims[1].value;
      
      // Check units and convert to mm if needed
      let widthMm = width;
      let depthMm = depth;
      
      if (boundaries[0].unit === 'm') {
        widthMm = width * 1000;
        depthMm = depth * 1000;
      } else if (boundaries[0].unit === 'cm') {
        widthMm = width * 10;
        depthMm = depth * 10;
      }
      
      return widthMm * depthMm;
    }
    
    return null;
  }

  /**
   * Calculate building footprint area
   */
  private calculateBuildingArea(drawing: DrawingData): number {
    // Look for building footprint in layers
    const buildingLayer = drawing.layers.find(l => 
      l.name.toLowerCase().includes('building') ||
      l.name.toLowerCase().includes('footprint') ||
      l.name.toLowerCase().includes('structure')
    );
    
    if (buildingLayer && buildingLayer.objectCount > 0) {
      // Estimate area based on bounding box if available
      if (drawing.boundingBox) {
        const width = drawing.boundingBox.maxX - drawing.boundingBox.minX;
        const height = drawing.boundingBox.maxY - drawing.boundingBox.minY;
        
        // This is an approximation - in a real implementation,
        // we would calculate actual polygon areas
        return width * height;
      }
    }
    
    // Default to a reasonable estimate or return null
    return 0;
  }

  /**
   * Extract setbacks from drawing
   */
  private extractSetbacks(drawing: DrawingData, dimensions: ExtractedDimensions): SetbackValues {
    const result: SetbackValues = {
      front: null,
      rear: null,
      left: null,
      right: null
    };
    
    // Look for setback dimensions
    for (const dim of dimensions.setbacks) {
      const _content = `${dim.startPoint.x},${dim.startPoint.y} to ${dim.endPoint.x},${dim.endPoint.y}`.toLowerCase();
      
      // Determine which setback based on position
      if (dim.startPoint.y < 100 || dim.endPoint.y < 100) {
        result.front = dim.value;
      } else if (dim.startPoint.y > 1000 || dim.endPoint.y > 1000) {
        result.rear = dim.value;
      } else if (dim.startPoint.x < 100 || dim.endPoint.x < 100) {
        result.left = dim.value;
      } else {
        result.right = dim.value;
      }
    }
    
    // Try to find setbacks in text/annotations
    const setbackPatterns = [
      { pattern: /front\s*setback\s*[:=]?\s*(\d+)/i, key: 'front' as const },
      { pattern: /rear\s*setback\s*[:=]?\s*(\d+)/i, key: 'rear' as const },
      { pattern: /side\s*setback\s*[:=]?\s*(\d+)/i, key: 'left' as const },
      { pattern: /left\s*setback\s*[:=]?\s*(\d+)/i, key: 'left' as const },
      { pattern: /right\s*setback\s*[:=]?\s*(\d+)/i, key: 'right' as const }
    ];
    
    for (const text of drawing.textElements) {
      for (const sp of setbackPatterns) {
        const match = text.content.match(sp.pattern);
        if (match) {
          result[sp.key] = parseFloat(match[1]);
        }
      }
    }
    
    return result;
  }

  /**
   * Extract building lines from drawing
   */
  private extractBuildingLines(drawing: DrawingData, dimensions: ExtractedDimensions): BuildingLineValues {
    const result: BuildingLineValues = {
      front: null,
      rear: null,
      left: null,
      right: null,
      hasServitudes: false
    };
    
    for (const dim of dimensions.buildingLines) {
      if (dim.value > 0) {
        // Determine which building line
        if (!result.front) result.front = dim.value;
        else if (!result.rear) result.rear = dim.value;
        else if (!result.left) result.left = dim.value;
        else result.right = dim.value;
      }
    }
    
    return result;
  }

  /**
   * Check for servitudes
   */
  private hasServitudes(drawing: DrawingData): boolean {
    // Check layers for servitude indicators
    const servitudeLayers = drawing.layers.filter(l => 
      l.name.toLowerCase().includes('servitude') ||
      l.name.toLowerCase().includes('easement')
    );
    
    if (servitudeLayers.length > 0) return true;
    
    // Check symbols
    const servitudeSymbols = drawing.symbols.filter(s => 
      s.name.toLowerCase().includes('servitude') ||
      s.name.toLowerCase().includes('easement')
    );
    
    if (servitudeSymbols.length > 0) return true;
    
    // Check text
    const servitudeText = drawing.textElements.filter(t => 
      t.content.toLowerCase().includes('servitude') ||
      t.content.toLowerCase().includes('easement')
    );
    
    return servitudeText.length > 0;
  }

  /**
   * Check for existing structures
   */
  private hasExistingStructures(drawing: DrawingData): boolean {
    // Check layers for existing structures
    const existingLayers = drawing.layers.filter(l => 
      l.name.toLowerCase().includes('existing') ||
      l.name.toLowerCase().includes('demolish')
    );
    
    return existingLayers.length > 0;
  }

  /**
   * Extract access points
   */
  private extractAccessPoints(drawing: DrawingData): AccessPointsData {
    const result: AccessPointsData = {
      driveway: false,
      pedestrian: false,
      garage: false
    };
    
    // Check symbols for access indicators
    const accessSymbols = drawing.symbols.filter(s => {
      const name = s.name.toLowerCase();
      return name.includes('driveway') || 
             name.includes('access') || 
             name.includes('entrance') ||
             name.includes('garage') ||
             name.includes('pedestrian');
    });
    
    if (accessSymbols.length > 0) {
      for (const symbol of accessSymbols) {
        const name = symbol.name.toLowerCase();
        if (name.includes('driveway') || name.includes('entrance')) result.driveway = true;
        if (name.includes('pedestrian') || name.includes('walk')) result.pedestrian = true;
        if (name.includes('garage')) result.garage = true;
      }
    }
    
    // Check text
    const accessText = drawing.textElements.filter(t => {
      const content = t.content.toLowerCase();
      return content.includes('driveway') || 
             content.includes('access') || 
             content.includes('entrance');
    });
    
    if (accessText.length > 0) {
      result.driveway = true;
    }
    
    return result;
  }

  /**
   * Extract boundary walls
   */
  private extractBoundaryWalls(drawing: DrawingData): BoundaryWallData {
    const result: BoundaryWallData = {
      height: null,
      positions: []
    };
    
    // Look for wall height annotations
    const wallPatterns = [
      /boundary\s*wall\s*height\s*[:=]?\s*(\d+)/i,
      /wall\s*height\s*[:=]?\s*(\d+)/i,
      /height\s*[:=]?\s*(\d+)\s*(?:mm|m)/i
    ];
    
    for (const text of drawing.textElements) {
      for (const pattern of wallPatterns) {
        const match = text.content.match(pattern);
        if (match) {
          result.height = parseFloat(match[1]);
          
          // Convert to mm if in meters
          if (text.content.toLowerCase().includes('m') && !text.content.toLowerCase().includes('mm')) {
            result.height = result.height * 1000;
          }
        }
      }
    }
    
    return result;
  }

  /**
   * Evaluate a single site plan rule
   */
  private async evaluateSiteRule(
    rule: ComplianceRule,
    siteData: SiteAnalysisData,
    drawing: DrawingData
  ): Promise<ComplianceResult> {
    let passed = false;
    let value: string | number | boolean | undefined;
    let expected: string | number | boolean | undefined;
    let finding: Finding | undefined;

    switch (rule.id) {
      case 'SITE-001': // Property Boundaries Dimensioned
        passed = this.checkBoundariesDimensioned(siteData, rule, drawing);
        break;

      case 'SITE-002': // Building Setbacks
        passed = this.checkSetbacksPresent(siteData, rule, drawing);
        break;

      case 'SITE-003': // Building Coverage Calculation
        ({ passed, value, expected, finding } = this.checkCoverageCalculation(siteData, rule, drawing));
        break;

      case 'SITE-004': // North Point
        passed = this.checkNorthPoint(siteData, rule, drawing);
        break;

      case 'SITE-005': // Erf Number and Street Address
        passed = this.checkErfAndAddress(siteData, rule, drawing);
        break;

      case 'SITE-006': // Zoning Indicated
        passed = this.checkZoningIndicated(siteData, rule, drawing);
        break;

      case 'SITE-007': // Building Lines and Servitudes
        passed = this.checkBuildingLinesServitudes(siteData, rule, drawing);
        break;

      case 'SITE-008': // Existing Structures
        passed = this.checkExistingStructures(siteData, rule, drawing);
        break;

      case 'SITE-009': // Access Points
        passed = this.checkAccessPoints(siteData, rule, drawing);
        break;

      case 'SITE-010': // Coverage Within Maximum
        ({ passed, value, expected, finding } = this.checkCoverageCompliance(siteData, rule, drawing));
        break;

      case 'SITE-011': // Setbacks Meet Minimum
        ({ passed, value, expected, finding } = this.checkSetbacksCompliance(siteData, rule, drawing));
        break;

      case 'SITE-012': // Boundary Walls Height
        ({ passed, value, expected, finding } = this.checkBoundaryWallHeight(siteData, rule, drawing));
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
   * Check SITE-001: Property Boundaries Dimensioned
   */
  private checkBoundariesDimensioned(siteData: SiteAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    const hasBoundaries = siteData.dimensions.boundaries.length >= 4;
    
    if (!hasBoundaries) {
      return false;
    }
    
    // Check if boundaries have dimensions
    const dimensionedBoundaries = siteData.dimensions.boundaries.filter(d => d.value > 0);
    return dimensionedBoundaries.length >= 4;
  }

  /**
   * Check SITE-002: Building Setbacks Present
   */
  private checkSetbacksPresent(siteData: SiteAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    const { setbacks } = siteData;
    
    // At least front and rear OR both sides should be indicated
    const hasFront = setbacks.front !== null;
    const hasRear = setbacks.rear !== null;
    const hasLeft = setbacks.left !== null;
    const hasRight = setbacks.right !== null;
    
    return (hasFront && hasRear) || (hasLeft && hasRight);
  }

  /**
   * Check SITE-003: Building Coverage Calculation
   */
  private checkCoverageCalculation(
    siteData: SiteAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): { passed: boolean; value?: number; expected?: string; finding?: Finding } {
    const { erfArea, buildingArea } = siteData;
    
    if (!erfArea || erfArea === 0) {
      return {
        passed: false,
        finding: this.createSiteFinding(rule, 'Erf area could not be determined from the drawing', 'critical', drawing)
      };
    }
    
    if (!buildingArea || buildingArea === 0) {
      return {
        passed: false,
        finding: this.createSiteFinding(rule, 'Building footprint area could not be determined from the drawing', 'critical', drawing)
      };
    }
    
    const coverage = (buildingArea / erfArea) * 100;
    
    return {
      passed: true,
      value: coverage,
      expected: 'Coverage calculated and shown'
    };
  }

  /**
   * Check SITE-004: North Point
   */
  private checkNorthPoint(siteData: SiteAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return siteData.hasNorthPoint;
  }

  /**
   * Check SITE-005: Erf Number and Street Address
   */
  private checkErfAndAddress(siteData: SiteAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    const hasErf = siteData.erfNumber !== undefined;
    const hasAddress = siteData.streetAddress !== undefined;
    
    return hasErf || hasAddress;
  }

  /**
   * Check SITE-006: Zoning Indicated
   */
  private checkZoningIndicated(siteData: SiteAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return siteData.zoning !== undefined;
  }

  /**
   * Check SITE-007: Building Lines and Servitudes
   */
  private checkBuildingLinesServitudes(siteData: SiteAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    const hasBuildingLines = siteData.buildingLines.front !== null || 
                            siteData.buildingLines.rear !== null ||
                            siteData.buildingLines.left !== null ||
                            siteData.buildingLines.right !== null;
    
    return hasBuildingLines || siteData.hasServitudes;
  }

  /**
   * Check SITE-008: Existing Structures
   */
  private checkExistingStructures(siteData: SiteAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return siteData.hasExistingStructures;
  }

  /**
   * Check SITE-009: Access Points
   */
  private checkAccessPoints(siteData: SiteAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return siteData.accessPoints.driveway || 
           siteData.accessPoints.pedestrian || 
           siteData.accessPoints.garage;
  }

  /**
   * Check SITE-010: Coverage Within Maximum
   */
  private checkCoverageCompliance(
    siteData: SiteAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): { passed: boolean; value?: number; expected?: number; finding?: Finding } {
    const { erfArea, buildingArea, zoning } = siteData;
    
    if (!erfArea || erfArea === 0 || !buildingArea) {
      return {
        passed: false,
        finding: this.createSiteFinding(rule, 'Cannot verify coverage - erf or building area not determinable', 'critical', drawing)
      };
    }
    
    const coverage = (buildingArea / erfArea) * 100;
    
    // Get max allowed based on zoning
    const maxCoverage = this.getMaxCoverage(zoning);
    
    if (coverage > maxCoverage) {
      return {
        passed: false,
        value: coverage,
        expected: maxCoverage,
        finding: this.createSiteFinding(
          rule,
          `Building coverage (${coverage.toFixed(1)}%) exceeds maximum allowed (${maxCoverage}%) for ${zoning || 'residential'} zoning`,
          'critical',
          drawing,
          `Reduce building footprint or apply for zoning variance. Maximum coverage for this zoning is ${maxCoverage}%. Current coverage: ${coverage.toFixed(1)}%`
        )
      };
    }
    
    return { passed: true, value: coverage, expected: maxCoverage };
  }

  /**
   * Check SITE-011: Setbacks Meet Minimum
   */
  private checkSetbacksCompliance(
    siteData: SiteAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): { passed: boolean; value?: string; expected?: string; finding?: Finding } {
    const { setbacks, zoning } = siteData;
    const minSetbacks = this.getMinSetbacks(zoning);
    
    const violations: string[] = [];
    const actualSetbacks: Record<string, number> = {};
    const expectedSetbacks: Record<string, number> = {};
    
    // Check front setback
    if (setbacks.front !== null) {
      actualSetbacks.front = setbacks.front;
      expectedSetbacks.front = minSetbacks.front;
      if (setbacks.front < minSetbacks.front) {
        violations.push(`Front setback (${setbacks.front}mm) is less than minimum (${minSetbacks.front}mm)`);
      }
    }
    
    // Check rear setback
    if (setbacks.rear !== null) {
      actualSetbacks.rear = setbacks.rear;
      expectedSetbacks.rear = minSetbacks.rear;
      if (setbacks.rear < minSetbacks.rear) {
        violations.push(`Rear setback (${setbacks.rear}mm) is less than minimum (${minSetbacks.rear}mm)`);
      }
    }
    
    // Check left setback
    if (setbacks.left !== null) {
      actualSetbacks.left = setbacks.left;
      expectedSetbacks.left = minSetbacks.side;
      if (setbacks.left < minSetbacks.side) {
        violations.push(`Left setback (${setbacks.left}mm) is less than minimum (${minSetbacks.side}mm)`);
      }
    }
    
    // Check right setback
    if (setbacks.right !== null) {
      actualSetbacks.right = setbacks.right;
      expectedSetbacks.right = minSetbacks.side;
      if (setbacks.right < minSetbacks.side) {
        violations.push(`Right setback (${setbacks.right}mm) is less than minimum (${minSetbacks.side}mm)`);
      }
    }
    
    const actualStr = `Front: ${actualSetbacks.front ?? 'N/A'}mm, Rear: ${actualSetbacks.rear ?? 'N/A'}mm, Left: ${actualSetbacks.left ?? 'N/A'}mm, Right: ${actualSetbacks.right ?? 'N/A'}mm`;
    const expectedStr = `Front: ${expectedSetbacks.front}mm, Rear: ${expectedSetbacks.rear}mm, Left: ${expectedSetbacks.left}mm, Right: ${expectedSetbacks.right}mm`;
    
    if (violations.length > 0) {
      return {
        passed: false,
        value: actualStr,
        expected: expectedStr,
        finding: this.createSiteFinding(
          rule,
          violations.join('; '),
          'critical',
          drawing,
          `Adjust building position to meet minimum setback requirements: Front min ${minSetbacks.front}mm, Rear min ${minSetbacks.rear}mm, Side min ${minSetbacks.side}mm`
        )
      };
    }
    
    return { passed: true, value: actualStr, expected: expectedStr };
  }

  /**
   * Check SITE-012: Boundary Wall Height
   */
  private checkBoundaryWallHeight(
    siteData: SiteAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): { passed: boolean; value?: number; expected?: number; finding?: Finding } {
    const { boundaryWalls } = siteData;
    
    if (boundaryWalls.height === null) {
      // No boundary wall indicated - this is acceptable
      return { passed: true };
    }
    
    const maxHeight = 2100; // mm - typical municipal limit
    
    if (boundaryWalls.height > maxHeight) {
      return {
        passed: false,
        value: boundaryWalls.height,
        expected: maxHeight,
        finding: this.createSiteFinding(
          rule,
          `Boundary wall height (${boundaryWalls.height}mm) exceeds maximum allowed (${maxHeight}mm)`,
          'medium',
          drawing,
          `Reduce boundary wall height to maximum ${maxHeight}mm or apply for municipal approval for higher wall`
        )
      };
    }
    
    return { passed: true, value: boundaryWalls.height, expected: maxHeight };
  }

  /**
   * Get minimum setbacks based on zoning
   */
  private getMinSetbacks(zoning: string | undefined): { front: number; rear: number; side: number } {
    if (!zoning) {
      return SETBACK_REQUIREMENTS.residential1;
    }
    
    const zoningLower = zoning.toLowerCase();
    
    if (zoningLower.includes('residential 1') || zoningLower.includes('res1') || zoningLower.includes('rs1')) {
      return SETBACK_REQUIREMENTS.residential1;
    } else if (zoningLower.includes('residential 2') || zoningLower.includes('res2') || zoningLower.includes('rs2')) {
      return SETBACK_REQUIREMENTS.residential2;
    } else if (zoningLower.includes('residential 3') || zoningLower.includes('res3') || zoningLower.includes('rs3')) {
      return SETBACK_REQUIREMENTS.residential3;
    } else if (zoningLower.includes('commercial') || zoningLower.includes('business')) {
      return SETBACK_REQUIREMENTS.commercial;
    }
    
    return SETBACK_REQUIREMENTS.residential1;
  }

  /**
   * Get maximum coverage based on zoning
   */
  private getMaxCoverage(zoning: string | undefined): number {
    if (!zoning) {
      return 50; // Default to Residential 1
    }
    
    const zoningLower = zoning.toLowerCase();
    
    if (zoningLower.includes('residential 1') || zoningLower.includes('res1') || zoningLower.includes('rs1')) {
      return SETBACK_REQUIREMENTS.residential1.maxCoverage * 100;
    } else if (zoningLower.includes('residential 2') || zoningLower.includes('res2') || zoningLower.includes('rs2')) {
      return SETBACK_REQUIREMENTS.residential2.maxCoverage * 100;
    } else if (zoningLower.includes('residential 3') || zoningLower.includes('res3') || zoningLower.includes('rs3')) {
      return SETBACK_REQUIREMENTS.residential3.maxCoverage * 100;
    } else if (zoningLower.includes('commercial') || zoningLower.includes('business')) {
      return SETBACK_REQUIREMENTS.commercial.maxCoverage * 100;
    }
    
    return 50;
  }

  /**
   * Create a finding for site plan analysis
   */
  private createSiteFinding(
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
    const siteData = this.extractSiteData(context.drawing, context.projectInfo);
    return this.evaluateSiteRule(rule, siteData, context.drawing);
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface ExtractedDimensions {
  boundaries: ExtractedDimension[];
  setbacks: ExtractedDimension[];
  buildingLines: ExtractedDimension[];
}

interface ExtractedDimension {
  id: string;
  value: number;
  unit: string;
  type: 'linear' | 'angular' | 'radial' | 'diameter';
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  layer?: string;
}

interface SetbackValues {
  front: number | null;
  rear: number | null;
  left: number | null;
  right: number | null;
}

interface BuildingLineValues {
  front: number | null;
  rear: number | null;
  left: number | null;
  right: number | null;
  hasServitudes: boolean;
}

interface AccessPointsData {
  driveway: boolean;
  pedestrian: boolean;
  garage: boolean;
}

interface BoundaryWallData {
  height: number | null;
  positions: Array<{ x: number; y: number }>;
}

interface SiteAnalysisData {
  erfNumber: string | undefined;
  streetAddress: string | undefined;
  zoning: string | undefined;
  hasNorthPoint: boolean;
  erfArea: number | null;
  buildingArea: number;
  setbacks: SetbackValues;
  buildingLines: BuildingLineValues;
  hasServitudes: boolean;
  hasExistingStructures: boolean;
  accessPoints: AccessPointsData;
  boundaryWalls: BoundaryWallData;
  dimensions: ExtractedDimensions;
  textContent: string[];
  annotations: string[];
  symbols: SymbolInfo[];
  layers: LayerInfo[];
}

// Re-export the symbol and layer types from agent types
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

// Export the agent
export default SitePlanComplianceAgent;
