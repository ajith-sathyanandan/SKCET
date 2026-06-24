import { Link } from "react-router";

function NotFoundPage() {
  return (
    <section className="not-found-page">
      <h2>404</h2>
      <p>The requested page could not be found.</p>
      <Link to="/">Return to home</Link>
    </section>
  );
}

export default NotFoundPage;
