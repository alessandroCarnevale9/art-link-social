import React from "react";

const CommentList = ({ comments, onDelete }) => (
  <div>
    {comments.map((comment) => (
      <div key={comment._id}>
        <p>
          <strong>
            {comment.author.firstName} {comment.author.lastName}
          </strong>
          :
        </p>
        <p>{comment.text}</p>
        <button onClick={() => onDelete(comment._id)}>Delete</button>
      </div>
    ))}
  </div>
);

export default CommentList;
