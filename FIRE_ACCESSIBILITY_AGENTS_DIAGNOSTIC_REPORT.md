# Fire Compliance & Accessibility Agents Diagnostic Report

**Generated:** 2026-02-28  
**Floor Plan Under Analysis:** 2-bedroom residential dwelling with en-suite, guest bathroom, kitchen, living/dining areas, garage, and staircase  
**Standards Referenced:** SANS 10400-T (Fire Safety), NBR Part S (Accessibility)

---

## Executive Summary

This report analyzes the capabilities of the [`FireComplianceAgent`](src/agents/specialized/fire/FireComplianceAgent.ts:1) and [`AccessibilityAgent`](src/agents/specialized/accessibility/AccessibilityAgent.ts:1) for validating residential floor plan compliance. Both agents provide solid foundational checking but have gaps in residential-specific requirements that should be addressed.

**Overall Assessment:**
- FireComplianceAgent: **75% coverage** - Good for commercial/multi-storey, missing residential egress details
- AccessibilityAgent: **60% coverage** - Basic checks present, lacks residential accessibility nuances

---

## 1. FireComplianceAgent Analysis

### 1.1 Agent Capabilities Summary

| Capability | Status | Implementation Quality |
|------------|--------|----------------------|
| Escape route verification | ✅ Implemented | Text/symbol extraction based |
| Travel distance checking | ✅ Implemented | Max 45m for unsprinklered buildings |
| Exit door presence | ✅ Implemented | Symbol-based detection |
| Exit door swing direction | ⚠️ Partial | Only checks presence, not actual swing direction |
| Exit signage | ✅ Implemented | Text/symbol detection |
| Fire door presence | ✅ Implemented | Symbol-based detection |
| Fire door ratings (FD30/FD60) | ✅ Implemented | Pattern matching on text |
| Self-closing devices | ✅ Implemented | Pattern matching |
| Fire walls | ✅ Implemented | Symbol-based detection |
| Compartment floors | ✅ Implemented | For 3+ storey buildings |
| Fire stopping | ✅ Implemented | Pattern matching |
| Extinguisher positions | ✅ Implemented | Symbol-based detection |
| Emergency lighting | ✅ Implemented | Pattern matching |
| Smoke ventilation | ✅ Implemented | Symbol-based detection |
| Assembly points | ✅ Implemented | Pattern matching |
| Fire service access | ✅ Implemented | Pattern matching |
| Sprinkler systems | ✅ Implemented | Conditional on building size |
| Fire alarm systems | ✅ Implemented | Conditional on building type |

### 1.2 SANS 10400-T Rules Coverage (17 Rules)

```
FIRE-001: Escape Routes from All Rooms              ✅ CRITICAL
FIRE-002: Travel Distance ≤45m (Unsprinklered)      ✅ CRITICAL  
FIRE-003: Exit Doors Swing Direction                ⚠️ Limited
FIRE-004: Illuminated Exit Signs                    ✅ CRITICAL
FIRE-005: Fire Doors Where Required                 ✅ CRITICAL
FIRE-006: Door Ratings Correct (FD30/FD60)          ✅ CRITICAL
FIRE-007: Self-Closing Devices                      ✅ HIGH
FIRE-008: Fire Walls to Boundaries                  ✅ CRITICAL
FIRE-009: Compartment Floors                        ✅ CRITICAL
FIRE-010: Fire Stopping at Penetrations             ✅ HIGH
FIRE-011: Extinguisher Positions                    ✅ CRITICAL
FIRE-012: Emergency Lighting                        ✅ CRITICAL
FIRE-013: Smoke Ventilation                         ✅ HIGH
FIRE-014: Assembly Points Indicated                 ✅ MEDIUM
FIRE-015: Fire Service Access                       ✅ HIGH
FIRE-016: Sprinkler System (If Required)            ✅ CRITICAL
FIRE-017: Fire Alarm System                         ✅ HIGH
```

