import React from "react";
import { Link } from "react-router-dom";

const PinCard = ({ pin }) => (
  <div>
    <Link to={`/pin/${pin._id}`}>
      <img src={pin.linkResource} alt={pin.title} />
      <h2>{pin.title}</h2>
    </Link>
  </div>
);

export default PinCard;
