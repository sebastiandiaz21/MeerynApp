
"use client"

import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false); // Initialize to false, matching server render
  const [hasMounted, setHasMounted] = React.useState<boolean>(false);

  React.useEffect(() => {
    setHasMounted(true); // Indicate that the component has mounted on the client

    const checkIsMobile = () => window.innerWidth < MOBILE_BREAKPOINT;
    setIsMobile(checkIsMobile()); // Set the actual client-side value

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(checkIsMobile());
    };
    
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []); // Empty dependency array ensures this runs once on mount and cleans up

  // Before client-side mount, return false (consistent with server)
  if (!hasMounted) {
    return false;
  }

  // After mount, return the true client-side value
  return isMobile;
}
