import React from "react";
import { clofast_logo, clofast_logo_dark } from "../constants/images";

interface LogoProps {
  width?: number | string;
  height?: number | string;
  navbar_theme?: "light" | "dark";
}

const Logo: React.FC<LogoProps> = ({
  width = 120,
  height = "auto",
  navbar_theme,
}) => {
  return (
    <img
      src={navbar_theme === "dark" ? clofast_logo_dark : clofast_logo}
      alt="Clofast Logo"
      width={width}
      height={height}
      style={{ width, height }}
    />
  );
};

export default Logo;
