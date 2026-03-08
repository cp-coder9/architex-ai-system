/**
 * Reporting Service
 * 
 * Compliance reporting:
 * - Generate PDF reports
 * - Summary statistics
 * - Finding categorization
 * - Recommendation generation
 * - Export functionality
 */

import { Finding, Severity, AgentResult } from '@/types/agent';

/**
 * Report types
 */
export enum ReportType {
  COMPLIANCE_SUMMARY = 'compliance_summary',
  DETAILED_FINDINGS = 'detailed_findings',
  PROJECT_REPORT = 'project_report',
  AGENT_PERFORMANCE = 'agent_performance',
  EXECUTIVE_SUMMARY = 'executive_summary'
}

/**
 * Report format
 */
export enum ReportFormat {
  JSON = 'json',
  CSV = 'csv',
  HTML = 'html',
  PDF = 'pdf'
}

/**
 * Report configuration
 */
export interface ReportConfig {
  title: string;
  projectId: string;
  projectName: string;
  generatedAt: Date;
  generatedBy?: string;
  includeCharts?: boolean;
  includeRecommendations?: boolean;
  minSeverity?: Severity;
}

/**
 * Compliance summary
 */
export interface ComplianceSummary {
  totalDrawings: number;
  totalFindings: number;
  findingsBySeverity: Record<Severity, number>;
  findingsByStandard: Record<string, number>;
  findingsByCategory: Record<string, number>;
  complianceScore: number;
  resolvedFindings: number;
  unresolvedFindings: number;
  criticalIssues: Finding[];
  highPriorityIssues: Finding[];
}

/**
 * Finding category
 */
export interface FindingCategory {
  category: string;
  count: number;
  severity: Severity;
  findings: Finding[];
  recommendations: string[];
}

/**
 * Report data
 */
export interface ReportData {
  config: ReportConfig;
  summary: ComplianceSummary;
  categories: FindingCategory[];
  recommendations: string[];
  findings: Finding[];
  agentResults?: AgentResult[];
  charts?: ChartData[];
}

/**
 * Chart data for reports
 */
export interface ChartData {
  type: 'pie' | 'bar' | 'line';
  title: string;
  labels: string[];
  values: number[];
  colors?: string[];
}

/**
 * Reporting Service class
 */
export class ReportingService {
  private defaultConfig: Partial<ReportConfig> = {
    includeCharts: true,
    includeRecommendations: true,
    minSeverity: Severity.LOW
  };

  /**
   * Generate a compliance report
   */
  generateReport(
    findings: Finding[],
    agentResults: AgentResult[],
    config: ReportConfig
  ): ReportData {
    const mergedConfig = { ...this.defaultConfig, ...config };
    
    // Calculate summary
    const summary = this.calculateSummary(findings);
    
    // Categorize findings
    const categories = this.categorizeFindings(findings);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(findings, categories);
    
    // Generate charts if enabled
    const charts = mergedConfig.includeCharts 
      ? this.generateCharts(findings, summary)
      : [];

    // Filter findings by severity
    const filteredFindings = this.filterFindings(findings, mergedConfig.minSeverity);

    return {
      config: mergedConfig as ReportConfig,
      summary,
      categories,
      recommendations,
      findings: filteredFindings,
      agentResults,
      charts
    };
  }

  /**
   * Generate executive summary report
   */
  generateExecutiveSummary(
    findings: Finding[],
    projectInfo: { name: string; id: string }
  ): {
    title: string;
    projectName: string;
    overallScore: number;
    totalFindings: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    keyFindings: Finding[];
    recommendations: string[];
  } {
    const summary = this.calculateSummary(findings);
    
    // Get key findings (critical and high)
    const keyFindings = findings
      .filter(f => f.severity === Severity.CRITICAL || f.severity === Severity.HIGH)
      .slice(0, 5);

    // Generate top recommendations
    const recommendations = this.generateTopRecommendations(findings);

    return {
      title: 'Executive Compliance Summary',
      projectName: projectInfo.name,
      overallScore: summary.complianceScore,
      totalFindings: summary.totalFindings,
      criticalCount: summary.findingsBySeverity[Severity.CRITICAL] || 0,
      highCount: summary.findingsBySeverity[Severity.HIGH] || 0,
      mediumCount: summary.findingsBySeverity[Severity.MEDIUM] || 0,
      lowCount: summary.findingsBySeverity[Severity.LOW] || 0,
      keyFindings,
      recommendations
    };
  }

  /**
   * Export report to JSON
   */
  exportToJSON(reportData: ReportData): string {
    return JSON.stringify(reportData, null, 2);
  }

