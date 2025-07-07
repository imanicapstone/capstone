import React, { useState } from "react";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const { login, loginWithGoogle, currentUser } = useAuth();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await login(email, password);
      const userId = userCredential.user.uid;
      // navigate('/user/:id');
      navigate("/user/:id");
    } catch (error) {
      console.error(error);
      setError(error.message || "Login failed");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const userCredential = await loginWithGoogle();
      const userId = userCredential.user.uid;
      navigate(`/user/${userId}`);
    } catch (error) {
      console.error(error);
      setError("Google login failed");
    }
  };

  const handleNewUser = async () => {
    try {
      navigate(`/`);
    } catch (error) {
      console.error(error);
      setError("Redirect Failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white p-6">
      <h2
        className="text-4xl font-semibold text-center mb-24"
        style={{ color: "#6e6295" }}
      >
        Sign in to your Account
      </h2>

      {error && (
        <p className="bg-red-100 text-red-700 text-center rounded-md p-2 mb-4">
          {error}
        </p>
      )}
      <div className="w-full max-w-md space-y-5 mx-auto">
        <form onSubmit={handleEmailLogin} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-accent font-medium mb-1"
            >
              Email:
            </label>
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
            <label
              htmlFor="password"
              className="block text-accent font-medium mb-1"
            >
              Password:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="password"
              className="w-full px-4 py-2 border border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-gray-400"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-btngreen text-white font-semibold rounded-lg shadow-md hover:bg-btngreen/90 transition"
            style={{ backgroundColor: "#a0bd87" }}
          >
            Login
          </button>
        </form>

        <div className="flex items-center justify-center my-4">
          <span className="text-gray-500">Or</span>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-3 border border-accent rounded-lg hover:bg-accent hover:text-white transition text-accent font-semibold"
          style={{ backgroundColor: "#a0bd87" }}
        >
          Sign in with Google
        </button>

        <h3
          className="text-1xl font-semibold text-center mt-10"
          style={{ color: "#6e6295" }}
          onClick={handleNewUser}
        >
          New to Fina? Click here to create an account!
        </h3>
      </div>
    </div>
  );
};

export default Login;
