const canvas = document.getElementById("simulator-canvas");
const ctx = canvas.getContext("2d");

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const forces = [];
let currentRotation = 0;
let showNetMOFValue = false;

function drawStand() {
    // Draw base
    ctx.fillStyle = "#2c3e50";
    ctx.beginPath();
    ctx.moveTo(centerX - 100, centerY + 100);
    ctx.lineTo(centerX + 100, centerY + 100);
    ctx.lineTo(centerX + 80, centerY + 120);
    ctx.lineTo(centerX - 80, centerY + 120);
    ctx.closePath();
    ctx.fill();

    // Draw vertical support
    ctx.fillStyle = "#34495e";
    ctx.beginPath();
    ctx.moveTo(centerX - 20, centerY + 100);
    ctx.lineTo(centerX + 20, centerY + 100);
    ctx.lineTo(centerX + 15, centerY - 50);
    ctx.lineTo(centerX - 15, centerY - 50);
    ctx.closePath();
    ctx.fill();

    // Draw horizontal support
    ctx.fillStyle = "#34495e";
    ctx.beginPath();
    ctx.moveTo(centerX - 15, centerY - 50);
    ctx.lineTo(centerX + 15, centerY - 50);
    ctx.lineTo(centerX + 15, centerY - 40);
    ctx.lineTo(centerX - 15, centerY - 40);
    ctx.closePath();
    ctx.fill();
}

function drawLever() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Reset any global state that might have been changed
    ctx.globalAlpha = 1.0;
    
    // Draw stand first (always fixed)
    drawStand();
    
    // Save the context before rotating
    ctx.save();
    
    // Translate to pivot point and rotate
    ctx.translate(centerX, centerY - 45);
    ctx.rotate(currentRotation * Math.PI / 180);
    
    // Draw lever
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(-350, 0);
    ctx.lineTo(350, 0);
    ctx.strokeStyle = "#7aa2f7";
    ctx.stroke();

    // Draw pivot point
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, 2 * Math.PI);
    ctx.fillStyle = "#bb9af7";
    ctx.fill();
    ctx.strokeStyle = "#7aa2f7";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw pivot connection
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.lineTo(15, 0);
    ctx.lineTo(15, 5);
    ctx.lineTo(-15, 5);
    ctx.closePath();
    ctx.fillStyle = "#34495e";
    ctx.fill();

    // Draw forces (only if any exist)
    if (forces.length > 0) {
        drawForces();
    }
    
    // Restore the context
    ctx.restore();
}

