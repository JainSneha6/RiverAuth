import React from "react";

const PhoneHeatMap = () => {
  const zones = [
    {
      name: "Top Area",
      top: "0%",
      height: "25%",
      intensity: 85,
      color: "#ef4444", // red
    },
    {
      name: "Upper Middle",
      top: "25%",
      height: "25%",
      intensity: 60,
      color: "#f59e0b", // yellow
    },
    {
      name: "Lower Middle",
      top: "50%",
      height: "25%",
      intensity: 90,
      color: "#10b981", // green
    },
    {
      name: "Bottom Area",
      top: "75%",
      height: "25%",
      intensity: 40,
      color: "#3b82f6", // blue
    },
  ];

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Phone mockup with heatmap */}
      <div className="relative">
        <div className="w-[180px] h-[320px] bg-gray-800 rounded-[25px] p-2 shadow-2xl">
          {/* Phone screen */}
          <div className="relative w-full h-full bg-white rounded-[20px] overflow-hidden">
            {/* Top notch */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-2 bg-gray-800 rounded-full z-20" />
            
            {/* Heatmap zones */}
            {zones.map((zone, i) => (
              <div
                key={i}
                className="absolute w-full transition-all duration-300 hover:opacity-80"
                style={{
                  top: zone.top,
                  height: zone.height,
                  backgroundColor: zone.color,
                  opacity: zone.intensity / 100 * 0.7,
                }}
              />
            ))}
            
            {/* Screen content overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="h-8 bg-gray-100 bg-opacity-50" />
              <div className="flex-1 p-4 space-y-2">
                <div className="h-2 bg-gray-300 bg-opacity-50 rounded w-3/4" />
                <div className="h-2 bg-gray-300 bg-opacity-50 rounded w-1/2" />
                <div className="h-2 bg-gray-300 bg-opacity-50 rounded w-2/3" />
              </div>
              <div className="h-12 bg-gray-100 bg-opacity-50 border-t" />
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="w-full space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 text-center">Activity Intensity</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {zones.map((zone, i) => (
            <div key={i} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded"
                style={{ backgroundColor: zone.color }}
              />
              <span className="text-gray-600">{zone.name}</span>
              <span className="font-semibold text-gray-800">{zone.intensity}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PhoneHeatMap;
