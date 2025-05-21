import React from 'react';

const DreamImageCarousel = ({ images }) => {
  return (
    <div className="relative w-full overflow-hidden h-90">
      <div className="flex animate-carousel items-center">
        {images.map((img, idx) => (
          <img
            key={`img1-${idx}`}
            src={`/static/images/dreams/${img}`}
            alt={`dream-${idx}`}
            className="h-40 w-auto object-cover rounded shadow"
          />
        ))}
        {images.map((img, idx) => (
          <img
            key={`img2-${idx}`}
            src={`/static/images/dreams/${img}`}
            alt={`dream-dup-${idx}`}
            className="h-40 w-auto object-cover rounded shadow"
          />
        ))}
      </div>
    </div>
  );
};

export default DreamImageCarousel;


// <div className="absolute top-0 left-0 flex space-x-4 animate-carousel w-max">

// import React from 'react';
// import './DreamImageCarousel.css';

// const DreamImageCarousel = ({ images }) => {
//   const loopedImages = [...images, ...images]; // Duplicate for seamless loop

//   return (
//     <div className="w-full overflow-hidden">
//       <div className="flex animate-scroll space-x-4 min-w-max">
//         {loopedImages.map((img, idx) => (
//           <img
//             key={idx}
//             src={`/static/images/dreams/${img}`}
//             alt={`dream-${idx}`}
//             className="h-32 w-auto object-cover rounded shadow-md"
//           />
//         ))}
//       </div>
//     </div>
//   );
// };

// export default DreamImageCarousel;

