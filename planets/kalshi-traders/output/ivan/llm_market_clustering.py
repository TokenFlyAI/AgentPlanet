#!/usr/bin/env python3
"""
LLM-Based Market Clustering Engine (v2 — T546)

Improvements over v1 (T344):
- News sentiment scoring per market (category-based + price-implied)
- Volatility features from bid-ask spread
- Fixed strength=0 bug (Olivia Q1 finding)
- Non-overlapping clusters (no duplicate markets)
- Multi-dimensional feature vectors: semantic + volatility + sentiment

Input: ../public/markets_filtered.json (Phase 1 output)
Output: ../public/market_clusters.json (Phase 2 output for Phase 3)

Run: python3 output/llm_market_clustering.py
"""

import json
import math
from typing import List, Dict, Tuple
from dataclasses import dataclass, field
from datetime import datetime
import os


@dataclass
class Market:
    ticker: str
    title: str
    category: str
    volume: int = 0
    yes_bid: int = 0
    yes_ask: int = 0
    no_bid: int = 0
    no_ask: int = 0
    yes_ratio: int = 50
    # Computed features
    volatility: float = 0.0
    sentiment: float = 0.0
    news_sentiment_label: str = "neutral"


@dataclass
class Cluster:
    id: str
    label: str
    markets: List[str]
    strength: float
    description: str = ""
    avg_volatility: float = 0.0
    avg_sentiment: float = 0.0
    cross_category: bool = False


# --- News Sentiment Model ---
# Maps category to baseline sentiment + direction based on market research.
# In production, this would call a news API (e.g., NewsAPI, GDELT) and run
# NLP sentiment analysis. For now, we use category priors + price-implied sentiment.

CATEGORY_SENTIMENT = {
    "Crypto": {"baseline": 0.15, "volatility_factor": 1.5,
               "keywords_bullish": ["exceed", "above"], "keywords_bearish": ["below", "under"]},
    "Economics": {"baseline": 0.0, "volatility_factor": 0.8,
                  "keywords_bullish": ["above", "exceed", "growth"], "keywords_bearish": ["below", "recession"]},
    "Financial": {"baseline": -0.05, "volatility_factor": 1.0,
                  "keywords_bullish": ["above", "exceed"], "keywords_bearish": ["below", "decline"]},
    "Rates": {"baseline": -0.10, "volatility_factor": 0.7,
              "keywords_bullish": ["cut", "lower"], "keywords_bearish": ["hike", "raise"]},
    "Climate": {"baseline": -0.20, "volatility_factor": 1.2,
                "keywords_bullish": [], "keywords_bearish": ["record", "extreme"]},
    "Geopolitical": {"baseline": -0.15, "volatility_factor": 1.3,
                     "keywords_bullish": ["peace", "agreement"], "keywords_bearish": ["conflict", "war", "tension"]},
    "Commodities": {"baseline": 0.05, "volatility_factor": 1.1,
                    "keywords_bullish": ["above", "exceed"], "keywords_bearish": ["below", "decline"]},
}

# Semantic domain keywords for embedding
DOMAIN_KEYWORDS = {
    'crypto': ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'solana', 'sol',
               'blockchain', 'coin', 'token', 'defi'],
    'macro_index': ['s&p', 'sp500', 'nasdaq', 'dow', 'index', 'close above'],
    'macro_econ': ['gdp', 'cpi', 'inflation', 'unemployment', 'nfp', 'jobs',
                   'recession', 'economy', 'growth'],
    'rates': ['fed', 'federal reserve', 'interest rate', 'rate cut', 'rate hike',
              'monetary policy'],
    'commodities': ['oil', 'gold', 'commodity', 'crude', 'energy'],
    'climate': ['temperature', 'hurricane', 'storm', 'climate', 'weather', 'record'],
    'geopolitical': ['china', 'taiwan', 'war', 'conflict', 'geopolitical', 'chip'],
}


def compute_volatility(market: Market) -> float:
    """Volatility proxy from bid-ask spread. Higher spread = more uncertainty."""
    yes_spread = market.yes_ask - market.yes_bid
    no_spread = market.no_ask - market.no_bid
    avg_spread = (yes_spread + no_spread) / 2.0
    # Normalize: typical Kalshi spread is 2-8 cents
    return min(avg_spread / 10.0, 1.0)