function drawForces() {
    forces.forEach(force => {
        const { distance, value, direction, position, isNew, fadeOut } = force;
        
        // Skip drawing if this force is fading out during reset
        if (fadeOut) return;
        
        // Position based on side - use position property if available
        // otherwise calculate from direction
        const side = position || (direction === "Clockwise" ? 1 : -1);
        const posX = side * distance * 3;
        
        // Apply animation for new weights
        let scale = 1;
        let alpha = 1;
        
        if (isNew) {
            // Scale animation for new weights
            scale = 1.2;
            
            // Draw glow effect for new weights
            ctx.beginPath();
            ctx.arc(posX, 15, 30, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fill();
        }
        
        // Draw weight with scaling for new weights
        ctx.fillStyle = "#f7768e";
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(posX - 15 * scale, 0);
        ctx.lineTo(posX + 15 * scale, 0);
        ctx.lineTo(posX + 10 * scale, 25 * scale);
        ctx.lineTo(posX - 10 * scale, 25 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        // Draw weight string
        ctx.beginPath();
        ctx.moveTo(posX, 0);
        ctx.lineTo(posX, 25 * scale);
        ctx.strokeStyle = "#f7768e";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Weight label
        ctx.fillStyle = "#7aa2f7";
        ctx.font = `bold ${16 * scale}px Poppins`;
        ctx.textAlign = "center";
        ctx.fillText(`${value} kg`, posX, 35 * scale);
        
        // Add distance label below the weight value
        const actualDistance = force.actualDistance || (Math.abs(distance/3)); // Convert from pixel position if needed
        ctx.fillStyle = "#9ece6a"; // Green color for distance
        ctx.font = `${12 * scale}px Poppins`;
        ctx.fillText(`${actualDistance.toFixed(0)} cm`, posX, 52 * scale);
    });

    // Draw net force
    const netForce = calculateNetForce();
    const posX = netForce.direction === "Clockwise" ? 100 : 
                 netForce.direction === "Anticlockwise" ? -100 : 0;
    
    if (netForce.direction !== "Balanced") {
        // Draw net force arrow
        ctx.beginPath();
        ctx.moveTo(posX, -55);
        ctx.lineTo(posX, -105);
        ctx.strokeStyle = "#4a90e2";
        ctx.lineWidth = 4;
        ctx.stroke();
    
        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(posX - 10, -97);
        ctx.lineTo(posX, -105);
        ctx.lineTo(posX + 10, -97);
        ctx.stroke();
    }
    
    // Net force label with background
    ctx.fillStyle = "rgba(74, 144, 226, 0.2)";
    ctx.beginPath();
    ctx.roundRect(posX - 80, -140, 160, 30, 8);
    ctx.fill();
    
    ctx.fillStyle = "#4a90e2";
    ctx.font = "bold 18px Poppins";
    ctx.textAlign = "center";
    ctx.fillText(`Net Force: ${netForce.total} kg`, posX, -125);
    
    // Draw direction indicator
    ctx.fillStyle = "#4a90e2";
    ctx.font = "bold 14px Poppins";
    ctx.fillText(`Direction: ${netForce.direction}`, posX, -105);

    // Draw net MOF if enabled
    if (showNetMOFValue) {
        const netMOF = calculateNetMOF();
        const mofX = netMOF.direction === "Clockwise" ? 200 : 
                     netMOF.direction === "Anticlockwise" ? -200 : 0;
        
        // Draw MOF background
        ctx.fillStyle = "rgba(187, 154, 247, 0.2)";
        ctx.beginPath();
        ctx.roundRect(mofX - 100, -180, 200, 60, 8);
        ctx.fill();
        
        // Draw MOF value
        ctx.fillStyle = "#bb9af7";
        ctx.font = "bold 18px Poppins";
        ctx.textAlign = "center";
        ctx.fillText(`Net MOF: ${netMOF.total} N⋅m`, mofX, -160);
        
        // Draw MOF direction
        ctx.font = "bold 14px Poppins";
        ctx.fillText(`Direction: ${netMOF.direction}`, mofX, -140);
        
        if (netMOF.direction !== "Balanced") {
            // Draw MOF arrow
            ctx.beginPath();
            ctx.moveTo(mofX, -130);
            ctx.lineTo(mofX, -180);
            ctx.strokeStyle = "#bb9af7";
            ctx.lineWidth = 4;
            ctx.stroke();
            
            // Arrowhead
            ctx.beginPath();
            ctx.moveTo(mofX - 10, -172);
            ctx.lineTo(mofX, -180);
            ctx.lineTo(mofX + 10, -172);
            ctx.stroke();
        }
    }
}

function calculateNetForce() {
    let cwForce = 0;
    let acwForce = 0;
    
    forces.forEach(force => {
        if (force.direction === "Clockwise") {
            cwForce += force.value;
        } else {
            acwForce += force.value;
        }
    });
    
    const netForce = cwForce - acwForce;
    let direction = "Balanced";
    
    if (netForce > 0.1) {
        direction = "Clockwise";
    } else if (netForce < -0.1) {
        direction = "Anticlockwise";
    }
    
    return { 
        total: Math.abs(netForce).toFixed(1), 
        direction 
    };
}

function calculateNetMOF() {
    let cwMoment = 0;
    let acwMoment = 0;
    
    forces.forEach(force => {
        const moment = force.distance * force.value;
        
        if (force.direction === "Clockwise") {
            cwMoment += moment;
        } else {
            acwMoment += moment;
        }
    });
    
    const netMoment = cwMoment - acwMoment;
    let direction = "Balanced";
    
    if (netMoment > 0) {
        direction = "Clockwise";
    } else if (netMoment < 0) {
        direction = "Anticlockwise";
    }
    
    return { 
        total: Math.abs(netMoment).toFixed(2), 
        direction 
    };
}

// Smoother rotation with spring effect
function animateRotation(targetAngle) {
    // Spring physics variables
    const spring = 0.2;    // Spring strength (higher = faster but more bouncy)
    const damping = 0.75;  // Damping (higher = less oscillation)
    let velocity = 0;
    
    function animate() {
        // Calculate spring force
        const distance = targetAngle - currentRotation;
        const force = distance * spring;
        
        // Apply force to create acceleration, adjust with damping
        velocity += force;
        velocity *= damping;
        
        // Apply velocity to rotation
        currentRotation += velocity;
        
        // Draw the lever with updated rotation
        drawLever();
        
        // Continue animation if movement is still significant
        if (Math.abs(velocity) > 0.001 || Math.abs(distance) > 0.001) {
            requestAnimationFrame(animate);
        }
    }
    
    animate();
}

function calculateMoments() {
    // If no forces, ensure scale is level
    if (forces.length === 0) {
        animateRotation(0);
        return;
    }
    
    // Calculate moments from principle of moments
    let cwMoment = 0;  // clockwise moment
    let acwMoment = 0; // anticlockwise moment
    
    forces.forEach(force => {
        // Use actualDistance if available, otherwise use the display distance
        const distanceToUse = force.actualDistance || force.distance;
        const moment = distanceToUse * force.value;
        
        if (force.direction === "Clockwise") {
            cwMoment += moment;
        } else {
            acwMoment += moment;
        }
    });
    
    // Calculate net moment
    const netMoment = cwMoment - acwMoment;
    
    // If the difference is very small, treat as balanced
    const balanceThreshold = 0.5;
    if (Math.abs(netMoment) < balanceThreshold) {
        animateRotation(0);
        return;
    }
    
    // Otherwise, calculate rotation angle
    // Use a more responsive rotation sensitivity for visual impact
    const rotationSensitivity = 50;  // Lower = more sensitive rotation
    const newRotation = (netMoment / rotationSensitivity) * 20;
    
    // Limit rotation for visual purposes
    const clampedRotation = Math.max(Math.min(newRotation, 30), -30);
    
    // Animate to the new rotation
    animateRotation(clampedRotation);
}

function addForce() {
    const position = parseFloat(document.getElementById("weightPosition").value);
    const value = parseFloat(document.getElementById("weightValue").value);
    
    if (isNaN(position) || isNaN(value) || value <= 0) {
        alert("Please enter valid positive numbers");
        return;
    }
    
    // Determine direction based on position (positive = right/clockwise, negative = left/anticlockwise)
    const direction = position >= 0 ? "Clockwise" : "Anticlockwise";
    const side = position >= 0 ? 1 : -1;
    
    // Create the force with animation flag and actual distance
    const newForce = { 
        distance: Math.abs(position),
        value: value,
        direction: direction,
        position: side,
        actualDistance: Math.abs(position), // Store actual distance for labels
        isNew: true  // Flag to animate new weights
    };
    
    forces.push(newForce);
    
    // Calculate and animate moments
    calculateMoments();
    
    // Remove the "new" flag after animation completes
    setTimeout(() => {
        newForce.isNew = false;
        drawLever();
    }, 1000);
}

function showNetMOF() {
    showNetMOFValue = !showNetMOFValue;
    calculateMoments();
}

// Initialize
drawLever();

// Add hover effects
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Transform mouse coordinates to account for rotation
    const dx = x - centerX;
    const dy = y - (centerY - 45);
    const angle = -currentRotation * Math.PI / 180;
    const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle);
    const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle);
    
    // Check if mouse is over any force
    forces.forEach(force => {
        const posX = force.direction === "Clockwise" 
            ? force.distance * 3 
            : -force.distance * 3;
        
        if (Math.abs(rotatedX - posX) < 20 && Math.abs(rotatedY) < 20) {
            canvas.style.cursor = 'pointer';
            return;
        }
    });
    canvas.style.cursor = 'default';
});

