#!/usr/bin/env python3
"""
Phase 3: Pearson Pairwise Correlation Detection for Kalshi Markets

Task 529 (Phase 3): Apply Pearson correlation on clustered markets to identify
arbitrage candidates with confidence scores.

Input:
  - market_clusters.json (from Phase 2 clustering)
  - markets_filtered.json (from Phase 1 filtering)

Output:
  - correlation_pairs.json — arbitrage candidates with Pearson r, confidence, edge estimates

Reference: Hudson & Thames ArbitrageLab distance/pearson approach
"""

import json
import math
import os
import sys
from datetime import datetime
from typing import List, Dict, Tuple, Optional


def load_json(path: str) -> dict:
    """Load JSON file with fallback paths."""
    candidates = [path, os.path.join("..", "public", os.path.basename(path)),
                  os.path.join("../../agents/public", os.path.basename(path))]
    for p in candidates:
        if os.path.exists(p):
            with open(p) as f:
                return json.load(f)
    raise FileNotFoundError(f"Cannot find {path} in any expected location")


def generate_synthetic_price_history(market: dict, n_periods: int = 60) -> List[float]:
    """
    Generate synthetic price history for a market based on its current bid/ask.

    In production, this would pull real historical data from the Kalshi API (pending T236).
    For now, we simulate a random walk anchored to the current yes_ratio with
    realistic volatility per category.
    """
    import random

    center = market.get("yes_ratio", 50)
    category = market.get("category", "Unknown")

    # Category-specific volatility (annualized, scaled to daily)
    vol_map = {
        "Crypto": 3.5,      # High volatility
        "Financial": 1.8,   # Moderate
        "Politics": 1.2,    # Lower, event-driven
    }
    daily_vol = vol_map.get(category, 2.0)

    # Generate mean-reverting random walk
    random.seed(hash(market["ticker"]))  # Reproducible per market
    prices = [center]
    for _ in range(n_periods - 1):
        mean_revert = 0.05 * (center - prices[-1])
        shock = random.gauss(0, daily_vol)
        new_price = prices[-1] + mean_revert + shock
        new_price = max(1, min(99, new_price))  # Kalshi bounds: 1-99¢
        prices.append(round(new_price, 2))

    return prices


def pearson_correlation(x: List[float], y: List[float]) -> float:
    """Compute Pearson correlation coefficient between two price series."""
    n = len(x)
    if n < 3:
        return 0.0

    mean_x = sum(x) / n
    mean_y = sum(y) / n

    cov_xy = sum((xi - mean_x) * (yi - mean_y) for xi, yi in zip(x, y)) / (n - 1)
    std_x = math.sqrt(sum((xi - mean_x) ** 2 for xi in x) / (n - 1))
    std_y = math.sqrt(sum((yi - mean_y) ** 2 for yi in y) / (n - 1))

    if std_x == 0 or std_y == 0:
        return 0.0

    return cov_xy / (std_x * std_y)


def calculate_spread_zscore(x: List[float], y: List[float]) -> Tuple[float, float, float]:
    """
    Calculate spread Z-score for a market pair (cointegration-lite).

    Spread = x - beta * y, where beta = cov(x,y) / var(y)
    Returns: (current_zscore, spread_mean, spread_std)
    """
    n = len(x)
    mean_y = sum(y) / n
    var_y = sum((yi - mean_y) ** 2 for yi in y) / (n - 1)

    if var_y == 0:
        return 0.0, 0.0, 0.0

    mean_x = sum(x) / n
    cov_xy = sum((xi - mean_x) * (yi - mean_y) for xi, yi in zip(x, y)) / (n - 1)
    beta = cov_xy / var_y

    spread = [xi - beta * yi for xi, yi in zip(x, y)]
    spread_mean = sum(spread) / n
    spread_std = math.sqrt(sum((s - spread_mean) ** 2 for s in spread) / (n - 1))

    if spread_std == 0:
        return 0.0, spread_mean, 0.0

    current_zscore = (spread[-1] - spread_mean) / spread_std
    return current_zscore, spread_mean, spread_std


def t_statistic_for_r(r: float, n: int) -> float:
    """Calculate t-statistic for Pearson r significance testing."""
    if abs(r) >= 1.0 or n <= 2:
        return float('inf') if r > 0 else float('-inf')
    return r * math.sqrt(n - 2) / math.sqrt(1 - r * r)


