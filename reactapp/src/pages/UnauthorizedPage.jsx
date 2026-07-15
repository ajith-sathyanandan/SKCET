import { Link } from "react-router-dom";

function UnauthorizedPage() {
  return (
    <section className="not-found-page">
      <span className="eyebrow">403</span>
      <h2>Access denied</h2>
      <p>Your account does not have permission to view this page.</p>
      <Link to="/dashboard">Return to dashboard</Link>
    </section>
  );
}

export default UnauthorizedPage;
