/**
 * FloorPlanComplianceAgent Test Script
 * 
 * Simulates the agent's analysis of an architectural floor plan drawing
 * to verify compliance with SANS 10400 regulations.
 */

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
    { id: 'dim-005', value: 3600, unit: 'mm', type: 'linear', startPoint: { x: 200, y: 300 }, endPoint: { x: 800, y: 300 }, layer: 'WALLS' }, // Garage width
    { id: 'dim-006', value: 6000, unit: 'mm', type: 'linear', startPoint: { x: 100, y: 200 }, endPoint: { x: 100, y: 800 }, layer: 'WALLS' }, // Garage depth
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
  totalArea: 120, // sqm
  occupancy: 4,
  municipality: 'City of Johannesburg',
  address: '123 Test Street, Johannesburg',
  erfNumber: '1234',
};

// ============================================================================
// Test Execution
// ============================================================================

async function runFloorPlanTest(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║         FloorPlanComplianceAgent - Architectural Drawing Test           ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');
  
  const agent = new FloorPlanComplianceAgent();
  
  console.log('📋 AGENT CONFIGURATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Agent ID:        ${agent['config'].id}`);
  console.log(`Agent Name:      ${agent['config'].name}`);
  console.log(`Version:         ${agent['config'].version}`);
  console.log(`Capabilities:    ${agent['config'].capabilities.join(', ')}`);
  console.log(`Supported Standards: ${agent['config'].supportedStandards?.join(', ')}`);
  console.log(`Rules Loaded:    ${agent.getRuleIds().length} rules\n`);
  
  console.log('📐 DRAWING INFORMATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Drawing ID:      ${mockFloorPlanDrawing.id}`);
  console.log(`Name:            ${mockFloorPlanDrawing.name}`);
  console.log(`Type:            ${mockFloorPlanDrawing.type}`);
  console.log(`Scale:           1:100`);
  console.log(`Rooms Found:     ${mockFloorPlanDrawing.textElements.filter(t => 
    /bedroom|kitchen|bathroom|living|garage|hallway|ensuite/i.test(t.content)
  ).length}`);
  console.log(`Dimensions:      ${mockFloorPlanDrawing.dimensions.length}`);
  console.log(`Doors:           ${mockFloorPlanDrawing.symbols.filter(s => s.category === 'DOOR').length}`);
  console.log(`Windows:         ${mockFloorPlanDrawing.symbols.filter(s => s.category === 'WINDOW').length}`);
  console.log(`Sanitary:        ${mockFloorPlanDrawing.symbols.filter(s => s.category === 'SANITARY').length}`);
  console.log(`Stairs:          ${mockFloorPlanDrawing.symbols.filter(s => s.category === 'STAIR').length}\n`);
  
  console.log('🏢 PROJECT INFORMATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Project ID:      ${mockProjectInfo.id}`);
  console.log(`Name:            ${mockProjectInfo.name}`);
  console.log(`Building Type:   ${mockProjectInfo.buildingType}`);
  console.log(`Floors:          ${mockProjectInfo.floors}`);
  console.log(`Total Area:      ${mockProjectInfo.totalArea} m²`);
  console.log(`Occupancy:       ${mockProjectInfo.occupancy} persons`);
  console.log(`Municipality:    ${mockProjectInfo.municipality}\n`);
  
  console.log('🔍 STARTING COMPLIANCE ANALYSIS...\n');
  
  try {
    const result = await agent.analyze(mockFloorPlanDrawing, mockProjectInfo);
    
    console.log('📊 ANALYSIS RESULTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Status:          ${result.status.toUpperCase()}`);
    console.log(`Processing Time: ${result.processingTime}ms`);
    console.log(`Compliance Score: ${result.complianceScore.toFixed(1)}%`);
    console.log(`Passed Rules:    ${result.passedRules.length}`);
    console.log(`Failed Rules:    ${result.failedRules.length}`);
    console.log(`Total Findings:  ${result.findings.length}\n`);
    
    console.log('✅ PASSED COMPLIANCE CHECKS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (result.passedRules.length > 0) {
      result.passedRules.forEach(ruleId => {
        console.log(`  ✓ ${ruleId}`);
      });
    } else {
      console.log('  (No passed rules)');
    }
    console.log();
    
    console.log('❌ FAILED COMPLIANCE CHECKS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (result.failedRules.length > 0) {
      result.failedRules.forEach(ruleId => {
        console.log(`  ✗ ${ruleId}`);
      });
    } else {
      console.log('  (No failed rules - Full Compliance!)');
    }
    console.log();
    
    if (result.findings.length > 0) {
      console.log('🚨 COMPLIANCE FINDINGS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      result.findings.forEach((finding, index) => {
        const severityEmoji = finding.severity === 'critical' ? '🔴' : 
                             finding.severity === 'high' ? '🟠' : 
                             finding.severity === 'medium' ? '🟡' : '🔵';
        console.log(`\n${severityEmoji} Finding #${index + 1}`);
        console.log(`   Rule:        ${finding.ruleId} - ${finding.ruleName}`);
        console.log(`   Standard:    ${finding.standard}`);
        console.log(`   Severity:    ${finding.severity.toUpperCase()}`);
        console.log(`   Description: ${finding.description}`);
        if (finding.suggestion) {
          console.log(`   Suggestion:  ${finding.suggestion}`);
        }
      });
    }
    
    console.log('\n📈 METADATA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Rooms Detected:    ${result.metadata?.roomsFound}`);
    console.log(`Doors Detected:    ${result.metadata?.doorsFound}`);
    console.log(`Windows Detected:  ${result.metadata?.windowsFound}`);
    console.log(`Analysis Type:     ${result.metadata?.analysisType}\n`);
    
    if (result.errors.length > 0) {
      console.log('⚠️ ERRORS DURING ANALYSIS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      result.errors.forEach(error => console.log(`  • ${error}`));
      console.log();
    }
    
    console.log('╔══════════════════════════════════════════════════════════════════════════╗');
    console.log('║                         TEST COMPLETE                                    ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');
    
    // Return summary for verification
    return generateSummary(result, agent);
    
  } catch (error) {
    console.error('❌ TEST FAILED WITH ERROR:');
    console.error(error);
    throw error;
  }
}

function generateSummary(result: any, agent: FloorPlanComplianceAgent): void {
  console.log('📋 DIAGNOSTIC SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('AGENT CAPABILITIES:');
  console.log('  • Validates floor plans against SANS 10400-A, O, J, T, P regulations');
  console.log('  • Analyzes room dimensions, labels, and proportions');
  console.log('  • Checks doorway widths (minimum 900mm for escape routes)');
  console.log('  • Verifies window requirements for natural lighting (10% floor area)');
  console.log('  • Validates ventilation compliance (10% openable window area)');
  console.log('  • Checks sanitary facilities adequacy');
  console.log('  • Verifies fire safety and escape routes');
  console.log('  • Analyzes stair dimensions and handrails');
  console.log('  • Checks balcony parapet heights');
  console.log('  • Validates garage and kitchen ventilation\n');
  
  console.log('COMPLIANCE CHECKS PERFORMED:');
  const rules = [
    { id: 'FLR-001', name: 'Room Dimensions Shown', category: 'Room Requirements' },
    { id: 'FLR-002', name: 'Ceiling Height Minimum 2400mm', category: 'Room Requirements' },
    { id: 'FLR-003', name: 'Room Names/Labels Present', category: 'Room Requirements' },
    { id: 'FLR-004', name: 'Wall Thicknesses Indicated', category: 'Room Requirements' },
    { id: 'FLR-005', name: 'Door Sizes and Swings Shown', category: 'Room Requirements' },
    { id: 'FLR-006', name: 'Window Sizes and Positions', category: 'Room Requirements' },
    { id: 'FLR-007', name: 'Ventilation - 10% Floor Area', category: 'Ventilation' },
    { id: 'FLR-008', name: 'Mechanical Ventilation', category: 'Ventilation' },
    { id: 'FLR-009', name: 'Cross Ventilation', category: 'Ventilation' },
    { id: 'FLR-010', name: 'Window Area 10% Floor Area', category: 'Lighting' },
    { id: 'FLR-011', name: 'Natural Light to All Rooms', category: 'Lighting' },
    { id: 'FLR-012', name: 'Light Ratios Adequate', category: 'Lighting' },
    { id: 'FLR-013', name: 'Fire Escape Routes Clear', category: 'Fire Safety' },
    { id: 'FLR-014', name: 'Minimum Door Width 900mm', category: 'Fire Safety' },
    { id: 'FLR-015', name: 'Alternative Escape Route', category: 'Fire Safety' },
    { id: 'FLR-016', name: 'Sanitary Facilities Adequate', category: 'Sanitary' },
    { id: 'FLR-017', name: 'Bathroom Ventilation', category: 'Sanitary' },
    { id: 'FLR-018', name: 'WC Position and Ventilation', category: 'Sanitary' },
    { id: 'FLR-019', name: 'Kitchen Ventilation', category: 'Additional' },
    { id: 'FLR-020', name: 'Laundry Ventilation', category: 'Additional' },
    { id: 'FLR-021', name: 'Stair Dimensions', category: 'Additional' },
    { id: 'FLR-022', name: 'Balcony Parapet Heights', category: 'Additional' },
    { id: 'FLR-023', name: 'Garage Ventilation', category: 'Additional' },
  ];
  
  rules.forEach(rule => {
    const status = result.passedRules.includes(rule.id) ? '✅ PASS' : 
                   result.failedRules.includes(rule.id) ? '❌ FAIL' : '⚪ SKIP';
    console.log(`  ${status}  ${rule.id} - ${rule.name}`);
  });
  
  console.log('\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
  console.log('┃                           VERDICT                                       ┃');
  console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n');
  
  const passRate = (result.passedRules.length / 23) * 100;
  if (passRate >= 90) {
    console.log('✅ AGENT STATUS: FULLY OPERATIONAL');
  } else if (passRate >= 70) {
    console.log('⚠️  AGENT STATUS: OPERATIONAL WITH MINOR ISSUES');
  } else {
    console.log('❌ AGENT STATUS: REQUIRES ATTENTION');
  }
  
  console.log(`\nThe FloorPlanComplianceAgent successfully analyzed the architectural drawing.`);
  console.log(`It extracted ${result.metadata?.roomsFound} rooms, ${result.metadata?.doorsFound} doors, `);
  console.log(`and ${result.metadata?.windowsFound} windows from the drawing.`);
  console.log(`\nOverall Compliance Score: ${result.complianceScore.toFixed(1)}%`);
  console.log(`\nThe agent is ${passRate >= 80 ? 'CAPABLE' : 'PARTIALLY CAPABLE'} of analyzing this type of drawing.`);
}

// Run the test
runFloorPlanTest().catch(console.error);

export { runFloorPlanTest, mockFloorPlanDrawing, mockProjectInfo };