type Props = {
  signInAction: () => Promise<void>;
  configured: boolean;
};

export default function LoginScreen({ signInAction, configured }: Props) {
  return (
    <main className="auth-page">
      <section className="auth-visual" aria-hidden="true">
        <div className="auth-glow auth-glow-one" />
        <div className="auth-glow auth-glow-two" />
        <div className="auth-grid" />
        <div className="auth-orbit auth-orbit-one" />
        <div className="auth-orbit auth-orbit-two" />
        <div className="auth-paw-trail">
          <span>🐾</span><span>🐾</span><span>🐾</span><span>🐾</span>
        </div>
        <div className="auth-story-card card-one"><span>⚖️</span><div><small>Weight</small><strong>Understand change over time</strong></div></div>
        <div className="auth-story-card card-two"><span>🏃</span><div><small>Activity</small><strong>Compared with their normal</strong></div></div>
        <div className="auth-story-card card-three"><span>🩺</span><div><small>Evidence</small><strong>Every insight stays traceable</strong></div></div>
        <div className="auth-paw"><span>🐾</span><i /></div>
        <div className="auth-visual-caption"><span>Health intelligence</span><strong>From scattered records to one clear story.</strong></div>
      </section>

      <section className="auth-panel">
        <div className="auth-mobile-ambient" aria-hidden="true"><i /><i /><span>🐾</span></div>
        <div className="auth-brand"><span className="brand-mark">🐾</span><strong>PeachyPawz</strong></div>
        <div className="auth-copy">
          <span className="auth-kicker">Pet health, finally understandable</span>
          <h1>A clearer story<br />for every paw.</h1>
          <p>Turn scattered health records into a timeline that explains what changed, what patterns exist, and what may be worth discussing with your veterinarian.</p>
        </div>

        <form action={signInAction} className="auth-actions">
          <button className="google-button" type="submit" disabled={!configured}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.2c0-.64-.06-1.25-.17-1.84H12v3.48h5.25a4.49 4.49 0 0 1-1.95 2.94v2.26h3.16c1.85-1.7 2.89-4.22 2.89-6.84Z"/><path fill="#34A853" d="M12 21.7c2.64 0 4.86-.87 6.48-2.37l-3.16-2.26c-.88.59-2 .94-3.32.94-2.55 0-4.71-1.72-5.48-4.04H3.26v2.33A9.8 9.8 0 0 0 12 21.7Z"/><path fill="#FBBC05" d="M6.52 13.97A5.9 5.9 0 0 1 6.21 12c0-.68.12-1.34.31-1.97V7.7H3.26A9.7 9.7 0 0 0 2.2 12c0 1.56.37 3.04 1.06 4.3l3.26-2.33Z"/><path fill="#EA4335" d="M12 5.99c1.44 0 2.73.49 3.75 1.46l2.81-2.82A9.43 9.43 0 0 0 12 2.3 9.8 9.8 0 0 0 3.26 7.7l3.26 2.33C7.29 7.71 9.45 5.99 12 5.99Z"/></svg>
            Continue with Google
          </button>
          {!configured && <p className="auth-config-note">Google OAuth is not configured yet. Add the three <code>AUTH_*</code> values from <code>.env.example</code>, then restart.</p>}
        </form>

        <div className="auth-trust-row"><span>🔒 Private by design</span><span>✓ Review before import</span><span>♡ No diagnosis claims</span></div>
        <p className="auth-footnote">PeachyPawz is a health-record intelligence prototype and does not replace veterinary care.</p>
      </section>
    </main>
  );
}
