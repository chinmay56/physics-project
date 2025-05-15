// Specialized Simulators for Real-World Applications
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all simulators
    // Removed: initWrenchSimulator();
    initSeesawSimulator();
    initScaleSimulator();
    initCraneSimulator();
    // Removed: initBiomechSimulator();
    initAutomotiveSimulator();
    // Removed: initBridgeSimulator();
    initAircraftSimulator();
    
    // Set up event listeners for demo buttons
    document.querySelectorAll('.demo-btn').forEach(button => {
        button.addEventListener('click', function(event) {
            // Prevent default behavior (like scrolling to href=#target)
            event.preventDefault();
            
            const targetId = this.getAttribute('data-target');
            if (targetId) {
                // Show the simulator first
                showSimulator(targetId);
                
                // Scrolling is handled in the showSimulator function now
            }
        });
    });
    
    // Set up event listeners for close buttons
    document.querySelectorAll('.close-simulator').forEach(button => {
        button.addEventListener('click', function() {
            const simulator = this.closest('.specialized-simulator');
            if (simulator) {
                simulator.classList.remove('active');
            }
        });
    });
});

// Helper Functions
function showSimulator(simulatorId) {
    // Hide all simulators with animation
    document.querySelectorAll('.specialized-simulator.active').forEach(sim => {
        sim.classList.remove('active');
    });
    
    // Show the selected simulator
    const simulator = document.getElementById(simulatorId);
    if (simulator) {
        simulator.classList.add('active');
        
        // Scroll to the simulator after it's displayed
        scrollToSimulator(simulatorId);
    }
}

function scrollToSimulator(simulatorId) {
    const simulator = document.getElementById(simulatorId);
    if (simulator) {
        // Wait for the simulator to fully display before scrolling
        setTimeout(() => {
            // Get the position of the simulator relative to the document
            const rect = simulator.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const targetPosition = rect.top + scrollTop;
            
            // Scroll to the simulator with a small offset for better visibility
            window.scrollTo({
                top: targetPosition - 100,
                behavior: 'smooth'
            });
        }, 350); // Wait for the animation to start before scrolling
    }
}

// Update simulator displays
function updateDisplay(elementId, value, unit = '') {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value + unit;
    }
}

// Draw functions for canvases
function clearCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return ctx;
}

// Wrench Simulator functions removed

// Seesaw Simulator
function initSeesawSimulator() {
    const seesawCanvas = document.getElementById('seesaw-canvas');
    if (!seesawCanvas) return;
    
    // Get slider elements
    const leftWeight = document.getElementById('left-weight');
    const leftDistance = document.getElementById('left-distance');
    const rightWeight = document.getElementById('right-weight');
    const rightDistance = document.getElementById('right-distance');
    
    // Initial draw
    drawSeesaw(
        parseFloat(leftWeight.value), 
        parseFloat(leftDistance.value),
        parseFloat(rightWeight.value),
        parseFloat(rightDistance.value)
    );
    calculateSeesawBalance();
    
    // Update on slider changes
    [leftWeight, leftDistance, rightWeight, rightDistance].forEach(slider => {
        slider.addEventListener('input', function() {
            // Update display value
            const valueId = this.id + '-value';
            const unit = this.id.includes('weight') ? ' kg' : ' cm';
            updateDisplay(valueId, this.value, unit);
            
            // Redraw seesaw
            drawSeesaw(
                parseFloat(leftWeight.value), 
                parseFloat(leftDistance.value),
                parseFloat(rightWeight.value),
                parseFloat(rightDistance.value)
            );
            calculateSeesawBalance();
        });
    });
}

