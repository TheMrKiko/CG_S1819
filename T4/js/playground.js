var scene, renderer, clock;
var cameras = new Array(2);
var activeCamera = 0;

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

        /*var tableMaterial = new THREE.MeshPhongMaterial({
            wireframe: true,
            opacity: 1,
            transparent: true,
            map: ballTexture
        });*/
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
        
        /*var ballMaterial = new THREE.MeshPhongMaterial({
            wireframe: true,
            opacity: 1,
            transparent: true,
            map: ballTexture,
            shininess: 50,
            specular: 0xffffff

        });*/
        
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
        case 65: //A
        case 97: //a
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
