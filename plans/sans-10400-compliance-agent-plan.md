# AI Agent System - Comprehensive SANS 10400 Compliance Implementation Plan

## Overview

This document details the mandatory drawings and SANS 10400 compliance requirements for South African municipal council submissions, specifically tailored for City of Johannesburg and Gauteng municipalities.

---

## 1. Mandatory Drawings for Council Submission

### Drawing Set Requirements

| Drawing Type | Purpose | Priority |
|--------------|---------|----------|
| Site Plan | Zoning compliance, setbacks | Critical |
| Floor Plans | Occupancy, ventilation, fire exits | Critical |
| Elevations | Height, materials, energy | High |
| Sections | Construction, fire ratings | High |
| Drainage/Plumbing | SANS 10252 compliance | Critical |
| Fire Layout | SANS 10400-T compliance | Conditional |
| Energy Efficiency | SANS 10400-XA compliance | Critical |

---

## 2. Site Plan Agent (SANS 10400-A)

### Agent: SitePlanComplianceAgent

**Purpose**: Validate site plan against zoning by-laws and SANS 10400-A

### Required Checks

```typescript
interface SitePlanCheck {
  propertyBoundaries: boolean;      // Property dimensions shown
  buildingFootprint: boolean;       // Building outline
  setbacks: DimensionCheck;         // Dimensioned setbacks from boundaries
  northPoint: boolean;              // North arrow present
  coverage: CoverageCalculation;    // Building coverage %
  erfDetails: ErfInfo;              // Erf number, street, zoning
  buildingLines: BuildingLineCheck; // Servitudes shown
  existingStructures: boolean;      // Existing buildings indicated
  accessPoints: boolean;            // Driveway access shown
}
```

### Council Examiner Focus Areas

| Check | Standard | Rejection Risk |
|-------|----------|----------------|
| Zoning verification | Local by-law | **Critical** |
| Building lines | SANS 10400-A | **Critical** |
| Coverage calculation | SANS 10400-A | High |
| Setback dimensions | SANS 10400-A | High |
| Servitudes | SANS 10400-A | High |
| Erf number/street | Local by-law | Medium |

### Compliance Rules

```typescript
const sitePlanRules: ComplianceRule[] = [
  {
    id: 'SITE-001',
    standard: 'SANS 10400-A',
    check: 'Property boundaries dimensioned',
    severity: 'critical',
    minRequirements: ['Boundary dimensions', 'Total area']
  },
  {
    id: 'SITE-002',
    standard: 'SANS 10400-A',
    check: 'Building setbacks',
    severity: 'critical',
    minRequirements: ['Front setback', 'Side setbacks', 'Rear setback']
  },
  {
    id: 'SITE-003',
    standard: 'SANS 10400-A',
    check: 'Building coverage',
    severity: 'critical',
    calculation: 'buildingFootprint / totalErfArea <= maxCoverage'
  },
  {
    id: 'SITE-004',
    standard: 'SANS 10400-A',
    check: 'North point',
    severity: 'high',
    requirement: 'North arrow with orientation'
  }
];
```

---

## 3. Floor Plans Agent (SANS 10400-A, O, T, XA)

### Agent: FloorPlanComplianceAgent

**Purpose**: Validate floor plans against occupancy, ventilation, lighting, and fire requirements

### Required Checks

```typescript
interface FloorPlanCheck {
  roomDimensions: boolean;           // All rooms dimensioned
  roomNames: boolean;                // Room labels present
  wallThickness: boolean;             // Wall dimensions shown
  doorSizes: DoorCheck[];            // Door dimensions and swing
  windowSizes: WindowCheck[];         // Window dimensions
  sanitaryFittings: SanitaryCheck;   // Fixtures shown
  circulation: CirculationCheck;      // Exit paths clear
  ventilation: VentilationCheck;      // Windows per room
  lighting: LightingCheck;           // Natural light ratios
  fireExits: FireExitCheck;          // Escape routes
}
```

