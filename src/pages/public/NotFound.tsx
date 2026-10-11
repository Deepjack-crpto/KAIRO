import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-bg p-4 text-center">
      <div>
        <p className="text-5xl font-extrabold text-accent">404</p>
        <p className="mt-3 text-fg/70">That page doesn't exist.</p>
        <Link to="/" className="btn-primary mt-6">Back to home</Link>
      </div>
    </div>
  );
}
