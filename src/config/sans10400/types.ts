/**
 * SANS 10400 Configuration Types
 * 
 * Drawing-specific check interfaces, room requirements, and energy DTS constants
 * for South African building compliance validation.
 */

// ============================================================================
// Room Requirement Constants
// ============================================================================

/**
 * SANS 10400 Room Requirements
 * All values in millimeters (mm) unless otherwise specified
 */
export const ROOM_REQUIREMENTS = {
  /**
   * Habitable room requirements per SANS 10400-A
   */
  habitable: {
    minCeilingHeight: 2400,        // mm - minimum ceiling height
    minFloorArea: 7000000,          // mm² - minimum floor area (7m²)
    minWidth: 2000,                // mm - minimum width
    minDepth: 2000,                // mm - minimum depth
    ventilationRatio: 0.10,        // 10% of floor area as openable windows
    windowAreaRatio: 0.10,         // 10% of floor area minimum window
    naturalLightRequired: true,
    mechanicalVentilationAllowed: true
  },
  
  /**
   * Bedroom requirements per SANS 10400-A
   * Classified as habitable room
   */
  bedroom: {
    minCeilingHeight: 2400,        // mm
    minFloorArea: 7000000,         // mm² (7m²)
    minWidth: 2000,                // mm
    minDepth: 2500,                // mm - for double bedroom
    windowAreaRatio: 0.10,         // 10% of floor area minimum
    ventilationRatio: 0.10,
    naturalLightRequired: true,
    mechanicalVentilationAllowed: true
  },
  
  /**
   * Bathroom requirements per SANS 10400-P
   */
  bathroom: {
    minCeilingHeight: 2100,        // mm - minimum for non-habitable
    minFloorArea: 2500000,         // mm² (2.5m²)
    minWidth: 1500,                // mm
    ventilationRequired: true,
    mechanicalVentilationArea: 500000, // mm² (0.5m²) if no window
    naturalVentilationAllowed: true,
    mechanicalVentilationAllowed: true
  },
  
  /**
   * Kitchen requirements per SANS 10400-P
   */
  kitchen: {
    minCeilingHeight: 2400,        // mm - if habitable use
    minFloorArea: 5000000,         // mm² (5m²)
    minWidth: 1800,                // mm
    ventilationRequired: true,
    mechanicalExtractionRequired: true,
    minExtractionRate: 500,        // L/s for commercial
    naturalVentilationAllowed: true
  },
  
  /**
   * Store room requirements
   */
  storeRoom: {
    minCeilingHeight: 2100,        // mm
    minFloorArea: 2000000,         // mm² (2m²)
    minWidth: 1200,                // mm
    ventilationRequired: false
  },
  
  /**
   * Garage requirements per SANS 10400-A
   */
  garage: {
    minCeilingHeight: 2100,        // mm
    minWidth: 2400,                // mm - for single garage
    doorHeight: 2100,               // mm - standard door height
    doorWidth: 2400,                // mm - single garage door
    ventilationRequired: true
  },
  
  /**
   * Corridor/ passage requirements
   */
  corridor: {
    minCeilingHeight: 2100,        // mm
    minWidth: 900,                  // mm - minimum
    recommendedWidth: 1200,        // mm - recommended
    minHeadroom: 2100              // mm
  }
} as const;

// ============================================================================
// Energy DTS Constants (SANS 10400-XA)
// ============================================================================

/**
 * Energy Deemed-to-Satisfy Requirements per SANS 10400-XA
 */