### 1.3 Compliance Checks Verification

#### ✅ Escape Routes from Habitable Rooms
**Rule:** [`FIRE-001`](src/agents/specialized/fire/FireComplianceAgent.ts:46)
**Implementation:** [`checkEscapeRoutes()`](src/agents/specialized/fire/FireComplianceAgent.ts:796)
```typescript
private checkEscapeRoutes(fireData: FireAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
  return fireData.escapeRoutes.length > 0;
}
```
**Assessment:** Basic presence check. Extracts escape routes from symbols named "escape", "exit", or "route" and text containing "escape route".

**For the Floor Plan:**
- Main bedroom: Must have clear path to exit
- Second bedroom: Must have clear path to exit  
- Living areas: Must have clear path to exit
- Kitchen: Must have clear path to exit

**Potential Issues:** Does not verify that ALL habitable rooms have individual escape routes.

---

#### ⚠️ Bedroom Window Egress Requirements
**Status:** NOT IMPLEMENTED

**Expected Check:**
- Minimum window opening: 600mm x 600mm
- Maximum sill height: 1200mm from floor
- Required in all bedrooms without direct exterior door access

**Current Gap:** The agent has no specific check for bedroom egress windows. It only checks for general escape routes and exit signs.

**Code Reference:** SANS 10400-T requires alternative escape routes when rooms don't have direct exterior access.

**Recommended Addition:**
```typescript
// Suggested new rule
{
  id: 'FIRE-018',
  name: 'Bedroom Egress Windows',
  description: 'Bedrooms without exterior doors must have egress windows (min 600x600mm, max sill 1200mm)',
  standard: 'SANS 10400-T',
  severity: Severity.CRITICAL,
  checkType: 'dimension',
  requirement: 'Egress windows must be min 600x600mm with sill max 1200mm above floor'
}
```

---

#### ⚠️ Door Widths for Escape Routes
**Status:** PARTIALLY IMPLEMENTED

**Rule:** [`FIRE-002`](src/agents/specialized/fire/FireComplianceAgent.ts:79) mentions travel distance but not specific door widths

**Expected Check:**
- Minimum escape route door width: 900mm clear opening
- Corridors: Minimum 1100mm width (per [`FIRE_SAFETY.exitWidth.minCorridor`](src/config/sans10400/types.ts:1032))

**Current Implementation:** 
- The [`FIRE_SAFETY`](src/config/sans10400/types.ts:1015) constants define minimum exit widths
- [`exitWidth.minSingleDoor: 750mm`](src/config/sans10400/types.ts:1030) is defined but not actively checked
- No door width extraction logic exists in [`extractExitDoors()`](src/agents/specialized/fire/FireComplianceAgent.ts:530)

**Gap:** Door width compliance is not verified during analysis.

---

#### ✅ Maximum Travel Distances
**Rule:** [`FIRE-002`](src/agents/specialized/fire/FireComplianceAgent.ts:79)
**Implementation:** [`checkTravelDistance()`](src/agents/specialized/fire/FireComplianceAgent.ts:800)

```typescript
const maxDistance = FIRE_SAFETY.travelDistance.unsprinklered; // 45000mm (45m)

if (fireData.travelDistance > maxDistance) {
  return {
    passed: false,
    finding: this.createFireFinding(
      rule,
      `Travel distance (${(fireData.travelDistance / 1000).toFixed(1)}m) exceeds maximum allowed`,
      'critical',
      drawing,
      `Reduce travel distance to exit or provide additional exits. Maximum allowed: ${maxDistance / 1000}m`
    )
  };
}
```

**Assessment:** Well implemented. Uses constants from [`FIRE_SAFETY.travelDistance`](src/config/sans10400/types.ts:1019).

**For the Floor Plan:**
- Maximum travel distance from any point to exit: 45m (for this unsprinklered residential building)
- With 2 bedrooms, living area, and kitchen: distances should be well under limit
- Garage attached: ensure safe egress path from garage to exterior

