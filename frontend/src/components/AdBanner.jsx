import React, { useEffect, useRef } from 'react';

const AdBanner = () => {
  const bannerRef = useRef(null);

  useEffect(() => {
    // Eita check korche jate bar bar ad script load na hoy
    if (bannerRef.current && !bannerRef.current.firstChild) {
      const conf = document.createElement('script');
      const script = document.createElement('script');
      
      conf.innerHTML = `
        atOptions = {
          'key' : 'cb071bb67e4808c6e6560437d566b4a9',
          'format' : 'iframe',
          'height' : 60,
          'width' : 468,
          'params' : {}
        };
      `;
      script.src = "//www.topcreativeformat.com/cb071bb67e4808c6e6560437d566b4a9/invoke.js";
      script.async = true;

      bannerRef.current.append(conf);
      bannerRef.current.append(script);
    }
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
       {/* Ad ekhane render hobe */}
       <div ref={bannerRef}></div>
    </div>
  );
};

export default AdBanner;
