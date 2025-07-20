const BASE_URL = "/api/met";

// Rate limiter ottimizzato e più stabile
class RateLimiter {
  constructor(maxRequests = 80, timeWindow = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = [];
    this.retryDelay = 1000; // Inizia con 1 secondo
    this.maxRetryDelay = 30000; // Max 30 secondi
    this.minRequestInterval = 800; // Minimo 800ms tra richieste
    this.lastRequestTime = 0;
  }

  async waitForSlot() {
    const now = Date.now();

    // Rimuovi richieste vecchie
    this.requests = this.requests.filter(
      (time) => now - time < this.timeWindow
    );

    // Assicurati dell'intervallo minimo tra richieste
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.waitForSlot();
    }

    // Controlla se siamo al limite
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.timeWindow - (now - oldestRequest) + 100;

      console.log(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.waitForSlot();
    }

    this.requests.push(now);
    this.lastRequestTime = Date.now();
  }

  async executeWithBackoff(requestFn, maxRetries = 3) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.waitForSlot();
        const result = await requestFn();

        // Reset retry delay on success
        this.retryDelay = 1000;
        return result;
      } catch (error) {
        const isRateLimit =
          error.message.includes("429") ||
          error.message.includes("Too Many") ||
          error.status === 429;

        if (isRateLimit && attempt < maxRetries) {
          console.warn(
            `Rate limited (attempt ${attempt + 1}/${
              maxRetries + 1
            }), backing off ${this.retryDelay}ms`
          );

          await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
          this.retryDelay = Math.min(this.retryDelay * 2, this.maxRetryDelay);
        } else {
          throw error;
        }
      }
    }
  }

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
      canMakeRequest: recentRequests.length < this.maxRequests,
    };
  }
}

// Cache semplificata ma efficace
class ArtworkCache {
  constructor(defaultTtl = 60 * 60 * 1000) {
    // 1 ora
    this.cache = new Map();
    this.defaultTtl = defaultTtl;
    this.hitCount = 0;
    this.missCount = 0;
  }

  set(key, value, customTtl = null) {
    const ttl = customTtl || this.defaultTtl;
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl: ttl,
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) {
      this.missCount++;
      return null;
    }

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

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

  clear() {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }
}

// Instanze globali
const rateLimiter = new RateLimiter(80, 60000); // 80 req/min
const artworkCache = new ArtworkCache(90 * 60 * 1000); // 90 minuti

