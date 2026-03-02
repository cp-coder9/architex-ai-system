# AI Agent System - Detailed Compliance & Agent Implementation Plan

## Phase 1: Core Infrastructure & Types

### 1.1 Define Agent Type System
- Create `src/types/agent.ts` with interfaces
- Agent configuration, status, results, findings
- South African compliance standards types
- Audit trail types

### 1.2 Create Base Agent Class
- `src/agents/base/Agent.ts`
- Common functionality for all agents
- Error handling, retry logic, metrics tracking

---

## Phase 2: Technical Validation Agents

### 2.1 Dimension Validator Agent
**Purpose**: Verify all dimensions in the drawing are accurate and consistent

**Checks**:
- Length, width, height measurements
- Consistency across all views (plan, elevation, section)
- Tolerance levels (SANS 10160 tolerance standards)
- Dimension lines properly placed
- Arrowheads and termination symbols
- Units clearly indicated (mm for architectural)
- Critical dimensions for structural elements
- Opening dimensions (doors, windows)
- Room dimensions match furniture layout
- Ceiling heights consistent

**SANS Standards**: SANS 10160 (Load actions), SANS 10182 (Notation)

---

### 2.2 Scale Verifier Agent
**Purpose**: Ensure correct scale throughout the drawing

**Checks**:
- Scale bar present and accurate
- Scale indicated in title block
- Consistent scale across drawing sheets
- Proper proportion between elements
- Measurement units clearly stated
- Metric units (mm) used per SA standards
- Scale appropriate for drawing type
- North indicator present and accurate

**SANS Standards**: SANS 10011 (Drawing office practice)

---

### 2.3 Layer Analyzer Agent
**Purpose**: Validate layer structure and organization

**Checks**:
- Correct layer naming conventions (SA Building Industry)
- Layers organized by discipline (Architecture, Structural, MEP)
- Proper layer colors for plotting
- Unused layers removed
- Layer visibility settings appropriate
- Linetypes assigned correctly
- Text and dimensions on correct layers
- Xref boundaries properly managed

**Best Practices**: ISO 13567, SAIA standards

---

### 2.4 Symbol Recognizer Agent
**Purpose**: Verify architectural symbols are used correctly

**Checks**:
- Standard SA architectural symbols used
- Electrical symbols per SANS 10142-1
- Plumbing symbols standardized
- Fire protection symbols included
- HVAC symbols for mechanical
- Structural symbols per engineering standards
- Furniture symbols consistent
- Door/window scheduling symbols
- Symbol orientation correct
- Legend provided and complete

**SANS Standards**: SANS 10142-1 (Wiring), SANS 10400-L (Glazing)

---

### 2.5 Text Clarity Checker Agent
**Purpose**: Verify text legibility and readability

**Checks**:
- Font sizes appropriate for plotting scale
- Text height minimum 2.5mm after plotting
- Font type: Sans-serif preferred
- Uppercase for titles, title case for subtitles
- Adequate spacing between lines
- Text parallel to reading direction
- Adequate contrast for readability
- No overlapping text
- Dimension text properly placed
- Notes and specifications legible

**SANS Standards**: SANS 10011, SANS 10083 (Lettering)

---

## Phase 3: South African Compliance Agents

### 3.1 Compliance Auditor Agent (SANS Standards)
**Purpose**: Check drawings against South African National Standards

**SANS 10160 - Load Actions**:
- Floor load capacities indicated
- Imposed loads for different occupancy types
- Roof loads specified
- Wind load considerations
- Seismic zone requirements

**SANS 10137 - Concrete**:
- Concrete grade specified (e.g., C30/37)
- Reinforcement details complete
- Cover to reinforcement indicated
- Concrete mix specifications

**SANS 10182 - Steel**:
- Steel grade specified
- Connection details complete
- Welding symbols per SANS 10063
- Section properties indicated

**SANS 10221 - Timber**:
- Timber species and grade
- Nail/screw schedules
- Joint details complete

---

### 3.2 Building Code Inspector Agent
**Purpose**: Validate National Building Regulations

**National Building Regulations (NBR)**:

**Part A - General Principles**:
- Drawing identification complete
- Revision blocks present
- Drawing index provided

**Part B - Structural Design**:
- Structural system clearly indicated
- Foundation system specified
- Load path shown
- Structural calculations referenced

**Part C - Dimensions**:
- Room sizes meet minimums
- Ceiling heights meet requirements (2.4m min for habitable)
- Door heights (2.1m minimum)
- Window sizes adequate for light

**Part J - Lighting and Ventilation**:
- Window area minimum 10% floor area
- Natural ventilation provisions
- Light court requirements

**Part K - Fire Protection**:
- Fire rating of elements indicated
- Emergency exit routes shown
- Fire door specifications
- Fire separation distances

**Part L - Glazing**:
- Safety glazing indicated
- Glazing type specifications
- Installation details