function drawSeesaw(leftWeight, leftDistance, rightWeight, rightDistance) {
    const ctx = clearCanvas('seesaw-canvas');
    if (!ctx) return;
    
    const canvas = ctx.canvas;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Calculate moments
    const leftMoment = leftWeight * leftDistance;
    const rightMoment = rightWeight * rightDistance;
    
    // Calculate seesaw angle based on moment difference
    // Max tilt is 20 degrees
    const maxTilt = 20 * Math.PI / 180; // convert to radians
    const momentDiff = rightMoment - leftMoment;
    const maxMomentDiff = 500; // threshold for max tilt
    
    let tiltAngle = (momentDiff / maxMomentDiff) * maxTilt;
    tiltAngle = Math.max(Math.min(tiltAngle, maxTilt), -maxTilt);
    
    // Draw pivot/fulcrum
    ctx.fillStyle = '#34495e';
    ctx.beginPath();
    ctx.moveTo(centerX - 30, centerY + 40);
    ctx.lineTo(centerX + 30, centerY + 40);
    ctx.lineTo(centerX, centerY);
    ctx.closePath();
    ctx.fill();
    
    // Save context for rotation
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(tiltAngle);
    
    // Draw seesaw board
    ctx.fillStyle = '#7aa2f7';
    const boardLength = 500;
    const boardHeight = 15;
    ctx.fillRect(-boardLength/2, -boardHeight/2, boardLength, boardHeight);
    
    // Draw distance markers
    ctx.strokeStyle = 'white';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
    
    // Draw left side markers
    for (let i = 0; i <= 50; i += 10) {
        const x = -i * 5;
        ctx.beginPath();
        ctx.moveTo(x, -boardHeight/2);
        ctx.lineTo(x, -boardHeight/2 - 10);
        ctx.stroke();
        
        if (i > 0) {
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${i}`, x, -boardHeight/2 - 15);
        }
    }
    
    // Draw right side markers
    for (let i = 0; i <= 50; i += 10) {
        const x = i * 5;
        ctx.beginPath();
        ctx.moveTo(x, -boardHeight/2);
        ctx.lineTo(x, -boardHeight/2 - 10);
        ctx.stroke();
        
        if (i > 0) {
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${i}`, x, -boardHeight/2 - 15);
        }
    }
    
    ctx.setLineDash([]); // Reset dash
    
    // Draw left weight
    const leftX = -leftDistance * 5;
    drawWeight(ctx, leftX, leftWeight, 'left');
    
    // Draw right weight
    const rightX = rightDistance * 5;
    drawWeight(ctx, rightX, rightWeight, 'right');
    
    ctx.restore();
}

