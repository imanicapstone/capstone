import React, { useState } from 'react';
import { useNavigate } from react-router-dom; 
import {
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
}   from 'firebase/auth';
import { auth } from '../firebase';
import './Login.css'

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/dashboard'); 
        }   catch (error) {
            console.error(err);
            setError(err.message || 'Login failed');
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            navigate('/dashboard');
        }   catch(error) {
            console.error(error);
            setError('Google login failed');
        }
    };

    return(
        <section className="login-container">
            <h2>Sign in to your Account</h2>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleEmailLogin}>
                <section>
                    <label>Email:</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    />
                </section>

                <section>
                    <label>Password:</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="password"
                    />
                </section>
                <button type="submit">Login</button>
                </form>

                <section className="login-divider">Or</section>

                <button className="google-button" onClick={handleGoogleLogin}>
                    Sign in with Google
                </button>

        </section>
    );
};

export default Login;

