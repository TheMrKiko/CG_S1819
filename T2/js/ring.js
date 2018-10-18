var scene, renderer;
var cameras = new Array(3);
var activeCamera = 0;

var clock;

const ASPECT_RATIO = 2/1;
const PLANE_HEIGHT = 55;
const WALL_HEIGHT = 10;
const WALL_WIDTH = (ratio) => WALL_HEIGHT * 5 * ratio
const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

class Object3D extends THREE.Object3D {

    constructor() {
        super();
    }

    animate(_) {
    }
}

class Ball extends Object3D {
    constructor(x, y, z) {
        super();

        this.addBall(0, 0, 0);
        this.add(new THREE.AxesHelper(WALL_HEIGHT/2));

        this.position.set(x, y, x);
    }

    addBall(x, y, z) {
        "use strict";

        var ballMaterial = new THREE.MeshBasicMaterial({
            color: eval('0x'+Math.floor(Math.random()*16777215).toString(16)),
            wireframe: true
        });
        var ballGeometry = new THREE.SphereGeometry(WALL_HEIGHT/2, 10, 10);

        var ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);

        ballMesh.position.set(x, y, z);
        this.add(ballMesh);
    }
}

class Ring extends Object3D {
    constructor(x, y, z) {
        super();

        this.addWall(0, 0, WALL_WIDTH(1) / 2, 2, 0);
        this.addWall(WALL_WIDTH(2) / 2, 0, 0, 1, Math.PI/2);
        this.addWall(0, 0, - WALL_WIDTH(1) / 2, 2, Math.PI);
        this.addWall(- WALL_WIDTH(2) / 2, 0, 0, 1, Math.PI*3/2);
        this.add(new THREE.AxesHelper(WALL_HEIGHT));

        this.position.set(x, y, x);
    }

    addWall(x, y, z, widthRatio, rotY) {
        "use strict";

        var wallMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true
        });
        var wallGeometry = new THREE.BoxGeometry(WALL_WIDTH(widthRatio), WALL_HEIGHT, 1);

        var wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);

        wallMesh.position.set(x, y, z);
        wallMesh.rotateY(rotY);
        this.add(wallMesh);
    }
}

function createScene() {
    "use strict";
    
    scene = new THREE.Scene();
    
    scene.add(new THREE.AxesHelper(5));
    scene.add(new Ball(0, 0, 0));
    scene.add(new Ring(0, 0, 0))
}

function createOrtographicCamera(index, x, y, z) {
    "use strict";

    var sizes = calcCameraSize()
    var width = sizes[0]
    var height = sizes[1]

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

function createPerspectiveCamera(index,x,y,z){
    "use strict"
    cameras[index] = new THREE.PerspectiveCamera(90,window.innerWidth/window.innerHeight,1,1000);
    cameras[index].position.set(x,y,z);
    cameras[index].lookAt(0,0,0);

}

function onResize() {
    "use strict";
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    var sizes = calcCameraSize()
    var width = sizes[0]
    var height = sizes[1]

    resizeCameraOrtographic(0, width, height);
    resizeCameraPerspective(1);
    //resizeCamera(2, width, height);
}

function resizeCameraOrtographic(index, width, height) {
    "use strict";
	cameras[index].left = - width / 2;
	cameras[index].right = width / 2;
	cameras[index].top = height / 2;
	cameras[index].bottom = - height / 2;
    cameras[index].updateProjectionMatrix();

}function resizeCameraPerspective(index) {
    'use strict';

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
        case 51: //3
        switchCamera(2);
        break;
        case 65: //A
        case 97: //a
        scene.traverse(function(node) {
            if (node instanceof THREE.Mesh) {
                node.material.wireframe = !node.material.wireframe;
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
    createOrtographicCamera(0, 0, 20, 0);
    createPerspectiveCamera(1,WALL_WIDTH(1),WALL_WIDTH(1),WALL_WIDTH(1));
   // createPerspectiveCamera(2, 0, 8.5, 30);

    render();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

    clock = new THREE.Clock();
}

function animate() {
    "use strict";

    var timeDiff = clock.getDelta();
    scene.traverse(function(node) {
        if (node instanceof Object3D) {
            node.animate(timeDiff);
        }
    })

    render();

    requestAnimationFrame(animate);
}
