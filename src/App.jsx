import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Header from "./assets/Header";
import CreateRecipe from "./pages/CreateRecipe";
import Home from "./pages/Home";
import Recipe from "./pages/Recipe";
import SignIn from "./pages/SignIn";
import { supabase } from "./supabase";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <Header user={user} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn user={user} />} />
        <Route path="/recipes/new" element={user ? <CreateRecipe user={user} /> : <Navigate to="/signin" replace />} />
        <Route path="/recipes/:recipeId/edit" element={user ? <CreateRecipe user={user} /> : <Navigate to="/signin" replace />} />
        <Route path="/recipes/:recipeId" element={<Recipe user={user} />} />
      </Routes>
    </>
  );
}

export default App;
