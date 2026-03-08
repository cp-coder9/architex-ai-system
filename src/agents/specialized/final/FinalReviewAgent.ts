/**
 * Final Review Agent
 * 
 * Performs comprehensive final check of all compliance results:
 * - All previous findings resolved
 * - Cross-references between drawings
 * - Coordination between disciplines
 * - Specification consistency
 * - Title block complete
 * - Drawing index accurate
 * - Quality control checklist
 * - Professional sign-off blocks
 * - Submission completeness
 * - Final documentation
 */

import { Agent } from '../../base/Agent';
import {
  AgentConfig,
  AgentResult,
  AgentContext,
  ComplianceRule,
  ComplianceResult,
  DrawingData,
  ProjectInfo,
  Finding,
  Severity,
  _DrawingType,
  AgentResult as _PreviousAgentResult
} from '@/types/agent';

export class FinalReviewAgent extends Agent {
  private finalReviewRules: ComplianceRule[];

  constructor(config: AgentConfig) {
    super(config);
    this.finalReviewRules = this.initializeFinalReviewRules();
  }

  /**
   * Get rule IDs for this agent
   */
  getRuleIds(): string[] {
    return [
      'FIN-001', 'FIN-002', 'FIN-003', 'FIN-004', 'FIN-005',
      'FIN-006', 'FIN-007', 'FIN-008', 'FIN-009', 'FIN-010'
    ];
  }

  /**
   * Initialize final review rules
   */
  private initializeFinalReviewRules(): ComplianceRule[] {
    return [
      {
        id: 'FIN-001',
        name: 'All Previous Findings Resolved',
        description: 'All compliance findings from previous checks must be resolved',
        standard: 'Final Review',
        category: 'final',
        severity: Severity.CRITICAL,
        checkType: 'verification',
        requirement: 'All critical and high severity findings must be resolved before submission',
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'FIN-002',
        name: 'Cross-References Between Drawings',
        description: 'Drawings must have proper cross-references',
        standard: 'Final Review',
        category: 'final',
        severity: Severity.MEDIUM,
        checkType: 'verification',
        requirement: 'Drawings must reference related drawings (e.g., Section A-A references Floor Plan)',
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'FIN-003',
        name: 'Coordination Between Disciplines',
        description: 'All discipline drawings must be coordinated',
        standard: 'Final Review',
        category: 'final',
        severity: Severity.HIGH,
        checkType: 'verification',
        requirement: 'Architectural, structural, and MEP drawings must be coordinated',
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'FIN-004',
        name: 'Specification Consistency',
        description: 'Specifications must be consistent across all documents',
        standard: 'Final Review',
        category: 'final',
        severity: Severity.HIGH,
        checkType: 'verification',
        requirement: 'Material specifications in drawings must match specifications document',
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'FIN-005',
        name: 'Title Block Complete',
        description: 'Title blocks must contain all required information',
        standard: 'Final Review',
        category: 'final',
        severity: Severity.MEDIUM,
        checkType: 'presence',
        requirement: 'Title blocks must include: project name, drawing title, scale, date, revision, architect/engineer',
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'FIN-006',
        name: 'Drawing Index Accurate',
        description: 'Drawing index must be complete and accurate',
        standard: 'Final Review',
        category: 'final',
        severity: Severity.MEDIUM,
        checkType: 'verification',
        requirement: 'Drawing index/list must match actual submitted drawings',
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'FIN-007',
        name: 'Quality Control Checklist',
        description: 'Quality control checklist must be completed',
        standard: 'Final Review',
        category: 'final',
        severity: Severity.HIGH,
        checkType: 'document',
        requirement: 'QC checklist must be completed for all disciplines',
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'FIN-008',
        name: 'Professional Sign-off Blocks',
        description: 'Professional sign-off blocks must be present',
        standard: 'Final Review',
        category: 'final',
        severity: Severity.HIGH,
        checkType: 'presence',
        requirement: 'Professional registration blocks must be signed by SACAP/ECSA registered professionals',
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'FIN-009',
        name: 'Submission Completeness',
        description: 'Submission must include all required documents',
        standard: 'Final Review',
        category: 'final',
        severity: Severity.CRITICAL,
        checkType: 'verification',
        requirement: 'All required drawings and documents must be included in submission',
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      },
      {
        id: 'FIN-010',
        name: 'Final Documentation',
        description: 'All final documentation must be in order',
        standard: 'Final Review',
        category: 'final',
        severity: Severity.MEDIUM,
        checkType: 'document',
        requirement: 'Owner/architect agreement, fees, and other administrative docs must be complete',
        lastUpdated: new Date('2024-01-01'),
        version: '1.0',
        isActive: true
      }
    ];
  }

