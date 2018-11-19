var gameScene, pauseScene, renderer, clock;
var cameras = new Array(2);
var activeCamera = 0;
var dir_light, point_light;
var isPaused = false;

const ASPECT_RATIO = 2 / 1;
const PLANE_HEIGHT = 55;
const BALL_RADIUS = 5;
const BALL_ROTATION_RADIUS = 20;
const BALL_ACCELERATION = 1;
const BALL_VELOCITY_LIMIT = Math.PI;
const CUBE_SIDE = 10;
const FLOOR_SIZE = 75;

const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

class Object3D extends THREE.Object3D {

    constructor() {
        super();
        this.velocity = 0;
        this.acceleration = 0;
    }

    animate(_) {
    }

}

class Mesh extends THREE.Mesh {
    constructor(geometry, phongMaterialOpts, basicMaterialOpts) {
        var phongMaterial, basicMaterial, materialsArray;
        if (Array.isArray(phongMaterialOpts) && Array.isArray(basicMaterialOpts)) {
            phongMaterial = phongMaterialOpts.map((ops) => new THREE.MeshPhongMaterial(ops));
            basicMaterial = basicMaterialOpts.map((ops) => new THREE.MeshBasicMaterial(ops));
        } else {
            phongMaterial = new THREE.MeshPhongMaterial(phongMaterialOpts);
            basicMaterial = new THREE.MeshBasicMaterial(basicMaterialOpts);
        }
        var materialsArray = [phongMaterial, basicMaterial];

        super(geometry, materialsArray[0]);
        this.materialsArray = materialsArray;
        this.materialIndex = 0;
        return this;
    }
}

class PauseWarning extends Object3D {
    constructor(x, y, z) {
        super();
        this.addPause(0, 0, 0);
        this.position.set(x, y - 1, z);
    }

    addPause(x, y, z) {
        "use strict";

        var tableTexture = new THREE.TextureLoader().load('./assets/pause.png');
        tableTexture.wrapS = tableTexture.wrapT = THREE.RepeatWrapping;
        tableTexture.repeat.set(1,1);

        var tableGeometry = new THREE.BoxGeometry(PLANE_HEIGHT * 2, 2, PLANE_HEIGHT, 10, 1, 10);

        tableGeometry.computeFaceNormals();
        tableGeometry.computeVertexNormals();

        var tableMesh = new THREE.Mesh(tableGeometry, new THREE.MeshBasicMaterial({
                color: 0xffffff,
                wireframe: false,
                map: tableTexture
            })
        );
        tableMesh.position.set(x, y, z);
        this.add(tableMesh);
    }
}

class Chess extends Object3D {
    constructor(x, y, z) {
        super();
        this.add(new THREE.AxesHelper(BALL_RADIUS));
        this.addChessTable(0, 0, 0);
        this.position.set(x, y - 1, z);
    }
    
    addChessTable(x, y, z) {
        "use strict";
        
        var tableTexture = new THREE.TextureLoader().load('./assets/chess_texture.jpg');
        tableTexture.wrapS = tableTexture.wrapT = THREE.RepeatWrapping;
        tableTexture.repeat.set(2, 2);
        
        var tableGeometry = new THREE.BoxGeometry(FLOOR_SIZE, 2, FLOOR_SIZE, 10, 1, 10);
        
        tableGeometry.computeFaceNormals();
        tableGeometry.computeVertexNormals();
        
        var tableMesh = new Mesh(tableGeometry,
            {
                wireframe: false,
                shininess: 10,
                map: tableTexture
            },
            {
                color: 0xffffff,
                wireframe: false,
                map: tableTexture
            }
            );
        tableMesh.receiveShadow = true;
        tableMesh.position.set(x, y, z);
        this.add(tableMesh);
    }
}
    
    class Ball extends Object3D {
        constructor(x, y, z) {
            super();
            
        this.addBall(0, 0, 0);
        this.add(new THREE.AxesHelper(BALL_RADIUS));
        
        this.acceleration = BALL_ACCELERATION;
        this.angle = 0;
        this.velocity = 0;
        this.position.set(x, y + BALL_RADIUS, z);
    }

    addBall(x, y, z) {
        "use strict";

        var ballTexture = new THREE.TextureLoader().load('./assets/ball_13_texture.jpg');
        ballTexture.wrapS = ballTexture.wrapT = THREE.ClampToEdgeWrapping;
        
        var ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 10, 10);

        ballGeometry.computeFaceNormals();
        ballGeometry.computeVertexNormals();

        var ballMesh = new Mesh(ballGeometry,
            {
                wireframe: false,
                map: ballTexture,
                shininess: 80,
                specular: 0xeaeaea,
                color: 0xb7b7b7
            },
            {
                wireframe: false,
                map: ballTexture
            }
        );
        ballMesh.name = "BallMesh";
        ballMesh.position.set(x, y, z);
        this.add(ballMesh);
    }
   
    animate(timeDiff) {
        "use strict";        

        this.velocity += this.acceleration * timeDiff;

        if (this.velocity > BALL_VELOCITY_LIMIT) {
            this.velocity = BALL_VELOCITY_LIMIT;
        } else if (this.velocity < 0) {
            this.velocity = 0;
        }

        var angleDiff = this.velocity * timeDiff;
        this.angle += angleDiff;
        this.angle %= 2 * Math.PI;

        this.rotateY(-1 * angleDiff);
        this.getObjectByName("BallMesh").rotateX(angleDiff * 5 / BALL_RADIUS);

        this.position.x = BALL_ROTATION_RADIUS * Math.cos(this.angle);
        this.position.z = BALL_ROTATION_RADIUS * Math.sin(this.angle);
    }
}

