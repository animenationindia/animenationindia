import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="skeleton-card">
      {/* Fake Image Area */}
      <div className="skeleton-img"></div>
      
      {/* Fake Text Area */}
      <div className="skeleton-body">
        <div className="skeleton-text"></div>
        <div className="skeleton-text short"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;