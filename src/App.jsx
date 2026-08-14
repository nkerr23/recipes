import { useEffect, useState } from "react";
import { supabase } from "./supabase";

function App() {
  const [recipes, setRecipes] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function getRecipes() {
      const { data, error } = await supabase
        .from("recipes")
        .select("*");

      console.log("DATA:", data);
      console.log("ERROR:", error);
      console.log(data);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setRecipes(data ?? []);
    }

    getRecipes();
  }, []);

  return (
    <div>
      <h1>My Recipes</h1>

      {errorMessage && <p>Error: {errorMessage}</p>}

      {recipes.length === 0 && <p>No recipes found.</p>}

      {recipes.map((recipe) => (
        <div key={recipe.id}>
          <h2>{recipe.name}</h2>
          <p>{recipe.description}</p>
        </div>
      ))}
    </div>
  );
}

export default App;