export const ENERGY_DTS = {
  /**
   * Wall thermal requirements
   */
  walls: {
    minRValue: 1.7,                // W/m²K - minimum R-value
    system: 'Cavity brick or insulated',
    alternatives: [
      { system: 'Solid brick 220mm', rValue: 0.65 },
      { system: 'Cavity brick', rValue: 1.9 },
      { system: 'AAC block 200mm', rValue: 1.8 },
      { system: 'Timber frame + insulation', rValue: 2.5 }
    ]
  },
  
  /**
   * Roof thermal requirements
   */
  roofs: {
    minRValue: 3.7,                // W/m²K - minimum R-value
    system: 'Insulated sheet or concrete',
    alternatives: [
      { system: 'Concrete roof + insulation', rValue: 3.7 },
      { system: 'Metal roof + insulation', rValue: 3.7 },
      { system: 'Timber rafters + insulation', rValue: 4.0 }
    ]
  },
  
  /**
   * Glazing requirements
   */
  glazing: {
    maxGlazingRatio: 0.50,          // 50% of floor area maximum
    maxSHGC: 0.72,                 // Solar Heat Gain Coefficient
    maxUValue: 3.1,                // W/m²K - window U-value
    alternatives: [
      { type: 'Single glazing', uValue: 5.8, shgc: 0.86 },
      { type: 'Double glazing clear', uValue: 2.8, shgc: 0.76 },
      { type: 'Double glazing low-E', uValue: 1.6, shgc: 0.55 },
      { type: 'Triple glazing', uValue: 0.8, shgc: 0.50 }
    ]
  },
  
  /**
   * Floor thermal requirements
   */
  floors: {
    minRValue: 0.75,               // W/m²K - minimum R-value
    alternatives: [
      { system: 'Concrete slab on ground', rValue: 0.85 },
      { system: 'Timber floor', rValue: 0.75 },
      { system: 'Suspended floor + insulation', rValue: 1.5 }
    ]
  },
  
  /**
   * Lighting efficiency requirements
   */
  lighting: {
    maxLuminaireEfficacy: 80,       // lumens per watt
    controlsRequired: true,
    daylightSensorRequired: true,
    occupancySensorRequired: false // for residential
  },
  
  /**
   * Orientation factors for energy calculation
   */
  orientationFactors: {
    north: 1.0,
    east: 0.9,
    south: 0.8,
    west: 0.85
  },
  
  /**
   * Shading coefficients
   */
  shading: {
    overhangProjectionFactor: 0.5,
    verticalBladeProjectionFactor: 0.3,
    recommendedOverhangWidth: 900   // mm
  }
} as const;

// ============================================================================
// Site Plan Check Interfaces
// ============================================================================

/**
 * Site plan check interface
 */
export interface SitePlanCheck {
  propertyBoundaries: boolean;
  buildingFootprint: boolean;
  setbacks: DimensionCheck;
  northPoint: boolean;
  coverage: CoverageCalculation;
  erfDetails: ErfInfo;
  buildingLines: BuildingLineCheck;
  existingStructures: boolean;
  accessPoints: AccessPointCheck;
  zoningCompliance: ZoningCheck;
  servitudeIndications: ServitudeCheck;
}

/**
 * Dimension check for setbacks
 */
export interface DimensionCheck {
  frontSetback: number | null;     // mm
  rearSetback: number | null;        // mm
  leftSetback: number | null;       // mm
  rightSetback: number | null;      // mm
  isCompliant: boolean;
}

/**
 * Coverage calculation
 */
export interface CoverageCalculation {
  erfArea: number;                  // mm²
  buildingArea: number;             // mm²
  coveragePercentage: number;       // %
  maxAllowedCoverage: number;       // %
  isCompliant: boolean;
}

/**
 * Erf information
 */
export interface ErfInfo {
  erfNumber: string | null;
  streetAddress: string | null;
  zoning: string | null;
  zoningCategory: 'residential' | 'commercial' | 'industrial' | null;
}

/**
 * Building line check
 */
export interface BuildingLineCheck {
  frontBuildingLine: number | null;
  sideBuildingLine: number | null;
  rearBuildingLine: number | null;
  servitudesShown: boolean;
  isCompliant: boolean;
}

/**
 * Access point check
 */
export interface AccessPointCheck {
  drivewayShown: boolean;
  pedestrianAccess: boolean;
  garageAccess: boolean;
  emergencyAccess: boolean;
}