  /**
   * Export report to CSV
   */
  exportToCSV(findings: Finding[]): string {
    const headers = [
      'ID', 'Rule ID', 'Rule Name', 'Standard', 'Severity', 
      'Title', 'Description', 'Is Resolved', 'Resolved By', 
      'Resolved At', 'Suggestion'
    ];

    const rows = findings.map(f => [
      f.id,
      f.ruleId,
      f.ruleName,
      f.standard,
      f.severity,
      f.title.replace(/"/g, '""'),
      f.description.replace(/"/g, '""'),
      f.isResolved ? 'Yes' : 'No',
      f.resolvedBy || '',
      f.resolvedAt?.toISOString() || '',
      f.suggestion?.replace(/"/g, '""') || ''
    ]);

    return [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
  }

  /**
   * Export report to HTML
   */
  exportToHTML(reportData: ReportData): string {
    const { config, summary, _categories, recommendations, findings } = reportData;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        h1 { color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 10px; }
        h2 { color: #2c5282; margin-top: 30px; }
        .summary { background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .score { font-size: 48px; font-weight: bold; color: ${this.getScoreColor(summary.complianceScore)}; }
        .finding { background: white; border-left: 4px solid ${this.getSeverityColor(Severity.CRITICAL)}; padding: 15px; margin: 10px 0; border-radius: 4px; }
        .severity-critical { border-color: #e53e3e; }
        .severity-high { border-color: #dd6b20; }
        .severity-medium { border-color: #d69e2e; }
        .severity-low { border-color: #38a169; }
        .resolved { text-decoration: line-through; opacity: 0.7; }
        .recommendations { background: #ebf8ff; padding: 20px; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #edf2f7; font-weight: bold; }
    </style>
</head>
<body>
    <h1>${config.title}</h1>
    <p><strong>Project:</strong> ${config.projectName}</p>
    <p><strong>Generated:</strong> ${config.generatedAt.toLocaleDateString()}</p>
    
    <div class="summary">
        <h2>Compliance Summary</h2>
        <div class="score">${summary.complianceScore}%</div>
        <p>Total Findings: ${summary.totalFindings}</p>
        <p>Resolved: ${summary.resolvedFindings} | Unresolved: ${summary.unresolvedFindings}</p>
        <table>
            <tr><th>Severity</th><th>Count</th></tr>
            <tr><td>Critical</td><td>${summary.findingsBySeverity[Severity.CRITICAL] || 0}</td></tr>
            <tr><td>High</td><td>${summary.findingsBySeverity[Severity.HIGH] || 0}</td></tr>
            <tr><td>Medium</td><td>${summary.findingsBySeverity[Severity.MEDIUM] || 0}</td></tr>
            <tr><td>Low</td><td>${summary.findingsBySeverity[Severity.LOW] || 0}</td></tr>
        </table>
    </div>

    ${config.includeRecommendations ? `
    <div class="recommendations">
        <h2>Recommendations</h2>
        <ul>
            ${recommendations.slice(0, 10).map(r => `<li>${r}</li>`).join('')}
        </ul>
    </div>
    ` : ''}

    <h2>Findings (${findings.length})</h2>
    ${findings.map(f => `
        <div class="finding severity-${f.severity} ${f.isResolved ? 'resolved' : ''}">
            <h3>${f.title} <small>(${f.ruleId})</small></h3>
            <p><strong>Standard:</strong> ${f.standard}</p>
            <p><strong>Severity:</strong> ${f.severity.toUpperCase()}</p>
            <p>${f.description}</p>
            ${f.suggestion ? `<p><strong>Suggestion:</strong> ${f.suggestion}</p>` : ''}
            ${f.isResolved ? `<p><em>Resolved</em></p>` : ''}
        </div>
    `).join('')}

    <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096;">
        <p>Generated by SANS 10400 Compliance System</p>
    </footer>
</body>
</html>
    `.trim();
  }

  /**
   * Get findings by category
   */
  getFindingsByCategory(findings: Finding[]): Record<string, Finding[]> {
    const categorized: Record<string, Finding[]> = {};
    
    for (const finding of findings) {
      const category = this.getCategoryFromRule(finding.ruleId);
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(finding);
    }
    
    return categorized;
  }

  /**
   * Calculate compliance trends
   */
  calculateTrends(
    historicalResults: { date: Date; score: number }[]
  ): {
    trend: 'improving' | 'declining' | 'stable';
    change: number;
    averageScore: number;
  } {
    if (historicalResults.length < 2) {
      return { trend: 'stable', change: 0, averageScore: historicalResults[0]?.score || 0 };
    }

    const scores = historicalResults.map(r => r.score);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    // Simple linear regression for trend
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const change = secondAvg - firstAvg;
    
    let trend: 'improving' | 'declining' | 'stable';
    if (change > 5) {
      trend = 'improving';
    } else if (change < -5) {
      trend = 'declining';
    } else {
      trend = 'stable';
    }

    return { trend, change: Math.round(change), averageScore: Math.round(averageScore) };
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private calculateSummary(findings: Finding[]): ComplianceSummary {
    const findingsBySeverity: Record<Severity, number> = {
      [Severity.CRITICAL]: 0,
      [Severity.HIGH]: 0,
      [Severity.MEDIUM]: 0,
      [Severity.LOW]: 0
    };

    const findingsByStandard: Record<string, number> = {};
    const findingsByCategory: Record<string, number> = {};

    let resolvedCount = 0;
    const criticalIssues: Finding[] = [];
    const highPriorityIssues: Finding[] = [];

    for (const finding of findings) {
      // Count by severity
      findingsBySeverity[finding.severity]++;
      
      // Count by standard
      findingsByStandard[finding.standard] = (findingsByStandard[finding.standard] || 0) + 1;
      
      // Count by category
      const category = this.getCategoryFromRule(finding.ruleId);
      findingsByCategory[category] = (findingsByCategory[category] || 0) + 1;

      // Track resolved
      if (finding.isResolved) {
        resolvedCount++;
      }

      // Track critical and high
      if (finding.severity === Severity.CRITICAL) {
        criticalIssues.push(finding);
      } else if (finding.severity === Severity.HIGH) {
        highPriorityIssues.push(finding);
      }
    }

    const totalFindings = findings.length;
    const unresolvedCount = totalFindings - resolvedCount;
    const complianceScore = totalFindings > 0 
      ? Math.round((resolvedCount / (resolvedCount + unresolvedCount)) * 100)
      : 100;

    return {
      totalDrawings: 0, // Would be calculated from agent results
      totalFindings,
      findingsBySeverity,
      findingsByStandard,
      findingsByCategory,
      complianceScore,
      resolvedFindings: resolvedCount,
      unresolvedFindings: unresolvedCount,
      criticalIssues,
      highPriorityIssues
    };
  }

  private categorizeFindings(findings: Finding[]): FindingCategory[] {
    const categoryMap = this.getFindingsByCategory(findings);
    const categories: FindingCategory[] = [];

    for (const [category, categoryFindings] of Object.entries(categoryMap)) {
      // Determine dominant severity
      const severities = categoryFindings.map(f => f.severity);
      const dominantSeverity = severities.includes(Severity.CRITICAL) 
        ? Severity.CRITICAL 
        : severities.includes(Severity.HIGH) 
          ? Severity.HIGH 
          : severities.includes(Severity.MEDIUM)
            ? Severity.MEDIUM
            : Severity.LOW;

      categories.push({
        category,
        count: categoryFindings.length,
        severity: dominantSeverity,
        findings: categoryFindings,
        recommendations: this.getCategoryRecommendations(category, categoryFindings)
      });
    }

    return categories.sort((a, b) => 
      this.getSeverityOrder(a.severity) - this.getSeverityOrder(b.severity)
    );
  }

  private generateRecommendations(
    findings: Finding[],
    categories: FindingCategory[]
  ): string[] {
    const recommendations: string[] = [];

    // Critical issues recommendations
    const criticalFindings = findings.filter(f => f.severity === Severity.CRITICAL);
    if (criticalFindings.length > 0) {
      recommendations.push(
        `Address ${criticalFindings.length} critical compliance issue(s) immediately before submission`
      );
    }

    // High priority recommendations
    const highFindings = findings.filter(f => f.severity === Severity.HIGH);
    if (highFindings.length > 0) {
      recommendations.push(
        `Resolve ${highFindings.length} high priority compliance issues to achieve full compliance`
      );
    }

    // Category-specific recommendations
    for (const category of categories) {
      if (category.count >= 3) {
        recommendations.push(...category.recommendations.slice(0, 2));
      }
    }

    // General recommendations
    const unresolvedCount = findings.filter(f => !f.isResolved).length;
    if (unresolvedCount > 0) {
      recommendations.push(
        'Review all unresolved findings and either address them or provide documented justifications'
      );
    }

    return recommendations;
  }

  private generateTopRecommendations(findings: Finding[]): string[] {
    const recommendations: string[] = [];
    
    // Critical issues
    const critical = findings.filter(f => f.severity === Severity.CRITICAL);
    if (critical.length > 0) {
      recommendations.push(
        `URGENT: Address ${critical.length} critical issue(s) that may prevent approval`
      );
    }

    // Unresolved findings
    const unresolved = findings.filter(f => !f.isResolved);
    if (unresolved.length > 5) {
      recommendations.push(
        `Complete resolution of ${unresolved.length} remaining findings before final submission`
      );
    }

    // Common issues
    const standards = Object.entries(
      findings.reduce((acc, f) => {
        acc[f.standard] = (acc[f.standard] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    );
    
    if (standards.length > 0) {
      recommendations.push(
        `Focus compliance efforts on ${standards[0][0]} (${standards[0][1]} findings)`
      );
    }

    return recommendations;
  }

  private generateCharts(
    findings: Finding[],
    summary: ComplianceSummary
  ): ChartData[] {
    const charts: ChartData[] = [];

    // Severity distribution pie chart
    charts.push({
      type: 'pie',
      title: 'Findings by Severity',
      labels: ['Critical', 'High', 'Medium', 'Low'],
      values: [
        summary.findingsBySeverity[Severity.CRITICAL] || 0,
        summary.findingsBySeverity[Severity.HIGH] || 0,
        summary.findingsBySeverity[Severity.MEDIUM] || 0,
        summary.findingsBySeverity[Severity.LOW] || 0
      ],
      colors: ['#e53e3e', '#dd6b20', '#d69e2e', '#38a169']
    });

    // Standards distribution bar chart
    const standards = Object.entries(summary.findingsByStandard);
    if (standards.length > 0) {
      charts.push({
        type: 'bar',
        title: 'Findings by Standard',
        labels: standards.map(s => s[0]),
        values: standards.map(s => s[1])
      });
    }

    return charts;
  }

  private filterFindings(findings: Finding[], minSeverity?: Severity): Finding[] {
    if (!minSeverity) return findings;
    
    const severityOrder = [Severity.LOW, Severity.MEDIUM, Severity.HIGH, Severity.CRITICAL];
    const minIndex = severityOrder.indexOf(minSeverity);
    
    return findings.filter(f => severityOrder.indexOf(f.severity) >= minIndex);
  }

  private getCategoryFromRule(ruleId: string): string {
    const prefix = ruleId.split('-')[0];
    const categoryMap: Record<string, string> = {
      'SIT': 'Site Plan',
      'FLP': 'Floor Plan',
      'ELV': 'Elevation',
      'SEC': 'Section',
      'DRN': 'Drainage',
      'FIR': 'Fire Safety',
      'ENG': 'Energy',
      'STR': 'Structural',
      'MUN': 'Municipal',
      'ACC': 'Accessibility',
      'FIN': 'Final Review',
      'DIM': 'Dimensions',
      'LYR': 'Layers',
      'SCL': 'Scale',
      'SYM': 'Symbols',
      'TXT': 'Text Clarity'
    };
    return categoryMap[prefix] || 'Other';
  }

  private getCategoryRecommendations(category: string, findings: Finding[]): string[] {
    const recommendations: string[] = [];
    
    switch (category) {
      case 'Fire Safety':
        recommendations.push('Review fire escape routes and emergency exits');
        recommendations.push('Ensure fire extinguisher locations are marked');
        break;
      case 'Structural':
        recommendations.push('Verify structural calculations are complete');
        recommendations.push('Check foundation design adequacy');
        break;
      case 'Accessibility':
        recommendations.push('Ensure wheelchair access ramps comply with gradient requirements');
        recommendations.push('Verify accessible parking provision');
        break;
      case 'Energy':
        recommendations.push('Review thermal performance specifications');
        recommendations.push('Check insulation requirements');
        break;
      default:
        recommendations.push(`Review ${findings.length} findings in ${category}`);
    }
    
    return recommendations;
  }

  private getSeverityOrder(severity: Severity): number {
    const order = { [Severity.LOW]: 0, [Severity.MEDIUM]: 1, [Severity.HIGH]: 2, [Severity.CRITICAL]: 3 };
    return order[severity];
  }

  private getScoreColor(score: number): string {
    if (score >= 80) return '#38a169';
    if (score >= 60) return '#d69e2e';
    if (score >= 40) return '#dd6b20';
    return '#e53e3e';
  }

  private getSeverityColor(severity: Severity): string {
    const colors = {
      [Severity.CRITICAL]: '#e53e3e',
      [Severity.HIGH]: '#dd6b20',
      [Severity.MEDIUM]: '#d69e2e',
      [Severity.LOW]: '#38a169'
    };
    return colors[severity];
  }
}

// Export singleton instance
export const reportingService = new ReportingService();
export default ReportingService;
