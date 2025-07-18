import { useState } from "react";
import "./Gallery.css";
import Card from "../Card/Card";

const Gallery = () => {
  const [likedImages, setLikedImages] = useState(new Set());

  // Immagini di esempio
  const images = [
    {
      id: 1,
      src: "https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=300&h=400&fit=crop",
      alt: "Sport artwork",
      title: "Digital Sports Art",
    },
    {
      id: 2,
      src: "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=300&h=350&fit=crop",
      alt: "Football player",
      title: "Football Star",
    },
    {
      id: 3,
      src: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&h=450&fit=crop",
      alt: "Gaming",
      title: "Gaming World",
    },
    {
      id: 4,
      src: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=300&h=380&fit=crop",
      alt: "Soccer",
      title: "Soccer Champions",
    },
    {
      id: 5,
      src: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=420&fit=crop",
      alt: "Basketball",
      title: "Basketball Action",
    },
    {
      id: 6,
      src: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=360&fit=crop",
      alt: "Sports art",
      title: "Sports Design",
    },
    {
      id: 7,
      src: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=300&h=400&fit=crop",
      alt: "Football",
      title: "Football Match",
    },
    {
      id: 8,
      src: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=300&h=350&fit=crop",
      alt: "Gaming character",
      title: "Game Character",
    },
    {
      id: 9,
      src: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=300&h=480&fit=crop",
      alt: "Team sports",
      title: "Team Spirit",
    },
    {
      id: 10,
      src: "https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=300&h=320&fit=crop",
      alt: "Sports collage",
      title: "Sports Collage",
    },
    {
      id: 11,
      src: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=440&fit=crop",
      alt: "Digital art",
      title: "Digital Sports",
    },
    {
      id: 12,
      src: "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=300&h=390&fit=crop",
      alt: "Athletic performance",
      title: "Athletic Art",
    },
    {
      id: 13,
      src: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&h=370&fit=crop",
      alt: "Gaming scene",
      title: "Gaming Scene",
    },
    {
      id: 14,
      src: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=300&h=410&fit=crop",
      alt: "Soccer art",
      title: "Soccer Design",
    },
    {
      id: 15,
      src: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=330&fit=crop",
      alt: "Basketball art",
      title: "Basketball Style",
    },
  ];

  const handleLike = (imageId) => {
    setLikedImages((prev) => {
      const newLiked = new Set(prev);
      if (newLiked.has(imageId)) {
        newLiked.delete(imageId);
      } else {
        newLiked.add(imageId);
      }
      return newLiked;
    });
  };

  return (
    <div className="gallery-container">
      {/* <header className="header">
        <h1>Sports & Gaming Gallery</h1>
        <p>Discover amazing sports and gaming artwork</p>
      </header> */}

      <div className="grid">
        {images.map((image) => (
          <Card
            key={image.id}
            image={image}
            isLiked={likedImages.has(image.id)}
            onLike={handleLike}
          />
        ))}
      </div>
    </div>
  );
};

export default Gallery;
