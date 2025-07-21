// backend/src/services/metService.js
const Artwork = require("../models/ArtworkModel");
const fetch = require("node-fetch"); // o global.fetch se configurato
const MET_BASE = "https://collectionapi.metmuseum.org/public/collection/v1";

async function getOrCreateMetArtwork(externalId, authorId) {
  // 1) Provo a trovare un documento già creato
  let art = await Artwork.findOne({ externalId });
  if (art) return art;

  // 2) Fetch dal MET
  const response = await fetch(`${MET_BASE}/objects/${externalId}`);
  if (!response.ok) {
    const err = new Error(`MET API request failed: ${response.status}`);
    err.status = response.status;
    throw err;
  }
  const data = await response.json();

  if (!data?.objectID) {
    const err = new Error("MET object not found");
    err.status = 404;
    throw err;
  }

  // 3) Preparo il payload per la creazione
  const createData = {
    title: data.title || "Untitled",
    origin: "MET",
    externalId: data.objectID,      // ← qui!
    authorId,                       // deve essere passato al service
    linkResource: data.primaryImageSmall || "",
    medium: data.medium || "",
    dimensions: data.dimensions || "",
  };

  // 4) Publish date se parsabile
  const date = new Date(data.objectDate);
  if (!isNaN(date.valueOf())) {
    createData.publishDate = date;
  }

  // 5) Creo il documento
  art = await Artwork.create(createData);
  return art;
}

module.exports = { getOrCreateMetArtwork };
