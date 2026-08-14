import { Link } from "react-router-dom";
import "./RecipeListing.css";

function RecipeListing({ recipe, recipe_name, description, category, img_src }) {
  const id = recipe?.id;
  const name = recipe?.name ?? recipe_name ?? "Untitled recipe";
  const summary = recipe?.description ?? description ?? "No description added yet.";
  const imageUrl = recipe?.image_url ?? img_src;
  const categories = recipe?.recipe_categories
    ?.map((recipeCategory) => recipeCategory.categories?.name)
    .filter(Boolean);
  const label = categories?.join(", ") || recipe?.category || category;
  const content = (
    <>
      {imageUrl && (
        <img className="recipe-image" src={imageUrl} alt={name} />
      )}
      {!imageUrl && (
        <div className="recipe-image recipe-image-placeholder" aria-hidden="true" />
      )}
      <div className="recipe-content">
        {label && <p className="recipe-category">{label}</p>}
        <h2>{name}</h2>
        <p>{summary}</p>
      </div>
    </>
  );

  if (id) {
    return (
      <Link className="recipe-card recipe-card-link" to={`/recipes/${id}`}>
        {content}
      </Link>
    );
  }

  return (
    <article className="recipe-card">
      {content}
    </article>
  );
}

export default RecipeListing;
