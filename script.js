// --- UTILITY & INTERPOLATION FUNCTIONS (Unchanged) ---
const lerp = (start, end, amount) => start * (1 - amount) + end * amount;
const hexToRgb = (hex) => {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};
const rgbToHex = (r, g, b) =>
  "#" +
  ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b))
    .toString(16)
    .slice(1)
    .padStart(6, "0");
const lerpColor = (hex1, hex2, amount) => {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  if (!c1 || !c2) return hex1;
  return rgbToHex(
    lerp(c1.r, c2.r, amount),
    lerp(c1.g, c2.g, amount),
    lerp(c1.b, c2.b, amount)
  );
};

// --- PENDULUM MANAGEMENT ---
let pendulumIdCounter = 0;

function addPendulum() {
  const table = document.getElementById("pendulum-table");
  const tbody = document.getElementById("pendulum-tbody");
  const id = pendulumIdCounter++;

  // Show table if this is the first pendulum
  if (tbody.children.length === 0) {
    table.style.display = "table";
  }

  const row = document.createElement("tr");
  row.className = "pendulum-control";
  row.id = `pendulum-${id}`;

  row.innerHTML = `
          <td>P${id + 1}</td>
          <td><input type="number" class="pendulum-frequency" value="1.0" step="0.01" min="0.1" onchange="generate()"></td>
          <td><input type="number" class="pendulum-magnitude" value="100" step="10" min="1" onchange="generate()"></td>
          <td><input type="number" class="pendulum-phase" value="0" step="1" min="0" max="360" onchange="generate()"></td>
          <td><input type="number" class="pendulum-dampening" value="0.0" step="0.01" min="0" max="1" onchange="generate()"></td>
          <td><input type="checkbox" class="pendulum-x-axis" checked onchange="generate()"></td>
          <td><input type="checkbox" class="pendulum-y-axis" checked onchange="generate()"></td>
          <td><button class="remove-btn" onclick="removePendulum(${id})">×</button></td>
        `;

  tbody.appendChild(row);

  // Auto-generate visualization when adding new pendulum
  generate();
}

function removePendulum(id) {
  const row = document.getElementById(`pendulum-${id}`);
  const tbody = document.getElementById("pendulum-tbody");
  const table = document.getElementById("pendulum-table");

  row.remove();

  // Hide table if no pendulums left
  if (tbody.children.length === 0) {
    table.style.display = "none";
  }

  // Regenerate visualization after removing pendulum
  generate();
}

function getPendulumData() {
  const pendulums = [];
  document.querySelectorAll(".pendulum-control").forEach((control) => {
    const pendulum = {
      frequency: parseFloat(control.querySelector(".pendulum-frequency").value),
      magnitude: parseFloat(control.querySelector(".pendulum-magnitude").value),
      phase:
        (parseFloat(control.querySelector(".pendulum-phase").value) * Math.PI) /
        180, // Convert to radians
      dampening: parseFloat(control.querySelector(".pendulum-dampening").value),
      xAxis: control.querySelector(".pendulum-x-axis").checked,
      yAxis: control.querySelector(".pendulum-y-axis").checked,
    };
    pendulums.push(pendulum);
  });
  return pendulums;
}

function generateHarmonographPoints(
  pendulums,
  timeStart = 0,
  timeEnd = 10,
  numPoints = 1000
) {
  const points = [];
  const timeStep = (timeEnd - timeStart) / (numPoints - 1);

  for (let i = 0; i < numPoints; i++) {
    const t = timeStart + i * timeStep;
    let x = 0,
      y = 0;

    pendulums.forEach((pendulum) => {
      const dampening = Math.exp(-pendulum.dampening * t);
      const oscillation =
        pendulum.magnitude *
        dampening *
        Math.sin(2 * Math.PI * pendulum.frequency * t + pendulum.phase);

      if (pendulum.xAxis) x += oscillation;
      if (pendulum.yAxis) y += oscillation;
    });

    points.push({ x, y, index: i });
  }

  return points;
}

function calculateLoopLength(frequency, totalPoints = 1000) {
  if (frequency === 1) {
    // When frequency is 1, use the entire point range (no looping)
    return totalPoints;
  } else {
    // When frequency > 1, divide total points by frequency for loop length
    return Math.round(totalPoints / frequency);
  }
}

function updatePointCountDisplay() {
  const timeStart = parseFloat(document.getElementById("timeStart").value) || 0;
  const timeEnd = parseFloat(document.getElementById("timeEnd").value) || 10;
  const timeStep = 0.01; // Same as in generateHarmonographPoints

  if (timeEnd > timeStart) {
    const pointCount = Math.round((timeEnd - timeStart) / timeStep);
    document.getElementById("pointCount").textContent = pointCount;
  } else {
    document.getElementById("pointCount").textContent = "Invalid";
  }
}

function updateLoopLengthDisplays() {
  const totalPoints =
    parseInt(document.getElementById("pointCount").value) || 1000;

  document.querySelectorAll(".prop-control-group").forEach((group) => {
    const frequencyInput = group.querySelector(".prop-frequency");
    const display = group.querySelector(".prop-loop-length-display");
    if (frequencyInput && display) {
      const frequency = parseFloat(frequencyInput.value);
      if (frequency === 1) {
        display.textContent = "No Loop";
      } else {
        const loopLength = calculateLoopLength(frequency, totalPoints);
        display.textContent = `${frequency}x (${loopLength} pts)`;
      }
    }
  });
}

function toggleRenderMode() {
  const mode = document.getElementById("renderMode").value;

  // Find the correct sections by their legend text
  const allFieldsets = document.querySelectorAll("fieldset");
  let lineWidthFieldset, objectWidthFieldset, heightFieldset;

  allFieldsets.forEach((fieldset) => {
    const legend = fieldset.querySelector("legend").textContent;
    if (legend === "Line Width") lineWidthFieldset = fieldset;
    if (legend === "Object Width") objectWidthFieldset = fieldset;
    if (legend === "Height") heightFieldset = fieldset;
  });

  if (mode === "line") {
    if (lineWidthFieldset) lineWidthFieldset.style.display = "block";
    if (objectWidthFieldset) objectWidthFieldset.style.display = "none";
    if (heightFieldset) heightFieldset.style.display = "none";
  } else {
    if (lineWidthFieldset) lineWidthFieldset.style.display = "none";
    if (objectWidthFieldset) objectWidthFieldset.style.display = "block";
    if (heightFieldset) heightFieldset.style.display = "block";
  }
}