function drawWeight(ctx, x, weight, side) {
    // Scale weight for visual size (max weight: 50kg)
    const scale = Math.sqrt(weight) / 3;
    const size = 20 * scale;
    
    // Draw weight
    ctx.fillStyle = side === 'left' ? '#f7768e' : '#73daca';
    ctx.beginPath();
    ctx.rect(x - size/2, -size/2 - 30, size, size);
    
    // Draw rope connecting weight to board
    ctx.moveTo(x, -size/2 - 30 + size);
    ctx.lineTo(x, -7);
    
    ctx.fill();
    ctx.stroke();
    
    // Label weight
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${weight}kg`, x, -30 - size);
}

function calculateSeesawBalance() {
    const leftWeight = parseFloat(document.getElementById('left-weight').value);
    const leftDistance = parseFloat(document.getElementById('left-distance').value);
    const rightWeight = parseFloat(document.getElementById('right-weight').value);
    const rightDistance = parseFloat(document.getElementById('right-distance').value);
    
    // Calculate moments
    const leftMoment = leftWeight * leftDistance;
    const rightMoment = rightWeight * rightDistance;
    
    // Update displays
    updateDisplay('left-moment', leftMoment.toFixed(0), ' N·cm');
    updateDisplay('right-moment', rightMoment.toFixed(0), ' N·cm');
    
    // Determine if balanced
    const momentDiff = Math.abs(leftMoment - rightMoment);
    const balanceThreshold = 10; // small threshold for "balance"
    
    let status = 'Balanced';
    let statusColor = '#9ece6a'; // green
    
    if (momentDiff > balanceThreshold) {
        if (leftMoment > rightMoment) {
            status = 'Tilting Left ↓';
            statusColor = '#f7768e'; // red
        } else {
            status = 'Tilting Right ↓';
            statusColor = '#f7768e'; // red
        }
    }
    
    updateDisplay('balance-status', status);
    document.getElementById('balance-status').style.color = statusColor;
}

// Scale Simulator
function initScaleSimulator() {
    const scaleCanvas = document.getElementById('scale-canvas');
    if (!scaleCanvas) return;
    
    // Set up variables
    let unknownWeight = 0;
    let leftPanWeight = 0;
    let rightPanWeight = 0;
    
    // Draw initial scale
    drawScale(leftPanWeight, rightPanWeight);
    
    // Set up random weight button
    document.getElementById('random-weight').addEventListener('click', function() {
        // Generate a random weight between 5 and 185 grams
        unknownWeight = 5 * Math.floor(Math.random() * 37 + 1); // 5, 10, 15, ..., 185
        leftPanWeight = unknownWeight;
        rightPanWeight = 0;
        
        updateDisplay('unknown-weight-status', '??? g (Set)');
        updateDisplay('left-pan-weight', leftPanWeight, ' g');
        updateDisplay('right-pan-weight', rightPanWeight, ' g');
        updateDisplay('scale-status', 'Add weights to balance the scale');
        
        document.getElementById('scale-status').style.color = '#f7768e';
        
        drawScale(leftPanWeight, rightPanWeight);
    });
    
    // Set up weight buttons
    document.querySelectorAll('.weight-btn').forEach(button => {
        button.addEventListener('click', function() {
            if (unknownWeight === 0) {
                updateDisplay('scale-status', 'Generate an unknown weight first');
                return;
            }
            
            const weight = parseInt(this.getAttribute('data-weight'));
            rightPanWeight += weight;
            
            updateDisplay('right-pan-weight', rightPanWeight, ' g');
            
            // Check balance
            const diff = Math.abs(leftPanWeight - rightPanWeight);
            const balanceThreshold = 2;
            
            if (diff <= balanceThreshold) {
                updateDisplay('scale-status', 'Balanced! Unknown weight = ' + rightPanWeight + ' g');
                updateDisplay('unknown-weight-status', rightPanWeight + ' g (Discovered!)');
                document.getElementById('scale-status').style.color = '#9ece6a';
            } else if (leftPanWeight > rightPanWeight) {
                updateDisplay('scale-status', 'Need more weight on right pan');
                document.getElementById('scale-status').style.color = '#f7768e';
            } else {
                updateDisplay('scale-status', 'Too much weight on right pan');
                document.getElementById('scale-status').style.color = '#f7768e';
            }
            
            drawScale(leftPanWeight, rightPanWeight);
        });
    });
    
    // Set up reset button
    document.getElementById('reset-scale').addEventListener('click', function() {
        unknownWeight = 0;
        leftPanWeight = 0;
        rightPanWeight = 0;
        
        updateDisplay('unknown-weight-status', '???');
        updateDisplay('left-pan-weight', '0 g');
        updateDisplay('right-pan-weight', '0 g');
        updateDisplay('scale-status', 'Add weights to begin');
        
        drawScale(leftPanWeight, rightPanWeight);
    });
}

function drawScale(leftWeight, rightWeight) {
    const ctx = clearCanvas('scale-canvas');
    if (!ctx) return;
    
    const canvas = ctx.canvas;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Calculate balance angle
    const maxAngle = 30; // max tilt in degrees
    let balanceAngle = 0;
    
    if (leftWeight !== rightWeight) {
        const diff = rightWeight - leftWeight;
        const maxDiff = 200; // weight difference for max tilt
        balanceAngle = (diff / maxDiff) * maxAngle;
        balanceAngle = Math.max(Math.min(balanceAngle, maxAngle), -maxAngle);
    }
    
    // Draw stand
    ctx.fillStyle = '#34495e';
    ctx.beginPath();
    ctx.moveTo(centerX - 40, centerY + 100);
    ctx.lineTo(centerX + 40, centerY + 100);
    ctx.lineTo(centerX + 30, centerY + 50);
    ctx.lineTo(centerX - 30, centerY + 50);
    ctx.closePath();
    ctx.fill();
    
    // Draw vertical post
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(centerX - 5, centerY - 60, 10, 110);
    
    // Draw top pivot
    ctx.fillStyle = '#7aa2f7';
    ctx.beginPath();
    ctx.arc(centerX, centerY - 60, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Save context for beam rotation
    ctx.save();
    ctx.translate(centerX, centerY - 60);
    ctx.rotate(balanceAngle * Math.PI / 180);
    
    // Draw beam
    ctx.fillStyle = '#7aa2f7';
    ctx.fillRect(-100, -3, 200, 6);
    
    // Draw left pan support string
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-80, 0);
    ctx.lineTo(-80, 60);
    ctx.stroke();
    
    // Draw right pan support string
    ctx.beginPath();
    ctx.moveTo(80, 0);
    ctx.lineTo(80, 60);
    ctx.stroke();
    
    // Draw pans
    ctx.fillStyle = '#bb9af7';
    
    // Left pan
    ctx.beginPath();
    ctx.arc(-80, 60, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Right pan
    ctx.beginPath();
    ctx.arc(80, 60, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Draw weights
    if (leftWeight > 0) {
        drawScaleWeight(ctx, -80, 60, leftWeight, '#f7768e');
    }
    
    if (rightWeight > 0) {
        drawScaleWeight(ctx, 80, 60, rightWeight, '#73daca');
    }
    
    // Restore context
    ctx.restore();
}

function drawScaleWeight(ctx, x, y, weight, color) {
    // Scale size based on weight (max 185g)
    const maxWeight = 185;
    const maxHeight = 20;
    const height = Math.max(5, (weight / maxWeight) * maxHeight);
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.rect(x - 15, y - height/2, 30, height);
    ctx.fill();
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw weight label if large enough
    if (weight >= 20) {
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${weight}g`, x, y + 3);
    }
}

