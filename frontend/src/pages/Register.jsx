import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../firebase";


const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleEmailRegistration = async (e) => {
    e.preventDefault();
    setError;

    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error(error);
      setError(error.message || "Account Creation Failed");
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
      setError("Google registration failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white p-6">
      <h2
        className="text-4xl font-semibold text-center mb-24"
        style={{ color: "#6e6295" }}
      >
        Welcome to Fina
      </h2>
      {error && (
        <p className="bg-red-100 text-red-700 text-center rounded-md p-2 mb-4">
          {error}
        </p>
      )}

      

      <div className="w-full max-w-md space-y-5 mx-auto">
        <form onSubmit={handleEmailRegistration}>

          <div>
            <input
              type="name"
              //value={email}
              //onChange={}
              required
              placeholder="Your full name"
              className="w-full px-4 py-2 border border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-gray-400 mb-10"
            />
          </div>

          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full px-4 py-2 border border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-gray-400"
            />
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="password"
              className="w-full px-4 py-2 border border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-gray-400 p-20 mt-10"
            />
          </div>

          <div className="mb-6">
            <input
              type="date"
              id="dob"
              name="dob"
              //value={}
              //onChange={}
              required
              placeholder="Date of Birth"
              className="w-full px-4 py-2 border border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent mt-10 text-gray-400"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-btngreen text-white font-semibold rounded-lg shadow-md hover:bg-btngreen/90 transition mt-10 "
            style={{ backgroundColor: "#a0bd87" }}
          >
            Create Account
          </button>
        </form>


      </div>
    </div>
  );
};

export default Register;
