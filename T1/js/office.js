var scene, renderer;
var cameras = new Array(3);
var activeCamera = 0;

var nowDate;

const ACCELERATION = 5;
const FRICTION = 3;
const ANGULAR_VELOCITY = Math.PI/2;
const ASPECT_RATIO = 16/10;
const PLANE_HEIGHT = 25;
const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

class Object3D extends THREE.Object3D {

    constructor() {
        super();

        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.angularVelocity = 0;
        this.angle = 0;
        this.friction;
    }

    animate(_) {
    }
}

class Lamp extends Object3D {
    constructor(x, y, z) {
        super();

        this.addBase(0, 0, 0);
        this.addTube(0, 0.5, 0)
        this.addReflector(0, 13, 0);
        this.addHolder(0, 14.5, 0);
        this.addLamp(0, 15 ,0);
        //this.add(new THREE.AxisHelper(3));

        this.position.set(x, y, z);
    }

    addBase(x, y, z) {
        "use strict";

        var baseMaterial = new THREE.MeshBasicMaterial({
            color: 0x663300,
            wireframe: true
        });
        var baseGeometry = new THREE.CylinderGeometry(2.5, 2.5, 0.5, 20);

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
        var tubeGeometry = new THREE.CylinderGeometry(0.5, 0.5, 14, 15);

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

class Table extends Object3D {
    constructor(x, y, z) {
        super();

        this.addTableTop(0, 0, 0);
        this.addTableLeg(-8, -0.5, -5);
        this.addTableLeg(-8, -0.5, 5);
        this.addTableLeg(8, -0.5, 5);
        this.addTableLeg(8, -0.5, -5);
        //this.add(new THREE.AxisHelper(3));

        this.position.set(x, y, x);
    }

    addTableLeg(x, y, z) {
        "use strict";

        var tableLegMaterial = new THREE.MeshBasicMaterial({
            color: 0x808080,
            wireframe: true
        });
        var tableLegGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 15);

        var tableLegMesh = new THREE.Mesh(tableLegGeometry, tableLegMaterial);

        tableLegMesh.position.set(x, y - 4, z);
        this.add(tableLegMesh);
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

class Chair extends Object3D {
    
    constructor(x, y, z) {
        super();
        this.angularVelocity = 0;
        this.angle = 0;
        this.rotatedStopped = 0;
        this.chairWheels = new Array(4);
        this.chairSeatAndBack = this.addChairSeatAndBack(0, 0, 0);
        this.addChairAxe(0, -0.5, 0);
        this.addChairLeg(0, -4, 0, 0);
        this.addChairLeg(0, -4, 0, Math.PI/2);
        this.chairWheels[0] = this.addChairWheel(0, -5, 3);
        this.chairWheels[1] = this.addChairWheel(0, -5, -3);
        this.chairWheels[2] = this.addChairWheel(3, -5, 0);
        this.chairWheels[3] = this.addChairWheel(-3, -5, 0);
        //this.add(new THREE.AxisHelper(3));

        this.position.set(x, y, z);
    }

    addChairSeatAndBack(x, y, z) {
        "use strict";

        var chairSeatMaterial = new THREE.MeshBasicMaterial({
            color: 0xa22a2a,
            wireframe: true
        });
        var chairSeatGeometry = new THREE.CubeGeometry(7, 1, 7);

        var chairSeatMesh = new THREE.Mesh(chairSeatGeometry, chairSeatMaterial);

        chairSeatMesh.position.set(x, y, z);

        chairSeatMesh.add(this.makeChairBack(0, 0.5, -3));

        this.add(chairSeatMesh);
        return chairSeatMesh;
    }

    makeChairBack(x, y, z) {
        "use strict";

        var chairBackMaterial = new THREE.MeshBasicMaterial({
            color: 0xa22a2a,
            wireframe: true
        });
        var chairBackGeometry = new THREE.CubeGeometry(7, 9, 1);

        var chairBackMesh = new THREE.Mesh(chairBackGeometry, chairBackMaterial);

        chairBackMesh.position.set(x, y + 4.5, z);
        
        return chairBackMesh;
    }

    addChairAxe(x, y, z) {
        "use strict";

        var chairAxeMaterial = new THREE.MeshBasicMaterial({
            color: 0x808080,
            wireframe: true
        });
        var chairAxeGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3);

        var chairAxeMesh = new THREE.Mesh(chairAxeGeometry, chairAxeMaterial);

        chairAxeMesh.position.set(x, y - 1.5, z);
        this.add(chairAxeMesh);
    }

    addChairLeg(x, y, z, rotationY) {
        "use strict";

        var chairLegMaterial = new THREE.MeshBasicMaterial({
            color: 0x808080,
            wireframe: true
        });
        var chairLegGeometry = new THREE.CylinderGeometry(0.5, 0.5, 7);

        var chairLegMesh = new THREE.Mesh(chairLegGeometry, chairLegMaterial);

        chairLegMesh.position.set(x, y, z);
        chairLegMesh.rotateX(Math.PI/2);
        chairLegMesh.rotateZ(rotationY);
        this.add(chairLegMesh);
    }

    addChairWheel(x, y, z) {
        "use strict";

        var chairWheelMaterial = new THREE.MeshBasicMaterial({
            color: 0xcccccc,
            wireframe: true
        });
        var chairWheelGeometry = new THREE.TorusGeometry(0.4, 0.2, 4, 8);

        var chairWheelMesh = new THREE.Mesh(chairWheelGeometry, chairWheelMaterial);

        chairWheelMesh.position.set(x, y, z);
        chairWheelMesh.rotateY(Math.PI/2)
        this.add(chairWheelMesh);
        return chairWheelMesh;
    }

    animate(timeDiff) {
        "use strict"; 
        
        var clonedAcceleration = this.acceleration.clone()
        var oldVelocity = this.velocity.clone();
        var tiltedVelocity;
        var rotateDiff = this.angularVelocity*timeDiff
        this.angle += rotateDiff;
        this.rotateUpperPartOfChair(rotateDiff);
        
        if (this.friction) {
            clonedAcceleration.multiplyScalar(-1 * Math.cos(clonedAcceleration.angleTo(this.velocity)))
        }
        
        this.velocity.add(clonedAcceleration.multiplyScalar(timeDiff));

        tiltedVelocity = this.velocity.clone()
        
        tiltedVelocity.applyAxisAngle(Y_AXIS, this.angle);

        if (this.velocity.z) {

            this.chairWheels.forEach(function(wheel) {
                wheel.rotateOnWorldAxis(Y_AXIS, this.rotatedStopped + rotateDiff);
                wheel.rotateZ(timeDiff * this.velocity.z);
            }, this);

            this.rotatedStopped = 0;

        } else {

            this.rotatedStopped += rotateDiff;
        }
        if (this.friction && this.velocity.z*oldVelocity.z <= 0) {
            this.friction = false;
            this.acceleration = new THREE.Vector3( );
            this.velocity = new THREE.Vector3( );
        } else {
            
            this.position.add(tiltedVelocity.multiplyScalar(timeDiff));
        }
    }
    
    rotateUpperPartOfChair(angle) {
        this.chairSeatAndBack.rotateY(angle);
    }
}

function createScene() {
    "use strict";
    
    scene = new THREE.Scene();
    
    scene.add(new THREE.AxisHelper(5));
    scene.add(new Table(0, 8.5, 0));
    scene.add(new Chair(0, 5.5, -4));
    scene.add(new Lamp(15, 0, 0))
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
            if (node instanceof THREE.AxisHelper) {
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
    createCamera(0, 0, 20, 0);
    createCamera(1, 30, 8.5, 0);
    createCamera(2, 0, 8.5, 30);

    render();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    window.addEventListener("keyup", onKeyUp);

    nowDate = new Date();
}

function animate() {
    "use strict";

    var timeDiff = (new Date().getTime() - nowDate.getTime()) / 1000;
    scene.traverse(function(node) {
        if(node instanceof Object3D) {
            node.animate(timeDiff);
        }
    })

    render();

    nowDate = new Date();
    requestAnimationFrame(animate);
}