// Crane Simulator
function initCraneSimulator() {
    const craneCanvas = document.getElementById('crane-canvas');
    if (!craneCanvas) return;
    
    // Get slider elements
    const loadWeight = document.getElementById('load-weight');
    const loadDistance = document.getElementById('load-distance');
    const counterweight = document.getElementById('counterweight');
    const counterweightDistance = document.getElementById('counterweight-distance');
    
    // Initial draw
    drawCrane(
        parseFloat(loadWeight.value),
        parseFloat(loadDistance.value),
        parseFloat(counterweight.value),
        parseFloat(counterweightDistance.value)
    );
    calculateCraneStability();
    
    // Update on slider changes
    [loadWeight, loadDistance, counterweight, counterweightDistance].forEach(slider => {
        slider.addEventListener('input', function() {
            // Update display value
            const valueId = this.id + '-value';
            const unit = this.id.includes('weight') ? ' tons' : ' m';
            updateDisplay(valueId, this.value, unit);
            
            // Redraw crane
            drawCrane(
                parseFloat(loadWeight.value),
                parseFloat(loadDistance.value),
                parseFloat(counterweight.value),
                parseFloat(counterweightDistance.value)
            );
            calculateCraneStability();
        });
    });
}

function drawCrane(loadWeight, loadDistance, counterWeight, counterDistance) {
    const ctx = clearCanvas('crane-canvas');
    if (!ctx) return;
    
    const canvas = ctx.canvas;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 + 50; // Move pivot down
    
    // Calculate moments
    const loadMoment = loadWeight * loadDistance;
    const counterMoment = counterWeight * counterDistance;
    
    // Calculate crane tilt
    // Max tilt is 10 degrees
    const maxTilt = 10 * Math.PI / 180;
    const momentDiff = loadMoment - counterMoment;
    const maxMomentDiff = 1000; // threshold for max tilt
    
    let tiltAngle = 0;
    if (momentDiff > 0) { // Tilting toward load
        tiltAngle = (momentDiff / maxMomentDiff) * maxTilt;
        tiltAngle = Math.min(tiltAngle, maxTilt);
    }
    
    // Draw crane base
    ctx.fillStyle = '#34495e';
    ctx.beginPath();
    ctx.rect(centerX - 60, centerY + 20, 120, 30);
    ctx.fill();
    
    // Draw crane tower
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.rect(centerX - 20, centerY - 100, 40, 120);
    ctx.fill();
    
    // Save context for rotation
    ctx.save();
    ctx.translate(centerX, centerY - 100);
    ctx.rotate(tiltAngle);
    
    // Draw crane arm
    ctx.fillStyle = '#7aa2f7';
    ctx.beginPath();
    
    // Jib (front arm)
    const jibLength = loadDistance * 8;
    ctx.rect(0, -10, jibLength, 20);
    
    // Counter-jib (back arm)
    const counterJibLength = counterDistance * 8;
    ctx.rect(-counterJibLength, -10, counterJibLength, 20);
    
    ctx.fill();
    
    // Draw load
    const loadSize = Math.sqrt(loadWeight) * 3;
    ctx.fillStyle = '#f7768e';
    ctx.beginPath();
    ctx.rect(jibLength - loadSize/2, 10, loadSize, loadSize);
    ctx.fill();
    
    // Draw load cable
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(jibLength, 0);
    ctx.lineTo(jibLength, 10);
    ctx.stroke();
    
    // Draw counterweight
    const counterweightSize = Math.sqrt(counterWeight) * 2;
    ctx.fillStyle = '#73daca';
    ctx.beginPath();
    ctx.rect(-counterJibLength, -10 - counterweightSize, counterweightSize, counterweightSize);
    ctx.fill();
    
    // Draw labels
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    // Load label
    ctx.fillText(`${loadWeight} tons`, jibLength, 10 + loadSize + 15);
    
    // Counterweight label
    ctx.fillText(`${counterWeight} tons`, -counterJibLength + counterweightSize/2, -10 - counterweightSize - 5);
    
    ctx.restore();
}