/**
 * Zoning compliance check
 */
export interface ZoningCheck {
  currentZoning: string | null;
  permittedUses: string[];
  isPermitted: boolean;
}

/**
 * Servitude check
 */
export interface ServitudeCheck {
  shown: boolean;
  type: 'electrical' | 'sewer' | 'water' | 'access' | null;
  width: number | null;
}

// ============================================================================
// Floor Plan Check Interfaces
// ============================================================================

/**
 * Floor plan check interface
 */
export interface FloorPlanCheck {
  roomDimensions: boolean;
  roomNames: boolean;
  wallThickness: boolean;
  doors: DoorCheck[];
  windows: WindowCheck[];
  sanitaryFittings: SanitaryCheck;
  circulation: CirculationCheck;
  ventilation: VentilationCheck;
  lighting: LightingCheck;
  fireExits: FireExitCheck;
  ceilingHeights: CeilingHeightCheck;
  roomAreas: RoomAreaCheck[];
}

/**
 * Door check
 */
export interface DoorCheck {
  id: string;
  location: string;
  width: number | null;            // mm
  height: number | null;           // mm
  swingDirection: 'in' | 'out' | 'single' | 'double' | null;
  fireRated: boolean;
  isCompliant: boolean;
}

/**
 * Window check
 */
export interface WindowCheck {
  id: string;
  room: string;
  width: number | null;            // mm
  height: number | null;           // mm
  openableArea: number | null;     // mm²
  floorAreaRatio: number | null;   // %
  isCompliant: boolean;
}

/**
 * Sanitary check
 */
export interface SanitaryCheck {
  wcCount: number;
  washbasinCount: number;
  bathCount: number;
  showerCount: number;
  kitchenSinkCount: number;
  requiredByCode: SanitaryRequirements;
  isCompliant: boolean;
}

/**
 * Sanitary requirements per occupancy
 */
export interface SanitaryRequirements {
  wcRequired: number;
  washbasinRequired: number;
  showerRequired: number;
}

/**
 * Circulation check
 */
export interface CirculationCheck {
  corridorsWidth: number | null;   // mm
  exitsClear: boolean;
  travelDistance: number | null;    // mm
  maxTravelDistance: number;
  isCompliant: boolean;
}

/**
 * Ventilation check
 */
export interface VentilationCheck {
  naturalVentilation: NaturalVentilationCheck;
  mechanicalVentilation: MechanicalVentilationCheck;
  isCompliant: boolean;
}

/**
 * Natural ventilation check
 */
export interface NaturalVentilationCheck {
  roomsWithWindows: number;
  totalRooms: number;
  openableAreaRatio: number;
  minRequiredRatio: number;
  isCompliant: boolean;
}

/**
 * Mechanical ventilation check
 */
export interface MechanicalVentilationCheck {
  installed: boolean;
  airChangesPerHour: number | null;
  location: string | null;
  isCompliant: boolean;
}

/**
 * Lighting check
 */
export interface LightingCheck {
  naturalLight: NaturalLightCheck;
  artificialLight: ArtificialLightCheck;
  isCompliant: boolean;
}

/**
 * Natural light check
 */
export interface NaturalLightCheck {
  roomsWithWindows: number;
  totalRooms: number;
  windowToFloorRatio: number;
  minRequiredRatio: number;
  isCompliant: boolean;
}

/**
 * Artificial light check
 */
export interface ArtificialLightCheck {
  switchesShown: boolean;
  lightPointsShown: boolean;
  emergencyLighting: boolean;
}

/**
 * Fire exit check
 */
export interface FireExitCheck {
  exitsCount: number;
  exitWidth: number | null;        // mm
  travelDistance: number | null;    // mm
  emergencyLighting: boolean;
  isCompliant: boolean;
}

/**
 * Ceiling height check
 */
export interface CeilingHeightCheck {
  habitableRooms: CeilingHeightRoom[];
  nonHabitableRooms: CeilingHeightRoom[];
  isCompliant: boolean;
}

