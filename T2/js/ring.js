var scene, renderer;
var cameras = new Array(3);
var activeCamera = 0;

var clock;

const ASPECT_RATIO = 16/10;
const PLANE_HEIGHT = 25;
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

class Table extends Object3D {
    constructor(x, y, z) {
        super();

        this.addTableTop(0, 0, 0);
        //this.add(new THREE.AxesHelper(3));

        this.position.set(x, y, x);
    }

    addTableTop(x, y, z) {
        "use strict";

        var tableTopMaterial = new THREE.MeshBasicMaterial({
            color: 0x4d2600,
            wireframe: true
        });
        var tableTopGeometry = new THREE.CubeGeometry(18, 1, 12);

        var tableTopMesh = new THREE.Mesh(tableTopGeometry, tableTopMaterial);

        tableTopMesh.position.set(x, y, z);
        this.add(tableTopMesh);
    }
}

function createScene() {
    "use strict";
    
    scene = new THREE.Scene();
    
    scene.add(new THREE.AxesHelper(5));
    scene.add(new Table(0, 8.5, 0));
}

function createCamera(index, x, y, z) {
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
    
    cameras[index].lookAt(new THREE.Vector3(0, 8.5, 0));
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

function onResize() {
    "use strict";
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    var sizes = calcCameraSize()
    var width = sizes[0]
    var height = sizes[1]

    resizeCamera(0, width, height);
    resizeCamera(1, width, height);
    resizeCamera(2, width, height);
}

function resizeCamera(index, width, height) {
    "use strict";
	cameras[index].left = - width / 2;
	cameras[index].right = width / 2;
	cameras[index].top = height / 2;
	cameras[index].bottom = - height / 2;
    cameras[index].updateProjectionMatrix();
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
    createCamera(0, 0, 20, 0);
    createCamera(1, 30, 8.5, 0);
    createCamera(2, 0, 8.5, 30);

    render();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

    clock = new THREE.Clock();
}

function animate() {
    "use strict";

    var timeDiff = clock.getDelta();
    scene.traverse(function(node) {
        if(node instanceof Object3D) {
            node.animate(timeDiff);
        }
    })

    render();

    requestAnimationFrame(animate);
}
