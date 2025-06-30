import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../firebase";
import "./Register.css";

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
    <section className="register-container">
      <h2>Create a Fina Account</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleEmailRegistration}>
        <section>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
        </section>

        <section>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="password"
          />
        </section>
        <button type="submit">Create Account</button>
      </form>

      <section className="Registration-divider">Or</section>

      <button className="google-button" onClick={handleGoogleSignUp}>
        Create Account With Google
      </button>
    </section>
  );
};

export default Register;
