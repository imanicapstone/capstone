import React, { useEffect, useState } from "react";

const CircularLoader = ({
    size = 100,
    strokeWidth = 18,
    duration = 2000,
    percentageSpent = 75
}) => {
  const [progress, setProgress] = useState(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;


useEffect(() => {
    let start = null;

    const step = (timestamp) => {
        if (!start) start = timestamp;
        const progressTime = timestamp - start;
        const progressPercent = Math.min(progressTime / duration, 1) * percentageSpent;
        setProgress(progressPercent);
        if (progressTime < duration) {
            requestAnimationFrame(step);
        }
    };
   requestAnimationFrame(step);
}, [percentageSpent, duration]);

const offset = circumference - (progress / 100) * circumference;

    return (
        <svg width={size} height={size}>
            <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e6e6e6"
            strokeWidth={strokeWidth}
            fill="none"
            />

            <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#a0bd87"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: "stroke-dashoffset 0.3s ease" }}
            />

            <text
            x="50%"
            y="50%"
            dy="0.3em"
            textAnchor="middle"
            fontSize={size * 0.2}
            fill="#333"
            >
            {Math.round(progress)}%
            </text>
            <text
            x="50%"
            y="70%"
            textAnchor="middle"
            > Of monthly budget </text>
        </svg>
    );
};



export default CircularLoader;