// --- HIDE/SHOW CONTROLS ---
function hideControls() {
  const controlsPanel = document.getElementById("controlsPanel");
  const toggleBtn = document.getElementById("toggleControlsBtn");

  controlsPanel.classList.add("hidden");
  toggleBtn.classList.add("visible");
}

function showControls() {
  const controlsPanel = document.getElementById("controlsPanel");
  const toggleBtn = document.getElementById("toggleControlsBtn");

  controlsPanel.classList.remove("hidden");
  toggleBtn.classList.remove("visible");
}

// Handle window resize to update visualization
function handleResize() {
  // Only regenerate if we have points to render
  const visualizer = document.getElementById("visualizer");
  if (visualizer.children.length > 0) {
    generate();
  }
}

// --- UI & CONTROL POINT MANAGEMENT (Unchanged) ---
let controlPointIdCounter = 0;
function addControlPoint(propName, defaultValue) {
  const container = document.getElementById(`${propName}-points`);
  const id = controlPointIdCounter++;
  const div = document.createElement("div");
  div.className = "control-point";
  div.id = `cp-${id}`;
  const inputType = propName === "color" ? "color" : "number";
  const step = propName === "opacity" ? "1" : "1";
  const minVal = propName === "opacity" ? "0" : "";
  const maxVal = propName === "opacity" ? "100" : "";
  div.innerHTML = `
            <input type="number" class="cp-index" placeholder="%" value="0" min="0" max="100" step="1">
            <input type="${inputType}" class="cp-value" placeholder="Value" value="${defaultValue}" step="${step}" ${
    minVal ? `min="${minVal}"` : ""
  } ${maxVal ? `max="${maxVal}"` : ""}>
            <button class="remove-btn" onclick="removeControlPoint(${id})">X</button>
        `;
  container.appendChild(div);
}
function removeControlPoint(id) {
  document.getElementById(`cp-${id}`).remove();
}

// --- CORE LOGIC & GENERATION (Unchanged) ---

// Global panzoom instance for cleanup
let currentPanzoomInstance = null;

function initializePanzoom(element) {
  // Dispose of any existing panzoom instance
  if (currentPanzoomInstance) {
    currentPanzoomInstance.dispose();
    currentPanzoomInstance = null;
  }

  // Initialize panzoom with custom options
  currentPanzoomInstance = panzoom(element, {
    maxZoom: 10,
    minZoom: 0.1,
    zoomSpeed: 0.1,
    smoothScroll: true,
    // Allow zooming with mouse wheel
    beforeWheel: function (e) {
      // Allow wheel zoom always (remove this to require modifier key)
      return false;
    },
    // Center the zoom on the mouse position
    transformOrigin: null, // Use mouse position as zoom center
    // Add some bounds to prevent getting completely lost
    bounds: false,
    boundsPadding: 0.1,
  });

  // Add event listeners for better user feedback
  currentPanzoomInstance.on("zoom", function (e) {
    updateStatusIndicators(e);
  });

  currentPanzoomInstance.on("pan", function (e) {
    updateStatusIndicators(e);
  });

  currentPanzoomInstance.on("transform", function (e) {
    updateStatusIndicators(e);
  });

  return currentPanzoomInstance;
}

function updateStatusIndicators(panzoomInstance) {
  const transform = panzoomInstance.getTransform();
  const zoomStatus = document.getElementById("zoomStatus");
  const panStatus = document.getElementById("panStatus");

  if (zoomStatus) {
    zoomStatus.textContent = `Zoom: ${Math.round(transform.scale * 100)}%`;
  }

  if (panStatus) {
    panStatus.textContent = `Pan: ${Math.round(transform.x)}, ${Math.round(
      transform.y
    )}`;
  }
}

function resetPanZoom() {
  if (currentPanzoomInstance) {
    // Reset to original position and zoom
    currentPanzoomInstance.smoothZoom(0, 0, 1);
    currentPanzoomInstance.smoothMoveTo(0, 0);

    // Update status indicators immediately
    setTimeout(() => {
      updateStatusIndicators(currentPanzoomInstance);
    }, 500); // Allow time for smooth animation
  }
}

function resetTransform() {
  document.getElementById("stretchX").value = "1";
  document.getElementById("stretchY").value = "1";
  document.getElementById("imageRotation").value = "0";
  generate();
}

function calculatePropertyValue(
  currentIndex,
  controlPoints,
  loopLength,
  lerpFunc,
  frequency,
  totalPoints
) {
  if (controlPoints.length === 0) return undefined;
  if (controlPoints.length === 1) return controlPoints[0].value;

  // For frequency = 1 (no loop), interpolate across entire range
  if (frequency === 1) {
    const startPoint = controlPoints[0];
    const endPoint = controlPoints[controlPoints.length - 1];
    const progress = currentIndex / (totalPoints - 1);
    return lerpFunc(startPoint.value, endPoint.value, progress);
  }

  // For frequency > 1, use looping behavior
  let startPoint = controlPoints.findLast((p) => p.index <= currentIndex);
  let endPoint = controlPoints.find((p) => p.index > currentIndex);
  if (!startPoint) {
    startPoint = controlPoints[controlPoints.length - 1];
    endPoint = controlPoints[0];
  } else if (!endPoint) {
    endPoint = controlPoints[0];
  }
  let startIndex = startPoint.index;
  let endIndex = endPoint.index;
  let range;
  if (startIndex > endIndex) {
    range = loopLength - startIndex + endIndex;
    if (currentIndex >= startIndex) {
      currentIndex = currentIndex - startIndex;
    } else {
      currentIndex = currentIndex + (loopLength - startIndex);
    }
  } else {
    range = endIndex - startIndex;
    currentIndex = currentIndex - startIndex;
  }
  if (range === 0) return startPoint.value;
  const amount = currentIndex / range;
  return lerpFunc(startPoint.value, endPoint.value, amount);
}

function applyRotationToPoints(points) {
  const rotationEnabled = document.getElementById("rotationEnabled").checked;

  if (!rotationEnabled || points.length === 0) {
    return points;
  }

  const centerX = parseFloat(document.getElementById("rotationCenterX").value);
  const centerY = parseFloat(document.getElementById("rotationCenterY").value);
  const speed = parseFloat(document.getElementById("rotationSpeed").value);
  const direction = parseInt(
    document.getElementById("rotationDirection").value
  );

  return points.map((point, index) => {
    // Calculate rotation angle based on point order and speed
    const angle = index * speed * direction * (Math.PI / 180);

    // Translate point to origin (subtract center)
    const translatedX = point.x - centerX;
    const translatedY = point.y - centerY;

    // Apply rotation
    const rotatedX =
      translatedX * Math.cos(angle) - translatedY * Math.sin(angle);
    const rotatedY =
      translatedX * Math.sin(angle) + translatedY * Math.cos(angle);

    // Translate back (add center)
    return {
      x: rotatedX + centerX,
      y: rotatedY + centerY,
    };
  });
}

