import React from "react";

const Slide = ({ description }: { description: React.ReactNode }) => {
  return (
    <div className="h-full flex flex-col flex-wrap place-items-center shadow-md overflow-x-hidden overflow-auto">
      {description}
    </div>
  );
};

export default Slide;
