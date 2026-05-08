import React, { useEffect, useRef } from 'react';

const NativeBannerAd = () => {
  const adContainer = useRef(null);

  useEffect(() => {
    // Eita check korbe jate ad bar bar reload na hoy
    if (adContainer.current && !adContainer.current.hasChildNodes()) {
      const div = document.createElement('div');
      div.id = 'container-0bab0950bfe41a72ceb8fccfcf99658b';
      
      const script = document.createElement('script');
      script.async = true;
      script.dataset.cfasync = 'false';
      script.src = '//pl28760862.profitablecpmrate.com/0bab0950bfe41a72ceb8fccfcf99658b/invoke.js';
      
      adContainer.current.appendChild(div);
      adContainer.current.appendChild(script);
    }
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '3rem 0' }} ref={adContainer}>
       {/* Ad ekhane automatically render hobe */}
    </div>
  );
};

export default NativeBannerAd;