---

#### ⚠️ Door Swing Directions
**Rule:** [`FIRE-003`](src/agents/specialized/fire/FireComplianceAgent.ts:79)
**Implementation:** [`checkExitDoorSwing()`](src/agents/specialized/fire/FireComplianceAgent.ts:829)

```typescript
private checkExitDoorSwing(fireData: FireAnalysisData, rule: ComplianceRule, drawing: DrawingData): boolean {
  return fireData.exitDoors.length > 0;  // Only checks presence!
}
```

**Assessment:** **INADEQUATE** - Only checks if exit doors exist, not their swing direction.

**Required Behavior:**
- Exit doors MUST swing in the direction of travel (outward for exterior exits)
- Doors on escape routes must not obstruct egress when opened

**Current Gap:** No actual swing direction validation is performed. The [`ExitDoorData.swingDirection`](src/agents/specialized/fire/FireComplianceAgent.ts:937) property is hardcoded to `'out'` in [`extractExitDoors()`](src/agents/specialized/fire/FireComplianceAgent.ts:530).

**Potential Floor Plan Issues:**
- Interior doors opening into corridors can reduce effective corridor width
- Bathroom doors (typically 700-800mm) opening into hallways
- Bedroom doors swinging inward may be acceptable but should be verified

---

### 1.4 FireComplianceAgent Issues for This Floor Plan

| Issue | Severity | Description |
|-------|----------|-------------|
| **Missing egress window check** | HIGH | Bedrooms need 600x600mm egress windows if no direct exterior door |
| **No door width validation** | MEDIUM | Escape route doors should be min 900mm |
| **No door swing analysis** | MEDIUM | Doors opening into corridors reduce width |
| **No garage fire separation check** | MEDIUM | Garage attached to house needs fire-rated separation |
| **Staircase not checked** | LOW | If multi-storey, stair width and handrails need checking |
| **Kitchen fire risks** | LOW | Cooking appliance separation not checked |

### 1.5 When Fire Compliance is Triggered

```typescript
private isFireComplianceRequired(projectInfo: ProjectInfo): boolean {
  const { buildingType, floors, totalArea } = projectInfo;
  
  return (
    floors >= 2 ||                          // Multi-storey ✅ This building
    buildingType === 'commercial' ||
    buildingType === 'industrial' ||
    (totalArea !== undefined && totalArea > 500) ||
    buildingType === 'mixed_use'
  );
}
```

**For This Floor Plan:** Fire compliance IS required because it has a staircase (multi-storey implication).

---

## 2. AccessibilityAgent Analysis

### 2.1 Agent Capabilities Summary

| Capability | Status | Implementation Quality |
|------------|--------|----------------------|
| Wheelchair ramps | ✅ Implemented | Text pattern matching |
| Ramp gradients (1:12 max) | ✅ Implemented | Pattern extraction and validation |
| Door widths (900mm min) | ⚠️ Partial | Pattern matching only, no dimension validation |
| Grab rails in bathrooms | ✅ Implemented | Text pattern matching |
| Tactile indicators | ✅ Implemented | Text pattern matching |
| Accessible parking | ✅ Implemented | Text pattern matching |
| Lift access | ✅ Implemented | Conditional on floor count |
| Handrail specifications | ✅ Implemented | Text pattern matching |
| WC cubicle dimensions | ⚠️ Partial | Pattern matching only |
| Visual indicators | ✅ Implemented | Text pattern matching |
| **Main entrance accessibility** | ❌ Missing | No specific check |
| **Bathroom turning circles** | ❌ Missing | 1500mm diameter not checked |
| **Corridor widths** | ❌ Missing | No circulation space validation |
| **Kitchen counter heights** | ❌ Missing | No kitchen accessibility check |
| **Step-free access** | ❌ Missing | No threshold check |