def compute_sentiment(market: Market) -> Tuple[float, str]:
    """
    News sentiment score [-1, 1] combining:
    1. Category baseline (macro sentiment for this asset class)
    2. Price-implied sentiment (yes_ratio far from 50 = strong directional view)
    3. Title keyword analysis (bullish/bearish language)
    """
    cat_info = CATEGORY_SENTIMENT.get(market.category, {"baseline": 0, "volatility_factor": 1.0,
                                                         "keywords_bullish": [], "keywords_bearish": []})

    # 1. Category baseline
    score = cat_info["baseline"]

    # 2. Price-implied: ratio > 70 = bullish consensus, < 30 = bearish consensus
    if market.yes_ratio > 70:
        score += 0.3 * ((market.yes_ratio - 70) / 30.0)
    elif market.yes_ratio < 30:
        score -= 0.3 * ((30 - market.yes_ratio) / 30.0)

    # 3. Title keyword scan
    title_lower = market.title.lower()
    for kw in cat_info.get("keywords_bullish", []):
        if kw in title_lower:
            score += 0.1
    for kw in cat_info.get("keywords_bearish", []):
        if kw in title_lower:
            score -= 0.1

    # Clamp to [-1, 1]
    score = max(-1.0, min(1.0, score))

    label = "bullish" if score > 0.1 else ("bearish" if score < -0.1 else "neutral")
    return round(score, 3), label


def embed_market(market: Market) -> List[float]:
    """
    Multi-dimensional feature vector combining:
    - Semantic domain scores (7 dims)
    - Volatility (1 dim)
    - Sentiment (1 dim)
    - Volume weight (1 dim)
    Total: 10 dimensions
    """
    text = f"{market.title} {market.category} {market.ticker}".lower()

    # Semantic dimensions
    vec = []
    for domain, keywords in DOMAIN_KEYWORDS.items():
        score = 0
        for kw in keywords:
            if kw in text:
                score += 2 if f" {kw} " in f" {text} " else 1
        vec.append(score)

    # Normalize semantic part
    sem_norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    vec = [v / sem_norm for v in vec]

    # Add volatility, sentiment, volume_weight (normalized)
    vec.append(market.volatility)
    vec.append((market.sentiment + 1.0) / 2.0)  # shift to [0, 1]
    vec.append(min(market.volume / 800000.0, 1.0))

    return vec


def cosine_similarity(a: List[float], b: List[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)) or 1e-9
    nb = math.sqrt(sum(x * x for x in b)) or 1e-9
    return dot / (na * nb)


def load_markets(filepath: str) -> List[Market]:
    with open(filepath, 'r') as f:
        data = json.load(f)

    items = data.get('qualifying_markets', []) or data.get('markets', [])
    markets = []
    for item in items:
        m = Market(
            ticker=item.get('ticker', ''),
            title=item.get('title', ''),
            category=item.get('category', ''),
            volume=item.get('volume', 0),
            yes_bid=item.get('yes_bid', 0),
            yes_ask=item.get('yes_ask', 0),
            no_bid=item.get('no_bid', 0),
            no_ask=item.get('no_ask', 0),
            yes_ratio=item.get('yes_ratio', 50),
        )
        m.volatility = compute_volatility(m)
        m.sentiment, m.news_sentiment_label = compute_sentiment(m)
        markets.append(m)
    return markets


