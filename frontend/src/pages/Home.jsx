import React from "react";
import { useFetchArtworks } from "../hooks/useFetchArtworks";
import PinGrid from "../components/PinGrid";

const Home = () => {
  const { artworks, meta, loading, error } = useFetchArtworks({
    page: 1,
    limit: 20,
  });

  if (loading) return <p>Loading artworks...</p>;
  if (error) return <p>Error: {error.message || error}</p>;

  return (
    <div>
      <h1>Discover Artworks</h1>
      <PinGrid pins={artworks} />
      {/* Pagination controls could go here */}
    </div>
  );
};

export default Home;
