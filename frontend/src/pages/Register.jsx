import React, { useState } from "react";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../constants";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const { register } = useAuth();

  const handleEmailRegistration = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // create Firebase auth user
      const userCredential = await register(email, password);
      const firebaseUID = userCredential.user.uid;
      const token = await userCredential.user.getIdToken();

      // stores user data in backend database
      const response = await fetch(`${API_BASE_URL}/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, //firebase token
        },
        body: JSON.stringify({
          id: firebaseUID,
          email,
          name,
          dateOfBirth: dateOfBirth || null,
        }),
      });

      if (!response.ok) {
        console.log(response);
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to store user data");
      }

      // navigates to dashboard page with actual user ID
      navigate(`/dashboard/${firebaseUID}`);
    } catch (error) {
      console.error(error);
      setError(error.message || "Account Creation Failed");
    }
  };

  const handleExistingUser = async () => {
    try {
      navigate("/user/login");
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
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
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
            Create Account and Login
          </button>

          <h3
            className="text-1xl font-semibold text-center mt-10"
            style={{ color: "#6e6295" }}
            onClick={handleExistingUser}
          >
            Already have an account? Click here to Login!
          </h3>
        </form>
      </div>
    </div>
  );
};

export default Register;
