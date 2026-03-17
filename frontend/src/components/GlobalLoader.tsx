import { useGlobalLoader } from '../context/GlobalLoaderContext';

export default function GlobalLoader() {
  const { loading } = useGlobalLoader();

  if (!loading) return null;

  return (
    <div className="global-loader-bar" aria-live="polite" aria-label="Loading">
      <div className="global-loader-progress" />
    </div>
  );
}
