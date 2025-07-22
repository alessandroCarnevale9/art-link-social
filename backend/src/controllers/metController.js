const asyncHandler = require("express-async-handler");
const Artwork = require("../models/ArtworkModel");
const metClient = require("../services/metApiClient");
const ApiError = require("../utils/ApiError");

exports.importMetArtwork = asyncHandler(async (req, res) => {
  // 1) Autenticazione
  const authorId = req.userId;
  if (!authorId) {
    throw new ApiError(401, "Authentication required");
  }

  // 2) Parsing e validazione dell'ID esterno
  const externalId = parseInt(req.params.id, 10);
  if (isNaN(externalId)) {
    throw new ApiError(400, "Invalid external ID");
  }

  // 3) Fetch dei dati dal MET
  const metData = await metClient.getObjectById(externalId);

  // console.log("MET DATA \t", JSON.stringify(metData))

  if (!metData) {
    throw new ApiError(404, "Artwork not found in MET");
  }

  // 4) Estrai solo i termini dai tag (schema: [String])
  // Gestisci sia il caso di array di stringhe che di oggetti con proprietà 'term'
  const sanitizedTags = Array.isArray(metData.tags)
    ? metData.tags
        .map((t) => {
          // Se è una stringa, usala direttamente
          if (typeof t === "string") return t;
          // Se è un oggetto con proprietà 'term', estraila
          if (typeof t === "object" && t.term) return t.term;
          return null;
        })
        .filter(Boolean) // rimuovi valori null/undefined
    : [];

  // 5) Prepara il documento da upsertare
  const doc = {
    externalId: externalId,
    title: metData.title,
    primaryImage: metData.primaryImage,
    primaryImageSmall: metData.primaryImageSmall,
    artistDisplayName: metData.artistDisplayName,
    objectDate: metData.objectDate,
    medium: metData.medium,
    dimensions: metData.dimensions,
    culture: metData.culture,
    department: metData.department,
    classification: metData.classification,
    creditLine: metData.creditLine,
    repository: metData.repository,
    objectURL: metData.objectURL,
    tags: sanitizedTags,
    origin: "MET",
    importedBy: authorId,
    importedAt: new Date(),
  };

  console.log("DOC --->\t", doc);

  // 6) Upsert in Mongo: evita duplicati su externalId
  const artwork = await Artwork.findOneAndUpdate(
    { externalId }, // filtro unico
    { $set: doc }, // inserisci solo se non esiste
    { upsert: true, new: true }
  );

  console.log("ARTWORK --->\t", JSON.stringify(artwork));

  // 7) Risposta al client
  res.json({ artwork });
});
