import { Route, Routes } from "react-router-dom";
import Header from "./assets/Header";
import CreateRecipe from "./pages/CreateRecipe";
import Home from "./pages/Home";
import Recipe from "./pages/Recipe";

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recipes/new" element={<CreateRecipe />} />
        <Route path="/recipes/:recipeId/edit" element={<CreateRecipe />} />
        <Route path="/recipes/:recipeId" element={<Recipe />} />
      </Routes>
    </>
  );
}

export default App;
