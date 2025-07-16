import React from "react";

const PhoneHeatMap = () => {
  const zones = [
    {
      top: "0%",
      height: "25%",
      color: "red-400",
    },
    {
      top: "25%",
      height: "25%",
      color: "yellow-400",
    },
    {
      top: "50%",
      height: "25%",
      color: "green-400",
    },
    {
      top: "75%",
      height: "25%",
      color: "blue-400",
    },
  ];

  return (
    <div className="relative w-[250px] h-[500px] bg-black rounded-[30px] border-8 border-gray-700 mx-auto">
      {/* Top speaker notch */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-2 bg-gray-400 rounded-full z-20" />

      {/* Inner screen */}
      <div className="relative w-full h-full bg-white rounded-[20px] overflow-hidden">
        {zones.map((zone, i) => (
          <div
            key={i}
            className={`absolute w-full bg-${zone.color} bg-opacity-50 blur-sm`}
            style={{
              top: zone.top,
              height: zone.height,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default PhoneHeatMap;
