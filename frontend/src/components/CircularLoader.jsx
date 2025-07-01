import React, { useEffect, useState } from "react";

const CircularLoader = ({ size = 100, strokeWidth = 8, duration = 2000 }) => {
  const [progress, setProgress] = useState(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
};
