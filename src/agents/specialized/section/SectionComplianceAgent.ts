/**
 * SectionComplianceAgent
 * 
 * Validates section drawings against SANS 10400-A, K, L, J requirements.
 * Performs compliance checks including foundation depth, wall/floor/roof construction,
 * fire ratings, thermal insulation, ceiling heights, floor levels, DPC, and ventilation.
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
// SANS 10400 Section Rules (12 rules total)
// ============================================================================

const SECTION_RULES: ComplianceRule[] = [
  // --------------------------------------------------------------------------
  // Construction (SANS 10400-A, K) - SEC-001 to SEC-004
  // --------------------------------------------------------------------------
  {
    id: 'SEC-001',
    name: 'Foundation Depth Indicated',
    description: 'Foundation depth must be clearly indicated on section drawings',
    standard: 'SANS 10400-A',
    part: 'Part A',
    category: 'section',
    severity: Severity.CRITICAL,
    checkType: 'presence',
    requirement: 'Foundation depth must be shown with dimension indicating depth below ground level',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'SEC-002',
    name: 'Wall Construction Build-up Shown',
    description: 'Wall construction layers must be clearly shown with materials and thicknesses',
    standard: 'SANS 10400-A',
    part: 'Part A',
    category: 'section',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'Wall build-up must show all layers including finish, structure, and insulation where applicable',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'SEC-003',
    name: 'Floor Build-up Indicated',
    description: 'Floor construction build-up must be shown with all layers',
    standard: 'SANS 10400-K',
    part: 'Part K',
    category: 'section',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'Floor build-up must show subfloor, slab, damp proof membrane, and floor finish',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'SEC-004',
    name: 'Roof Structure Detailed',
    description: 'Roof structure must be detailed showing members, sizes, and connections',
    standard: 'SANS 10400-A',
    part: 'Part A',
    category: 'section',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'Roof structure must show rafters, beams, columns, and connection details',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // --------------------------------------------------------------------------
  // Fire Ratings (SANS 10400-L) - SEC-005 to SEC-006
  // --------------------------------------------------------------------------
  {
    id: 'SEC-005',
    name: 'Fire Resistance Periods Indicated',
    description: 'Fire resistance periods for structural elements must be indicated',
    standard: 'SANS 10400-L',
    part: 'Part L',
    category: 'section',
    severity: Severity.CRITICAL,
    checkType: 'presence',
    requirement: 'Fire resistance ratings (30/60/90/120 minutes) must be indicated on walls, floors, columns',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'SEC-006',
    name: 'Fire Stopping Details Shown',
    description: 'Fire stopping details at service penetrations must be shown',
    standard: 'SANS 10400-L',
    part: 'Part L',
    category: 'section',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'Fire stopping details for pipe penetrations, electrical services, and ductwork must be shown',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // --------------------------------------------------------------------------
  // Energy (SANS 10400-XA) - SEC-007 to SEC-008
  // --------------------------------------------------------------------------
  {
    id: 'SEC-007',
    name: 'Thermal Insulation Specified',
    description: 'Thermal insulation must be specified for walls, roof, and floor',
    standard: 'SANS 10400-XA',
    part: 'Part XA',
    category: 'section',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'Thermal insulation must be specified in wall, roof, and floor sections',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'SEC-008',
    name: 'Insulation R-values Indicated',
    description: 'R-values for all insulated elements must be indicated',
    standard: 'SANS 10400-XA',
    part: 'Part XA',
    category: 'section',
    severity: Severity.HIGH,
    checkType: 'calculation',
    requirement: 'R-values must be shown for walls (min 1.7), roof (min 3.7), floor (min 0.75)',
    thresholds: {
      min: 1.7,
      unit: 'W/m²K',
      comparison: 'greater_than'
    },
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // --------------------------------------------------------------------------
  // General (SANS 10400-A, J) - SEC-009 to SEC-012
  // --------------------------------------------------------------------------
  {
    id: 'SEC-009',
    name: 'Ceiling Heights Verified',
    description: 'Ceiling heights must be verified to meet minimum requirements',
    standard: 'SANS 10400-A',
    part: 'Part A',
    category: 'section',
    severity: Severity.CRITICAL,
    checkType: 'dimension',
    requirement: 'Minimum ceiling height 2400mm for habitable rooms, 2100mm for non-habitable',
    thresholds: {
      min: 2400,
      unit: 'mm',
      comparison: 'greater_than'
    },
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'SEC-010',
    name: 'Floor Levels Indicated',
    description: 'Floor levels must be clearly indicated relative to datum',
    standard: 'SANS 10400-A',
    part: 'Part A',
    category: 'section',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'Floor levels must be shown with RL (reduced level) values relative to benchmark',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'SEC-011',
    name: 'Damp Proof Course Shown',
    description: 'Damp proof course (DPC) position and type must be indicated',
    standard: 'SANS 10400-A',
    part: 'Part A',
    category: 'section',
    severity: Severity.CRITICAL,
    checkType: 'presence',
    requirement: 'DPC must be shown at minimum 150mm above finished ground level',
    thresholds: {
      min: 150,
      unit: 'mm',
      comparison: 'greater_than'
    },
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'SEC-012',
    name: 'Ventilation Provisions',
    description: 'Ventilation provisions for roof space and subfloor must be indicated',
    standard: 'SANS 10400-J',
    part: 'Part J',
    category: 'section',
    severity: Severity.MEDIUM,
    checkType: 'presence',
    requirement: 'Roof ventilation (eaves vents, ridge vents) and subfloor ventilation must be indicated',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  }
];

// ============================================================================
// Agent Configuration
// ============================================================================

const DEFAULT_CONFIG: AgentConfig = {
  id: 'section-compliance-agent',
  name: 'Section Compliance Agent',
  description: 'Validates section drawings against SANS 10400-A, K, L, J, XA requirements',
  version: '1.0.0',
  enabled: true,
  maxRetries: 3,
  timeout: 30000,
  priority: 2,
  capabilities: [
    'section-validation',
    'foundation-verification',
    'construction-build-up-check',
    'fire-rating-validation',
    'thermal-insulation-check',
    'ceiling-height-verification',
    'dpc-verification'
  ],
  supportedDrawingTypes: [DrawingType.SECTION],
  supportedStandards: ['SANS 10400-A', 'SANS 10400-K', 'SANS 10400-L', 'SANS 10400-J', 'SANS 10400-XA']
};

// ============================================================================
// Agent Implementation
// ============================================================================

export class SectionComplianceAgent extends Agent {
  private sectionRules: ComplianceRule[];

  constructor(config: Partial<AgentConfig> = {}) {
    super({ ...DEFAULT_CONFIG, ...config });
    this.sectionRules = SECTION_RULES;
  }

  /**
   * Get rule IDs for this agent
   */
  getRuleIds(): string[] {
    return this.sectionRules.map(rule => rule.id);
  }

  /**
   * Load rules for this agent
   */
  protected async loadRules(): Promise<void> {
    this.rules = this.sectionRules;
  }

  /**
   * Analyze a section drawing for SANS 10400 compliance
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
      const sectionData = this.extractSectionData(drawing, projectInfo);

      // Run each compliance check
      for (const rule of this.sectionRules) {
        const result = await this.evaluateSectionRule(rule, sectionData, drawing, projectInfo);
        
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
        this.sectionRules.map(rule => ({
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
          analysisType: 'section-compliance',
          foundationDepthFound: sectionData.foundationDepth !== null,
          wallBuildUpFound: sectionData.wallBuildUp.length > 0,
          floorBuildUpFound: sectionData.floorBuildUp.length > 0,
          roofStructureFound: sectionData.roofStructure !== null,
          fireRatingsFound: sectionData.fireRatings.length > 0,
          insulationSpecified: sectionData.insulationSpecified,
          ceilingHeightsFound: sectionData.ceilingHeights.length > 0,
          dpcFound: sectionData.dpcIndicated,
          ventilationFound: sectionData.ventilationIndicated
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
          analysisType: 'section-compliance',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Extract section data from drawing and project info
   */
  private extractSectionData(drawing: DrawingData, _projectInfo: ProjectInfo): SectionAnalysisData {
    // Extract text elements
    const textContent = drawing.textElements.map(t => t.content.toLowerCase());
    const _annotations = drawing.annotations.map(a => a.content.toLowerCase());
    
    // Extract foundation information
    const foundationDepth = this.extractFoundationDepth(drawing);
    const foundationType = this.extractFoundationType(drawing, textContent);
    
    // Extract wall construction
    const wallBuildUp = this.extractWallBuildUp(drawing, textContent);
    const wallThickness = this.extractWallThickness(drawing, textContent);
    
    // Extract floor construction
    const floorBuildUp = this.extractFloorBuildUp(drawing, textContent);
    
    // Extract roof structure
    const roofStructure = this.extractRoofStructure(drawing, textContent);
    
    // Extract fire ratings
    const fireRatings = this.extractFireRatings(drawing, textContent);
    
    // Extract fire stopping
    const fireStopping = this.extractFireStopping(drawing, textContent);
    
    // Extract insulation
    const insulationSpecified = this.extractInsulation(drawing, textContent);
    const insulationRValues = this.extractInsulationRValues(drawing, textContent);
    
    // Extract ceiling heights
    const ceilingHeights = this.extractCeilingHeights(drawing);
    
    // Extract floor levels
    const floorLevels = this.extractFloorLevels(drawing);
    
    // Extract DPC
    const dpcIndicated = this.extractDPC(drawing, textContent);
    const dpcHeight = this.extractDPHeight(drawing, textContent);
    
    // Extract ventilation
    const ventilationIndicated = this.extractVentilation(drawing, textContent);
    
    return {
      foundationDepth,
      foundationType,
      wallBuildUp,
      wallThickness,
      floorBuildUp,
      roofStructure,
      fireRatings,
      fireStopping,
      insulationSpecified,
      insulationRValues,
      ceilingHeights,
      floorLevels,
      dpcIndicated,
      dpcHeight,
      ventilationIndicated,
      textContent: drawing.textElements.map(t => t.content),
      annotations: drawing.annotations.map(a => a.content),
      symbols: drawing.symbols,
      layers: drawing.layers,
      dimensions: drawing.dimensions
    };
  }

  /**
   * Extract foundation depth
   */
  private extractFoundationDepth(drawing: DrawingData): number | null {
    const depthPatterns = [
      /foundation\s*depth\s*[:=]?\s*(\d+)/i,
      /depth\s*[:=]?\s*(\d+)\s*mm/i,
      /fdn\s*depth/i,
      /(\d+)\s*mm\s*deep/i,
      /(\d+)\s*m\s*deep/i,
      /(\d{3,4})\s*mm/i
    ];
    
    for (const text of drawing.textElements) {
      for (const pattern of depthPatterns) {
        const match = text.content.match(pattern);
        if (match) {
          let value = parseFloat(match[1]);
          
          // Convert meters to mm if needed
          if (text.content.toLowerCase().includes('m') && !text.content.toLowerCase().includes('mm')) {
            value = value * 1000;
          }
          
          if (value > 0 && value < 5000) {
            return value;
          }
        }
      }
    }
    
    // Check dimensions
    for (const dim of drawing.dimensions) {
      if (dim.type === 'linear' && dim.value > 0 && dim.value < 5000) {
        return dim.value;
      }
    }
    
    return null;
  }

  /**
   * Extract foundation type
   */
  private extractFoundationType(drawing: DrawingData, _textContent: string[]): string | null {
    const foundationTypes = ['strip', 'raft', 'pad', 'pile', ' pier', 'column'];
    
    for (const text of drawing.textElements) {
      const contentLower = text.content.toLowerCase();
      
      for (const type of foundationTypes) {
        if (contentLower.includes('foundation') && contentLower.includes(type)) {
          return type;
        }
      }
    }
    
    return null;
  }

  /**
   * Extract wall build-up
   */
  private extractWallBuildUp(drawing: DrawingData, _textContent: string[]): WallLayerData[] {
    const layers: WallLayerData[] = [];
    
    const wallMaterials = ['brick', 'block', 'concrete', 'plaster', 'render', 'drywall', 'gyproc', 'steel', 'timber'];
    const _finishMaterials = ['paint', 'plaster', 'render', 'tile', 'brick', 'stone'];
    
    for (const text of drawing.textElements) {
      const contentLower = text.content.toLowerCase();
      
      if (contentLower.includes('wall') || contentLower.includes('brick') || contentLower.includes('block')) {
        for (const material of wallMaterials) {
          if (contentLower.includes(material)) {
            layers.push({
              material,
              thickness: this.extractThickness(text.content),
              position: text.position,
              type: contentLower.includes('finish') ? 'finish' : 'structure'
            });
            break;
          }
        }
      }
    }
    
    return layers;
  }

  /**
   * Extract wall thickness
   */
  private extractWallThickness(drawing: DrawingData, _textContent: string[]): number | null {
    const thicknessPatterns = [
      /wall\s*thickness\s*[:=]?\s*(\d+)/i,
      /(\d+)\s*mm\s*wall/i,
      /thickness\s*[:=]?\s*(\d+)/i
    ];
    
    for (const text of drawing.textElements) {
      for (const pattern of thicknessPatterns) {
        const match = text.content.match(pattern);
        if (match) {
          const value = parseFloat(match[1]);
          if (value > 0 && value < 500) {
            return value;
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Extract floor build-up
   */
  private extractFloorBuildUp(drawing: DrawingData, _textContent: string[]): FloorLayerData[] {
    const layers: FloorLayerData[] = [];
    
    const floorMaterials = ['slab', 'concrete', 'screed', 'tile', 'carpet', 'wood', 'timber', 'dpm', 'membrane', 'gravel', 'backfill'];
    
    for (const text of drawing.textElements) {
      const contentLower = text.content.toLowerCase();
      
      if (contentLower.includes('floor') || contentLower.includes('slab') || contentLower.includes('ground')) {
        for (const material of floorMaterials) {
          if (contentLower.includes(material)) {
            layers.push({
              material,
              thickness: this.extractThickness(text.content),
              position: text.position
            });
            break;
          }
        }
      }
    }
    
    return layers;
  }

  /**
   * Extract roof structure
   */
  private extractRoofStructure(drawing: DrawingData, _textContent: string[]): RoofStructureData | null {
    const structureTypes = ['truss', 'rafter', 'beam', 'portal', 'steel', 'timber', 'concrete'];
    
    for (const text of drawing.textElements) {
      const contentLower = text.content.toLowerCase();
      
      if (contentLower.includes('roof') || contentLower.includes('structure')) {
        for (const type of structureTypes) {
          if (contentLower.includes(type)) {
            return {
              type,
              material: contentLower.includes('steel') ? 'steel' : contentLower.includes('timber') ? 'timber' : 'concrete',
              position: text.position,
              spans: this.extractSpan(text.content)
            };
          }
        }
      }
    }
    
    // Check symbols
    for (const symbol of drawing.symbols) {
      const nameLower = symbol.name.toLowerCase();
      if (nameLower.includes('truss') || nameLower.includes('rafter')) {
        return {
          type: nameLower.includes('truss') ? 'truss' : 'rafter',
          material: 'timber',
          position: symbol.position,
          spans: null
        };
      }
    }
    
    return null;
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
      /(\d+)\s*min\s*fr/i,
      /fr\s*(\d+)/i
    ];
    
    for (const text of drawing.textElements) {
      const contentLower = text.content.toLowerCase();
      
      if (contentLower.includes('fire') || contentLower.includes('fr')) {
        for (const pattern of ratingPatterns) {
          const match = text.content.match(pattern);
          if (match) {
            const value = parseFloat(match[1]);
            if (value > 0 && value <= 240) {
              // Determine element type
              let element = 'wall';
              if (contentLower.includes('floor')) element = 'floor';
              if (contentLower.includes('column')) element = 'column';
              if (contentLower.includes('beam')) element = 'beam';
              if (contentLower.includes('roof')) element = 'roof';
              
              ratings.push({
                value,
                unit: 'minutes',
                element,
                position: text.position,
                label: text.content
              });
            }
            break;
          }
        }
      }
    }
    
    return ratings;
  }

  /**
   * Extract fire stopping
   */
  private extractFireStopping(drawing: DrawingData, _textContent: string[]): boolean {
    const fireStoppingPatterns = [
      /fire\s*stop/i,
      /fire\s*penetration/i,
      /fire\s*seal/i,
      /fire\s* collar/i,
      /intumescent/i
    ];
    
    for (const text of drawing.textElements) {
      const contentLower = text.content.toLowerCase();
      
      for (const pattern of fireStoppingPatterns) {
        if (pattern.test(contentLower)) {
          return true;
        }
      }
    }
    
    return false;
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
      /iso\s*board/i,
      /celotex/i,
      /rockwool/i
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
   * Extract insulation R-values
   */
  private extractInsulationRValues(drawing: DrawingData, _textContent: string[]): InsulationRValueData[] {
    const rValues: InsulationRValueData[] = [];
    
    const rValuePatterns = [
      /r\s*value\s*[:=]?\s*(\d+\.?\d*)/i,
      /r\s*[:=]?\s*(\d+\.?\d*)/i,
      /(\d+\.?\d*)\s*r\s*value/i,
      /r(\d+)/i
    ];
    
    const elementTypes = ['wall', 'roof', 'ceiling', 'floor'];
    
    for (const text of drawing.textElements) {
      for (const pattern of rValuePatterns) {
        const match = text.content.match(pattern);
        if (match) {
          const value = parseFloat(match[1]);
          if (value > 0 && value < 20) {
            // Determine element type
            let element = 'wall';
            const contentLower = text.content.toLowerCase();
            
            for (const type of elementTypes) {
              if (contentLower.includes(type)) {
                element = type;
                break;
              }
            }
            
            rValues.push({
              element,
              value,
              unit: 'W/m²K',
              position: text.position,
              label: text.content
            });
          }
          break;
        }
      }
    }
    
    return rValues;
  }

  /**
   * Extract ceiling heights
   */
  private extractCeilingHeights(drawing: DrawingData): CeilingHeightData[] {
    const heights: CeilingHeightData[] = [];
    
    const heightPatterns = [
      /ceiling\s*height\s*[:=]?\s*(\d+)/i,
      /(\d+)\s*mm\s*ceiling/i,
      /height\s*to\s*ceiling/i,
      /(\d+\.?\d*)\s*m\s*high/i
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
          
          if (value > 0 && value < 5000) {
            heights.push({
              value,
              unit: 'mm',
              location: this.extractLocation(text.content),
              position: text.position
            });
          }
          break;
        }
      }
    }
    
    // Also check dimensions for vertical dimensions
    for (const dim of drawing.dimensions) {
      if (dim.type === 'linear' && dim.value > 1500 && dim.value < 5000) {
        heights.push({
          value: dim.value,
          unit: dim.unit,
          location: 'general',
          position: dim.startPoint
        });
      }
    }
    
    return heights;
  }

  /**
   * Extract floor levels
   */
  private extractFloorLevels(drawing: DrawingData): FloorLevelData[] {
    const levels: FloorLevelData[] = [];
    
    const levelPatterns = [
      /rl\s*[:=]?\s*(\d+\.?\d*)/i,
      /floor\s*level\s*[:=]?\s*(\d+\.?\d*)/i,
      /(\d+\.?\d*)\s*rl/i,
      /level\s*[:=]?\s*(\d+\.?\d*)/i,
      /(\+\d+\.?\d*)/i
    ];
    
    for (const text of drawing.textElements) {
      for (const pattern of levelPatterns) {
        const match = text.content.match(pattern);
        if (match) {
          const value = parseFloat(match[1]);
          
          levels.push({
            value,
            position: text.position,
            label: text.content
          });
          break;
        }
      }
    }
    
    return levels;
  }

  /**
   * Extract DPC
   */
  private extractDPC(drawing: DrawingData, _textContent: string[]): boolean {
    const dpcPatterns = [
      /dpc/i,
      /damp\s*proof\s*course/i,
      /damp\s*proof/i,
      /dpm/i
    ];
    
    for (const text of drawing.textElements) {
      const contentLower = text.content.toLowerCase();
      
      for (const pattern of dpcPatterns) {
        if (pattern.test(contentLower)) {
          return true;
        }
      }
    }
    
    // Check symbols
    for (const symbol of drawing.symbols) {
      if (symbol.name.toLowerCase().includes('dpc') || symbol.name.toLowerCase().includes('damp')) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Extract DPC height
   */
  private extractDPHeight(drawing: DrawingData, _textContent: string[]): number | null {
    const heightPatterns = [
      /dpc.*(\d+)\s*mm/i,
      /(\d+)\s*mm.*above/i,
      /above.*(\d+)\s*mm/i,
      /(\d+)\s*mm\s*from/i
    ];
    
    for (const text of drawing.textElements) {
      for (const pattern of heightPatterns) {
        const match = text.content.match(pattern);
        if (match) {
          const value = parseFloat(match[1]);
          if (value > 0 && value < 1000) {
            return value;
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Extract ventilation
   */
  private extractVentilation(drawing: DrawingData, _textContent: string[]): boolean {
    const ventilationPatterns = [
      /ventilation/i,
      /vent/i,
      /eaves\s*vent/i,
      /ridge\s*vent/i,
      /subfloor\s*vent/i,
      /roof\s*vent/i,
      /louvre/i,
      /grille/i
    ];
    
    for (const text of drawing.textElements) {
      const contentLower = text.content.toLowerCase();
      
      for (const pattern of ventilationPatterns) {
        if (pattern.test(contentLower)) {
          return true;
        }
      }
    }
    
    // Check symbols
    for (const symbol of drawing.symbols) {
      const nameLower = symbol.name.toLowerCase();
      if (nameLower.includes('vent') || nameLower.includes('louvre')) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Extract thickness from text
   */
  private extractThickness(text: string): number | null {
    const patterns = [
      /(\d+)\s*mm/i,
      /(\d+\.?\d*)\s*cm/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let value = parseFloat(match[1]);
        
        // Convert cm to mm if needed
        if (text.toLowerCase().includes('cm') && !text.toLowerCase().includes('mm')) {
          value = value * 10;
        }
        
        return value;
      }
    }
    
    return null;
  }

  /**
   * Extract span from text
   */
  private extractSpan(text: string): number | null {
    const patterns = [
      /span\s*[:=]?\s*(\d+)/i,
      /(\d+)\s*mm\s*span/i,
      /(\d+\.?\d*)\s*m\s*span/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let value = parseFloat(match[1]);
        
        // Convert meters to mm if needed
        if (text.toLowerCase().includes('m') && !text.toLowerCase().includes('mm')) {
          value = value * 1000;
        }
        
        return value;
      }
    }
    
    return null;
  }

  /**
   * Extract location from text
   */
  private extractLocation(text: string): string {
    const locations = ['bedroom', 'living', 'kitchen', 'bathroom', 'wc', 'hall', 'garage', 'store'];
    const contentLower = text.toLowerCase();
    
    for (const loc of locations) {
      if (contentLower.includes(loc)) {
        return loc;
      }
    }
    
    return 'general';
  }

  // ============================================================================
  // Rule Evaluation Methods
  // ============================================================================

  /**
   * Evaluate a single section rule
   */
  private async evaluateSectionRule(
    rule: ComplianceRule,
    sectionData: SectionAnalysisData,
    drawing: DrawingData,
    _projectInfo: ProjectInfo
  ): Promise<ComplianceResult> {
    let passed = false;
    let value: string | number | boolean | undefined;
    let expected: string | number | boolean | undefined;
    let finding: Finding | undefined;

    switch (rule.id) {
      // Construction (SANS 10400-A, K)
      case 'SEC-001': // Foundation Depth Indicated
        passed = this.checkFoundationDepthIndicated(sectionData, rule, drawing);
        break;
        
      case 'SEC-002': // Wall Construction Build-up Shown
        passed = this.checkWallBuildUpShown(sectionData, rule, drawing);
        break;
        
      case 'SEC-003': // Floor Build-up Indicated
        passed = this.checkFloorBuildUpIndicated(sectionData, rule, drawing);
        break;
        
      case 'SEC-004': // Roof Structure Detailed
        passed = this.checkRoofStructureDetailed(sectionData, rule, drawing);
        break;
        
      // Fire Ratings (SANS 10400-L)
      case 'SEC-005': // Fire Resistance Periods Indicated
        passed = this.checkFireResistanceIndicated(sectionData, rule, drawing);
        break;
        
      case 'SEC-006': // Fire Stopping Details Shown
        passed = this.checkFireStoppingShown(sectionData, rule, drawing);
        break;
        
      // Energy (SANS 10400-XA)
      case 'SEC-007': // Thermal Insulation Specified
        passed = this.checkThermalInsulationSpecified(sectionData, rule, drawing);
        break;
        
      case 'SEC-008': // Insulation R-values Indicated
        ({ passed, value, expected, finding } = this.checkInsulationRValues(sectionData, rule, drawing));
        break;
        
      // General (SANS 10400-A, J)
      case 'SEC-009': // Ceiling Heights Verified
        ({ passed, value, expected, finding } = this.checkCeilingHeights(sectionData, rule, drawing));
        break;
        
      case 'SEC-010': // Floor Levels Indicated
        passed = this.checkFloorLevelsIndicated(sectionData, rule, drawing);
        break;
        
      case 'SEC-011': // Damp Proof Course Shown
        passed = this.checkDPCShown(sectionData, rule, drawing);
        break;
        
      case 'SEC-012': // Ventilation Provisions
        passed = this.checkVentilationProvisions(sectionData, rule, drawing);
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
   * SEC-001: Foundation Depth Indicated
   */
  private checkFoundationDepthIndicated(sectionData: SectionAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return sectionData.foundationDepth !== null || sectionData.foundationType !== null;
  }

  /**
   * SEC-002: Wall Construction Build-up Shown
   */
  private checkWallBuildUpShown(sectionData: SectionAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return sectionData.wallBuildUp.length > 0 || sectionData.wallThickness !== null;
  }

  /**
   * SEC-003: Floor Build-up Indicated
   */
  private checkFloorBuildUpIndicated(sectionData: SectionAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return sectionData.floorBuildUp.length > 0;
  }

  /**
   * SEC-004: Roof Structure Detailed
   */
  private checkRoofStructureDetailed(sectionData: SectionAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return sectionData.roofStructure !== null;
  }

  /**
   * SEC-005: Fire Resistance Periods Indicated
   */
  private checkFireResistanceIndicated(sectionData: SectionAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return sectionData.fireRatings.length > 0;
  }

  /**
   * SEC-006: Fire Stopping Details Shown
   */
  private checkFireStoppingShown(sectionData: SectionAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return sectionData.fireStopping;
  }

  /**
   * SEC-007: Thermal Insulation Specified
   */
  private checkThermalInsulationSpecified(sectionData: SectionAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return sectionData.insulationSpecified;
  }

  /**
   * SEC-008: Insulation R-values Indicated
   */
  private checkInsulationRValues(
    sectionData: SectionAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): { passed: boolean; value?: number; expected?: number; finding?: Finding } {
    const rValues = sectionData.insulationRValues;
    
    if (rValues.length === 0) {
      return {
        passed: false,
        finding: this.createSectionFinding(
          rule,
          'Insulation R-values not indicated',
          'high',
          drawing,
          'Indicate R-values for walls (min 1.7), roof (min 3.7), and floor (min 0.75) as per SANS 10400-XA'
        )
      };
    }
    
    // Check minimum R-values
    let wallR = null;
    let roofR = null;
    let floorR = null;
    
    for (const r of rValues) {
      if (r.element === 'wall') wallR = r.value;
      if (r.element === 'roof' || r.element === 'ceiling') roofR = r.value;
      if (r.element === 'floor') floorR = r.value;
    }
    
    const minWallR = ENERGY_DTS.walls.minRValue; // 1.7
    const minRoofR = ENERGY_DTS.roofs.minRValue; // 3.7
    const minFloorR = ENERGY_DTS.floors.minRValue; // 0.75
    
    // Check if any R-value is below minimum
    if ((wallR !== null && wallR < minWallR) || (roofR !== null && roofR < minRoofR) || (floorR !== null && floorR < minFloorR)) {
      return {
        passed: false,
        value: (roofR ?? wallR ?? floorR) ?? undefined,
        expected: minWallR,
        finding: this.createSectionFinding(
          rule,
          'Insulation R-value below minimum requirements',
          'high',
          drawing,
          `Increase insulation to meet minimum requirements: Wall R≥${minWallR}, Roof R≥${minRoofR}, Floor R≥${minFloorR}`
        )
      };
    }
    
    return { 
      passed: true, 
      value: (roofR ?? wallR ?? floorR) ?? undefined, 
      expected: minWallR 
    };
  }

  /**
   * SEC-009: Ceiling Heights Verified
   */
  private checkCeilingHeights(
    sectionData: SectionAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): { passed: boolean; value?: number; expected?: number; finding?: Finding } {
    const heights = sectionData.ceilingHeights;
    
    if (heights.length === 0) {
      return { passed: true }; // Assume compliant if not specified
    }
    
    const minHeight = 2400; // mm for habitable rooms
    
    // Check if any ceiling height is below minimum
    for (const height of heights) {
      if (height.value < minHeight) {
        return {
          passed: false,
          value: height.value,
          expected: minHeight,
          finding: this.createSectionFinding(
            rule,
            `Ceiling height (${height.value}mm) is below minimum required ${minHeight}mm for habitable rooms`,
            'critical',
            drawing,
            'Increase ceiling height to minimum 2400mm for habitable rooms as per SANS 10400-A'
          )
        };
      }
    }
    
    return { passed: true, value: heights[0].value, expected: minHeight };
  }

  /**
   * SEC-010: Floor Levels Indicated
   */
  private checkFloorLevelsIndicated(sectionData: SectionAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return sectionData.floorLevels.length > 0;
  }

  /**
   * SEC-011: Damp Proof Course Shown
   */
  private checkDPCShown(sectionData: SectionAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return sectionData.dpcIndicated;
  }

  /**
   * SEC-012: Ventilation Provisions
   */
  private checkVentilationProvisions(sectionData: SectionAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return sectionData.ventilationIndicated;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Create a finding for section analysis
   */
  private createSectionFinding(
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
    const sectionData = this.extractSectionData(context.drawing, context.projectInfo);
    return this.evaluateSectionRule(rule, sectionData, context.drawing, context.projectInfo);
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface WallLayerData {
  material: string;
  thickness: number | null;
  position: { x: number; y: number };
  type: 'structure' | 'finish' | 'insulation';
}

interface FloorLayerData {
  material: string;
  thickness: number | null;
  position: { x: number; y: number };
}

interface RoofStructureData {
  type: string;
  material: string;
  position: { x: number; y: number };
  spans: number | null;
}

interface FireRatingData {
  value: number;
  unit: string;
  element: string;
  position: { x: number; y: number };
  label: string;
}

interface InsulationRValueData {
  element: string;
  value: number;
  unit: string;
  position: { x: number; y: number };
  label: string;
}

interface CeilingHeightData {
  value: number;
  unit: string;
  location: string;
  position: { x: number; y: number };
}

interface FloorLevelData {
  value: number;
  position: { x: number; y: number };
  label: string;
}

interface SectionAnalysisData {
  foundationDepth: number | null;
  foundationType: string | null;
  wallBuildUp: WallLayerData[];
  wallThickness: number | null;
  floorBuildUp: FloorLayerData[];
  roofStructure: RoofStructureData | null;
  fireRatings: FireRatingData[];
  fireStopping: boolean;
  insulationSpecified: boolean;
  insulationRValues: InsulationRValueData[];
  ceilingHeights: CeilingHeightData[];
  floorLevels: FloorLevelData[];
  dpcIndicated: boolean;
  dpcHeight: number | null;
  ventilationIndicated: boolean;
  textContent: string[];
  annotations: string[];
  symbols: SymbolInfo[];
  layers: LayerInfo[];
  dimensions: ExtractedDimension[];
}

// Export the agent
export default SectionComplianceAgent;
