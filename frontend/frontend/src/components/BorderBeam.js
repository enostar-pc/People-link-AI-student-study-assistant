import React from 'react';

export const BorderBeam = ({
  className = "",
  size = 200,
  duration = 15,
  anchor = 90,
  borderWidth = 1.5,
  colorFrom = "#6c63ff", // Updated to match the accent colors of the site
  colorTo = "#a78bfa",
  delay = 0,
}) => {
  return (
    <div
      style={{
        "--size": size,
        "--duration": duration,
        "--anchor": anchor,
        "--border-width": borderWidth,
        "--color-from": colorFrom,
        "--color-to": colorTo,
        "--delay": `-${delay}s`,
      }}
      className={`border-beam-effect ${className}`}
    />
  );
};
