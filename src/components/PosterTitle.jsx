import React from "react";

const PosterTitle = ({ title, overview }) => {
  return (
    <div className="absolute inset-0 flex items-center text-left text-white z-20">
      {/* Full-Width Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>

      {/* Content Box with Controlled Width */}
      <div className="relative left-10 max-w-2xl p-8">
        <h1 className="text-6xl font-extrabold drop-shadow-lg">{title}</h1>
        <p className="mt-4 text-lg font-medium text-gray-300 leading-relaxed">
          {overview}
        </p>
        <div className="mt-6 flex gap-6">
          <button className="px-12 py-4 text-2xl bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-xl">
             Play
          </button>
          <button className="px-12 py-4 text-2xl bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-lg shadow-xl">
             More Info
          </button>
        </div>
      </div>
    </div>
  );
};

export default PosterTitle;
