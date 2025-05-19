import {useRef, useState } from "react";
import Header from "./Header";
import { checkvaliddata } from "../util/validate";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "../util/firebase";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../util/userSlice";

const Login = () => {
  const [IsSignin, setIsSignin] = useState(true);

  const [ErrorMsg, setErrorMsg] = useState(null);
  // const [email, setEmail] = useState("");
  // const [password, setPassword] = useState("");
  const toogleSignup = () => {
    setIsSignin(!IsSignin);
  };

  const Navigate = useNavigate();
  const dispatch = useDispatch();
  const name = useRef(null);
  const email = useRef(null);
  const password = useRef(null);

  const handleButtonclick = () => {
    const emailVal = email.current.value;
    const passwordVal = password.current.value;
    const error = checkvaliddata(emailVal, passwordVal);
    setErrorMsg(error);
    if (error) {
      return;
    }
    if (IsSignin) {
      if (IsSignin) {
        console.log("Signin");
        signInWithEmailAndPassword(
          auth,
          email.current.value,
          password.current.value
        )
          .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            console.log(user);
            Navigate("/Browse");
            // ...
          })
          .catch((error) => {
            console.log(error); // log the full error
            const errorCode = error.code;
            const errorMessage = error.message;
            setErrorMsg(errorCode + " " + errorMessage);
          });
      }
    } else {
      createUserWithEmailAndPassword(auth, emailVal, passwordVal)
        .then((userCredential) => {
          const user = userCredential.user;
          updateProfile(user, {
            displayName: name.current.value,
            photoURL: "https://example.com/jane-q-user/profile.jpg",
          })
            .then(() => {
              // Profile updated!
              const { uid, email, displayName } = auth.currentUser;

              dispatch(login({ uid: uid, email: email, name: displayName }));
              console.log(user);
              Navigate("/Browse");
            })
            .catch((error) => {
              // An error occurred
              setErrorMsg(error.message);
            });
        })
        .catch((error) => {
          console.log(error); // log the full error
          const errorCode = error.code;
          const errorMessage = error.message;
          setErrorMsg(errorCode + " " + errorMessage);
        });
    }
  };

  // const handleEmailChange = (e) => {
  //   setEmail(e.target.value);
  // };

  // const handlePasswordChange = (e) => {
  //   setPassword(e.target.value);
  // };

  // const handleSubmit = (e) => {
  //   e.preventDefault();
      //validate the form data
      // checkvaliddata(email,password);
  //   console.log(email, password);
  // };

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

      <form
        className="absolute bg-black w-3/12 my-60 right-0 left-0 mx-auto p-6 rounded-lg text-white opacity-80"
        onSubmit={(e) => e.preventDefault()}
      >
        <h1 className="text-3xl font-bold p-2 m-2">
          {IsSignin ? "Sign In" : "Sign Up"}
        </h1>
        {!IsSignin && (
          <input
            ref={name}
            className="p-4 my-4 rounded-lg  w-full bg-gray-700"
            type="text"
            placeholder="Full Name"
          />
        )}
        <input
          ref={email}
          className="p-4 my-4 rounded-lg  w-full bg-gray-700"
          type="email"
          placeholder="Email"
          // value={email}
          // onChange={handleEmailChange}
        />

        <input
          ref={password}
          className="p-4 my-4 rounded-lg w-full bg-gray-700"
          type="password"
          placeholder="Password"
          // value={password}
          // onChange={handlePasswordChange}
        />
        <p className="text-xs text-red-500 bold"> {ErrorMsg}</p>
        <button
          onClick={handleButtonclick}
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
