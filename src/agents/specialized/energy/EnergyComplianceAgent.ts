/**
 * EnergyComplianceAgent
 * 
 * Validates building plans against SANS 10400-XA and SANS 204 for energy efficiency.
 * Performs comprehensive compliance checks including thermal performance,
 * glazing limits, lighting efficiency, HVAC, and water heating.
 * Mandatory since 2011 for all new buildings.
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
  _ExtractedDimension,
  _TextElement,
  SymbolInfo,
  LayerInfo
} from '@/types/agent';
import {
  ENERGY_DTS
} from '@/config/sans10400/types';

// ============================================================================
// SANS 10400-XA and SANS 204 Energy Rules
// ============================================================================

const ENERGY_RULES: ComplianceRule[] = [
  // Documentation (Mandatory Since 2011)
  {
    id: 'ENR-001',
    name: 'XA Form Submitted and Signed',
    description: 'SANS 10400-XA submission form must be completed and signed',
    standard: 'SANS 10400-XA',
    part: 'Part XA',
    category: 'energy',
    severity: Severity.CRITICAL,
    checkType: 'document',
    requirement: 'XA Form (Energy Efficiency Declaration) must be submitted with the building plans',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'ENR-002',
    name: 'Competent Person Declaration',
    description: 'Declaration by competent person must be provided',
    standard: 'SANS 10400-XA',
    part: 'Part XA',
    category: 'energy',
    severity: Severity.CRITICAL,
    checkType: 'document',
    requirement: 'Competent person declaration must be signed by a qualified energy assessor',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // Thermal Performance (Deemed-to-Satisfy)
  {
    id: 'ENR-003',
    name: 'Wall R-value ≥1.7 W/m²K',
    description: 'Walls must have minimum thermal resistance of 1.7 W/m²K',
    standard: 'SANS 10400-XA',
    part: 'Part XA',
    category: 'energy',
    severity: Severity.CRITICAL,
    checkType: 'calculation',
    requirement: 'Wall R-value must be ≥1.7 W/m²K (cavity brick, insulated timber frame, or equivalent)',
    thresholds: {
      min: 1.7,
      unit: 'W/m²K',
      comparison: 'greater_than'
    },
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'ENR-004',
    name: 'Roof R-value ≥3.7 W/m²K',
    description: 'Roofs must have minimum thermal resistance of 3.7 W/m²K',
    standard: 'SANS 10400-XA',
    part: 'Part XA',
    category: 'energy',
    severity: Severity.CRITICAL,
    checkType: 'calculation',
    requirement: 'Roof R-value must be ≥3.7 W/m²K (insulated sheet, concrete with insulation, or equivalent)',
    thresholds: {
      min: 3.7,
      unit: 'W/m²K',
      comparison: 'greater_than'
    },
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'ENR-005',
    name: 'Floor R-value ≥0.75 W/m²K',
    description: 'Floors must have minimum thermal resistance of 0.75 W/m²K',
    standard: 'SANS 10400-XA',
    part: 'Part XA',
    category: 'energy',
    severity: Severity.MEDIUM,
    checkType: 'calculation',
    requirement: 'Floor R-value must be ≥0.75 W/m²K (concrete slab on ground or equivalent)',
    thresholds: {
      min: 0.75,
      unit: 'W/m²K',
      comparison: 'greater_than'
    },
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'ENR-006',
    name: 'Glazing ≤50% of Floor Area',
    description: 'Total glazing area must not exceed 50% of floor area',
    standard: 'SANS 10400-XA',
    part: 'Part XA',
    category: 'energy',
    severity: Severity.CRITICAL,
    checkType: 'calculation',
    requirement: 'Glazing area must be ≤50% of the floor area to minimize heat gain/loss',
    thresholds: {
      max: 0.50,
      unit: '%',
      comparison: 'less_than'
    },
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // Glazing
  {
    id: 'ENR-007',
    name: 'Glazing SHGC ≤0.72',
    description: 'Solar Heat Gain Coefficient must not exceed 0.72',
    standard: 'SANS 10400-XA',
    part: 'Part XA',
    category: 'energy',
    severity: Severity.HIGH,
    checkType: 'calculation',
    requirement: 'Glazing SHGC must be ≤0.72 (lower is better for cooling)',
    thresholds: {
      max: 0.72,
      unit: '',
      comparison: 'less_than'
    },
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'ENR-008',
    name: 'Shading Devices Provided',
    description: 'External shading devices must be provided for glare and heat control',
    standard: 'SANS 10400-XA',
    part: 'Part XA',
    category: 'energy',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'Shading devices (overhangs, blinds, pergolas) must be provided for east and west glazing',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // Lighting
  {
    id: 'ENR-009',
    name: 'Energy Efficient Lighting',
    description: 'Energy efficient lighting must be specified',
    standard: 'SANS 10400-XA',
    part: 'Part XA',
    category: 'energy',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'LED or other energy efficient lighting must be specified (minimum 80 lumens/watt)',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'ENR-010',
    name: 'Light Sensor Controls (Where Required)',
    description: 'Daylight sensors must be provided in commercial buildings',
    standard: 'SANS 10400-XA',
    part: 'Part XA',
    category: 'energy',
    severity: Severity.MEDIUM,
    checkType: 'presence',
    requirement: 'Daylight sensors required for commercial buildings to reduce artificial lighting',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // HVAC
  {
    id: 'ENR-011',
    name: 'HVAC Efficiency',
    description: 'HVAC systems must meet minimum efficiency requirements',
    standard: 'SANS 10400-XA',
    part: 'Part XA',
    category: 'energy',
    severity: Severity.HIGH,
    checkType: 'verification',
    requirement: 'HVAC systems must have adequate efficiency ratings (COP/EER)',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'ENR-012',
    name: 'Thermostat Controls',
    description: 'Thermostat controls must be provided for HVAC systems',
    standard: 'SANS 10400-XA',
    part: 'Part XA',
    category: 'energy',
    severity: Severity.MEDIUM,
    checkType: 'presence',
    requirement: 'Programmable thermostats must be provided for heating/cooling systems',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // Water Heating
  {
    id: 'ENR-013',
    name: 'Solar Water Heating (Where Required)',
    description: 'Solar water heating must be provided for residential buildings',
    standard: 'SANS 10400-XA',
    part: 'Part XA',
    category: 'energy',
    severity: Severity.CRITICAL,
    checkType: 'presence',
    requirement: 'Solar water heating system required for new residential buildings',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },
  {
    id: 'ENR-014',
    name: 'Geyser Insulation',
    description: 'Hot water cylinders must be insulated',
    standard: 'SANS 10400-XA',
    part: 'Part XA',
    category: 'energy',
    severity: Severity.HIGH,
    checkType: 'presence',
    requirement: 'Geyser/heat pump hot water cylinder must be insulated with geyser blanket',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  },

  // General
  {
    id: 'ENR-015',
    name: 'Energy Summary Provided',
    description: 'Energy compliance summary must be provided',
    standard: 'SANS 10400-XA',
    part: 'Part XA',
    category: 'energy',
    severity: Severity.MEDIUM,
    checkType: 'document',
    requirement: 'Energy summary showing compliance with all XA requirements must be provided',
    lastUpdated: new Date('2024-01-01'),
    version: '1.0',
    isActive: true
  }
];

// ============================================================================
// Agent Configuration
// ============================================================================

const DEFAULT_CONFIG: AgentConfig = {
  id: 'energy-compliance-agent',
  name: 'Energy Compliance Agent',
  description: 'Validates building plans against SANS 10400-XA and SANS 204',
  version: '1.0.0',
  enabled: true,
  maxRetries: 3,
  timeout: 30000,
  priority: 1,
  capabilities: [
    'energy-validation',
    'thermal-performance-check',
    'glazing-compliance',
    'lighting-efficiency',
    'hvac-validation',
    'water-heating-check'
  ],
  supportedDrawingTypes: [DrawingType.FLOOR_PLAN, DrawingType.ELEVATION, DrawingType.SECTION],
  supportedStandards: ['SANS 10400-XA', 'SANS 204']
};

// ============================================================================
// Agent Implementation
// ============================================================================

export class EnergyComplianceAgent extends Agent {
  private energyRules: ComplianceRule[];

  constructor(config: Partial<AgentConfig> = {}) {
    super({ ...DEFAULT_CONFIG, ...config });
    this.energyRules = ENERGY_RULES;
  }

  /**
   * Get rule IDs for this agent
   */
  getRuleIds(): string[] {
    return this.energyRules.map(rule => rule.id);
  }

  /**
   * Load rules for this agent
   */
  protected async loadRules(): Promise<void> {
    this.rules = this.energyRules;
  }

  /**
   * Analyze a building plan for SANS 10400-XA compliance
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
      const energyData = this.extractEnergyData(drawing, projectInfo);

      // Run each compliance check
      for (const rule of this.energyRules) {
        const result = await this.evaluateEnergyRule(rule, energyData, drawing, projectInfo);

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
        this.energyRules.map(rule => ({
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
            totalArea: projectInfo.totalArea
          },
          analysisType: 'energy-compliance'
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
          analysisType: 'energy-compliance',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Extract energy compliance data from drawing and project info
   */
  private extractEnergyData(drawing: DrawingData, projectInfo: ProjectInfo): EnergyAnalysisData {
    const textContentLower = drawing.textElements.map(t => t.content.toLowerCase());
    const annotationsLower = drawing.annotations.map(a => a.content.toLowerCase());
    const allText = [...textContentLower, ...annotationsLower];

    return {
      // Documentation
      xaFormPresent: this.checkXAForm(allText),
      competentPersonDeclaration: this.checkCompetentPerson(allText),

      // Thermal performance
      roofRValue: this.extractRValue(textContent, annotations, 'roof'),
      floorRValue: this.extractRValue(textContent, annotations, 'floor'),

      // Glazing
      glazingArea: this.extractGlazingArea(drawing),
      floorArea: projectInfo.totalArea || 0,
      glazingRatio: this.calculateGlazingRatio(drawing, projectInfo.totalArea || 0),
      glazingSHGC: this.extractSHGC(textContent, annotations),
      shadingDevices: this.extractShadingDevices(drawing),

      // Lighting
      efficientLighting: this.checkEfficientLighting(textContent, annotations),
      lightSensors: this.checkLightSensors(textContent, annotations),

      // HVAC
      hvacEfficiency: this.checkHVACEfficiency(textContent, annotations),
      thermostatControls: this.checkThermostatControls(textContent, annotations),

      // Water heating
      solarWaterHeating: this.checkSolarWaterHeating(textContent, annotations),
      geyserInsulation: this.checkGeyserInsulation(textContent, annotations),

      // General
      energySummary: this.checkEnergySummary(textContent, annotations),

      // Raw data
      textContent: drawing.textElements.map(t => t.content),
      annotations: drawing.annotations.map(a => a.content),
      symbols: drawing.symbols,
      layers: drawing.layers,
      dimensions: drawing.dimensions
    };
  }

  /**
   * Check for XA Form
   */
  private checkXAForm(textContent: string[], annotations: string[]): boolean {
    const allText = [...textContent, ...annotations];
    return allText.some(text =>
      text.includes('xa form') ||
      text.includes('energy declaration') ||
      text.includes('sans 10400-xa')
    );
  }

  /**
   * Check for competent person declaration
   */
  private checkCompetentPerson(textContent: string[], annotations: string[]): boolean {
    const allText = [...textContent, ...annotations];
    return allText.some(text =>
      text.includes('competent person') ||
      text.includes('energy assessor') ||
      text.includes('declaration')
    );
  }

  /**
   * Extract R-value from text
   */
  private extractRValue(textContent: string[], annotations: string[], type: 'wall' | 'roof' | 'floor'): number | null {
    const allText = [...textContent, ...annotations];

    const patterns = [
      new RegExp(`${type}\\s*r\\s*value\\s*[:=]?\\s*(\\d+\\.?\\d*)`, 'i'),
      new RegExp(`r\\s*${type}\\s*[:=]?\\s*(\\d+\\.?\\d*)`, 'i'),
      new RegExp(`${type}\\s*insulation\\s*r\\s*value\\s*[:=]?\\s*(\\d+\\.?\\d*)`, 'i')
    ];

    for (const text of allText) {
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          return parseFloat(match[1]);
        }
      }
    }

    return null;
  }

  /**
   * Extract glazing area
   */
  private extractGlazingArea(drawing: DrawingData): number | null {
    // Look for window area calculations
    const windowPatterns = [
      /window\s*area\s*[:=]?\s*(\d+)/i,
      /glazing\s*area\s*[:=]?\s*(\d+)/i,
      /total\s*window\s*[:=]?\s*(\d+)/i
    ];

    for (const text of drawing.textElements) {
      for (const pattern of windowPatterns) {
        const match = text.content.match(pattern);
        if (match) {
          return parseFloat(match[1]);
        }
      }
    }

    // Estimate from dimensions
    const windowDims = drawing.dimensions.filter(d =>
      d.layer?.toLowerCase().includes('window') ||
      d.layer?.toLowerCase().includes('glazing')
    );

    if (windowDims.length > 0) {
      // Rough estimate
      return windowDims.reduce((sum, d) => sum + (d.value * 1000), 0);
    }

    return null;
  }

  /**
   * Calculate glazing ratio
   */
  private calculateGlazingRatio(drawing: DrawingData, floorArea: number): number | null {
    if (floorArea <= 0) return null;

    const glazingArea = this.extractGlazingArea(drawing);
    if (glazingArea === null) return null;

    return glazingArea / floorArea;
  }

  /**
   * Extract SHGC value
   */
  private extractSHGC(textContent: string[], annotations: string[]): number | null {
    const allText = [...textContent, ...annotations];

    const patterns = [
      /shgc\s*[:=]?\s*(\d+\.?\d*)/i,
      /solar\s*heat\s*gain\s*coefficient\s*[:=]?\s*(\d+\.?\d*)/i,
      /g-value\s*[:=]?\s*(\d+\.?\d*)/i
    ];

    for (const text of allText) {
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          return parseFloat(match[1]);
        }
      }
    }

    return null;
  }

  /**
   * Extract shading devices
   */
  private extractShadingDevices(drawing: DrawingData): boolean {
    const shadingSymbols = drawing.symbols.filter(s =>
      s.name.toLowerCase().includes('shade') ||
      s.name.toLowerCase().includes('overhang') ||
      s.name.toLowerCase().includes('pergola') ||
      s.name.toLowerCase().includes('louvre')
    );

    if (shadingSymbols.length > 0) return true;

    const shadingText = drawing.textElements.filter(t =>
      t.content.toLowerCase().includes('shading') ||
      t.content.toLowerCase().includes('overhang') ||
      t.content.toLowerCase().includes('pergola') ||
      t.content.toLowerCase().includes('blind')
    );

    return shadingText.length > 0;
  }

  /**
   * Check for efficient lighting
   */
  private checkEfficientLighting(textContent: string[], annotations: string[]): boolean {
    const allText = [...textContent, ...annotations];
    return allText.some(text =>
      text.includes('led') ||
      text.includes('energy efficient') ||
      text.includes('luminaire') ||
      text.includes('efficacy')
    );
  }

  /**
   * Check for light sensors
   */
  private checkLightSensors(textContent: string[], annotations: string[]): boolean {
    const allText = [...textContent, ...annotations];
    return allText.some(text =>
      text.includes('daylight sensor') ||
      text.includes('light sensor') ||
      text.includes('occupancy sensor')
    );
  }

  /**
   * Check HVAC efficiency
   */
  private checkHVACEfficiency(textContent: string[], annotations: string[]): boolean {
    const allText = [...textContent, ...annotations];
    return allText.some(text =>
      text.includes('hvac') ||
      text.includes('air conditioning') ||
      text.includes('cop') ||
      text.includes('eer') ||
      text.includes('efficiency')
    );
  }

  /**
   * Check thermostat controls
   */
  private checkThermostatControls(textContent: string[], annotations: string[]): boolean {
    const allText = [...textContent, ...annotations];
    return allText.some(text =>
      text.includes('thermostat') ||
      text.includes('temperature control') ||
      text.includes('programmable')
    );
  }

  /**
   * Check solar water heating
   */
  private checkSolarWaterHeating(textContent: string[], annotations: string[]): boolean {
    const allText = [...textContent, ...annotations];
    return allText.some(text =>
      text.includes('solar') && text.includes('water') ||
      text.includes('solar geyser') ||
      text.includes('heat pump')
    );
  }

  /**
   * Check geyser insulation
   */
  private checkGeyserInsulation(textContent: string[], annotations: string[]): boolean {
    const allText = [...textContent, ...annotations];
    return allText.some(text =>
      text.includes('geyser blanket') ||
      text.includes('cylinder insulation') ||
      text.includes('hot water insulation')
    );
  }

  /**
   * Check energy summary
   */
  private checkEnergySummary(textContent: string[], annotations: string[]): boolean {
    const allText = [...textContent, ...annotations];
    return allText.some(text =>
      text.includes('energy summary') ||
      text.includes('energy compliance') ||
      text.includes('xa compliance')
    );
  }

  /**
   * Evaluate a single energy rule
   */
  private async evaluateEnergyRule(
    rule: ComplianceRule,
    energyData: EnergyAnalysisData,
    drawing: DrawingData,
    projectInfo: ProjectInfo
  ): Promise<ComplianceResult> {
    let passed = false;
    let value: string | number | boolean | undefined;
    let expected: string | number | boolean | undefined;
    let finding: Finding | undefined;

    switch (rule.id) {
      case 'ENR-001': // XA Form
        passed = this.checkXAFormPresent(energyData, rule, drawing);
        break;
      case 'ENR-002': // Competent Person
        passed = this.checkCompetentPersonDeclaration(energyData, rule, drawing);
        break;
      case 'ENR-003': // Wall R-value
        ({ passed, value, expected, finding } = this.checkWallRValue(energyData, rule, drawing));
        break;
      case 'ENR-004': // Roof R-value
        ({ passed, value, expected, finding } = this.checkRoofRValue(energyData, rule, drawing));
        break;
      case 'ENR-005': // Floor R-value
        ({ passed, value, expected, finding } = this.checkFloorRValue(energyData, rule, drawing));
        break;
      case 'ENR-006': // Glazing Ratio
        ({ passed, value, expected, finding } = this.checkGlazingRatio(energyData, rule, drawing));
        break;
      case 'ENR-007': // SHGC
        ({ passed, value, expected, finding } = this.checkSHGC(energyData, rule, drawing));
        break;
      case 'ENR-008': // Shading Devices
        passed = this.checkShadingDevices(energyData, rule, drawing);
        break;
      case 'ENR-009': // Efficient Lighting
        passed = this.checkEfficientLightingPresent(energyData, rule, drawing);
        break;
      case 'ENR-010': // Light Sensors
        passed = this.checkLightSensorsPresent(energyData, rule, projectInfo);
        break;
      case 'ENR-011': // HVAC Efficiency
        passed = this.checkHVACEfficiencyPresent(energyData, rule, drawing);
        break;
      case 'ENR-012': // Thermostat Controls
        passed = this.checkThermostatControlsPresent(energyData, rule, drawing);
        break;
      case 'ENR-013': // Solar Water Heating
        passed = this.checkSolarWaterHeatingPresent(energyData, rule, projectInfo);
        break;
      case 'ENR-014': // Geyser Insulation
        passed = this.checkGeyserInsulationPresent(energyData, rule, drawing);
        break;
      case 'ENR-015': // Energy Summary
        passed = this.checkEnergySummaryPresent(energyData, rule, drawing);
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
   * Check ENR-001: XA Form Present
   */
  private checkXAFormPresent(energyData: EnergyAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return energyData.xaFormPresent;
  }

  /**
   * Check ENR-002: Competent Person Declaration
   */
  private checkCompetentPersonDeclaration(energyData: EnergyAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return energyData.competentPersonDeclaration;
  }

  /**
   * Check ENR-003: Wall R-value
   */
  private checkWallRValue(
    energyData: EnergyAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): { passed: boolean; value?: number; expected?: number; finding?: Finding } {
    const minRValue = ENERGY_DTS.walls.minRValue;

    if (energyData.wallRValue === null) {
      return {
        passed: false,
        finding: this.createEnergyFinding(
          rule,
          'Wall R-value not specified. Minimum required: 1.7 W/m²K',
          'critical',
          drawing,
          `Specify wall insulation to achieve R-value ≥${minRValue} W/m²K. Options: cavity brick (1.9), AAC block 200mm (1.8), insulated timber frame (2.5)`
        )
      };
    }

    if (energyData.wallRValue < minRValue) {
      return {
        passed: false,
        value: energyData.wallRValue,
        expected: minRValue,
        finding: this.createEnergyFinding(
          rule,
          `Wall R-value (${energyData.wallRValue} W/m²K) is below minimum required (${minRValue} W/m²K)`,
          'critical',
          drawing,
          `Increase wall insulation to meet minimum R-value of ${minRValue} W/m²K`
        )
      };
    }

    return { passed: true, value: energyData.wallRValue, expected: minRValue };
  }

  /**
   * Check ENR-004: Roof R-value
   */
  private checkRoofRValue(
    energyData: EnergyAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): { passed: boolean; value?: number; expected?: number; finding?: Finding } {
    const minRValue = ENERGY_DTS.roofs.minRValue;

    if (energyData.roofRValue === null) {
      return {
        passed: false,
        finding: this.createEnergyFinding(
          rule,
          'Roof R-value not specified. Minimum required: 3.7 W/m²K',
          'critical',
          drawing,
          `Specify roof insulation to achieve R-value ≥${minRValue} W/m²K`
        )
      };
    }

    if (energyData.roofRValue < minRValue) {
      return {
        passed: false,
        value: energyData.roofRValue,
        expected: minRValue,
        finding: this.createEnergyFinding(
          rule,
          `Roof R-value (${energyData.roofRValue} W/m²K) is below minimum required (${minRValue} W/m²K)`,
          'critical',
          drawing,
          `Increase roof insulation to meet minimum R-value of ${minRValue} W/m²K`
        )
      };
    }

    return { passed: true, value: energyData.roofRValue, expected: minRValue };
  }

  /**
   * Check ENR-005: Floor R-value
   */
  private checkFloorRValue(
    energyData: EnergyAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): { passed: boolean; value?: number; expected?: number; finding?: Finding } {
    const minRValue = ENERGY_DTS.floors.minRValue;

    if (energyData.floorRValue === null) {
      // Floor R-value is optional, but recommended
      return { passed: true };
    }

    if (energyData.floorRValue < minRValue) {
      return {
        passed: false,
        value: energyData.floorRValue,
        expected: minRValue,
        finding: this.createEnergyFinding(
          rule,
          `Floor R-value (${energyData.floorRValue} W/m²K) is below minimum recommended (${minRValue} W/m²K)`,
          'medium',
          drawing,
          `Consider increasing floor insulation to meet minimum R-value of ${minRValue} W/m²K`
        )
      };
    }

    return { passed: true, value: energyData.floorRValue, expected: minRValue };
  }

  /**
   * Check ENR-006: Glazing Ratio
   */
  private checkGlazingRatio(
    energyData: EnergyAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): { passed: boolean; value?: number; expected?: number; finding?: Finding } {
    const maxGlazing = ENERGY_DTS.glazing.maxGlazingRatio;

    if (energyData.glazingRatio === null) {
      return {
        passed: false,
        finding: this.createEnergyFinding(
          rule,
          'Glazing ratio could not be determined',
          'critical',
          drawing,
          'Calculate and indicate total glazing area as percentage of floor area. Maximum: 50%'
        )
      };
    }

    if (energyData.glazingRatio > maxGlazing) {
      return {
        passed: false,
        value: energyData.glazingRatio * 100,
        expected: maxGlazing * 100,
        finding: this.createEnergyFinding(
          rule,
          `Glazing ratio (${(energyData.glazingRatio * 100).toFixed(1)}%) exceeds maximum allowed (${maxGlazing * 100}%)`,
          'critical',
          drawing,
          `Reduce window area to meet maximum glazing ratio of ${maxGlazing * 100}%`
        )
      };
    }

    return { passed: true, value: energyData.glazingRatio * 100, expected: maxGlazing * 100 };
  }

  /**
   * Check ENR-007: SHGC
   */
  private checkSHGC(
    energyData: EnergyAnalysisData,
    rule: ComplianceRule,
    drawing: DrawingData
  ): { passed: boolean; value?: number; expected?: number; finding?: Finding } {
    const maxSHGC = ENERGY_DTS.glazing.maxSHGC;

    if (energyData.glazingSHGC === null) {
      // Not specified - could be default
      return { passed: true };
    }

    if (energyData.glazingSHGC > maxSHGC) {
      return {
        passed: false,
        value: energyData.glazingSHGC,
        expected: maxSHGC,
        finding: this.createEnergyFinding(
          rule,
          `Glazing SHGC (${energyData.glazingSHGC}) exceeds maximum (${maxSHGC})`,
          'high',
          drawing,
          'Specify low-E glazing or tinted glass to reduce SHGC'
        )
      };
    }

    return { passed: true, value: energyData.glazingSHGC, expected: maxSHGC };
  }

  /**
   * Check ENR-008: Shading Devices
   */
  private checkShadingDevices(energyData: EnergyAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return energyData.shadingDevices;
  }

  /**
   * Check ENR-009: Efficient Lighting
   */
  private checkEfficientLightingPresent(energyData: EnergyAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return energyData.efficientLighting;
  }

  /**
   * Check ENR-010: Light Sensors
   */
  private checkLightSensorsPresent(energyData: EnergyAnalysisData, rule: ComplianceRule, projectInfo: ProjectInfo): boolean {
    // Light sensors required for commercial buildings
    if (projectInfo.buildingType === 'commercial' || projectInfo.buildingType === 'mixed_use') {
      return energyData.lightSensors;
    }
    // Not required for residential
    return true;
  }

  /**
   * Check ENR-011: HVAC Efficiency
   */
  private checkHVACEfficiencyPresent(energyData: EnergyAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return energyData.hvacEfficiency;
  }

  /**
   * Check ENR-012: Thermostat Controls
   */
  private checkThermostatControlsPresent(energyData: EnergyAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return energyData.thermostatControls;
  }

  /**
   * Check ENR-013: Solar Water Heating
   */
  private checkSolarWaterHeatingPresent(energyData: EnergyAnalysisData, rule: ComplianceRule, projectInfo: ProjectInfo): boolean {
    // Solar water heating required for residential
    if (projectInfo.buildingType === 'residential') {
      return energyData.solarWaterHeating;
    }
    // Recommended for others
    return true;
  }

  /**
   * Check ENR-014: Geyser Insulation
   */
  private checkGeyserInsulationPresent(energyData: EnergyAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return energyData.geyserInsulation;
  }

  /**
   * Check ENR-015: Energy Summary
   */
  private checkEnergySummaryPresent(energyData: EnergyAnalysisData, _rule: ComplianceRule, _drawing: DrawingData): boolean {
    return energyData.energySummary;
  }

  /**
   * Create a finding for energy analysis
   */
  private createEnergyFinding(
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
    const energyData = this.extractEnergyData(context.drawing, context.projectInfo);
    return this.evaluateEnergyRule(rule, energyData, context.drawing, context.projectInfo);
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface EnergyAnalysisData {
  // Documentation
  xaFormPresent: boolean;
  competentPersonDeclaration: boolean;

  // Thermal performance
  wallRValue: number | null;
  roofRValue: number | null;
  floorRValue: number | null;

  // Glazing
  glazingArea: number | null;
  floorArea: number;
  glazingRatio: number | null;
  glazingSHGC: number | null;
  shadingDevices: boolean;

  // Lighting
  efficientLighting: boolean;
  lightSensors: boolean;

  // HVAC
  hvacEfficiency: boolean;
  thermostatControls: boolean;

  // Water heating
  solarWaterHeating: boolean;
  geyserInsulation: boolean;

  // General
  energySummary: boolean;

  // Raw data
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
export default EnergyComplianceAgent;
