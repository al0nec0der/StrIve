import { Play, Pause, Heart, Star, Search, Menu, User, Settings, LogOut } from './index';

const IconDemo = () => {
  return (
    <div className="p-6 bg-gray-900 text-white">
      <h2 className="text-2xl font-bold mb-4">Icon Demo</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col items-center p-4 bg-gray-800 rounded-lg">
          <Play className="w-8 h-8 mb-2" />
          <span>Play</span>
        </div>
        <div className="flex flex-col items-center p-4 bg-gray-800 rounded-lg">
          <Pause className="w-8 h-8 mb-2" />
          <span>Pause</span>
        </div>
        <div className="flex flex-col items-center p-4 bg-gray-800 rounded-lg">
          <Heart className="w-8 h-8 mb-2 text-red-500" />
          <span>Heart</span>
        </div>
        <div className="flex flex-col items-center p-4 bg-gray-800 rounded-lg">
          <Star className="w-8 h-8 mb-2 text-yellow-400" />
          <span>Star</span>
        </div>
        <div className="flex flex-col items-center p-4 bg-gray-800 rounded-lg">
          <Search className="w-8 h-8 mb-2" />
          <span>Search</span>
        </div>
        <div className="flex flex-col items-center p-4 bg-gray-800 rounded-lg">
          <User className="w-8 h-8 mb-2" />
          <span>User</span>
        </div>
      </div>
    </div>
  );
};

export default IconDemo;