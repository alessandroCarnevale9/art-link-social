const BASE_URL = "/api/met";

// Rate limiter più aggressivo per MET API
class ConservativeRateLimiter {
  constructor(maxRequests = 60, timeWindow = 60000) {
    // Ridotto a 60 req/min
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = [];
    this.retryDelay = 2000; // Inizia con 2 secondi
    this.maxRetryDelay = 60000; // Max 60 secondi
    this.minRequestInterval = 1500; // Minimo 1.5 secondi tra richieste
    this.lastRequestTime = 0;
  }

  async waitForSlot() {
    const now = Date.now();

    // Remove old requests outside time window
    this.requests = this.requests.filter(
      (time) => now - time < this.timeWindow
    );

    // Ensure minimum interval between requests
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(`Enforcing minimum interval, waiting ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.waitForSlot();
    }

    // Check if we're at capacity
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.timeWindow - (now - oldestRequest) + 500; // Increased buffer

      console.log(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.waitForSlot();
    }

    this.requests.push(now);
    this.lastRequestTime = Date.now();
  }

  async executeWithBackoff(requestFn, maxRetries = 5) {
    // Aumentato a 5 retry
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.waitForSlot();
        const result = await requestFn();

        // Reset retry delay on success
        this.retryDelay = 2000;
        return result;
      } catch (error) {
        const isRateLimit =
          error.message.includes("429") ||
          error.message.includes("Too Many") ||
          error.status === 429;

        if (isRateLimit) {
          if (attempt === maxRetries) throw error;

          console.warn(
            `Rate limited (attempt ${attempt + 1}/${maxRetries}), backing off ${
              this.retryDelay
            }ms`
          );

          await new Promise((resolve) => setTimeout(resolve, this.retryDelay));

          // Exponential backoff più aggressivo
          this.retryDelay = Math.min(
            this.retryDelay * 2.5 + Math.random() * 2000,
            this.maxRetryDelay
          );
        } else {
          throw error;
        }
      }
    }
  }

  // Metodo per ottenere stato dettagliato
  getStatus() {
    const now = Date.now();
    const recentRequests = this.requests.filter(
      (time) => now - time < this.timeWindow
    );

    return {
      requestsInWindow: recentRequests.length,
      maxRequests: this.maxRequests,
      remainingRequests: this.maxRequests - recentRequests.length,
      timeSinceLastRequest: now - this.lastRequestTime,
      minInterval: this.minRequestInterval,
      currentRetryDelay: this.retryDelay,
      canMakeRequest:
        recentRequests.length < this.maxRequests &&
        now - this.lastRequestTime >= this.minRequestInterval,
    };
  }
}

// Cache migliorata con TTL più lunghi
class OptimizedCache {
  constructor(defaultTtl = 60 * 60 * 1000) {
    // 1 ora di default
    this.cache = new Map();
    this.defaultTtl = defaultTtl;
    this.accessCount = new Map();
    this.hitCount = 0;
    this.missCount = 0;
  }

  set(key, value, customTtl = null) {
    const ttl = customTtl || this.defaultTtl;
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl: ttl,
      hits: 0,
    });
    this.accessCount.set(key, 0);
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) {
      this.missCount++;
      return null;
    }

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.accessCount.delete(key);
      this.missCount++;
      return null;
    }

    item.hits++;
    this.accessCount.set(key, this.accessCount.get(key) + 1);
    this.hitCount++;
    return item.data;
  }

  has(key) {
    return this.get(key) !== null;
  }

  getStats() {
    const totalRequests = this.hitCount + this.missCount;
    return {
      size: this.cache.size,
      hitRate:
        totalRequests > 0
          ? ((this.hitCount / totalRequests) * 100).toFixed(2)
          : 0,
      hits: this.hitCount,
      misses: this.missCount,
      totalRequests,
    };
  }

  evictLRU(maxSize = 500) {
    // Ridotto per essere più conservativo
    if (this.cache.size <= maxSize) return;

    const entries = Array.from(this.accessCount.entries())
      .sort((a, b) => a[1] - b[1])
      .slice(0, this.cache.size - maxSize);

    entries.forEach(([key]) => {
      this.cache.delete(key);
      this.accessCount.delete(key);
    });
  }
}

// Instanze globali con configurazione conservativa
const rateLimiter = new ConservativeRateLimiter(60, 60000); // 60 req/min
const artworkCache = new OptimizedCache(90 * 60 * 1000); // 90 minuti
const pendingRequests = new Map();

// Fetch sicuro con headers ottimizzati
const safeFetch = async (url, options = {}) => {
  // Deduplication
  if (pendingRequests.has(url)) {
    console.log(`Deduplicating request to ${url}`);
    return pendingRequests.get(url);
  }

  const requestPromise = rateLimiter.executeWithBackoff(async () => {
    // Headers più realistici
    const headers = {
      Accept: "application/json",
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: "https://www.metmuseum.org/",
      Origin: "https://www.metmuseum.org",
      "Cache-Control": "max-age=3600",
      DNT: "1",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-site",
      ...options.headers,
    };

    console.log(`Making request to: ${url}`);
    const response = await fetch(url, {
      ...options,
      headers,
      timeout: 30000, // 30 secondi timeout
    });

    if (response.status === 429) {
      console.error("429 Too Many Requests received");
      throw new Error("429 Too Many Requests");
    }

    if (response.status === 403) {
      console.error("403 Forbidden received");
      throw new Error("403 Forbidden - Possible IP block");
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Invalid content type received");
    }

    return response.json();
  });

  pendingRequests.set(url, requestPromise);

  try {
    const result = await requestPromise;
    console.log(`Successfully fetched: ${url}`);
    return result;
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error.message);
    throw error;
  } finally {
    pendingRequests.delete(url);
  }
};

// Search con cache più aggressiva
export const searchArtworks = async (query, hasImages = true) => {
  const cacheKey = `search_${query}_${hasImages}`;

  if (artworkCache.has(cacheKey)) {
    console.log(`Cache hit for search: ${query}`);
    return artworkCache.get(cacheKey);
  }

  const url = `${BASE_URL}/search?hasImages=${hasImages}&q=${encodeURIComponent(
    query
  )}`;

  try {
    const data = await safeFetch(url);
    const objectIDs = data.objectIDs || [];

    // Cache search results per 2 ore (sono costosi da ottenere)
    artworkCache.set(cacheKey, objectIDs, 2 * 60 * 60 * 1000);

    console.log(`Search for "${query}" returned ${objectIDs.length} results`);
    return objectIDs;
  } catch (error) {
    console.error("Search failed:", error);
    throw error;
  }
};

// Artwork details con cache ottimizzato
export const getArtworkDetails = async (id) => {
  const cacheKey = `artwork_${id}`;

  if (artworkCache.has(cacheKey)) {
    return artworkCache.get(cacheKey);
  }

  const url = `${BASE_URL}/objects/${id}`;

  try {
    const data = await safeFetch(url);

    if (data && data.objectID) {
      // Cache successful results per 2 ore
      artworkCache.set(cacheKey, data, 2 * 60 * 60 * 1000);
    } else {
      // Cache null results per 30 minuti
      artworkCache.set(cacheKey, null, 30 * 60 * 1000);
    }

    return data;
  } catch (error) {
    if (error.message.includes("404")) {
      // Cache 404s per 1 ora
      artworkCache.set(cacheKey, null, 60 * 60 * 1000);
      return null;
    }
    throw error;
  }
};

// Batch processing completamente ridisegnato
export const getMultipleArtworks = async (objectIds, options = {}) => {
  const {
    maxConcurrent = 1, // DRASTICAMENTE ridotto - solo 1 richiesta alla volta!
    batchSize = 5, // Batch più piccoli
    priority = "normal",
  } = options;

  console.log(`Processing ${objectIds.length} artworks sequentially`);

  const results = [];
  const errors = [];

  // Processa uno alla volta per evitare rate limiting
  for (let i = 0; i < objectIds.length; i++) {
    const id = objectIds[i];

    try {
      const artwork = await getArtworkDetails(id);

      if (!artwork || !artwork.primaryImageSmall) {
        continue;
      }

      results.push({
        id: artwork.objectID,
        src: artwork.primaryImageSmall,
        alt: artwork.title || "Untitled",
        title: artwork.title || "Untitled",
        artist: artwork.artistDisplayName || "Unknown Artist",
        date: artwork.objectDate || "Unknown Date",
        culture: artwork.culture || "",
        medium: artwork.medium || "",
        dimensions: artwork.dimensions || "",
        department: artwork.department || "",
        classification: artwork.classification || "",
        creditLine: artwork.creditLine || "",
        repository: artwork.repository || "",
        objectURL: artwork.objectURL || "",
        tags: artwork.tags || [],
      });

      // Progress logging ogni 5 elementi
      if ((i + 1) % 5 === 0) {
        console.log(`Processed ${i + 1}/${objectIds.length} artworks`);

        // Status del rate limiter
        const status = rateLimiter.getStatus();
        console.log(`Rate limiter status:`, status);

        // Se stiamo arrivando al limite, pausa più lunga
        if (status.remainingRequests < 10) {
          console.log("Approaching rate limit, taking longer break...");
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    } catch (error) {
      console.warn(`Failed to process artwork ${id}:`, error.message);
      errors.push({ id, error: error.message });

      // Se otteniamo un 429, pausa più lunga
      if (error.message.includes("429")) {
        console.log("429 error detected, taking extended break...");
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }
  }

  // Clean up cache
  artworkCache.evictLRU(500);

  const cacheStats = artworkCache.getStats();
  console.log(`Cache stats:`, cacheStats);
  console.log(
    `Successfully processed ${results.length}/${objectIds.length} artworks`
  );

  if (errors.length > 0) {
    console.warn(`${errors.length} errors encountered during processing`);
  }

  return results;
};

// Progressive loading ridisegnato
export const getMultipleArtworksProgressive = async (
  objectIds,
  onProgress = null,
  options = {}
) => {
  const results = [];
  const batchSize = Math.min(options.batchSize || 3, 3); // Max 3 alla volta

  for (let i = 0; i < objectIds.length; i += batchSize) {
    const batch = objectIds.slice(i, i + batchSize);

    console.log(
      `Processing progressive batch ${Math.floor(i / batchSize) + 1}`
    );

    const batchResults = await getMultipleArtworks(batch, {
      ...options,
      maxConcurrent: 1, // Sequenziale
    });

    results.push(...batchResults);

    if (onProgress) {
      onProgress({
        loaded: results.length,
        total: objectIds.length,
        batch: batchResults,
        progress: (i + batch.length) / objectIds.length,
      });
    }

    // Pausa tra batch più lunga
    if (i + batchSize < objectIds.length) {
      const pauseTime = 2000; // 2 secondi tra batch
      console.log(`Pausing ${pauseTime}ms between batches...`);
      await new Promise((resolve) => setTimeout(resolve, pauseTime));
    }
  }

  return results;
};

// Search principale con limit più bassi
export const searchAndGetArtworks = async (
  query,
  limit = 10, // Ridotto da 20 a 10
  offset = 0,
  onProgress = null
) => {
  try {
    console.log(
      `Searching for: "${query}" (limit: ${limit}, offset: ${offset})`
    );

    const objectIds = await searchArtworks(query);

    if (!objectIds || objectIds.length === 0) {
      return {
        artworks: [],
        total: 0,
        hasMore: false,
        nextOffset: 0,
      };
    }

    const paginatedIds = objectIds.slice(offset, offset + limit);
    console.log(`Selected ${paginatedIds.length} IDs for processing`);

    let artworks;
    if (onProgress) {
      artworks = await getMultipleArtworksProgressive(
        paginatedIds,
        onProgress,
        { priority: "normal", batchSize: 3 }
      );
    } else {
      artworks = await getMultipleArtworks(paginatedIds, {
        priority: "normal",
      });
    }

    return {
      artworks,
      total: objectIds.length,
      hasMore: offset + limit < objectIds.length,
      nextOffset: offset + limit,
      cached: artworkCache.cache.size,
      cacheStats: artworkCache.getStats(),
      rateLimitStatus: rateLimiter.getStatus(),
    };
  } catch (error) {
    console.error("Error in searchAndGetArtworks:", error);
    return {
      artworks: [],
      total: 0,
      hasMore: false,
      error: error.message,
      rateLimitStatus: rateLimiter.getStatus(),
    };
  }
};

// Utility functions migliorate
export const getRateLimitStatus = () => {
  return rateLimiter.getStatus();
};

export const getCacheStatus = () => {
  return artworkCache.getStats();
};

export const clearAllCaches = () => {
  artworkCache.cache.clear();
  artworkCache.accessCount.clear();
  artworkCache.hitCount = 0;
  artworkCache.missCount = 0;
  pendingRequests.clear();
  console.log("All caches cleared");
};

// Export costanti
export const POPULAR_QUERIES = [
  "painting",
  "sculpture",
  "photography",
  "american",
  "european",
  "asian",
  "ancient",
  "modern",
  "portrait",
  "landscape",
];

export const DEPARTMENT_IDS = {
  "american-decorative-arts": 1,
  "ancient-near-eastern": 2,
  "arms-armor": 3,
  "arts-africa-oceania-americas": 4,
  "asian-art": 5,
  "european-paintings": 9,
  "european-sculpture": 10,
  "greek-roman": 11,
  islamic: 12,
  medieval: 15,
  photographs: 17,
  "modern-art": 19,
};
