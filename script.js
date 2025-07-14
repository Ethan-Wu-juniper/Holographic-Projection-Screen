/**
 * 3D 梯形體應用 + MediaPipe 人臉偵測
 * 使用 Three.js 創建和顯示一個可互動的 3D 梯形體
 * 使用 MediaPipe 進行人臉偵測並顯示眼睛座標
 */

// 全局變數 - Three.js
let scene, camera, renderer;
let cube, wireframe;
let rotationX = 0, rotationY = 0, targetRotationX = 0, targetRotationY = 0;

// 全局變數 - MediaPipe 人臉偵測
let faceMesh;
let camera_utils;
let videoElement;
let canvasElement;
let canvasCtx;
let leftEyeCoords = { x: 0, y: 0, z: 0 };
let rightEyeCoords = { x: 0, y: 0, z: 0 };
let eyeCoords = {x : 0, y : 0, z : 0}

// 初始化函數
function init() {
    // 初始化 Three.js
    initScene();
    createGeometry();
    setupLights();
    setupEventListeners();
    
    // 設置初始縮放比例為 2
    if (cube) {
        cube.scale.set(2, 2, 2);
    }
    
    // 初始化 MediaPipe 人臉偵測
    initFaceDetection();
    
    // 開始動畫循環
    animate();
}

/**
 * 初始化 MediaPipe 人臉偵測
 */
