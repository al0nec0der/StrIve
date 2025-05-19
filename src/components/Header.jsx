import { signOut } from "firebase/auth";
import { auth } from "../util/firebase";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const Header = () => {
  const navigate = useNavigate();
  const user = useSelector((store) => store.user.user);
  const handleSignOut = () => {
    signOut(auth)
      .then(() => {
        // Sign-out successful.
        navigate("/");
      })
      .catch((error) => {
        // An error happened.
        console.log(error);
        navigate("/error");
      });
  };

  return (
    <div className="absolute h-16 w-full flex justify-between items-center bg-gradient-to-b from-black px-3 z-10">
      <div className="bg-red-400 w-13 h-13 rounded-2xl items-center justify-center overflow-hidden">
        <img
          src="https://i.pinimg.com/736x/8b/51/4d/8b514d341909dca0c6bbb9d20d742dab.jpg"
          alt="logo"
          className="h-19 w-full object-contain scale-300"
        />
      </div>

      {user && (
        <div className="flex items-center">
          <button
            className="cursor-pointer hover:bg-red-800 bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default Header;
