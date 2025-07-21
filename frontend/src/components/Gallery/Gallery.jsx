// src/components/Gallery/Gallery.jsx
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
  useContext,
} from "react";
import "./Gallery.css";
import Card from "../Card/Card";

import {
  searchArtworks,
  getMultipleArtworksProgressive,
  POPULAR_QUERIES,
} from "../../api/metApiReq";
import { importMetArtwork } from "../../api/localApiReq";
import { addFavorite, removeFavorite } from "../../api/favorites";
import { createReport } from "../../api/reports";

import { AuthContext } from "../../context/AuthContext";

const ROW_HEIGHT_PX = 8;
const GRID_GAP_PX = 20;

const Gallery = () => {
  const { favorites, dispatch } = useContext(AuthContext);

  // Stati
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuery, setCurrentQuery] = useState("painting");
  const [offset, setOffset] = useState(0);
  const [totalResults, setTotalResults] = useState(0);        // ← usato in header
  const [hasMore, setHasMore] = useState(false);
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
  const gridRef = useRef(null);

  // Masonry
  const recalcMasonry = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) return;
    grid.querySelectorAll(".grid-item").forEach((item) => {
      item.style.gridRowEnd = "";
      const h = item.getBoundingClientRect().height;
      const span = Math.ceil((h + GRID_GAP_PX) / (ROW_HEIGHT_PX + GRID_GAP_PX));
      item.style.gridRowEnd = `span ${span}`;
    });
  }, []);

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const imgs = grid.querySelectorAll("img");
    let loaded = 0, total = imgs.length;
    if (!total) {
      recalcMasonry();
      return;
    }
    const onLoad = () => {
      if (++loaded === total) requestAnimationFrame(recalcMasonry);
    };
    imgs.forEach((img) => {
      img.complete
        ? onLoad()
        : img.addEventListener("load", onLoad, { once: true });
      img.addEventListener("error", onLoad, { once: true });
    });
    window.addEventListener("resize", recalcMasonry);
    return () => window.removeEventListener("resize", recalcMasonry);
  }, [images, placeholderCount, recalcMasonry]);

  useEffect(() => {
    if (!progressiveLoading) requestAnimationFrame(recalcMasonry);
  }, [progressiveLoading, recalcMasonry]);

  // Progressive loading callback
  const handleProgress = useCallback(
    ({ totalBatches, batchNumber, batch, progress }) => {
      setLoadingProgress(Math.round(progress * 100));
      setTotalBatches(totalBatches);
      setCurrentBatch(batchNumber);
      if (batch?.length) {
        const occ = batch.map((img, i) => ({
          id: img.id,
          placeholderIndex: nextPlaceholderIndex.current + i,
        }));
        setOccupiedPlaceholders((p) => [...p, ...occ]);
        nextPlaceholderIndex.current += batch.length;
        setImages((p) => {
          const seen = new Set(p.map((x) => x.id));
          return [...p, ...batch.filter((x) => !seen.has(x.id))];
        });
      }
    },
    []
  );

  // Caricamento progressivo
  const loadArtworksProgressive = useCallback(
    async (query, reset = false, limit = 20) => {
      const req = { cancelled: false };
      if (currentRequestRef.current)
        currentRequestRef.current.cancelled = true;
      currentRequestRef.current = req;

      try {
        let offsetLocal = 0, objectIds = [];

        if (reset) {
          setLoading(true);
          setError(null);
          setImages([]);
          setPlaceholderCount(limit);
          setOccupiedPlaceholders([]);
          nextPlaceholderIndex.current = 0;
          setProgressiveLoading(true);
          setLoadingProgress(0);
          setCurrentBatch(0);
          setTotalBatches(0);
          setOffset(0);

          objectIds = await searchArtworks(query);
          currentSearchResultsRef.current = objectIds || [];

          // ← Aggiorno totalResults per mostrare "Showing X of Y"
          setTotalResults(objectIds.length);
        } else {
          setLoadingMore(true);
          setProgressiveLoading(true);
          offsetLocal = offset;
          objectIds = currentSearchResultsRef.current;
        }

        if (req.cancelled) return;
        if (!objectIds?.length) {
          if (reset) setHasMore(false);
          setProgressiveLoading(false);
          return;
        }

        setHasMore(offsetLocal + limit < objectIds.length);

        const slice = objectIds.slice(
          offsetLocal,
          offsetLocal + limit
        );
        if (slice.length) {
          setPlaceholderCount(slice.length);
          setOccupiedPlaceholders([]);
          nextPlaceholderIndex.current = 0;
        }

        await getMultipleArtworksProgressive(
          slice,
          (pd) => {
            if (!req.cancelled) handleProgress(pd);
          },
          { batchSize: 3 }
        );

        if (req.cancelled) return;
        setOffset(offsetLocal + limit);
      } catch (e) {
        if (!req.cancelled) setError(e.message || "Failed to load artworks");
      } finally {
        if (!req.cancelled) {
          setLoading(false);
          setLoadingMore(false);
          setProgressiveLoading(false);
          setPlaceholderCount(0);
        }
        if (currentRequestRef.current === req)
          currentRequestRef.current = null;
      }
    },
    [offset, handleProgress]
  );

  useEffect(() => {
    loadArtworksProgressive(currentQuery, true);
    return () => {
      if (currentRequestRef.current)
        currentRequestRef.current.cancelled = true;
    };
  }, [currentQuery]);

  // Filtri / load more / retry
  const handleCategoryChange = (q) => {
    if (q !== currentQuery) setCurrentQuery(q);
  };
  const loadMore = () => {
    if (!loadingMore && !progressiveLoading && hasMore) {
      loadArtworksProgressive(currentQuery, false);
    }
  };
  const retry = () => {
    setError(null);
    loadArtworksProgressive(currentQuery, true);
  };

  // Like / unlike ottimistico
  const handleLike = async (externalId) => {
    const prev = new Set(favorites);
    const wasLiked = prev.has(externalId);

    const next = new Set(prev);
    wasLiked ? next.delete(externalId) : next.add(externalId);
    dispatch({ type: "SET_FAVORITES", payload: next });

    try {
      const { artwork } = await importMetArtwork(externalId);
      if (!wasLiked) await addFavorite(artwork._id);
      else await removeFavorite(artwork._id);
    } catch (err) {
      console.error(err);
      alert("Could not update favorite.");
      dispatch({ type: "SET_FAVORITES", payload: prev });
    }
  };

  // Report invariato
  const handleReport = async (externalId) => {
    try {
      const { artwork } = await importMetArtwork(externalId);
      await createReport({
        targetType: "Artwork",
        targetId: artwork._id,
        reasonType: "other",
        otherReason: "Reported from gallery",
      });
      alert("Report sent!");
    } catch (err) {
      console.error(err);
      alert("Could not send report.");
    }
  };

  return (
    <div className="gallery-container">
      {/* header, filtri, risultati-info */}
      <header className="gallery-header">
        <h1>Metropolitan Museum Gallery</h1>
        <p>Discover amazing artworks from the MET collection</p>
        <div className="category-filters">
          {POPULAR_QUERIES.map((q) => (
            <button
              key={q}
              className={`filter-btn ${currentQuery === q ? "active" : ""}`}
              onClick={() => handleCategoryChange(q)}
              disabled={loading || progressiveLoading}
            >
              {q.charAt(0).toUpperCase() + q.slice(1)}
            </button>
          ))}
        </div>
        {totalResults > 0 && (
          <div className="results-info">
            <span>
              Showing {images.length} of {totalResults}
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
      </header>

      {/* error UI */}
      {error && (
        <div className="error-container">
          <h3>Oops! Something went wrong</h3>
          <p>{error}</p>
          <button onClick={retry} className="retry-btn">
            Try Again
          </button>
        </div>
      )}

      {/* gallery content */}
      {images.length || placeholderCount ? (
        <div className="gallery-content">
          <div className="grid" ref={gridRef}>
            {images.map((img) => (
              <Card
                key={img.id}
                image={img}
                isLiked={favorites.has(img.id)}
                onLike={handleLike}
                onReport={handleReport}
                className="grid-item"
              />
            ))}
            {Array.from({ length: placeholderCount }).map((_, idx) => {
              const occ = occupiedPlaceholders.some(
                (o) => o.placeholderIndex === idx
              );
              return !occ ? (
                <div
                  key={`ph-${idx}`}
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

          {!loading && images.length && hasMore && !progressiveLoading && (
            <button
              onClick={loadMore}
              disabled={loadingMore || progressiveLoading}
              className="load-more-btn"
            >
              {loadingMore ? "Loading more..." : "Load More Artworks"}
            </button>
          )}
          {!loading && !progressiveLoading && images.length && !hasMore && (
            <p className="end-message">
              You've seen all artworks for "{currentQuery}"
            </p>
          )}
        </div>
      ) : (
        !loading && (
          <div className="no-results">
            <h3>No artworks found</h3>
            <p>Try a different category.</p>
          </div>
        )
      )}
    </div>
  );
};

export default Gallery;