def estimate_arbitrage_edge(pair: dict) -> dict:
    """
    Estimate arbitrage edge for a correlated pair.

    Edge = |spread Z-score| * spread_std * confidence_discount
    Signal: BUY spread if Z < -threshold, SELL spread if Z > threshold
    """
    z = pair["spread_zscore"]
    spread_std = pair["spread_std"]
    r = pair["pearson_r"]

    # Confidence discount: higher correlation = more reliable spread
    confidence_discount = min(abs(r), 0.95)

    raw_edge = abs(z) * spread_std * confidence_discount

    # Signal direction
    z_threshold = 1.5
    if z < -z_threshold:
        signal = "BUY_SPREAD"
        signal_detail = f"Spread undervalued: buy {pair['market1']}, sell {pair['market2']}"
    elif z > z_threshold:
        signal = "SELL_SPREAD"
        signal_detail = f"Spread overvalued: sell {pair['market1']}, buy {pair['market2']}"
    else:
        signal = "NO_SIGNAL"
        signal_detail = f"Spread within normal range (Z={z:.2f}, threshold=±{z_threshold})"

    return {
        "signal": signal,
        "signal_detail": signal_detail,
        "estimated_edge_cents": round(raw_edge, 2),
        "z_threshold": z_threshold,
        "confidence_discount": round(confidence_discount, 2),
    }


def analyze_pair(m1: dict, m2: dict) -> dict:
    """Full analysis of a market pair: correlation, spread, arbitrage signal."""
    prices1 = generate_synthetic_price_history(m1)
    prices2 = generate_synthetic_price_history(m2)

    r = pearson_correlation(prices1, prices2)
    n = len(prices1)
    t_stat = t_statistic_for_r(r, n)

    # p < 0.05 for two-tailed test with df=n-2: |t| > ~2.0 for n=60
    significant = abs(t_stat) > 2.0

    zscore, spread_mean, spread_std = calculate_spread_zscore(prices1, prices2)

    pair_data = {
        "market1": m1["ticker"],
        "market2": m2["ticker"],
        "market1_title": m1["title"],
        "market2_title": m2["title"],
        "categories": [m1["category"], m2["category"]],
        "pearson_r": round(r, 4),
        "t_statistic": round(t_stat, 2),
        "statistically_significant": significant,
        "n_periods": n,
        "spread_zscore": round(zscore, 2),
        "spread_mean": round(spread_mean, 2),
        "spread_std": round(spread_std, 2),
        "current_prices": {
            m1["ticker"]: m1.get("yes_ratio"),
            m2["ticker"]: m2.get("yes_ratio"),
        },
    }

    arb = estimate_arbitrage_edge(pair_data)
    pair_data["arbitrage"] = arb

    # Confidence score: combines correlation strength + significance + spread behavior
    conf_components = {
        "correlation_strength": min(abs(r), 1.0),
        "statistical_significance": 1.0 if significant else 0.3,
        "spread_stability": max(0, 1.0 - spread_std / 10.0),
    }
    pair_data["confidence"] = round(
        sum(conf_components.values()) / len(conf_components), 2
    )
    pair_data["confidence_components"] = {k: round(v, 2) for k, v in conf_components.items()}

    return pair_data


