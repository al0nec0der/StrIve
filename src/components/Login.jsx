import { useState } from "react";
import Header from "./Header";

const Login = () => {
  const [IsSignin, setIsSignin] = useState(true);

  const toogleSignup = () => {
    setIsSignin(!IsSignin);
  };

  return (
    <div>
      <Header />
      <div className="absolute">
        <img
          src="https://assets.nflxext.com/ffe/siteui/vlv3/202ac35e-1fca-44f0-98d9-ea7e8211a07c/web/IN-en-20250512-TRIFECTA-perspective_688b8c03-78cb-46a6-ac1c-1035536f871a_large.jpg"
          alt="Background"
          className="w-screen h-screen object-cover"
        />
      </div>

      <form className="absolute bg-black w-3/12 my-60 right-0 left-0 mx-auto p-6 rounded-lg text-white opacity-80">
        <h1 className="text-3xl font-bold p-2 m-2">
          {IsSignin ? "Sign In" : "Sign Up"}
        </h1>
        {!IsSignin && <input
          className="p-4 my-4 rounded-lg  w-full bg-gray-700"
          type="text"
          placeholder="Full Name"
        />}
        <input
          className="p-4 my-4 rounded-lg  w-full bg-gray-700"
          type="email"
          placeholder="Email"
        />
        <input
          className="p-4 my-4 rounded-lg w-full bg-gray-700"
          type="password"
          placeholder="Password"
        />
        <button
          className="p-4 my-6 rounded-lg bg-red-600 hover:bg-red-700 cursor-pointer w-full"
          type="submit"
        >
          {IsSignin ? "Sign In" : "Sign Up"}
        </button>

        <p
          onClick={toogleSignup}
          className="text-sm p-4 hover:underline cursor-pointer "
        >
          {IsSignin
            ? "New to Netflix? Sign up now."
            : "Already have an account? Sign in."}
        </p>
      </form>
    </div>
  );
};

export default Login;
