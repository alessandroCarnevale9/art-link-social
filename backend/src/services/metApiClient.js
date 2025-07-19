require("dotenv").config();
const fetch = require("node-fetch");

class MetApiClient {
  constructor({
    requestDelay = 3000,
    maxRetries = 3,
    retryBaseDelay = 5000,
  } = {}) {
    this.REQUEST_DELAY = requestDelay;
    this.MAX_RETRIES = maxRetries;
    this.RETRY_BASE_DELAY = retryBaseDelay;
    this.queue = [];
    this.isProcessing = false;
    this.lastRequestTime = 0;
  }

  getRandomBrowserHeaders() {
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0",
    ];
    const acceptLanguages = [
      "en-US,en;q=0.9",
      "en-GB,en;q=0.9",
      "en-US,en;q=0.8,it;q=0.6",
    ];
    return {
      Accept: "application/json",
      "Accept-Language":
        acceptLanguages[Math.floor(Math.random() * acceptLanguages.length)],
      "User-Agent": userAgents[Math.floor(Math.random() * userAgents.length)],
      Referer: "https://www.metmuseum.org/art/collection",
      Origin: "https://www.metmuseum.org",
      DNT: "1",
      Connection: "keep-alive",
    };
  }

  async fetchWithRetry(url, options = {}) {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: { ...this.getRandomBrowserHeaders(), ...options.headers },
          timeout: 20000,
        });
        if (
          [403, 429].includes(response.status) &&
          attempt < this.MAX_RETRIES
        ) {
          const delay =
            this.RETRY_BASE_DELAY * Math.pow(2, attempt - 1) +
            Math.random() * 1000;
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        return response;
      } catch (err) {
        if (attempt < this.MAX_RETRIES) {
          const delay =
            this.RETRY_BASE_DELAY * Math.pow(2, attempt - 1) +
            Math.random() * 1000;
          await new Promise((r) => setTimeout(r, delay));
        } else {
          throw err;
        }
      }
    }
    throw new Error(`Failed to fetch ${url}`);
  }

  queueRequest(fn, url) {
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject, fn, url });
      if (!this.isProcessing) setTimeout(() => this._process(), 0);
    });
  }

  async _process() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    while (this.queue.length) {
      const { resolve, reject, fn, url } = this.queue.shift();
      const elapsed = Date.now() - this.lastRequestTime;
      if (elapsed < this.REQUEST_DELAY)
        await new Promise((r) => setTimeout(r, this.REQUEST_DELAY - elapsed));
      try {
        const res = await fn();
        this.lastRequestTime = Date.now();
        resolve(res);
      } catch (err) {
        reject(err);
      }
    }
    this.isProcessing = false;
  }

  async _handleResponse(response, url) {
    if (!response.ok) {
      const code = response.status;
      if (code === 404) throw { status: 404, message: "Not Found", url };
      if ([403, 429].includes(code))
        throw { status: 429, message: "Rate Limited", url };
      throw { status: code, message: response.statusText, url };
    }
    const type = response.headers.get("content-type");
    if (!type || !type.includes("application/json"))
      throw { status: 502, message: "Invalid Content Type", url };
    return response.json();
  }

  search(q, hasImages = true) {
    const url = `https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=${hasImages}&q=${encodeURIComponent(
      q
    )}`;
    return this.queueRequest(
      () =>
        this.fetchWithRetry(url).then((res) => this._handleResponse(res, url)),
      url
    );
  }

  getObjectById(id) {
    const url = `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`;
    return this.queueRequest(
      () =>
        this.fetchWithRetry(url).then((res) => this._handleResponse(res, url)),
      url
    );
  }

  listByDepartment(departmentIds) {
    const url = `https://collectionapi.metmuseum.org/public/collection/v1/objects?departmentIds=${departmentIds}`;
    return this.queueRequest(
      () =>
        this.fetchWithRetry(url).then((res) => this._handleResponse(res, url)),
      url
    );
  }
}

module.exports = new MetApiClient({
  requestDelay: 3000,
  maxRetries: 3,
  retryBaseDelay: 5000,
});
