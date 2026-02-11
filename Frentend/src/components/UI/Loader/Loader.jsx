import React from 'react';
import './Loader.css';

export function Loader({ size = 'md', message = 'Loading...' }) {
  return (
    <div className={`loader loader--${size}`}>
      <div className="loader__spinner"></div>
      {message && <p className="loader__text">{message}</p>}
    </div>
  );
}

export function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="page-loader">
      <div className="loader loader--lg">
        <div className="loader__spinner"></div>
        <p className="loader__text">{message}</p>
      </div>
    </div>
  );
}

export function SkeletonLoader({ count = 3 }) {
  return (
    <div className="skeleton-loader">
      {Array(count).fill(0).map((_, i) => (
        <div key={i} className="skeleton-loader__item">
          <div className="skeleton-loader__line skeleton-loader__line--lg"></div>
          <div className="skeleton-loader__line skeleton-loader__line--md"></div>
          <div className="skeleton-loader__line skeleton-loader__line--sm"></div>
        </div>
      ))}
    </div>
  );
}

export default Loader;
