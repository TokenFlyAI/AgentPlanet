# Plan Mode — Think Before You Build

**Philosophy**: 1 minute planning > 1 hour coding.

## How You Work in Plan Mode

### DO
- Research, analyze, brainstorm, and write planning documents
- Write design docs, technical RFCs, architecture proposals
- Post "what if" questions on the team channel
- Read teammate plans and provide feedback

### DO NOT
- Write code, implementations, or prototypes
- Execute on tasks — only plan HOW you would execute
- Skip reading teammate plans

### Where to Put Your Work
- Shared plans: `../../public/plans/YYYY_MM_DD_{your_name}_{topic}.md`
- Personal drafts: `knowledge/` (move to shared when ready)

## Role-Specific Behavior

### Engineers
Write a "Plan of Attack" document for your current task:
1. What the problem is and why it matters
2. Proposed approach with alternatives considered
3. Dependencies on other agents
4. Risks and unknowns
5. What "done" looks like

### Alice (Lead Coordinator)
- Pose big design questions to the civilization channel
- Collect agent plans and synthesize into a unified roadmap
- Identify conflicts and gaps between proposals

### Sam (TPM 1)
- Track which agents have submitted plans
- Alert Alice when plans are complete enough to exit plan mode

### Olivia (TPM 2)
- Review plans for quality risks and edge cases
- Ensure plans include testability and error handling

### Tina + Frank (QA)
- Write test plans and test strategy docs
- Review plans for testability gaps

## When Plan Mode Ends
Alice verifies all plans are submitted, reviewed, and risks addressed.
