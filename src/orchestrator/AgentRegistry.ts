/**
 * AgentRegistry
 * 
 * Registry that maps drawing types to required compliance agents.
 * Manages agent registration, lookup, and drawing type associations.
 */

import { DrawingType } from '@/types/agent';

// ============================================================================
// Types
// ============================================================================

export interface RegistryAgentConfig {
  agentId: string;
  agentName: string;
  drawingTypes: DrawingType[];
  priority: number;
  isRequired: boolean;
  isTechnical: boolean;
}

export interface DrawingTypeConfig {
  drawingType: DrawingType;
  displayName: string;
  requiredAgents: string[];
  optionalAgents: string[];
  technicalAgents: string[];
  allAgents: string[];
}

// ============================================================================
// Registry Configuration
// ============================================================================

// All compliance agents
const COMPLIANCE_AGENTS: RegistryAgentConfig[] = [
  // Site Plan Agents
  {
    agentId: 'siteplan-compliance-agent',
    agentName: 'Site Plan Compliance Agent',
    drawingTypes: [DrawingType.SITE_PLAN],
    priority: 1,
    isRequired: true,
    isTechnical: false
  },
  
  // Floor Plan Agents
  {
    agentId: 'floorplan-compliance-agent',
    agentName: 'Floor Plan Compliance Agent',
    drawingTypes: [DrawingType.FLOOR_PLAN],
    priority: 1,
    isRequired: true,
    isTechnical: false
  },
  
  // Elevation Agents
  {
    agentId: 'elevation-compliance-agent',
    agentName: 'Elevation Compliance Agent',
    drawingTypes: [DrawingType.ELEVATION, DrawingType.ROOF_PLAN],
    priority: 1,
    isRequired: true,
    isTechnical: false
  },
  
  // Section Agents
  {
    agentId: 'section-compliance-agent',
    agentName: 'Section Compliance Agent',
    drawingTypes: [DrawingType.SECTION],
    priority: 1,
    isRequired: true,
    isTechnical: false
  },
  
  // Drainage Agents
  {
    agentId: 'drainage-compliance-agent',
    agentName: 'Drainage Compliance Agent',
    drawingTypes: [DrawingType.DRAINAGE],
    priority: 1,
    isRequired: true,
    isTechnical: false
  },
  
  // Fire Safety Agents
  {
    agentId: 'fire-compliance-agent',
    agentName: 'Fire Compliance Agent',
    drawingTypes: [DrawingType.FIRE_LAYOUT],
    priority: 1,
    isRequired: true,
    isTechnical: false
  },
  
  // Energy Agents
  {
    agentId: 'energy-compliance-agent',
    agentName: 'Energy Compliance Agent',
    drawingTypes: [DrawingType.FLOOR_PLAN, DrawingType.ELEVATION],
    priority: 2,
    isRequired: false,
    isTechnical: false
  },
  
  // Structural Agents (for future implementation)
  {
    agentId: 'structural-compliance-agent',
    agentName: 'Structural Compliance Agent',
    drawingTypes: [DrawingType.FLOOR_PLAN, DrawingType.SECTION],
    priority: 1,
    isRequired: false,
    isTechnical: false
  },
  
  // Municipal Requirements Agents (for future implementation)
  {
    agentId: 'municipal-requirements-agent',
    agentName: 'Municipal Requirements Agent',
    drawingTypes: [DrawingType.SITE_PLAN, DrawingType.FLOOR_PLAN],
    priority: 2,
    isRequired: false,
    isTechnical: false
  },
  
  // Accessibility Agents (for future implementation)
  {
    agentId: 'accessibility-agent',
    agentName: 'Accessibility Compliance Agent',
    drawingTypes: [DrawingType.FLOOR_PLAN, DrawingType.ELEVATION, DrawingType.SITE_PLAN],
    priority: 2,
    isRequired: false,
    isTechnical: false
  },
  
  // Final Review Agent
  {
    agentId: 'final-review-agent',
    agentName: 'Final Review Agent',
    drawingTypes: Object.values(DrawingType),
    priority: 3,
    isRequired: true,
    isTechnical: false
  }
];