function calculateCraneStability() {
    const loadWeight = parseFloat(document.getElementById('load-weight').value);
    const loadDistance = parseFloat(document.getElementById('load-distance').value);
    const counterWeight = parseFloat(document.getElementById('counterweight').value);
    const counterDistance = parseFloat(document.getElementById('counterweight-distance').value);
    
    // Calculate moments
    const loadMoment = loadWeight * loadDistance;
    const counterMoment = counterWeight * counterDistance;
    
    // Update displays
    updateDisplay('load-moment', loadMoment.toFixed(0), ' ton·m');
    updateDisplay('counterweight-moment', counterMoment.toFixed(0), ' ton·m');
    
    // Determine stability
    const momentRatio = counterMoment / loadMoment;
    const stabilityThreshold = 1.1; // Need 10% more counterweight for safety
    
    let status = '';
    let statusColor = '';
    
    if (momentRatio >= stabilityThreshold) {
        status = 'Safe: Good counterweight balance';
        statusColor = '#9ece6a'; // green
    } else if (momentRatio >= 1.0) {
        status = 'Caution: Minimal safety margin';
        statusColor = '#ff9e64'; // orange
    } else {
        status = 'Danger: Load exceeds counterweight!';
        statusColor = '#f7768e'; // red
    }
    
    updateDisplay('crane-stability', status);
    document.getElementById('crane-stability').style.color = statusColor;
}

// Automotive Simulator
function initAutomotiveSimulator() {
    const automotiveCanvas = document.getElementById('automotive-canvas');
    if (!automotiveCanvas) return;
    
    // Get slider element
    const frontWeight = document.getElementById('front-weight');
    
    // Initial draw
    drawAutomotive(parseFloat(frontWeight.value));
    calculateWeightDistribution();
    
    // Update on slider change
    frontWeight.addEventListener('input', function() {
        const value = parseFloat(this.value);
        updateDisplay('front-weight-value', value, '%');
        
        // Redraw automotive
        drawAutomotive(value);
        calculateWeightDistribution();
    });
}