function applyTransformToPoints(points) {
  if (points.length === 0) return points;

  const stretchX = parseFloat(document.getElementById("stretchX").value) || 1;
  const stretchY = parseFloat(document.getElementById("stretchY").value) || 1;
  const imageRotation =
    parseFloat(document.getElementById("imageRotation").value) || 0;

  return points.map((point) => {
    // Apply stretching first
    let x = point.x * stretchX;
    let y = point.y * stretchY;

    // Apply image rotation if specified
    if (imageRotation !== 0) {
      const angleInRadians = (imageRotation * Math.PI) / 180;
      const cos = Math.cos(angleInRadians);
      const sin = Math.sin(angleInRadians);

      const rotatedX = x * cos - y * sin;
      const rotatedY = x * sin + y * cos;

      x = rotatedX;
      y = rotatedY;
    }

    return {
      ...point,
      x: x,
      y: y,
    };
  });
}

function generate() {
  const pendulums = getPendulumData();
  if (pendulums.length === 0) {
    document.getElementById("visualizer").innerHTML =
      "<p>Add at least one pendulum to generate visualization</p>";
    return;
  }

  const timeStart = parseFloat(document.getElementById("timeStart").value);
  const timeEnd = parseFloat(document.getElementById("timeEnd").value);
  let numPoints = parseInt(document.getElementById("pointCount").value);

  if (timeEnd <= timeStart) {
    document.getElementById("visualizer").innerHTML =
      "<p>Time End must be greater than Time Start</p>";
    return;
  }

  if (numPoints < 2) {
    document.getElementById("visualizer").innerHTML =
      "<p>Points to Be Generated must be at least 2</p>";
    return;
  }

  // Check if points exceed 50,000 limit
  if (numPoints > 50000) {
    document.getElementById("visualizer").innerHTML =
      "<p style='color: #ff4d4d; font-weight: bold; padding: 20px; text-align: center;'>Point count limit exceeded! Maximum allowed is 50,000 points.<br>Setting point count to 50,000...</p>";
    document.getElementById("pointCount").value = 50000;
    numPoints = 50000;

    // Continue with generation after a brief delay to show the message
    setTimeout(() => {
      generate();
    }, 1500);
    return;
  }

  const points = generateHarmonographPoints(
    pendulums,
    timeStart,
    timeEnd,
    numPoints
  );

  // Apply rotation if enabled
  const rotatedPoints = applyRotationToPoints(points);

  // Apply stretching and image rotation
  const transformedPoints = applyTransformToPoints(rotatedPoints);

  const renderMode = document.getElementById("renderMode").value;

  // Apply property controls to the points
  const properties =
    renderMode === "line"
      ? ["color", "lineWidth", "opacity"]
      : ["color", "objectWidth", "height", "opacity"];

  properties.forEach((propName) => {
    const fieldset = document
      .getElementById(`${propName}-points`)
      ?.closest("fieldset");
    if (!fieldset) return;

    const frequencyInput = fieldset.querySelector(".prop-frequency");
    const frequency = parseFloat(frequencyInput.value);
    const loopLength = calculateLoopLength(frequency, numPoints);

    const offset = parseInt(fieldset.querySelector(".prop-offset").value);
    // Convert offset percentage to actual point offset
    const offsetPoints = Math.round(
      (offset / 100) * (frequency === 1 ? numPoints : loopLength)
    );
    const lerpFunc = propName === "color" ? lerpColor : lerp;
    const controlPoints = Array.from(
      fieldset.querySelectorAll(".control-point")
    )
      .map((el) => ({
        percentage: parseInt(el.querySelector(".cp-index").value), // Now stored as percentage
        value:
          el.querySelector(".cp-value").type === "number"
            ? parseFloat(el.querySelector(".cp-value").value)
            : el.querySelector(".cp-value").value,
      }))
      .sort((a, b) => a.percentage - b.percentage);
    if (controlPoints.length === 0 || loopLength <= 0) return;

    // Convert percentages to actual indices based on loop length
    const indexControlPoints = controlPoints.map((cp) => ({
      index: Math.round((cp.percentage / 100) * (loopLength - 1)),
      value: cp.value,
    }));

    // Auto-add first and last control points for frequency = 1 if not present
    if (frequency === 1 && indexControlPoints.length >= 1) {
      // Ensure we have a point at index 0 (0%)
      if (!indexControlPoints.find((cp) => cp.index === 0)) {
        indexControlPoints.unshift({
          index: 0,
          value: indexControlPoints[0].value,
        });
      }
      // Ensure we have a point at the last index (100%)
      const lastIndex = numPoints - 1;
      if (!indexControlPoints.find((cp) => cp.index === lastIndex)) {
        indexControlPoints.push({
          index: lastIndex,
          value: indexControlPoints[indexControlPoints.length - 1].value,
        });
      }
      indexControlPoints.sort((a, b) => a.index - b.index);
    }

    for (let i = 0; i < transformedPoints.length; i++) {
      let effectiveIndex = i - offsetPoints;

      if (frequency === 1) {
        // For no-loop mode, use the actual index
        effectiveIndex = Math.max(0, Math.min(effectiveIndex, numPoints - 1));
      } else {
        // For looping mode, wrap the index
        effectiveIndex =
          ((effectiveIndex % loopLength) + loopLength) % loopLength;
      }

      const value = calculatePropertyValue(
        effectiveIndex,
        indexControlPoints,
        loopLength,
        lerpFunc,
        frequency,
        numPoints
      );
      if (value !== undefined) {
        // Convert transparency percentage to opacity for rendering
        if (propName === "opacity") {
          transformedPoints[i][propName] = (100 - value) / 100; // 0% transparency = 1.0 opacity, 100% transparency = 0.0 opacity
        } else {
          transformedPoints[i][propName] = value;
        }
      }
    }
  });

  if (renderMode === "line") {
    renderHarmonograph(transformedPoints);
  } else {
    renderObjects(transformedPoints);
  }
}