// Technical validation agents
const TECHNICAL_AGENTS: RegistryAgentConfig[] = [
  {
    agentId: 'dimension-validator-agent',
    agentName: 'Dimension Validator Agent',
    drawingTypes: [
      DrawingType.FLOOR_PLAN,
      DrawingType.ELEVATION,
      DrawingType.SECTION,
      DrawingType.DETAIL
    ],
    priority: 1,
    isRequired: true,
    isTechnical: true
  },
  {
    agentId: 'scale-verifier-agent',
    agentName: 'Scale Verifier Agent',
    drawingTypes: Object.values(DrawingType),
    priority: 1,
    isRequired: true,
    isTechnical: true
  },
  {
    agentId: 'layer-analyzer-agent',
    agentName: 'Layer Analyzer Agent',
    drawingTypes: [
      DrawingType.SITE_PLAN,
      DrawingType.FLOOR_PLAN,
      DrawingType.ELEVATION,
      DrawingType.SECTION,
      DrawingType.DRAINAGE,
      DrawingType.FIRE_LAYOUT,
      DrawingType.ELECTRICAL
    ],
    priority: 2,
    isRequired: false,
    isTechnical: true
  },
  {
    agentId: 'symbol-recognizer-agent',
    agentName: 'Symbol Recognizer Agent',
    drawingTypes: [
      DrawingType.FLOOR_PLAN,
      DrawingType.ELEVATION,
      DrawingType.DRAINAGE,
      DrawingType.FIRE_LAYOUT,
      DrawingType.ELECTRICAL
    ],
    priority: 2,
    isRequired: false,
    isTechnical: true
  },
  {
    agentId: 'text-clarity-checker-agent',
    agentName: 'Text Clarity Checker Agent',
    drawingTypes: Object.values(DrawingType),
    priority: 2,
    isRequired: false,
    isTechnical: true
  }
];

