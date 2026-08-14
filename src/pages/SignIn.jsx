import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabase";
import "./SignIn.css";

function SignIn({ user }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isSending, setIsSending] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setErrorMessage("");
        setIsSending(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        setIsSending(false);

        if (error) {
            setErrorMessage(error.message);
        }
    }

    if (user) {
        return <Navigate to="/" replace />;
    }

    return (
        <main className="signin-page">
            <header className="signin-header">
                <p className="eyebrow">Welcome back</p>
                <h1>Login</h1>
            </header>

            <form className="signin-form" onSubmit={handleSubmit}>
                <label>
                    <span>Email</span>
                    <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                </label>

                <label>
                    <span>Password</span>
                    <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />
                </label>

                {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}

                <button type="submit" disabled={isSending}>
                    {isSending ? "Logging in..." : "Login"}
                </button>
            </form>
        </main>
    );
}

export default SignIn;