// Add click handler to remove forces
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Transform mouse coordinates to account for rotation
    const dx = x - centerX;
    const dy = y - (centerY - 45);
    const angle = -currentRotation * Math.PI / 180;
    const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle);
    const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle);
    
    forces.forEach((force, index) => {
        const posX = force.direction === "Clockwise" 
            ? force.distance * 3 
            : -force.distance * 3;
        
        if (Math.abs(rotatedX - posX) < 20 && Math.abs(rotatedY) < 20) {
            forces.splice(index, 1);
            calculateMoments();
        }
    });
});

// Add video popup HTML to the body
document.body.insertAdjacentHTML('beforeend', `
    <div class="video-popup" id="videoPopup">
        <div class="video-popup-content">
            <button class="close-popup" onclick="closeVideoPopup()">×</button>
            <iframe src="https://drive.google.com/embeddedfolderview?id=1qheQ6j6j1fop7ZiFKrbN-bSHM_kgtlS_#grid" 
                    style="width:100%; height:100%; border:none;"></iframe>
        </div>
    </div>
`);

function openVideoPopup() {
    // Calculate center position
    const width = 1000;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    // Open Google Drive folder in a centered popup window
    const popupWindow = window.open(
        'https://drive.google.com/drive/folders/1qheQ6j6j1fop7ZiFKrbN-bSHM_kgtlS_?usp=sharing',
        'Google Drive',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
    );
    
    // Focus the popup window
    if (popupWindow) {
        popupWindow.focus();
    } else {
        // If popup is blocked, show error message
        alert('Please allow popups for this website to view the videos.');
    }
}

function closeVideoPopup() {
    const popup = document.getElementById('videoPopup');
    popup.classList.remove('active');
    document.body.style.overflow = '';
}

// Close popup when clicking outside
document.getElementById('videoPopup').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        closeVideoPopup();
    }
});

// Close popup with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeVideoPopup();
    }
});

// Add PDF popup HTML to the body
document.body.insertAdjacentHTML('beforeend', `
    <div class="pdf-popup" id="pdfPopup">
        <div class="pdf-popup-content">
            <button class="close-popup" onclick="closePDFPopup()">×</button>
            <div class="pdf-container">
                <div class="pdf-error" style="display: none;">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Unable to load PDF. Please try the following:</p>
                    <ul>
                        <li>Make sure the PDF file is properly shared</li>
                        <li>Check your internet connection</li>
                        <li>Try opening in a new tab</li>
                    </ul>
                    <a href="MOF.pdf" target="_blank" class="btn btn-primary">Open PDF in New Tab</a>
                </div>
                <iframe id="pdfViewer" 
                        src="about:blank"
                        style="width:100%; height:100%; border:none;"
                        onload="handlePDFLoad(this)"
                        onerror="handlePDFError(this)"></iframe>
            </div>
        </div>
    </div>
`);

function openPDFPopup() {
    // Calculate center position
    const width = 800;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    // Open PDF in a centered popup window
    const popupWindow = window.open('MOF.pdf', 'PDF Viewer', 
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`);
    
    // Focus the popup window
    if (popupWindow) {
        popupWindow.focus();
    } else {
        // If popup is blocked, show error message
        alert('Please allow popups for this website to view the PDF.');
    }
}

function handlePDFLoad(iframe) {
    // Check if the PDF loaded successfully
    try {
        if (iframe.contentWindow.document.body.innerHTML.includes('Unable to display PDF')) {
            handlePDFError(iframe);
        }
    } catch (error) {
        handlePDFError(iframe);
    }
}

function handlePDFError(iframe) {
    iframe.style.display = 'none';
    const pdfError = document.querySelector('.pdf-error');
    pdfError.style.display = 'flex';
}

function closePDFPopup() {
    const popup = document.getElementById('pdfPopup');
    popup.classList.remove('active');
    document.body.style.overflow = '';
}

// Close PDF popup when clicking outside
document.getElementById('pdfPopup').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        closePDFPopup();
    }
});

// Close PDF popup with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePDFPopup();
    }
});

// Mobile menu functionality
function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
}

// Close mobile menu when clicking a link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        const navLinks = document.querySelector('.nav-links');
        navLinks.classList.remove('active');
    });
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    const navLinks = document.querySelector('.nav-links');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
        navLinks.classList.remove('active');
    }
});

function adjustPosition(change) {
    const positionInput = document.getElementById('weightPosition');
    const currentValue = parseInt(positionInput.value) || 0;  // Default to 0 if NaN
    
    // If change is -1 (minus button), make the value negative
    // If change is 1 (plus button), make the value positive
    const newValue = change === -1 ? -Math.abs(currentValue) : Math.abs(currentValue);
    
    // Ensure the new value stays within the min/max range
    if (newValue >= parseInt(positionInput.min) && newValue <= parseInt(positionInput.max)) {
        positionInput.value = newValue;
        // Trigger the input event to update any listeners
        positionInput.dispatchEvent(new Event('input'));
    }
}

// Principle of Moments Calculator
function initMomentsCalculator() {
    const mass1Input = document.getElementById('mass1');
    const distance1Input = document.getElementById('distance1');
    const mass2Input = document.getElementById('mass2');
    const distance2Input = document.getElementById('distance2');
    const calculateBtn = document.getElementById('calculateBtn');
    const resetBtn = document.getElementById('resetBtn');
    const applyToSimBtn = document.getElementById('applyToSimBtn');
    const resultElement = document.getElementById('calculation-result');
    const errorElement = document.getElementById('error-message');
    
    // Set initial state of the Apply button
    applyToSimBtn.disabled = true;
    
    // Calculate button click handler
    calculateBtn.addEventListener('click', () => {
        // Clear previous results and errors
        resultElement.textContent = '';
        errorElement.textContent = '';
        
        // Reset highlight class on inputs
        [mass1Input, distance1Input, mass2Input, distance2Input].forEach(input => {
            input.classList.remove('highlight-input');
        });
        
        // Get input values
        const m1 = parseFloat(mass1Input.value);
        const d1 = parseFloat(distance1Input.value);
        const m2 = parseFloat(mass2Input.value);
        const d2 = parseFloat(distance2Input.value);
        
        // Count non-empty values
        const values = [m1, d1, m2, d2];
        const emptyCount = values.filter(val => isNaN(val)).length;
        
        // Check if all four values are provided
        if (emptyCount === 0) {
            // All four values are provided, verify if they satisfy the principle of moments
            const moment1 = m1 * d1;
            const moment2 = m2 * d2;
            const difference = Math.abs(moment1 - moment2);
            
            // If moments are close enough, consider it valid
            if (difference < 0.1) {
                resultElement.textContent = `All values are valid! m₁×d₁ = m₂×d₂ (${moment1.toFixed(2)} = ${moment2.toFixed(2)})`;
                applyToSimBtn.disabled = false;
                return;
            } else {
                errorElement.textContent = `Error: The provided values don't satisfy the principle of moments. ` +
                    `m₁×d₁ = ${moment1.toFixed(2)}, m₂×d₂ = ${moment2.toFixed(2)}`;
                return;
            }
        } 
        // Check if exactly one value is empty (3 values provided)
        else if (emptyCount !== 1) {
            errorElement.textContent = 'Error: Please provide exactly three values to calculate the fourth one.';
            return;
        }
        
        // Validate input values are positive
        const filledValues = values.filter(val => !isNaN(val));
        if (filledValues.some(val => val <= 0)) {
            errorElement.textContent = 'Error: All values must be positive numbers.';
            return;
        }
        
        // Calculate the missing value based on principle of moments: m₁ × d₁ = m₂ × d₂
        let calculatedValue;
        let calculatedField;
        
        if (isNaN(m1)) {
            calculatedValue = (m2 * d2) / d1;
            calculatedField = mass1Input;
            resultElement.textContent = `m₁ = (m₂ × d₂) ÷ d₁ = (${m2} × ${d2}) ÷ ${d1} = ${calculatedValue.toFixed(2)} kg`;
        } else if (isNaN(d1)) {
            calculatedValue = (m2 * d2) / m1;
            calculatedField = distance1Input;
            resultElement.textContent = `d₁ = (m₂ × d₂) ÷ m₁ = (${m2} × ${d2}) ÷ ${m1} = ${calculatedValue.toFixed(2)} m`;
        } else if (isNaN(m2)) {
            calculatedValue = (m1 * d1) / d2;
            calculatedField = mass2Input;
            resultElement.textContent = `m₂ = (m₁ × d₁) ÷ d₂ = (${m1} × ${d1}) ÷ ${d2} = ${calculatedValue.toFixed(2)} kg`;
        } else if (isNaN(d2)) {
            calculatedValue = (m1 * d1) / m2;
            calculatedField = distance2Input;
            resultElement.textContent = `d₂ = (m₁ × d₁) ÷ m₂ = (${m1} × ${d1}) ÷ ${m2} = ${calculatedValue.toFixed(2)} m`;
        }
        
        // Check if the calculated value is reasonable (not too large or Infinity)
        if (!isFinite(calculatedValue) || calculatedValue > 1000) {
            errorElement.textContent = 'Error: The calculated value is too large or undefined. Please check your inputs.';
            calculatedField.value = '';
            return;
        }
        
        // Display and highlight the calculated value
        calculatedField.value = calculatedValue.toFixed(2);
        calculatedField.classList.add('highlight-input');
        
        // Enable apply button
        applyToSimBtn.disabled = false;
    });
    
    // Reset button click handler
    resetBtn.addEventListener('click', () => {
        // Clear all inputs, results, and errors
        [mass1Input, distance1Input, mass2Input, distance2Input].forEach(input => {
            input.value = '';
            input.classList.remove('highlight-input');
        });
        resultElement.textContent = '';
        errorElement.textContent = '';
        
        // Disable apply button
        applyToSimBtn.disabled = true;
    });
    
    // Apply to simulation button click handler
    applyToSimBtn.addEventListener('click', () => {
        // Get the current values
        const m1 = parseFloat(mass1Input.value);
        const d1 = parseFloat(distance1Input.value);
        const m2 = parseFloat(mass2Input.value);
        const d2 = parseFloat(distance2Input.value);
        
        // Validate values
        if (isNaN(m1) || isNaN(d1) || isNaN(m2) || isNaN(d2) || 
            m1 <= 0 || d1 <= 0 || m2 <= 0 || d2 <= 0) {
            errorElement.textContent = "Invalid values detected. Please check your inputs.";
            return;
        }
        
        // Verify that the principle of moments is satisfied or close enough
        const moment1 = m1 * d1;
        const moment2 = m2 * d2;
        const momentDifference = Math.abs(moment1 - moment2);
        
        // If moments are significantly different, show a warning but still proceed
        const tolerance = 0.1; // 10% tolerance
        let balanceMessage = "";
        
        if (momentDifference > tolerance) {
            balanceMessage = `Note: The principle of moments is not perfectly balanced. ` +
                `m₁×d₁ = ${moment1.toFixed(2)}, m₂×d₂ = ${moment2.toFixed(2)}`;
        }
        
        // Clear existing forces
        forces.length = 0;
        
        // Calculate visual scale factor (smaller of the two to ensure both weights fit)
        const maxDistance = Math.max(d1, d2);
        const scaleFactor = Math.min(4, 40 / maxDistance);
        
        // Add the two forces to the simulation
        // Force 1 on left side (negative position)
        forces.push({ 
            distance: d1 * scaleFactor, // Scaled for display 
            value: m1, 
            direction: "Anticlockwise", 
            position: -1,  // Left side
            actualDistance: d1,  // Store actual distance for labels
            isNew: true    // For animation
        });
        
        // Force 2 on right side (positive position)
        forces.push({ 
            distance: d2 * scaleFactor, // Scaled for display
            value: m2, 
            direction: "Clockwise",
            position: 1,   // Right side
            actualDistance: d2,  // Store actual distance for labels
            isNew: true    // For animation
        });
        
        // Clear existing inputs
        document.getElementById('weightValue').value = '';
        document.getElementById('weightPosition').value = '';
        
        // Update the simulation
        calculateMoments();
        
        // Display confirmation and any balance warnings
        if (balanceMessage) {
            resultElement.textContent = "Applied to simulation with possible imbalance";
            errorElement.textContent = balanceMessage;
        } else {
            resultElement.textContent = "Applied to simulation successfully! The system is balanced.";
            errorElement.textContent = "";
        }
        
        resultElement.style.color = "#9ece6a";
        
        setTimeout(() => {
            resultElement.style.color = "";
            // Remove the "new" flag after animation completes
            forces.forEach(force => {
                force.isNew = false;
            });
            drawLever();
        }, 2000);
        
        // Smooth scroll to the simulator section
        smoothScrollTo('simulator');
    });
}

