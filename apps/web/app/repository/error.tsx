"use client";

export default function RepositoryError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mj-public-site mj-repository-site">
      <div className="mj-public-frame">
        <section className="mj-public-page-hero" aria-labelledby="repository-error-heading" role="alert">
          <p className="mj-section-label">Atlas</p>
          <h1 id="repository-error-heading">Atlas could not load.</h1>
          <p>Try again, or return to the home page.</p>
          <div className="mj-public-actions">
            <button className="mj-primary-button" type="button" onClick={reset}>Try again</button>
            <a className="mj-secondary-button" href="/">Return home</a>
          </div>
        </section>
      </div>
    </main>
  );
}