function renderHarmonograph(points) {
  const visualizer = document.getElementById("visualizer");
  visualizer.innerHTML = "";

  // Create SVG for drawing curves
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.style.width = "100vw";
  svg.style.height = "100vh";
  svg.id = "harmonograph-svg";

  // Get background color from picker
  const backgroundColor = document.getElementById(
    "backgroundColorPicker"
  ).value;
  svg.style.background = backgroundColor;

  // Create a group element that will be panzoomable
  const panzoomGroup = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  );
  panzoomGroup.id = "panzoom-group";
  svg.appendChild(panzoomGroup);

  if (points.length < 2) return;

  // Calculate bounds for scaling
  const xValues = points.map((p) => p.x);
  const yValues = points.map((p) => p.y);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);

  const padding = 50;
  const svgWidth = window.innerWidth;
  const svgHeight = window.innerHeight;

  // Get transform values
  const stretchX = parseFloat(document.getElementById("stretchX").value) || 1;
  const stretchY = parseFloat(document.getElementById("stretchY").value) || 1;

  // Calculate scale factors that account for stretching
  const baseScale = Math.min(
    (svgWidth - 2 * padding) / (xMax - xMin),
    (svgHeight - 2 * padding) / (yMax - yMin)
  );

  // Apply stretch to the scale factors
  const scaleX = baseScale * stretchX;
  const scaleY = baseScale * stretchY;

  // Calculate center for centering the stretched image
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;
  const dataCenterX = (xMin + xMax) / 2;
  const dataCenterY = (yMin + yMax) / 2;

  // Scale points with stretch applied
  const scaledPoints = points.map((point) => ({
    x: centerX + (point.x - dataCenterX) * scaleX,
    y: centerY + (point.y - dataCenterY) * scaleY,
    color: point.color,
    lineWidth: point.lineWidth,
    opacity: point.opacity,
  }));

  // Create individual Bezier curve segments to support varying properties
  for (let i = 0; i < scaledPoints.length - 1; i++) {
    const currentPoint = scaledPoints[i];
    const nextPoint = scaledPoints[i + 1];

    // Calculate control points for this segment
    const currentControls = calculateControlPoints(scaledPoints, i);
    const nextControls = calculateControlPoints(scaledPoints, i + 1);

    let pathData = `M ${currentPoint.x} ${currentPoint.y}`;

    if (currentControls && nextControls) {
      // Use Bezier curve
      const cp1 = currentControls.cp2; // Outgoing from current point
      const cp2 = nextControls.cp1; // Incoming to next point
      pathData += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${nextPoint.x} ${nextPoint.y}`;
    } else {
      // Fallback to line
      pathData += ` L ${nextPoint.x} ${nextPoint.y}`;
    }

    // Create path element for this segment
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", currentPoint.color || "#000");
    path.setAttribute("stroke-width", currentPoint.lineWidth || 1);
    path.setAttribute(
      "opacity",
      currentPoint.opacity !== undefined ? currentPoint.opacity : 1
    );
    path.setAttribute("stroke-linecap", "butt");

    panzoomGroup.appendChild(path);
  }

  visualizer.appendChild(svg);

  // Initialize panzoom on the group element
  initializePanzoom(panzoomGroup);
}

function renderObjects(points) {
  const visualizer = document.getElementById("visualizer");
  visualizer.innerHTML = "";

  // Create SVG for drawing objects
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.style.width = "100vw";
  svg.style.height = "100vh";
  svg.id = "harmonograph-svg";

  // Get background color from picker
  const backgroundColor = document.getElementById(
    "backgroundColorPicker"
  ).value;
  svg.style.background = backgroundColor;

  // Create a group element that will be panzoomable
  const panzoomGroup = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  );
  panzoomGroup.id = "panzoom-group";
  svg.appendChild(panzoomGroup);

  if (points.length === 0) return;

  // Calculate bounds for scaling
  const xValues = points.map((p) => p.x);
  const yValues = points.map((p) => p.y);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);

  const padding = 50;
  const svgWidth = window.innerWidth;
  const svgHeight = window.innerHeight;

  // Get transform values
  const stretchX = parseFloat(document.getElementById("stretchX").value) || 1;
  const stretchY = parseFloat(document.getElementById("stretchY").value) || 1;

  // Calculate scale factors that account for stretching
  const baseScale = Math.min(
    (svgWidth - 2 * padding) / (xMax - xMin),
    (svgHeight - 2 * padding) / (yMax - yMin)
  );

  // Apply stretch to the scale factors
  const scaleX = baseScale * stretchX;
  const scaleY = baseScale * stretchY;

  // Calculate center for centering the stretched image
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;
  const dataCenterX = (xMin + xMax) / 2;
  const dataCenterY = (yMin + yMax) / 2;

  // Create circles for each point
  points.forEach((point, i) => {
    // Scale points with stretch applied
    const x = centerX + (point.x - dataCenterX) * scaleX;
    const y = centerY + (point.y - dataCenterY) * scaleY;

    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", (point.objectWidth || 3) / 2);
    circle.setAttribute("fill", point.color || "#000");
    circle.setAttribute(
      "opacity",
      point.opacity !== undefined ? point.opacity : 1
    );
    circle.setAttribute("stroke", "none");

    panzoomGroup.appendChild(circle);
  });

  visualizer.appendChild(svg);

  // Initialize panzoom on the group element
  initializePanzoom(panzoomGroup);
}

// --- COLLAPSIBLE FIELDSETS ---
function initializeCollapsibleFieldsets() {
  document.querySelectorAll("fieldset.collapsible").forEach((fieldset) => {
    // Close all fieldsets by default
    fieldset.classList.remove("open");
    const legend = fieldset.querySelector("legend");
    if (legend) {
      legend.addEventListener("click", function () {
        fieldset.classList.toggle("open");
      });
    }
  });
}

// --- SAVE/LOAD SETTINGS ---
function saveSettings() {
  const settings = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    mainControls: {
      pointCount: document.getElementById("pointCount").value,
      renderMode: document.getElementById("renderMode").value,
      timeStart: document.getElementById("timeStart").value,
      timeEnd: document.getElementById("timeEnd").value,
      backgroundColor: document.getElementById("backgroundColorPicker").value,
      rotation: {
        enabled: document.getElementById("rotationEnabled").checked,
        centerX: document.getElementById("rotationCenterX").value,
        centerY: document.getElementById("rotationCenterY").value,
        speed: document.getElementById("rotationSpeed").value,
        direction: document.getElementById("rotationDirection").value,
      },
      transform: {
        stretchX: document.getElementById("stretchX").value,
        stretchY: document.getElementById("stretchY").value,
        imageRotation: document.getElementById("imageRotation").value,
      },
    },
    pendulums: [],
    properties: {},
  };

  // Save pendulum data
  document.querySelectorAll(".pendulum-control").forEach((control, index) => {
    const pendulum = {
      frequency: control.querySelector(".pendulum-frequency").value,
      magnitude: control.querySelector(".pendulum-magnitude").value,
      phase: control.querySelector(".pendulum-phase").value,
      dampening: control.querySelector(".pendulum-dampening").value,
      xAxis: control.querySelector(".pendulum-x-axis").checked,
      yAxis: control.querySelector(".pendulum-y-axis").checked,
    };
    settings.pendulums.push(pendulum);
  });

  // Save property controls
  const propertyTypes = [
    "color",
    "lineWidth",
    "objectWidth",
    "height",
    "opacity",
  ];
  propertyTypes.forEach((propName) => {
    const fieldset = document
      .getElementById(`${propName}-points`)
      ?.closest("fieldset");
    if (fieldset) {
      const property = {
        frequency: fieldset.querySelector(".prop-frequency")?.value,
        offset: fieldset.querySelector(".prop-offset")?.value,
        controlPoints: [],
      };

      // Save control points
      fieldset.querySelectorAll(".control-point").forEach((cp) => {
        const point = {
          percentage: cp.querySelector(".cp-index").value, // Save as percentage
          value: cp.querySelector(".cp-value").value,
        };
        property.controlPoints.push(point);
      });

      settings.properties[propName] = property;
    }
  });

  // Download as JSON file
  const blob = new Blob([JSON.stringify(settings, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `harmonograph-settings-${
    new Date().toISOString().split("T")[0]
  }.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function loadSettings() {
  document.getElementById("fileInput").click();
}

function handleFileLoad(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const settings = JSON.parse(e.target.result);
      applySettings(settings, true); // Pass true to indicate manual load
    } catch (error) {
      alert("Error loading settings: Invalid JSON file");
      console.error("Settings load error:", error);
    }
  };
  reader.readAsText(file);
}