// Drawing type to agents mapping
const DRAWING_TYPE_MAPPINGS: Record<DrawingType, {
  required: string[];
  optional: string[];
  technical: string[];
}> = {
  [DrawingType.SITE_PLAN]: {
    required: [
      'siteplan-compliance-agent',
      'scale-verifier-agent'
    ],
    optional: [
      'municipal-requirements-agent',
      'accessibility-agent',
      'layer-analyzer-agent'
    ],
    technical: [
      'scale-verifier-agent',
      'layer-analyzer-agent'
    ]
  },
  [DrawingType.FLOOR_PLAN]: {
    required: [
      'floorplan-compliance-agent',
      'dimension-validator-agent',
      'scale-verifier-agent'
    ],
    optional: [
      'energy-compliance-agent',
      'structural-compliance-agent',
      'accessibility-agent',
      'municipal-requirements-agent',
      'layer-analyzer-agent',
      'symbol-recognizer-agent',
      'text-clarity-checker-agent'
    ],
    technical: [
      'dimension-validator-agent',
      'scale-verifier-agent',
      'layer-analyzer-agent',
      'symbol-recognizer-agent',
      'text-clarity-checker-agent'
    ]
  },
  [DrawingType.ELEVATION]: {
    required: [
      'elevation-compliance-agent',
      'scale-verifier-agent'
    ],
    optional: [
      'energy-compliance-agent',
      'accessibility-agent',
      'layer-analyzer-agent',
      'dimension-validator-agent',
      'text-clarity-checker-agent'
    ],
    technical: [
      'scale-verifier-agent',
      'layer-analyzer-agent',
      'dimension-validator-agent',
      'text-clarity-checker-agent'
    ]
  },
  [DrawingType.SECTION]: {
    required: [
      'section-compliance-agent',
      'scale-verifier-agent'
    ],
    optional: [
      'structural-compliance-agent',
      'layer-analyzer-agent',
      'dimension-validator-agent',
      'text-clarity-checker-agent'
    ],
    technical: [
      'scale-verifier-agent',
      'layer-analyzer-agent',
      'dimension-validator-agent',
      'text-clarity-checker-agent'
    ]
  },
  [DrawingType.DETAIL]: {
    required: [
      'dimension-validator-agent',
      'scale-verifier-agent'
    ],
    optional: [
      'text-clarity-checker-agent'
    ],
    technical: [
      'dimension-validator-agent',
      'scale-verifier-agent',
      'text-clarity-checker-agent'
    ]
  },
  [DrawingType.DRAINAGE]: {
    required: [
      'drainage-compliance-agent',
      'scale-verifier-agent'
    ],
    optional: [
      'symbol-recognizer-agent',
      'layer-analyzer-agent'
    ],
    technical: [
      'scale-verifier-agent',
      'symbol-recognizer-agent',
      'layer-analyzer-agent'
    ]
  },
  [DrawingType.FIRE_LAYOUT]: {
    required: [
      'fire-compliance-agent',
      'scale-verifier-agent'
    ],
    optional: [
      'symbol-recognizer-agent',
      'layer-analyzer-agent'
    ],
    technical: [
      'scale-verifier-agent',
      'symbol-recognizer-agent',
      'layer-analyzer-agent'
    ]
  },
  [DrawingType.ROOF_PLAN]: {
    required: [
      'elevation-compliance-agent',
      'scale-verifier-agent'
    ],
    optional: [
      'layer-analyzer-agent'
    ],
    technical: [
      'scale-verifier-agent',
      'layer-analyzer-agent'
    ]
  },
  [DrawingType.ELECTRICAL]: {
    required: [
      'scale-verifier-agent'
    ],
    optional: [
      'layer-analyzer-agent',
      'symbol-recognizer-agent',
      'text-clarity-checker-agent'
    ],
    technical: [
      'scale-verifier-agent',
      'layer-analyzer-agent',
      'symbol-recognizer-agent',
      'text-clarity-checker-agent'
    ]
  },
  [DrawingType.THREE_D_RENDER]: {
    required: [
      'scale-verifier-agent'
    ],
    optional: [
      'text-clarity-checker-agent'
    ],
    technical: [
      'scale-verifier-agent',
      'text-clarity-checker-agent'
    ]
  }
};

// ============================================================================
// Agent Registry Implementation
// ============================================================================

export class AgentRegistry {
  // Registry stores
  private agents: Map<string, RegistryAgentConfig>;
  private drawingTypeConfigs: Map<DrawingType, DrawingTypeConfig>;

  constructor() {
    this.agents = new Map();
    this.drawingTypeConfigs = new Map();
    
    this.initializeRegistry();
  }

  /**
   * Initialize the registry with all agents
   */
  private initializeRegistry(): void {
    // Register compliance agents
    for (const agent of COMPLIANCE_AGENTS) {
      this.agents.set(agent.agentId, agent);
    }

    // Register technical agents
    for (const agent of TECHNICAL_AGENTS) {
      this.agents.set(agent.agentId, agent);
    }

    // Initialize drawing type configurations
    for (const [drawingType, mapping] of Object.entries(DRAWING_TYPE_MAPPINGS)) {
      const dt = drawingType as DrawingType;
      const allAgents = [
        ...mapping.required,
        ...mapping.optional,
        ...mapping.technical
      ];

      this.drawingTypeConfigs.set(dt, {
        drawingType: dt,
        displayName: this.getDisplayName(dt),
        requiredAgents: mapping.required,
        optionalAgents: mapping.optional,
        technicalAgents: mapping.technical,
        allAgents: [...new Set(allAgents)]
      });
    }
  }