def main():
    print("Phase 3: Pearson Pairwise Correlation Detection")
    print("=" * 60)
    print("Reference: Hudson & Thames ArbitrageLab distance/pearson approach")
    print()

    # Load Phase 1 and Phase 2 outputs
    markets_data = load_json("../public/markets_filtered.json")
    clusters_data = load_json("../public/market_clusters.json")

    qualifying = markets_data["qualifying_markets"]
    market_lookup = {m["ticker"]: m for m in qualifying}

    print(f"Loaded {len(qualifying)} qualifying markets")
    print(f"Loaded {len(clusters_data['clusters'])} clusters")

    # Generate all pairwise correlations
    pairs = []

    # 1. Intra-cluster pairs (same cluster — expected high correlation)
    for cluster in clusters_data["clusters"]:
        tickers = cluster["markets"]
        for i, t1 in enumerate(tickers):
            for t2 in tickers[i + 1:]:
                if t1 in market_lookup and t2 in market_lookup:
                    pair = analyze_pair(market_lookup[t1], market_lookup[t2])
                    pair["source"] = "intra_cluster"
                    pair["cluster"] = cluster["label"]
                    pairs.append(pair)

    # 2. Cross-cluster / unclustered pairs (potential hidden arbitrage)
    clustered_tickers = set()
    for cluster in clusters_data["clusters"]:
        clustered_tickers.update(cluster["markets"])

    unclustered = [t for t in market_lookup if t not in clustered_tickers]

    # Cross pairs: clustered vs unclustered
    for ut in unclustered:
        for ct in clustered_tickers:
            if ut in market_lookup and ct in market_lookup:
                pair = analyze_pair(market_lookup[ut], market_lookup[ct])
                pair["source"] = "cross_cluster"
                pair["cluster"] = "cross_domain"
                pairs.append(pair)

    # Sort by absolute correlation (strongest first)
    pairs.sort(key=lambda p: abs(p["pearson_r"]), reverse=True)

    # Identify arbitrage candidates (significant correlation + signal)
    arb_candidates = [
        p for p in pairs
        if p["statistically_significant"] and p["arbitrage"]["signal"] != "NO_SIGNAL"
    ]

    # Build output
    output = {
        "generated_at": datetime.now().isoformat(),
        "task": "T529",
        "phase": "D004 Phase 3 — Pearson Correlation Detection",
        "method": "Pearson pairwise correlation with spread Z-score",
        "reference": "Hudson & Thames ArbitrageLab distance/pearson approach",
        "input_files": {
            "markets_filtered": "public/markets_filtered.json",
            "market_clusters": "public/market_clusters.json",
        },
        "parameters": {
            "n_periods": 60,
            "z_threshold": 1.5,
            "significance_level": 0.05,
            "note": "Using synthetic price history (real data pending T236 Kalshi API credentials)",
        },
        "all_pairs": pairs,
        "arbitrage_candidates": arb_candidates,
        "summary": {
            "total_pairs_analyzed": len(pairs),
            "significant_correlations": sum(1 for p in pairs if p["statistically_significant"]),
            "arbitrage_signals": len(arb_candidates),
            "pairs_by_source": {
                "intra_cluster": sum(1 for p in pairs if p["source"] == "intra_cluster"),
                "cross_cluster": sum(1 for p in pairs if p["source"] == "cross_cluster"),
            },
        },
    }

    # Print results
    print(f"\n{'=' * 60}")
    print("ALL PAIRS")
    print(f"{'=' * 60}")
    for p in pairs:
        sig = "✓" if p["statistically_significant"] else "✗"
        print(f"\n  {p['market1']} ↔ {p['market2']}")
        print(f"    Pearson r: {p['pearson_r']:.4f} (sig: {sig}, t={p['t_statistic']:.2f})")
        print(f"    Spread Z: {p['spread_zscore']:.2f}  |  Confidence: {p['confidence']:.2f}")
        print(f"    Signal: {p['arbitrage']['signal']} — edge: {p['arbitrage']['estimated_edge_cents']}¢")

    if arb_candidates:
        print(f"\n{'=' * 60}")
        print(f"ARBITRAGE CANDIDATES ({len(arb_candidates)})")
        print(f"{'=' * 60}")
        for c in arb_candidates:
            print(f"\n  ★ {c['market1']} ↔ {c['market2']}")
            print(f"    {c['arbitrage']['signal_detail']}")
            print(f"    Edge: {c['arbitrage']['estimated_edge_cents']}¢  |  Confidence: {c['confidence']:.2f}")
    else:
        print(f"\n{'=' * 60}")
        print("NO ARBITRAGE SIGNALS")
        print("(Spread Z-scores within ±1.5 threshold — markets are efficiently priced)")
        print(f"{'=' * 60}")

    # Save outputs
    # 1. Save to agent output/
    local_path = "output/correlation_pairs.json"
    os.makedirs(os.path.dirname(local_path), exist_ok=True)
    with open(local_path, "w") as f:
        json.dump(output, f, indent=2)
    print(f"\n✅ Saved to: {local_path}")

    # 2. Save to shared location for Grace (T530) and downstream
    shared_path = "../public/correlation_pairs.json"
    with open(shared_path, "w") as f:
        json.dump(output, f, indent=2)
    print(f"✅ Saved to: {shared_path}")

    print(f"\nSummary:")
    print(f"  Total pairs: {output['summary']['total_pairs_analyzed']}")
    print(f"  Significant: {output['summary']['significant_correlations']}")
    print(f"  Arb signals: {output['summary']['arbitrage_signals']}")
    print(f"  Note: Synthetic data — real validation pending T236")

    return output


if __name__ == "__main__":
    main()
