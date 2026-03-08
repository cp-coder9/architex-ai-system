/**
 * ElevationComplianceAgent
 * 
 * Validates elevation drawings against SANS 10400-A, T, XA requirements.
 * Performs compliance checks including building height, ground lines, fire safety,
 * energy efficiency (glazing, shading, insulation), roof specifications, and drainage.
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
  calculateComplianceScore,
  ExtractedDimension,
  _TextElement,
  SymbolInfo,
  LayerInfo,
  _AnnotationInfo
} from '@/types/agent';
import { ENERGY_DTS } from '@/config/sans10400/types';

// ============================================================================
// SANS 10400 Elevation Rules (11 rules total)
// ============================================================================

const ELEVATION_RULES: ComplianceRule[] = [
  // --------------------------------------------------------------------------
  // Height & Ground Line (SANS 10400-A) - ELV-001 to ELV-003
  // --------------------------------------------------------------------------
  {
    id: 'ELV-001',
    name: 'Ground Line Shown (Natural and Finished)',
    description: 'Both natural ground line and finished ground level must be clearly indicated on elevations',
    standard: 'SANS 10400-A',
    part: 'Part A',
    category: 'elevation',
    severity: Severity.CRITICAL,
    checkType: 'presence',
    requirement: 'Natural ground line and finished ground level must be shown with distinct line types',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'ELV-002',
    name: 'Building Height Dimensioned',
    description: 'Building height must be clearly dimensioned from finished ground level',
    standard: 'SANS 10400-A',
    part: 'Part A',
    category: 'elevation',
    severity: Severity.CRITICAL,
    checkType: 'dimension',
    requirement: 'Building height must be shown as a dimension with value in meters or millimeters',
    thresholds: {
      min: 0,
      max: 12000,
      unit: 'mm',
      comparison: 'less_than'
    },
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'ELV-003',
    name: 'Building Height Within Maximum for Zone',
    description: 'Building height must not exceed the maximum allowed for the zoning category',
    standard: 'SANS 10400-A',
    part: 'Part A',
    category: 'elevation',
    severity: Severity.CRITICAL,
    checkType: 'calculation',
    requirement: 'Building height must comply with municipal by-law limits for the specific zone',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // --------------------------------------------------------------------------
  // Fire Safety (SANS 10400-T) - ELV-004 to ELV-005
  // --------------------------------------------------------------------------
  {
    id: 'ELV-004',
    name: 'Fire Separation to Boundaries',
    description: 'Fire separation distances to property boundaries must be indicated',
    standard: 'SANS 10400-T',
    part: 'Part T',
    category: 'elevation',
    severity: Severity.HIGH,
    checkType: 'verification',
    requirement: 'Minimum 1m fire separation to boundaries or fire-rated construction must be indicated',
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
    id: 'ELV-005',
    name: 'Fire Rating Indicated for Elements',
    description: 'Fire ratings for structural elements must be indicated where required',
    standard: 'SANS 10400-T',
    part: 'Part T',
    category: 'elevation',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'Fire ratings (30/60/90 minutes) must be indicated on relevant structural elements',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // --------------------------------------------------------------------------
  // Energy (SANS 10400-XA) - ELV-006 to ELV-008
  // --------------------------------------------------------------------------
  {
    id: 'ELV-006',
    name: 'Glazing Percentage Within Limits',
    description: 'Total glazing area as percentage of wall area must not exceed 50%',
    standard: 'SANS 10400-XA',
    part: 'Part XA',
    category: 'elevation',
    severity: Severity.HIGH,
    checkType: 'calculation',
    requirement: 'Glazing area must not exceed 50% of total wall area for energy compliance',
    thresholds: {
      max: 50,
      unit: '%',
      comparison: 'less_than'
    },
    calculation: 'Window Area / Wall Area × 100 ≤ 50%',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'ELV-007',
    name: 'External Shading Indicated',
    description: 'External shading devices must be indicated for solar control',
    standard: 'SANS 10400-XA',
    part: 'Part XA',
    category: 'elevation',
    severity: Severity.MEDIUM,
    checkType: 'presence',
    requirement: 'External shading (overhangs, blinds, pergolas) must be indicated to reduce solar heat gain',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'ELV-008',
    name: 'Roof Insulation Specified',
    description: 'Roof insulation must be specified with R-value',
    standard: 'SANS 10400-XA',
    part: 'Part XA',
    category: 'elevation',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'Roof insulation with minimum R-value of 3.7 W/m²K must be specified',
    thresholds: {
      min: 3.7,
      unit: 'W/m²K',
      comparison: 'greater_than'
    },
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // --------------------------------------------------------------------------
  // General (SANS 10400-A) - ELV-009 to ELV-011
  // --------------------------------------------------------------------------
  {
    id: 'ELV-009',
    name: 'Roof Pitch and Material Shown',
    description: 'Roof pitch angle and roofing material must be clearly indicated',
    standard: 'SANS 10400-A',
    part: 'Part A',
    category: 'elevation',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'Roof pitch (in degrees) and roofing material must be clearly shown',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'ELV-010',
    name: 'External Finishes Specified',
    description: 'External wall finishes must be specified with material and colour',
    standard: 'SANS 10400-A',
    part: 'Part A',
    category: 'elevation',
    severity: Severity.MEDIUM,
    checkType: 'presence',
    requirement: 'External wall finishes including material type and colour must be specified',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'ELV-011',
    name: 'Drainage Direction Indicated',
    description: 'Ground drainage direction must be indicated on at least one elevation',
    standard: 'SANS 10400-A',
    part: 'Part A',
    category: 'elevation',
    severity: Severity.HIGH,
    checkType: 'verification',
    requirement: 'Surface water drainage direction must be indicated to ensure proper grading away from building',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  }
];

// ============================================================================
// Agent Configuration
// ============================================================================

const DEFAULT_CONFIG: AgentConfig = {
  id: 'elevation-compliance-agent',
  name: 'Elevation Compliance Agent',
  description: 'Validates elevation drawings against SANS 10400-A, T, XA requirements',
  version: '1.0.0',
  enabled: true,
  maxRetries: 3,
  timeout: 30000,
  priority: 2,
  capabilities: [
    'elevation-validation',
    'building-height-verification',
    'fire-safety-compliance',
    'energy-efficiency-check',
    'roof-specification-validation',
    'drainage-verification'
  ],
  supportedDrawingTypes: [DrawingType.ELEVATION],
  supportedStandards: ['SANS 10400-A', 'SANS 10400-T', 'SANS 10400-XA']
};

// ============================================================================
// Agent Implementation
// ============================================================================

export class ElevationComplianceAgent extends Agent {
  private elevationRules: ComplianceRule[];

  constructor(config: Partial<AgentConfig> = {}) {
    super({ ...DEFAULT_CONFIG, ...config });
    this.elevationRules = ELEVATION_RULES;
  }

  /**
   * Get rule IDs for this agent
   */
  getRuleIds(): string[] {
    return this.elevationRules.map(rule => rule.id);
  }

  /**
   * Load rules for this agent
   */
  protected async loadRules(): Promise<void> {
    this.rules = this.elevationRules;
  }

  /**
   * Analyze an elevation drawing for SANS 10400 compliance
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
      const elevationData = this.extractElevationData(drawing, projectInfo);

      // Run each compliance check
      for (const rule of this.elevationRules) {
        const result = await this.evaluateElevationRule(rule, elevationData, drawing, projectInfo);
        
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
        this.elevationRules.map(rule => ({
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
            zoning: projectInfo.zoning
          },
          analysisType: 'elevation-compliance',
          groundLinesFound: elevationData.groundLines.length,
          heightDimensionsFound: elevationData.heightDimensions.length,
          windowsFound: elevationData.windows.length,
          doorsFound: elevationData.doors.length,
          roofPitchFound: elevationData.roofPitch !== null,
          insulationSpecified: elevationData.insulationSpecified
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
          analysisType: 'elevation-compliance',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Extract elevation data from drawing and project info
   */
  private extractElevationData(drawing: DrawingData, _projectInfo: ProjectInfo): ElevationAnalysisData {
    // Extract text elements for annotations
    const textContent = drawing.textElements.map(t => t.content.toLowerCase());
    const annotations = drawing.annotations.map(a => a.content.toLowerCase());
    const allText = [...textContent, ...annotations];
    
    // Extract ground lines
    const groundLines = this.extractGroundLines(drawing, allText);
    
    // Extract height dimensions
    const heightDimensions = this.extractHeightDimensions(drawing);
    
    // Extract building height
    const buildingHeight = this.extractBuildingHeight(drawing, heightDimensions);
    
    // Extract windows
    const windows = this.extractWindows(drawing);
    
    // Extract doors
    const doors = this.extractDoors(drawing);
    
    // Extract roof information
    const roofPitch = this.extractRoofPitch(drawing, allText);
    const roofMaterial = this.extractRoofMaterial(drawing, allText);
    
    // Extract external finishes
    const externalFinishes = this.extractExternalFinishes(drawing, allText);
    
    // Extract fire ratings
    const fireRatings = this.extractFireRatings(drawing, allText);
    
    // Extract fire separation
    const fireSeparation = this.extractFireSeparation(drawing, allText);
    
    // Extract shading
    const shading = this.extractShading(drawing, allText);
    
    // Extract insulation
    const insulationSpecified = this.extractInsulation(drawing, allText);
    const insulationRValue = this.extractInsulationRValue(drawing, allText);
    
    // Extract drainage
    const drainageDirection = this.extractDrainageDirection(drawing, allText);
    
    // Calculate wall and glazing areas
    const wallArea = this.calculateWallArea(drawing);
    const glazingArea = this.calculateGlazingArea(windows);
    const glazingPercentage = wallArea > 0 ? (glazingArea / wallArea) * 100 : 0;

    return {
      groundLines,
      heightDimensions,
      buildingHeight,
      windows,
      doors,
      roofPitch,
      roofMaterial,
      externalFinishes,
      fireRatings,
      fireSeparation,
      shading,
      insulationSpecified,
      insulationRValue,
      drainageDirection,
      wallArea,
      glazingArea,
      glazingPercentage,
      textContent: drawing.textElements.map(t => t.content),
      annotations: drawing.annotations.map(a => a.content),
      symbols: drawing.symbols,
      layers: drawing.layers,
      dimensions: drawing.dimensions
    };
  }

  /**
   * Extract ground lines from drawing
   */
  private extractGroundLines(drawing: DrawingData, _textContent: string[]): GroundLineData[] {
    const groundLines: GroundLineData[] = [];
    
    // Look for ground line indicators in text
    const groundPatterns = [
      /natural\s*ground/i,
      /finished\s*ground/i,
      /n\.g\.l\.?/i,
      /f\.g\.l\.?/i,
      /ground\s*level/i,
      /n\.g\./i,
      /f\.g\./i
    ];
    
    for (const text of drawing.textElements) {
      const contentLower = text.content.toLowerCase();
      
      for (const pattern of groundPatterns) {
        if (pattern.test(contentLower)) {
          const isNatural = /natural|n\.g|ngl/i.test(contentLower);
          groundLines.push({
            type: isNatural ? 'natural' : 'finished',
            position: text.position,
            value: this.extractDimensionValue(text.content),
            label: text.content
          });
          break;
        }
      }
    }
    
    // Also check layers for ground-related layers
    const groundLayers = drawing.layers.filter(l => 
      l.name.toLowerCase().includes('ground') ||
      l.name.toLowerCase().includes('site')
    );
    
    if (groundLines.length === 0 && groundLayers.length > 0) {
      groundLines.push({
        type: 'natural',
        position: { x: 0, y: 0 },
        value: null,
        label: 'Ground (from layer)'
      });
    }
    
    return groundLines;
  }

  /**
   * Extract height dimensions from drawing
   */
  private extractHeightDimensions(drawing: DrawingData): HeightDimensionData[] {
    const heightDimensions: HeightDimensionData[] = [];
    
    // Look for vertical dimensions
    for (const dim of drawing.dimensions) {
      if (dim.type === 'linear') {
        // Check if it's a height dimension (vertical orientation)
        const isVertical = Math.abs(dim.endPoint.y - dim.startPoint.y) > Math.abs(dim.endPoint.x - dim.startPoint.x);
        
        if (isVertical && dim.value > 0 && dim.value < 15000) { // Reasonable height range
          heightDimensions.push({
            id: dim.id,
            value: dim.value,
            unit: dim.unit,
            startPoint: dim.startPoint,
            endPoint: dim.endPoint,
            layer: dim.layer
          });
        }
      }
    }
    
    // Look for height annotations
    const heightPatterns = [
      /height\s*[:=]?\s*(\d+\.?\d*)\s*m/i,
      /(\d+\.?\d*)\s*m\s*high/i,
      /building\s*height/i,
      /storey\s*height/i,
      /eave\s*height/i,
      /ridge\s*height/i,
      /(\d{4,5})\s*mm/i  // e.g., 3600mm
    ];
    
    for (const text of drawing.textElements) {
      for (const pattern of heightPatterns) {
        const match = text.content.match(pattern);
        if (match) {
          let value = parseFloat(match[1]);
          
          // Convert meters to mm if needed
          if (text.content.toLowerCase().includes('m') && !text.content.toLowerCase().includes('mm')) {
            value = value * 1000;
          }
          
          if (value > 0 && value < 15000) {
            // Check if already exists
            const existing = heightDimensions.find(d => 
              Math.abs(d.value - value) < 100
            );
            
            if (!existing) {
              heightDimensions.push({
                id: text.id,
                value,
                unit: 'mm',
                startPoint: text.position,
                endPoint: text.position,
                layer: text.layer,
                label: text.content
              });
            }
          }
          break;
        }
      }
    }
    
    return heightDimensions;
  }

  /**
   * Extract building height
   */
  private extractBuildingHeight(drawing: DrawingData, heightDimensions: HeightDimensionData[]): number | null {
    // Find the largest dimension which is likely the building height
    if (heightDimensions.length === 0) return null;
    
    const sortedDimensions = [...heightDimensions].sort((a, b) => b.value - a.value);
    
    // Return the largest dimension as building height
    return sortedDimensions[0].value;
  }

  /**
   * Extract windows from drawing
   */
  private extractWindows(drawing: DrawingData): WindowElevationData[] {
    const windows: WindowElevationData[] = [];
    
    // Look for window symbols
    const windowSymbols = drawing.symbols.filter(s => 
      s.name.toLowerCase().includes('window') ||
      s.name.toLowerCase().includes('win') ||
      s.category.toLowerCase().includes('window')
    );
    
    for (const symbol of windowSymbols) {
      windows.push({
        id: symbol.id,
        position: symbol.position,
        width: this.extractWindowWidth(symbol),
        height: this.extractWindowHeight(symbol),
        type: this.extractWindowType(symbol)
      });
    }
    
    // Look for window annotations
    const windowPatterns = [
      /window\s*(\d+)/i,
      /w\s*(\d+)/i,
      /window\s*size\s*[:=]?\s*(\d+)\s*[x×]\s*(\d+)/i,
      /(\d+)\s*[x×]\s*(\d+)\s*window/i
    ];
    
    for (const text of drawing.textElements) {
      const contentLower = text.content.toLowerCase();
      if (contentLower.includes('window') || contentLower.includes('w/')) {
        for (const pattern of windowPatterns) {
          const match = text.content.match(pattern);
          if (match) {
            const width = parseFloat(match[1]);
            const height = match[2] ? parseFloat(match[2]) : 1200;
            
            // Check if already exists
            const existing = windows.find(w => 
              Math.abs(w.position.x - text.position.x) < 50 && 
              Math.abs(w.position.y - text.position.y) < 50
            );
            
            if (!existing && width > 0 && width < 5000) {
              windows.push({
                id: text.id,
                position: text.position,
                width,
                height,
                type: 'fixed'
              });
            }
            break;
          }
        }
      }
    }
    
    return windows;
  }

  /**
   * Extract window width from symbol
   */
  private extractWindowWidth(symbol: SymbolInfo): number | null {
    if (symbol.properties) {
      const width = symbol.properties['width'] || symbol.properties['windowWidth'];
      if (typeof width === 'number') return width;
    }
    
    const name = symbol.name.toLowerCase();
    const match = name.match(/(\d{3,4})/);
    if (match) return parseFloat(match[1]);
    
    return null;
  }

  /**
   * Extract window height from symbol
   */
  private extractWindowHeight(symbol: SymbolInfo): number | null {
    if (symbol.properties) {
      const height = symbol.properties['height'] || symbol.properties['windowHeight'];
      if (typeof height === 'number') return height;
    }
    
    return 1200; // Default standard
  }

  /**
   * Extract window type
   */
  private extractWindowType(symbol: SymbolInfo): string {
    const name = symbol.name.toLowerCase();
    if (name.includes('sliding')) return 'sliding';
    if (name.includes('casement')) return 'casement';
    if (name.includes('fixed')) return 'fixed';
    if (name.includes('awning')) return 'awning';
    return 'unknown';
  }

  /**
   * Extract doors from drawing
   */
  private extractDoors(drawing: DrawingData): DoorElevationData[] {
    const doors: DoorElevationData[] = [];
    
    // Look for door symbols
    const doorSymbols = drawing.symbols.filter(s => 
      s.name.toLowerCase().includes('door') ||
      s.category.toLowerCase().includes('door')
    );
    
    for (const symbol of doorSymbols) {
      doors.push({
        id: symbol.id,
        position: symbol.position,
        width: this.extractDoorWidth(symbol),
        height: 2100 // Default
      });
    }
    
    return doors;
  }

  /**
   * Extract door width from symbol
   */
  private extractDoorWidth(symbol: SymbolInfo): number | null {
    if (symbol.properties) {
      const width = symbol.properties['width'] || symbol.properties['doorWidth'];
      if (typeof width === 'number') return width;
    }
    
    const name = symbol.name.toLowerCase();
    if (name.includes('900')) return 900;
    if (name.includes('800')) return 800;
    if (name.includes('750')) return 750;
    
    return null;
  }

  /**
   * Extract roof pitch
   */
  private extractRoofPitch(drawing: DrawingData, _textContent: string[]): number | null {
    // Look for pitch in text
    const pitchPatterns = [
      /(\d+)\s*°/i,  // e.g., 30°
      /pitch\s*[:=]?\s*(\d+)/i,
      /(\d+)\s*degrees?/i,
      /(\d+)\s*deg/i
    ];
    
    for (const text of drawing.textElements) {
      for (const pattern of pitchPatterns) {
        const match = text.content.match(pattern);
        if (match) {
          const pitch = parseFloat(match[1]);
          if (pitch > 0 && pitch < 90) {
            return pitch;
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Extract roof material
   */
  private extractRoofMaterial(drawing: DrawingData, _textContent: string[]): string | null {
    const _materialPatterns = [
      /roof\s*material\s*[:=]?\s*(\w+)/i,
      /roofing\s*[:=]?\s*(\w+)/i,
      /(\w+)\s*roof/i
    ];
    
    const roofMaterials = ['tile', 'sheet', 'concrete', 'metal', 'zinc', 'corrugated', 'IBR', 'shingle', 'thatch', 'slate'];
    
    for (const text of drawing.textElements) {
      const contentLower = text.content.toLowerCase();
      
      // Check for specific roof materials
      for (const material of roofMaterials) {
        if (contentLower.includes(material)) {
          return material;
        }
      }
    }
    
    return null;
  }

  /**
   * Extract external finishes
   */
  private extractExternalFinishes(drawing: DrawingData, _textContent: string[]): ExternalFinishData[] {
    const finishes: ExternalFinishData[] = [];
    
    const finishPatterns = [
      /external\s*finish/i,
      /wall\s*finish/i,
      /render/i,
      /plaster/i,
      /brick/i,
      /paint/i,
      /coating/i
    ];
    
    const materials = ['brick', 'render', 'plaster', 'paint', 'stone', 'cladding', 'wood', 'cement'];
    const colors = ['white', 'cream', 'grey', 'brown', 'tan', 'beige', 'red', 'blue', 'green'];
    
    for (const text of drawing.textElements) {
      const contentLower = text.content.toLowerCase();
      
      for (const pattern of finishPatterns) {
        if (pattern.test(contentLower)) {
          let material: string | null = null;
          let color: string | null = null;
          
          for (const m of materials) {
            if (contentLower.includes(m)) {
              material = m;
              break;
            }
          }
          
          for (const c of colors) {
            if (contentLower.includes(c)) {
              color = c;
              break;
            }
          }
          
          if (material || color) {
            finishes.push({
              material,
              color,
              position: text.position,
              label: text.content
            });
          }
          break;
        }
      }
    }
    
    return finishes;
  }

  /**
   * Extract fire ratings
   */
  private extractFireRatings(drawing: DrawingData, _textContent: string[]): FireRatingData[] {
    const ratings: FireRatingData[] = [];
    
    const ratingPatterns = [
      /fire\s*rating/i,
      /(\d+)\s*min/i,
      /fd\s*(\d+)/i,
      /(\d+)\s*minute/i,
      /fr/i
    ];
    
    for (const text of drawing.textElements) {
      const _contentLower = text.content.toLowerCase();
      
      for (const pattern of ratingPatterns) {
        const match = text.content.match(pattern);
        if (match) {
          const value = parseFloat(match[1]);
          if (value > 0) {
            ratings.push({
              value,
              unit: 'minutes',
              element: 'wall', // Default
              position: text.position,
              label: text.content
            });
          }
          break;
        }
      }
    }
    
    return ratings;
  }

  /**
   * Extract fire separation
   */
  private extractFireSeparation(drawing: DrawingData, _textContent: string[]): number | null {
    const separationPatterns = [
      /fire\s*separation\s*[:=]?\s*(\d+)/i,
      /separation\s*[:=]?\s*(\d+)\s*mm/i,
      /(\d+)\s*mm\s*to\s*boundary/i,
      /boundary\s*(\d+)/i
    ];
    
    for (const text of drawing.textElements) {
      for (const pattern of separationPatterns) {
        const match = text.content.match(pattern);
        if (match) {
          const value = parseFloat(match[1]);
          if (value > 0 && value < 10000) {
            return value;
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Extract shading
   */
  private extractShading(drawing: DrawingData, _textContent: string[]): ShadingData {
    const shading: ShadingData = {
      overhangs: false,
      verticalBlades: false,
      pergola: false,
      trees: false,
      screens: false
    };
    
    const shadingPatterns = [
      { pattern: /overhang/i, key: 'overhangs' as const },
      { pattern: /pergola/i, key: 'pergola' as const },
      { pattern: /blade/i, key: 'verticalBlades' as const },
      { pattern: /tree/i, key: 'trees' as const },
      { pattern: /screen/i, key: 'screens' as const },
      { pattern: /shading/i, key: 'overhangs' as const },
      { pattern: /louvre/i, key: 'verticalBlades' as const },
      { pattern: /louver/i, key: 'verticalBlades' as const }
    ];
    
    for (const text of drawing.textElements) {
      const contentLower = text.content.toLowerCase();
      
      for (const { pattern, key } of shadingPatterns) {
        if (pattern.test(contentLower)) {
          shading[key] = true;
        }
      }
    }
    
    // Check symbols too
    for (const symbol of drawing.symbols) {
      const nameLower = symbol.name.toLowerCase();
      
      if (nameLower.includes('overhang') || nameLower.includes('brise')) {
        shading.overhangs = true;
      }
      if (nameLower.includes('pergola')) {
        shading.pergola = true;
      }
      if (nameLower.includes('blade') || nameLower.includes('louvre') || nameLower.includes('louver')) {
        shading.verticalBlades = true;
      }
    }
    
    return shading;
  }

  /**
   * Extract insulation
   */
  private extractInsulation(drawing: DrawingData, _textContent: string[]): boolean {
    const insulationPatterns = [
      /insulation/i,
      /insulated/i,
      /thermal\s*board/i,
      /polystyrene/i,
      /fibreglass/i,
      /mineral\s*wool/i,
      /iso board/i,
      /celotex/i
    ];
    
    for (const text of drawing.textElements) {
      const contentLower = text.content.toLowerCase();
      
      for (const pattern of insulationPatterns) {
        if (pattern.test(contentLower)) {
          return true;
        }
      }
    }
    
    // Check symbols
    for (const symbol of drawing.symbols) {
      if (symbol.name.toLowerCase().includes('insulation')) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Extract insulation R-value
   */
  private extractInsulationRValue(drawing: DrawingData, _textContent: string[]): number | null {
    const rValuePatterns = [
      /r\s*value\s*[:=]?\s*(\d+\.?\d*)/i,
      /r\s*[:=]?\s*(\d+\.?\d*)/i,
      /(\d+\.?\d*)\s*r\s*value/i,
      /r(\d+)/i
    ];
    
    for (const text of drawing.textElements) {
      for (const pattern of rValuePatterns) {
        const match = text.content.match(pattern);
        if (match) {
          const value = parseFloat(match[1]);
          if (value > 0 && value < 20) {
            return value;
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Extract drainage direction
   */
  private extractDrainageDirection(drawing: DrawingData, _textContent: string[]): string | null {
    const _drainagePatterns = [
      /drainage\s*direction/i,
      /drain\s*away/i,
      /slope\s*(\w+)/i,
      /fall\s*(\w+)/i,
      /(\w+)\s*drainage/i
    ];
    
    const directions = ['north', 'south', 'east', 'west', 'n', 's', 'e', 'w'];
    
    for (const text of drawing.textElements) {
      const contentLower = text.content.toLowerCase();
      
      for (const direction of directions) {
        if (contentLower.includes(direction) && 
            (contentLower.includes('drain') || contentLower.includes('slope') || contentLower.includes('fall'))) {
          return direction;
        }
      }
    }
    
    return null;
  }

  /**
   * Calculate wall area
   */
  private calculateWallArea(drawing: DrawingData): number {
    // Try to get from bounding box
    if (drawing.boundingBox) {
      const width = drawing.boundingBox.maxX - drawing.boundingBox.minX;
      const height = drawing.boundingBox.maxY - drawing.boundingBox.minY;
      
      // Estimate wall area (assuming elevation view)
      if (width > 0 && height > 0) {
        return width * height;
      }
    }
    
    // Default estimate
    return 50000000; // 50m² default
  }

  /**
   * Calculate glazing area
   */
  private calculateGlazingArea(windows: WindowElevationData[]): number {
    return windows.reduce((sum, w) => {
      if (w.width && w.height) {
        return sum + (w.width * w.height);
      }
      return sum;
    }, 0);
  }

  /**
   * Extract dimension value from text
   */
  private extractDimensionValue(text: string): number | null {
    const patterns = [
      /(\d+\.?\d*)\s*m/i,
      /(\d+)\s*mm/i,
      /(\d+\.?\d*)/
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let value = parseFloat(match[1]);
        
        // Convert to mm if in meters
        if (text.toLowerCase().includes('m') && !text.toLowerCase().includes('mm')) {
          value = value * 1000;
        }
        
        return value;
      }
    }
    
    return null;
  }

  // ============================================================================
  // Rule Evaluation Methods
  // ============================================================================

  /**
   * Evaluate a single elevation rule
   */
  private async evaluateElevationRule(
    rule: ComplianceRule,
    elevationData: ElevationAnalysisData,
    drawing: DrawingData,
    projectInfo: ProjectInfo
  ): Promise<ComplianceResult> {
    let passed = false;
    let value: string | number | boolean | undefined;
    let expected: string | number | boolean | undefined;
    let finding: Finding | undefined;

    switch (rule.id) {
      // Height & Ground Line (SANS 10400-A)
      case 'ELV-001': // Ground Line Shown
        passed = this.checkGroundLinesPresent(elevationData, rule, drawing);
        break;
        
      case 'ELV-002': // Building Height Dimensioned
        passed = this.checkBuildingHeightDimensioned(elevationData, rule, drawing);
        break;
        
      case 'ELV-003': // Building Height Within Maximum
        ({ passed, value, expected, finding } = this.checkBuildingHeightWithinLimits(elevationData, rule, drawing, projectInfo));
        break;
        
      // Fire Safety (SANS 10400-T)
      case 'ELV-004': // Fire Separation to Boundaries
        ({ passed, value, expected, finding } = this.checkFireSeparation(elevationData, rule, drawing));
        break;
        
      case 'ELV-005': // Fire Rating Indicated
        passed = this.checkFireRatingsIndicated(elevationData, rule, drawing);
        break;
        
      // Energy (SANS 10400-XA)
      case 'ELV-006': // Glazing Percentage Within Limits
        ({ passed, value, expected, finding } = this.checkGlazingPercentage(elevationData, rule, drawing));
        break;
        
      case 'ELV-007': // External Shading Indicated
        passed = this.checkExternalShading(elevationData, rule, drawing);
        break;
        
      case 'ELV-008': // Roof Insulation Specified
        ({ passed, value, expected, finding } = this.checkRoofInsulation(elevationData, rule, drawing));
        break;
        
      // General (SANS 10400-A)
      case 'ELV-009': // Roof Pitch and Material Shown
        passed = this.checkRoofPitchAndMaterial(elevationData, rule, drawing);
        break;
        
      case 'ELV-010': // External Finishes Specified
        passed = this.checkExternalFinishesSpecified(elevationData, rule, drawing);
        break;
        
      case 'ELV-011': // Drainage Direction Indicated
        passed = this.checkDrainageDirection(elevationData, rule, drawing);
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

  // ============================================================================
  // Individual Rule Check Methods
  // ============================================================================

  /**
   * ELV-001: Ground Line Shown (Natural and Finished)
   */
  private checkGroundLinesPresent(elevationData: ElevationAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    const groundLines = elevationData.groundLines;
    
    if (groundLines.length === 0) return false;
    
    // Check for both natural and finished ground lines
    const hasNatural = groundLines.some(g => g.type === 'natural');
    const hasFinished = groundLines.some(g => g.type === 'finished');
    
    return hasNatural || hasFinished;
  }

  /**
   * ELV-002: Building Height Dimensioned
   */
  private checkBuildingHeightDimensioned(elevationData: ElevationAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return elevationData.buildingHeight !== null && elevationData.buildingHeight > 0;
  }

  /**
   * ELV-003: Building Height Within Maximum for Zone
   */
  private checkBuildingHeightWithinLimits(
    elevationData: ElevationAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData,
    _projectInfo: ProjectInfo
  ): { passed: boolean; value?: number; expected?: number; finding?: Finding } {
    const height = elevationData.buildingHeight;
    
    if (height === null) {
      return { passed: false };
    }
    
    // Default maximum height based on zoning (8m for residential)
    const maxHeight = 8000;
    
    if (height > maxHeight) {
      return {
        passed: false,
        value: height,
        expected: maxHeight,
        finding: this.createElevationFinding(
          rule,
          `Building height (${(height / 1000).toFixed(2)}m) exceeds maximum allowed (${maxHeight / 1000}m) for residential zoning`,
          'critical',
          drawing,
          `Reduce building height to comply with by-law limits or apply for departure`
        )
      };
    }
    
    return { passed: true, value: height, expected: maxHeight };
  }

  /**
   * ELV-004: Fire Separation to Boundaries
   */
  private checkFireSeparation(
    elevationData: ElevationAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): { passed: boolean; value?: number; expected?: number; finding?: Finding } {
    const separation = elevationData.fireSeparation;
    
    if (separation === null) {
      // Check if fire ratings are indicated (alternative to separation)
      if (elevationData.fireRatings.length > 0) {
        return { passed: true };
      }
      
      return {
        passed: false,
        finding: this.createElevationFinding(
          rule,
          'Fire separation distance to boundaries not indicated',
          'high',
          drawing,
          'Indicate minimum 1m fire separation to boundaries or specify fire-rated construction'
        )
      };
    }
    
    const minRequired = 1000;
    
    if (separation < minRequired) {
      return {
        passed: false,
        value: separation,
        expected: minRequired,
        finding: this.createElevationFinding(
          rule,
          `Fire separation (${separation}mm) is less than minimum required 1000mm`,
          'high',
          drawing,
          'Increase fire separation to minimum 1m or provide fire-rated construction'
        )
      };
    }
    
    return { passed: true, value: separation, expected: minRequired };
  }

  /**
   * ELV-005: Fire Rating Indicated for Elements
   */
  private checkFireRatingsIndicated(elevationData: ElevationAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    // If fire ratings are shown or fire separation is adequate, it's compliant
    return elevationData.fireRatings.length > 0 || elevationData.fireSeparation !== null;
  }

  /**
   * ELV-006: Glazing Percentage Within Limits
   */
  private checkGlazingPercentage(
    elevationData: ElevationAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): { passed: boolean; value?: number; expected?: number; finding?: Finding } {
    const percentage = elevationData.glazingPercentage;
    const maxAllowed = ENERGY_DTS.glazing.maxGlazingRatio * 100; // 50%
    
    if (percentage > maxAllowed) {
      return {
        passed: false,
        value: percentage,
        expected: maxAllowed,
        finding: this.createElevationFinding(
          rule,
          `Glazing percentage (${percentage.toFixed(1)}%) exceeds maximum allowed ${maxAllowed}% for energy compliance`,
          'high',
          drawing,
          `Reduce glazing area or add external shading to meet SANS 10400-XA requirements`
        )
      };
    }
    
    return { passed: true, value: percentage, expected: maxAllowed };
  }

  /**
   * ELV-007: External Shading Indicated
   */
  private checkExternalShading(elevationData: ElevationAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    const shading = elevationData.shading;
    
    return shading.overhangs || shading.pergola || shading.verticalBlades || shading.screens || shading.trees;
  }

  /**
   * ELV-008: Roof Insulation Specified
   */
  private checkRoofInsulation(
    elevationData: ElevationAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): { passed: boolean; value?: number; expected?: number; finding?: Finding } {
    const hasInsulation = elevationData.insulationSpecified;
    const rValue = elevationData.insulationRValue;
    const minRValue = ENERGY_DTS.roofs.minRValue; // 3.7
    
    if (!hasInsulation) {
      return {
        passed: false,
        finding: this.createElevationFinding(
          rule,
          'Roof insulation not specified',
          'high',
          drawing,
          'Specify roof insulation with minimum R-value of 3.7 W/m²K as per SANS 10400-XA'
        )
      };
    }
    
    // If R-value is specified, verify it meets minimum
    if (rValue !== null && rValue < minRValue) {
      return {
        passed: false,
        value: rValue,
        expected: minRValue,
        finding: this.createElevationFinding(
          rule,
          `Roof insulation R-value (${rValue} W/m²K) is less than minimum required ${minRValue} W/m²K`,
          'high',
          drawing,
          'Increase roof insulation to meet minimum R-value requirement'
        )
      };
    }
    
    return { passed: true, value: rValue ?? undefined, expected: minRValue };
  }

  /**
   * ELV-009: Roof Pitch and Material Shown
   */
  private checkRoofPitchAndMaterial(elevationData: ElevationAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    const hasPitch = elevationData.roofPitch !== null;
    const hasMaterial = elevationData.roofMaterial !== null;
    
    return hasPitch || hasMaterial;
  }

  /**
   * ELV-010: External Finishes Specified
   */
  private checkExternalFinishesSpecified(elevationData: ElevationAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return elevationData.externalFinishes.length > 0;
  }

  /**
   * ELV-011: Drainage Direction Indicated
   */
  private checkDrainageDirection(elevationData: ElevationAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return elevationData.drainageDirection !== null;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Create a finding for elevation analysis
   */
  private createElevationFinding(
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
    const elevationData = this.extractElevationData(context.drawing, context.projectInfo);
    return this.evaluateElevationRule(rule, elevationData, context.drawing, context.projectInfo);
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface GroundLineData {
  type: 'natural' | 'finished';
  position: { x: number; y: number };
  value: number | null;
  label: string;
}

interface HeightDimensionData {
  id: string;
  value: number;
  unit: string;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  layer?: string;
  label?: string;
}

interface WindowElevationData {
  id: string;
  position: { x: number; y: number };
  width: number | null;
  height: number | null;
  type: string;
}

interface DoorElevationData {
  id: string;
  position: { x: number; y: number };
  width: number | null;
  height: number | null;
}

interface ExternalFinishData {
  material: string | null;
  color: string | null;
  position: { x: number; y: number };
  label: string;
}

interface FireRatingData {
  value: number;
  unit: string;
  element: string;
  position: { x: number; y: number };
  label: string;
}

interface ShadingData {
  overhangs: boolean;
  verticalBlades: boolean;
  pergola: boolean;
  trees: boolean;
  screens: boolean;
}

interface ElevationAnalysisData {
  groundLines: GroundLineData[];
  heightDimensions: HeightDimensionData[];
  buildingHeight: number | null;
  windows: WindowElevationData[];
  doors: DoorElevationData[];
  roofPitch: number | null;
  roofMaterial: string | null;
  externalFinishes: ExternalFinishData[];
  fireRatings: FireRatingData[];
  fireSeparation: number | null;
  shading: ShadingData;
  insulationSpecified: boolean;
  insulationRValue: number | null;
  drainageDirection: string | null;
  wallArea: number;
  glazingArea: number;
  glazingPercentage: number;
  textContent: string[];
  annotations: string[];
  symbols: SymbolInfo[];
  layers: LayerInfo[];
  dimensions: ExtractedDimension[];
}

// Export the agent
export default ElevationComplianceAgent;