/**
 * Ceiling height per room
 */
export interface CeilingHeightRoom {
  roomName: string;
  height: number | null;           // mm
  minRequired: number;              // mm
  isCompliant: boolean;
}

/**
 * Room area check
 */
export interface RoomAreaCheck {
  roomName: string;
  roomType: 'habitable' | 'bedroom' | 'bathroom' | 'kitchen' | 'store' | 'other';
  floorArea: number | null;          // mm²
  minRequired: number;              // mm²
  isCompliant: boolean;
}

// ============================================================================
// Elevation Check Interfaces
// ============================================================================

/**
 * Elevation check interface
 */
export interface ElevationCheck {
  naturalGroundLine: boolean;
  finishedGroundLine: boolean;
  buildingHeight: HeightCheck;
  roofPitch: RoofCheck;
  externalFinishes: FinishCheck;
  glazingAreas: GlazingCheck[];
  boundaryDistances: DistanceCheck[];
  shading: ShadingCheck;
  parapetHeight: number | null;     // mm
  isCompliant: boolean;
}

/**
 * Height check
 */
export interface HeightCheck {
  totalHeight: number | null;       // mm
  maxAllowedHeight: number | null;  // mm
  measurementPoint: string;
  isCompliant: boolean;
}

/**
 * Roof check
 */
export interface RoofCheck {
  pitch: number | null;             // degrees
  material: string | null;
  insulation: boolean;
  isCompliant: boolean;
}

/**
 * Finish check
 */
export interface FinishCheck {
  materialSpecified: boolean;
  material: string | null;
  colour: string | null;
  fireRating: number | null;        // minutes
  isCompliant: boolean;
}

/**
 * Glazing check per elevation
 */
export interface GlazingCheck {
  elevation: 'front' | 'back' | 'left' | 'right';
  windowArea: number | null;        // mm²
  wallArea: number | null;           // mm²
  glazingRatio: number | null;       // %
  maxAllowedRatio: number;
  isCompliant: boolean;
}

/**
 * Distance check to boundary
 */
export interface DistanceCheck {
  side: 'front' | 'back' | 'left' | 'right';
  distance: number | null;          // mm
  minRequired: number | null;        // mm
  isCompliant: boolean;
}

/**
 * Shading check
 */
export interface ShadingCheck {
  overhangsShown: boolean;
  verticalBladesShown: boolean;
  pergolaShown: boolean;
  treesShown: boolean;
}

// ============================================================================
// Section Check Interfaces
// ============================================================================

/**
 * Section check interface
 */
export interface SectionCheck {
  foundationDepth: FoundationCheck;
  floorBuildUp: FloorBuildUp;
  wallConstruction: WallCheck;
  roofStructure: RoofStructureCheck;
  insulation: InsulationCheck;
  fireRatings: FireRatingCheck;
  ceilingHeights: CeilingHeightSection[];
  dampProofCourse: DPCheck;
  isCompliant: boolean;
}

/**
 * Foundation check
 */
export interface FoundationCheck {
  depth: number | null;             // mm
  width: number | null;              // mm
  type: string | null;
  minDepthRequired: number;          // mm
  isCompliant: boolean;
}

/**
 * Floor build-up
 */
export interface FloorBuildUp {
  layers: FloorLayer[];
  totalThickness: number | null;     // mm
  insulation: boolean;
  isCompliant: boolean;
}

/**
 * Floor layer
 */
export interface FloorLayer {
  material: string;
  thickness: number | null;         // mm
  rValue: number | null;            // W/m²K
}

/**
 * Wall construction check
 */
export interface WallCheck {
  type: string | null;
  thickness: number | null;         // mm
  layers: WallLayer[];
  fireRating: number | null;        // minutes
  isCompliant: boolean;
}

/**
 * Wall layer
 */
export interface WallLayer {
  material: string;
  thickness: number | null;         // mm
  rValue: number | null;            // W/m²K
}

