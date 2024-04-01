// get device info

import { useState, useEffect } from 'react';

export const useDeviceInfo = () => {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (navigator.userAgent.toLowerCase().includes('mac')) {
      setIsMac(true);
    } else {
      setIsMac(false);
    }
  }, []);

  return { isMac };
};
