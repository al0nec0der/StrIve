import React from "react";
import Header from "./Header";

const MoviesPage = () => {
  return (
    <div className="bg-black min-h-screen">
      <Header />
      <div className="pt-20 pb-8 px-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Movies</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discover amazing movies from around the world. Watch your favorites
            anytime, anywhere.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MoviesPage;