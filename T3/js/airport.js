var scene, renderer, clock;
var cameras = new Array(3);
var activeCamera = 0;

const ANGULAR_VELOCITY = Math.PI/2;
const ASPECT_RATIO = 16/9;
const PLANE_HEIGHT = [50, 25, 25];
const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

const DISTANCE_LAMPS = 20;
const LAMP_BASE_RADIUS = 2.5;
const LAMP_HEIGHT = 14;

class Object3D extends THREE.Object3D {

    constructor() {
        super();

        this.angularVelocity = 0;
        this.angle = 0;
    }

    animate(_) {
    }
}
class Floor extends Object3D {
    constructor(x, y, z) {
        super();

        this.addFloor(0, 0, 0);

        this.position.set(x,y,z);

    }

    addFloor(x,y,z) {
        "use strict";
    
        var floorMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true
        });
        var floorGeometry = new THREE.BoxGeometry(2 + (DISTANCE_LAMPS + LAMP_BASE_RADIUS) * 2, 0.5, 2 + (DISTANCE_LAMPS + LAMP_BASE_RADIUS) * 2, 10, 1, 10);

        var floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);

        floorMesh.position.set(x, y - 0.25, z);
        this.add(floorMesh);
    }
}
class Lamp extends Object3D {
    constructor(x, y, z) {
        super();

        this.addBase(0, 0, 0);
        this.addTube(0, 0.5, 0)
        //this.addReflector(0, 13, 0);
        this.addHolder(0, 14.5, 0);
        this.addLamp(0, 15 ,0);
        //this.add(new THREE.AxesHelper(3));

        this.position.set(x, y, z);
    }

    addBase(x, y, z) {
        "use strict";

        var baseMaterial = new THREE.MeshBasicMaterial({
            color: 0x663300,
            wireframe: true
        });
        var baseGeometry = new THREE.CylinderGeometry(LAMP_BASE_RADIUS, LAMP_BASE_RADIUS, 0.5, 20);

        var baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);

        baseMesh.position.set(x, y + 0.25, z);
        this.add(baseMesh);
    }

    addTube(x, y, z) {
        "use strict";

        var tubeMaterial = new THREE.MeshBasicMaterial({
            color: 0x663300,
            wireframe: true
        });
        var tubeGeometry = new THREE.CylinderGeometry(0.5, 0.5, LAMP_HEIGHT, 15);

        var tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);

        tubeMesh.position.set(x, y + 7, z);
        this.add(tubeMesh);
    }

    addReflector(x, y, z) {
        "use strict";

        var refletorMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff1a,
            wireframe: true,
			opacity: 0.3,
			transparent: true
        });
        var refletorGeometry = new THREE.CylinderGeometry(1, 3, 5, 15, 1, true, 0, Math.PI * 2);

        var refletorMesh = new THREE.Mesh(refletorGeometry, refletorMaterial);

        refletorMesh.position.set(x, y + 2.5, z);
        this.add(refletorMesh);
    }

    addHolder(x, y, z) {
        "use strict";

        var holderMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff1a,
            wireframe: true
        });
        var holderGeometry = new THREE.CylinderGeometry(0.7, 0.1, 0.5, 15);

        var holderMesh = new THREE.Mesh(holderGeometry, holderMaterial);

        holderMesh.position.set(x, y + 0.25, z);
        this.add(holderMesh);
    }

    addLamp(x, y, z) {
        "use strict";

        var lampMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff1a,
            wireframe: true
        });
        var lampGeometry = new THREE.SphereGeometry(0.7, 8, 6, 0, Math.PI * 2, 0, Math.PI/2);

        var lampMesh = new THREE.Mesh(lampGeometry, lampMaterial);

        lampMesh.position.set(x, y, z);
        this.add(lampMesh);
    }
}

function createScene() {
    "use strict";
    
    scene = new THREE.Scene();
    
    scene.add(new THREE.AxesHelper(5));
    scene.add(new Lamp(DISTANCE_LAMPS, 0, DISTANCE_LAMPS))
    scene.add(new Lamp(-DISTANCE_LAMPS, 0, DISTANCE_LAMPS))
    scene.add(new Lamp(DISTANCE_LAMPS, 0, -DISTANCE_LAMPS))
    scene.add(new Lamp(-DISTANCE_LAMPS, 0, -DISTANCE_LAMPS))
    scene.add(new Floor(0, 0, 0));
}

function createCamera(index, x, y, z) {
    "use strict";

    var sizes = calcCameraSize(index)
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
    
    cameras[index].lookAt(new THREE.Vector3(0, LAMP_HEIGHT / 2, 0));
}

function calcCameraSize(index) {
    
    var scale = window.innerWidth / window.innerHeight;

    if (scale > ASPECT_RATIO) { // largura maior

        var width = scale * PLANE_HEIGHT[index];
        var height = PLANE_HEIGHT[index];
    } else {

        var width = ASPECT_RATIO * PLANE_HEIGHT[index];
        var height = width / scale;
    }

    return [width, height]
}

function onResize() {
    "use strict";
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    for (var i in cameras) {
        var sizes = calcCameraSize(i)
        var width = sizes[0]
        var height = sizes[1]

        resizeCamera(i, width, height);
    }
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
        case 38: //up
        scene.traverse(function(node) {
            if (node instanceof Chair) {
                node.friction = false;
                node.acceleration = new THREE.Vector3(0, 0, ACCELERATION);
            }
        });
        break;
        case 40: //down
        scene.traverse(function(node) {
            if (node instanceof Chair) {
                node.friction = false;
                node.acceleration = new THREE.Vector3(0, 0, -ACCELERATION);
            }
        });
        break;
        case 37: //left
        scene.traverse(function(node) {
            if (node instanceof Chair) {
                node.angularVelocity = ANGULAR_VELOCITY;
            }
        });
        break;
        case 39: //right
        scene.traverse(function(node) {
            if (node instanceof Chair) {
                node.angularVelocity = -ANGULAR_VELOCITY;
            }
        });
            break;
    }
}

function onKeyUp(e) {
    "use strict";

    switch (e.keyCode) {
        case 38: //up
        case 40: //down
            scene.traverse(function(node) {
                if (node instanceof Chair) {
                    node.friction = true;
                    node.acceleration.multiplyScalar(- FRICTION);
                }
            });
        break;
        case 37: //left
        case 39: //right
        scene.traverse(function(node) {
            if (node instanceof Chair) {
                node.angularVelocity = 0;
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
    createCamera(0, 0, 30, 0);
    createCamera(1, 30, LAMP_HEIGHT / 2, 0);
    createCamera(2, 0, LAMP_HEIGHT / 2, 30);

    render();

    clock = new THREE.Clock();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    window.addEventListener("keyup", onKeyUp);

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