function drawAutomotive(frontWeight) {
    const ctx = clearCanvas('automotive-canvas');
    if (!ctx) return;
    
    const canvas = ctx.canvas;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Calculate weight distribution
    const rearWeight = 100 - frontWeight;
    
    // Draw road
    ctx.fillStyle = '#34495e';
    ctx.fillRect(50, centerY + 50, canvas.width - 100, 30);
    
    // Car dimensions
    const carWidth = 300;
    const carHeight = 60;
    const wheelRadius = 20;
    
    // Wheel positions
    const frontWheelX = centerX - carWidth/4;
    const rearWheelX = centerX + carWidth/4;
    const wheelY = centerY + 30;
    
    // Calculate car angle based on weight distribution
    // A perfectly balanced car (50/50) will be level
    // Too much weight on one end will cause a slight tilt
    const balancePoint = 50; // perfect balance
    const maxTilt = 5 * Math.PI / 180; // 5 degrees max tilt
    const tiltFactor = (frontWeight - balancePoint) / 50; // normalized from -1 to 1
    const carAngle = -tiltFactor * maxTilt; // negative angle means front is lower
    
    // Draw car body
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(carAngle);
    
    // Car body (main)
    ctx.fillStyle = '#7aa2f7';
    ctx.beginPath();
    ctx.rect(-carWidth/2, -carHeight, carWidth, carHeight);
    ctx.fill();
    
    // Car roof
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.rect(-carWidth/4, -carHeight - 30, carWidth/2, 30);
    ctx.fill();
    
    // Draw center of gravity
    const cogX = (frontWeight - 50) * carWidth/100;
    ctx.fillStyle = '#f7768e';
    ctx.beginPath();
    ctx.arc(cogX, -carHeight/2, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // CG Label
    ctx.fillStyle = 'white';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CG', cogX, -carHeight/2 + 3);
    
    ctx.restore();
    
    // Draw wheels
    drawWheel(ctx, frontWheelX, wheelY, wheelRadius, frontWeight);
    drawWheel(ctx, rearWheelX, wheelY, wheelRadius, rearWeight);
    
    // Draw weight distribution labels
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    
    // Front weight
    ctx.fillText(`${frontWeight}%`, frontWheelX, wheelY + wheelRadius + 20);
    
    // Rear weight
    ctx.fillText(`${rearWeight}%`, rearWheelX, wheelY + wheelRadius + 20);
}

function drawWheel(ctx, x, y, radius, weight) {
    // Draw wheel
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Wheel rim
    ctx.fillStyle = '#bbbbbb';
    ctx.beginPath();
    ctx.arc(x, y, radius - 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Hub
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw compression of suspension based on weight
    // More weight = more compression
    const maxCompression = 15;
    const compression = (weight / 100) * maxCompression;
    
    // Draw suspension spring
    ctx.strokeStyle = '#f7768e';
    ctx.lineWidth = 3;
    
    // Draw zigzag line to represent spring
    ctx.beginPath();
    ctx.moveTo(x, y - radius);
    
    // Variables for creating spring zigzag
    const zigzagWidth = 5;
    const zigzagHeight = 8;
    const numZigzags = 4;
    
    for (let i = 0; i < numZigzags; i++) {
        const vertical = -compression / numZigzags;
        
        // Draw one zigzag
        ctx.lineTo(x + zigzagWidth, y - radius - i * zigzagHeight + vertical * i);
        ctx.lineTo(x - zigzagWidth, y - radius - i * zigzagHeight - vertical * (i + 0.5));
    }
    
    ctx.lineTo(x, y - radius - compression - numZigzags * zigzagHeight);
    ctx.stroke();
}

function calculateWeightDistribution() {
    const frontWeight = parseFloat(document.getElementById('front-weight').value);
    const rearWeight = 100 - frontWeight;
    
    // Update display
    updateDisplay('weight-distribution', `${frontWeight}/${rearWeight}`);
    
    // Determine handling characteristics
    let characteristic = '';
    let characteristicColor = '';
    
    if (frontWeight > 65) {
        characteristic = 'Understeer';
        characteristicColor = '#f7768e'; // red
    } else if (frontWeight < 40) {
        characteristic = 'Oversteer';
        characteristicColor = '#f7768e'; // red
    } else if (frontWeight >= 55) {
        characteristic = 'Mild understeer';
        characteristicColor = '#ff9e64'; // orange
    } else if (frontWeight <= 45) {
        characteristic = 'Mild oversteer';
        characteristicColor = '#ff9e64'; // orange
    } else {
        characteristic = 'Neutral';
        characteristicColor = '#9ece6a'; // green
    }
    
    updateDisplay('handling-characteristic', characteristic);
    document.getElementById('handling-characteristic').style.color = characteristicColor;
}

// Aircraft Simulator
function initAircraftSimulator() {
    const aircraftCanvas = document.getElementById('aircraft-canvas');
    if (!aircraftCanvas) return;
    
    // Get slider elements
    const forwardCargo = document.getElementById('forward-cargo');
    const aftCargo = document.getElementById('aft-cargo');
    const fuelDistribution = document.getElementById('fuel-distribution');
    
    // Initial draw
    drawAircraft(
        parseFloat(forwardCargo.value),
        parseFloat(aftCargo.value),
        parseFloat(fuelDistribution.value)
    );
    calculateAircraftBalance();
    
    // Update on slider changes
    [forwardCargo, aftCargo, fuelDistribution].forEach(slider => {
        slider.addEventListener('input', function() {
            // Update display value
            const valueId = this.id + '-value';
            let unit = ' kg';
            
            if (this.id === 'fuel-distribution') {
                unit = '% forward';
                updateDisplay(valueId, this.value, unit);
            } else {
                updateDisplay(valueId, this.value, unit);
            }
            
            // Redraw aircraft
            drawAircraft(
                parseFloat(forwardCargo.value),
                parseFloat(aftCargo.value),
                parseFloat(fuelDistribution.value)
            );
            calculateAircraftBalance();
        });
    });
}

function drawAircraft(forwardCargo, aftCargo, fuelDistribution) {
    const ctx = clearCanvas('aircraft-canvas');
    if (!ctx) return;
    
    const canvas = ctx.canvas;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Calculate center of gravity
    // Base aircraft empty weight and CG position
    const emptyWeight = 5000; // kg
    const emptyCG = 0; // reference point at center
    
    // CG locations relative to reference (in meters)
    const forwardCGLocation = -3;
    const aftCGLocation = 4;
    const forwardFuelCGLocation = -2;
    const aftFuelCGLocation = 2;
    
    // Fixed fuel weight
    const totalFuelWeight = 2000; // kg
    const forwardFuelWeight = (fuelDistribution / 100) * totalFuelWeight;
    const aftFuelWeight = totalFuelWeight - forwardFuelWeight;
    
    // Calculate weighted CG
    const totalWeight = emptyWeight + forwardCargo + aftCargo + totalFuelWeight;
    const weightedCG = (
        (emptyWeight * emptyCG) +
        (forwardCargo * forwardCGLocation) +
        (aftCargo * aftCGLocation) +
        (forwardFuelWeight * forwardFuelCGLocation) +
        (aftFuelWeight * aftFuelCGLocation)
    ) / totalWeight;
    
    // Calculate aircraft pitch angle based on CG
    // Ideal CG is slightly nose-down (weightedCG = -0.2)
    const idealCG = -0.2;
    const maxPitch = 15 * Math.PI / 180; // 15 degrees max pitch
    const cgRange = 3; // CG range that would cause max pitch
    
    const cgError = weightedCG - idealCG;
    let pitchAngle = (cgError / cgRange) * maxPitch;
    pitchAngle = Math.max(Math.min(pitchAngle, maxPitch), -maxPitch);
    
    // Draw sky and ground
    ctx.fillStyle = '#7aa2f7';
    ctx.fillRect(0, 0, canvas.width, centerY);
    
    ctx.fillStyle = '#34495e';
    ctx.fillRect(0, centerY, canvas.width, canvas.height - centerY);
    
    // Save context for aircraft rotation
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(pitchAngle);
    
    // Aircraft dimensions
    const aircraftLength = 300;
    const aircraftHeight = 40;
    const wingSpan = 200;
    const wingThickness = 15;
    const tailHeight = 50;
    
    // Draw fuselage
    ctx.fillStyle = '#bbbbbb';
    ctx.beginPath();
    ctx.rect(-aircraftLength/2, -aircraftHeight/2, aircraftLength, aircraftHeight);
    
    // Draw nose cone
    ctx.moveTo(-aircraftLength/2, 0);
    ctx.lineTo(-aircraftLength/2 - 30, -aircraftHeight/4);
    ctx.lineTo(-aircraftLength/2 - 30, aircraftHeight/4);
    ctx.closePath();
    ctx.fill();
    
    // Draw wings
    ctx.fillStyle = '#cccccc';
    ctx.beginPath();
    ctx.rect(-wingSpan/2, 0, wingSpan, wingThickness);
    ctx.fill();
    
    // Draw tail
    ctx.fillStyle = '#cccccc';
    ctx.beginPath();
    ctx.moveTo(aircraftLength/2 - 40, -aircraftHeight/2);
    ctx.lineTo(aircraftLength/2, -aircraftHeight/2 - tailHeight);
    ctx.lineTo(aircraftLength/2, -aircraftHeight/2);
    ctx.closePath();
    ctx.fill();
    
    // Draw CG position
    // Convert from -5 to 5 meters to -150 to 150 pixels
    const cgX = weightedCG * 30;
    
    // Draw acceptable CG range
    ctx.fillStyle = 'rgba(158, 206, 106, 0.3)'; // Green with transparency
    ctx.beginPath();
    ctx.rect(-30, -aircraftHeight/2 - 20, 60, 10);
    ctx.fill();
    
    // Draw CG marker
    ctx.fillStyle = '#f7768e';
    ctx.beginPath();
    ctx.moveTo(cgX, -aircraftHeight/2 - 10);
    ctx.lineTo(cgX - 5, -aircraftHeight/2 - 20);
    ctx.lineTo(cgX + 5, -aircraftHeight/2 - 20);
    ctx.closePath();
    ctx.fill();
    
    // CG Label
    ctx.fillStyle = 'white';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CG', cgX, -aircraftHeight/2 - 25);
    
    // Draw cargo indicators
    if (forwardCargo > 0) {
        ctx.fillStyle = '#bb9af7';
        ctx.beginPath();
        ctx.rect(forwardCGLocation * 30 - 20, aircraftHeight/2, 40, 20);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${forwardCargo} kg`, forwardCGLocation * 30, aircraftHeight/2 + 30);
    }
    
    if (aftCargo > 0) {
        ctx.fillStyle = '#bb9af7';
        ctx.beginPath();
        ctx.rect(aftCGLocation * 30 - 20, aircraftHeight/2, 40, 20);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${aftCargo} kg`, aftCGLocation * 30, aircraftHeight/2 + 30);
    }
    
    // Draw fuel indicators
    if (forwardFuelWeight > 0) {
        ctx.fillStyle = '#73daca';
        ctx.beginPath();
        ctx.rect(forwardFuelCGLocation * 30 - 15, -aircraftHeight/2 - 15, 30, 15);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${forwardFuelWeight.toFixed(0)} kg`, forwardFuelCGLocation * 30, -aircraftHeight/2 - 20);
    }
    
    if (aftFuelWeight > 0) {
        ctx.fillStyle = '#73daca';
        ctx.beginPath();
        ctx.rect(aftFuelCGLocation * 30 - 15, -aircraftHeight/2 - 15, 30, 15);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${aftFuelWeight.toFixed(0)} kg`, aftFuelCGLocation * 30, -aircraftHeight/2 - 20);
    }
    
    ctx.restore();
}