class Cube extends Object3D {
    constructor(x, y, z) {
        super();

        this.addCube(0, 0, 0);
        this.add(new THREE.AxesHelper(CUBE_SIDE));
        
        this.position.set(x, y + CUBE_SIDE / 2, z);
    }
    
    addCube(x, y, z) {
        "use strict";
        
        var cubeGeometry = new THREE.BoxGeometry(CUBE_SIDE, CUBE_SIDE, CUBE_SIDE, 3, 3, 3);
    
        cubeGeometry.computeFaceNormals();
        cubeGeometry.computeVertexNormals();

        var cubeLoader = new THREE.TextureLoader();
        var cubeTextures = [
            cubeLoader.load('./assets/cube_1.png'),
            cubeLoader.load('./assets/cube_2.png'),
            cubeLoader.load('./assets/cube_3.png'),
            cubeLoader.load('./assets/cube_4.png'),
            cubeLoader.load('./assets/cube_5.png'),
            cubeLoader.load('./assets/cube_6.png')];
        
        var cubeBumpMap = cubeLoader.load('./assets/cube_bump.png');
        var cubePhongMaterials = cubeTextures.map(
            function(texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(1, 1);
                return {
                    wireframe: false,
                    map: texture,
                    bumpMap: cubeBumpMap,
                    bumpScale: 0.5,
                    shininess: 10, 
                    specular: 0xffffff,
                    color: 0xffffff
                }
            }
        )

        var cubeBasicMaterials = cubeTextures.map(
            function(texture) {
                return {
                    wireframe: false,
                    map: texture
                }
            }
        )

        var cubeMesh = new Mesh(cubeGeometry, cubePhongMaterials, cubeBasicMaterials);
        cubeMesh.position.set(x, y, z);
        this.add(cubeMesh);
    }
}

function createDirLight(scene) {
    "use strict";

    dir_light = new THREE.DirectionalLight(0x3f9cff, 0.9);
    dir_light.position.set(5, 20, 10);
    dir_light.castShadow = true;
   
    dir_light.shadow.camera.near = -60;
    dir_light.shadow.camera.far = 90;
    dir_light.shadow.camera.left = -90;
    dir_light.shadow.camera.right = 90;
    dir_light.shadow.camera.top = 90;
    dir_light.shadow.camera.bottom = -90;

    dir_light.shadow.mapSize.width = 4096;
    dir_light.shadow.mapSize.height = 4096;
 
    scene.add(dir_light);  
}

function createPointLight(scene) {

	point_light = new THREE.PointLight(0xff653f, 2, 60, 2);

	point_light.position.set(10, 20, 0);
	point_light.castShadow = true;
    scene.add(point_light);
}

function createOrtographicCamera(index, x, y, z) {
    "use strict";
    
    var sizes = calcCameraSize();
    var width = sizes[0];
    var height = sizes[1];
    
    cameras[index] = new THREE.OrthographicCamera(
        - width / 2,
        width / 2,
        height / 2,
        - height / 2,
        -1000,
        1000
    );
    cameras[index].position.set(x, y, z)
    
    cameras[index].lookAt(new THREE.Vector3(0, 0, 0));
}

function calcCameraSize() {
    "use strict";
    
    var scale = window.innerWidth / window.innerHeight;
    
    if (scale > ASPECT_RATIO) { // largura maior
        
        var width = scale * PLANE_HEIGHT;
        var height = PLANE_HEIGHT;
    } else {
        
        var width = ASPECT_RATIO * PLANE_HEIGHT;
        var height = width / scale;
    }
    
    return [width, height]
}

function createPerspectiveCamera(index, x, y, z){
    "use strict";
    
    cameras[index] = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, 1000);
    cameras[index].position.set(x,y,z);
    cameras[index].lookAt(0, 0, 0);
    
}