/**
 * Roof structure check
 */
export interface RoofStructureCheck {
  type: string | null;
  material: string | null;
  spacing: number | null;          // mm
  spans: number | null;             // mm
  isCompliant: boolean;
}

/**
 * Insulation check
 */
export interface InsulationCheck {
  wallInsulation: boolean;
  roofInsulation: boolean;
  floorInsulation: boolean;
  rValues: InsulationValues;
  isCompliant: boolean;
}

/**
 * Insulation R-values
 */
export interface InsulationValues {
  wallRValue: number | null;        // W/m²K
  roofRValue: number | null;         // W/m²K
  floorRValue: number | null;        // W/m²K
}

/**
 * Fire rating check
 */
export interface FireRatingCheck {
  walls: number | null;             // minutes
  floors: number | null;            // minutes
  roof: number | null;               // minutes
  columns: number | null;            // minutes
  isCompliant: boolean;
}

/**
 * Ceiling height in section
 */
export interface CeilingHeightSection {
  location: string;
  height: number | null;            // mm
  minRequired: number;              // mm
  isCompliant: boolean;
}

/**
 * Damp proof course check
 */
export interface DPCheck {
  indicated: boolean;
  height: number | null;            // mm
  type: string | null;
}

// ============================================================================
// Drainage Check Interfaces
// ============================================================================

/**
 * Drainage check interface
 */
export interface DrainageCheck {
  soilWasteLines: PipeCheck[];
  gulleyPositions: GulleyCheck[];
  manholes: ManholeCheck[];
  sewerConnection: ConnectionCheck;
  pipeSizes: PipeSizeCheck;
  gradients: GradientCheck;
  ventPipes: VentCheck;
  waterSupply: SupplyCheck;
  isCompliant: boolean;
}

/**
 * Pipe check
 */
export interface PipeCheck {
  id: string;
  type: 'soil' | 'waste' | 'vent' | 'rainwater';
  diameter: number | null;          // mm
  material: string | null;
  connections: string[];
  isCompliant: boolean;
}

/**
 * Gulley check
 */
export interface GulleyCheck {
  id: string;
  position: { x: number; y: number };
  type: 'floor' | 'gutter' | 'yard';
  diameter: number | null;          // mm
  isCompliant: boolean;
}

/**
 * Manhole check
 */
export interface ManholeCheck {
  id: string;
  position: { x: number; y: number };
  depth: number | null;              // mm
  diameter: number | null;           // mm
  coverType: string | null;
  isCompliant: boolean;
}

/**
 * Connection check
 */
export interface ConnectionCheck {
  municipalConnection: boolean;
  septicTank: boolean;
  connectionPoint: { x: number; y: number } | null;
  isCompliant: boolean;
}

/**
 * Pipe size check
 */
export interface PipeSizeCheck {
  soilPipe: number | null;          // mm
  wastePipe: number | null;          // mm
  rainwaterPipe: number | null;      // mm
  ventPipe: number | null;           // mm
  isCompliant: boolean;
}

/**
 * Gradient check
 */
export interface GradientCheck {
  soilGradient: number | null;       // %
  wasteGradient: number | null;      // %
  minGradient: number;               // %
  isCompliant: boolean;
}

/**
 * Vent check
 */
export interface VentCheck {
  shown: boolean;
  positions: { x: number; y: number }[];
  terminationHeight: number | null;  // mm
  isCompliant: boolean;
}

/**
 * Water supply check
 */
export interface SupplyCheck {
  coldWaterShown: boolean;
  hotWaterShown: boolean;
  meterPosition: { x: number; y: number } | null;
  isCompliant: boolean;
}

// ============================================================================
// Fire Layout Check Interfaces
// ============================================================================

/**
 * Fire layout check interface
 */
