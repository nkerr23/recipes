import React from "react";
import "./RecipeListing.css";

function RecipeListing({ recipe, recipe_name, description, category, img_src }) {
  const name = recipe?.name ?? recipe_name ?? "Untitled recipe";
  const summary = recipe?.description ?? description ?? "No description added yet.";
  const imageUrl = recipe?.image_url ?? img_src;
  const label = recipe?.category ?? category;

  return (
    <article className="recipe-card">
      {imageUrl && (
        <img className="recipe-image" src={imageUrl} alt={name} />
      )}
      <div className="recipe-content">
        {label && <p className="recipe-category">{label}</p>}
        <h2>{name}</h2>
        <p>{summary}</p>
      </div>
    </article>
  );
}

export default RecipeListing;