// Fetch con gestione errori migliorata
const safeFetch = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 secondi timeout

  try {
    return await rateLimiter.executeWithBackoff(async () => {
      const headers = {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        ...options.headers,
      };

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      if (response.status === 429) {
        throw new Error("429 Too Many Requests");
      }

      if (response.status === 404) {
        throw new Error("404 Not Found");
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error("Invalid content type received");
      }

      return response.json();
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

// Search con cache
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

    // Cache per 2 ore
    artworkCache.set(cacheKey, objectIDs, 2 * 60 * 60 * 1000);

    console.log(`Search for "${query}" returned ${objectIDs.length} results`);
    return objectIDs;
  } catch (error) {
    console.error("Search failed:", error);
    throw error;
  }
};

// Get artwork details con cache
export const getArtworkDetails = async (id) => {
  const cacheKey = `artwork_${id}`;

  if (artworkCache.has(cacheKey)) {
    return artworkCache.get(cacheKey);
  }

  const url = `${BASE_URL}/objects/${id}`;

  try {
    const data = await safeFetch(url);

    if (data && data.objectID) {
      // Cache per 2 ore se valido
      artworkCache.set(cacheKey, data, 2 * 60 * 60 * 1000);
    } else {
      // Cache null per 30 minuti
      artworkCache.set(cacheKey, null, 30 * 60 * 1000);
    }

    return data;
  } catch (error) {
    if (error.message.includes("404")) {
      // Cache 404 per 1 ora
      artworkCache.set(cacheKey, null, 60 * 60 * 1000);
      return null;
    }
    throw error;
  }
};

// Batch processing sequenziale per evitare rate limiting
export const getMultipleArtworks = async (objectIds, options = {}) => {
  console.log(`Processing ${objectIds.length} artworks sequentially`);

  const results = [];
  const errors = [];

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

      // Log progresso ogni 5 elementi
      if ((i + 1) % 5 === 0) {
        console.log(`Processed ${i + 1}/${objectIds.length} artworks`);
      }
    } catch (error) {
      console.warn(`Failed to process artwork ${id}:`, error.message);
      errors.push({ id, error: error.message });

      // Pausa più lunga in caso di errore 429
      if (error.message.includes("429")) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  console.log(
    `Successfully processed ${results.length}/${objectIds.length} artworks`
  );

  if (errors.length > 0) {
    console.warn(`${errors.length} errors encountered`);
  }

  return results;
};

// Progressive loading corretto
export const getMultipleArtworksProgressive = async (
  objectIds,
  onProgress = null,
  options = {}
) => {
  const batchSize = Math.min(options.batchSize || 5, 10);
  const totalBatches = Math.ceil(objectIds.length / batchSize);
  const allResults = [];

  console.log(
    `Starting progressive loading: ${objectIds.length} items in ${totalBatches} batches`
  );

  for (let i = 0; i < objectIds.length; i += batchSize) {
    const batch = objectIds.slice(i, i + batchSize);
    const currentBatchNumber = Math.floor(i / batchSize) + 1;

    console.log(`Processing batch ${currentBatchNumber}/${totalBatches}`);

    try {
      const batchResults = await getMultipleArtworks(batch, options);
      allResults.push(...batchResults);

      // Calcola progresso
      const itemsProcessed = Math.min(i + batchSize, objectIds.length);
      const progressPercentage = itemsProcessed / objectIds.length;

      if (onProgress) {
        onProgress({
          itemsProcessed,
          totalItems: objectIds.length,
          resultCount: allResults.length,
          batch: batchResults, // Solo i risultati del batch corrente
          batchNumber: currentBatchNumber,
          totalBatches,
          progress: progressPercentage,
          isComplete: itemsProcessed >= objectIds.length,
        });
      }

      // Pausa tra batch (tranne l'ultimo)
      if (i + batchSize < objectIds.length) {
        const pauseTime = 1500;
        console.log(`Pausing ${pauseTime}ms between batches...`);
        await new Promise((resolve) => setTimeout(resolve, pauseTime));
      }
    } catch (error) {
      console.error(`Error in batch ${currentBatchNumber}:`, error);
      // Continua con il prossimo batch invece di interrompere tutto
    }
  }

  console.log(
    `Progressive loading completed: ${allResults.length} valid artworks from ${objectIds.length} IDs`
  );

  return allResults;
};

// Search principale
export const searchAndGetArtworks = async (
  query,
  limit = 20,
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
        nextOffset: offset,
      };
    }

    const paginatedIds = objectIds.slice(offset, offset + limit);
    console.log(`Selected ${paginatedIds.length} IDs for processing`);

    let artworks;
    if (onProgress) {
      artworks = await getMultipleArtworksProgressive(
        paginatedIds,
        onProgress,
        { batchSize: 5 }
      );
    } else {
      artworks = await getMultipleArtworks(paginatedIds);
    }

    return {
      artworks,
      total: objectIds.length,
      hasMore: offset + limit < objectIds.length,
      nextOffset: offset + limit,
      cacheStats: artworkCache.getStats(),
      rateLimitStatus: rateLimiter.getStatus(),
    };
  } catch (error) {
    console.error("Error in searchAndGetArtworks:", error);
    return {
      artworks: [],
      total: 0,
      hasMore: false,
      nextOffset: offset,
      error: error.message,
      rateLimitStatus: rateLimiter.getStatus(),
    };
  }
};

// Utility functions
export const getRateLimitStatus = () => rateLimiter.getStatus();
export const getCacheStatus = () => artworkCache.getStats();
export const clearAllCaches = () => {
  artworkCache.clear();
  console.log("All caches cleared");
};

// Costanti
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