export interface FireLayoutCheck {
  required: boolean;
  escapeRoutes: EscapeRouteCheck;
  fireDoors: FireDoorCheck;
  travelDistances: TravelCheck;
  fireWalls: FireWallCheck;
  extinguishers: ExtinguisherCheck;
  emergencyLighting: EmergencyLightingCheck;
  smokeVents: SmokeVentCheck;
  fireAlarm: FireAlarmCheck;
  sprinklerSystem: SprinklerCheck;
  isCompliant: boolean;
}

/**
 * Escape route check
 */
export interface EscapeRouteCheck {
  primaryRoutes: EscapeRoute[];
  secondaryRoutes: EscapeRoute[];
  allRoutesClear: boolean;
  isCompliant: boolean;
}

/**
 * Escape route
 */
export interface EscapeRoute {
  id: string;
  fromRoom: string;
  toExit: string;
  width: number | null;              // mm
  obstacles: string[];
  isClear: boolean;
}

/**
 * Fire door check
 */
export interface FireDoorCheck {
  doors: FireDoor[];
  isCompliant: boolean;
}

/**
 * Fire door
 */
export interface FireDoor {
  id: string;
  location: string;
  rating: 'FD30' | 'FD60' | 'FD90' | null;
  selfClosing: boolean;
  isCompliant: boolean;
}

/**
 * Travel distance check
 */
export interface TravelCheck {
  maxTravelDistance: number | null; // mm
  actualTravelDistance: number | null; // mm
  maxAllowed: number;                // mm
  isCompliant: boolean;
}

/**
 * Fire wall check
 */
export interface FireWallCheck {
  walls: FireWall[];
  isCompliant: boolean;
}

/**
 * Fire wall
 */
export interface FireWall {
  id: string;
  location: string;
  rating: number | null;             // minutes
  extendsToRoof: boolean;
  isCompliant: boolean;
}

/**
 * Extinguisher check
 */
export interface ExtinguisherCheck {
  shown: boolean;
  types: string[];
  positions: { x: number; y: number }[];
  isCompliant: boolean;
}

/**
 * Emergency lighting check
 */
export interface EmergencyLightingCheck {
  shown: boolean;
  positions: { x: number; y: number }[];
  batteryBackup: boolean;
  isCompliant: boolean;
}

/**
 * Smoke vent check
 */
export interface SmokeVentCheck {
  shown: boolean;
  positions: { x: number; y: number }[];
  automatic: boolean;
  isCompliant: boolean;
}

/**
 * Fire alarm check
 */
export interface FireAlarmCheck {
  shown: boolean;
  type: string | null;
  zones: number | null;
  isCompliant: boolean;
}

/**
 * | Sprinkler check
 */
export interface SprinklerCheck {
  installed: boolean;
  coverage: 'full' | 'partial' | 'none';
  type: string | null;
  isCompliant: boolean;
}

// ============================================================================
// Energy Check Interfaces
// ============================================================================

/**
 * Energy check interface
 */
export interface EnergyCheck {
  xaFormComplete: boolean;
  deemedToSatisfy: DTSCheck;
  thermalPerformance: ThermalCheck;
  glazingLimits: GlazingLimitCheck;
  insulation: EnergyInsulationCheck;
  lightingEfficiency: EnergyLightingCheck;
  orientation: OrientationCheck;
  isCompliant: boolean;
}

/**
 * Deemed-to-satisfy check
 */
export interface DTSCheck {
  walls: boolean;
  roof: boolean;
  glazing: boolean;
  lighting: boolean;
  overall: boolean;
}

/**
 * Thermal performance check
 */
export interface ThermalCheck {
  wallRValue: number | null;        // W/m²K
  roofRValue: number | null;         // W/m²K
  floorRValue: number | null;        // W/m²K
  meetsMinRequirements: boolean;
}

/**
 * Glazing limit check
 */
export interface GlazingLimitCheck {
  totalGlazingArea: number | null;   // mm²
  totalFloorArea: number | null;     // mm²
  glazingRatio: number | null;       // %
  maxAllowedRatio: number;
  isCompliant: boolean;
}

/**
 * Energy insulation check
 */
