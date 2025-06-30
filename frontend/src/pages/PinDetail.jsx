import React from "react";
import { useParams } from "react-router-dom";
import { useFetchArtwork } from "../hooks/useFetchArtwork";
import { useComments } from "../hooks/useComments";
import { useAddComment } from "../hooks/useAddComment";
import { useDeleteComment } from "../hooks/useDeleteComment";
import CommentList from "../components/CommentList";
import CommentForm from "../components/CommentForm";

const PinDetail = () => {
  const { pinId } = useParams();
  const {
    artwork,
    loading: artLoading,
    error: artError,
  } = useFetchArtwork(pinId);
  const {
    comments,
    loading: commLoading,
    error: commError,
    refresh,
  } = useComments(pinId);
  const { addComment } = useAddComment();
  const { removeComment } = useDeleteComment();

  if (artLoading) return <p>Loading artwork...</p>;
  if (artError) return <p>Error: {artError.message || artError}</p>;
  if (!artwork) return <p>Artwork not found.</p>;

  const handleAdd = async (data) => {
    await addComment(pinId, data);
    refresh();
  };

  const handleDelete = async (commentId) => {
    await removeComment(pinId, commentId);
    refresh();
  };

  return (
    <div>
      <img src={artwork.linkResource} alt={artwork.title} />
      <h1>{artwork.title}</h1>
      <p>by {artwork.author.displayName || artwork.author.email}</p>
      <p>{artwork.description}</p>
      <p>Categories: {artwork.categories.map((c) => c.name).join(", ")}</p>

      <section>
        <h2>Comments</h2>
        {commLoading && <p>Loading comments...</p>}
        {commError && (
          <p>Error loading comments: {commError.message || commError}</p>
        )}
        <CommentList comments={comments} onDelete={handleDelete} />
        <CommentForm onAdd={handleAdd} />
      </section>
    </div>
  );
};

export default PinDetail;