function applySettings(settings, showAlert = false) {
  // Apply main controls
  if (settings.mainControls) {
    document.getElementById("pointCount").value =
      settings.mainControls.pointCount || "1000";
    document.getElementById("renderMode").value =
      settings.mainControls.renderMode || "line";
    document.getElementById("timeStart").value =
      settings.mainControls.timeStart || "0";
    document.getElementById("timeEnd").value =
      settings.mainControls.timeEnd || "10";
    document.getElementById("backgroundColorPicker").value =
      settings.mainControls.backgroundColor || "#ffffff";

    // Apply rotation settings
    if (settings.mainControls.rotation) {
      document.getElementById("rotationEnabled").checked =
        settings.mainControls.rotation.enabled || false;
      document.getElementById("rotationCenterX").value =
        settings.mainControls.rotation.centerX || "0";
      document.getElementById("rotationCenterY").value =
        settings.mainControls.rotation.centerY || "0";
      document.getElementById("rotationSpeed").value =
        settings.mainControls.rotation.speed || "0.1";
      document.getElementById("rotationDirection").value =
        settings.mainControls.rotation.direction || "1";
    }

    // Apply transform settings
    if (settings.mainControls.transform) {
      document.getElementById("stretchX").value =
        settings.mainControls.transform.stretchX || "1";
      document.getElementById("stretchY").value =
        settings.mainControls.transform.stretchY || "1";
      document.getElementById("imageRotation").value =
        settings.mainControls.transform.imageRotation || "0";
    }
  }

  // Clear existing pendulums
  document.getElementById("pendulum-tbody").innerHTML = "";
  pendulumIdCounter = 0;

  // Apply pendulums
  if (settings.pendulums && settings.pendulums.length > 0) {
    settings.pendulums.forEach((pendulumData) => {
      addPendulum();
      const lastPendulum = document.querySelector(
        ".pendulum-control:last-child"
      );
      if (lastPendulum) {
        lastPendulum.querySelector(".pendulum-frequency").value =
          pendulumData.frequency;
        lastPendulum.querySelector(".pendulum-magnitude").value =
          pendulumData.magnitude;
        lastPendulum.querySelector(".pendulum-phase").value =
          pendulumData.phase;
        lastPendulum.querySelector(".pendulum-dampening").value =
          pendulumData.dampening;
        lastPendulum.querySelector(".pendulum-x-axis").checked =
          pendulumData.xAxis;
        lastPendulum.querySelector(".pendulum-y-axis").checked =
          pendulumData.yAxis;
      }
    });
  }

  // Apply property controls
  if (settings.properties) {
    Object.keys(settings.properties).forEach((propName) => {
      const propData = settings.properties[propName];
      const fieldset = document
        .getElementById(`${propName}-points`)
        ?.closest("fieldset");

      if (fieldset && propData) {
        // Set frequency and offset
        if (fieldset.querySelector(".prop-frequency")) {
          fieldset.querySelector(".prop-frequency").value =
            propData.frequency || "1";
        }
        if (fieldset.querySelector(".prop-offset")) {
          fieldset.querySelector(".prop-offset").value = propData.offset || "0";
        }

        // Clear existing control points
        const container = document.getElementById(`${propName}-points`);
        container.innerHTML = "";

        // Add control points
        if (propData.controlPoints) {
          propData.controlPoints.forEach((pointData) => {
            addControlPoint(propName, pointData.value);
            const lastPoint = container.querySelector(
              ".control-point:last-child"
            );
            if (lastPoint) {
              // Handle both old format (index) and new format (percentage)
              const percentageValue =
                pointData.percentage !== undefined
                  ? pointData.percentage
                  : pointData.index;
              lastPoint.querySelector(".cp-index").value = percentageValue;
              lastPoint.querySelector(".cp-value").value = pointData.value;
            }
          });
        }
      }
    });
  }

  // Update displays and regenerate
  updateLoopLengthDisplays();
  toggleRenderMode();

  // Generate visualization automatically
  setTimeout(() => {
    generate();
  }, 100); // Small delay to ensure all DOM updates are complete

  // Only show alert for manual loads, not automatic default loads
  if (showAlert) {
    alert("Settings loaded successfully!");
  }
}

// --- PALETTE LOADER LOGIC ---
let loadedPalettes = [];