function calculateAircraftBalance() {
    const forwardCargo = parseFloat(document.getElementById('forward-cargo').value);
    const aftCargo = parseFloat(document.getElementById('aft-cargo').value);
    const fuelDistribution = parseFloat(document.getElementById('fuel-distribution').value);
    
    // Calculate center of gravity
    // Base aircraft empty weight and CG position
    const emptyWeight = 5000; // kg
    const emptyCG = 0; // reference point at center
    
    // CG locations relative to reference (in meters)
    const forwardCGLocation = -3;
    const aftCGLocation = 4;
    const forwardFuelCGLocation = -2;
    const aftFuelCGLocation = 2;
    
    // Fixed fuel weight
    const totalFuelWeight = 2000; // kg
    const forwardFuelWeight = (fuelDistribution / 100) * totalFuelWeight;
    const aftFuelWeight = totalFuelWeight - forwardFuelWeight;
    
    // Calculate weighted CG
    const totalWeight = emptyWeight + forwardCargo + aftCargo + totalFuelWeight;
    const weightedCG = (
        (emptyWeight * emptyCG) +
        (forwardCargo * forwardCGLocation) +
        (aftCargo * aftCGLocation) +
        (forwardFuelWeight * forwardFuelCGLocation) +
        (aftFuelWeight * aftFuelCGLocation)
    ) / totalWeight;
    
    // Determine CG position relative to acceptable range
    const minCG = -0.5;
    const maxCG = 0.5;
    let cgPosition = '';
    let cgColor = '';
    
    if (weightedCG < minCG) {
        const deviation = Math.abs(weightedCG - minCG).toFixed(2);
        cgPosition = `Nose heavy (${deviation}m forward)`;
        cgColor = weightedCG < minCG - 1 ? '#f7768e' : '#ff9e64';
    } else if (weightedCG > maxCG) {
        const deviation = Math.abs(weightedCG - maxCG).toFixed(2);
        cgPosition = `Tail heavy (${deviation}m aft)`;
        cgColor = weightedCG > maxCG + 1 ? '#f7768e' : '#ff9e64';
    } else {
        cgPosition = 'On target';
        cgColor = '#9ece6a';
    }
    
    updateDisplay('cg-position', cgPosition);
    document.getElementById('cg-position').style.color = cgColor;
    
    // Determine flight characteristic
    let characteristic = '';
    
    if (weightedCG < minCG - 1) {
        characteristic = 'Strong nose-down tendency';
        document.getElementById('flight-characteristic').style.color = '#f7768e';
    } else if (weightedCG < minCG) {
        characteristic = 'Mild nose-down tendency';
        document.getElementById('flight-characteristic').style.color = '#ff9e64';
    } else if (weightedCG > maxCG + 1) {
        characteristic = 'Strong nose-up tendency, potential stall';
        document.getElementById('flight-characteristic').style.color = '#f7768e';
    } else if (weightedCG > maxCG) {
        characteristic = 'Mild nose-up tendency';
        document.getElementById('flight-characteristic').style.color = '#ff9e64';
    } else {
        characteristic = 'Neutral, stable flight';
        document.getElementById('flight-characteristic').style.color = '#9ece6a';
    }
    
    updateDisplay('flight-characteristic', characteristic);
} 