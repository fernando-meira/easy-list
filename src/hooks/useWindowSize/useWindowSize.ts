import { useEffect, useState } from "react";

type UseWindowSizeProps = {
  width: number;
  height: number;
};

export default function useWindowSize() {
  const [windowSize, setWindowSize] = useState<UseWindowSizeProps>({
    width: 0,
    height: 0,
  });

  const isDesktop = windowSize.width >= 768;

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener("resize", handleResize);

    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return { ...windowSize, isDesktop };
}