### Council Examiner Focus Areas

| Check | Standard | Rejection Risk |
|-------|----------|----------------|
| Habitable room dimensions | SANS 10400-A | **Critical** |
| Minimum ceiling height (2.4m) | SANS 10400-A | **Critical** |
| Ventilation ratios | SANS 10400-O | **Critical** |
| Window area (10% floor) | SANS 10400-J | **Critical** |
| Fire escape routes | SANS 10400-T | **Critical** |
| Sanitary facilities | SANS 10400-P | High |
| Door dimensions | SANS 10400-A | Medium |

### Room Requirements

```typescript
const roomRequirements = {
  habitable: {
    minCeilingHeight: 2400,        // mm
    minFloorArea: 7000,            // mm² (approx 7m²)
    minWidth: 2000,               // mm
    ventilation: '10% floor area or mechanical'
  },
  bedroom: {
    minFloorArea: 7000,            // mm²
    minWidth: 2000,               // mm
    windowArea: '10% floor area minimum'
  },
  bathroom: {
    minFloorArea: 2500,           // mm²
    ventilation: 'Mechanical or 0.5m² opening'
  },
  kitchen: {
    minFloorArea: 5000,           // mm²
    ventilation: 'Mechanical extraction required'
  }
};
```

### Compliance Rules

```typescript
const floorPlanRules: ComplianceRule[] = [
  {
    id: 'FLR-001',
    standard: 'SANS 10400-A',
    check: 'Room dimensions shown',
    severity: 'critical',
    requirement: 'All rooms dimensioned'
  },
  {
    id: 'FLR-002',
    standard: 'SANS 10400-A',
    check: 'Ceiling height',
    severity: 'critical',
    requirement: 'Minimum 2400mm for habitable rooms'
  },
  {
    id: 'FLR-003',
    standard: 'SANS 10400-O',
    check: 'Ventilation',
    severity: 'critical',
    requirement: '10% floor area as openable windows or mechanical'
  },
  {
    id: 'FLR-004',
    standard: 'SANS 10400-J',
    check: 'Natural lighting',
    severity: 'critical',
    requirement: '10% floor area minimum window'
  },
  {
    id: 'FLR-005',
    standard: 'SANS 10400-T',
    check: 'Fire escape routes',
    severity: 'critical',
    requirement: 'Clear path to exit from all rooms'
  },
  {
    id: 'FLR-006',
    standard: 'SANS 10400-P',
    check: 'Sanitary facilities',
    severity: 'high',
    requirement: 'Adequate sanitary fitments per occupancy'
  }
];
```

---

## 4. Elevations Agent (SANS 10400-A, T, XA)

### Agent: ElevationComplianceAgent

**Purpose**: Validate elevations against height limits, fire separation, and energy requirements

### Required Checks

```typescript
interface ElevationCheck {
  naturalGroundLine: boolean;       // Existing vs finished ground
  buildingHeight: HeightCheck;      // Total height dimensioned
  roofPitch: RoofCheck;             // Pitch and material shown
  externalFinishes: FinishCheck;     // Materials specified
  glazingArea: GlazingCheck;        // Window areas per elevation
  boundaryDistance: DistanceCheck;  // Distance to boundaries shown
  shading: ShadingCheck;            // Overhangs, shading devices
}
```

### Council Examiner Focus Areas

| Check | Standard | Rejection Risk |
|-------|----------|----------------|
| Building height | Local by-law | **Critical** |
| Fire separation | SANS 10400-T | **Critical** |
| Roof materials | SANS 10400-A | High |
| Glazing ratios | SANS 10400-XA | High |
| External finishes | SANS 10400-A | Medium |

### Compliance Rules