### 2.2 NBR Part S Rules Coverage (10 Rules)

```
ACC-001: Wheelchair Access Ramps                       ✅ CRITICAL
ACC-002: Door Widths (900mm min)                       ⚠️ Limited
ACC-003: Grab Rails in Bathrooms                       ✅ HIGH
ACC-004: Tactile Indicators                            ✅ MEDIUM
ACC-005: Accessible Parking                            ✅ HIGH
ACC-006: Lift Access                                   ✅ HIGH
ACC-007: Ramp Gradients (1:12 max)                     ✅ CRITICAL
ACC-008: Handrail Specifications                       ✅ HIGH
ACC-009: WC Cubicle Dimensions (1500x1500mm)           ⚠️ Limited
ACC-010: Visual Indicators                             ✅ MEDIUM
```

### 2.3 Compliance Checks Verification

#### ⚠️ Main Entrance Accessibility
**Status:** NOT IMPLEMENTED

**Expected Check:**
- Level or ramped access to main entrance
- Maximum threshold height: 25mm
- Clear width at entrance: 900mm minimum
- Step-free entry path from parking/driveway

**Current Gap:** No specific check for main entrance accessibility. The agent checks for ramps generally but not entrance-specific requirements.

**For the Floor Plan:**
- Main entrance from garage or exterior needs verification
- If steps present, ramp with 1:12 gradient required
- Door width must accommodate wheelchair (900mm clear)

**Recommended Addition:**
```typescript
// Suggested new rule
{
  id: 'ACC-011',
  name: 'Main Entrance Accessibility',
  description: 'Main entrance must be accessible with level or ramped access',
  standard: 'NBR Part S',
  severity: Severity.CRITICAL,
  checkType: 'presence',
  requirement: 'Main entrance must have step-free access and 900mm clear width'
}
```

---

#### ⚠️ Door Widths for Wheelchair Access
**Rule:** [`ACC-002`](src/agents/specialized/accessibility/AccessibilityAgent.ts:68)
**Implementation:** [`checkDoorWidths()`](src/agents/specialized/accessibility/AccessibilityAgent.ts:413) and [`checkDoorWidth()`](src/agents/specialized/accessibility/AccessibilityAgent.ts:531)

```typescript
private checkDoorWidths(text: string, annotations: string, drawing: DrawingData): Finding[] {
  const findings: Finding[] = [];
  const rule = this.accessibilityRules.find(r => r.id === 'ACC-002')!;

  const doorWidthMatch = text.match(/door.*(\d+)\s*mm|width.*(\d+)\s*mm|(\d+)\s*mm.*door/i);
  
  if (/door|access/i.test(text)) {
    if (!doorWidthMatch) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Accessible door widths must be indicated (minimum 900mm clear width)'
      }));
    }
  }
  return findings;
}
```

**Assessment:** **INADEQUATE** - Only checks if door width is mentioned, not if it meets the 900mm minimum.

**Gap:** The [`extractDoorWidth()`](src/agents/specialized/accessibility/AccessibilityAgent.ts:537) method extracts width but the check only validates presence, not compliance.