  /**
   * Get display name for drawing type
   */
  private getDisplayName(drawingType: DrawingType): string {
    const names: Record<DrawingType, string> = {
      [DrawingType.SITE_PLAN]: 'Site Plan',
      [DrawingType.FLOOR_PLAN]: 'Floor Plan',
      [DrawingType.ELEVATION]: 'Elevation',
      [DrawingType.SECTION]: 'Section',
      [DrawingType.DETAIL]: 'Detail Drawing',
      [DrawingType.DRAINAGE]: 'Drainage Plan',
      [DrawingType.FIRE_LAYOUT]: 'Fire Layout',
      [DrawingType.ROOF_PLAN]: 'Roof Plan',
      [DrawingType.ELECTRICAL]: 'Electrical Layout',
      [DrawingType.THREE_D_RENDER]: '3D Render'
    };
    return names[drawingType] || drawingType;
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): RegistryAgentConfig[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): RegistryAgentConfig | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get agents for a specific drawing type
   */
  getAgentsForDrawingType(
    drawingType: DrawingType,
    options?: {
      includeRequired?: boolean;
      includeOptional?: boolean;
      includeTechnical?: boolean;
      includeFinalReview?: boolean;
    }
  ): string[] {
    const config = this.drawingTypeConfigs.get(drawingType);
    if (!config) {
      return [];
    }

    const {
      includeRequired = true,
      includeOptional = true,
      includeTechnical = true,
      includeFinalReview = true
    } = options || {};

    const agents: string[] = [];

    if (includeRequired) {
      agents.push(...config.requiredAgents);
    }

    if (includeOptional) {
      agents.push(...config.optionalAgents);
    }

    if (includeTechnical) {
      agents.push(...config.technicalAgents);
    }

    if (includeFinalReview) {
      agents.push('final-review-agent');
    }

    return [...new Set(agents)]; // Remove duplicates
  }

  /**
   * Get all agents for comprehensive analysis (all types)
   */
  getAllComplianceAgents(): string[] {
    return COMPLIANCE_AGENTS
      .filter(a => !a.isTechnical)
      .map(a => a.agentId);
  }

  /**
   * Get all technical agents
   */
  getAllTechnicalAgents(): string[] {
    return TECHNICAL_AGENTS.map(a => a.agentId);
  }

  /**
   * Get drawing type configuration
   */
  getDrawingTypeConfig(drawingType: DrawingType): DrawingTypeConfig | undefined {
    return this.drawingTypeConfigs.get(drawingType);
  }

  /**
   * Get all supported drawing types
   */
  getSupportedDrawingTypes(): DrawingType[] {
    return Array.from(this.drawingTypeConfigs.keys());
  }

  /**
   * Check if an agent is available for a drawing type
   */
  isAgentAvailableForDrawingType(agentId: string, drawingType: DrawingType): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;
    
    return agent.drawingTypes.includes(drawingType);
  }

  /**
   * Get agents by category
   */
  getAgentsByCategory(category: 'compliance' | 'technical'): RegistryAgentConfig[] {
    return Array.from(this.agents.values()).filter(
      agent => category === 'technical' ? agent.isTechnical : !agent.isTechnical
    );
  }

  /**
   * Get required agents for a drawing type
   */
  getRequiredAgents(drawingType: DrawingType): string[] {
    return this.getAgentsForDrawingType(drawingType, {
      includeRequired: true,
      includeOptional: false,
      includeTechnical: false,
      includeFinalReview: true
    });
  }

  /**
   * Get optional agents for a drawing type
   */
  getOptionalAgents(drawingType: DrawingType): string[] {
    const config = this.drawingTypeConfigs.get(drawingType);
    return config?.optionalAgents || [];
  }

  /**
   * Get technical validation agents
   */
  getTechnicalAgents(drawingType: DrawingType): string[] {
    return this.getAgentsForDrawingType(drawingType, {
      includeRequired: false,
      includeOptional: false,
      includeTechnical: true,
      includeFinalReview: false
    });
  }

  /**
   * Get agent priority
   */
  getAgentPriority(agentId: string): number {
    const agent = this.agents.get(agentId);
    return agent?.priority || 999;
  }

  /**
   * Sort agents by priority
   */
  sortByPriority(agentIds: string[]): string[] {
    return agentIds.sort((a, b) => this.getAgentPriority(a) - this.getAgentPriority(b));
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const agentRegistry = new AgentRegistry();

// Export default
export default AgentRegistry;
