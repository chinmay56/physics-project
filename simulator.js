// Cartoon-style adjustable scale with attachable/removable weights
let scene, camera, renderer, scale, pivotPoint, stand, weights = [], tickMarks = [];
let animationFrame;
let scaleAngle = 0;
let targetAngle = 0;
const SCALE_LENGTH = 10; // meters
const SCALE_TICKS = 21; // 0 to 20

function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 15);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(document.getElementById('simulator-canvas').offsetWidth, 400);
    document.getElementById('simulator-canvas').appendChild(renderer.domElement);

    // Ground (grass)
    const groundGeometry = new THREE.PlaneGeometry(40, 20);
    const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x6ecc5a });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -3.5;
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Stand
    const standGeometry = new THREE.BoxGeometry(0.5, 4, 0.5);
    const standMaterial = new THREE.MeshPhongMaterial({ color: 0xf1c40f });
    stand = new THREE.Mesh(standGeometry, standMaterial);
    stand.position.y = -1.5;
    scene.add(stand);

    // Pivot
    const pivotGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 32);
    const pivotMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    pivotPoint = new THREE.Mesh(pivotGeometry, pivotMaterial);
    pivotPoint.position.y = 0.7;
    scene.add(pivotPoint);

    // Scale (meter rule)
    const scaleGeometry = new THREE.BoxGeometry(SCALE_LENGTH, 0.2, 0.5);
    const scaleMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    scale = new THREE.Mesh(scaleGeometry, scaleMaterial);
    scale.position.y = 1;
    scene.add(scale);

    // Tick marks and numbers
    for (let i = 0; i < SCALE_TICKS; i++) {
        const tickGeom = new THREE.BoxGeometry(0.05, 0.4, 0.5);
        const tickMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const tick = new THREE.Mesh(tickGeom, tickMat);
        tick.position.x = (i - 10) * (SCALE_LENGTH / (SCALE_TICKS - 1));
        tick.position.y = 1.2;
        scene.add(tick);
        tickMarks.push(tick);
        // Number labels (2D overlay)
        addTickLabel(i - 10, tick.position.x);
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(10, 10, 10);
    scene.add(dirLight);

    // Add button event
    document.getElementById('addWeightBtn').addEventListener('click', addWeight);

    // Initial render
    updateSimulation();
    animate();
}

function addTickLabel(num, x) {
    // Add a 2D label for each tick (using HTML overlay)
    const label = document.createElement('div');
    label.className = 'tick-label';
    label.innerText = num;
    label.style.position = 'absolute';
    label.style.left = `calc(50% + ${x * 25}px)`;
    label.style.top = '120px';
    label.style.color = '#222';
    label.style.fontSize = '12px';
    label.style.pointerEvents = 'none';
    document.getElementById('simulator-canvas').appendChild(label);
}

function addWeight() {
    // Default: 10N at position 5 (right of center)
    const weight = {
        force: 10,
        position: 5, // -10 to +10
        mesh: null,
        hook: null,
        id: Date.now() + Math.random()
    };
    // Create mesh
    const geom = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 32);
    const mat = new THREE.MeshPhongMaterial({ color: 0xe74c3c });
    weight.mesh = new THREE.Mesh(geom, mat);
    weight.mesh.position.y = 0.3;
    weight.mesh.position.x = weight.position * (SCALE_LENGTH / (SCALE_TICKS - 1));
    scene.add(weight.mesh);
    // Create hook
    const hookGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.7, 16);
    const hookMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    weight.hook = new THREE.Mesh(hookGeom, hookMat);
    weight.hook.position.y = 0.65;
    weight.hook.position.x = weight.mesh.position.x;
    scene.add(weight.hook);
    weights.push(weight);
    updateWeightControls();
    updateSimulation();
}

function removeWeight(id) {
    const idx = weights.findIndex(w => w.id === id);
    if (idx !== -1) {
        scene.remove(weights[idx].mesh);
        scene.remove(weights[idx].hook);
        weights.splice(idx, 1);
        updateWeightControls();
        updateSimulation();
    }
}

function updateWeightControls() {
    const container = document.getElementById('weightControls');
    container.innerHTML = '';
    weights.forEach((w, i) => {
        const div = document.createElement('div');
        div.className = 'weight-control';
        div.innerHTML = `
            <label>Weight ${i + 1} (N): <input type="number" min="1" max="50" value="${w.force}" data-id="${w.id}" class="force-input"></label>
            <label>Position: <input type="range" min="-10" max="10" value="${w.position}" data-id="${w.id}" class="pos-input"></label>
            <button class="remove-btn" data-id="${w.id}">Remove</button>
        `;
        container.appendChild(div);
    });
    // Add listeners
    container.querySelectorAll('.force-input').forEach(input => {
        input.addEventListener('input', e => {
            const id = parseFloat(e.target.getAttribute('data-id'));
            const w = weights.find(w => w.id === id);
            w.force = parseFloat(e.target.value);
            updateSimulation();
        });
    });
    container.querySelectorAll('.pos-input').forEach(input => {
        input.addEventListener('input', e => {
            const id = parseFloat(e.target.getAttribute('data-id'));
            const w = weights.find(w => w.id === id);
            w.position = parseFloat(e.target.value);
            updateSimulation();
        });
    });
    container.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const id = parseFloat(e.target.getAttribute('data-id'));
            removeWeight(id);
        });
    });
}

function updateSimulation() {
    // Update weight positions and calculate torques
    let netTorque = 0;
    weights.forEach(w => {
        const x = w.position * (SCALE_LENGTH / (SCALE_TICKS - 1));
        w.mesh.position.x = x;
        w.hook.position.x = x;
        // Torque = force * distance from center
        netTorque += w.force * w.position;
    });
    // Animate scale
    targetAngle = Math.atan2(netTorque, 200);
}

function animate() {
    animationFrame = requestAnimationFrame(animate);
    // Smooth rotation
    scaleAngle += (targetAngle - scaleAngle) * 0.1;
    scale.rotation.z = scaleAngle;
    // Move weights vertically with scale
    weights.forEach(w => {
        const x = w.position * (SCALE_LENGTH / (SCALE_TICKS - 1));
        const y = 1 + Math.sin(scaleAngle) * x / SCALE_LENGTH * 2;
        w.mesh.position.y = y - 0.7;
        w.hook.position.y = y - 0.1;
    });
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    const width = document.getElementById('simulator-canvas').offsetWidth;
    camera.aspect = width / 400;
    camera.updateProjectionMatrix();
    renderer.setSize(width, 400);
});

window.addEventListener('load', init); 