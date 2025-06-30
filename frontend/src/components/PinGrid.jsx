import React from "react";
import PinCard from "./PinCard";

function PinGrid({ pins }) {
  return (
    <div>
      {pins.map((pin) => (
        <PinCard key={pin._id} pin={pin} />
      ))}
    </div>
  );
}

export default PinGrid;
