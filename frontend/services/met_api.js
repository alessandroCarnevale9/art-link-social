const BASE_URL = "/api";

// Simple cache to reduce API requests
const artworkCache = new Map();

/**
 * Search for artworks in the MET database via your backend proxy
 * @param {string} query - Search term (e.g., "painting", "sculpture", "american")
 * @param {boolean} hasImages - If true, returns only works with images
 * @returns {Promise<Array>} Array of objectIDs
 */
export const searchArtworks = async (query, hasImages = true) => {
  const url = `${BASE_URL}/search?hasImages=${hasImages}&q=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url, {
      headers: { 
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Referer": window.location.origin,
        "Cache-Control": "no-cache"
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Search failed:", res.status, text);
      throw new Error(`Search failed: ${res.status}`);
    }

    const data = await res.json();
    return data.objectIDs || [];
  } catch (error) {
    console.error("Network error in searchArtworks:", error);
    throw error;
  }
};

/**
 * Get details of a specific artwork via your backend proxy
 * @param {number} id - Object ID
 * @returns {Promise<Object>} Artwork details
 */
export const getArtworkDetails = async (id) => {
  // Check cache first
  if (artworkCache.has(id)) {
    return artworkCache.get(id);
  }

  try {
    const res = await fetch(`${BASE_URL}/objects/${id}`, {
      headers: { 
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Referer": window.location.origin,
        "Cache-Control": "no-cache"
      },
    });

    if (!res.ok) {
      // Handle 404 specifically
      if (res.status === 404) {
        console.warn(`Artwork ${id} not found`);
        artworkCache.set(id, null);
        return null;
      }

      const text = await res.text();
      console.error(`Fetch ${id} failed:`, res.status, text);
      throw new Error(`Failed to fetch artwork ${id}: ${res.status}`);
    }

    const data = await res.json();
    artworkCache.set(id, data);
    return data;
  } catch (error) {
    console.error(`Network error fetching artwork ${id}:`, error);
    throw error;
  }
};

/**
 * Get details for multiple artworks
 * @param {Array<number>} objectIds - Array of IDs
 * @param {number} maxConcurrent - Max simultaneous requests
 * @returns {Promise<Array>} Array of artworks with details
 */
export const getMultipleArtworks = async (objectIds, maxConcurrent = 2) => {
  const results = [];

  for (let i = 0; i < objectIds.length; i += maxConcurrent) {
    const batch = objectIds.slice(i, i + maxConcurrent);

    const batchPromises = batch.map(async (id) => {
      try {
        const artwork = await getArtworkDetails(id);

        // Skip if artwork not found or missing image
        if (!artwork || !artwork.primaryImageSmall) return null;

        return {
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
        };
      } catch (error) {
        console.error(`Failed to process artwork ${id}:`, error);
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter((item) => item !== null));

    // Add delay between batches to avoid rate limiting (increased from 500ms)
    if (i + maxConcurrent < objectIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
  }

  return results;
};

/**
 * Search and get complete artworks for a specific query
 * @param {string} query - Search term
 * @param {number} limit - Max results to return
 * @param {number} offset - Pagination offset
 * @returns {Promise<Object>} Object with artworks and metadata
 */
export const searchAndGetArtworks = async (query, limit = 20, offset = 0) => {
  try {
    console.log(
      `Searching for: "${query}" with limit: ${limit}, offset: ${offset}`
    );

    // Add initial delay to space out requests (increased from 300ms)
    await new Promise((resolve) => setTimeout(resolve, 800));

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
    const artworks = await getMultipleArtworks(paginatedIds);

    return {
      artworks,
      total: objectIds.length,
      hasMore: offset + limit < objectIds.length,
      nextOffset: offset + limit,
    };
  } catch (error) {
    console.error("Error in searchAndGetArtworks:", error);
    return {
      artworks: [],
      total: 0,
      hasMore: false,
      error: error.message,
    };
  }
};

/**
 * Get artworks by department via your backend proxy
 * @param {string} departmentId - Department ID (1-21)
 * @param {number} limit - Max results
 * @returns {Promise<Array>} Array of artworks
 */
export const getArtworksByDepartment = async (departmentId, limit = 20) => {
  try {
    const response = await fetch(
      `${BASE_URL}/objects?departmentIds=${departmentId}`,
      { 
        headers: { 
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Referer": window.location.origin,
          "Cache-Control": "no-cache"
        } 
      }
    );

    if (!response.ok) {
      throw new Error(`Department fetch failed: ${response.status}`);
    }

    const data = await response.json();
    const objectIds = data.objectIDs?.slice(0, limit) || [];
    return await getMultipleArtworks(objectIds);
  } catch (error) {
    console.error(`Error fetching department ${departmentId}:`, error);
    return [];
  }
};

/**
 * Get a random artwork with retry limit
 * @param {string} query - Optional search term
 * @param {number} maxAttempts - Max attempts to find valid artwork
 * @returns {Promise<Object>} Single random artwork
 */
export const getRandomArtwork = async (query = "painting", maxAttempts = 5) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const objectIds = await searchArtworks(query);
      if (!objectIds || objectIds.length === 0) continue;

      const randomId = objectIds[Math.floor(Math.random() * objectIds.length)];
      const artwork = await getArtworkDetails(randomId);

      if (artwork?.primaryImageSmall) {
        return {
          id: artwork.objectID,
          src: artwork.primaryImageSmall,
          alt: artwork.title || "Untitled",
          title: artwork.title || "Untitled",
          artist: artwork.artistDisplayName || "Unknown Artist",
          date: artwork.objectDate || "Unknown Date",
          culture: artwork.culture || "",
          medium: artwork.medium || "",
        };
      }
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
    }

    // Wait before next attempt (increased from 300ms)
    await new Promise((resolve) => setTimeout(resolve, 800));
  }

  throw new Error("Failed to find valid artwork after multiple attempts");
};

// Useful constants
export const POPULAR_QUERIES = [
  "painting",
  "sculpture",
  "photography",
  "american",
  "european",
  "asian",
  "ancient",
  "modern",
  "contemporary",
  "portrait",
  "landscape",
  "still life",
];

export const DEPARTMENT_IDS = {
  "american-decorative-arts": 1,
  "ancient-near-eastern": 2,
  "arms-armor": 3,
  "arts-africa-oceania-americas": 4,
  "asian-art": 5,
  "costume-institute": 6,
  "drawings-prints": 7,
  egyptian: 8,
  "european-paintings": 9,
  "european-sculpture": 10,
  "greek-roman": 11,
  islamic: 12,
  "lehman-collection": 13,
  libraries: 14,
  medieval: 15,
  "musical-instruments": 16,
  photographs: 17,
  "robert-wood-bliss": 18,
  "modern-art": 19,
  "european-decorative-arts": 20,
  "met-breuer": 21,
};