---

### 3.3 Municipal Requirements Checker Agent
**Purpose**: Verify local municipal regulations

**Common Municipal Requirements**:
- Site coverage calculations
- Floor area ratio (FAR) compliance
- Height restrictions
- Setback distances
- Parking requirements
- Stormwater management
- Building lines
- Coverage diagrams
- Site plan requirements
-邻居/neighbour notifications

**Submission Requirements**:
- Council stamp blocks
- Professional engineer stamp
- Architect registration number
- Project number assignment
- Required quantities

---

### 3.4 Safety Standards Validator Agent
**Purpose**: Check safety requirements

**Structural Safety**:
- Foundation design adequate
- Load-bearing calculations present
- Structural connection details
- Deflection limits observed
- Lateral stability ensured

**Fire Safety**:
- Fire resistance ratings for elements
- Occupant load calculations
- Travel distance to exits
- Fire extinguisher locations
- Emergency lighting provisions
- Smoke ventilation requirements
- Fire door specifications

**Construction Safety**:
- Construction sequence indicated
- Scaffolding access points
- Safety barrier details
- Excavation support details
- Propping during construction

**SANS Standards**: SANS 10089, SANS 10400-L, SANS 1027

---

### 3.5 Accessibility Validator Agent
**Purpose**: Ensure accessibility compliance

**National Building Regulations Part S**:
- Ramps for wheelchair access
- Door widths (900mm minimum)
- Grab rails in bathrooms
- Tactile indicators
- Accessible parking spaces
- Lift access requirements
- Ramp gradients (1:12 max)
- Handrail specifications

---

## Phase 4: Review & Finalization Agents

### 4.1 Final Review Agent
**Purpose**: Comprehensive final inspection

**Checks**:
- All previous findings resolved
- Cross-references between drawings
- Coordination between disciplines
- Specification consistency
- Title block information complete
- Drawing list/index accurate
- Issue resolution verification
- Quality control checklist
- Professional sign-off blocks
- Submission completeness

---

## Phase 5: Orchestrator & Workflow

### 5.1 Task Queue Manager
- Priority scheduling
- Concurrent agent execution
- Resource management

### 5.2 Conflict Resolution
- Detect conflicting findings
- Re-assign to original agent
- Escalate unresolved conflicts

### 5.3 Error Recovery
- Automatic retry logic
- Circuit breaker pattern
- Graceful degradation

---

## Phase 6: Compliance Rules Engine

### 6.1 Rules Configuration
```typescript
interface ComplianceRule {
  id: string;
  name: string;
  category: 'structural' | 'fire' | 'accessibility' | 'municipal' | 'technical';
  standard: 'SANS' | 'NBR' | 'MUNICIPAL' | 'LOCAL';
  ruleCode: string; // e.g., "NBR Part K"
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  checkFunction: (drawing: Drawing) => Finding[];
  references: string[];
}
```

### 6.2 Key Compliance Rules by Standard
- 50+ SANS standards checks
- 20+ NBR regulations
- 30+ Municipal requirements
- 15+ Accessibility requirements

---

## Phase 7: Testing

### 7.1 Unit Tests per Agent
- Each agent logic independently tested
- Mock drawing data for each standard
- Expected findings validation

### 7.2 Integration Tests
- Full drawing analysis flow
- Agent coordination
- Conflict resolution

### 7.3 Edge Cases
- Unsupported file formats
- Corrupted files
- Missing data
- Conflicting standards

---

## Implementation Files Structure

```
src/
├── types/
│   └── agent.ts                 # Agent type definitions
├── agents/
│   ├── base/
│   │   └── Agent.ts            # Base agent class
│   ├── specialized/
│   │   ├── DimensionValidator.ts
│   │   ├── ScaleVerifier.ts
│   │   ├── LayerAnalyzer.ts
│   │   ├── SymbolRecognizer.ts
│   │   ├── TextClarityChecker.ts
│   │   ├── ComplianceAuditor.ts
│   │   ├── BuildingCodeInspector.ts
│   │   ├── MunicipalRequirements.ts
│   │   ├── SafetyStandardsValidator.ts
│   │   └── FinalReviewAgent.ts
│   └── services/
│       ├── FileParser.ts
│       └── ComplianceEngine.ts
├── orchestrator/
│   ├── Orchestrator.ts
│   ├── TaskQueue.ts
│   ├── ConflictResolver.ts
│   ├── OutputValidator.ts
│   ├── ErrorRecovery.ts
│   ├── AuditLogger.ts
│   └── ReportingService.ts
└── config/
    └── compliance-rules.ts     # SANS, NBR, Municipal rules
```

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Agent Accuracy | ≥98% |
| Processing Time | <5 min per drawing |
| SANS Compliance Coverage | 100% |
| NBR Compliance Coverage | 100% |
| Municipal Coverage | Per jurisdiction |
| False Positive Rate | <2% |
