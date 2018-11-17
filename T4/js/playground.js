var scene, renderer, clock;
var cameras = new Array(2);
var activeCamera = 0;
var dir_light;
var point_light;



const ASPECT_RATIO = 2 / 1;
const PLANE_HEIGHT = 55;
const BALL_RADIUS = 5;
const BALL_ROTATION_RADIUS = 20;
const BALL_ACCELERATION = 1;
const BALL_VELOCITY_LIMIT = 2;
const FLOOR_SIZE = 75;
 
const ANGULAR_VELOCITY = Math.PI / 96;

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
    constructor(geometry, materialOpts) {
        var materialsArray = [new THREE.MeshPhongMaterial(materialOpts),new THREE.MeshBasicMaterial(materialOpts)]
        super(geometry, materialsArray[0]);
        this.materialsArray = materialsArray;
        this.hasFlatMaterial = false;
        this.lightMaterial = [materialsArray[0], materialsArray[1]];
        this.flatMaterial = materialsArray[1];
        return this;
    }
}

class Chess extends Object3D {
    constructor(x, y, z) {
        super();
        this.add(new THREE.AxesHelper(BALL_RADIUS));
        this.addChessTable(0, 0, 0);
        this.position.set(x, y, z);
    }

    addChessTable(x, y, z) {
        "use strict";

        var tableTexture = new THREE.TextureLoader().load('./assets/chess_texture.jpg');
        tableTexture.wrapS = tableTexture.wrapT = THREE.RepeatWrapping;
        tableTexture.repeat.set( 2, 2 );

        var tableMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            map: tableTexture
        });

        var tableMaterial = new THREE.MeshPhongMaterial({
            wireframe: true,
            opacity: 1,
            transparent: true,
            map: tableTexture
        });
        var tableGeometry = new THREE.BoxGeometry(FLOOR_SIZE, 2, FLOOR_SIZE, 10, 1, 10);

        tableGeometry.computeFaceNormals();
        tableGeometry.computeVertexNormals();

        var tableMesh = new THREE.Mesh(tableGeometry, tableMaterial);
        tableMesh.position.set(x, y - 0.5, z);
        this.add(tableMesh);
    }
}

class Ball extends Object3D {
    constructor(x, y, z) {
        super();

        this.addBall(0, 0, 0);
        this.add(new THREE.AxesHelper(BALL_RADIUS));
        
        this.angularVelocity = 0;
        this.acceleration = BALL_ACCELERATION;
        this.angle = 0;
        //this.velocity = new THREE.Vector3(0, 0, Math.random() + 10);
        this.position.set(x, y + BALL_RADIUS, z);
    }

    addBall(x, y, z) {
        "use strict";

        var ballTexture = new THREE.TextureLoader().load('./assets/ball_13_texture.jpg');
        ballTexture.wrapS = ballTexture.wrapT = THREE.ClampToEdgeWrapping;
        
        var ballMaterial = new THREE.MeshPhongMaterial({
            wireframe: true,
            opacity: 1,
            transparent: true,
            map: ballTexture,
            shininess: 50,
            specular: 0xffffff

        });
        
        var ballMaterial = new THREE.MeshBasicMaterial({
            //color: eval('0x'+Math.floor(Math.random() * 16777215).toString(16)),
            wireframe: true,
            opacity: 1,
            transparent: true,
            map: ballTexture
        });
        var ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 10, 10);

        ballGeometry.computeFaceNormals();
        ballGeometry.computeVertexNormals();

        var ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
        ballMesh.name = "BallMesh";
        ballMesh.position.set(x, y, z);
        this.add(ballMesh);
    }

   
    animate(timeDiff) {
        "use strict";        

        if (this.acceleration < 0 || this.velocity < BALL_VELOCITY_LIMIT) {
            this.velocity += this.acceleration * timeDiff;

        } if (this.velocity < 0) {
            this.velocity = 0;
        }
        this.angularVelocity = this.velocity;
        var angleDiff = this.angularVelocity * timeDiff;
        this.angle += angleDiff;

        this.rotateY(-1 * angleDiff);
        this.getObjectByName("BallMesh").rotateX(angleDiff * 5 / BALL_RADIUS);

        this.position.x = BALL_ROTATION_RADIUS * Math.cos(this.angle);
        this.position.z = BALL_ROTATION_RADIUS * Math.sin(this.angle);
    }
}

function createDirLight() {
    "use strict";

    dir_light = new THREE.DirectionalLight(0xffffff, 0.7);
    dir_light.position.set(0, 1, 0.5);
    dir_light.lookAt(0, 1, 0.5);
    dir_light.castShadow = true;
   
    dir_light.shadow.camera.near = -60;
    dir_light.shadow.camera.far = 90;
    dir_light.shadow.camera.left= -90;
    dir_light.shadow.camera.right = 90;
    dir_light.shadow.camera.top= 90;
    dir_light.shadow.camera.bottom = -90;

    dir_light.shadow.mapSize.width = 4096;
    dir_light.shadow.mapSize.height = 4096;
 
    scene.add(dir_light);  
}

function createPointLight() {

	point_light = new THREE.PointLight(0xffffff, 30, 120, 2);

	point_light.position.set(0, 1, 0.5);
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
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    var sizes = calcCameraSize()
    var width = sizes[0]
    var height = sizes[1]
    
    if (window.innerHeight > 0 && window.innerWidth > 0) {
        cameras[index].aspect = width / height;
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

function onKeyDown(e) {
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
        case 87: //W
        case 119: //w
        scene.traverse(function(node) {
            if (node instanceof THREE.Mesh) {
                node.material.wireframe = !node.material.wireframe;
            }
        });
        break;
        case 66: //B
        case 98: //b
        scene.traverse(function(node) {
            if (node instanceof Ball) {
                node.acceleration = -node.acceleration;
            }
        });
        break;
        case 76://L
        case 108://l 
        scene.traverse(function(node) {
            if (node instanceof Mesh) {
                if (node.hasFlatMaterial){
                    node.hasFlatMaterial = false;
                    node.material = node.lightMaterial;
                } else {
                    node.hasFlatMaterial = true;
                    node.material = node.flatMaterial;
                }
            }
        });          
        break;
        case 69: //E
        case 101: //e
        scene.traverse(function(node) {
            if (node instanceof THREE.AxesHelper) {
                node.visible = !node.visible;
            }
        });
        break;
    }
}

function createScene() {
    "use strict";

    scene = new THREE.Scene();

    scene.add(new THREE.AxesHelper(5));

    scene.add(new Chess(0, 0, 0));
    scene.add(new Ball(0, 0, 0));
}

function createLights(){
    createDirLight();
    createPointLight();
}

function render() {
    "use strict";
    
    renderer.render(scene, cameras[activeCamera]);
}

function init() {
    "use strict";
    
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    createScene();
    createPerspectiveCamera(0, 0, 20, 30);
    createOrtographicCamera(1, 0, 20, 0);
    createLights();
    render();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

    clock = new THREE.Clock();

    var controls = new THREE.OrbitControls(cameras[activeCamera], renderer.domElement);
}

function animate() {
    "use strict";

    var timeDiff = clock.getDelta();

    scene.traverse(function(node) {
        if (node instanceof Ball) {
            node.animate(timeDiff);
        }
    })

    render();

    requestAnimationFrame(animate);
}
