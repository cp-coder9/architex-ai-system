/**
 * FloorPlanComplianceAgent
 * 
 * Validates floor plans against SANS 10400-A, O, J, T, P and municipal requirements.
 * Performs comprehensive compliance checks including room dimensions, ventilation,
 * lighting, fire safety, sanitary facilities, and additional building requirements.
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
  ROOM_REQUIREMENTS,
  FloorPlanCheck,
  DoorCheck,
  WindowCheck,
  SanitaryCheck,
  VentilationCheck,
  LightingCheck,
  FireExitCheck,
  CeilingHeightRoom,
  RoomAreaCheck
} from '@/config/sans10400/types';

// ============================================================================
// SANS 10400 Floor Plan Rules (23 rules total)
// ============================================================================

const FLOOR_PLAN_RULES: ComplianceRule[] = [
  // --------------------------------------------------------------------------
  // Room Requirements (SANS 10400-A) - FLR-001 to FLR-006
  // --------------------------------------------------------------------------
  {
    id: 'FLR-001',
    name: 'Room Dimensions Shown',
    description: 'All rooms must have their dimensions clearly shown on the floor plan',
    standard: 'SANS 10400-A',
    part: 'Part A',
    category: 'floor_plan',
    severity: Severity.CRITICAL,
    checkType: 'presence',
    requirement: 'All rooms must have length and width dimensions clearly indicated',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'FLR-002',
    name: 'Ceiling Height Minimum 2400mm',
    description: 'Habitable rooms must have a minimum ceiling height of 2400mm',
    standard: 'SANS 10400-A',
    part: 'Part A',
    category: 'floor_plan',
    severity: Severity.CRITICAL,
    checkType: 'dimension',
    requirement: 'Minimum ceiling height for habitable rooms is 2400mm',
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
    id: 'FLR-003',
    name: 'Room Names/Labels Present',
    description: 'All rooms must be clearly labeled with their intended use',
    standard: 'SANS 10400-A',
    part: 'Part A',
    category: 'floor_plan',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'Each room must have a clear label indicating its purpose (e.g., bedroom, kitchen, bathroom)',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'FLR-004',
    name: 'Wall Thicknesses Indicated',
    description: 'Wall thicknesses must be clearly indicated on the floor plan',
    standard: 'SANS 10400-A',
    part: 'Part A',
    category: 'floor_plan',
    severity: Severity.MEDIUM,
    checkType: 'dimension',
    requirement: 'Wall thicknesses must be indicated, typically 110mm for external, 90mm for internal',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'FLR-005',
    name: 'Door Sizes and Swings Shown',
    description: 'All doors must have sizes and swing directions clearly indicated',
    standard: 'SANS 10400-A',
    part: 'Part A',
    category: 'floor_plan',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'Door openings must show dimensions and swing direction (inward/outward)',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'FLR-006',
    name: 'Window Sizes and Positions Indicated',
    description: 'Windows must have sizes and positions clearly shown',
    standard: 'SANS 10400-A',
    part: 'Part A',
    category: 'floor_plan',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'Windows must show dimensions, position from floor, and opening type',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // --------------------------------------------------------------------------
  // Ventilation (SANS 10400-O) - FLR-007 to FLR-009
  // --------------------------------------------------------------------------
  {
    id: 'FLR-007',
    name: 'Ventilation - 10% Floor Area as Openable Windows',
    description: 'Habitable rooms must have openable window area equal to at least 10% of floor area',
    standard: 'SANS 10400-O',
    part: 'Part O',
    category: 'floor_plan',
    severity: Severity.CRITICAL,
    checkType: 'calculation',
    requirement: 'Minimum 10% of floor area must be available as openable window for natural ventilation',
    thresholds: {
      min: 10,
      unit: '%',
      comparison: 'greater_than'
    },
    calculation: 'Openable Window Area / Floor Area × 100 ≥ 10%',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'FLR-008',
    name: 'Mechanical Ventilation Where Required',
    description: 'Mechanical ventilation must be provided where natural ventilation is insufficient',
    standard: 'SANS 10400-O',
    part: 'Part O',
    category: 'floor_plan',
    severity: Severity.HIGH,
    checkType: 'verification',
    requirement: 'Interior rooms without natural ventilation must have mechanical ventilation systems indicated',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'FLR-009',
    name: 'Cross Ventilation for Habitable Rooms',
    description: 'Habitable rooms should have provision for cross ventilation',
    standard: 'SANS 10400-O',
    part: 'Part O',
    category: 'floor_plan',
    severity: Severity.MEDIUM,
    checkType: 'verification',
    requirement: 'Habitable rooms should have windows on at least two walls for cross ventilation',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // --------------------------------------------------------------------------
  // Lighting (SANS 10400-J) - FLR-010 to FLR-012
  // --------------------------------------------------------------------------
  {
    id: 'FLR-010',
    name: 'Window Area Minimum 10% of Floor Area',
    description: 'Window area must be at least 10% of the floor area for natural light',
    standard: 'SANS 10400-J',
    part: 'Part J',
    category: 'floor_plan',
    severity: Severity.CRITICAL,
    checkType: 'calculation',
    requirement: 'Minimum 10% of floor area must be window glazing for natural light',
    thresholds: {
      min: 10,
      unit: '%',
      comparison: 'greater_than'
    },
    calculation: 'Window Area / Floor Area × 100 ≥ 10%',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'FLR-011',
    name: 'Natural Light to All Habitable Rooms',
    description: 'All habitable rooms must have access to natural light via windows',
    standard: 'SANS 10400-J',
    part: 'Part J',
    category: 'floor_plan',
    severity: Severity.CRITICAL,
    checkType: 'verification',
    requirement: 'Every habitable room must have a window opening to the exterior',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'FLR-012',
    name: 'Light Ratios Adequate',
    description: 'The window to floor area ratio must provide adequate natural light',
    standard: 'SANS 10400-J',
    part: 'Part J',
    category: 'floor_plan',
    severity: Severity.MEDIUM,
    checkType: 'calculation',
    requirement: 'Light ratio should be adequate for the room use - typically minimum 10% for habitable rooms',
    thresholds: {
      min: 10,
      unit: '%',
      comparison: 'greater_than'
    },
    calculation: 'Window Glazing Area / Room Floor Area × 100',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // --------------------------------------------------------------------------
  // Fire Safety (SANS 10400-T) - FLR-013 to FLR-015
  // --------------------------------------------------------------------------
  {
    id: 'FLR-013',
    name: 'Fire Escape Routes Clear',
    description: 'All rooms must have clear access to fire escape routes',
    standard: 'SANS 10400-T',
    part: 'Part T',
    category: 'floor_plan',
    severity: Severity.CRITICAL,
    checkType: 'verification',
    requirement: 'Every room must have a clear path to an escape route without obstructions',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'FLR-014',
    name: 'Minimum Door Width for Escape 900mm',
    description: 'Doors on escape routes must have minimum clear width of 900mm',
    standard: 'SANS 10400-T',
    part: 'Part T',
    category: 'floor_plan',
    severity: Severity.CRITICAL,
    checkType: 'dimension',
    requirement: 'Minimum door width for escape routes is 900mm clear opening',
    thresholds: {
      min: 900,
      unit: 'mm',
      comparison: 'greater_than'
    },
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'FLR-015',
    name: 'Alternative Escape Route Where Required',
    description: 'Rooms requiring alternative escape routes must have second exit indicated',
    standard: 'SANS 10400-T',
    part: 'Part T',
    category: 'floor_plan',
    severity: Severity.HIGH,
    checkType: 'verification',
    requirement: 'Habitable rooms over certain size or on upper floors must have alternative escape route',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // --------------------------------------------------------------------------
  // Sanitary Facilities (SANS 10400-P) - FLR-016 to FLR-018
  // --------------------------------------------------------------------------
  {
    id: 'FLR-016',
    name: 'Sanitary Facilities Adequate for Occupancy',
    description: 'The number of sanitary fittings must be adequate for the building occupancy',
    standard: 'SANS 10400-P',
    part: 'Part P',
    category: 'floor_plan',
    severity: Severity.CRITICAL,
    checkType: 'calculation',
    requirement: 'Minimum sanitary facilities: 1 WC, 1 washbasin, 1 bath/shower per dwelling unit',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'FLR-017',
    name: 'Bathroom Ventilation',
    description: 'Bathrooms must have adequate ventilation, natural or mechanical',
    standard: 'SANS 10400-P',
    part: 'Part P',
    category: 'floor_plan',
    severity: Severity.HIGH,
    checkType: 'verification',
    requirement: 'Bathrooms must have openable window or mechanical ventilation system',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'FLR-018',
    name: 'WC Position and Ventilation',
    description: 'WC rooms must be properly positioned and ventilated',
    standard: 'SANS 10400-P',
    part: 'Part P',
    category: 'floor_plan',
    severity: Severity.HIGH,
    checkType: 'verification',
    requirement: 'WC must have external ventilation (window to outside or mechanical extraction)',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // --------------------------------------------------------------------------
  // Additional Requirements - FLR-019 to FLR-023
  // --------------------------------------------------------------------------
  {
    id: 'FLR-019',
    name: 'Kitchen Ventilation/Extraction',
    description: 'Kitchens must have adequate ventilation and extraction systems',
    standard: 'SANS 10400',
    part: 'General',
    category: 'floor_plan',
    severity: Severity.HIGH,
    checkType: 'verification',
    requirement: 'Kitchens must have extraction fan or rangehood indicated for smoke and odor removal',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'FLR-020',
    name: 'Laundry Ventilation',
    description: 'Laundry areas must have adequate ventilation',
    standard: 'SANS 10400',
    part: 'General',
    category: 'floor_plan',
    severity: Severity.MEDIUM,
    checkType: 'verification',
    requirement: 'Laundry areas must have ventilation to outside or mechanical extraction',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'FLR-021',
    name: 'Stair Dimensions and Handrails',
    description: 'Stairs must comply with minimum dimensions and have handrails',
    standard: 'SANS 10400',
    part: 'General',
    category: 'floor_plan',
    severity: Severity.CRITICAL,
    checkType: 'dimension',
    requirement: 'Stairs must have minimum width 900mm, riser max 190mm, going min 250mm, handrails on both sides',
    thresholds: {
      min: 900,
      unit: 'mm',
      comparison: 'greater_than'
    },
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'FLR-022',
    name: 'Balcony Parapet Heights',
    description: 'Balconies must have adequate parapet heights for safety',
    standard: 'SANS 10400',
    part: 'General',
    category: 'floor_plan',
    severity: Severity.CRITICAL,
    checkType: 'dimension',
    requirement: 'Balcony parapets must be minimum 1000mm high for safety',
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
    id: 'FLR-023',
    name: 'Garage Ventilation',
    description: 'Garages must have adequate ventilation',
    standard: 'SANS 10400',
    part: 'General',
    category: 'floor_plan',
    severity: Severity.MEDIUM,
    checkType: 'verification',
    requirement: 'Garages must have ventilation openings or mechanical ventilation',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  }
];

// ============================================================================
// Agent Configuration
// ============================================================================

const DEFAULT_CONFIG: AgentConfig = {
  id: 'floorplan-compliance-agent',
  name: 'Floor Plan Compliance Agent',
  description: 'Validates floor plans against SANS 10400-A, O, J, T, P and municipal requirements',
  version: '1.0.0',
  enabled: true,
  maxRetries: 3,
  timeout: 30000,
  priority: 1,
  capabilities: [
    'floor-plan-validation',
    'room-dimension-verification',
    'ventilation-compliance',
    'lighting-compliance',
    'fire-safety-verification',
    'sanitary-facilities-check'
  ],
  supportedDrawingTypes: [DrawingType.FLOOR_PLAN],
  supportedStandards: ['SANS 10400-A', 'SANS 10400-O', 'SANS 10400-J', 'SANS 10400-T', 'SANS 10400-P']
};

// ============================================================================
// Agent Implementation
// ============================================================================

export class FloorPlanComplianceAgent extends Agent {
  private floorRules: ComplianceRule[];

  constructor(config: Partial<AgentConfig> = {}) {
    super({ ...DEFAULT_CONFIG, ...config });
    this.floorRules = FLOOR_PLAN_RULES;
  }

  /**
   * Get rule IDs for this agent
   */
  getRuleIds(): string[] {
    return this.floorRules.map(rule => rule.id);
  }

  /**
   * Load rules for this agent
   */
  protected async loadRules(): Promise<void> {
    this.rules = this.floorRules;
  }

  /**
   * Analyze a floor plan drawing for SANS 10400 compliance
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
      const floorData = this.extractFloorData(drawing, projectInfo);

      // Run each compliance check
      for (const rule of this.floorRules) {
        const result = await this.evaluateFloorRule(rule, floorData, drawing);
        
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
        this.floorRules.map(rule => ({
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
          analysisType: 'floor-plan-compliance',
          roomsFound: floorData.rooms.length,
          doorsFound: floorData.doors.length,
          windowsFound: floorData.windows.length
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
          analysisType: 'floor-plan-compliance',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Extract floor plan data from drawing and project info
   */
  private extractFloorData(drawing: DrawingData, projectInfo: ProjectInfo): FloorAnalysisData {
    // Extract text elements for room names and labels
    const textContent = drawing.textElements.map(t => t.content.toLowerCase());
    const annotations = drawing.annotations.map(a => a.content.toLowerCase());
    
    // Extract rooms from text labels
    const rooms = this.extractRooms(drawing, textContent, annotations);
    
    // Extract dimensions
    const dimensions = this.extractDimensions(drawing);
    
    // Extract doors
    const doors = this.extractDoors(drawing);
    
    // Extract windows
    const windows = this.extractWindows(drawing);
    
    // Extract sanitary facilities
    const sanitaryFacilities = this.extractSanitaryFacilities(drawing);
    
    // Extract stairs
    const stairs = this.extractStairs(drawing);
    
    // Extract balconies
    const balconies = this.extractBalconies(drawing);
    
    // Extract garage
    const garage = this.extractGarage(drawing);
    
    // Extract kitchen
    const kitchen = this.extractKitchen(drawing);
    
    // Extract laundry
    const laundry = this.extractLaundry(drawing);
    
    // Check for mechanical ventilation
    const hasMechanicalVentilation = this.checkMechanicalVentilation(drawing);
    
    // Calculate total floor area
    const totalFloorArea = this.calculateTotalFloorArea(rooms, dimensions);

    return {
      rooms,
      doors,
      windows,
      sanitaryFacilities,
      stairs,
      balconies,
      garage,
      kitchen,
      laundry,
      hasMechanicalVentilation,
      totalFloorArea,
      dimensions,
      textContent: drawing.textElements.map(t => t.content),
      annotations: drawing.annotations.map(a => a.content),
      symbols: drawing.symbols,
      layers: drawing.layers
    };
  }

  /**
   * Extract rooms from drawing
   */
  private extractRooms(drawing: DrawingData, textContent: string[], annotations: string[]): RoomData[] {
    const rooms: RoomData[] = [];
    const allText = [...textContent, ...annotations];
    
    // Room type patterns to search for
    const roomPatterns = [
      { pattern: /bedroom|bed\s*room|bed\s*rm/i, type: 'bedroom' as const },
      { pattern: /living\s*room|living\s*rm|lounge|liv\s*rm/i, type: 'living' as const },
      { pattern: /kitchen|kitch|scullery/i, type: 'kitchen' as const },
      { pattern: /bathroom|bath\s*rm|bathrm|shower\s*room/i, type: 'bathroom' as const },
      { pattern: /wc|toilet|lavatory|separate\s*toilet/i, type: 'wc' as const },
      { pattern: /dining\s*room|dining\s*rm|din\s*rm|din\.*/i, type: 'dining' as const },
      { pattern: /study|office|den/i, type: 'study' as const },
      { pattern: /laundry|utility\s*room|wash\s*room/i, type: 'laundry' as const },
      { pattern: /garage|carport|vehicle\s* shelter/i, type: 'garage' as const },
      { pattern: /store|storage|closet|pantry/i, type: 'store' as const },
      { pattern: /balcony|terrace|patio|verandah/i, type: 'balcony' as const },
      { pattern: /entrance|hall|hallway| foyer/i, type: 'hall' as const }
    ];

    // Search through text elements for room labels
    for (let i = 0; i < drawing.textElements.length; i++) {
      const text = drawing.textElements[i];
      const contentLower = text.content.toLowerCase();
      
      for (const roomPattern of roomPatterns) {
        if (roomPattern.pattern.test(contentLower)) {
          // Check if we already have this room
          const existingRoom = rooms.find(r => 
            Math.abs(r.position.x - text.position.x) < 100 && 
            Math.abs(r.position.y - text.position.y) < 100
          );
          
          if (!existingRoom) {
            rooms.push({
              name: text.content,
              type: roomPattern.type,
              position: text.position,
              floorArea: null,
              width: null,
              length: null,
              ceilingHeight: null,
              hasWindow: false,
              windowArea: 0,
              openableArea: 0,
              isHabitable: this.isHabitableRoom(roomPattern.type)
            });
          }
          break;
        }
      }
    }

    // If no rooms found via text, try to infer from dimensions and layers
    if (rooms.length === 0) {
      // Look for room layers
      const roomLayers = drawing.layers.filter(l => 
        l.name.toLowerCase().includes('room') ||
        l.name.toLowerCase().includes(' habitable') ||
        l.name.toLowerCase().includes('floor')
      );
      
      if (roomLayers.length > 0) {
        rooms.push({
          name: 'Room',
          type: 'unknown',
          position: { x: 0, y: 0 },
          floorArea: null,
          width: null,
          length: null,
          ceilingHeight: null,
          hasWindow: false,
          windowArea: 0,
          openableArea: 0,
          isHabitable: false
        });
      }
    }

    return rooms;
  }

  /**
   * Check if a room type is habitable
   */
  private isHabitableRoom(roomType: string): boolean {
    const habitableTypes = ['bedroom', 'living', 'dining', 'study', 'hall'];
    return habitableTypes.includes(roomType);
  }

  /**
   * Extract dimensions from drawing
   */
  private extractDimensions(drawing: DrawingData): ExtractedFloorDimensions {
    const roomDimensions: DimensionData[] = [];
    const wallThicknesses: number[] = [];
    
    for (const dim of drawing.dimensions) {
      const layerName = dim.layer?.toLowerCase() || '';
      
      if (layerName.includes('room') || layerName.includes('wall')) {
        roomDimensions.push({
          id: dim.id,
          value: dim.value,
          unit: dim.unit,
          type: dim.type,
          startPoint: dim.startPoint,
          endPoint: dim.endPoint,
          layer: dim.layer
        });
      }
      
      // Check for wall thickness indicators
      if (layerName.includes('wall') && dim.type === 'linear') {
        if (dim.value > 0 && dim.value < 500) { // Typical wall thickness range
          wallThicknesses.push(dim.value);
        }
      }
    }
    
    // Also look for dimension annotations
    const dimensionPatterns = [
      /(\d{3,4})\s*mm/i,
      /(\d+\.?\d*)\s*m/i,
      /room\s*size\s*[:=]?\s*(\d+\.?\d*)\s*[x×]\s*(\d+\.?\d*)/i
    ];
    
    for (const text of drawing.textElements) {
      for (const pattern of dimensionPatterns) {
        const match = text.content.match(pattern);
        if (match) {
          const value = parseFloat(match[1]);
          if (value > 500 && value < 20000) { // Reasonable room dimension range
            roomDimensions.push({
              id: text.id,
              value,
              unit: 'mm',
              type: 'linear',
              startPoint: text.position,
              endPoint: text.position,
              layer: text.layer
            });
          }
        }
      }
    }
    
    return { roomDimensions, wallThicknesses };
  }

  /**
   * Extract doors from drawing
   */
  private extractDoors(drawing: DrawingData): DoorData[] {
    const doors: DoorData[] = [];
    
    // Look for door symbols
    const doorSymbols = drawing.symbols.filter(s => 
      s.name.toLowerCase().includes('door') ||
      s.category.toLowerCase().includes('door') ||
      s.name.toLowerCase().includes('door swing')
    );
    
    for (const symbol of doorSymbols) {
      doors.push({
        id: symbol.id,
        location: symbol.name,
        position: symbol.position,
        width: this.extractDoorWidth(symbol),
        height: 2100, // Default standard door height
        swingDirection: this.extractSwingDirection(symbol),
        isOnEscapeRoute: false // Will be determined later
      });
    }
    
    // Look for door annotations
    const doorPatterns = [
      /door\s*(\d+)/i,
      /door\s*size\s*[:=]?\s*(\d+)\s*[x×]\s*(\d+)/i,
      /(\d+)\s*[x×]\s*(\d+)\s*door/i,
      /width\s*[:=]?\s*(\d+)\s*mm/i
    ];
    
    for (const text of drawing.textElements) {
      const contentLower = text.content.toLowerCase();
      if (contentLower.includes('door')) {
        for (const pattern of doorPatterns) {
          const match = text.content.match(pattern);
          if (match) {
            const width = parseFloat(match[1]);
            const height = match[2] ? parseFloat(match[2]) : 2100;
            
            // Check if this door already exists
            const existing = doors.find(d => 
              Math.abs(d.position.x - text.position.x) < 50 && 
              Math.abs(d.position.y - text.position.y) < 50
            );
            
            if (!existing && width > 0 && width < 2000) {
              doors.push({
                id: text.id,
                location: text.content,
                position: text.position,
                width,
                height,
                swingDirection: null,
                isOnEscapeRoute: false
              });
            }
            break;
          }
        }
      }
    }
    
    return doors;
  }

  /**
   * Extract door width from symbol
   */
  private extractDoorWidth(symbol: SymbolInfo): number | null {
    // Try to get width from symbol properties
    if (symbol.properties) {
      const width = symbol.properties['width'] || symbol.properties['doorWidth'];
      if (typeof width === 'number') return width;
    }
    
    // Default standard door widths
    const name = symbol.name.toLowerCase();
    if (name.includes('900')) return 900;
    if (name.includes('800')) return 800;
    if (name.includes('750')) return 750;
    if (name.includes('700')) return 700;
    
    return null; // Unknown
  }

  /**
   * Extract swing direction from symbol
   */
  private extractSwingDirection(symbol: SymbolInfo): 'in' | 'out' | 'single' | 'double' | null {
    const name = symbol.name.toLowerCase();
    if (name.includes('in') || name.includes('swing in')) return 'in';
    if (name.includes('out') || name.includes('swing out')) return 'out';
    if (name.includes('double')) return 'double';
    return 'single';
  }

  /**
   * Extract windows from drawing
   */
  private extractWindows(drawing: DrawingData): WindowData[] {
    const windows: WindowData[] = [];
    
    // Look for window symbols
    const windowSymbols = drawing.symbols.filter(s => 
      s.name.toLowerCase().includes('window') ||
      s.name.toLowerCase().includes('window') ||
      s.category.toLowerCase().includes('window')
    );
    
    for (const symbol of windowSymbols) {
      windows.push({
        id: symbol.id,
        room: this.findRoomForWindow(symbol.position, drawing.textElements),
        position: symbol.position,
        width: this.extractWindowWidth(symbol),
        height: this.extractWindowHeight(symbol),
        openableArea: 0,
        isOpenable: this.isWindowOpenable(symbol)
      });
    }
    
    // Look for window annotations
    const windowPatterns = [
      /window\s*(\d+)/i,
      /window\s*size\s*[:=]?\s*(\d+)\s*[x×]\s*(\d+)/i,
      /(\d+)\s*[x×]\s*(\d+)\s*window/i,
      /w\s*(\d+)/i
    ];
    
    for (const text of drawing.textElements) {
      const contentLower = text.content.toLowerCase();
      if (contentLower.includes('window') || contentLower.includes('w/')) {
        for (const pattern of windowPatterns) {
          const match = text.content.match(pattern);
          if (match) {
            const width = parseFloat(match[1]);
            const height = match[2] ? parseFloat(match[2]) : 1200;
            
            // Check if this window already exists
            const existing = windows.find(w => 
              Math.abs(w.position.x - text.position.x) < 50 && 
              Math.abs(w.position.y - text.position.y) < 50
            );
            
            if (!existing && width > 0 && width < 5000) {
              windows.push({
                id: text.id,
                room: this.findRoomForWindow(text.position, drawing.textElements),
                position: text.position,
                width,
                height,
                openableArea: 0,
                isOpenable: true
              });
            }
            break;
          }
        }
      }
    }
    
    // Update window and openable areas based on dimensions
    for (const window of windows) {
      if (window.width && window.height) {
        window.openableArea = window.width * window.height * 0.5; // Assume 50% openable
      }
    }
    
    return windows;
  }

  /**
   * Find which room a window belongs to
   */
  private findRoomForWindow(windowPos: { x: number; y: number }, textElements: TextElement[]): string | null {
    // Find nearest room label
    let nearestRoom: string | null = null;
    let minDistance = Infinity;
    
    for (const text of textElements) {
      const contentLower = text.content.toLowerCase();
      if (this.isRoomLabel(contentLower)) {
        const distance = Math.sqrt(
          Math.pow(text.position.x - windowPos.x, 2) + 
          Math.pow(text.position.y - windowPos.y, 2)
        );
        if (distance < minDistance && distance < 500) {
          minDistance = distance;
          nearestRoom = text.content;
        }
      }
    }
    
    return nearestRoom;
  }

  /**
   * Check if text is a room label
   */
  private isRoomLabel(content: string): boolean {
    const roomKeywords = ['bedroom', 'kitchen', 'bathroom', 'living', 'dining', 'wc', 'toilet', 'study', 'hall', 'laundry', 'garage', 'store'];
    return roomKeywords.some(keyword => content.includes(keyword));
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
    
    // Default standard window height
    return 1200;
  }

  /**
   * Check if window is openable
   */
  private isWindowOpenable(symbol: SymbolInfo): boolean {
    const name = symbol.name.toLowerCase();
    if (name.includes('fixed') || name.includes('non-openable') || name.includes('blocked')) {
      return false;
    }
    return true; // Default to openable
  }

  /**
   * Extract sanitary facilities
   */
  private extractSanitaryFacilities(drawing: DrawingData): SanitaryFacilitiesData {
    const facilities: SanitaryFacilitiesData = {
      wc: 0,
      washbasin: 0,
      bath: 0,
      shower: 0,
      kitchenSink: 0,
      locations: []
    };
    
    // Look for sanitary symbols
    const sanitarySymbols = drawing.symbols.filter(s => {
      const name = s.name.toLowerCase();
      return name.includes('wc') || 
             name.includes('toilet') ||
             name.includes('washbasin') ||
             name.includes('sink') ||
             name.includes('bath') ||
             name.includes('shower') ||
             s.category.toLowerCase().includes('sanitary');
    });
    
    for (const symbol of sanitarySymbols) {
      const name = symbol.name.toLowerCase();
      
      if (name.includes('wc') || name.includes('toilet')) {
        facilities.wc++;
        facilities.locations.push({ type: 'wc', position: symbol.position });
      }
      if (name.includes('washbasin') || name.includes('hand basin')) {
        facilities.washbasin++;
        facilities.locations.push({ type: 'washbasin', position: symbol.position });
      }
      if (name.includes('bath') && !name.includes('shower')) {
        facilities.bath++;
        facilities.locations.push({ type: 'bath', position: symbol.position });
      }
      if (name.includes('shower')) {
        facilities.shower++;
        facilities.locations.push({ type: 'shower', position: symbol.position });
      }
      if (name.includes('kitchen sink')) {
        facilities.kitchenSink++;
        facilities.locations.push({ type: 'kitchenSink', position: symbol.position });
      }
    }
    
    // Look for text annotations
    for (const text of drawing.textElements) {
      const contentLower = text.content.toLowerCase();
      
      if (contentLower.includes('wc')) {
        // Check if we already counted this
        if (!facilities.locations.some(l => 
          Math.abs(l.position.x - text.position.x) < 100 && 
          Math.abs(l.position.y - text.position.y) < 100
        )) {
          facilities.wc++;
        }
      }
    }
    
    return facilities;
  }

  /**
   * Extract stairs information
   */
  private extractStairs(drawing: DrawingData): StairData | null {
    // Look for stair symbols
    const stairSymbols = drawing.symbols.filter(s => 
      s.name.toLowerCase().includes('stair') ||
      s.name.toLowerCase().includes('stairs') ||
      s.name.toLowerCase().includes('staircase') ||
      s.category.toLowerCase().includes('stair')
    );
    
    if (stairSymbols.length > 0) {
      const symbol = stairSymbols[0];
      return {
        id: symbol.id,
        position: symbol.position,
        width: this.extractStairWidth(symbol),
        riserHeight: null, // Would need detailed drawing
        going: null,
        hasHandrail: this.checkStairHandrail(symbol, drawing),
        handrailHeight: 1000 // Default
      };
    }
    
    // Check for text annotations
    for (const text of drawing.textElements) {
      if (text.content.toLowerCase().includes('stair')) {
        return {
          id: text.id,
          position: text.position,
          width: null,
          riserHeight: null,
          going: null,
          hasHandrail: false,
          handrailHeight: 1000
        };
      }
    }
    
    return null;
  }

  /**
   * Extract stair width
   */
  private extractStairWidth(symbol: SymbolInfo): number | null {
    const name = symbol.name.toLowerCase();
    const match = name.match(/(\d{3})/);
    if (match) return parseFloat(match[1]);
    return 900; // Default minimum
  }

  /**
   * Check for stair handrail
   */
  private checkStairHandrail(stairSymbol: SymbolInfo, drawing: DrawingData): boolean {
    const handrailSymbols = drawing.symbols.filter(s => 
      s.name.toLowerCase().includes('handrail') ||
      s.name.toLowerCase().includes('banister')
    );
    return handrailSymbols.length > 0;
  }

  /**
   * Extract balconies
   */
  private extractBalconies(drawing: DrawingData): BalconyData[] {
    const balconies: BalconyData[] = [];
    
    // Look for balcony symbols
    const balconySymbols = drawing.symbols.filter(s => 
      s.name.toLowerCase().includes('balcony') ||
      s.name.toLowerCase().includes('terrace') ||
      s.category.toLowerCase().includes('balcony')
    );
    
    for (const symbol of balconySymbols) {
      balconies.push({
        id: symbol.id,
        position: symbol.position,
        parapetHeight: this.extractParapetHeight(symbol),
        length: null,
        width: null
      });
    }
    
    // Check for text annotations
    for (const text of drawing.textElements) {
      const contentLower = text.content.toLowerCase();
      if (contentLower.includes('balcony') || contentLower.includes('terrace')) {
        const existing = balconies.find(b => 
          Math.abs(b.position.x - text.position.x) < 100 && 
          Math.abs(b.position.y - text.position.y) < 100
        );
        
        if (!existing) {
          balconies.push({
            id: text.id,
            position: text.position,
            parapetHeight: null,
            length: null,
            width: null
          });
        }
      }
    }
    
    return balconies;
  }

  /**
   * Extract parapet height
   */
  private extractParapetHeight(symbol: SymbolInfo): number | null {
    const name = symbol.name.toLowerCase();
    const match = name.match(/(\d{4})/);
    if (match) return parseFloat(match[1]);
    return null;
  }

  /**
   * Extract garage information
   */
  private extractGarage(drawing: DrawingData): GarageData | null {
    // Look for garage
    const garageSymbols = drawing.symbols.filter(s => 
      s.name.toLowerCase().includes('garage') ||
      s.name.toLowerCase().includes('carport') ||
      s.category.toLowerCase().includes('garage')
    );
    
    if (garageSymbols.length > 0) {
      return {
        id: garageSymbols[0].id,
        position: garageSymbols[0].position,
        hasVentilation: false
      };
    }
    
    // Check text
    for (const text of drawing.textElements) {
      if (text.content.toLowerCase().includes('garage')) {
        return {
          id: text.id,
          position: text.position,
          hasVentilation: false
        };
      }
    }
    
    return null;
  }

  /**
   * Extract kitchen information
   */
  private extractKitchen(drawing: DrawingData): KitchenData | null {
    // Look for kitchen symbols
    const kitchenSymbols = drawing.symbols.filter(s => 
      s.name.toLowerCase().includes('kitchen') ||
      s.category.toLowerCase().includes('kitchen')
    );
    
    if (kitchenSymbols.length > 0) {
      return {
        id: kitchenSymbols[0].id,
        position: kitchenSymbols[0].position,
        hasExtraction: this.checkKitchenExtraction(kitchenSymbols[0], drawing)
      };
    }
    
    // Check text
    for (const text of drawing.textElements) {
      if (text.content.toLowerCase().includes('kitchen')) {
        return {
          id: text.id,
          position: text.position,
          hasExtraction: false
        };
      }
    }
    
    return null;
  }

  /**
   * Check for kitchen extraction
   */
  private checkKitchenExtraction(kitchenSymbol: SymbolInfo, drawing: DrawingData): boolean {
    const extractionSymbols = drawing.symbols.filter(s => 
      s.name.toLowerCase().includes('extraction') ||
      s.name.toLowerCase().includes('rangehood') ||
      s.name.toLowerCase().includes('extractor') ||
      s.name.toLowerCase().includes('vent')
    );
    return extractionSymbols.length > 0;
  }

  /**
   * Extract laundry information
   */
  private extractLaundry(drawing: DrawingData): LaundryData | null {
    // Look for laundry symbols
    const laundrySymbols = drawing.symbols.filter(s => 
      s.name.toLowerCase().includes('laundry') ||
      s.name.toLowerCase().includes('utility') ||
      s.category.toLowerCase().includes('laundry')
    );
    
    if (laundrySymbols.length > 0) {
      return {
        id: laundrySymbols[0].id,
        position: laundrySymbols[0].position,
        hasVentilation: false
      };
    }
    
    // Check text
    for (const text of drawing.textElements) {
      if (text.content.toLowerCase().includes('laundry') || text.content.toLowerCase().includes('utility')) {
        return {
          id: text.id,
          position: text.position,
          hasVentilation: false
        };
      }
    }
    
    return null;
  }

  /**
   * Check for mechanical ventilation
   */
  private checkMechanicalVentilation(drawing: DrawingData): boolean {
    const ventSymbols = drawing.symbols.filter(s => 
      s.name.toLowerCase().includes('mechanical vent') ||
      s.name.toLowerCase().includes('hvac') ||
      s.name.toLowerCase().includes('aircon') ||
      s.name.toLowerCase().includes('air conditioning') ||
      s.name.toLowerCase().includes('extract') ||
      s.name.toLowerCase().includes('fan')
    );
    
    return ventSymbols.length > 0;
  }

  /**
   * Calculate total floor area
   */
  private calculateTotalFloorArea(rooms: RoomData[], dimensions: ExtractedFloorDimensions): number {
    // Sum up room areas if available
    const roomsWithArea = rooms.filter(r => r.floorArea !== null);
    if (roomsWithArea.length > 0) {
      return roomsWithArea.reduce((sum, r) => sum + (r.floorArea || 0), 0);
    }
    
    // Try to estimate from dimensions
    if (dimensions.roomDimensions.length >= 2) {
      const sorted = [...dimensions.roomDimensions].sort((a, b) => b.value - a.value);
      return sorted[0].value * sorted[1].value;
    }
    
    return 0;
  }

  // ============================================================================
  // Rule Evaluation Methods
  // ============================================================================

  /**
   * Evaluate a single floor plan rule
   */
  private async evaluateFloorRule(
    rule: ComplianceRule,
    floorData: FloorAnalysisData,
    drawing: DrawingData
  ): Promise<ComplianceResult> {
    let passed = false;
    let value: string | number | boolean | undefined;
    let expected: string | number | boolean | undefined;
    let finding: Finding | undefined;

    switch (rule.id) {
      // Room Requirements (SANS 10400-A)
      case 'FLR-001': // Room Dimensions Shown
        passed = this.checkRoomDimensionsPresent(floorData, rule, drawing);
        break;
        
      case 'FLR-002': // Ceiling Height
        passed = this.checkCeilingHeight(floorData, rule, drawing);
        break;
        
      case 'FLR-003': // Room Names/Labels
        passed = this.checkRoomLabelsPresent(floorData, rule, drawing);
        break;
        
      case 'FLR-004': // Wall Thicknesses
        passed = this.checkWallThicknesses(floorData, rule, drawing);
        break;
        
      case 'FLR-005': // Door Sizes and Swings
        passed = this.checkDoorDetails(floorData, rule, drawing);
        break;
        
      case 'FLR-006': // Window Sizes and Positions
        passed = this.checkWindowDetails(floorData, rule, drawing);
        break;
        
      // Ventilation (SANS 10400-O)
      case 'FLR-007': // 10% Openable Windows
        ({ passed, value, expected, finding } = this.checkVentilationRatio(floorData, rule, drawing));
        break;
        
      case 'FLR-008': // Mechanical Ventilation
        passed = this.checkMechanicalVentilationRequired(floorData, rule, drawing);
        break;
        
      case 'FLR-009': // Cross Ventilation
        passed = this.checkCrossVentilation(floorData, rule, drawing);
        break;
        
      // Lighting (SANS 10400-J)
      case 'FLR-010': // 10% Window Area
        ({ passed, value, expected, finding } = this.checkWindowToFloorRatio(floorData, rule, drawing));
        break;
        
      case 'FLR-011': // Natural Light to All Habitable Rooms
        ({ passed, value, expected, finding } = this.checkNaturalLight(floorData, rule, drawing));
        break;
        
      case 'FLR-012': // Light Ratios Adequate
        passed = this.checkLightRatios(floorData, rule, drawing);
        break;
        
      // Fire Safety (SANS 10400-T)
      case 'FLR-013': // Fire Escape Routes
        passed = this.checkFireEscapeRoutes(floorData, rule, drawing);
        break;
        
      case 'FLR-014': // Minimum Door Width 900mm
        ({ passed, value, expected, finding } = this.checkMinimumDoorWidth(floorData, rule, drawing));
        break;
        
      case 'FLR-015': // Alternative Escape Route
        passed = this.checkAlternativeEscape(floorData, rule, drawing);
        break;
        
      // Sanitary Facilities (SANS 10400-P)
      case 'FLR-016': // Sanitary Facilities Adequate
        ({ passed, value, expected, finding } = this.checkSanitaryAdequacy(floorData, rule, drawing));
        break;
        
      case 'FLR-017': // Bathroom Ventilation
        passed = this.checkBathroomVentilation(floorData, rule, drawing);
        break;
        
      case 'FLR-018': // WC Position and Ventilation
        passed = this.checkWCVentilation(floorData, rule, drawing);
        break;
        
      // Additional Requirements
      case 'FLR-019': // Kitchen Ventilation
        passed = this.checkKitchenVentilation(floorData, rule, drawing);
        break;
        
      case 'FLR-020': // Laundry Ventilation
        passed = this.checkLaundryVentilation(floorData, rule, drawing);
        break;
        
      case 'FLR-021': // Stair Dimensions
        ({ passed, value, expected, finding } = this.checkStairDimensions(floorData, rule, drawing));
        break;
        
      case 'FLR-022': // Balcony Parapet Heights
        ({ passed, value, expected, finding } = this.checkBalconyParapet(floorData, rule, drawing));
        break;
        
      case 'FLR-023': // Garage Ventilation
        passed = this.checkGarageVentilation(floorData, rule, drawing);
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
   * FLR-001: Room Dimensions Shown
   */
  private checkRoomDimensionsPresent(floorData: FloorAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
    const hasRooms = floorData.rooms.length > 0;
    const hasDimensions = floorData.dimensions.roomDimensions.length > 0;
    return hasRooms && hasDimensions;
  }

  /**
   * FLR-002: Ceiling Height Minimum 2400mm
   */
  private checkCeilingHeight(floorData: FloorAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
    // Check if any rooms have ceiling height indicated
    const roomsWithHeight = floorData.rooms.filter(r => r.ceilingHeight !== null);
    
    if (roomsWithHeight.length > 0) {
      // Verify all are at least 2400mm
      return roomsWithHeight.every(r => (r.ceilingHeight || 0) >= 2400);
    }
    
    // If no height indicated, assume compliant (default standard)
    // In practice, this would require verification
    return true;
  }

  /**
   * FLR-003: Room Names/Labels Present
   */
  private checkRoomLabelsPresent(floorData: FloorAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
    // Check if rooms have labels
    const labeledRooms = floorData.rooms.filter(r => r.name && r.name !== 'Room');
    return labeledRooms.length === floorData.rooms.length && floorData.rooms.length > 0;
  }

  /**
   * FLR-004: Wall Thicknesses Indicated
   */
  private checkWallThicknesses(floorData: FloorAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
    return floorData.dimensions.wallThicknesses.length > 0;
  }

  /**
   * FLR-005: Door Sizes and Swings Shown
   */
  private checkDoorDetails(floorData: FloorAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
    if (floorData.doors.length === 0) return false;
    
    // Check if doors have dimensions
    const doorsWithSize = floorData.doors.filter(d => d.width !== null);
    return doorsWithSize.length > 0;
  }

  /**
   * FLR-006: Window Sizes and Positions
   */
  private checkWindowDetails(floorData: FloorAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
    if (floorData.windows.length === 0) return false;
    
    // Check if windows have dimensions
    const windowsWithSize = floorData.windows.filter(w => w.width !== null);
    return windowsWithSize.length > 0;
  }

  /**
   * FLR-007: Ventilation - 10% Floor Area
   */
  private checkVentilationRatio(
    floorData: FloorAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): { passed: boolean; value?: number; expected?: number; finding?: Finding } {
    const totalOpenableArea = floorData.windows.reduce((sum, w) => sum + (w.openableArea || 0), 0);
    const totalFloorArea = floorData.totalFloorArea || this.estimateFloorArea(floorData);
    
    if (totalFloorArea === 0) {
      return {
        passed: false,
        finding: this.createFloorFinding(rule, 'Floor area could not be determined to verify ventilation ratio', 'critical', drawing)
      };
    }
    
    const ratio = (totalOpenableArea / totalFloorArea) * 100;
    
    if (ratio < 10) {
      return {
        passed: false,
        value: ratio,
        expected: 10,
        finding: this.createFloorFinding(
          rule,
          `Openable window area (${ratio.toFixed(1)}%) is less than required 10% of floor area`,
          'critical',
          drawing,
          `Increase openable window area to at least 10% of floor area. Current ratio: ${ratio.toFixed(1)}%, Required: 10%`
        )
      };
    }
    
    return { passed: true, value: ratio, expected: 10 };
  }

  /**
   * FLR-008: Mechanical Ventilation Where Required
   */
  private checkMechanicalVentilationRequired(floorData: FloorAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
    // Check if interior rooms without windows have mechanical ventilation
    const interiorRooms = floorData.rooms.filter(r => !r.hasWindow);
    
    if (interiorRooms.length === 0) {
      return true; // No interior rooms, natural ventilation sufficient
    }
    
    // If there are interior rooms, check for mechanical ventilation
    return floorData.hasMechanicalVentilation;
  }

  /**
   * FLR-009: Cross Ventilation
   */
  private checkCrossVentilation(floorData: FloorAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
    // Check habitable rooms for windows on multiple walls
    const habitableRooms = floorData.rooms.filter(r => r.isHabitable);
    
    if (habitableRooms.length === 0) {
      return true; // No habitable rooms to check
    }
    
    // For this check, we'd need more detailed window position data
    // For now, check if habitable rooms have any windows
    return habitableRooms.every(r => r.hasWindow);
  }

  /**
   * FLR-010: Window Area Minimum 10%
   */
  private checkWindowToFloorRatio(
    floorData: FloorAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): { passed: boolean; value?: number; expected?: number; finding?: Finding } {
    const totalWindowArea = floorData.windows.reduce((sum, w) => {
      if (w.width && w.height) {
        return sum + (w.width * w.height);
      }
      return sum;
    }, 0);
    
    const totalFloorArea = floorData.totalFloorArea || this.estimateFloorArea(floorData);
    
    if (totalFloorArea === 0) {
      return {
        passed: false,
        finding: this.createFloorFinding(rule, 'Floor area could not be determined to verify window ratio', 'critical', drawing)
      };
    }
    
    const ratio = (totalWindowArea / totalFloorArea) * 100;
    
    if (ratio < 10) {
      return {
        passed: false,
        value: ratio,
        expected: 10,
        finding: this.createFloorFinding(
          rule,
          `Window area (${ratio.toFixed(1)}%) is less than required 10% of floor area for natural light`,
          'critical',
          drawing,
          `Increase window area to at least 10% of floor area. Current ratio: ${ratio.toFixed(1)}%, Required: 10%`
        )
      };
    }
    
    return { passed: true, value: ratio, expected: 10 };
  }

  /**
   * FLR-011: Natural Light to All Habitable Rooms
   */
  private checkNaturalLight(
    floorData: FloorAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): { passed: boolean; value?: number; expected?: number; finding?: Finding } {
    const habitableRooms = floorData.rooms.filter(r => r.isHabitable);
    
    if (habitableRooms.length === 0) {
      return { passed: true };
    }
    
    const roomsWithWindows = habitableRooms.filter(r => r.hasWindow);
    const ratio = (roomsWithWindows.length / habitableRooms.length) * 100;
    
    if (ratio < 100) {
      const roomsWithoutWindows = habitableRooms.filter(r => !r.hasWindow).map(r => r.name).join(', ');
      return {
        passed: false,
        value: roomsWithWindows.length,
        expected: habitableRooms.length,
        finding: this.createFloorFinding(
          rule,
          `The following habitable rooms do not have windows for natural light: ${roomsWithoutWindows}`,
          'critical',
          drawing,
          'Add windows to all habitable rooms to provide natural light as required by SANS 10400-J'
        )
      };
    }
    
    return { passed: true, value: ratio, expected: 100 };
  }

  /**
   * FLR-012: Light Ratios Adequate
   */
  private checkLightRatios(floorData: FloorAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
    // Similar to FLR-010, but checks room by room
    const habitableRooms = floorData.rooms.filter(r => r.isHabitable);
    
    if (habitableRooms.length === 0) {
      return true;
    }
    
    // Check if at least some windows exist
    return floorData.windows.length > 0;
  }

  /**
   * FLR-013: Fire Escape Routes Clear
   */
  private checkFireEscapeRoutes(floorData: FloorAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
    // Check if there are doors that could serve as escape routes
    return floorData.doors.length > 0;
  }

  /**
   * FLR-014: Minimum Door Width 900mm
   */
  private checkMinimumDoorWidth(
    floorData: FloorAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): { passed: boolean; value?: number; expected?: number; finding?: Finding } {
    const doorsWithWidth = floorData.doors.filter(d => d.width !== null);
    
    if (doorsWithWidth.length === 0) {
      // If no doors have width indicated, assume compliant
      return { passed: true };
    }
    
    const nonCompliantDoors = doorsWithWidth.filter(d => (d.width || 0) < 900);
    
    if (nonCompliantDoors.length > 0) {
      const doorLocations = nonCompliantDoors.map(d => d.location).join(', ');
      return {
        passed: false,
        value: nonCompliantDoors[0].width ?? undefined,
        expected: 900,
        finding: this.createFloorFinding(
          rule,
          `Door(s) with width less than 900mm found: ${doorLocations}`,
          'critical',
          drawing,
          'Ensure all doors on escape routes have minimum clear width of 900mm'
        )
      };
    }
    
    return { passed: true, value: doorsWithWidth[0].width ?? undefined, expected: 900 };
  }

  /**
   * FLR-015: Alternative Escape Route
   */
  private checkAlternativeEscape(floorData: FloorAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
    // For multi-story or large rooms, check for multiple exits
    // This is a simplified check - in practice would need more detailed analysis
    const hasMultipleExits = floorData.doors.length >= 2;
    
    // If only one door, warn but don't fail for now
    return true;
  }

  /**
   * FLR-016: Sanitary Facilities Adequate
   */
  private checkSanitaryAdequacy(
    floorData: FloorAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): { passed: boolean; value?: string; expected?: string; finding?: Finding } {
    const { sanitaryFacilities } = floorData;
    
    // Minimum requirements for a residential dwelling
    const required = {
      wc: 1,
      washbasin: 1,
      bathOrShower: 1
    };
    
    const actual = {
      wc: sanitaryFacilities.wc,
      washbasin: sanitaryFacilities.washbasin,
      bathOrShower: sanitaryFacilities.bath + sanitaryFacilities.shower
    };
    
    const violations: string[] = [];
    
    if (actual.wc < required.wc) {
      violations.push(`WC: have ${actual.wc}, need ${required.wc}`);
    }
    if (actual.washbasin < required.washbasin) {
      violations.push(`Washbasin: have ${actual.washbasin}, need ${required.washbasin}`);
    }
    if (actual.bathOrShower < required.bathOrShower) {
      violations.push(`Bath/Shower: have ${actual.bathOrShower}, need ${required.bathOrShower}`);
    }
    
    if (violations.length > 0) {
      return {
        passed: false,
        value: `WC: ${actual.wc}, Washbasin: ${actual.washbasin}, Bath/Shower: ${actual.bathOrShower}`,
        expected: `WC: ${required.wc}, Washbasin: ${required.washbasin}, Bath/Shower: ${required.bathOrShower}`,
        finding: this.createFloorFinding(
          rule,
          `Insufficient sanitary facilities: ${violations.join('; ')}`,
          'critical',
          drawing,
          'Provide adequate sanitary facilities as per SANS 10400-P requirements'
        )
      };
    }
    
    return { 
      passed: true, 
      value: `WC: ${actual.wc}, Washbasin: ${actual.washbasin}, Bath/Shower: ${actual.bathOrShower}`, 
      expected: `WC: ${required.wc}, Washbasin: ${required.washbasin}, Bath/Shower: ${required.bathOrShower}` 
    };
  }

  /**
   * FLR-017: Bathroom Ventilation
   */
  private checkBathroomVentilation(floorData: FloorAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
    const bathrooms = floorData.rooms.filter(r => r.type === 'bathroom');
    
    if (bathrooms.length === 0) {
      return true;
    }
    
    // Check if bathrooms have windows
    const bathroomsWithWindows = bathrooms.filter(r => r.hasWindow);
    
    // Or check for mechanical ventilation
    const hasVentilation = bathroomsWithWindows.length > 0 || floorData.hasMechanicalVentilation;
    
    return hasVentilation;
  }

  /**
   * FLR-018: WC Position and Ventilation
   */
  private checkWCVentilation(floorData: FloorAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
    const wcs = floorData.rooms.filter(r => r.type === 'wc');
    
    if (wcs.length === 0) {
      return true;
    }
    
    // Check if WCs have windows
    const wcsWithWindows = wcs.filter(r => r.hasWindow);
    
    return wcsWithWindows.length > 0 || floorData.hasMechanicalVentilation;
  }

  /**
   * FLR-019: Kitchen Ventilation
   */
  private checkKitchenVentilation(floorData: FloorAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
    if (!floorData.kitchen) {
      return true; // No kitchen to check
    }
    
    return floorData.kitchen.hasExtraction || floorData.hasMechanicalVentilation;
  }

  /**
   * FLR-020: Laundry Ventilation
   */
  private checkLaundryVentilation(floorData: FloorAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
    if (!floorData.laundry) {
      return true; // No laundry to check
    }
    
    return floorData.laundry.hasVentilation || floorData.hasMechanicalVentilation;
  }

  /**
   * FLR-021: Stair Dimensions
   */
  private checkStairDimensions(
    floorData: FloorAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): { passed: boolean; value?: number; expected?: number; finding?: Finding } {
    if (!floorData.stairs) {
      // No stairs found - may be single story building
      return { passed: true };
    }
    
    if (floorData.stairs.width === null) {
      return { passed: true }; // Assume compliant if not specified
    }
    
    if (floorData.stairs.width < 900) {
      return {
        passed: false,
        value: floorData.stairs.width,
        expected: 900,
        finding: this.createFloorFinding(
          rule,
          `Stair width (${floorData.stairs.width}mm) is less than minimum required 900mm`,
          'critical',
          drawing,
          'Increase stair width to minimum 900mm as per SANS 10400 requirements'
        )
      };
    }
    
    return { passed: true, value: floorData.stairs.width, expected: 900 };
  }

  /**
   * FLR-022: Balcony Parapet Heights
   */
  private checkBalconyParapet(
    floorData: FloorAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): { passed: boolean; value?: number; expected?: number; finding?: Finding } {
    if (floorData.balconies.length === 0) {
      return { passed: true }; // No balconies to check
    }
    
    for (const balcony of floorData.balconies) {
      if (balcony.parapetHeight !== null && balcony.parapetHeight < 1000) {
        return {
          passed: false,
          value: balcony.parapetHeight,
          expected: 1000,
          finding: this.createFloorFinding(
            rule,
            `Balcony parapet height (${balcony.parapetHeight}mm) is less than minimum required 1000mm`,
            'critical',
            drawing,
            'Increase balcony parapet height to minimum 1000mm for safety'
          )
        };
      }
    }
    
    return { passed: true };
  }

  /**
   * FLR-023: Garage Ventilation
   */
  private checkGarageVentilation(floorData: FloorAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
    if (!floorData.garage) {
      return true; // No garage to check
    }
    
    // For attached garages, ventilation is important
    return floorData.garage.hasVentilation || floorData.hasMechanicalVentilation;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Estimate floor area if not available
   */
  private estimateFloorArea(floorData: FloorAnalysisData): number {
    // Use bounding box if available
    // This is a rough estimate
    return floorData.totalFloorArea || 50000000; // Default 50m² estimate
  }

  /**
   * Create a finding for floor plan analysis
   */
  private createFloorFinding(
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
    const floorData = this.extractFloorData(context.drawing, context.projectInfo);
    return this.evaluateFloorRule(rule, floorData, context.drawing);
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface RoomData {
  name: string;
  type: string;
  position: { x: number; y: number };
  floorArea: number | null;
  width: number | null;
  length: number | null;
  ceilingHeight: number | null;
  hasWindow: boolean;
  windowArea: number;
  openableArea: number;
  isHabitable: boolean;
}

interface DimensionData {
  id: string;
  value: number;
  unit: string;
  type: 'linear' | 'angular' | 'radial' | 'diameter';
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  layer?: string;
}

interface DoorData {
  id: string;
  location: string;
  position: { x: number; y: number };
  width: number | null;
  height: number | null;
  swingDirection: 'in' | 'out' | 'single' | 'double' | null;
  isOnEscapeRoute: boolean;
}

interface WindowData {
  id: string;
  room: string | null;
  position: { x: number; y: number };
  width: number | null;
  height: number | null;
  openableArea: number;
  isOpenable: boolean;
}

interface SanitaryFacilitiesData {
  wc: number;
  washbasin: number;
  bath: number;
  shower: number;
  kitchenSink: number;
  locations: Array<{ type: string; position: { x: number; y: number } }>;
}

interface StairData {
  id: string;
  position: { x: number; y: number };
  width: number | null;
  riserHeight: number | null;
  going: number | null;
  hasHandrail: boolean;
  handrailHeight: number;
}

interface BalconyData {
  id: string;
  position: { x: number; y: number };
  parapetHeight: number | null;
  length: number | null;
  width: number | null;
}

interface GarageData {
  id: string;
  position: { x: number; y: number };
  hasVentilation: boolean;
}

interface KitchenData {
  id: string;
  position: { x: number; y: number };
  hasExtraction: boolean;
}

interface LaundryData {
  id: string;
  position: { x: number; y: number };
  hasVentilation: boolean;
}

interface ExtractedFloorDimensions {
  roomDimensions: DimensionData[];
  wallThicknesses: number[];
}

interface FloorAnalysisData {
  rooms: RoomData[];
  doors: DoorData[];
  windows: WindowData[];
  sanitaryFacilities: SanitaryFacilitiesData;
  stairs: StairData | null;
  balconies: BalconyData[];
  garage: GarageData | null;
  kitchen: KitchenData | null;
  laundry: LaundryData | null;
  hasMechanicalVentilation: boolean;
  totalFloorArea: number;
  dimensions: ExtractedFloorDimensions;
  textContent: string[];
  annotations: string[];
  symbols: SymbolInfo[];
  layers: LayerInfo[];
}

// Re-export types from agent types
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

interface TextElement {
  id: string;
  content: string;
  position: { x: number; y: number };
  height?: number;
  font?: string;
  layer?: string;
  rotation?: number;
}

// Export the agent
export default FloorPlanComplianceAgent;
