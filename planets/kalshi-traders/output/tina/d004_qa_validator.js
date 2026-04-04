#!/usr/bin/env node
/**
 * T539: D004 Pipeline Data Chain QA Validator
 * Validates Phase 1 → Phase 2 → Phase 3 data chain integrity
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const check = (pass) => pass ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
const warn = `${colors.yellow}⚠${colors.reset}`;

class D004QAValidator {
  constructor() {
    this.results = {
      phase1: { passed: 0, failed: 0, issues: [] },
      phase2: { passed: 0, failed: 0, issues: [] },
      phase3: { passed: 0, failed: 0, issues: [] },
      chain: { passed: 0, failed: 0, issues: [] }
    };
    this.data = {};
  }

  log(section, message, isError = false) {
    if (isError) {
      this.results[section].issues.push(message);
      this.results[section].failed++;
      console.log(`  ${check(false)} ${message}`);
    } else {
      this.results[section].passed++;
      console.log(`  ${check(true)} ${message}`);
    }
  }

  loadJSON(filepath, name) {
    try {
      const content = fs.readFileSync(filepath, 'utf8');
      const data = JSON.parse(content);
      console.log(`${colors.cyan}Loaded ${name}:${colors.reset} ${filepath}`);
      return data;
    } catch (err) {
      console.log(`${colors.red}ERROR: Failed to load ${name} from ${filepath}:${colors.reset} ${err.message}`);
      return null;
    }
  }

  validatePhase1() {
    console.log(`\n${colors.blue}=== PHASE 1: Market Filtering Validation ===${colors.reset}`);
    
    const data = this.data.phase1;
    if (!data) {
      console.log(`${colors.red}Phase 1 data missing${colors.reset}`);
      return false;
    }

    // Check required fields
    const requiredFields = ['generated_at', 'phase', 'config', 'summary', 'qualifying_markets'];
    requiredFields.forEach(field => {
      this.log('phase1', `Has required field: ${field}`, !data[field]);
    });

    // Validate config
    if (data.config) {
      this.log('phase1', `Config has minVolume: ${data.config.minVolume}`, !data.config.minVolume);
      this.log('phase1', `Config has targetRanges`, !data.config.targetRanges);
      this.log('phase1', `Config has excludedRange`, !data.config.excludedRange);
    }

    // Validate summary
    if (data.summary) {
      this.log('phase1', `Summary has total_markets: ${data.summary.total_markets}`, 
        typeof data.summary.total_markets !== 'number');
      this.log('phase1', `Summary has qualifying_markets: ${data.summary.qualifying_markets}`, 
        typeof data.summary.qualifying_markets !== 'number');
    }

    // Validate qualifying markets format
    if (Array.isArray(data.qualifying_markets)) {
      this.log('phase1', `Qualifying markets count: ${data.qualifying_markets.length}`, 
        data.qualifying_markets.length === 0);

      // Check each market has required fields
      const requiredMarketFields = ['ticker', 'title', 'category', 'volume', 'yes_ratio'];
      let allMarketsValid = true;
      data.qualifying_markets.forEach((market, idx) => {
        requiredMarketFields.forEach(field => {
          if (!market[field]) {
            this.log('phase1', `Market ${idx} missing field: ${field}`, true);
            allMarketsValid = false;
          }
        });
        
        // Validate yes_ratio is in target range (15-30 or 70-85)
        if (market.yes_ratio !== undefined) {
          const inTargetRange = (market.yes_ratio >= 15 && market.yes_ratio <= 30) || 
                               (market.yes_ratio >= 70 && market.yes_ratio <= 85);
          if (!inTargetRange) {
            this.log('phase1', `Market ${market.ticker} yes_ratio ${market.yes_ratio} outside target ranges`, true);
            allMarketsValid = false;
          }
        }
        
        // Validate volume >= 10000
        if (market.volume !== undefined && market.volume < 10000) {
          this.log('phase1', `Market ${market.ticker} volume ${market.volume} below threshold`, true);
          allMarketsValid = false;
        }
      });
      
      if (allMarketsValid) {
        this.log('phase1', `All ${data.qualifying_markets.length} markets have valid format and filters`);
      }
    } else {
      this.log('phase1', 'qualifying_markets is not an array', true);
    }

    // Collect tickers for chain validation
    this.data.phase1Tickers = new Set(
      (data.qualifying_markets || []).map(m => m.ticker)
    );

    return this.results.phase1.failed === 0;
  }

  validatePhase2() {
    console.log(`\n${colors.blue}=== PHASE 2: Market Clustering Validation ===${colors.reset}`);
    
    const data = this.data.phase2;
    if (!data) {
      console.log(`${colors.red}Phase 2 data missing${colors.reset}`);
      return false;
    }

    // Check required fields
    const requiredFields = ['generated_at', 'clusters', 'summary'];
    requiredFields.forEach(field => {
      this.log('phase2', `Has required field: ${field}`, !data[field]);
    });

    // Validate clusters
    if (Array.isArray(data.clusters)) {
      this.log('phase2', `Clusters count: ${data.clusters.length}`, data.clusters.length === 0);

      // Collect all tickers from clusters
      const clusterTickers = new Set();
      let allClustersValid = true;

      data.clusters.forEach((cluster, idx) => {
        // Check cluster has required fields
        if (!cluster.id || !cluster.label || !Array.isArray(cluster.markets)) {
          this.log('phase2', `Cluster ${idx} missing required fields`, true);
          allClustersValid = false;
          return;
        }

        // Validate all markets in cluster come from Phase 1
        cluster.markets.forEach(ticker => {
          clusterTickers.add(ticker);
          if (!this.data.phase1Tickers.has(ticker)) {
            this.log('phase2', `Cluster "${cluster.id}" contains non-Phase1 ticker: ${ticker}`, true);
            allClustersValid = false;
          }
        });
      });

      if (allClustersValid) {
        this.log('phase2', `All cluster markets originate from Phase 1`);
      }

      // Check for orphaned Phase 1 markets (not in any cluster)
      const orphaned = [...this.data.phase1Tickers].filter(t => !clusterTickers.has(t));
      if (orphaned.length > 0) {
        this.log('phase2', `Orphaned Phase 1 markets (not in clusters): ${orphaned.join(', ')}`);
      }

      this.data.phase2Tickers = clusterTickers;
    } else {
      this.log('phase2', 'clusters is not an array', true);
    }

    return this.results.phase2.failed === 0;
  }

  validatePhase3() {
    console.log(`\n${colors.blue}=== PHASE 3: Correlation Pairs Validation ===${colors.reset}`);
    
    const data = this.data.phase3;
    if (!data) {
      console.log(`${colors.red}Phase 3 data missing${colors.reset}`);
      return false;
    }

    // Check required fields
    const requiredFields = ['generated_at', 'phase', 'data_chain', 'all_pairs'];
    requiredFields.forEach(field => {
      this.log('phase3', `Has required field: ${field}`, !data[field]);
    });

    // Validate data_chain reference
    if (data.data_chain) {
      this.log('phase3', `Data chain references Phase 1: ${data.data_chain.phase1_source}`, 
        !data.data_chain.phase1_source);
      this.log('phase3', `Data chain references Phase 2: ${data.data_chain.phase2_source}`, 
        !data.data_chain.phase2_source);
      this.log('phase3', `Data chain all_tickers_verified: ${data.data_chain.all_tickers_verified}`, 
        data.data_chain.all_tickers_verified !== true);
    }

    // Validate all_pairs
    if (Array.isArray(data.all_pairs)) {
      this.log('phase3', `Correlation pairs count: ${data.all_pairs.length}`, data.all_pairs.length === 0);

      // Collect all tickers from correlation pairs
      const correlationTickers = new Set();
      let allPairsValid = true;
      let arbitrageSignals = 0;

      data.all_pairs.forEach((pair, idx) => {
        // Check pair has required fields
        const requiredPairFields = ['market1', 'market2', 'pearson_r', 'confidence', 'arbitrage'];
        requiredPairFields.forEach(field => {
          if (!pair[field]) {
            this.log('phase3', `Pair ${idx} missing field: ${field}`, true);
            allPairsValid = false;
          }
        });

        // Validate both markets are from Phase 1
        if (pair.market1 && pair.market2) {
          correlationTickers.add(pair.market1);
          correlationTickers.add(pair.market2);

          if (!this.data.phase1Tickers.has(pair.market1)) {
            this.log('phase3', `Pair ${idx} market1 "${pair.market1}" not in Phase 1`, true);
            allPairsValid = false;
          }
          if (!this.data.phase1Tickers.has(pair.market2)) {
            this.log('phase3', `Pair ${idx} market2 "${pair.market2}" not in Phase 1`, true);
            allPairsValid = false;
          }
        }

        // Count arbitrage signals
        if (pair.arbitrage && pair.arbitrage.signal && pair.arbitrage.signal !== 'NO_SIGNAL') {
          arbitrageSignals++;
        }

        // Validate data_chain_verified flag
        if (pair.data_chain_verified !== true) {
          this.log('phase3', `Pair ${idx} (${pair.market1}/${pair.market2}) missing data_chain_verified`, true);
          allPairsValid = false;
        }
      });

      if (allPairsValid) {
        this.log('phase3', `All correlation pairs have valid format and data chain verification`);
      }

      this.log('phase3', `Arbitrage signals detected: ${arbitrageSignals}`);
      this.data.phase3Tickers = correlationTickers;
    } else {
      this.log('phase3', 'all_pairs is not an array', true);
    }

    return this.results.phase3.failed === 0;
  }

  validateChain() {
    console.log(`\n${colors.blue}=== DATA CHAIN TRACEABILITY ===${colors.reset}`);

    // Phase 1 → Phase 2 traceability
    if (this.data.phase1Tickers && this.data.phase2Tickers) {
      const p1Tickers = this.data.phase1Tickers;
      const p2Tickers = this.data.phase2Tickers;
      
      // All Phase 2 tickers should be in Phase 1
      const p2NotInP1 = [...p2Tickers].filter(t => !p1Tickers.has(t));
      if (p2NotInP1.length === 0) {
        this.log('chain', `Phase 2 → Phase 1: All ${p2Tickers.size} clustered tickers traceable`);
      } else {
        this.log('chain', `Phase 2 tickers not in Phase 1: ${p2NotInP1.join(', ')}`, true);
      }
    }

    // Phase 1 → Phase 3 traceability
    if (this.data.phase1Tickers && this.data.phase3Tickers) {
      const p1Tickers = this.data.phase1Tickers;
      const p3Tickers = this.data.phase3Tickers;
      
      // All Phase 3 tickers should be in Phase 1
      const p3NotInP1 = [...p3Tickers].filter(t => !p1Tickers.has(t));
      if (p3NotInP1.length === 0) {
        this.log('chain', `Phase 3 → Phase 1: All ${p3Tickers.size} correlation tickers traceable`);
      } else {
        this.log('chain', `Phase 3 tickers not in Phase 1: ${p3NotInP1.join(', ')}`, true);
      }
    }

    // Phase 2 → Phase 3 relationship (correlation pairs should use clustered markets where applicable)
    if (this.data.phase2Tickers && this.data.phase3Tickers) {
      const p2Tickers = this.data.phase2Tickers;
      const p3Tickers = this.data.phase3Tickers;
      
      // Check overlap
      const overlap = [...p3Tickers].filter(t => p2Tickers.has(t));
      this.log('chain', `Phase 3 tickers also in Phase 2 clusters: ${overlap.length}/${p3Tickers.size}`);
    }

    // Complete ticker list
    console.log(`\n${colors.cyan}Phase 1 Qualifying Tickers (${this.data.phase1Tickers?.size || 0}):${colors.reset}`);
    if (this.data.phase1Tickers) {
      [...this.data.phase1Tickers].sort().forEach(t => console.log(`  - ${t}`));
    }

    return this.results.chain.failed === 0;
  }

  generateReport() {
    const report = [];
    report.push('# D004 Pipeline Data Chain QA Report');
    report.push(`\nGenerated: ${new Date().toISOString()}`);
    report.push(`Task: T539 - QA Validate D004 pipeline data chain end-to-end`);
    report.push(`\n## Summary`);

    const totalPassed = Object.values(this.results).reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = Object.values(this.results).reduce((sum, r) => sum + r.failed, 0);

    report.push(`- **Total Checks**: ${totalPassed + totalFailed}`);
    report.push(`- **Passed**: ${totalPassed}`);
    report.push(`- **Failed**: ${totalFailed}`);
    report.push(`- **Status**: ${totalFailed === 0 ? '✅ PASSED' : '❌ FAILED'}`);

    // Phase 1 details
    report.push(`\n## Phase 1: Market Filtering`);
    report.push(`- Checks Passed: ${this.results.phase1.passed}`);
    report.push(`- Issues Found: ${this.results.phase1.failed}`);
    if (this.data.phase1?.qualifying_markets) {
      report.push(`- Qualifying Markets: ${this.data.phase1.qualifying_markets.length}`);
    }
    if (this.results.phase1.issues.length > 0) {
      report.push(`\n### Issues`);
      this.results.phase1.issues.forEach(issue => report.push(`- ❌ ${issue}`));
    }

    // Phase 2 details
    report.push(`\n## Phase 2: Market Clustering`);
    report.push(`- Checks Passed: ${this.results.phase2.passed}`);
    report.push(`- Issues Found: ${this.results.phase2.failed}`);
    if (this.data.phase2?.clusters) {
      report.push(`- Clusters: ${this.data.phase2.clusters.length}`);
    }
    if (this.results.phase2.issues.length > 0) {
      report.push(`\n### Issues`);
      this.results.phase2.issues.forEach(issue => report.push(`- ❌ ${issue}`));
    }

    // Phase 3 details
    report.push(`\n## Phase 3: Correlation Detection`);
    report.push(`- Checks Passed: ${this.results.phase3.passed}`);
    report.push(`- Issues Found: ${this.results.phase3.failed}`);
    if (this.data.phase3?.all_pairs) {
      report.push(`- Correlation Pairs: ${this.data.phase3.all_pairs.length}`);
      const signals = this.data.phase3.all_pairs.filter(p => 
        p.arbitrage?.signal && p.arbitrage.signal !== 'NO_SIGNAL'
      ).length;
      report.push(`- Arbitrage Signals: ${signals}`);
    }
    if (this.results.phase3.issues.length > 0) {
      report.push(`\n### Issues`);
      this.results.phase3.issues.forEach(issue => report.push(`- ❌ ${issue}`));
    }

    // Chain details
    report.push(`\n## Data Chain Traceability`);
    report.push(`- Checks Passed: ${this.results.chain.passed}`);
    report.push(`- Issues Found: ${this.results.chain.failed}`);
    if (this.results.chain.issues.length > 0) {
      report.push(`\n### Issues`);
      this.results.chain.issues.forEach(issue => report.push(`- ❌ ${issue}`));
    }

    // Ticker mapping
    report.push(`\n## Ticker Traceability Matrix`);
    report.push(`| Phase | Ticker Count | Source |`);
    report.push(`|-------|-------------|--------|`);
    report.push(`| Phase 1 (Filtered) | ${this.data.phase1Tickers?.size || 0} | markets_filtered.json |`);
    report.push(`| Phase 2 (Clustered) | ${this.data.phase2Tickers?.size || 0} | market_clusters.json |`);
    report.push(`| Phase 3 (Correlated) | ${this.data.phase3Tickers?.size || 0} | correlation_pairs.json |`);

    report.push(`\n## Conclusion`);
    if (totalFailed === 0) {
      report.push(`✅ **DATA CHAIN VALID**: All phases properly linked. Every ticker in Phase 2 and Phase 3 traces back to Phase 1 qualifying markets.`);
    } else {
      report.push(`❌ **DATA CHAIN BROKEN**: ${totalFailed} issue(s) found that break the data chain traceability.`);
    }

    return report.join('\n');
  }

  run() {
    console.log(`${colors.cyan}========================================`);
    console.log(`D004 Pipeline Data Chain QA Validator`);
    console.log(`Task T539 - End-to-End Validation`);
    console.log(`========================================${colors.reset}\n`);

    // Load data files
    const basePath = '/Users/chenyangcui/Documents/code/aicompany/planets/kalshi-traders/agents/public';
    this.data.phase1 = this.loadJSON(path.join(basePath, 'markets_filtered.json'), 'Phase 1 (Market Filtering)');
    this.data.phase2 = this.loadJSON(path.join(basePath, 'market_clusters.json'), 'Phase 2 (Market Clustering)');
    this.data.phase3 = this.loadJSON(path.join(basePath, 'correlation_pairs.json'), 'Phase 3 (Correlation Pairs)');

    // Run validations
    const p1Valid = this.validatePhase1();
    const p2Valid = this.validatePhase2();
    const p3Valid = this.validatePhase3();
    const chainValid = this.validateChain();

    // Generate and save report
    const report = this.generateReport();
    const reportPath = path.join(__dirname, 'd004_qa_report.md');
    fs.writeFileSync(reportPath, report);

    // Final summary
    console.log(`\n${colors.cyan}========================================`);
    console.log(`QA Validation Complete`);
    console.log(`========================================${colors.reset}`);
    
    const totalPassed = Object.values(this.results).reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = Object.values(this.results).reduce((sum, r) => sum + r.failed, 0);
    
    console.log(`Total Checks: ${totalPassed + totalFailed}`);
    console.log(`${colors.green}Passed: ${totalPassed}${colors.reset}`);
    console.log(`${totalFailed > 0 ? colors.red : colors.green}Failed: ${totalFailed}${colors.reset}`);
    console.log(`\nReport saved to: ${reportPath}`);

    return totalFailed === 0;
  }
}

// Run validation
const validator = new D004QAValidator();
const success = validator.run();
process.exit(success ? 0 : 1);
