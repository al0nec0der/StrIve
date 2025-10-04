import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import MovieCard from './MovieCard';

const ListShelf = ({ title, items, mapsTo, onRemove, onDelete }) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">
          <Link 
            to={mapsTo} 
            className="text-white hover:text-gray-300 transition-colors duration-200"
          >
            {title}
          </Link>
        </h2>
        {onDelete && (
          <button 
            onClick={onDelete}
            className="text-red-500 hover:text-red-400 transition-colors duration-200"
            aria-label="Delete list"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>
      <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide">
        {items && items.map((item) => (
          <div key={item.id} className="flex-shrink-0">
            <MovieCard 
              movie={item} 
              onRemove={onRemove} 
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListShelf;