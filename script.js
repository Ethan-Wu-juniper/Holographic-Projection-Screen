// 場景、相機、渲染器
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('container').appendChild(renderer.domElement);

// 創建梯形幾何體
const shape = new THREE.Shape();

// 使用 ExtrudeGeometry 創建梯形
const extrudeSettings = {
    depth: 2,
    bevelEnabled: false
};

// 創建梯形底面形狀
shape.moveTo(-1, -1);
shape.lineTo(1, -1);
shape.lineTo(0.6, 1);
shape.lineTo(-0.6, 1);
shape.lineTo(-1, -1);

// 但這樣會有問題，讓我們用更簡單的方法
// 創建一個自定義的幾何體
const geometry = new THREE.BufferGeometry();

const topEdge = 0.6;
const bottomEdge = 6;
const boxHeight = 4;

// 定義頂點位置
const vertices = [
    // 底面 (z = -2) - 高度增加一倍
    -bottomEdge, -bottomEdge, -boxHeight,  // 0
     bottomEdge, -bottomEdge, -boxHeight,  // 1
     bottomEdge,  bottomEdge, -boxHeight,  // 2
    -bottomEdge,  bottomEdge, -boxHeight,  // 3
    
    // 頂面 (z = 2) - 高度增加一倍，頂部邊長減到四分之一
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

const material = new THREE.MeshPhongMaterial({ 
    color: 0x00ff88,
    shininess: 100,
    specular: 0x222222
});

const cube = new THREE.Mesh(geometry, material);
cube.castShadow = true;
cube.receiveShadow = true;
scene.add(cube);

// 添加邊框
const edges = new THREE.EdgesGeometry(geometry);
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
const wireframe = new THREE.LineSegments(edges, lineMaterial);
cube.add(wireframe);

// 添加燈光
const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0xff6600, 0.5, 100);
pointLight.position.set(-5, 3, 2);
scene.add(pointLight);

// 設置相機位置 - 頂部面對人
camera.position.set(0, 0, 8);
camera.lookAt(0, 0, 0);

// 滑鼠控制變數
let mouseX = 0;
let mouseY = 0;
let mouseDown = false;
let rotationX = 0;
let rotationY = 0;
let targetRotationX = 0;
let targetRotationY = 0;

// 滑鼠事件
document.addEventListener('mousedown', (event) => {
    mouseDown = true;
    mouseX = event.clientX;
    mouseY = event.clientY;
});

document.addEventListener('mouseup', () => {
    mouseDown = false;
});

document.addEventListener('mousemove', (event) => {
    if (mouseDown) {
        const deltaX = event.clientX - mouseX;
        const deltaY = event.clientY - mouseY;
        
        targetRotationY += deltaX * 0.01;
        targetRotationX += deltaY * 0.01;
        
        mouseX = event.clientX;
        mouseY = event.clientY;
    }
});

// 滾輪縮放
document.addEventListener('wheel', (event) => {
    const scale = event.deltaY > 0 ? 1.1 : 0.9;
    camera.position.multiplyScalar(scale);
    camera.position.clampLength(2, 20);
});

// 縮放控制
const scaleSlider = document.getElementById('scaleSlider');
const scaleValue = document.getElementById('scaleValue');

scaleSlider.addEventListener('input', (event) => {
    const scale = parseFloat(event.target.value);
    cube.scale.set(scale, scale, scale);
    scaleValue.textContent = scale.toFixed(1);
});

// 響應式設計
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 渲染循環
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
    
    // 移除浮動動畫
    // cube.position.y = Math.sin(Date.now() * 0.001) * 0.3;
    
    renderer.render(scene, camera);
}

// 開始動畫
animate();
