import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useFetchArtwork } from '../hooks/useFetchArtwork';
import { useUpdateArtwork } from '../hooks/useUpdateArtwork';
import { useFetchCategories } from '../hooks/useFetchCategories';
import { useFetchArtists } from '../hooks/useFetchArtists';

const EditPin = () => {
  const { pinId } = useParams();
  const { artwork, loading: loadArt, error: errArt } = useFetchArtwork(pinId);
  const { update, loading: loadUp, error: errUp } = useUpdateArtwork(pinId);
  const { categories } = useFetchCategories();
  const { artists } = useFetchArtists();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [linkResource, setLinkResource] = useState('');
  const [tags, setTags] = useState('');
  const [categoryIds, setCategoryIds] = useState([]);
  const [artistId, setArtistId] = useState('');

  useEffect(() => {
    if (artwork) {
      setTitle(artwork.title);
      setDescription(artwork.description || '');
      setLinkResource(artwork.linkResource);
      setTags((artwork.tags || []).join(', '));
      setCategoryIds(artwork.categories.map(c => c._id));
      setArtistId(artwork.artistId);
    }
  }, [artwork]);

  const handleSubmit = async e => {
    e.preventDefault();
    const data = {
      title,
      description,
      linkResource,
      tags: tags.split(',').map(t => t.trim()),
      categories: categoryIds,
      artistId
    };
    await update(data);
  };

  if (loadArt) return <p>Loading pin...</p>;
  if (errArt) return <p>Error loading pin: {errArt.message || errArt}</p>;

  return (
    <div>
      <h1>Edit Pin</h1>
      <form onSubmit={handleSubmit}>
        <label>Title:</label>
        <input value={title} onChange={e => setTitle(e.target.value)} required />

        <label>Description:</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} />

        <label>Image URL:</label>
        <input value={linkResource} onChange={e => setLinkResource(e.target.value)} required />

        <label>Tags (comma separated):</label>
        <input value={tags} onChange={e => setTags(e.target.value)} />

        <label>Artist:</label>
        <select value={artistId} onChange={e => setArtistId(e.target.value)} required>
          {artists.map(a => (
            <option key={a._id} value={a._id}>{a.displayName}</option>
          ))}
        </select>

        <label>Categories:</label>
        <select multiple value={categoryIds} onChange={e => setCategoryIds(Array.from(e.target.selectedOptions, opt => opt.value))}>
          {categories.map(c => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>

        <button type="submit" disabled={loadUp}>
          {loadUp ? 'Updating...' : 'Update Pin'}
        </button>
        {errUp && <p>Error: {errUp.message || errUp}</p>}
      </form>
    </div>
  );
};

export default EditPin;
