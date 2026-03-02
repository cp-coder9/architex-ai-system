# AI Agent System Architecture

## Overview
This document outlines the technical architecture for the AI agent system that autonomously checks architectural drawings against SANS specifications and South African building regulations. The system consists of 10 specialized agents coordinated by a central orchestrator.

## System Architecture

### High-Level Diagram
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Client Upload │────►│  Orchestrator   │────►│  Specialized    │
│    Drawing      │     │                 │     │    Agents       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         ▲                     │                     ▲
         │                     │                     │
         │                     ▼                     │
         │                ┌──────────────┐            │
         │                │  Results     │            │
         │                │  Compilation │            │
         │                └──────────────┘            │
         │                     │                     │
         │                     ▼                     │
         │                ┌──────────────┐            │
         │                │  Admin       │            │
         │                │  Review      │            │
         │                └──────────────┘            │
         │                     │                     │
         │                     ▼                     │
         └──────────────┐ Freelancer Revisions
                        │
                        ▼
                ┌──────────────┐
                │  Re-upload   │
                │  Drawing     │
                └──────────────┘
```

## Agent Orchestrator

### Purpose
- Central control system for all agents
- Task delegation and result compilation
- Conflict resolution and accuracy tracking
- Audit trail management

### Key Features
1. **Task Distribution**
   - Receive drawing from client/freelancer
   - Break down into analysis tasks
   - Assign to specialized agents

2. **Accuracy Monitoring**
   - Track agent accuracy rates
   - Ensure 98% minimum accuracy requirement
   - Identify underperforming agents for retraining

3. **Conflict Resolution**
   - If agents disagree on results
   - Re-delegate task to original agent for double-check
   - If same answer received, escalate to admin

4. **Result Compilation**
   - Collect all agent findings
   - Generate comprehensive report
   - Highlight critical issues

## Specialized Agents (10 Agents)

### 1. Dimension Validator
- **Purpose**: Verify all dimensions in the drawing
- **Checks**:
  - Lengths, widths, heights
  - Consistency across views
  - Tolerance levels

### 2. Scale Verifier
- **Purpose**: Ensure correct scale throughout the drawing
- **Checks**:
  - Scale consistency
  - Proportions between elements
  - Measurement units

### 3. Layer Analyzer
- **Purpose**: Validate layer structure
- **Checks**:
  - Correct layer naming conventions
  - Layer organization
  - Visibility settings

### 4. Symbol Recognizer
- **Purpose**: Verify architectural symbols
- **Checks**:
  - Symbol consistency
  - Correct symbol usage
  - Standardized notation

### 5. Text Clarity Checker
- **Purpose**: Verify text legibility
- **Checks**:
  - Font sizes
  - Text placement
  - Readability

### 6. Compliance Auditor (SANS Standards)
- **Purpose**: Check against SANS specifications
- **Standards Checked**:
  - SANS 10160 - Load-bearing structures
  - SANS 10400 - Building regulations
  - SANS 10142 - Electrical installations

### 7. Building Code Inspector
- **Purpose**: Validate South African building codes
- **Checks**:
  - National Building Regulations
  - Safety requirements
  - Accessibility standards

### 8. Municipal Requirements Checker
- **Purpose**: Verify local municipal regulations
- **Features**:
  - Location-based checks
  - Zoning requirements
  - Local bylaws

### 9. Safety Standards Validator
- **Purpose**: Check safety requirements
- **Checks**:
  - Fire safety regulations
  - Emergency evacuation routes
  - Structural safety

### 10. Final Review Agent
- **Purpose**: Comprehensive final inspection
- **Checks**:
  - All findings from other agents
  - Overall drawing quality
  - Completeness of information

## Technology Stack

### Backend (Python)
- **FastAPI** - API framework
- **TensorFlow/PyTorch** - Machine learning
- **OpenCV** - Image processing
- **OCR Engines** - Text recognition
- **PostgreSQL** - Data storage
- **Redis** - Caching

### ML Models
1. **Computer Vision Models**
   - Object detection for symbols
   - Image segmentation for layers
   - Feature extraction for dimensions

2. **NLP Models**
   - Text recognition and classification
   - Standard interpretation

3. **Custom ML Models**
   - Trained on South African architectural data
   - SANS and building code recognition

## Integration with Frontend

### API Endpoints
```
POST /api/agents/analyze - Submit drawing for analysis
GET /api/agents/results/{drawingId} - Get analysis results
POST /api/agents/override - Override agent decision
GET /api/agents/accuracy - Get agent accuracy metrics
```

### Data Structure
```json
{
  "drawingId": "12345",
  "filename": "floor_plan.dwg",
  "status": "analyzing",
  "results": [
    {
      "agentId": "dimension-validator",
      "status": "completed",
      "accuracy": 0.98,
      "issues": [
        {
          "type": "dimension-mismatch",
          "severity": "critical",
          "description": "Wall height inconsistent between views",
          "location": { "x": 100, "y": 200 }
        }
      ]
    }
  ]
}
```

## Performance Requirements

### Speed
- Average analysis time: < 5 minutes per drawing
- Peak capacity: 100 concurrent analyses

### Accuracy
- Minimum agent accuracy: 98%
- Orchestrator confidence threshold: 95%

### Scalability
- Horizontal scaling via containerization
- Load balancing for high traffic

## Quality Assurance

### Training Data
- 10,000+ South African architectural drawings
- Annotated by qualified architects
- Covering various project types

### Testing Process
- Unit testing for each agent
- Integration testing of orchestrator
- Beta testing with real projects
- Continuous monitoring in production

## Future Enhancements

### Machine Learning
- Active learning for continuous improvement
- Transfer learning for new standards
- Predictive analytics for common issues

### System Improvements
- Real-time analysis updates
- Integration with popular CAD tools
- Multi-language support

### Compliance
- Automatic regulation updates
- Historical compliance tracking
- Audit trail preservation

## Security

### Data Protection
- Encrypted storage for sensitive data
- Access control based on user roles
- Audit logs for all operations

### System Security
- API authentication and authorization
- Input validation for drawing files
- Regular security audits
