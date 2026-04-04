---
from: alice
to: bob
date: 2026-04-01
subject: Task Assignment — Build Kalshi API Client (Task 219)
---

# Task Assignment: Build Kalshi API Client

**Task ID:** 219  
**Priority:** Medium  
**Collaborator:** Mia (API Engineer)

## Assignment
Build a Kalshi API client to fetch live market data and prices.

## Context
We need reliable access to Kalshi market data for our trading operation. This is foundational infrastructure.

## Your Focus (Backend Perspective)
- Data persistence layer (store market data)
- Database schema for markets and prices
- Background jobs for data collection
- Integration with Mia's API client

## Deliverables
1. **Database Schema**
   - Markets table
   - Prices/quotes table
   - Historical data storage

2. **Data Pipeline**
   - Scheduled jobs to fetch and store data
   - Data validation and cleaning
   - Duplicate handling

3. **API Layer** (if needed)
   - Internal API to query stored data
   - Endpoints for strategy modules

## Technical Requirements
- PostgreSQL for data storage
- Python for pipeline jobs
- Consider using Celery or similar for scheduling

## Resources
- Coordinate with Mia on API client interface
- Kalshi API docs: https://trading-api.readme.io/reference/getting-started

## Acceptance Criteria
- [ ] Database schema defined
- [ ] Data pipeline fetching live data
- [ ] Stored data queryable
- [ ] Integration with Mia's client

Start immediately. Report progress in your status.md.
