const Header = () => {
  return (
    <div className="absolute h-16 w-full flex justify-between items-center bg-gradient-to-b from-black px-3 z-10">
      <div className="bg-red-400 w-13 h-13 rounded-2xl items-center justify-center overflow-hidden">
        <img
          src="https://i.pinimg.com/736x/8b/51/4d/8b514d341909dca0c6bbb9d20d742dab.jpg"
          alt="logo"
          className="h-19 w-full object-contain scale-300"
        />
      </div>
    </div>
  );
};


export default Header;