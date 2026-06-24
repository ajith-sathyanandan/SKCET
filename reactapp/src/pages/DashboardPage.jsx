import { useAuth } from "../context/AuthContext";

function DashboardPage() {
  const { user } = useAuth();

  return (
    <section className="dashboard-section">
      <span className="eyebrow">Protected route</span>
      <h2>Welcome, {user?.name}</h2>
      <p>
        You are authenticated as <strong>{user?.role}</strong>.
      </p>

      <div className="dashboard-grid">
        <article className="dashboard-card">
          <h3>My reservations</h3>
          <p>Your upcoming and past reservations will appear here.</p>
        </article>

        <article className="dashboard-card">
          <h3>Account security</h3>
          <p>Your session is protected using a JWT Bearer token.</p>
        </article>
      </div>
    </section>
  );
}

export default DashboardPage;