def cluster_markets(markets: List[Market], threshold: float = 0.65) -> List[Cluster]:
    """
    Cluster using greedy agglomerative approach on multi-dimensional embeddings.
    Each market belongs to exactly one cluster (no duplicates).
    """
    embeddings = {m.ticker: embed_market(m) for m in markets}
    market_map = {m.ticker: m for m in markets}

    # Compute pairwise similarities
    tickers = [m.ticker for m in markets]
    assigned = set()
    clusters = []

    # Sort markets by volume (high-volume markets seed clusters first)
    tickers_sorted = sorted(tickers, key=lambda t: market_map[t].volume, reverse=True)

    for seed in tickers_sorted:
        if seed in assigned:
            continue

        # Start new cluster with this seed
        group = [seed]
        assigned.add(seed)

        for candidate in tickers_sorted:
            if candidate in assigned:
                continue
            # Check similarity to all current group members (complete linkage)
            min_sim = min(cosine_similarity(embeddings[candidate], embeddings[g])
                         for g in group)
            if min_sim >= threshold:
                group.append(candidate)
                assigned.add(candidate)

        if len(group) >= 2:
            # Compute cluster strength = average pairwise similarity
            pair_sims = []
            for i in range(len(group)):
                for j in range(i + 1, len(group)):
                    pair_sims.append(cosine_similarity(embeddings[group[i]], embeddings[group[j]]))
            strength = sum(pair_sims) / len(pair_sims) if pair_sims else 0.0

            # Derive label from dominant category
            cats = [market_map[t].category for t in group]
            dominant_cat = max(set(cats), key=cats.count)
            cross_cat = len(set(cats)) > 1

            avg_vol = sum(market_map[t].volatility for t in group) / len(group)
            avg_sent = sum(market_map[t].sentiment for t in group) / len(group)

            label = f"{dominant_cat} Markets"
            if cross_cat:
                other_cats = sorted(set(cats) - {dominant_cat})
                label = f"{dominant_cat} + {'/'.join(other_cats)}"

            cluster_id = f"cluster_{len(clusters) + 1}"
            clusters.append(Cluster(
                id=cluster_id,
                label=label,
                markets=group,
                strength=round(strength, 3),
                description=_describe_cluster(group, market_map, strength, cross_cat),
                avg_volatility=round(avg_vol, 3),
                avg_sentiment=round(avg_sent, 3),
                cross_category=cross_cat,
            ))

    # Markets not in any cluster (singletons) — add as single-market clusters
    for ticker in tickers_sorted:
        if ticker not in assigned:
            m = market_map[ticker]
            clusters.append(Cluster(
                id=f"singleton_{ticker}",
                label=f"{m.category}: {ticker}",
                markets=[ticker],
                strength=0.0,
                description=f"Unclustered market: {m.title}",
                avg_volatility=round(m.volatility, 3),
                avg_sentiment=round(m.sentiment, 3),
                cross_category=False,
            ))

    clusters.sort(key=lambda c: c.strength, reverse=True)
    return clusters


def _describe_cluster(tickers, market_map, strength, cross_cat):
    n = len(tickers)
    cats = list(set(market_map[t].category for t in tickers))
    desc = f"{n} markets"
    if cross_cat:
        desc += f" spanning {', '.join(cats)}"
    desc += f" | similarity={strength:.2f}"
    sents = [market_map[t].news_sentiment_label for t in tickers]
    dominant_sent = max(set(sents), key=sents.count)
    desc += f" | dominant sentiment: {dominant_sent}"
    return desc


def find_hidden_correlations(markets: List[Market], threshold: float = 0.4) -> List[Dict]:
    """Cross-category correlations (different category but high embedding similarity)."""
    embeddings = {m.ticker: embed_market(m) for m in markets}
    hidden = []
    for i, m1 in enumerate(markets):
        for m2 in markets[i + 1:]:
            if m1.category == m2.category:
                continue
            sim = cosine_similarity(embeddings[m1.ticker], embeddings[m2.ticker])
            if sim >= threshold:
                hidden.append({
                    "market1": m1.ticker,
                    "market2": m2.ticker,
                    "categories": [m1.category, m2.category],
                    "correlation": round(sim, 3),
                    "sentiment_alignment": round(abs(m1.sentiment - m2.sentiment), 3),
                    "insight": _cross_category_insight(m1, m2, sim),
                })
    return sorted(hidden, key=lambda x: x['correlation'], reverse=True)


def _cross_category_insight(m1, m2, sim):
    if {m1.category, m2.category} & {"Crypto", "Economics"}:
        return f"Crypto-macro linkage: {m1.category} and {m2.category} share risk-on/risk-off dynamics"
    if {m1.category, m2.category} & {"Rates", "Economics"}:
        return f"Rate-sensitive: Fed policy affects both {m1.category} and {m2.category}"
    if {m1.category, m2.category} & {"Commodities", "Climate"}:
        return f"Supply chain: {m1.category} and {m2.category} linked via physical supply"
    return f"{m1.category} correlates with {m2.category} (similarity={sim:.2f})"