document
  .getElementById("paletteFileInput")
  .addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (evt) {
      try {
        const json = JSON.parse(evt.target.result);
        if (json.Swatches && Array.isArray(json.Swatches)) {
          loadedPalettes = json.Swatches;
          const select = document.getElementById("paletteSelect");
          select.innerHTML = "";

          loadedPalettes.forEach((swatch, idx) => {
            const opt = document.createElement("option");
            opt.value = idx;
            opt.textContent = swatch.name;
            select.appendChild(opt);
          });

          // Add event listener for palette selection preview
          select.addEventListener("change", showPalettePreview);

          // Automatically select and apply the first swatch from loaded file
          if (loadedPalettes.length > 0) {
            select.value = 0;
            applySelectedPalette(0);
          }
        } else {
          alert("Invalid palette file format");
        }
      } catch (err) {
        alert("Error parsing palette JSON");
      }
    };
    reader.readAsText(file);
  });

function showPalettePreview() {
  const select = document.getElementById("paletteSelect");
  const previewDiv = document.getElementById("palettePreview");
  const idx = select.value;

  if (!idx || !loadedPalettes[idx]) {
    previewDiv.style.display = "none";
    return;
  }

  const colors = loadedPalettes[idx].colors;
  showPaletteColors(colors);

  previewDiv.style.display = "block";
}

// Function to apply a selected palette
function applySelectedPalette(paletteIndex) {
  if (!loadedPalettes[paletteIndex]) return;

  const colors = loadedPalettes[paletteIndex].colors;

  // Show the palette colors in the color blocks
  showPaletteColors(colors);

  const colorPoints = document.getElementById("color-points");
  const existingPoints = Array.from(
    colorPoints.querySelectorAll(".control-point")
  );
  const existingCount = existingPoints.length;
  const newCount = colors.length;

  // Preserve existing loop settings - don't reset frequency
  const colorFieldset = document
    .getElementById("color-points")
    .closest("fieldset");

  if (existingCount === newCount) {
    // Same number of colors - just update the color values, keep positions
    for (let i = 0; i < newCount; i++) {
      const colorInput = existingPoints[i].querySelector(".cp-value");
      colorInput.value = colors[i];
    }
  } else {
    // Different number of colors - need to recalculate positions
    // But preserve existing positions as much as possible
    const existingPositions = existingPoints.map((point) =>
      parseInt(point.querySelector(".cp-index").value)
    );

    // Clear existing points
    colorPoints.innerHTML = "";

    if (newCount <= existingCount) {
      // Fewer colors than before - use first N existing positions
      for (let i = 0; i < newCount; i++) {
        const position =
          i < existingPositions.length
            ? existingPositions[i]
            : Math.round((i / newCount) * 100);
        addControlPoint("color", colors[i]);
        colorPoints.lastChild.querySelector(".cp-index").value = position;
      }
    } else {
      // More colors than before - distribute new colors
      for (let i = 0; i < newCount; i++) {
        let position;
        if (i < existingPositions.length) {
          // Use existing position
          position = existingPositions[i];
        } else {
          // Calculate new position for additional colors
          if (existingPositions.length > 0) {
            // Distribute new colors evenly in remaining space
            const usedSpace = Math.max(...existingPositions);
            const remainingSpace = 100 - usedSpace;
            const newColorIndex = i - existingPositions.length;
            const newColorsCount = newCount - existingPositions.length;
            position =
              usedSpace +
              Math.round(
                ((newColorIndex + 1) / (newColorsCount + 1)) * remainingSpace
              );
          } else {
            // No existing positions, distribute evenly
            position = Math.round((i / newCount) * 100);
          }
        }
        addControlPoint("color", colors[i]);
        colorPoints.lastChild.querySelector(".cp-index").value = position;
      }
    }
  }

  // Auto-regenerate visualization after applying palette
  setTimeout(() => {
    generate();
  }, 50); // Small delay to ensure DOM updates are complete
}

// Function to show palette colors in the display area
function showPaletteColors(colors) {
  const colorBlocksDiv = document.getElementById("paletteColorBlocks");
  colorBlocksDiv.innerHTML = "";

  colors.forEach((color) => {
    const block = document.createElement("div");
    block.className = "palette-color-block";
    block.style.backgroundColor = color;
    block.title = color; // Show color value on hover
    colorBlocksDiv.appendChild(block);
  });
}

document
  .getElementById("applyPaletteBtn")
  .addEventListener("click", function () {
    const select = document.getElementById("paletteSelect");
    const idx = parseInt(select.value);
    applySelectedPalette(idx);
  });

// --- COLOUR INDEX LOGIC (in generate) ---
// --- EXPORT FUNCTIONS ---