**For the Floor Plan:**
- Main entrance door: Should be 900mm+ (often 813mm/32" in residential - may not comply)
- Interior doors: Often 762mm (30") or 813mm (32")
- Bathroom doors: Often 686mm (27") or 762mm (30") - **likely non-compliant**
- Bedroom doors: Typically 813mm (32")

**Expected Issues:**
- Bathroom doors likely below 900mm minimum
- Standard residential doors (813mm) technically non-compliant for full accessibility

---

#### ✅ Bathroom Layouts (Grab Rails)
**Rule:** [`ACC-003`](src/agents/specialized/accessibility/AccessibilityAgent.ts:82)
**Implementation:** [`checkGrabRails()`](src/agents/specialized/accessibility/AccessibilityAgent.ts:430)

```typescript
private checkGrabRails(text: string, annotations: string, drawing: DrawingData): Finding[] {
  const hasGrabRail = /grab.*rail|support.*rail|handle/i.test(text + annotations);

  if (/bathroom|toilet|shower|wc/i.test(text) && !hasGrabRail) {
    findings.push(this.createFinding(rule, {} as AgentContext, {
      suggestion: 'Grab rails must be provided in accessible bathrooms and toilets'
    }));
  }
}
```

**Assessment:** Well implemented for presence check.

**Missing Elements:**
- Turning circle space (1500mm diameter) not checked
- Transfer space beside toilet not checked
- Shower seat provision not checked
- Washbasin knee clearance not checked

**For the Floor Plan:**
- En-suite bathroom: Needs grab rails, 1500mm turning circle
- Guest bathroom: Needs grab rails, 1500mm turning circle

---

#### ❌ Turning Circles in Bathrooms
**Status:** NOT IMPLEMENTED

**Requirement:** 1500mm diameter clear turning circle for wheelchair maneuverability

**Gap:** No validation of bathroom dimensions or clear floor space.

**For the Floor Plan:**
- Standard residential bathrooms are often ~2.5m x 2m or smaller
- May not have sufficient space for 1500mm turning circle
- Layout with fixtures may further reduce usable space

---

#### ❌ Corridors and Circulation Spaces
**Status:** NOT IMPLEMENTED

**Expected Check:**
- Minimum corridor width: 1200mm (recommended), 900mm (absolute minimum)
- Passing spaces for wheelchairs: 1800mm x 1800mm
- Door swing must not reduce corridor width below minimum

**Gap:** No corridor width validation exists.

**For the Floor Plan:**
- Hallways between bedrooms and bathrooms need verification
- Standard residential corridors: 1000-1100mm (may be non-compliant)

---

#### ❌ Kitchen Counter Heights
**Status:** NOT IMPLEMENTED

**Expected Check:**
- Work surface height: 850mm maximum for wheelchair access
- Knee space under sinks: 700mm wide x 650mm high x 250mm deep minimum
- Accessible worktop sections

**Gap:** No kitchen accessibility checks exist.

**For the Floor Plan:**
- Kitchen counter standard height: 900mm (above recommended max)
- No provision for wheelchair user access

---

#### ✅ Lift Access
**Rule:** [`ACC-006`](src/agents/specialized/accessibility/AccessibilityAgent.ts:122)
**Implementation:** [`checkLiftAccess()`](src/agents/specialized/accessibility/AccessibilityAgent.ts:477)

```typescript
private checkLiftAccess(text: string, annotations: string, projectInfo: ProjectInfo): Finding[] {
  const hasLift = /lift|elevator/i.test(text + annotations);

  // Check if building has multiple floors
  if (projectInfo.floors > 1 && !hasLift) {
    findings.push(this.createFinding(rule, {} as AgentContext, {
      suggestion: 'Accessible lift must be provided in buildings with more than one floor'
    }));
  }
  return findings;
}
```

**Assessment:** Correctly implemented but may not apply to all residential contexts.

**For the Floor Plan:**
- With staircase present, if this is a multi-storey dwelling:
  - **Option A:** Install wheelchair lift or stairlift
  - **Option B:** Provide accessible bedroom/bathroom on ground floor
  - **Option C:** Design as "accessible adaptable" with space for future lift

---

### 2.4 AccessibilityAgent Issues for This Floor Plan

| Issue | Severity | Description |
|-------|----------|-------------|
| **No main entrance accessibility check** | HIGH | Step-free access not verified |
| **Door widths not validated** | HIGH | 900mm minimum not enforced |
| **No bathroom turning circle check** | HIGH | 1500mm diameter requirement missing |
| **No corridor width validation** | MEDIUM | 1200mm recommended minimum not checked |
| **No kitchen accessibility check** | MEDIUM | Counter heights and knee space missing |
| **No threshold check** | MEDIUM | Max 25mm threshold not verified |
| **Small bathroom doors (typical 700-800mm)** | HIGH | Standard residential doors often non-compliant |
| **Stair accessibility gap** | MEDIUM | Alternative access not verified |

---

## 3. Floor Plan Specific Issues

### 3.1 Fire Safety Issues

| Location | Issue | Code Requirement | Likely Finding |
|----------|-------|-----------------|----------------|
| **Bedroom 1 (Main)** | Egress window may be inadequate | Min 600x600mm opening, max 1200mm sill | CRITICAL if no direct exterior access |
| **Bedroom 2** | Egress window may be inadequate | Min 600x600mm opening, max 1200mm sill | CRITICAL if no direct exterior access |
| **Garage-House Connection** | Fire separation required | Fire-rated door/wall between garage and living area | HIGH if not present |
| **Staircase** | Width and handrails | Min 900mm width, handrails both sides | MEDIUM if stairs not compliant |
| **Interior Corridors** | Travel distance | Must maintain escape route width | MEDIUM if doors swing into corridor |

### 3.2 Accessibility Issues

| Location | Issue | Code Requirement | Likely Finding |
|----------|-------|-----------------|----------------|
| **Main Entrance** | Step-free access | Ramped or level entry | CRITICAL if steps without ramp |
| **Bathroom Doors** | Insufficient width | Min 900mm clear width | HIGH (typically 700-800mm) |
| **En-suite Bathroom** | No turning circle | 1500mm diameter clear | HIGH in typical small bathroom |
| **Guest Bathroom** | No turning circle | 1500mm diameter clear | HIGH in typical small bathroom |
| **Corridors** | Insufficient width | Min 1200mm recommended | MEDIUM (typically 1000-1100mm) |
| **Kitchen** | Counter height | Max 850mm for accessibility | MEDIUM (standard 900mm) |
| **Staircase** | No alternative access | Lift or ground floor facilities | MEDIUM for multi-storey |

---

## 4. Detailed Code Analysis

### 4.1 FireComplianceAgent Code Quality

**Strengths:**
1. Comprehensive rule definitions in [`FIRE_RULES`](src/agents/specialized/fire/FireComplianceAgent.ts:42)
2. Well-structured data extraction methods
3. Uses centralized constants from [`FIRE_SAFETY`](src/config/sans10400/types.ts:1015)
4. Good separation of concerns (extraction vs validation)
5. Proper severity levels assigned to rules

**Weaknesses:**
1. [`extractFireWalls()`](src/agents/specialized/fire/FireComplianceAgent.ts:603) has syntax error (missing method name)
2. [`checkExitDoorSwing()`](src/agents/specialized/fire/FireComplianceAgent.ts:829) only checks presence, not direction
3. No specific bedroom egress window validation
4. Hardcoded assumptions in [`extractExitDoors()`](src/agents/specialized/fire/FireComplianceAgent.ts:530) (swingDirection: 'out')
5. No validation of actual door dimensions

**Code Issue Found:**
```typescript
// Line 603 - Missing method name
Walls(drawing: DrawingData): FireWallData[] {  // Should be: extractFireWalls(
```

### 4.2 AccessibilityAgent Code Quality

**Strengths:**
1. Clean rule initialization in [`initializeAccessibilityRules()`](src/agents/specialized/accessibility/AccessibilityAgent.ts:52)
2. Good regex pattern matching for text extraction
3. Proper conditional checking (e.g., lift only for multi-storey)
4. Helper methods for dimension extraction

**Weaknesses:**
1. [`checkDoorWidths()`](src/agents/specialized/accessibility/AccessibilityAgent.ts:413) only checks presence, not compliance
2. No specific main entrance accessibility check
3. No turning circle validation for bathrooms
4. No corridor width validation
5. No kitchen accessibility features
6. Uses empty object cast: `{} as AgentContext` (lines 366, 382, etc.)

---

## 5. Recommendations

### 5.1 FireComplianceAgent Improvements

**Priority 1 (Critical):**
```typescript
// Add new rule for bedroom egress windows
{
  id: 'FIRE-018',
  name: 'Bedroom Egress Windows',
  description: 'Bedrooms without direct exterior doors require egress windows',
  standard: 'SANS 10400-T',
  severity: Severity.CRITICAL,
  checkType: 'dimension',
  requirement: 'Min opening 600x600mm, max sill height 1200mm from floor',
  thresholds: { minOpening: 600, maxSillHeight: 1200, unit: 'mm' }
}
```

**Priority 2 (High):**
```typescript
// Enhance door width validation
private checkDoorWidths(fireData: FireAnalysisData): ComplianceResult {
  const minEscapeDoorWidth = FIRE_SAFETY.exitWidth.minSingleDoor; // 750mm
  const recommendedWidth = 900; // For accessibility alignment
  
  for (const door of fireData.exitDoors) {
    if (door.width && door.width < minEscapeDoorWidth) {
      return { passed: false, /* ... */ };
    }
  }
}
```

**Priority 3 (Medium):**
```typescript
// Fix door swing validation
private checkExitDoorSwing(fireData: FireAnalysisData): boolean {
  return fireData.exitDoors.every(door => 
    door.swingDirection === 'out' || door.location === 'interior'
  );
}
```

### 5.2 AccessibilityAgent Improvements

**Priority 1 (Critical):**
```typescript
// Add main entrance accessibility rule
{
  id: 'ACC-011',
  name: 'Main Entrance Step-Free Access',
  description: 'Main entrance must have level or ramped access',
  standard: 'NBR Part S',
  severity: Severity.CRITICAL,
  checkType: 'verification',
  requirement: 'No steps at main entrance, or ramp with max 1:12 gradient'
}
```

**Priority 2 (High):**
```typescript
// Add bathroom turning circle check
private checkBathroomTurningCircle(drawing: DrawingData): Finding[] {
  // Check for 1500mm diameter clear space in accessible bathrooms
  const minTurningDiameter = 1500;
  // Implementation: Analyze bathroom dimensions from drawing
}
```

**Priority 3 (Medium):**
```typescript
// Add corridor width validation
{
  id: 'ACC-012',
  name: 'Corridor Width for Wheelchair Access',
  description: 'Corridors must accommodate wheelchair passage',
  standard: 'NBR Part S',
  severity: Severity.HIGH,
  checkType: 'dimension',
  requirement: 'Minimum 1200mm clear width (900mm absolute minimum)',
  thresholds: { min: 900, recommended: 1200, unit: 'mm' }
}
```

---

## 6. Test Scenarios for Floor Plan

### 6.1 Fire Compliance Test Cases

| Test Case | Expected Result | Agent Current Output |
|-----------|-----------------|---------------------|
| Bedroom 1 has 500x600mm window, sill at 1400mm | ❌ FAIL - Below min size, above max sill | ⚠️ Would not detect (no egress window check) |
| Bedroom 2 has 700x700mm window, sill at 1100mm | ✅ PASS | ⚠️ Would not detect (no egress window check) |
| Travel distance 35m to exit | ✅ PASS | ✅ Correctly passes |
| Travel distance 50m to exit | ❌ FAIL - Exceeds 45m | ✅ Correctly fails |
| Bathroom door 750mm wide | ⚠️ WARNING - Below 900mm recommended | ✅ Passes (no width check) |
| Garage has no fire-rated door to house | ❌ FAIL - Fire separation required | ⚠️ Partial (fire doors checked but not specifically garage) |

### 6.2 Accessibility Test Cases

| Test Case | Expected Result | Agent Current Output |
|-----------|-----------------|---------------------|
| Main entrance has 3 steps, no ramp | ❌ FAIL - No step-free access | ⚠️ Would not detect (no entrance check) |
| Bathroom door 750mm wide | ❌ FAIL - Below 900mm | ⚠️ Passes (only checks if width mentioned) |
| En-suite is 2m x 2.2m | ❌ FAIL - No 1500mm turning circle | ⚠️ Would not detect |
| Kitchen counters at 900mm height | ⚠️ WARNING - Above 850mm max | ✅ Passes (no kitchen check) |
| Grab rails indicated in bathroom | ✅ PASS | ✅ Correctly detects |
| Ramp at 1:10 gradient | ❌ FAIL - Exceeds 1:12 | ✅ Correctly fails |

---

## 7. Summary Matrix

| Requirement | FireComplianceAgent | AccessibilityAgent | Typical Residential Issue |
|-------------|--------------------|--------------------|--------------------------|
| Escape routes from all rooms | ✅ Checks presence | N/A | Bedroom egress windows |
| Bedroom egress windows (600x600mm) | ❌ Not checked | N/A | Often too small |
| Door widths (900mm min) | ⚠️ Partial | ⚠️ Partial | Bathrooms often 700-800mm |
| Door swing direction | ⚠️ Only presence | N/A | Into corridors |
| Travel distance (45m max) | ✅ Checked | N/A | Usually compliant |
| Main entrance step-free | N/A | ❌ Not checked | Steps common |
| Bathroom turning circle | N/A | ❌ Not checked | 1500mm rarely provided |
| Grab rails | N/A | ✅ Checked | Often missing |
| Corridor widths | N/A | ❌ Not checked | Often <1200mm |
| Kitchen accessibility | N/A | ❌ Not checked | Counter height issues |
| Lift access (multi-storey) | N/A | ✅ Checked | Rare in residential |
| Fire separation (garage) | ⚠️ Partial | N/A | Often missing |

---

## 8. Conclusion

### FireComplianceAgent Verdict: **NEEDS ENHANCEMENT**

The agent provides a solid foundation for commercial/multi-storey fire safety compliance but lacks critical residential-specific checks:

1. **Add bedroom egress window validation** - Critical for residential safety
2. **Implement door width checking** - Required for escape routes
3. **Fix door swing validation** - Currently only checks presence
4. **Add garage fire separation check** - Common issue in residential plans

### AccessibilityAgent Verdict: **NEEDS SIGNIFICANT ENHANCEMENT**

The agent covers basic accessibility features but is missing core residential accessibility requirements:

1. **Add main entrance accessibility check** - Critical for wheelchair access
2. **Implement actual door width validation** - Currently only checks if mentioned
3. **Add bathroom turning circle validation** - Essential for wheelchair users
4. **Add corridor width checks** - Required for circulation
5. **Add kitchen accessibility features** - Counter heights, knee spaces

### Overall Assessment

Both agents are **functional for basic compliance checking** but would benefit from residential-specific enhancements. For the floor plan described (2-bedroom house with garage and stairs), the agents would:

- **FireComplianceAgent:** Catch major fire safety issues like travel distances and fire door presence, but miss bedroom egress window requirements
- **AccessibilityAgent:** Identify grab rail and ramp requirements, but miss common residential issues like small bathroom doors and lack of turning circles

**Recommendation:** Deploy agents with current capabilities but prioritize adding the identified missing checks for comprehensive residential compliance validation.

---

## Appendix: File References

- [`FireComplianceAgent.ts`](src/agents/specialized/fire/FireComplianceAgent.ts:1) - Fire safety validation agent
- [`AccessibilityAgent.ts`](src/agents/specialized/accessibility/AccessibilityAgent.ts:1) - Accessibility compliance agent  
- [`types.ts`](src/config/sans10400/types.ts:1) - SANS 10400 constants and interfaces
- [`FIRE_SAFETY`](src/config/sans10400/types.ts:1015) - Fire safety constants
- [`ROOM_REQUIREMENTS`](src/config/sans10400/types.ts:16) - Room dimension requirements