```typescript
const elevationRules: ComplianceRule[] = [
  {
    id: 'ELV-001',
    standard: 'SANS 10400-A',
    check: 'Ground line shown',
    severity: 'critical',
    requirement: 'Both natural and finished ground lines'
  },
  {
    id: 'ELV-002',
    standard: 'Local by-law',
    check: 'Building height',
    severity: 'critical',
    requirement: 'Within maximum height allowed for zone'
  },
  {
    id: 'ELV-003',
    standard: 'SANS 10400-T',
    check: 'Fire separation',
    severity: 'critical',
    requirement: 'Distance to boundaries meets fire requirements'
  },
  {
    id: 'ELV-004',
    standard: 'SANS 10400-XA',
    check: 'Glazing percentage',
    severity: 'high',
    requirement: 'Total glazing within energy limits'
  }
];
```

---

## 5. Sections Agent (SANS 10400-A, K, L, J)

### Agent: SectionComplianceAgent

**Purpose**: Validate sections against construction, fire, and structural requirements

### Required Checks

```typescript
interface SectionCheck {
  foundationDepth: FoundationCheck;   // Foundation dimensions
  floorBuildUp: FloorBuildUp;         // Floor construction layers
  wallConstruction: WallCheck;        // Wall build-up shown
  roofStructure: RoofStructureCheck;   // Roof framing indicated
  insulation: InsulationCheck;        // Insulation specified
  fireRatings: FireRatingCheck;       // Fire resistance indicated
  ceilingHeight: CeilingHeightCheck; // Room heights verified
}
```

### Council Examiner Focus Areas

| Check | Standard | Rejection Risk |
|-------|----------|----------------|
| Foundation depth | SANS 10400-A | **Critical** |
| Wall construction | SANS 10400-K | **Critical** |
| Fire ratings | SANS 10400-L | **Critical** |
| Insulation | SANS 10400-XA | High |
| Ceiling heights | SANS 10400-A | High |

### Compliance Rules

```typescript
const sectionRules: ComplianceRule[] = [
  {
    id: 'SEC-001',
    standard: 'SANS 10400-A',
    check: 'Foundation depth',
    severity: 'critical',
    requirement: 'Foundation depth indicated'
  },
  {
    id: 'SEC-002',
    standard: 'SANS 10400-K',
    check: 'Wall construction',
    severity: 'critical',
    requirement: 'Wall build-up shown with materials'
  },
  {
    id: 'SEC-003',
    standard: 'SANS 10400-L',
    check: 'Fire ratings',
    severity: 'critical',
    requirement: 'Fire resistance period indicated for elements'
  },
  {
    id: 'SEC-004',
    standard: 'SANS 10400-XA',
    check: 'Insulation',
    severity: 'high',
    requirement: 'Thermal insulation specified'
  }
];
```

---

## 6. Drainage/Plumbing Agent (SANS 10400-P, SANS 10252)

### Agent: DrainageComplianceAgent

**Purpose**: Validate plumbing layout against SANS 10252 and municipal requirements

### Required Checks

```typescript
interface DrainageCheck {
  soilWasteLines: PipeCheck[];      // Soil and waste pipes
  gulleyPositions: GulleyCheck[];  // Floor gulley locations
  manholes: ManholeCheck[];          // Inspection chambers
  sewerConnection: ConnectionCheck;  // Municipal connection
  pipeSizes: PipeSizeCheck;          // Diameters indicated
  gradients: GradientCheck;          // Fall percentages
  ventPipes: VentCheck;             // Ventilation shown
  waterSupply: SupplyCheck;         // Cold/hot water layout
}
```

### Council Examiner Focus Areas

| Check | Standard | Rejection Risk |
|-------|----------|----------------|
| Pipe sizes | SANS 10252 | **Critical** |
| Gradients | SANS 10252 | **Critical** |
| Connection point | SANS 10400-P | **Critical** |
| Manhole positions | SANS 10252 | High |
| Fixture positions | SANS 10252 | High |

### Common Rejection Reasons

1. Pipe sizes not indicated
2. Gradients not shown
3. Missing floor gullies
4. No connection to municipal sewer
5. Missing cleanouts

