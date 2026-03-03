/**
 * FloorPlanComplianceAgent Test Suite
 * 
 * Tests the agent's analysis of an architectural floor plan drawing
 * to verify compliance with SANS 10400 regulations.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { FloorPlanComplianceAgent } from './FloorPlanComplianceAgent';
import { DrawingData, DrawingType, ProjectInfo } from '@/types/agent';

// ============================================================================
// Mock Floor Plan Data (Based on the provided architectural drawing description)
// ============================================================================

const mockFloorPlanDrawing: DrawingData = {
  id: 'floor-plan-test-001',
  projectId: 'proj-test-001',
  type: DrawingType.FLOOR_PLAN,
  name: 'Ground Floor Plan - Residential Dwelling',
  fileUrl: '/uploads/ground_floor_plan.pdf',
  version: 1,
  parsedAt: new Date(),
  parserVersion: '1.0',
  warnings: [],
  
  // Text elements representing room labels
  textElements: [
    { id: 'text-001', content: 'Bedroom 1', position: { x: 1200, y: 800 }, layer: 'ROOM_NAMES' },
    { id: 'text-002', content: 'Bedroom 2', position: { x: 1200, y: 1600 }, layer: 'ROOM_NAMES' },
    { id: 'text-003', content: 'Bathroom', position: { x: 2000, y: 1000 }, layer: 'ROOM_NAMES' },
    { id: 'text-004', content: 'Ensuite', position: { x: 2000, y: 1500 }, layer: 'ROOM_NAMES' },
    { id: 'text-005', content: 'Kitchen', position: { x: 800, y: 2200 }, layer: 'ROOM_NAMES' },
    { id: 'text-006', content: 'Living/Dining', position: { x: 1600, y: 2200 }, layer: 'ROOM_NAMES' },
    { id: 'text-007', content: 'Garage', position: { x: 400, y: 500 }, layer: 'ROOM_NAMES' },
    { id: 'text-008', content: 'Hallway', position: { x: 1400, y: 1200 }, layer: 'ROOM_NAMES' },
    { id: 'text-009', content: 'Scale 1:100', position: { x: 200, y: 2800 }, layer: 'SCALE' },
    { id: 'text-010', content: 'Section A-A', position: { x: 2600, y: 1000 }, layer: 'SECTIONS' },
    { id: 'text-011', content: 'Section B-B', position: { x: 2600, y: 1800 }, layer: 'SECTIONS' },
    { id: 'text-012', content: 'Section C-C', position: { x: 1000, y: 2800 }, layer: 'SECTIONS' },
    { id: 'text-013', content: 'Stairs to First Floor', position: { x: 1500, y: 500 }, layer: 'ROOM_NAMES' },
  ],
  
  // Dimension lines throughout the drawing
  dimensions: [
    { id: 'dim-001', value: 3600, unit: 'mm', type: 'linear', startPoint: { x: 1000, y: 700 }, endPoint: { x: 2200, y: 700 }, layer: 'DIMENSIONS' },
    { id: 'dim-002', value: 3600, unit: 'mm', type: 'linear', startPoint: { x: 1000, y: 1500 }, endPoint: { x: 2200, y: 1500 }, layer: 'DIMENSIONS' },
    { id: 'dim-003', value: 4200, unit: 'mm', type: 'linear', startPoint: { x: 2300, y: 800 }, endPoint: { x: 2300, y: 1700 }, layer: 'DIMENSIONS' },
    { id: 'dim-004', value: 5400, unit: 'mm', type: 'linear', startPoint: { x: 500, y: 2000 }, endPoint: { x: 2300, y: 2000 }, layer: 'DIMENSIONS' },
    { id: 'dim-005', value: 3600, unit: 'mm', type: 'linear', startPoint: { x: 200, y: 300 }, endPoint: { x: 800, y: 300 }, layer: 'WALLS' },
    { id: 'dim-006', value: 6000, unit: 'mm', type: 'linear', startPoint: { x: 100, y: 200 }, endPoint: { x: 100, y: 800 }, layer: 'WALLS' },
    { id: 'dim-007', value: 110, unit: 'mm', type: 'linear', startPoint: { x: 50, y: 50 }, endPoint: { x: 160, y: 50 }, layer: 'WALL_THICKNESS' },
    { id: 'dim-008', value: 90, unit: 'mm', type: 'linear', startPoint: { x: 50, y: 100 }, endPoint: { x: 140, y: 100 }, layer: 'WALL_THICKNESS' },
    { id: 'dim-009', value: 2400, unit: 'mm', type: 'linear', startPoint: { x: 3000, y: 100 }, endPoint: { x: 3000, y: 200 }, layer: 'CEILING_HEIGHT' },
  ],
  
  // Annotations and notes
  annotations: [
    { id: 'ann-001', type: 'text', content: 'All external walls 110mm brick', position: { x: 100, y: 3000 } },
    { id: 'ann-002', type: 'text', content: 'Internal walls 90mm brick', position: { x: 100, y: 3050 } },
    { id: 'ann-003', type: 'text', content: 'Floor finish: Ceramic tiles to wet areas', position: { x: 100, y: 3100 } },
    { id: 'ann-004', type: 'text', content: 'Ceiling height: 2400mm throughout', position: { x: 100, y: 3150 } },
  ],
  
  // Door symbols and placements
  symbols: [
    { id: 'sym-door-001', name: 'Door 900x2100 Swing In', category: 'DOOR', position: { x: 1100, y: 900 }, properties: { width: 900, height: 2100 } },
    { id: 'sym-door-002', name: 'Door 900x2100 Swing In', category: 'DOOR', position: { x: 1100, y: 1700 }, properties: { width: 900, height: 2100 } },
    { id: 'sym-door-003', name: 'Door 800x2100 Swing In', category: 'DOOR', position: { x: 1900, y: 1200 }, properties: { width: 800, height: 2100 } },
    { id: 'sym-door-004', name: 'Door 700x2100 Swing In', category: 'DOOR', position: { x: 2100, y: 1600 }, properties: { width: 700, height: 2100 } },
    { id: 'sym-door-005', name: 'Door 900x2100 Swing Out', category: 'DOOR', position: { x: 1200, y: 2100 }, properties: { width: 900, height: 2100 } },
    { id: 'sym-door-006', name: 'Door 2400x2100 Garage', category: 'DOOR', position: { x: 500, y: 800 }, properties: { width: 2400, height: 2100 } },
    { id: 'sym-door-007', name: 'Door 900x2100 Main Entrance', category: 'DOOR', position: { x: 1500, y: 2100 }, properties: { width: 900, height: 2100 } },
    { id: 'sym-door-008', name: 'Door 700x2100 WC', category: 'DOOR', position: { x: 2050, y: 1400 }, properties: { width: 700, height: 2100 } },
    
    // Window symbols
    { id: 'sym-win-001', name: 'Window 1200x1200', category: 'WINDOW', position: { x: 1000, y: 800 }, properties: { width: 1200, height: 1200, openable: true } },
    { id: 'sym-win-002', name: 'Window 1200x1200', category: 'WINDOW', position: { x: 1000, y: 1600 }, properties: { width: 1200, height: 1200, openable: true } },
    { id: 'sym-win-003', name: 'Window 900x1200', category: 'WINDOW', position: { x: 2300, y: 900 }, properties: { width: 900, height: 1200, openable: true } },
    { id: 'sym-win-004', name: 'Window 900x1200', category: 'WINDOW', position: { x: 2300, y: 1600 }, properties: { width: 900, height: 1200, openable: true } },
    { id: 'sym-win-005', name: 'Window 1500x1200', category: 'WINDOW', position: { x: 800, y: 2300 }, properties: { width: 1500, height: 1200, openable: true } },
    { id: 'sym-win-006', name: 'Window 1800x1200', category: 'WINDOW', position: { x: 1600, y: 2300 }, properties: { width: 1800, height: 1200, openable: true } },
    { id: 'sym-win-007', name: 'Window 600x600 Bathroom', category: 'WINDOW', position: { x: 2200, y: 1050 }, properties: { width: 600, height: 600, openable: true } },
    { id: 'sym-win-008', name: 'Window 600x600 Ensuite', category: 'WINDOW', position: { x: 2200, y: 1550 }, properties: { width: 600, height: 600, openable: true } },
    
    // Sanitary fittings
    { id: 'sym-san-001', name: 'WC Pan', category: 'SANITARY', position: { x: 2100, y: 1000 } },
    { id: 'sym-san-002', name: 'Washbasin', category: 'SANITARY', position: { x: 2250, y: 1050 } },
    { id: 'sym-san-003', name: 'Shower', category: 'SANITARY', position: { x: 2150, y: 1100 } },
    { id: 'sym-san-004', name: 'Bath', category: 'SANITARY', position: { x: 2100, y: 1650 } },
    { id: 'sym-san-005', name: 'Washbasin', category: 'SANITARY', position: { x: 2250, y: 1550 } },
    { id: 'sym-san-006', name: 'Kitchen Sink', category: 'SANITARY', position: { x: 900, y: 2300 } },
    
    // Stairs
    { id: 'sym-stair-001', name: 'Stairs Width 1000', category: 'STAIR', position: { x: 1500, y: 600 }, properties: { width: 1000 } },
    
    // Kitchen extraction
    { id: 'sym-ext-001', name: 'Rangehood Extraction', category: 'EXTRACTION', position: { x: 850, y: 2250 } },
  ],
  
  // Layers in the drawing
  layers: [
    { name: 'ROOM_NAMES', visible: true, locked: false, objectCount: 13 },
    { name: 'DIMENSIONS', visible: true, locked: false, objectCount: 9 },
    { name: 'WALLS', visible: true, locked: false, objectCount: 45 },
    { name: 'WALL_THICKNESS', visible: true, locked: false, objectCount: 2 },
    { name: 'DOOR', visible: true, locked: false, objectCount: 8 },
    { name: 'WINDOW', visible: true, locked: false, objectCount: 8 },
    { name: 'SANITARY', visible: true, locked: false, objectCount: 6 },
    { name: 'STAIR', visible: true, locked: false, objectCount: 1 },
    { name: 'SECTIONS', visible: true, locked: false, objectCount: 3 },
    { name: 'SCALE', visible: true, locked: false, objectCount: 1 },
    { name: 'CEILING_HEIGHT', visible: true, locked: false, objectCount: 1 },
    { name: 'EXTRACTION', visible: true, locked: false, objectCount: 1 },
  ],
  
};

const mockProjectInfo: ProjectInfo = {
  id: 'proj-test-001',
  name: 'Residential Dwelling Compliance Test',
  description: 'Two bedroom house with garage, kitchen, living area and 2 bathrooms',
  buildingType: 'residential',
  floors: 1,
  totalArea: 120,
  occupancy: 4,
  municipality: 'City of Johannesburg',
  address: '123 Test Street, Johannesburg',
  erfNumber: '1234',
};

// ============================================================================
// Vitest Test Suite
// ============================================================================

describe('FloorPlanComplianceAgent', () => {
  let agent: FloorPlanComplianceAgent;
  
  beforeAll(() => {
    agent = new FloorPlanComplianceAgent();
  });
  
  it('should be defined', () => {
    expect(agent).toBeDefined();
  });
  
  it('should have valid configuration', () => {
    expect(agent['config']).toBeDefined();
    expect(agent['config'].id).toBe('floorplan-compliance-agent');
  });
  
  it('should return rule IDs', () => {
    const ruleIds = agent.getRuleIds();
    expect(ruleIds).toBeInstanceOf(Array);
    expect(ruleIds.length).toBeGreaterThan(0);
  });
  
  it('should analyze floor plan drawing', async () => {
    const result = await agent.analyze(mockFloorPlanDrawing, mockProjectInfo);
    
    expect(result).toBeDefined();
    expect(result.status).toBe('completed');
    expect(result.complianceScore).toBeGreaterThan(0);
    expect(result.passedRules).toBeInstanceOf(Array);
    expect(result.failedRules).toBeInstanceOf(Array);
  });
  
  it('should have valid compliance score', async () => {
    const result = await agent.analyze(mockFloorPlanDrawing, mockProjectInfo);
    
    expect(result.complianceScore).toBeGreaterThanOrEqual(0);
    expect(result.complianceScore).toBeLessThanOrEqual(100);
  });
  
  it('should identify passed and failed rules', async () => {
    const result = await agent.analyze(mockFloorPlanDrawing, mockProjectInfo);
    
    // Either passedRules or failedRules should have content
    expect(result.passedRules.length + result.failedRules.length).toBeGreaterThan(0);
  });
});
