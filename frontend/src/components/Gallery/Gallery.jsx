import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import "./Gallery.css";
import Card from "../Card/Card";
import {
  searchArtworks,
  getMultipleArtworksProgressive,
  POPULAR_QUERIES,
} from "../../api/metApiReq";

const ROW_HEIGHT_PX = 8;
const GRID_GAP_PX = 20;

const Gallery = () => {
  const [likedImages, setLikedImages] = useState(new Set());
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuery, setCurrentQuery] = useState("painting");
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const [progressiveLoading, setProgressiveLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);

  const [placeholderCount, setPlaceholderCount] = useState(0);
  const [occupiedPlaceholders, setOccupiedPlaceholders] = useState([]);
  const nextPlaceholderIndex = useRef(0);

  const currentRequestRef = useRef(null);
  const currentSearchResultsRef = useRef([]);

  // Ref per la griglia
  const gridRef = useRef(null);

  // -------- Funzione masonry (ricalcolo span) --------
  const recalcMasonry = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const items = grid.querySelectorAll(".grid-item");
    items.forEach((item) => {
      item.style.gridRowEnd = ""; // reset
      const height = item.getBoundingClientRect().height;
      // calcolo span: (altezza + gap) / (rowHeight + gap)
      const span = Math.ceil((height + GRID_GAP_PX) / (ROW_HEIGHT_PX + GRID_GAP_PX));
      item.style.gridRowEnd = `span ${span}`;
    });
  }, []);

  // Ricalcolo quando cambia la lista immagini (dopo aggiunta batch)
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    // Colleziona immagini dentro le card
    const imgs = grid.querySelectorAll(".grid-item img");
    let loaded = 0;
    const total = imgs.length;

    if (total === 0) {
      recalcMasonry();
      return;
    }

    const checkAll = () => {
      loaded++;
      if (loaded === total) {
        // aspetta il layout
        requestAnimationFrame(() => recalcMasonry());
      }
    };

    imgs.forEach((img) => {
      if (img.complete) {
        checkAll();
      } else {
        img.addEventListener("load", checkAll, { once: true });
        img.addEventListener("error", checkAll, { once: true });
      }
    });

    window.addEventListener("resize", recalcMasonry);
    return () => {
      window.removeEventListener("resize", recalcMasonry);
    };
  }, [images, placeholderCount, recalcMasonry]);

  // Richiamare la funzione anche quando termina interamente un caricamento progressivo
  useEffect(() => {
    if (!progressiveLoading) {
      requestAnimationFrame(() => recalcMasonry());
    }
  }, [progressiveLoading, recalcMasonry]);

  // Callback progresso caricamento progressive
  const handleProgress = useCallback((progressData) => {
    const { totalBatches, batchNumber, batch, progress, resultCount } = progressData;

    setLoadingProgress(Math.round(progress * 100));
    setTotalBatches(totalBatches);
    setCurrentBatch(batchNumber);

    if (batch && batch.length > 0) {
      const newOccupations = batch.map((img, i) => ({
        id: img.id,
        placeholderIndex: nextPlaceholderIndex.current + i,
      }));

      setOccupiedPlaceholders((prev) => [...prev, ...newOccupations]);
      nextPlaceholderIndex.current += batch.length;

      setImages((prevImages) => {
        const existingIds = new Set(prevImages.map((img) => img.id));
        const newImages = batch.filter((img) => !existingIds.has(img.id));
        return [...prevImages, ...newImages];
      });
    }
  }, []);

  // Funzione per caricare opere con caricamento progressivo
  const loadArtworksProgressive = useCallback(
    async (query, reset = false, limit = 20) => {
      let requestRef = { cancelled: false };
      if (currentRequestRef.current) {
        currentRequestRef.current.cancelled = true;
      }
      currentRequestRef.current = requestRef;

      try {
        let currentOffset;
        let objectIds;

        if (reset) {
          // Reset placeholders
            setPlaceholderCount(limit);
            setOccupiedPlaceholders([]);
            nextPlaceholderIndex.current = 0;

            setLoading(true);
            setError(null);
            setImages([]);
            setProgressiveLoading(true);
            setLoadingProgress(0);
            setCurrentBatch(0);
            setTotalBatches(0);
            setOffset(0);
            currentOffset = 0;

            objectIds = await searchArtworks(query);
            currentSearchResultsRef.current = objectIds || [];
        } else {
          setLoadingMore(true);
          setProgressiveLoading(true);
          currentOffset = offset;
          objectIds = currentSearchResultsRef.current;
        }

        if (requestRef.cancelled) return;

        if (!objectIds || objectIds.length === 0) {
          if (reset) {
            setImages([]);
            setTotalResults(0);
            setHasMore(false);
          }
          setProgressiveLoading(false);
          setLoadingProgress(0);
          return;
        }

        const paginatedIds = objectIds.slice(currentOffset, currentOffset + limit);

        if (reset) {
          setTotalResults(objectIds.length);
        }

        setHasMore(currentOffset + limit < objectIds.length);

        // Inizializza placeholder per il batch
        if (paginatedIds.length > 0) {
          setPlaceholderCount(paginatedIds.length);
          setOccupiedPlaceholders([]);
          nextPlaceholderIndex.current = 0;
        }

        await getMultipleArtworksProgressive(
          paginatedIds,
          (progressData) => {
            if (requestRef.cancelled) return;
            handleProgress(progressData);
          },
          { batchSize: 3, priority: "normal" }
        );

        if (requestRef.cancelled) return;

        setOffset(currentOffset + limit);
      } catch (err) {
        if (!requestRef.cancelled) {
          setError(err.message || "Failed to load artworks");
        }
      } finally {
        if (!requestRef.cancelled) {
          setLoading(false);
          setLoadingMore(false);
          setProgressiveLoading(false);
          setLoadingProgress(0);
          setPlaceholderCount(0);
        }
        if (currentRequestRef.current === requestRef) {
          currentRequestRef.current = null;
        }
      }
    },
    [offset, handleProgress]
  );

  useEffect(() => {
    loadArtworksProgressive(currentQuery, true);
    return () => {
      if (currentRequestRef.current) {
        currentRequestRef.current.cancelled = true;
      }
    };
  }, [currentQuery/*, loadArtworksProgressive */]);

  const handleCategoryChange = (newQuery) => {
    if (newQuery === currentQuery) return;
    setCurrentQuery(newQuery);
  };

  const loadMore = () => {
    if (!loadingMore && !progressiveLoading && hasMore) {
      loadArtworksProgressive(currentQuery, false);
    }
  };

  const handleLike = (imageId) => {
    setLikedImages((prev) => {
      const n = new Set(prev);
      n.has(imageId) ? n.delete(imageId) : n.add(imageId);
      return n;
    });
  };

  const handleReport = (imageID) => {
    // TO DO
    console.log(`Handle report for ${imageID}`);
  };

  const retry = () => {
    setError(null);
    loadArtworksProgressive(currentQuery, true);
  };

  return (
    <div className="gallery-container">
      <header className="gallery-header">
        <div className="header-content">
          <h1>Metropolitan Museum Gallery</h1>
            <p>Discover amazing artworks from the MET collection</p>
          <div className="category-filters">
            {POPULAR_QUERIES.map((query) => (
              <button
                key={query}
                className={`filter-btn ${currentQuery === query ? "active" : ""}`}
                onClick={() => handleCategoryChange(query)}
                disabled={loading || progressiveLoading}
              >
                {query.charAt(0).toUpperCase() + query.slice(1)}
              </button>
            ))}
          </div>
          {totalResults > 0 && (
            <div className="results-info">
              <span>
                Showing {images.length} of {totalResults} artworks
              </span>
              {progressiveLoading && (
                <div className="progress-container">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${loadingProgress}%` }}
                    />
                  </div>
                  <span className="progress-text">
                    {totalBatches > 0
                      ? `Loading batch ${currentBatch} of ${totalBatches} (${loadingProgress}%)`
                      : `Loading... (${loadingProgress}%)`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {error && (
        <div className="error-container">
          <div className="error-message">
            <h3>Oops! Something went wrong</h3>
            <p>{error}</p>
            <button onClick={retry} className="retry-btn">
              Try Again
            </button>
          </div>
        </div>
      )}

      {(images.length > 0 || placeholderCount > 0) && (
        <div className="gallery-content">
          <div className="grid" ref={gridRef}>
            {images.map((image) => (
              <Card
                key={image.id}
                image={image}
                isLiked={likedImages.has(image.id)}
                onLike={handleLike}
                onReport={handleReport}
                className="grid-item"
              />
            ))}

            {Array.from({ length: placeholderCount }).map((_, index) => {
              const isOccupied = occupiedPlaceholders.some(
                (item) => item.placeholderIndex === index
              );
              return !isOccupied ? (
                <div
                  key={`placeholder-${index}`}
                  className="placeholder-card grid-item"
                />
              ) : null;
            })}
          </div>

          {progressiveLoading && (
            <div className="progressive-loading-indicator">
              <div className="loading-dots">
                <div className="loading-dot" />
                <div className="loading-dot" />
                <div className="loading-dot" />
              </div>
              <p>Loading more artworks...</p>
            </div>
          )}
        </div>
      )}

      {!loading && !progressiveLoading && images.length === 0 && placeholderCount === 0 && (
        <div className="no-results">
          <h3>No artworks found</h3>
          <p>Try searching for a different category</p>
        </div>
      )}

      {!loading && images.length > 0 && hasMore && !progressiveLoading && (
        <div className="load-more-container">
          <button
            onClick={loadMore}
            disabled={loadingMore || progressiveLoading}
            className="load-more-btn"
          >
            {loadingMore ? (
              <>
                <div className="small-spinner" /> Loading more...
              </>
            ) : (
              "Load More Artworks"
            )}
          </button>
        </div>
      )}

      {!loading && !progressiveLoading && images.length > 0 && !hasMore && (
        <div className="end-message">
          <p>You've seen all artworks for "{currentQuery}"</p>
        </div>
      )}
    </div>
  );
};

export default Gallery;
