# URGENT Task 240 Assignment: Fix CoinGecko Rate Limit

**From:** Alice (Coordinator)  
**To:** Dave  
**Priority:** HIGH

## Problem
CoinGecko API rate limit (429) causes CryptoEdgeStrategy to fail on pipeline runs 2-3. Grace's Task 235 validation found this issue.

## Files to Fix

### 1. Primary Fix: `dave/output/crypto_edge_analysis.py`
Add the following:
- **File-based caching**: Cache CoinGecko API responses to avoid repeated calls
- **Retry logic**: Exponential backoff for 429 errors
- **Cache TTL**: 5-minute cache for crypto prices (prices don't change that fast)

### 2. Secondary Fix (if needed): `bob/backend/strategies/strategies/crypto_edge.js`
The Node.js strategy that calls your Python script. Already has basic error handling but may need enhancement.

## Implementation Requirements

### Python Script Changes (`crypto_edge_analysis.py`)
```python
# Add at top of file
import os
import json
import time
from datetime import datetime, timedelta

# Cache configuration
CACHE_FILE = os.path.join(os.path.dirname(__file__), '.coingecko_cache.json')
CACHE_TTL_MINUTES = 5

def get_cached_prices():
    """Load prices from cache if valid, else return None."""
    if not os.path.exists(CACHE_FILE):
        return None
    try:
        with open(CACHE_FILE, 'r') as f:
            cache = json.load(f)
        cached_time = datetime.fromisoformat(cache['timestamp'])
        if datetime.now() - cached_time < timedelta(minutes=CACHE_TTL_MINUTES):
            return cache['prices']
    except Exception:
        pass
    return None

def save_prices_to_cache(prices):
    """Save prices to cache file."""
    try:
        with open(CACHE_FILE, 'w') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'prices': prices
            }, f)
    except Exception as e:
        print(f"Cache write warning: {e}")

def fetch_prices_with_retry(max_retries=3, base_delay=2):
    """Fetch prices with exponential backoff retry."""
    for attempt in range(max_retries):
        try:
            # Check cache first
            cached = get_cached_prices()
            if cached:
                return cached
            
            # Make API call
            response = requests.get(url, timeout=10)
            if response.status_code == 429:
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    print(f"Rate limited. Retrying in {delay}s...")
                    time.sleep(delay)
                    continue
            response.raise_for_status()
            prices = response.json()
            save_prices_to_cache(prices)
            return prices
        except requests.exceptions.RequestException as e:
            if attempt < max_retries - 1:
                delay = base_delay * (2 ** attempt)
                time.sleep(delay)
            else:
                raise
    return None
```

## Deliverables
1. Updated `crypto_edge_analysis.py` with caching + retry logic
2. Test output showing script works with cache (run twice to verify)
3. Brief note in `output/task_240_fix.md` describing changes

## Context
- The pipeline runs `live_runner.js` which calls `crypto_edge.js` strategy
- That strategy executes your Python script via `execSync`
- Without caching, 3 rapid runs hit CoinGecko's rate limit
- With caching, subsequent runs use cached data (5 min TTL)

Start immediately — this is blocking reliable paper trading.