  /**
   * Analyze drawings for final review
   */
  async analyze(drawing: DrawingData, _projectInfo: ProjectInfo): Promise<AgentResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];
    const passedRules: string[] = [];
    const failedRules: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // Analyze text content
      const textContent = drawing.textElements.map(t => t.content.toLowerCase()).join(' ');
      const annotations = drawing.annotations.map(a => a.content.toLowerCase()).join(' ');

      // Check previous findings (would need previous results from context)
      findings.push(...this.checkPreviousFindings(textContent, annotations));

      // Check cross-references
      findings.push(...this.checkCrossReferences(textContent, annotations, drawing));

      // Check discipline coordination
      findings.push(...this.checkDisciplineCoordination(textContent, annotations));

      // Check specification consistency
      findings.push(...this.checkSpecificationConsistency(textContent, annotations));

      // Check title block
      findings.push(...this.checkTitleBlockContent(textContent, annotations));

      // Check drawing index
      findings.push(...this.checkDrawingIndex(textContent, annotations));

      // Check QC checklist
      findings.push(...this.checkQualityControl(textContent, annotations));

      // Check sign-off blocks
      findings.push(...this.checkSignOffBlocks(textContent, annotations));

      // Check submission completeness
      findings.push(...this.checkSubmissionCompleteness(textContent, annotations));

      // Check final documentation
      findings.push(...this.checkFinalDocumentation(textContent, annotations));

      // Categorize findings
      for (const finding of findings) {
        if (finding.isResolved) {
          passedRules.push(finding.ruleId);
        } else {
          failedRules.push(finding.ruleId);
        }
      }

      // Calculate compliance score
      const totalRules = this.getRuleIds().length;
      const passed = findings.filter(f => f.isResolved).length;
      const complianceScore = Math.round((passed / totalRules) * 100);

      return {
        agentId: this.id,
        agentName: this.name,
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
        errors
      };
    } catch (error) {
      return {
        agentId: this.id,
        agentName: this.name,
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
        errors: [...errors, error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Evaluate a single rule
   */
  protected async evaluateRule(
    rule: ComplianceRule,
    context: AgentContext
  ): Promise<ComplianceResult> {
    const textContent = context.drawing.textElements
      .map(t => t.content.toLowerCase())
      .join(' ');

    const annotations = context.drawing.annotations
      .map(a => a.content.toLowerCase())
      .join(' ');

    const combinedText = textContent + ' ' + annotations;

    let passed = false;

    switch (rule.id) {
      case 'FIN-001':
        passed = this.checkFindingsResolved(combinedText);
        break;
      case 'FIN-002':
        passed = this.checkCrossRefs(combinedText);
        break;
      case 'FIN-003':
        passed = this.checkCoordination(combinedText);
        break;
      case 'FIN-004':
        passed = this.checkSpecs(combinedText);
        break;
      case 'FIN-005':
        passed = this.checkTitleBlock(combinedText);
        break;
      case 'FIN-006':
        passed = this.checkIndex(combinedText);
        break;
      case 'FIN-007':
        passed = this.checkQC(combinedText);
        break;
      case 'FIN-008':
        passed = this.checkSignoff(combinedText);
        break;
      case 'FIN-009':
        passed = this.checkSubmission(combinedText);
        break;
      case 'FIN-010':
        passed = this.checkDocs(combinedText);
        break;
      default:
        passed = false;
    }

    return {
      rule,
      passed,
      finding: passed ? undefined : this.createFinding(rule, context),
      timestamp: new Date()
    };
  }

  // ==========================================================================
  // Rule Check Methods
  // ==========================================================================

  private checkPreviousFindings(text: string, annotations: string): Finding[] {
    const findings: Finding[] = [];
    const rule = this.finalReviewRules.find(r => r.id === 'FIN-001')!;

    // Check for any unresolved issue markers
    const hasIssues = /unresolved|outstanding|pending|not resolved|not approved/i.test(text + annotations);

    if (hasIssues) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'All previous findings must be resolved before final submission'
      }));
    }

    return findings;
  }

  private checkCrossReferences(text: string, annotations: string, _drawing: DrawingData): Finding[] {
    const findings: Finding[] = [];
    const rule = this.finalReviewRules.find(r => r.id === 'FIN-002')!;

    // Check for drawing reference patterns
    const hasRefs = /see.*draw|reference.*draw|shown.*on|refer.*to/i.test(text + annotations);

    if (!hasRefs) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Drawings should have cross-references to related drawings'
      }));
    }

    return findings;
  }

  private checkDisciplineCoordination(text: string, annotations: string): Finding[] {
    const findings: Finding[] = [];
    const rule = this.finalReviewRules.find(r => r.id === 'FIN-003')!;

    // Check for coordination notes
    const hasCoordination = /coordination|coordinated|reviewed by|checked by/i.test(text + annotations);

    if (!hasCoordination) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Coordination between disciplines (architectural, structural, MEP) must be documented'
      }));
    }

    return findings;
  }

  private checkSpecificationConsistency(text: string, annotations: string): Finding[] {
    const findings: Finding[] = [];
    const rule = this.finalReviewRules.find(r => r.id === 'FIN-004')!;

    // Check for spec references
    const hasSpecs = /specification|spec|material.*schedule|schedule.*materials/i.test(text + annotations);

    if (!hasSpecs) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Specifications should be consistent with material schedules'
      }));
    }

    return findings;
  }

  private checkTitleBlockContent(text: string, _annotations: string): Finding[] {
    const findings: Finding[] = [];
    const rule = this.finalReviewRules.find(r => r.id === 'FIN-005')!;

    // Check for title block elements
    const hasProjectName = /project|job/i.test(text);
    const hasDate = /date|rev|revision/i.test(text);
    const hasScale = /scale/i.test(text);

    if (!hasProjectName || !hasDate || !hasScale) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Title block must include: project name, date, revision, and scale'
      }));
    }

    return findings;
  }

  private checkDrawingIndex(text: string, annotations: string): Finding[] {
    const findings: Finding[] = [];
    const rule = this.finalReviewRules.find(r => r.id === 'FIN-006')!;

    // Check for index references
    const hasIndex = /index|drawing.*list|schedule.*drawings/i.test(text + annotations);

    if (!hasIndex && text.length > 500) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Drawing index must be accurate and match submitted drawings'
      }));
    }

    return findings;
  }

  private checkQualityControl(text: string, annotations: string): Finding[] {
    const findings: Finding[] = [];
    const rule = this.finalReviewRules.find(r => r.id === 'FIN-007')!;

    // Check for QC markers
    const hasQC = /qc|quality|checked|approved|checked by|reviewed/i.test(text + annotations);

    if (!hasQC) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Quality control checklist must be completed'
      }));
    }

    return findings;
  }

  private checkSignOffBlocks(text: string, annotations: string): Finding[] {
    const findings: Finding[] = [];
    const rule = this.finalReviewRules.find(r => r.id === 'FIN-008')!;

    // Check for professional sign-off
    const hasSignOff = /signed|signature|professional|architect|engineer|registered/i.test(text + annotations);

    if (!hasSignOff) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Professional sign-off blocks must be present for SACAP/ECSA registered professionals'
      }));
    }

    return findings;
  }

  private checkSubmissionCompleteness(text: string, annotations: string): Finding[] {
    const findings: Finding[] = [];
    const rule = this.finalReviewRules.find(r => r.id === 'FIN-009')!;

    // Check for submission-related content
    const hasSubmission = /submission|submit|complete|final/i.test(text + annotations);

    if (!hasSubmission) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Verify submission includes all required documents'
      }));
    }

    return findings;
  }

  private checkFinalDocumentation(text: string, annotations: string): Finding[] {
    const findings: Finding[] = [];
    const rule = this.finalReviewRules.find(r => r.id === 'FIN-010')!;

    // Check for administrative content
    const hasAdmin = /owner|client|agreement|fees|admin/i.test(text + annotations);

    if (!hasAdmin) {
      findings.push(this.createFinding(rule, {} as AgentContext, {
        suggestion: 'Final documentation including owner agreement should be in order'
      }));
    }

    return findings;
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private checkFindingsResolved(text: string): boolean {
    return !/unresolved|outstanding|pending.*issue/i.test(text);
  }

  private checkCrossRefs(text: string): boolean {
    return /see.*draw|reference|refer.*to/i.test(text);
  }

  private checkCoordination(text: string): boolean {
    return /coordination|coordinated|reviewed/i.test(text);
  }

  private checkSpecs(text: string): boolean {
    return /specification|spec|material/i.test(text);
  }

  private checkTitleBlock(text: string): boolean {
    return /project.*name|date|scale|rev/i.test(text);
  }

  private checkIndex(text: string): boolean {
    return /index|drawing.*list/i.test(text);
  }

  private checkQC(text: string): boolean {
    return /qc|quality|checked|approved/i.test(text);
  }

  private checkSignoff(text: string): boolean {
    return /signed|signature|professional/i.test(text);
  }

  private checkSubmission(text: string): boolean {
    return /submission|submit|complete/i.test(text);
  }

  private checkDocs(text: string): boolean {
    return /owner|client|agreement/i.test(text);
  }
}

export default FinalReviewAgent;
