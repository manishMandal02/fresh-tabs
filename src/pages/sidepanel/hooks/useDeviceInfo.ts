// get device info

import { useState, useEffect } from 'react';

export const useDeviceInfo = () => {
  // TODO - get device info
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(true);
  }, []);

  return { isMac };
};