function exportSVG() {
  const svg = document.querySelector("#visualizer svg");
  if (!svg) {
    alert("No visualization to export. Please generate a visualization first.");
    return;
  }

  // Clone the SVG to avoid modifying the original
  const svgClone = svg.cloneNode(true);

  // Get the panzoom group and apply its current transform to the export
  const panzoomGroup = svgClone.querySelector("#panzoom-group");
  if (panzoomGroup && currentPanzoomInstance) {
    const transform = currentPanzoomInstance.getTransform();
    panzoomGroup.setAttribute(
      "transform",
      `translate(${transform.x}, ${transform.y}) scale(${transform.scale})`
    );
  }

  // Set proper dimensions and viewBox
  const visualizer = document.getElementById("visualizer");
  const width = visualizer.clientWidth || 800;
  const height = visualizer.clientHeight || 600;

  svgClone.setAttribute("width", width);
  svgClone.setAttribute("height", height);
  svgClone.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  // Convert to string
  const svgString = new XMLSerializer().serializeToString(svgClone);

  // Create download link
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `harmonograph-${new Date().toISOString().split("T")[0]}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- NEW BEZIER CURVE FUNCTIONS ---

function calculateTangentVector(points, index) {
  const point = points[index];
  const numPoints = points.length;

  // Analyze local geometry
  const localAnalysis = analyzeLocalGeometry(points, index);
  const { density, curvature, isSharpTurn } = localAnalysis;

  // Adaptive lookahead based on local conditions
  let lookAhead;
  if (isSharpTurn) {
    lookAhead = 1; // Minimal smoothing for sharp turns
  } else if (density > 0.8) {
    // High density (points close together)
    lookAhead = 2;
  } else {
    lookAhead = 3; // Normal smoothing for sparse areas
  }

  let tangentX = 0,
    tangentY = 0;
  let weightSum = 0;

  // Calculate weighted tangent with adaptive weighting
  for (let offset = 1; offset <= lookAhead; offset++) {
    // Stronger weighting for sharp turns, gentler for smooth curves
    const baseWeight = isSharpTurn ? Math.pow(2, -offset) : 1.0 / offset;

    // Forward direction
    if (index + offset < numPoints) {
      const forwardPoint = points[index + offset];
      const dx = forwardPoint.x - point.x;
      const dy = forwardPoint.y - point.y;
      tangentX += baseWeight * dx;
      tangentY += baseWeight * dy;
      weightSum += baseWeight;
    }

    // Backward direction
    if (index - offset >= 0) {
      const backwardPoint = points[index - offset];
      const dx = point.x - backwardPoint.x;
      const dy = point.y - backwardPoint.y;
      tangentX += baseWeight * dx;
      tangentY += baseWeight * dy;
      weightSum += baseWeight;
    }
  }

  // Normalize the tangent
  if (weightSum > 0) {
    tangentX /= weightSum;
    tangentY /= weightSum;
  }

  // Handle edge cases
  if (index === 0 && numPoints > 1) {
    tangentX = points[1].x - points[0].x;
    tangentY = points[1].y - points[0].y;
  } else if (index === numPoints - 1 && numPoints > 1) {
    tangentX = points[index].x - points[index - 1].x;
    tangentY = points[index].y - points[index - 1].y;
  }

  return { x: tangentX, y: tangentY };
}

function analyzeLocalGeometry(points, index) {
  const numPoints = points.length;
  if (numPoints < 3) return { density: 0, curvature: 0, isSharpTurn: false };

  const point = points[index];
  let totalDistance = 0;
  let neighborCount = 0;
  const maxRadius = 3; // Check up to 3 points away

  // Calculate local point density
  for (
    let offset = 1;
    offset <= maxRadius && (index + offset < numPoints || index - offset >= 0);
    offset++
  ) {
    if (index + offset < numPoints) {
      const forwardPoint = points[index + offset];
      const dist = Math.sqrt(
        Math.pow(forwardPoint.x - point.x, 2) +
          Math.pow(forwardPoint.y - point.y, 2)
      );
      totalDistance += dist;
      neighborCount++;
    }
    if (index - offset >= 0) {
      const backwardPoint = points[index - offset];
      const dist = Math.sqrt(
        Math.pow(point.x - backwardPoint.x, 2) +
          Math.pow(point.y - backwardPoint.y, 2)
      );
      totalDistance += dist;
      neighborCount++;
    }
  }

  const avgDistance = neighborCount > 0 ? totalDistance / neighborCount : 1;
  const densityThreshold = 20; // Adjust based on your coordinate system
  const density = Math.min(1, densityThreshold / avgDistance);

  // Calculate curvature to detect sharp turns
  let curvature = 0;
  let isSharpTurn = false;

  if (index > 0 && index < numPoints - 1) {
    const prevPoint = points[index - 1];
    const nextPoint = points[index + 1];

    // Calculate vectors
    const v1x = point.x - prevPoint.x;
    const v1y = point.y - prevPoint.y;
    const v2x = nextPoint.x - point.x;
    const v2y = nextPoint.y - point.y;

    // Calculate angle between vectors
    const dot = v1x * v2x + v1y * v2y;
    const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
    const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);

    if (mag1 > 0 && mag2 > 0) {
      const cosAngle = dot / (mag1 * mag2);
      const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
      curvature = angle;

      // Sharp turn threshold (adjust as needed)
      isSharpTurn = angle > Math.PI / 3; // 60 degrees
    }
  }

  return { density, curvature, isSharpTurn };
}

function calculateControlPoints(points, index) {
  if (points.length < 2) return null;

  const point = points[index];
  const tangent = calculateTangentVector(points, index);
  const localAnalysis = analyzeLocalGeometry(points, index);

  // Calculate control point distances based on neighboring point distances
  let prevDistance = 0;
  let nextDistance = 0;

  if (index > 0) {
    const prevPoint = points[index - 1];
    prevDistance = Math.sqrt(
      Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2)
    );
  }

  if (index < points.length - 1) {
    const nextPoint = points[index + 1];
    nextDistance = Math.sqrt(
      Math.pow(nextPoint.x - point.x, 2) + Math.pow(nextPoint.y - point.y, 2)
    );
  }

  // Adaptive tangent strength based on local conditions
  let tangentStrength;
  if (localAnalysis.isSharpTurn) {
    tangentStrength = 0.15; // Tighter control for sharp turns
  } else if (localAnalysis.density > 0.7) {
    // High density areas (dampening): reduce strength proportionally
    tangentStrength = 0.2 * (1 - localAnalysis.density * 0.3);
  } else {
    tangentStrength = 0.3; // Normal strength for smooth curves
  }

  // Use average distance if both exist, otherwise use the available one
  const baseDistance =
    (prevDistance + nextDistance) /
    (prevDistance > 0 && nextDistance > 0 ? 2 : 1);
  const controlDistance = baseDistance * tangentStrength;

  // Normalize tangent vector
  const tangentLength = Math.sqrt(
    tangent.x * tangent.x + tangent.y * tangent.y
  );
  if (tangentLength === 0) return null;

  const unitTangentX = tangent.x / tangentLength;
  const unitTangentY = tangent.y / tangentLength;

  // Create collinear control points on both sides of the point
  const controlPoint1 = {
    x: point.x - unitTangentX * controlDistance,
    y: point.y - unitTangentY * controlDistance,
  };

  const controlPoint2 = {
    x: point.x + unitTangentX * controlDistance,
    y: point.y + unitTangentY * controlDistance,
  };

  return { cp1: controlPoint1, cp2: controlPoint2 };
}

function generateBezierPath(points) {
  if (points.length < 2) return "";

  let pathData = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const currentPoint = points[i];
    const nextPoint = points[i + 1];

    // Calculate control points for current and next points
    const currentControls = calculateAdaptiveControlPoints(points, i);
    const nextControls = calculateAdaptiveControlPoints(points, i + 1);

    if (currentControls && nextControls) {
      // Use the outgoing control point from current and incoming control point from next
      const cp1 = currentControls.cp2; // Outgoing from current point
      const cp2 = nextControls.cp1; // Incoming to next point

      pathData += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${nextPoint.x} ${nextPoint.y}`;
    } else {
      // Fallback to line if control points can't be calculated
      pathData += ` L ${nextPoint.x} ${nextPoint.y}`;
    }
  }

  return pathData;
}

// --- BEZIER CURVE FUNCTIONS ---

// function calculateTangentVector(points, index, lookAhead = 2) {
//   // Calculate tangent by considering multiple points on each side
//   const point = points[index];
//   let tangentX = 0,
//     tangentY = 0;
//   let weightSum = 0;

