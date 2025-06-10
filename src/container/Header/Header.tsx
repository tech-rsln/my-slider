import React from "react";

const Header = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="sticky bg-white top-0 flex justify-center items-center p-4 min-w-full z-10 shadow-sm">{children}</div>
  );
};

export default Header;