def generate_output(markets, clusters, hidden):
    return {
        "generated_at": datetime.now().isoformat(),
        "task": "T546 (improved from T344)",
        "method": "Multi-dimensional embedding: semantic + volatility + news sentiment",
        "features": ["keyword_semantic", "bid_ask_volatility", "price_implied_sentiment",
                      "category_baseline_sentiment", "volume_weight"],
        "clusters": [
            {
                "id": c.id,
                "label": c.label,
                "markets": c.markets,
                "strength": c.strength,
                "avg_volatility": c.avg_volatility,
                "avg_sentiment": c.avg_sentiment,
                "cross_category": c.cross_category,
                "description": c.description,
            }
            for c in clusters
        ],
        "hidden_correlations": hidden[:10],
        "market_features": {
            m.ticker: {
                "category": m.category,
                "volatility": m.volatility,
                "sentiment": m.sentiment,
                "sentiment_label": m.news_sentiment_label,
                "volume": m.volume,
            }
            for m in markets
        },
        "summary": {
            "total_markets": len(markets),
            "total_clusters": len([c for c in clusters if len(c.markets) >= 2]),
            "singleton_markets": len([c for c in clusters if len(c.markets) == 1]),
            "total_markets_clustered": sum(len(c.markets) for c in clusters if len(c.markets) >= 2),
            "hidden_correlations_found": len(hidden),
            "avg_cluster_strength": round(
                sum(c.strength for c in clusters if len(c.markets) >= 2) /
                max(len([c for c in clusters if len(c.markets) >= 2]), 1), 3),
        },
    }


def main():
    print("Phase 2: LLM Market Clustering Engine v2 (T546)")
    print("Features: semantic + volatility + news sentiment")
    print("=" * 60)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_path = os.path.join(script_dir, "..", "..", "public", "markets_filtered.json")
    output_path = os.path.join(script_dir, "..", "..", "public", "market_clusters.json")

    markets = load_markets(input_path)
    print(f"\nLoaded {len(markets)} markets from Phase 1")

    # Show per-market features
    print(f"\n{'Ticker':30s} {'Cat':14s} {'Vol':>8s} {'Volatility':>10s} {'Sentiment':>10s} {'Label':>10s}")
    print("-" * 86)
    for m in markets:
        print(f"{m.ticker:30s} {m.category:14s} {m.volume:>8d} {m.volatility:>10.3f} {m.sentiment:>10.3f} {m.news_sentiment_label:>10s}")

    # Cluster
    print("\nClustering markets (threshold=0.65)...")
    clusters = cluster_markets(markets, threshold=0.65)
    multi_clusters = [c for c in clusters if len(c.markets) >= 2]
    singletons = [c for c in clusters if len(c.markets) == 1]
    print(f"Found {len(multi_clusters)} clusters + {len(singletons)} singletons")

    # Display clusters
    print("\n" + "=" * 60)
    print("CLUSTERS")
    print("=" * 60)
    for c in multi_clusters:
        print(f"\n[{c.id}] {c.label} (strength={c.strength}, vol={c.avg_volatility}, sent={c.avg_sentiment})")
        for t in c.markets:
            print(f"  - {t}")

    # Hidden correlations
    print("\nFinding cross-category correlations...")
    hidden = find_hidden_correlations(markets, threshold=0.4)
    print(f"Found {len(hidden)} hidden correlations")

    if hidden:
        print("\n" + "=" * 60)
        print("HIDDEN CORRELATIONS (Top 5)")
        print("=" * 60)
        for h in hidden[:5]:
            print(f"\n  {h['market1']} <-> {h['market2']} (r={h['correlation']})")
            print(f"  {h['insight']}")

    # Save output
    output = generate_output(markets, clusters, hidden)
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)

    print(f"\nOutput saved: {output_path}")
    print(f"  Clusters: {output['summary']['total_clusters']}")
    print(f"  Markets clustered: {output['summary']['total_markets_clustered']}")
    print(f"  Avg strength: {output['summary']['avg_cluster_strength']}")
    print(f"  Hidden correlations: {output['summary']['hidden_correlations_found']}")

    return output


if __name__ == '__main__':
    main()
