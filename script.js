/**
 * 3D 梯形體應用
 * 使用 Three.js 創建和顯示一個可互動的 3D 梯形體
 */

// 全局變數
let scene, camera, renderer;
let cube, wireframe;
let mouseX = 0, mouseY = 0, mouseDown = false;
let rotationX = 0, rotationY = 0, targetRotationX = 0, targetRotationY = 0;

// 初始化函數
function init() {
    initScene();
    createGeometry();
    setupLights();
    setupEventListeners();
    animate();
}

/**
 * 初始化場景、相機和渲染器
 */
function initScene() {
    // 創建場景
    scene = new THREE.Scene();
    
    // 創建相機
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 8);
    camera.lookAt(0, 0, 0);
    
    // 創建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('container').appendChild(renderer.domElement);
}

/**
 * 創建梯形幾何體和材質
 */
function createGeometry() {
    // 創建自定義幾何體
    const geometry = new THREE.BufferGeometry();
    
    const topEdge = 0.6;
    const bottomEdge = 6;
    const boxHeight = 4;
    
    // 定義頂點位置
    const vertices = [
        // 底面 (z = -boxHeight)
        -bottomEdge, -bottomEdge, -boxHeight,  // 0
         bottomEdge, -bottomEdge, -boxHeight,  // 1
         bottomEdge,  bottomEdge, -boxHeight,  // 2
        -bottomEdge,  bottomEdge, -boxHeight,  // 3
        
        // 頂面 (z = boxHeight)
        -topEdge, -topEdge,  boxHeight,  // 4
         topEdge, -topEdge,  boxHeight,  // 5
         topEdge,  topEdge,  boxHeight,  // 6
        -topEdge,  topEdge,  boxHeight,  // 7
    ];
    
    // 定義面的索引
    const indices = [
        // 底面
        0, 2, 1,  0, 3, 2,
        // 頂面
        4, 5, 6,  4, 6, 7,
        // 側面
        0, 1, 5,  0, 5, 4,  // 下面
        1, 2, 6,  1, 6, 5,  // 右面
        2, 3, 7,  2, 7, 6,  // 上面
        3, 0, 4,  3, 4, 7   // 左面
    ];
    
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    // 創建材質
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x00ff88,
        shininess: 100,
        specular: 0x222222
    });
    
    // 創建網格
    cube = new THREE.Mesh(geometry, material);
    cube.castShadow = true;
    cube.receiveShadow = true;
    scene.add(cube);
    
    // 添加邊框
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    wireframe = new THREE.LineSegments(edges, lineMaterial);
    cube.add(wireframe);
}

/**
 * 設置場景燈光
 */
function setupLights() {
    // 環境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    // 方向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    // 點光源
    const pointLight = new THREE.PointLight(0xff6600, 0.5, 100);
    pointLight.position.set(-5, 3, 2);
    scene.add(pointLight);
}

/**
 * 設置事件監聽器
 */
function setupEventListeners() {
    // 滑鼠事件
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mousemove', onMouseMove);
    
    // 滾輪縮放
    document.addEventListener('wheel', onWheel);
    
    // 縮放控制
    const scaleSlider = document.getElementById('scaleSlider');
    const scaleValue = document.getElementById('scaleValue');
    
    scaleSlider.addEventListener('input', (event) => {
        const scale = parseFloat(event.target.value);
        cube.scale.set(scale, scale, scale);
        scaleValue.textContent = scale.toFixed(1);
    });
    
    // 響應式設計
    window.addEventListener('resize', onWindowResize);
}

/**
 * 滑鼠按下事件處理
 */
function onMouseDown(event) {
    mouseDown = true;
    mouseX = event.clientX;
    mouseY = event.clientY;
}

/**
 * 滑鼠釋放事件處理
 */
function onMouseUp() {
    mouseDown = false;
}

/**
 * 滑鼠移動事件處理
 */
function onMouseMove(event) {
    if (mouseDown) {
        const deltaX = event.clientX - mouseX;
        const deltaY = event.clientY - mouseY;
        
        targetRotationY += deltaX * 0.01;
        targetRotationX += deltaY * 0.01;
        
        mouseX = event.clientX;
        mouseY = event.clientY;
    }
}

/**
 * 滾輪事件處理
 */
function onWheel(event) {
    const scale = event.deltaY > 0 ? 1.1 : 0.9;
    camera.position.multiplyScalar(scale);
    camera.position.clampLength(2, 20);
}

/**
 * 窗口大小變化事件處理
 */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * 動畫循環
 */
function animate() {
    requestAnimationFrame(animate);
    
    // 平滑旋轉
    rotationX += (targetRotationX - rotationX) * 0.1;
    rotationY += (targetRotationY - rotationY) * 0.1;
    
    cube.rotation.x = rotationX;
    cube.rotation.y = rotationY;
    
    // 自動旋轉（微妙效果）
    if (!mouseDown) {
        cube.rotation.y += 0.005;
    }
    
    renderer.render(scene, camera);
}

// 初始化應用
init();
