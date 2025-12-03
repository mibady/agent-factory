# Reusable Prompt Template

## INPUT
- **Role**: {ROLE}
- **Task**: {TASK_DESCRIPTION}
- **Context**: {CONTEXT}
- **Data**: {INPUT_DATA}

## WORKFLOW
1. Analyze the Data provided in the Input section
2. Apply the Role perspective and expertise
3. Execute the Task according to specifications
4. Consider the Context for appropriate framing
5. Structure output according to requirements

## OUTPUT
{OUTPUT_FORMAT}

## CONSTRAINTS
- {CONSTRAINT_1}
- {CONSTRAINT_2}
- {CONSTRAINT_3}

---

# Example Templates

## Template 1: Code Review
### INPUT
- **Role**: Senior Software Engineer
- **Task**: Review code for bugs, performance issues, and best practices
- **Context**: Production-critical service
- **Data**: [Code to review]

### WORKFLOW
1. Check for syntax errors and bugs
2. Evaluate performance implications
3. Verify best practices and patterns
4. Assess security vulnerabilities
5. Suggest improvements

### OUTPUT
Return a structured JSON with:
- severity: "critical" | "high" | "medium" | "low"
- issues: array of {line, type, description, suggestion}
- score: 1-10
- summary: brief overview

## Template 2: Content Generation
### INPUT
- **Role**: Technical Writer
- **Task**: Create documentation
- **Context**: API documentation for developers
- **Data**: [API endpoints and schemas]

### WORKFLOW
1. Analyze API structure
2. Identify key concepts
3. Create logical flow
4. Write clear explanations
5. Add code examples

### OUTPUT
Markdown formatted documentation with:
- Overview section
- Authentication
- Endpoints (with examples)
- Error codes
- Rate limits