function onResize() {
    "use strict";
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    var sizes = calcCameraSize();
    var width = sizes[0];
    var height = sizes[1];
    
    resizeCameraPerspective(0);
    resizeCameraOrtographic(1, width, height);
}

function resizeCameraOrtographic(index, width, height) {
    "use strict";
    
	cameras[index].left = - width / 2;
	cameras[index].right = width / 2;
	cameras[index].top = height / 2;
	cameras[index].bottom = - height / 2;
    cameras[index].updateProjectionMatrix();
    
}

function resizeCameraPerspective(index) {
    "use strict";
        
    if (window.innerHeight > 0 && window.innerWidth > 0) {
        cameras[index].aspect = window.innerWidth / window.innerHeight;
        cameras[index].updateProjectionMatrix();
    }
    
}

function dir_light_switcher() {
	dir_light.visible = !dir_light.visible;
}

function point_light_switcher() {
	point_light.visible = !point_light.visible;
}

function switchCamera(index) {
    "use strict";
    
    activeCamera = index;
}

function onKeyDownGame(e) {
    "use strict";
    
    switch (e.keyCode) {
        case 49: //1
        switchCamera(0);
        break;
        case 50: //2
        switchCamera(1);
        break;
        case 68://D
        case 100://d 
        dir_light_switcher();
        break;
        case 80://P
        case 112://p 
        point_light_switcher();
        break;
        case 83://S
        case 115://S 
        isPaused = !isPaused;
        break;
        case 87: //W
        case 119: //w
        gameScene.traverse(function(node) {
            if (node instanceof Mesh) {
                node.materialsArray.forEach(function(material) {
                    if (Array.isArray(material)) {
                        material.forEach(function(face) {
                            face.wireframe = !face.wireframe;
                        })
                    } else {
                        material.wireframe = !material.wireframe;
                    }
                })
            }
        });
        break;
        case 66: //B
        case 98: //b
        gameScene.traverse(function(node) {
            if (node instanceof Ball) {
                node.acceleration = -node.acceleration;
            }
        });
        break;
        case 76://L
        case 108://l 
        gameScene.traverse(function(node) {
            if (node instanceof Mesh) {
                node.materialIndex = Math.abs(node.materialIndex - 1);
                node.material = node.materialsArray[node.materialIndex];
            }
        });          
        break;
        case 69: //E
        case 101: //e
        gameScene.traverse(function(node) {
            if (node instanceof THREE.AxesHelper) {
                node.visible = !node.visible;
            }
        });
        break;
    }
}

function onKeyDownPause(e) {
    "use strict";
    switch (e.keyCode) {
        case 83://S
        case 115://S 
        isPaused = !isPaused;
        break;
        case 82://R
        case 114://R
        gameScene = createScene();
        isPaused = !isPaused;
        break;
    }
}

function createScene() {
    "use strict";
    
    var gameScenee = new THREE.Scene();
    
    gameScenee.add(new THREE.AxesHelper(5));
    
    gameScenee.add(new Chess(0, 0, 0));
    gameScenee.add(new Ball(0, 0, 0));
    gameScenee.add(new Cube(0, 0, 0));
    
    createLights(gameScenee);
    return gameScenee;
}

function createPauseScene() {
    "use strict";

    var pauseScenee = new THREE.Scene();

    pauseScenee.add(new PauseWarning(0, 0, 0));

    return pauseScenee;
}

function createLights(scene){
    createDirLight(scene);
    createPointLight(scene);
}

function render() {
    "use strict";

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    
    if (!isPaused) {
        renderer.render(gameScene, cameras[activeCamera]);
        window.removeEventListener("keydown", onKeyDownPause);
        window.addEventListener("keydown", onKeyDownGame);
        
    } else {
        renderer.render(pauseScene, cameras[1]);
        window.removeEventListener("keydown", onKeyDownGame);
        window.addEventListener("keydown", onKeyDownPause);
    }
}

function init() {
    "use strict";
    
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    gameScene = createScene();
    pauseScene = createPauseScene();
    createPerspectiveCamera(0, 0, 20, 30);
    createOrtographicCamera(1, 0, 20, 0);
    render();

    window.addEventListener("resize", onResize);

    clock = new THREE.Clock();

    var controls = new THREE.OrbitControls(cameras[0], renderer.domElement);
}

function animate() {
    "use strict";

    var timeDiff = clock.getDelta();

    gameScene.traverse(function(node) {
        if (node instanceof Ball) {
            if (isPaused) timeDiff = 0;
            node.animate(timeDiff);
        }
    })

    render();

    requestAnimationFrame(animate);
}