// Initialize event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize moments calculator
    initMomentsCalculator();
    
    // Add reset button event listener
    const resetBtn = document.getElementById('resetSimBtn');
    if (resetBtn) {
        console.log("Reset button found, adding event listener");
        resetBtn.addEventListener('click', function() {
            console.log("Reset button clicked");
            resetSimulator();
        });
    } else {
        console.error("Reset button not found");
    }
    
    // Add smooth scroll behavior to all nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            smoothScrollTo(targetId);
        });
    });
});

// Function to run tutorial demos
function runTutorialDemo(demoType) {
    // First, scroll to the simulator section
    smoothScrollTo('simulator');
    
    // Reset the simulator to start fresh
    resetSimulator();
    
    // Handle different demo types
    switch(demoType) {
        case 'wrench-demo':
            // Demonstrate a wrench with different handle lengths
            showTooltip('A longer wrench handle requires less effort to turn a bolt', centerX, centerY - 100);
            
            // First, add a small wrench (short distance, large force)
            setTimeout(() => {
                forces.push({ 
                    distance: 10,
                    value: 30,
                    direction: "Clockwise",
                    position: 1,
                    actualDistance: 10,
                    isNew: true
                });
                
                calculateMoments();
                
                showTooltip('Short wrench = More force needed', centerX + 30, centerY - 70);
                
                // After some time, show a longer wrench (longer distance, smaller force)
                setTimeout(() => {
                    forces.length = 0; // Clear forces
                    
                    forces.push({ 
                        distance: 30,
                        value: 10,
                        direction: "Clockwise",
                        position: 1,
                        actualDistance: 30,
                        isNew: true
                    });
                    
                    calculateMoments();
                    
                    showTooltip('Longer wrench = Less force needed for same torque', centerX + 90, centerY - 70);
                }, 4000);
            }, 1000);
            break;
            
        case 'seesaw-demo':
            // Demonstrate a balanced seesaw
            showTooltip('Seesaws balance when moments are equal on both sides', centerX, centerY - 100);
            
            // Add balanced seesaw with different weights at different distances
            setTimeout(() => {
                forces.push({ 
                    distance: 30,
                    value: 10,
                    direction: "Anticlockwise",
                    position: -1,
                    actualDistance: 30,
                    isNew: true
                });
                
                forces.push({ 
                    distance: 15,
                    value: 20,
                    direction: "Clockwise",
                    position: 1,
                    actualDistance: 15,
                    isNew: true
                });
                
                // m₁ × d₁ = m₂ × d₂ => 10 × 30 = 20 × 15 = 300
                calculateMoments();
                
                showTooltip('10kg at 30cm balances 20kg at 15cm (m₁×d₁ = m₂×d₂)', centerX, centerY - 100);
            }, 1000);
            break;
            
        case 'scale-demo':
            // Demonstrate a balance scale with unknown weight
            showTooltip('Balance scales use the principle of moments to measure mass', centerX, centerY - 100);
            
            setTimeout(() => {
                // Add an "unknown" weight on one side
                forces.push({ 
                    distance: 20,
                    value: 15, // "Unknown" weight
                    direction: "Anticlockwise",
                    position: -1,
                    actualDistance: 20,
                    isNew: true
                });
                
                calculateMoments();
                
                showTooltip('Unknown weight on the left side', centerX - 60, centerY - 70);
                
                // After delay, add standard weights to balance it
                setTimeout(() => {
                    // Add "standard" weights to balance
                    forces.push({ 
                        distance: 20,
                        value: 15, // Standard weight that matches
                        direction: "Clockwise",
                        position: 1,
                        actualDistance: 20,
                        isNew: true
                    });
                    
                    calculateMoments();
                    
                    showTooltip('When balanced, the unknown weight equals the standard weight', centerX, centerY - 100);
                }, 3000);
            }, 1000);
            break;
            
        case 'crane-demo':
            // Demonstrate a crane with counterweight
            showTooltip('Cranes use counterweights to balance heavy loads', centerX, centerY - 100);
            
            setTimeout(() => {
                // Add a heavy load at short distance (simulating crane arm)
                forces.push({ 
                    distance: 15,
                    value: 40,
                    direction: "Clockwise",
                    position: 1,
                    actualDistance: 15,
                    isNew: true
                });
                
                calculateMoments();
                
                showTooltip('Heavy load makes the crane unstable', centerX + 45, centerY - 70);
                
                // After delay, add counterweight
                setTimeout(() => {
                    forces.push({ 
                        distance: 10,
                        value: 60,
                        direction: "Anticlockwise",
                        position: -1,
                        actualDistance: 10,
                        isNew: true
                    });
                    
                    calculateMoments();
                    
                    // 40kg × 15cm = 60kg × 10cm = 600 N⋅cm
                    showTooltip('Counterweight balances the load (40×15 = 60×10)', centerX, centerY - 100);
                }, 3000);
            }, 1000);
            break;
            
        case 'biomech-demo':
            // Demonstrate human arm lever system
            showTooltip('The human arm acts as a lever system', centerX, centerY - 100);
            
            setTimeout(() => {
                // Simulate weight in hand (far from pivot)
                forces.push({ 
                    distance: 30,
                    value: 5,
                    direction: "Clockwise",
                    position: 1,
                    actualDistance: 30,
                    isNew: true
                });
                
                calculateMoments();
                
                showTooltip('5kg weight held in hand', centerX + 90, centerY - 70);
                
                // After delay, show the muscle force needed
                setTimeout(() => {
                    // Add bicep force (close to pivot but much higher)
                    forces.push({ 
                        distance: 5,
                        value: 30,
                        direction: "Anticlockwise",
                        position: -1,
                        actualDistance: 5,
                        isNew: true
                    });
                    
                    calculateMoments();
                    
                    // 5kg × 30cm = 30kg × 5cm = 150 N⋅cm
                    showTooltip('Bicep must exert 30kg force to hold a 5kg weight', centerX, centerY - 100);
                }, 3000);
            }, 1000);
            break;
            
        case 'automotive-demo':
            // Demonstrate weight distribution in vehicles
            showTooltip('Weight distribution affects vehicle stability', centerX, centerY - 100);
            
            setTimeout(() => {
                // Add front and rear wheel forces
                forces.push({ 
                    distance: 20,
                    value: 15,
                    direction: "Anticlockwise",
                    position: -1,
                    actualDistance: 20,
                    isNew: true
                });
                
                forces.push({ 
                    distance: 20,
                    value: 15,
                    direction: "Clockwise",
                    position: 1,
                    actualDistance: 20,
                    isNew: true
                });
                
                calculateMoments();
                
                showTooltip('Balanced 50/50 weight distribution', centerX, centerY - 100);
                
                // After delay, shift weight to "rear wheel"
                setTimeout(() => {
                    forces.length = 0;
                    
                    forces.push({ 
                        distance: 20,
                        value: 10,
                        direction: "Anticlockwise",
                        position: -1,
                        actualDistance: 20,
                        isNew: true
                    });
                    
                    forces.push({ 
                        distance: 20,
                        value: 20,
                        direction: "Clockwise",
                        position: 1,
                        actualDistance: 20,
                        isNew: true
                    });
                    
                    calculateMoments();
                    
                    showTooltip('Rear-wheel drive: 33/67 weight distribution', centerX + 60, centerY - 70);
                }, 3000);
            }, 1000);
            break;
            
        case 'bridge-demo':
            // Demonstrate cantilever bridge
            showTooltip('Bridges use the principle of moments for stability', centerX, centerY - 100);
            
            setTimeout(() => {
                // First show just a cantilever with a load
                forces.push({ 
                    distance: 30,
                    value: 15,
                    direction: "Clockwise",
                    position: 1,
                    actualDistance: 30,
                    isNew: true
                });
                
                calculateMoments();
                
                showTooltip('Cantilever with load would tip over', centerX + 90, centerY - 70);
                
                // After delay, add counterbalance
                setTimeout(() => {
                    forces.push({ 
                        distance: 15,
                        value: 30, // Need more weight at shorter distance
                        direction: "Anticlockwise",
                        position: -1,
                        actualDistance: 15,
                        isNew: true
                    });
                    
                    calculateMoments();
                    
                    // 15kg × 30cm = 30kg × 15cm = 450 N⋅cm
                    showTooltip('Counterweight balances the cantilever (15×30 = 30×15)', centerX, centerY - 100);
                }, 3000);
            }, 1000);
            break;
            
        case 'aircraft-demo':
            // Demonstrate aircraft balance
            showTooltip('Aircraft must be balanced around their center of gravity', centerX, centerY - 100);
            
            setTimeout(() => {
                // First show unbalanced condition
                forces.push({ 
                    distance: 25,
                    value: 20,
                    direction: "Anticlockwise",
                    position: -1,
                    actualDistance: 25,
                    isNew: true
                });
                
                forces.push({ 
                    distance: 10,
                    value: 20,
                    direction: "Clockwise",
                    position: 1,
                    actualDistance: 10,
                    isNew: true
                });
                
                calculateMoments();
                
                showTooltip('Unbalanced loading would cause nose-heavy attitude', centerX, centerY - 100);
                
                // After delay, show balanced loading
                setTimeout(() => {
                    forces.length = 0;
                    
                    forces.push({ 
                        distance: 20,
                        value: 15,
                        direction: "Anticlockwise",
                        position: -1,
                        actualDistance: 20,
                        isNew: true
                    });
                    
                    forces.push({ 
                        distance: 15,
                        value: 20,
                        direction: "Clockwise",
                        position: 1,
                        actualDistance: 15,
                        isNew: true
                    });
                    
                    calculateMoments();
                    
                    // 15kg × 20cm = 20kg × 15cm = 300 N⋅cm
                    showTooltip('Proper weight distribution ensures stable flight', centerX, centerY - 100);
                }, 4000);
            }, 1000);
            break;
            
        default:
            console.log('Demo not implemented:', demoType);
    }
}

