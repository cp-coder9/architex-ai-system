/**
 * Technical Agents Test Suite
 * 
 * Tests for DimensionValidatorAgent, ScaleVerifierAgent, and SymbolRecognizerAgent
 * to verify they can handle floor plan drawings with:
 * - Dimension lines with measurements (e.g., "4600", "3700")
 * - Scale indicator (1:100)
 * - Doors (swing arcs), windows (rectangles), stairs
 * - Room labels and annotations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DimensionValidatorAgent } from './DimensionValidatorAgent';
import { ScaleVerifierAgent } from './ScaleVerifierAgent';
import { SymbolRecognizerAgent } from './SymbolRecognizerAgent';
import { DrawingData, DrawingType, ProjectInfo } from '@/types/agent';

// ============================================================================
// Mock Floor Plan Data (representing a typical architectural floor plan)
// ============================================================================

const mockFloorPlan: DrawingData = {
  id: 'test-floor-plan-001',
  projectId: 'proj-001',
  name: 'Ground Floor Plan',
  type: DrawingType.FLOOR_PLAN,
  fileUrl: '/drawings/test-floor-plan-001.dwg',
  version: 1,
  parsedAt: new Date(),
  parserVersion: '1.0.0',
  warnings: [],
  scale: '1:100',
  units: 'mm',
  
  // Layers typically found in floor plans
  layers: [
    { name: 'WALLS', visible: true, locked: false, color: '#000000', lineType: 'continuous', objectCount: 45 },
    { name: 'DIMENSIONS', visible: true, locked: false, color: '#0000FF', lineType: 'continuous', objectCount: 12 },
    { name: 'DOORS', visible: true, locked: false, color: '#00FF00', lineType: 'continuous', objectCount: 8 },
    { name: 'WINDOWS', visible: true, locked: false, color: '#00FFFF', lineType: 'continuous', objectCount: 6 },
    { name: 'FURNITURE', visible: true, locked: false, color: '#FF00FF', lineType: 'continuous', objectCount: 15 },
    { name: 'TEXT', visible: true, locked: false, color: '#000000', lineType: 'continuous', objectCount: 20 },
    { name: 'STAIRS', visible: true, locked: false, color: '#FF0000', lineType: 'continuous', objectCount: 2 },
    { name: 'SANITARY', visible: true, locked: false, color: '#000080', lineType: 'continuous', objectCount: 4 },
  ],
  
  // Dimension lines with measurements like "4600", "3700"
  dimensions: [
    { id: 'dim-001', value: 4600, unit: 'mm', type: 'linear', startPoint: { x: 0, y: 0 }, endPoint: { x: 4600, y: 0 }, layer: 'DIMENSIONS' },
    { id: 'dim-002', value: 3700, unit: 'mm', type: 'linear', startPoint: { x: 4600, y: 0 }, endPoint: { x: 4600, y: 3700 }, layer: 'DIMENSIONS' },
    { id: 'dim-003', value: 3200, unit: 'mm', type: 'linear', startPoint: { x: 0, y: 3700 }, endPoint: { x: 3200, y: 3700 }, layer: 'DIMENSIONS' },
    { id: 'dim-004', value: 2800, unit: 'mm', type: 'linear', startPoint: { x: 0, y: 0 }, endPoint: { x: 0, y: 2800 }, layer: 'DIMENSIONS' },
    { id: 'dim-005', value: 1400, unit: 'mm', type: 'linear', startPoint: { x: 3200, y: 3700 }, endPoint: { x: 4600, y: 3700 }, layer: 'DIMENSIONS' },
    { id: 'dim-006', value: 900, unit: 'mm', type: 'linear', startPoint: { x: 2800, y: 0 }, endPoint: { x: 3700, y: 0 }, layer: 'DIMENSIONS' },
    // Angular dimensions for room corners
    { id: 'dim-007', value: 90, unit: 'degrees', type: 'angular', startPoint: { x: 0, y: 0 }, endPoint: { x: 100, y: 100 }, layer: 'DIMENSIONS' },
  ],
  
  // Annotations including scale, room labels, and notes
  annotations: [
    { id: 'ann-001', type: 'text', content: '1:100', position: { x: 100, y: 50 }, layer: 'TEXT', style: { textHeight: 3.5 } },
    { id: 'ann-002', type: 'text', content: 'SCALE 1:100', position: { x: 4200, y: 3800 }, layer: 'TEXT' },
    { id: 'ann-003', type: 'dimension', content: 'SCALE BAR: 0---1---2---3---4---5 m', position: { x: 4000, y: 3850 }, layer: 'DIMENSIONS', style: { textHeight: 2.5 } },
    { id: 'ann-004', type: 'text', content: 'Living Room', position: { x: 1500, y: 1500 }, layer: 'TEXT' },
    { id: 'ann-005', type: 'text', content: 'Kitchen', position: { x: 3800, y: 1200 }, layer: 'TEXT' },
    { id: 'ann-006', type: 'text', content: 'Bedroom 1', position: { x: 800, y: 3000 }, layer: 'TEXT' },
    { id: 'ann-007', type: 'text', content: 'Bathroom', position: { x: 3500, y: 3000 }, layer: 'TEXT' },
    { id: 'ann-008', type: 'text', content: '±0.000', position: { x: 200, y: 200 }, layer: 'TEXT' },
    { id: 'ann-009', type: 'text', content: 'SL ±0.000', position: { x: 250, y: 250 }, layer: 'TEXT' },
    { id: 'ann-010', type: 'text', content: 'RL +0.150', position: { x: 300, y: 300 }, layer: 'TEXT' },
  ],
  
  // Symbols: doors, windows, stairs, sanitary fixtures
  symbols: [
    // Doors with swing arcs
    { id: 'sym-door-001', name: 'Door Single 900mm', category: 'door', position: { x: 2800, y: 0 }, rotation: 0, scale: 1, layer: 'DOORS', properties: { width: 900, swingDirection: 'inward' } },
    { id: 'sym-door-002', name: 'Door Single 800mm', category: 'door', position: { x: 4600, y: 1200 }, rotation: 90, scale: 1, layer: 'DOORS', properties: { width: 800, swingDirection: 'outward' } },
    { id: 'sym-door-003', name: 'Door Double 1400mm', category: 'door', position: { x: 0, y: 2000 }, rotation: 0, scale: 1, layer: 'DOORS', properties: { width: 1400, swingDirection: 'inward' } },
    { id: 'sym-door-004', name: 'Door Sliding 1200mm', category: 'door', position: { x: 3200, y: 3700 }, rotation: 180, scale: 1, layer: 'DOORS', properties: { width: 1200, type: 'sliding' } },
    { id: 'sym-door-005', name: 'Door Single 700mm', category: 'door', position: { x: 2000, y: 0 }, rotation: 0, scale: 1, layer: 'DOORS', properties: { width: 700 } },
    { id: 'sym-door-006', name: 'Door Single 750mm', category: 'door', position: { x: 4600, y: 2500 }, rotation: 270, scale: 1, layer: 'DOORS', properties: { width: 750 } },
    { id: 'sym-door-007', name: 'Door Single 900mm', category: 'door', position: { x: 1500, y: 3700 }, rotation: 180, scale: 1, layer: 'DOORS', properties: { width: 900 } },
    { id: 'sym-door-008', name: 'Door Single 800mm', category: 'door', position: { x: 0, y: 1000 }, rotation: 90, scale: 1, layer: 'DOORS', properties: { width: 800 } },
    
    // Windows (rectangles)
    { id: 'sym-win-001', name: 'Window 1200x1200mm', category: 'window', position: { x: 1000, y: 0 }, rotation: 0, scale: 1, layer: 'WINDOWS', properties: { width: 1200, height: 1200, type: 'casement' } },
    { id: 'sym-win-002', name: 'Window 1500x1200mm', category: 'window', position: { x: 3500, y: 0 }, rotation: 0, scale: 1, layer: 'WINDOWS', properties: { width: 1500, height: 1200, type: 'casement' } },
    { id: 'sym-win-003', name: 'Window 900x1200mm', category: 'window', position: { x: 0, y: 700 }, rotation: 90, scale: 1, layer: 'WINDOWS', properties: { width: 900, height: 1200, type: 'fixed' } },
    { id: 'sym-win-004', name: 'Window 1800x1200mm', category: 'window', position: { x: 0, y: 3200 }, rotation: 90, scale: 1, layer: 'WINDOWS', properties: { width: 1800, height: 1200, type: 'sliding' } },
    { id: 'sym-win-005', name: 'Window 1200x1200mm', category: 'window', position: { x: 2000, y: 3700 }, rotation: 180, scale: 1, layer: 'WINDOWS', properties: { width: 1200, height: 1200, type: 'casement' } },
    { id: 'sym-win-006', name: 'Window 1000x1200mm', category: 'window', position: { x: 4600, y: 3000 }, rotation: 270, scale: 1, layer: 'WINDOWS', properties: { width: 1000, height: 1200, type: 'top_hung' } },
    
    // Stairs
    { id: 'sym-stair-001', name: 'Staircase Internal', category: 'stair', position: { x: 3000, y: 2000 }, rotation: 0, scale: 1, layer: 'STAIRS', properties: { width: 1200, direction: 'up', risers: 15 } },
    { id: 'sym-stair-002', name: 'Staircase Exit', category: 'stair', position: { x: 4400, y: 3400 }, rotation: 90, scale: 1, layer: 'STAIRS', properties: { width: 1100, direction: 'down', risers: 12 } },
    
    // Sanitary fixtures
    { id: 'sym-san-001', name: 'Toilet WC', category: 'sanitary', position: { x: 3600, y: 3200 }, rotation: 0, scale: 1, layer: 'SANITARY', properties: { type: 'water_closet' } },
    { id: 'sym-san-002', name: 'Basin', category: 'sanitary', position: { x: 4200, y: 3300 }, rotation: 270, scale: 1, layer: 'SANITARY', properties: { type: 'wash_basin' } },
    { id: 'sym-san-003', name: 'Shower', category: 'sanitary', position: { x: 3700, y: 3500 }, rotation: 0, scale: 1, layer: 'SANITARY', properties: { width: 900, type: 'shower_tray' } },
    { id: 'sym-san-004', name: 'Bath', category: 'sanitary', position: { x: 4300, y: 3000 }, rotation: 180, scale: 1, layer: 'SANITARY', properties: { length: 1700, type: 'full_bath' } },
    
    // Scale bar symbol
    { id: 'sym-scale-001', name: 'Scale Bar 1:100', category: 'scale', position: { x: 4000, y: 3850 }, rotation: 0, scale: 1, layer: 'TEXT' },
  ],
  
  // Text elements including room labels, dimensions, notes
  textElements: [
    { id: 'txt-001', content: '4600', position: { x: 2300, y: -100 }, height: 2.5, layer: 'DIMENSIONS' },
    { id: 'txt-002', content: '3700', position: { x: 4700, y: 1850 }, height: 2.5, layer: 'DIMENSIONS' },
    { id: 'txt-003', content: '3200', position: { x: 1600, y: 3800 }, height: 2.5, layer: 'DIMENSIONS' },
    { id: 'txt-004', content: '2800', position: { x: -100, y: 1400 }, height: 2.5, layer: 'DIMENSIONS' },
    { id: 'txt-005', content: '1:100', position: { x: 4200, y: 3800 }, height: 3.5, layer: 'TEXT' },
    { id: 'txt-006', content: 'GROUND FLOOR PLAN', position: { x: 2300, y: 4200 }, height: 5.0, layer: 'TEXT', font: 'Arial' },
    { id: 'txt-007', content: 'Living Room', position: { x: 1500, y: 1500 }, height: 3.0, layer: 'TEXT' },
    { id: 'txt-008', content: 'Kitchen', position: { x: 3800, y: 1200 }, height: 3.0, layer: 'TEXT' },
    { id: 'txt-009', content: 'Bedroom 1', position: { x: 800, y: 3000 }, height: 3.0, layer: 'TEXT' },
    { id: 'txt-010', content: 'Bathroom', position: { x: 3500, y: 3000 }, height: 3.0, layer: 'TEXT' },
    { id: 'txt-011', content: '±0.000', position: { x: 200, y: 200 }, height: 2.5, layer: 'TEXT' },
    { id: 'txt-012', content: 'All dimensions in mm', position: { x: 100, y: 4000 }, height: 2.5, layer: 'TEXT' },
  ],
};

const mockProjectInfo: ProjectInfo = {
  id: 'proj-001',
  name: 'Test Residential Project',
  address: '123 Test Street, Johannesburg',
  erfNumber: '12345',
  zoning: 'residential_1',
  buildingType: 'residential',
  floors: 2,
  totalArea: 180,
  ownerName: 'John Doe',
  architectName: 'Jane Smith Architect',
  municipality: 'City of Johannesburg',
  submittedAt: new Date(),
};

// ============================================================================
// DimensionValidatorAgent Tests
// ============================================================================

describe('DimensionValidatorAgent', () => {
  let agent: DimensionValidatorAgent;

  beforeEach(() => {
    agent = new DimensionValidatorAgent();
  });

  it('should be properly instantiated with correct configuration', () => {
    expect(agent).toBeDefined();
    expect(agent.getRuleIds()).toContain('DIM-001');
    expect(agent.getRuleIds()).toContain('DIM-010');
    expect(agent.getRuleIds().length).toBe(10);
  });

  it('should identify dimension lines with measurements like 4600, 3700', async () => {
    const result = await agent.analyze(mockFloorPlan, mockProjectInfo);
    
    expect(result.status).toBe('completed');
    expect(result.metadata?.linearDimensions).toBe(6);
    expect(result.metadata?.angularDimensions).toBe(1);
    expect(result.metadata?.totalDimensions).toBe(7);
  });

  it('should detect level markers and datum references (±0.000)', async () => {
    const result = await agent.analyze(mockFloorPlan, mockProjectInfo);
    
    expect(result.status).toBe('completed');
    // Should pass DIM-010 (Levels Referenced to Datum)
    expect(result.passedRules).toContain('DIM-010');
  });

  it('should validate dimension text sizes meet SANS 10160 minimum (2.5mm)', async () => {
    const result = await agent.analyze(mockFloorPlan, mockProjectInfo);
    
    expect(result.status).toBe('completed');
    // All dimension text is 2.5mm or larger
    expect(result.passedRules).toContain('DIM-006');
  });

  it('should identify rooms and check dimensions are present', async () => {
    const result = await agent.analyze(mockFloorPlan, mockProjectInfo);
    
    expect(result.status).toBe('completed');
    // Should detect Living Room, Kitchen, Bedroom, Bathroom
    expect(result.metadata?.dimensionsFound).toBeGreaterThan(0);
  });

  it('should calculate compliance score based on rules passed', async () => {
    const result = await agent.analyze(mockFloorPlan, mockProjectInfo);
    
    expect(result.status).toBe('completed');
    expect(result.complianceScore).toBeGreaterThanOrEqual(0);
    expect(result.complianceScore).toBeLessThanOrEqual(100);
    expect(result.processingTime).toBeGreaterThan(0);
  });

  it('should identify chain dimensions (consecutive dimensions)', async () => {
    const result = await agent.analyze(mockFloorPlan, mockProjectInfo);
    
    expect(result.status).toBe('completed');
    // Should find chain dimensions (3200 + 1400 = 4600)
    expect(result.metadata?.chainDimensions).toBeDefined();
  });
});

// ============================================================================
// ScaleVerifierAgent Tests
// ============================================================================

describe('ScaleVerifierAgent', () => {
  let agent: ScaleVerifierAgent;

  beforeEach(() => {
    agent = new ScaleVerifierAgent();
  });

  it('should be properly instantiated with correct configuration', () => {
    expect(agent).toBeDefined();
    expect(agent.getRuleIds()).toContain('SCL-001');
    expect(agent.getRuleIds()).toContain('SCL-008');
    expect(agent.getRuleIds().length).toBe(8);
  });

  it('should detect scale indicator 1:100 in title block', async () => {
    const result = await agent.analyze(mockFloorPlan, mockProjectInfo);
    
    expect(result.status).toBe('completed');
    expect(result.metadata?.scaleFound).toBe('1:100');
    expect(result.passedRules).toContain('SCL-002');
  });

  it('should verify scale bar presence', async () => {
    const result = await agent.analyze(mockFloorPlan, mockProjectInfo);
    
    expect(result.status).toBe('completed');
    expect(result.metadata?.scaleBarPresent).toBe(true);
    expect(result.passedRules).toContain('SCL-001');
  });

  it('should validate 1:100 is appropriate for floor plans', async () => {
    const result = await agent.analyze(mockFloorPlan, mockProjectInfo);
    
    expect(result.status).toBe('completed');
    // 1:100 is within acceptable range for floor plans (1:50-1:200)
    expect(result.passedRules).toContain('SCL-004');
  });

  it('should detect metric units usage', async () => {
    const result = await agent.analyze(mockFloorPlan, mockProjectInfo);
    
    expect(result.status).toBe('completed');
    // Should find "mm" in text elements
    expect(result.passedRules).toContain('SCL-008');
  });

  it('should handle floor plans where north arrow is not required', async () => {
    const result = await agent.analyze(mockFloorPlan, mockProjectInfo);
    
    expect(result.status).toBe('completed');
    // North arrow not required for floor plans, only site plans
    expect(result.passedRules).toContain('SCL-006');
  });

  it('should verify scale label visibility', async () => {
    const result = await agent.analyze(mockFloorPlan, mockProjectInfo);
    
    expect(result.status).toBe('completed');
    expect(result.metadata?.titleBlockScale).toBe('1:100');
    expect(result.passedRules).toContain('SCL-007');
  });
});

// ============================================================================
// SymbolRecognizerAgent Tests
// ============================================================================

describe('SymbolRecognizerAgent', () => {
  let agent: SymbolRecognizerAgent;

  beforeEach(() => {
    agent = new SymbolRecognizerAgent();
  });

  it('should be properly instantiated with correct configuration', () => {
    expect(agent).toBeDefined();
    expect(agent.getRuleIds()).toContain('SYM-001');
    expect(agent.getRuleIds()).toContain('SYM-008');
    expect(agent.getRuleIds().length).toBe(8);
  });

  it('should identify door symbols (swing arcs)', async () => {
    const result = await agent.analyze(mockFloorPlan, mockProjectInfo);
    
    expect(result.status).toBe('completed');
    expect(result.metadata?.architecturalSymbols).toBeGreaterThan(0);
    expect(result.passedRules).toContain('SYM-004');
  });

  it('should identify window symbols (rectangles)', async () => {
    const result = await agent.analyze(mockFloorPlan, mockProjectInfo);
    
    expect(result.status).toBe('completed');
    expect(result.passedRules).toContain('SYM-005');
  });

  it('should identify stair symbols', async () => {
    const result = await agent.analyze(mockFloorPlan, mockProjectInfo);
    
    expect(result.status).toBe('completed');
    expect(result.metadata?.totalSymbols).toBeGreaterThan(0);
  });

  it('should identify sanitary fixture symbols', async () => {
    const result = await agent.analyze(mockFloorPlan, mockProjectInfo);
    
    expect(result.status).toBe('completed');
    expect(result.passedRules).toContain('SYM-006');
  });

  it('should categorize architectural symbols correctly', async () => {
    const result = await agent.analyze(mockFloorPlan, mockProjectInfo);
    
    expect(result.status).toBe('completed');
    // Should recognize doors, windows, stairs, sanitary as architectural
    expect(result.passedRules).toContain('SYM-001');
  });

  it('should check for legend completeness when needed', async () => {
    const result = await agent.analyze(mockFloorPlan, mockProjectInfo);
    
    expect(result.status).toBe('completed');
    // All symbols are standard, so no legend required
    expect(result.passedRules).toContain('SYM-003');
  });

  it('should verify symbol scaling consistency', async () => {
    const result = await agent.analyze(mockFloorPlan, mockProjectInfo);
    
    expect(result.status).toBe('completed');
    expect(result.metadata?.unrecognizedSymbols).toBeDefined();
    expect(result.passedRules).toContain('SYM-008');
  });

  it('should handle drawings without electrical symbols', async () => {
    const result = await agent.analyze(mockFloorPlan, mockProjectInfo);
    
    expect(result.status).toBe('completed');
    // No electrical symbols is OK for floor plan
    expect(result.passedRules).toContain('SYM-002');
  });

  it('should count total symbols found', async () => {
    const result = await agent.analyze(mockFloorPlan, mockProjectInfo);
    
    expect(result.status).toBe('completed');
    // 8 doors + 6 windows + 2 stairs + 4 sanitary + 1 scale bar = 21 symbols
    expect(result.metadata?.totalSymbols).toBe(21);
  });
});

// ============================================================================
// Integration Tests - All Three Agents
// ============================================================================

describe('Technical Agents Integration', () => {
  it('should analyze floor plan with all three agents successfully', async () => {
    const dimensionAgent = new DimensionValidatorAgent();
    const scaleAgent = new ScaleVerifierAgent();
    const symbolAgent = new SymbolRecognizerAgent();

    const [dimResult, scaleResult, symResult] = await Promise.all([
      dimensionAgent.analyze(mockFloorPlan, mockProjectInfo),
      scaleAgent.analyze(mockFloorPlan, mockProjectInfo),
      symbolAgent.analyze(mockFloorPlan, mockProjectInfo),
    ]);

    // All agents should complete successfully
    expect(dimResult.status).toBe('completed');
    expect(scaleResult.status).toBe('completed');
    expect(symResult.status).toBe('completed');

    // All should have compliance scores
    expect(dimResult.complianceScore).toBeGreaterThanOrEqual(0);
    expect(scaleResult.complianceScore).toBeGreaterThanOrEqual(0);
    expect(symResult.complianceScore).toBeGreaterThanOrEqual(0);

    // Scale agent should find 1:100 scale
    expect(scaleResult.metadata?.scaleFound).toBe('1:100');

    // Dimension agent should find 7 dimensions
    expect(dimResult.metadata?.totalDimensions).toBe(7);

    // Symbol agent should find 21 symbols
    expect(symResult.metadata?.totalSymbols).toBe(21);
  });

  it('should handle edge case: drawing with minimal dimensions', async () => {
    const minimalDrawing: DrawingData = {
      ...mockFloorPlan,
      dimensions: [
        { id: 'dim-001', value: 5000, unit: 'mm', type: 'linear', startPoint: { x: 0, y: 0 }, endPoint: { x: 5000, y: 0 } }
      ],
      textElements: mockFloorPlan.textElements.filter(t => !t.content.match(/^\d+$/)),
    };

    const dimensionAgent = new DimensionValidatorAgent();
    const result = await dimensionAgent.analyze(minimalDrawing, mockProjectInfo);

    expect(result.status).toBe('completed');
    // With rooms but only 1 dimension, should flag potential issues
    expect(result.metadata?.totalDimensions).toBe(1);
  });

  it('should handle edge case: drawing without scale bar', async () => {
    const noScaleBarDrawing: DrawingData = {
      ...mockFloorPlan,
      symbols: mockFloorPlan.symbols.filter(s => s.category !== 'scale'),
      annotations: mockFloorPlan.annotations.filter(a => !a.content.toLowerCase().includes('scale bar')),
    };

    const scaleAgent = new ScaleVerifierAgent();
    const result = await scaleAgent.analyze(noScaleBarDrawing, mockProjectInfo);

    expect(result.status).toBe('completed');
    // Scale bar should be flagged as missing
    expect(result.failedRules).toContain('SCL-001');
    expect(result.metadata?.scaleBarPresent).toBe(false);
  });

  it('should handle edge case: drawing with custom symbols', async () => {
    const customSymbolDrawing: DrawingData = {
      ...mockFloorPlan,
      symbols: [
        ...mockFloorPlan.symbols,
        { id: 'sym-custom-001', name: 'Custom Feature X', category: 'custom', position: { x: 1000, y: 1000 }, rotation: 0, scale: 1, layer: 'CUSTOM' },
      ],
    };

    const symbolAgent = new SymbolRecognizerAgent();
    const result = await symbolAgent.analyze(customSymbolDrawing, mockProjectInfo);

    expect(result.status).toBe('completed');
    // Should detect unrecognized symbols
    expect(result.metadata?.unrecognizedSymbols).toContain('Custom Feature X');
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

describe('Technical Agents Performance', () => {
  it('should complete analysis within reasonable time', async () => {
    const dimensionAgent = new DimensionValidatorAgent();
    const scaleAgent = new ScaleVerifierAgent();
    const symbolAgent = new SymbolRecognizerAgent();

    const startTime = Date.now();
    
    await Promise.all([
      dimensionAgent.analyze(mockFloorPlan, mockProjectInfo),
      scaleAgent.analyze(mockFloorPlan, mockProjectInfo),
      symbolAgent.analyze(mockFloorPlan, mockProjectInfo),
    ]);

    const totalTime = Date.now() - startTime;
    
    // All three agents should complete within 5 seconds
    expect(totalTime).toBeLessThan(5000);
  });

  it('should handle large drawings efficiently', async () => {
    // Create a larger drawing with many symbols
    const largeDrawing: DrawingData = {
      ...mockFloorPlan,
      symbols: Array.from({ length: 100 }, (_, i) => ({
        id: `sym-${i}`,
        name: i % 2 === 0 ? 'Door Single 900mm' : 'Window 1200x1200mm',
        category: i % 2 === 0 ? 'door' : 'window',
        position: { x: i * 10, y: i * 10 },
        rotation: 0,
        scale: 1,
        layer: i % 2 === 0 ? 'DOORS' : 'WINDOWS',
      })),
    };

    const symbolAgent = new SymbolRecognizerAgent();
    const result = await symbolAgent.analyze(largeDrawing, mockProjectInfo);

    expect(result.status).toBe('completed');
    expect(result.metadata?.totalSymbols).toBe(100);
    expect(result.processingTime).toBeLessThan(2000);
  });
});
