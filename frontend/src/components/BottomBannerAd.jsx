import React, { useEffect, useRef } from 'react';

const BottomBannerAd = () => {
  const bannerRef = useRef(null);

  useEffect(() => {
    if (bannerRef.current && !bannerRef.current.firstChild) {
      const conf = document.createElement('script');
      const script = document.createElement('script');
      
      conf.type = 'text/javascript';
      conf.innerHTML = `
        atOptions = {
          'key' : 'cb071bb67e4808c6e6560437d566b4a9',
          'format' : 'iframe',
          'height' : 60,
          'width' : 468,
          'params' : {}
        };
      `;
      
      script.type = 'text/javascript';
      script.src = "https://www.highperformanceformat.com/cb071bb67e4808c6e6560437d566b4a9/invoke.js";

      bannerRef.current.append(conf);
      bannerRef.current.append(script);
    }
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '40px 0 20px 0', overflow: 'hidden' }}>
       <div ref={bannerRef}></div>
    </div>
  );
};

export default BottomBannerAd;
