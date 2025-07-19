const fetch = require("node-fetch");

class OptimizedMetApiClient {
  constructor({
    requestDelay = 800, // Ridotto leggermente
    maxRetries = 4, // Aumentato per maggiore resilienza
    retryBaseDelay = 5000, // Ridotto per retry più veloce
    maxConcurrentRequests = 3, // Pool di richieste parallele controllato
    cacheSize = 1000,
    cacheTTL = 10 * 60 * 1000, // 10 minuti cache
  } = {}) {
    this.REQUEST_DELAY = requestDelay;
    this.MAX_RETRIES = maxRetries;
    this.RETRY_BASE_DELAY = retryBaseDelay;
    this.MAX_CONCURRENT = maxConcurrentRequests;

    // Pool di richieste attive
    this.activeRequests = new Set();
    this.queue = [];
    this.isProcessing = false;
    this.lastRequestTime = 0;

    // Cache intelligente
    this.cache = new Map();
    this.cacheAccess = new Map(); // Per LRU
    this.CACHE_SIZE = cacheSize;
    this.CACHE_TTL = cacheTTL;

    // Statistiche per ottimizzazione dinamica
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      cacheHits: 0,
      rateLimitHits: 0,
      averageResponseTime: 0,
    };

    // Rate limiter adattivo
    this.rateLimitDetected = false;
    this.adaptiveDelay = requestDelay;
  }

  // Cache con LRU eviction
  _getCacheKey(url) {
    return url.replace(/[?&]_t=\d+/, ""); // Remove cache busting
  }

  _cacheGet(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      this.cacheAccess.delete(key);
      return null;
    }

    this.cacheAccess.set(key, Date.now());
    this.stats.cacheHits++;
    return item.data;
  }

  _cacheSet(key, data) {
    // LRU eviction se necessario
    if (this.cache.size >= this.CACHE_SIZE) {
      const oldestKey = Array.from(this.cacheAccess.entries()).sort(
        (a, b) => a[1] - b[1]
      )[0][0];
      this.cache.delete(oldestKey);
      this.cacheAccess.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
    this.cacheAccess.set(key, Date.now());
  }

  // Headers più realistici con rotazione
  getRandomBrowserHeaders() {
    const configurations = [
      {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "sec-ch-ua":
          '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
      },
      {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "sec-ch-ua":
          '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
      },
      {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
        "Accept-Language": "en-US,en;q=0.5",
      },
    ];

    const config =
      configurations[Math.floor(Math.random() * configurations.length)];

    return {
      Accept: "application/json,text/plain,*/*",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      Referer: "https://www.metmuseum.org/art/collection",
      Origin: "https://www.metmuseum.org",
      DNT: "1",
      Connection: "keep-alive",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "cross-site",
      ...config,
    };
  }

  // Fetch ottimizzato con timeout dinamico e circuit breaker
  async fetchWithRetry(url, options = {}) {
    const startTime = Date.now();
    let lastError;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        // Timeout progressivo
        const timeoutMs = Math.min(15000 + attempt * 5000, 30000);

        const response = await fetch(url, {
          ...options,
          headers: { ...this.getRandomBrowserHeaders(), ...options.headers },
          timeout: timeoutMs,
        });

        // Gestione intelligente degli errori
        if (response.status === 429 || response.status === 403) {
          this.stats.rateLimitHits++;
          this.rateLimitDetected = true;

          if (attempt < this.MAX_RETRIES) {
            // Backoff esponenziale con jitter
            const baseDelay = this.RETRY_BASE_DELAY * Math.pow(2, attempt - 1);
            const jitter = Math.random() * 2000;
            const delay = baseDelay + jitter;

            console.log(
              `Rate limit detected, waiting ${Math.round(
                delay
              )}ms (attempt ${attempt})`
            );
            await new Promise((r) => setTimeout(r, delay));

            // Aumenta il delay adattivo
            this.adaptiveDelay = Math.min(this.adaptiveDelay * 1.5, 3000);
            continue;
          }
        }

        // Reset adaptive delay on success
        if (response.ok) {
          this.rateLimitDetected = false;
          if (this.adaptiveDelay > this.REQUEST_DELAY) {
            this.adaptiveDelay = Math.max(
              this.adaptiveDelay * 0.9,
              this.REQUEST_DELAY
            );
          }
        }

        return response;
      } catch (err) {
        lastError = err;

        if (attempt < this.MAX_RETRIES) {
          const delay =
            this.RETRY_BASE_DELAY * Math.pow(1.5, attempt - 1) +
            Math.random() * 1000;
          console.log(
            `Network error, retrying in ${Math.round(
              delay
            )}ms (attempt ${attempt})`
          );
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    // Aggiorna statistiche
    const responseTime = Date.now() - startTime;
    this.stats.averageResponseTime =
      (this.stats.averageResponseTime + responseTime) / 2;

    throw (
      lastError ||
      new Error(`Failed to fetch ${url} after ${this.MAX_RETRIES} attempts`)
    );
  }

  // Pool di richieste concorrenti controllato
  async queueRequest(fn, url) {
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject, fn, url, timestamp: Date.now() });
      this._processQueue();
    });
  }

  async _processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    try {
      while (
        this.queue.length > 0 &&
        this.activeRequests.size < this.MAX_CONCURRENT
      ) {
        const request = this.queue.shift();
        this._processRequest(request);
      }
    } finally {
      this.isProcessing = false;

      // Continua il processing se ci sono ancora richieste
      if (
        this.queue.length > 0 &&
        this.activeRequests.size < this.MAX_CONCURRENT
      ) {
        setTimeout(() => this._processQueue(), 100);
      }
    }
  }

  async _processRequest(request) {
    const { resolve, reject, fn, url } = request;
    const requestId = Symbol();

    this.activeRequests.add(requestId);

    try {
      // Rate limiting intelligente
      const elapsed = Date.now() - this.lastRequestTime;
      const currentDelay = this.rateLimitDetected
        ? this.adaptiveDelay * 2
        : this.adaptiveDelay;

      if (elapsed < currentDelay) {
        await new Promise((r) => setTimeout(r, currentDelay - elapsed));
      }

      const result = await fn();
      this.lastRequestTime = Date.now();
      this.stats.totalRequests++;
      this.stats.successfulRequests++;

      resolve(result);
    } catch (error) {
      this.stats.totalRequests++;
      reject(error);
    } finally {
      this.activeRequests.delete(requestId);

      // Continua il processing
      setTimeout(() => this._processQueue(), 50);
    }
  }

  async _handleResponse(response, url) {
    if (!response.ok) {
      const code = response.status;
      if (code === 404) throw { status: 404, message: "Not Found", url };
      if ([403, 429].includes(code))
        throw { status: 429, message: "Rate Limited", url };
      throw { status: code, message: response.statusText, url };
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw { status: 502, message: "Invalid Content Type", url };
    }

    return response.json();
  }

  // Metodi API con cache intelligente
  async search(q, hasImages = true) {
    const cacheKey = this._getCacheKey(`search:${q}:${hasImages}`);
    const cached = this._cacheGet(cacheKey);
    if (cached) return cached;

    const url = `https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=${hasImages}&q=${encodeURIComponent(
      q
    )}`;

    const result = await this.queueRequest(
      () =>
        this.fetchWithRetry(url).then((res) => this._handleResponse(res, url)),
      url
    );

    // Cache search results più a lungo (sono costosi)
    if (result && result.objectIDs) {
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });
      // Override TTL for searches - 15 minuti
      setTimeout(() => {
        this.cache.delete(cacheKey);
        this.cacheAccess.delete(cacheKey);
      }, 15 * 60 * 1000);
    }

    return result;
  }

  async getObjectById(id) {
    const cacheKey = this._getCacheKey(`object:${id}`);
    const cached = this._cacheGet(cacheKey);
    if (cached) return cached;

    const url = `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`;

    try {
      const result = await this.queueRequest(
        () =>
          this.fetchWithRetry(url).then((res) =>
            this._handleResponse(res, url)
          ),
        url
      );

      if (result) {
        this._cacheSet(cacheKey, result);
      }

      return result;
    } catch (error) {
      // Cache 404s brevemente per evitare richieste ripetute
      if (error.status === 404) {
        this._cacheSet(cacheKey, null);
        setTimeout(() => {
          this.cache.delete(cacheKey);
          this.cacheAccess.delete(cacheKey);
        }, 2 * 60 * 1000); // 2 minuti per 404
      }
      throw error;
    }
  }

  async listByDepartment(departmentIds) {
    const cacheKey = this._getCacheKey(`dept:${departmentIds}`);
    const cached = this._cacheGet(cacheKey);
    if (cached) return cached;

    const url = `https://collectionapi.metmuseum.org/public/collection/v1/objects?departmentIds=${departmentIds}`;

    const result = await this.queueRequest(
      () =>
        this.fetchWithRetry(url).then((res) => this._handleResponse(res, url)),
      url
    );

    if (result) {
      this._cacheSet(cacheKey, result);
    }

    return result;
  }

  // Batch processing ottimizzato
  async getMultipleObjects(ids, options = {}) {
    const { batchSize = 5, onProgress = null, failFast = false } = options;

    const results = [];
    const errors = [];

    // Processa in batch con controllo concorrenza
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);

      const batchPromises = batch.map(async (id) => {
        try {
          const result = await this.getObjectById(id);
          return { id, result, success: true };
        } catch (error) {
          const errorInfo = { id, error: error.message, success: false };
          if (failFast) throw error;
          return errorInfo;
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((promiseResult) => {
        if (promiseResult.status === "fulfilled") {
          const { id, result, success, error } = promiseResult.value;
          if (success && result) {
            results.push(result);
          } else if (!success) {
            errors.push({ id, error });
          }
        } else {
          errors.push({ error: promiseResult.reason.message });
        }
      });

      if (onProgress) {
        onProgress({
          completed: Math.min(i + batchSize, ids.length),
          total: ids.length,
          results: results.length,
          errors: errors.length,
        });
      }

      // Pausa tra batch se necessario
      if (i + batchSize < ids.length) {
        const pauseTime = this.rateLimitDetected ? 2000 : 500;
        await new Promise((r) => setTimeout(r, pauseTime));
      }
    }

    return { results, errors };
  }

  // Utility methods
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      queueSize: this.queue.length,
      activeRequests: this.activeRequests.size,
      adaptiveDelay: this.adaptiveDelay,
      rateLimitDetected: this.rateLimitDetected,
      successRate:
        this.stats.totalRequests > 0
          ? (
              (this.stats.successfulRequests / this.stats.totalRequests) *
              100
            ).toFixed(2)
          : 0,
      cacheHitRate:
        this.stats.totalRequests > 0
          ? ((this.stats.cacheHits / this.stats.totalRequests) * 100).toFixed(2)
          : 0,
    };
  }

  clearCache() {
    this.cache.clear();
    this.cacheAccess.clear();
  }

  // Preload popolare per migliorare UX
  async preloadPopularContent() {
    const popularQueries = [
      "painting",
      "sculpture",
      "photography",
      "american",
      "european",
    ];

    console.log("Preloading popular content...");

    for (const query of popularQueries) {
      try {
        await this.search(query);
        await new Promise((r) => setTimeout(r, 1000)); // Spacing
      } catch (error) {
        console.warn(`Failed to preload ${query}:`, error.message);
      }
    }
  }
}

module.exports = new OptimizedMetApiClient({
  requestDelay: 800,
  maxRetries: 4,
  retryBaseDelay: 5000,
  maxConcurrentRequests: 3,
  cacheSize: 1000,
  cacheTTL: 10 * 60 * 1000,
});