function initFaceDetection() {
    videoElement = document.createElement('video');
    videoElement.style.display = 'none'; // 隱藏視頻元素
    document.body.appendChild(videoElement);
    faceMesh = new FaceMesh({
        locateFile: (file) => {
            console.log(`加載 FaceMesh 文件: ${file}`);
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
    });
    
    faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    
    faceMesh.onResults(onFaceDetectionResults);

    navigator.mediaDevices.getUserMedia({ video: true })
    .then(() => {
        camera_utils = new Camera(videoElement, {
            onFrame: () => faceMesh.send({image: videoElement}),
            width: 640,
            height: 480
        });
        camera_utils.start();
    });
}

/**
 * 處理人臉偵測結果
 */
function onFaceDetectionResults(results) {
    if (results.multiFaceLandmarks) {
        for (const landmarks of results.multiFaceLandmarks) {
            const leftEyeIndex = 468;
            const rightEyeIndex = 473;
            
            leftEyeCoords = {
                x: (1 - landmarks[leftEyeIndex].x) - 0.5,
                y: landmarks[leftEyeIndex].y - 0.5,
            };
            
            rightEyeCoords = {
                x: (1 - landmarks[rightEyeIndex].x) - 0.5,
                y: landmarks[rightEyeIndex].y - 0.5,
            };

            eyeCoords = {
                x: (leftEyeCoords.x + rightEyeCoords.x) / 2,
                y: (leftEyeCoords.y + rightEyeCoords.y) / 2 
            }
            
            // 更新眼睛座標顯示
            updateEyeCoordinatesDisplay();
        }
    }
}

/**
 * 更新眼睛座標顯示
 */
function updateEyeCoordinatesDisplay() {
    const eyeElement = document.getElementById('eye-coords');
    eyeElement.textContent = `X: ${eyeCoords.x.toFixed(2)}, Y: ${eyeCoords.y.toFixed(2)}`;
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
    // 定義梯形的尺寸
    const topEdge = 0.6;
    const bottomEdge = 6;
    const boxHeight = 4;
    
    // 創建紋理加載器
    const textureLoader = new THREE.TextureLoader();
    
    // 加載六個不同的紋理
    const textures = [
        textureLoader.load('https://picsum.photos/id/1015/512/512'), // 底面
        textureLoader.load('./images/top_wall.png'), // 頂面
        textureLoader.load('./images/floor.png'), // 下面
        textureLoader.load('./images/right_wall.png'), // 右面
        textureLoader.load('./images/cieling.png'), // 上面
        textureLoader.load('./images/left_wall.png')  // 左面
    ];
    
    // 設置紋理屬性，防止拉伸
    textures.forEach(texture => {
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
    });
    
    // 創建分組
    const cubeGroup = new THREE.Group();
    
    // 創建六個面的材質
    const materials = textures.map(texture => {
        return new THREE.MeshPhongMaterial({
            map: texture,
        });
    });
    
    // 定義頂點位置
    const vertices = [
        // 底面 (z = -boxHeight/2)
        -bottomEdge/2, -bottomEdge/2, -boxHeight/2,  // 0
         bottomEdge/2, -bottomEdge/2, -boxHeight/2,  // 1
         bottomEdge/2,  bottomEdge/2, -boxHeight/2,  // 2
        -bottomEdge/2,  bottomEdge/2, -boxHeight/2,  // 3
        
        // 頂面 (z = boxHeight/2)
        -topEdge/2, -topEdge/2,  boxHeight/2,  // 4
         topEdge/2, -topEdge/2,  boxHeight/2,  // 5
         topEdge/2,  topEdge/2,  boxHeight/2,  // 6
        -topEdge/2,  topEdge/2,  boxHeight/2,  // 7
    ];
    
    // 創建底面
    const bottomGeometry = createFace(
        vertices[0*3], vertices[0*3+1], vertices[0*3+2],
        vertices[1*3], vertices[1*3+1], vertices[1*3+2],
        vertices[2*3], vertices[2*3+1], vertices[2*3+2],
        vertices[3*3], vertices[3*3+1], vertices[3*3+2]
    );
    
    // 創建頂面
    const topGeometry = createFace(
        vertices[4*3], vertices[4*3+1], vertices[4*3+2],
        vertices[5*3], vertices[5*3+1], vertices[5*3+2],
        vertices[6*3], vertices[6*3+1], vertices[6*3+2],
        vertices[7*3], vertices[7*3+1], vertices[7*3+2]
    );
    
    // 創建四個側面
    // 下側面
    const sideGeometry1 = createFace(
        vertices[0*3], vertices[0*3+1], vertices[0*3+2],
        vertices[1*3], vertices[1*3+1], vertices[1*3+2],
        vertices[5*3], vertices[5*3+1], vertices[5*3+2],
        vertices[4*3], vertices[4*3+1], vertices[4*3+2]
    );
    
    // 右側面
    const sideGeometry2 = createFace(
        vertices[1*3], vertices[1*3+1], vertices[1*3+2],
        vertices[2*3], vertices[2*3+1], vertices[2*3+2],
        vertices[6*3], vertices[6*3+1], vertices[6*3+2],
        vertices[5*3], vertices[5*3+1], vertices[5*3+2],
        270
    );
    
    // 上側面
    const sideGeometry3 = createFace(
        vertices[2*3], vertices[2*3+1], vertices[2*3+2],
        vertices[3*3], vertices[3*3+1], vertices[3*3+2],
        vertices[7*3], vertices[7*3+1], vertices[7*3+2],
        vertices[6*3], vertices[6*3+1], vertices[6*3+2]
    );
    
    // 左側面
    const sideGeometry4 = createFace(
        vertices[3*3], vertices[3*3+1], vertices[3*3+2],
        vertices[0*3], vertices[0*3+1], vertices[0*3+2],
        vertices[4*3], vertices[4*3+1], vertices[4*3+2],
        vertices[7*3], vertices[7*3+1], vertices[7*3+2],
        90
    );
    
    // 創建網格並添加到分組
    const bottomMesh = new THREE.Mesh(bottomGeometry, materials[0]);
    const topMesh = new THREE.Mesh(topGeometry, materials[1]);
    const sideMesh1 = new THREE.Mesh(sideGeometry1, materials[2]);
    const sideMesh2 = new THREE.Mesh(sideGeometry2, materials[3]);
    const sideMesh3 = new THREE.Mesh(sideGeometry3, materials[4]);
    const sideMesh4 = new THREE.Mesh(sideGeometry4, materials[5]);
    
    // 設置陰影
    [bottomMesh, topMesh, sideMesh1, sideMesh2, sideMesh3, sideMesh4].forEach(mesh => {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        cubeGroup.add(mesh);
    });
    
    // 添加分組到場景
    scene.add(cubeGroup);
    
    // 保存引用以便動畫
    cube = cubeGroup;
    
    // 創建完整的幾何體用於邊框
    const fullGeometry = new THREE.BufferGeometry();
    
    // 定義面的索引
    const indices = [
        // 底面
        0, 1, 2,  0, 2, 3,
        // 頂面
        4, 5, 6,  4, 6, 7,
        // 側面
        0, 1, 5,  0, 5, 4,  // 下面
        1, 2, 6,  1, 6, 5,  // 右面
        2, 3, 7,  2, 7, 6,  // 上面
        3, 0, 4,  3, 4, 7   // 左面
    ];
    
    fullGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    fullGeometry.setIndex(indices);
    
    // 添加邊框
    const edges = new THREE.EdgesGeometry(fullGeometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    wireframe = new THREE.LineSegments(edges, lineMaterial);
    cube.add(wireframe);
}

/**
 * 創建四邊形面的幾何體
 */
function createFace(x1, y1, z1, x2, y2, z2, x3, y3, z3, x4, y4, z4, rotation) {
    const geometry = new THREE.BufferGeometry();
    
    // 定義頂點位置
    const vertices = [
        x1, y1, z1,
        x2, y2, z2,
        x3, y3, z3,
        
        x1, y1, z1,
        x3, y3, z3,
        x4, y4, z4
    ];
    
    // 定義 UV 坐標 - 確保紋理正確映射
    let uvs;
    switch(rotation) {
        case 90:
            uvs = [0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1]; // 順時針90度
            break;
        case 180:
            uvs = [1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]; // 180度
            break;
        case 270:
            uvs = [1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0]; // 順時針270度
            break;
        default:
            uvs = [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]; // 原始
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
    geometry.computeVertexNormals();
    
    return geometry;
}


function setupLights() {
    // 環境光 - 提供基礎亮度
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8); // 增強環境光
    scene.add(ambientLight);
    
    // 主光源 - 從正面
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.01);
    mainLight.position.set(0, 0, 10);
    mainLight.castShadow = true;
    scene.add(mainLight);
    
    // 左側補光
    const leftLight = new THREE.DirectionalLight(0xffffff, 0.5);
    leftLight.position.set(-10, 0, 5);
    scene.add(leftLight);
    
    // 右側補光
    const rightLight = new THREE.DirectionalLight(0xffffff, 0.5);
    rightLight.position.set(10, 0, 5);
    scene.add(rightLight);
    
    // 底部補光
    const bottomLight = new THREE.DirectionalLight(0xffffff, 0.3);
    bottomLight.position.set(0, -10, 5);
    scene.add(bottomLight);
    
    // 頂部補光
    const topLight = new THREE.DirectionalLight(0xffffff, 0.4);
    topLight.position.set(0, 10, 5);
    scene.add(topLight);
}

/**
 * 設置事件監聽器
 */
function setupEventListeners() {
    // 滾輪縮放
    document.addEventListener('wheel', onWheel);
    
    // 縮放控制
    const scaleSlider = document.getElementById('scaleSlider');
    const scaleValue = document.getElementById('scaleValue');
    
    // 確保初始值顯示正確
    scaleValue.textContent = parseFloat(scaleSlider.value).toFixed(1);
    
    scaleSlider.addEventListener('input', (event) => {
        const scale = parseFloat(event.target.value);
        cube.scale.set(scale, scale, scale);
        scaleValue.textContent = scale.toFixed(1);
    });
    
    // 響應式設計
    window.addEventListener('resize', onWindowResize);
}

/**
 * 滾輪事件處理
 */
function onWheel(event) {
    const scale = event.deltaY > 0 ? 1.02 : 0.98;
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

    cube.rotation.x = -eyeCoords.y;
    cube.rotation.y = -(eyeCoords.x / 2);
    
    renderer.render(scene, camera);
}

// 初始化應用
init();