// Helper function to show temporary tooltips during demos
function showTooltip(message, x, y) {
    // Remove any existing tooltips
    const existingTooltip = document.getElementById('tutorial-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
    
    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.id = 'tutorial-tooltip';
    tooltip.textContent = message;
    tooltip.style.position = 'absolute';
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    tooltip.style.transform = 'translate(-50%, -100%)';
    tooltip.style.background = 'rgba(74, 144, 226, 0.9)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '8px 12px';
    tooltip.style.borderRadius = '6px';
    tooltip.style.zIndex = '1000';
    tooltip.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    tooltip.style.fontSize = '14px';
    tooltip.style.fontWeight = '500';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.whiteSpace = 'nowrap';
    tooltip.style.animation = 'fadeInOut 4s forwards';
    
    // Add tooltip to the body
    document.body.appendChild(tooltip);
    
    // Remove tooltip after delay
    setTimeout(() => {
        if (tooltip) {
            tooltip.remove();
        }
    }, 4000);
}

// Smooth scroll to element function
function smoothScrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    window.scrollTo({
        top: element.offsetTop - 80, // Offset for navbar
        behavior: 'smooth'
    });
}

function resetSimulator() {
    console.log("Reset simulator called"); // Debug log
    
    // Clear all forces using array length approach
    forces.length = 0;
    
    // Reset rotation
    currentRotation = 0;
    
    // Reset MOF display
    showNetMOFValue = false;
    
    // Reset inputs to default values
    document.getElementById('weightValue').value = '10';
    document.getElementById('weightPosition').value = '20';
    
    // Force a redraw of the lever
    drawLever();
    
    // Show confirmation message
    showResetConfirmation();
}

function showResetConfirmation() {
    // Show confirmation message with animation
    const confirmationMessage = document.createElement('div');
    confirmationMessage.className = 'reset-confirmation';
    confirmationMessage.textContent = 'Simulator reset successfully!';
    document.querySelector('.simulator-container').appendChild(confirmationMessage);
    
    // Apply entrance animation
    confirmationMessage.style.animation = 'fadeInOut 2s cubic-bezier(0.215, 0.61, 0.355, 1)';
    
    // Remove the confirmation message after animation completes
    setTimeout(() => {
        if (confirmationMessage.parentNode) {
            confirmationMessage.parentNode.removeChild(confirmationMessage);
        }
    }, 2000);
} 