### Compliance Rules

```typescript
const drainageRules: ComplianceRule[] = [
  {
    id: 'DRN-001',
    standard: 'SANS 10252',
    check: 'Pipe sizes indicated',
    severity: 'critical',
    requirement: 'All pipe diameters shown'
  },
  {
    id: 'DRN-002',
    standard: 'SANS 10252',
    check: 'Gradients',
    severity: 'critical',
    requirement: 'Fall percentages indicated'
  },
  {
    id: 'DRN-003',
    standard: 'SANS 10400-P',
    check: 'Municipal connection',
    severity: 'critical',
    requirement: 'Connection to sewer point shown'
  },
  {
    id: 'DRN-004',
    standard: 'SANS 10252',
    check: 'Manholes',
    severity: 'high',
    requirement: 'Inspection chambers at junctions'
  }
];
```

---

## 7. Fire Layout Agent (SANS 10400-T)

### Agent: FireComplianceAgent

**Purpose**: Validate fire safety provisions (required for multi-storey, commercial)

### Required Checks (Conditional)

```typescript
interface FireLayoutCheck {
  required: boolean;                 // Is fire layout required?
  escapeRoutes: EscapeRouteCheck;   // Exit paths shown
  fireDoors: FireDoorCheck;         // Fire door positions
  travelDistances: TravelCheck;     // Max travel distance
  fireWalls: FireWallCheck;         // Fire separation walls
  fireExtinguishers: ExtinguisherCheck; // Equipment locations
  emergencyLighting: LightingCheck; // Emergency lighting shown
  smokeVents: SmokeVentCheck;       // Smoke ventilation
}
```

### When Required

- Multi-storey buildings (2+ floors)
- Second dwellings on property
- Commercial or mixed-use buildings
- Buildings over 500m²

### Council Examiner Focus Areas

| Check | Standard | Rejection Risk |
|-------|----------|----------------|
| Escape routes | SANS 10400-T | **Critical** |
| Travel distance | SANS 10400-T | **Critical** |
| Fire doors | SANS 10400-T | **Critical** |
| Fire separation | SANS 10400-T | **Critical** |

### Compliance Rules

```typescript
const fireRules: ComplianceRule[] = [
  {
    id: 'FIRE-001',
    standard: 'SANS 10400-T',
    check: 'Escape routes',
    severity: 'critical',
    requirement: 'Clear path to exit from all occupied spaces'
  },
  {
    id: 'FIRE-002',
    standard: 'SANS 10400-T',
    check: 'Travel distance',
    severity: 'critical',
    requirement: 'Max 45m to exit (unsprinklered)'
  },
  {
    id: 'FIRE-003',
    standard: 'SANS 10400-T',
    check: 'Fire doors',
    severity: 'critical',
    requirement: 'FD30/FD60 doors where required'
  },
  {
    id: 'FIRE-004',
    standard: 'SANS 10400-T',
    check: 'Fire walls',
    severity: 'critical',
    requirement: 'Fire rated walls to boundaries'
  }
];
```

---

## 8. Energy Efficiency Agent (SANS 10400-XA, SANS 204)

### Agent: EnergyComplianceAgent

**Purpose**: Validate energy performance (mandatory since 2011)

### Required Checks

```typescript
interface EnergyCheck {
  xaFormComplete: boolean;         // XA form signed
  deemedToSatisfy: DTSCheck;        // DTS values met
  thermalPerformance: ThermalCheck;  // R-values shown
  glazingLimits: GlazingLimitCheck; // Total glazing %
  insulation: InsulationCheck;       // Insulation specified
  lightingEfficiency: LightingCheck; // Energy efficient lights
}
```

### Council Examiner Focus Areas

| Check | Standard | Rejection Risk |
|-------|----------|----------------|
| XA Form | SANS 10400-XA | **Critical** |
| Thermal values | SANS 10400-XA | **Critical** |
| Glazing limits | SANS 10400-XA | **Critical** |
| Insulation | SANS 10400-XA | **Critical** |