//   // Look at points before and after, with decreasing weight for distant points
//   for (let offset = 1; offset <= lookAhead; offset++) {
//     const weight = 1.0 / offset; // Closer points have more influence

//     // Forward direction
//     if (index + offset < points.length) {
//       const forwardPoint = points[index + offset];
//       tangentX += weight * (forwardPoint.x - point.x);
//       tangentY += weight * (forwardPoint.y - point.y);
//       weightSum += weight;
//     }

//     // Backward direction
//     if (index - offset >= 0) {
//       const backwardPoint = points[index - offset];
//       tangentX += weight * (point.x - backwardPoint.x);
//       tangentY += weight * (point.y - backwardPoint.y);
//       weightSum += weight;
//     }
//   }

//   // Normalize the tangent
//   if (weightSum > 0) {
//     tangentX /= weightSum;
//     tangentY /= weightSum;
//   }

//   // Handle edge cases
//   if (index === 0 && points.length > 1) {
//     tangentX = points[1].x - points[0].x;
//     tangentY = points[1].y - points[0].y;
//   } else if (index === points.length - 1 && points.length > 1) {
//     tangentX = points[index].x - points[index - 1].x;
//     tangentY = points[index].y - points[index - 1].y;
//   }

//   return { x: tangentX, y: tangentY };
// }

// function calculateControlPoints(points, index, tangentStrength = 0.3) {
//   if (points.length < 2) return null;

//   const point = points[index];
//   const tangent = calculateTangentVector(points, index, 3); // Look 3 points ahead/behind

//   // Calculate control point distances based on neighboring point distances
//   let prevDistance = 0;
//   let nextDistance = 0;

//   if (index > 0) {
//     const prevPoint = points[index - 1];
//     prevDistance = Math.sqrt(
//       Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2)
//     );
//   }

//   if (index < points.length - 1) {
//     const nextPoint = points[index + 1];
//     nextDistance = Math.sqrt(
//       Math.pow(nextPoint.x - point.x, 2) + Math.pow(nextPoint.y - point.y, 2)
//     );
//   }

//   // Use average distance if both exist, otherwise use the available one
//   const baseDistance =
//     (prevDistance + nextDistance) /
//     (prevDistance > 0 && nextDistance > 0 ? 2 : 1);
//   const controlDistance = baseDistance * tangentStrength;

//   // Normalize tangent vector
//   const tangentLength = Math.sqrt(
//     tangent.x * tangent.x + tangent.y * tangent.y
//   );
//   if (tangentLength === 0) return null;

//   const unitTangentX = tangent.x / tangentLength;
//   const unitTangentY = tangent.y / tangentLength;

//   // Create collinear control points on both sides of the point
//   const controlPoint1 = {
//     x: point.x - unitTangentX * controlDistance,
//     y: point.y - unitTangentY * controlDistance,
//   };

//   const controlPoint2 = {
//     x: point.x + unitTangentX * controlDistance,
//     y: point.y + unitTangentY * controlDistance,
//   };

//   return { cp1: controlPoint1, cp2: controlPoint2 };
// }

// function generateBezierPath(points) {
//   if (points.length < 2) return "";

//   let pathData = `M ${points[0].x} ${points[0].y}`;

//   for (let i = 0; i < points.length - 1; i++) {
//     const currentPoint = points[i];
//     const nextPoint = points[i + 1];

//     // Calculate control points for current and next points
//     const currentControls = calculateControlPoints(points, i);
//     const nextControls = calculateControlPoints(points, i + 1);

//     if (currentControls && nextControls) {
//       // Use the outgoing control point from current and incoming control point from next
//       const cp1 = currentControls.cp2; // Outgoing from current point
//       const cp2 = nextControls.cp1; // Incoming to next point

//       pathData += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${nextPoint.x} ${nextPoint.y}`;
//     } else {
//       // Fallback to line if control points can't be calculated
//       pathData += ` L ${nextPoint.x} ${nextPoint.y}`;
//     }
//   }

//   return pathData;
// }

// Load default swatches from swatches.json
async function loadDefaultSwatches() {
  try {
    const response = await fetch("swatches.json");
    if (response.ok) {
      const json = await response.json();
      if (json.Swatches && Array.isArray(json.Swatches)) {
        loadedPalettes = json.Swatches;
        const select = document.getElementById("paletteSelect");
        select.innerHTML = "";

        loadedPalettes.forEach((swatch, idx) => {
          const opt = document.createElement("option");
          opt.value = idx;
          opt.textContent = swatch.name;
          select.appendChild(opt);
        });

        // Add event listener for palette selection preview
        select.addEventListener("change", showPalettePreview);

        // Automatically select and apply a random swatch
        if (loadedPalettes.length > 0) {
          const randomIndex = Math.floor(Math.random() * loadedPalettes.length);
          select.value = randomIndex;

          // Apply the random palette automatically
          applySelectedPalette(randomIndex);
        }

        console.log("Default swatches loaded successfully");
      } else {
        console.log("Invalid swatches file format");
      }
    } else {
      console.log("No swatches.json found");
    }
  } catch (error) {
    console.log("Could not load swatches.json:", error);
  }
}

// Load default settings from default.json
async function loadDefaultSettings() {
  try {
    const response = await fetch("default.json");
    if (response.ok) {
      const defaultSettings = await response.json();
      applySettings(defaultSettings);
      console.log("Default settings loaded successfully");
    } else {
      console.log("No default.json found, using built-in defaults");
      // Add a basic pendulum if none exist
      addPendulum();
    }
  } catch (error) {
    console.log("Could not load default.json, using built-in defaults:", error);
    // Add a basic pendulum if none exist
    addPendulum();
  }
}

// Initialize collapsible fieldsets when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, initializing...");

  // Initialize collapsible fieldsets first
  initializeCollapsibleFieldsets();
  console.log("Collapsible fieldsets initialized");

  updateLoopLengthDisplays();

  // Add event listeners to frequency inputs to update displays
  document.querySelectorAll(".prop-frequency").forEach((input) => {
    input.addEventListener("input", updateLoopLengthDisplays);
  });

  // Add event listener to point count to update displays
  document
    .getElementById("pointCount")
    .addEventListener("input", updateLoopLengthDisplays);

  // Add event listener to background color picker
  document
    .getElementById("backgroundColorPicker")
    .addEventListener("change", generate);

  // Load default swatches and settings
  loadDefaultSwatches();
  loadDefaultSettings();
});
