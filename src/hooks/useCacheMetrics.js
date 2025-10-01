import { useState, useEffect, useCallback } from 'react';

// Constants
const METRICS_STORAGE_KEY = 'cache_analytics_metrics';
const HISTORICAL_DATA_KEY = 'cache_analytics_historical';
const MAX_HISTORICAL_ENTRIES = 100; // Keep last 100 entries

/**
 * React hook for cache analytics
 * Tracks cache hit/miss ratios, API usage statistics, cache size, and performance trends
 */
const useCacheMetrics = () => {
  // State for current metrics
  const [metrics, setMetrics] = useState({
    hits: 0,
    misses: 0,
    apiCalls: 0,
    cacheSize: 0,
    totalRequests: 0,
    averageResponseTime: 0,
    hitRate: 0,
    missRate: 0,
    lastUpdated: new Date(),
    peakUsageTime: null,
    currentUsage: 0
  });

  // State for historical data
  const [historicalData, setHistoricalData] = useState([]);
  
  // State for optimization recommendations
  const [recommendations, setRecommendations] = useState([]);

  // Load metrics from localStorage on mount
  useEffect(() => {
    const savedMetrics = localStorage.getItem(METRICS_STORAGE_KEY);
    if (savedMetrics) {
      try {
        const parsedMetrics = JSON.parse(savedMetrics);
        setMetrics(parsedMetrics);
      } catch (error) {
        console.error('Error parsing saved metrics:', error);
        // Reset to default if parsing fails
        setMetrics({
          hits: 0,
          misses: 0,
          apiCalls: 0,
          cacheSize: 0,
          totalRequests: 0,
          averageResponseTime: 0,
          hitRate: 0,
          missRate: 0,
          lastUpdated: new Date(),
          peakUsageTime: null,
          currentUsage: 0
        });
      }
    }

    const savedHistoricalData = localStorage.getItem(HISTORICAL_DATA_KEY);
    if (savedHistoricalData) {
      try {
        const parsedHistorical = JSON.parse(savedHistoricalData);
        setHistoricalData(parsedHistorical);
      } catch (error) {
        console.error('Error parsing saved historical data:', error);
        setHistoricalData([]);
      }
    }
  }, []);

  // Save metrics to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(metrics));
  }, [metrics]);

  // Save historical data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(HISTORICAL_DATA_KEY, JSON.stringify(historicalData));
  }, [historicalData]);

  // Calculate derived metrics
  useEffect(() => {
    setMetrics(prevMetrics => {
      const totalRequests = prevMetrics.hits + prevMetrics.misses;
      const hitRate = totalRequests > 0 ? (prevMetrics.hits / totalRequests) * 100 : 0;
      const missRate = totalRequests > 0 ? (prevMetrics.misses / totalRequests) * 100 : 0;

      return {
        ...prevMetrics,
        totalRequests,
        hitRate,
        missRate
      };
    });
  }, [metrics.hits, metrics.misses]);

  /**
   * Update hit count
   */
  const recordHit = useCallback((responseTime = 0) => {
    setMetrics(prev => {
      const newHits = prev.hits + 1;
      const totalRequests = newHits + prev.misses;
      const newAverageResponseTime = totalRequests > 1 
        ? (prev.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests
        : responseTime;

      return {
        ...prev,
        hits: newHits,
        averageResponseTime: newAverageResponseTime,
        currentUsage: prev.currentUsage + 1,
        lastUpdated: new Date()
      };
    });

    // Add to historical data
    addToHistoricalData('hit', responseTime);
  }, []);

  /**
   * Update miss count
   */
  const recordMiss = useCallback((responseTime = 0) => {
    setMetrics(prev => {
      const newMisses = prev.misses + 1;
      const totalRequests = prev.hits + newMisses;
      const newAverageResponseTime = totalRequests > 1 
        ? (prev.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests
        : responseTime;

      return {
        ...prev,
        misses: newMisses,
        averageResponseTime: newAverageResponseTime,
        currentUsage: prev.currentUsage + 1,
        lastUpdated: new Date()
      };
    });

    // Add to historical data
    addToHistoricalData('miss', responseTime);
  }, []);

  /**
   * Update API call count
   */
  const recordApiCall = useCallback((responseTime = 0) => {
    setMetrics(prev => ({
      ...prev,
      apiCalls: prev.apiCalls + 1,
      lastUpdated: new Date()
    }));

    // Add to historical data
    addToHistoricalData('api_call', responseTime);
  }, []);

  /**
   * Update cache size
   */
  const updateCacheSize = useCallback((size) => {
    setMetrics(prev => ({
      ...prev,
      cacheSize: size,
      lastUpdated: new Date()
    }));
  }, []);

  /**
   * Add data point to historical data
   */
  const addToHistoricalData = useCallback((type, responseTime) => {
    const newEntry = {
      timestamp: new Date(),
      type,
      responseTime,
      hits: metrics.hits,
      misses: metrics.misses,
      apiCalls: metrics.apiCalls,
      totalRequests: metrics.hits + metrics.misses
    };

    setHistoricalData(prev => {
      const updated = [newEntry, ...prev];
      // Keep only the most recent entries
      return updated.slice(0, MAX_HISTORICAL_ENTRIES);
    });
  }, [metrics.hits, metrics.misses, metrics.apiCalls]);

  /**
   * Calculate cache optimization recommendations
   */
  const calculateRecommendations = useCallback(() => {
    const recommendations = [];
    const hitRate = metrics.totalRequests > 0 ? (metrics.hits / metrics.totalRequests) * 100 : 0;
    
    // Cache hit rate recommendation
    if (hitRate < 70) {
      recommendations.push({
        id: 'low_hit_rate',
        message: 'Cache hit rate is low. Consider increasing cache size or adjusting TTL.',
        severity: 'high'
      });
    } else if (hitRate < 85) {
      recommendations.push({
        id: 'moderate_hit_rate',
        message: 'Cache hit rate could be improved. Review cache strategy.',
        severity: 'medium'
      });
    }

    // Cache size recommendation
    if (metrics.cacheSize > 0.8 * localStorage.length) { // Rough estimate of storage usage
      recommendations.push({
        id: 'cache_size',
        message: 'Cache size approaching storage limits. Consider implementing LRU eviction.',
        severity: 'high'
      });
    }

    // API usage recommendation
    if (metrics.apiCalls > 800) { // Assuming some limit
      recommendations.push({
        id: 'api_usage',
        message: 'High API usage detected. Consider increasing cache TTL to reduce API calls.',
        severity: 'medium'
      });
    }

    // Performance recommendation
    if (metrics.averageResponseTime > 1000) { // More than 1 second
      recommendations.push({
        id: 'performance',
        message: 'Slow response times detected. Consider pre-fetching popular items or optimizing cache retrieval.',
        severity: 'medium'
      });
    }

    setRecommendations(recommendations);
    return recommendations;
  }, [metrics]);

  /**
   * Export metrics data
   */
  const exportMetrics = useCallback(() => {
    const exportData = {
      currentMetrics: metrics,
      historicalData: historicalData,
      recommendations: recommendations,
      exportTimestamp: new Date().toISOString()
    };

    // Create and download a JSON file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `cache-metrics-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    return exportData;
  }, [metrics, historicalData, recommendations]);

  /**
   * Reset all metrics
   */
  const resetMetrics = useCallback(() => {
    setMetrics({
      hits: 0,
      misses: 0,
      apiCalls: 0,
      cacheSize: 0,
      totalRequests: 0,
      averageResponseTime: 0,
      hitRate: 0,
      missRate: 0,
      lastUpdated: new Date(),
      peakUsageTime: null,
      currentUsage: 0
    });
    setHistoricalData([]);
    setRecommendations([]);
  }, []);

  /**
   * Get cache size in localStorage
   */
  const getLocalStorageCacheSize = useCallback(() => {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  }, []);

  // Calculate recommendations whenever metrics change
  useEffect(() => {
    calculateRecommendations();
  }, [calculateRecommendations]);

  return {
    metrics,
    historicalData,
    recommendations,
    recordHit,
    recordMiss,
    recordApiCall,
    updateCacheSize,
    exportMetrics,
    resetMetrics,
    getLocalStorageCacheSize
  };
};

export default useCacheMetrics;