### Deemed-to-Satisfy Requirements

```typescript
const energyDTS = {
  walls: {
    minRValue: 1.7,                 // W/m²K
    system: 'Cavity brick or insulated'
  },
  roofs: {
    minRValue: 3.7,                 // W/m²K
    system: 'Insulated sheet or concrete'
  },
  glazing: {
    maxGlazing: 0.50,               // 50% of floor area
    maxSHGC: 0.72
  },
  floor: {
    minRValue: 0.75                 // W/m²K
  }
};
```

### Compliance Rules

```typescript
const energyRules: ComplianceRule[] = [
  {
    id: 'ENR-001',
    standard: 'SANS 10400-XA',
    check: 'XA Form submitted',
    severity: 'critical',
    requirement: 'Signed by competent person'
  },
  {
    id: 'ENR-002',
    standard: 'SANS 10400-XA',
    check: 'Wall thermal value',
    severity: 'critical',
    requirement: 'R1.7 minimum or rational design'
  },
  {
    id: 'ENR-003',
    standard: 'SANS 10400-XA',
    check: 'Roof thermal value',
    severity: 'critical',
    requirement: 'R3.7 minimum or rational design'
  },
  {
    id: 'ENR-004',
    standard: 'SANS 10400-XA',
    check: 'Glazing percentage',
    severity: 'critical',
    requirement: 'Max 50% of floor area'
  }
];
```

---

## Agent Implementation Priority

| Priority | Agent | Drawing Type | SANS Standards |
|----------|-------|--------------|----------------|
| 1 | SitePlanComplianceAgent | Site Plan | SANS 10400-A |
| 2 | FloorPlanComplianceAgent | Floor Plans | SANS 10400-A, O, J, T |
| 3 | DrainageComplianceAgent | Drainage | SANS 10400-P, SANS 10252 |
| 4 | FireComplianceAgent | Fire Layout | SANS 10400-T |
| 5 | EnergyComplianceAgent | Energy | SANS 10400-XA |
| 6 | ElevationComplianceAgent | Elevations | SANS 10400-A, T, XA |
| 7 | SectionComplianceAgent | Sections | SANS 10400-A, K, L, J |

---

## File Structure

```
src/
├── agents/
│   ├── specialized/
│   │   ├── siteplan/
│   │   │   └── SitePlanComplianceAgent.ts
│   │   ├── floorplan/
│   │   │   └── FloorPlanComplianceAgent.ts
│   │   ├── elevation/
│   │   │   └── ElevationComplianceAgent.ts
│   │   ├── section/
│   │   │   └── SectionComplianceAgent.ts
│   │   ├── drainage/
│   │   │   └── DrainageComplianceAgent.ts
│   │   ├── fire/
│   │   │   └── FireComplianceAgent.ts
│   │   └── energy/
│   │       └── EnergyComplianceAgent.ts
├── config/
│   ├── sans10400/
│   │   ├── sitePlanRules.ts
│   │   ├── floorPlanRules.ts
│   │   ├── elevationRules.ts
│   │   ├── sectionRules.ts
│   │   ├── drainageRules.ts
│   │   ├── fireRules.ts
│   │   └── energyRules.ts
│   └── compliance.ts
```

---

## Total Compliance Rules by Drawing Type

| Drawing Type | Critical Rules | High Rules | Total Rules |
|--------------|----------------|------------|-------------|
| Site Plan | 8 | 4 | 12 |
| Floor Plans | 15 | 8 | 23 |
| Elevations | 6 | 5 | 11 |
| Sections | 8 | 4 | 12 |
| Drainage | 10 | 6 | 16 |
| Fire Layout | 12 | 5 | 17 |
| Energy | 10 | 5 | 15 |
| **Total** | **69** | **37** | **106** |