export interface EnergyInsulationCheck {
  wallInsulation: boolean;
  roofInsulation: boolean;
  specifiedRValues: InsulationValues;
  isCompliant: boolean;
}

/**
 * Energy lighting check
 */
export interface EnergyLightingCheck {
  efficientLights: boolean;
  controlsShown: boolean;
  daylightSensor: boolean;
  occupancySensor: boolean;
  isCompliant: boolean;
}

/**
 * Orientation check
 */
export interface OrientationCheck {
  northOrientation: number | null;   // degrees
  optimalOrientation: boolean;
  shadingDevices: boolean;
}

// ============================================================================
// Fire Safety Constants
// ============================================================================

/**
 * SANS 10400-T Fire Safety Requirements
 */
export const FIRE_SAFETY = {
  /**
   * Maximum travel distances
   */
  travelDistance: {
    unsprinklered: 45000,            // mm - 45m
    sprinklered: 60000,             // mm - 60m
    deadEndCorridor: 18000           // mm - 18m
  },
  
  /**
   * Minimum exit widths
   */
  exitWidth: {
    perPerson: 10,                  // mm per person
    minSingleDoor: 750,             // mm
    minDoubleDoor: 1200,            // mm
    minCorridor: 1100               // mm
  },
  
  /**
   * Fire door ratings (minutes)
   */
  fireDoorRatings: {
    corridorWall: 30,                // FD30
    compartmentWall: 60,             // FD60
    fireZoneWall: 120                // FD120
  },
  
  /**
   * Fire separation requirements
   */
  separation: {
    toBoundary: 1000,                // mm - 1m
    toOtherBuilding: 3000,          // mm - 3m
    betweenUnits: 60                // minutes
  }
} as const;

// ============================================================================
// Sanitary Requirements Constants
// ============================================================================

/**
 * SANS 10400-P Sanitary Requirements per occupant
 */
export const SANITARY_REQUIREMENTS = {
  /**
   * Residential dwelling unit
   */
  residential: {
    wc: 1,
    washbasin: 1,
    bathOrShower: 1,
    kitchenSink: 1
  },
  
  /**
   * Residential with 1-5 occupants
   */
  residential1to5: {
    wc: 1,
    washbasin: 1,
    bathOrShower: 1,
    kitchenSink: 1
  },
  
  /**
   * Residential with 6-10 occupants
   */
  residential6to10: {
    wc: 2,
    washbasin: 2,
    bathOrShower: 2,
    kitchenSink: 1
  },
  
  /**
   * Office (per 25 employees)
   */
  office: {
    wc: 1,
    washbasin: 1,
    shower: 1,                       // if manual work
    kitchenSink: 1
  }
} as const;

// ============================================================================
// Setback Requirements Constants
// ============================================================================

/**
 * Common setback requirements per SANS 10400-A
 * These vary by municipality and zoning
 */
export const SETBACK_REQUIREMENTS = {
  /**
   * Residential 1 zoning default setbacks
   */
  residential1: {
    front: 3000,                    // mm
    rear: 1000,                     // mm
    side: 1000,                     // mm
    maxCoverage: 0.50               // 50%
  },
  
  /**
   * Residential 2 zoning default setbacks
   */
  residential2: {
    front: 5000,                    // mm
    rear: 3000,                     // mm
    side: 3000,                     // mm
    maxCoverage: 0.40               // 40%
  },
  
  /**
   * Residential 3 zoning default setbacks
   */
  residential3: {
    front: 8000,                    // mm
    rear: 5000,                     // mm
    side: 5000,                     // mm
    maxCoverage: 0.30               // 30%
  },
  
  /**
   * Commercial zoning default setbacks
   */
  commercial: {
    front: 5000,                    // mm
    rear: 3000,                     // mm
    side: 3000,                     // mm
    maxCoverage: 0.60               // 60%
  }
} as const;

// ============================================================================
// Export Types (interfaces are already exported above)
// ============================================================================
