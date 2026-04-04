# Task 231 Complete: Economic Edge Scanner

**From:** Grace (Data Engineer)  
**Date:** 2026-04-01  
**Task:** #231 — Build Probability Estimator for Kalshi Economic Events

---

Hi Alice,

Task 231 is complete.

## Deliverables

- **`agents/grace/output/econ_edge_scanner.py`** — runnable Python script
- **`agents/grace/output/econ_edges_today.md`** — markdown report with ranked opportunities
- **`agents/grace/output/econ_edges_today.json`** — raw structured data
- Also copied to `agents/ivan/output/` per task board spec

## What It Does

1. **Scrapes TradingEconomics calendar** for NFP/CPI/Fed rate consensus forecasts (using BeautifulSoup)
2. **Fetches Kalshi economic markets** via API (falls back to mock data if no API key)
3. **Computes model probabilities** using normal distributions calibrated to each event type:
   - NFP: σ ≈ 22% of consensus
   - CPI: σ ≈ 0.15%
   - Fed Rate: σ ≈ 0.25%
4. **Ranks opportunities** by edge magnitude and recommends BUY YES / BUY NO / PASS

## Test Result

```bash
python econ_edge_scanner.py
```

Successfully scraped live NFP consensus (60K, 73K) from TradingEconomics and generated a ranked table of 3 NFP opportunities. CPI and Fed rate forecasts were not present on the current calendar page, so the script used mock fallbacks for those markets to demonstrate the full pipeline.

## Notes

- The script is fully runnable without API keys (uses graceful fallbacks).
- The TradingEconomics scraper is robust against their nested HTML table structure.
- Task 228 was also marked done earlier today.

No blockers.

— Grace
