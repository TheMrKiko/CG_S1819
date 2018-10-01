var scene, renderer;
var camera= new Array(3);
var camera_activa= 0 ;

var nowDate;

const ACCELERATION_RATE = 2;

class Object3D extends THREE.Object3D {

    constructor() {
        super();

        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
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
        this.add(new THREE.AxisHelper(3));

        this.position.set(x, y, z);
    }

    addBase(x, y, z) {
        "use strict";

        var baseMaterial = new THREE.MeshBasicMaterial({
            color: 0xdd7316,
            wireframe: true
        });
        var baseGeometry = new THREE.CylinderGeometry(4, 4, 0.5, 20);

        var baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);

        baseMesh.position.set(x, y + 0.25, z);
        this.add(baseMesh);
    }

    addTube(x, y, z) {
        "use strict";

        var tubeMaterial = new THREE.MeshBasicMaterial({
            color: 0xdd7316,
            wireframe: true
        });
        var tubeGeometry = new THREE.CylinderGeometry(1, 1, 14, 15);

        var tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);

        tubeMesh.position.set(x, y + 7, z);
        this.add(tubeMesh);
    }

    addReflector(x, y, z) {
        "use strict";

        var refletorMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff1a,
            wireframe: true
        });
        var refletorGeometry = new THREE.CylinderGeometry(1, 5, 5, 15, 1, true, 0, Math.PI * 2);

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
        var holderGeometry = new THREE.CylinderGeometry(1, 0.1, 0.5, 15);

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
        var lampGeometry = new THREE.SphereGeometry(1, 8, 6, 0, Math.PI * 2, 0, Math.PI/2);

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
        this.add(new THREE.AxisHelper(3));

        this.position.set(x, y, x);
    }

    addTableLeg(x, y, z) {
        "use strict";

        var tableLegMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true
        });
        var tableLegGeometry = new THREE.CylinderGeometry(1, 1, 8, 15);

        var tableLegMesh = new THREE.Mesh(tableLegGeometry, tableLegMaterial);

        tableLegMesh.position.set(x, y - 4, z);
        this.add(tableLegMesh);
    }

    addTableTop(x, y, z) {
        "use strict";

        var tableTopMaterial = new THREE.MeshBasicMaterial({
            color: 0x808080,
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

        this.addChairSeat(0, 0, 0);
        this.addChairBack(0, 0.5, -3);
        this.addChairAxe(0, -0.5, 0);
        this.addChairLeg(0, -4, 0, 0);
        this.addChairLeg(0, -4, 0, Math.PI/2);
        this.addChairWeel(0, -5, 3);
        this.addChairWeel(0, -5, -3);
        this.addChairWeel(3, -5, 0);
        this.addChairWeel(-3, -5, 0);
        this.add(new THREE.AxisHelper(3));

        this.position.set(x, y, z);
    }

    addChairSeat(x, y, z) {
        "use strict";

        var chairSeatMaterial = new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            wireframe: true
        });
        var chairSeatGeometry = new THREE.CubeGeometry(7, 1, 7);

        var chairSeatMesh = new THREE.Mesh(chairSeatGeometry, chairSeatMaterial);

        chairSeatMesh.position.set(x, y, z);
        this.add(chairSeatMesh);
    }

    addChairBack(x, y, z) {
        "use strict";

        var chairBackMaterial = new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            wireframe: true
        });
        var chairBackGeometry = new THREE.CubeGeometry(7, 9, 1);

        var chairBackMesh = new THREE.Mesh(chairBackGeometry, chairBackMaterial);

        chairBackMesh.position.set(x, y + 4.5, z);
        this.add(chairBackMesh);
    }

    addChairAxe(x, y, z) {
        "use strict";

        var chairAxeMaterial = new THREE.MeshBasicMaterial({
            color: 0xff00ff,
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
            color: 0xff00ff,
            wireframe: true
        });
        var chairLegGeometry = new THREE.CylinderGeometry(0.5, 0.5, 7);

        var chairLegMesh = new THREE.Mesh(chairLegGeometry, chairLegMaterial);

        chairLegMesh.position.set(x, y, z);
        chairLegMesh.rotateX(Math.PI/2);
        chairLegMesh.rotateZ(rotationY);
        this.add(chairLegMesh);
    }

    addChairWeel(x, y, z) {
        "use strict";

        var chairWeelMaterial = new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            wireframe: true
        });
        var chairWeelGeometry = new THREE.TorusGeometry(0.4, 0.2, 4, 5);

        var chairWeelMesh = new THREE.Mesh(chairWeelGeometry, chairWeelMaterial);

        chairWeelMesh.position.set(x, y, z);
        this.add(chairWeelMesh);
    }

    animate(timeDiff) {
        "use strict";

        var oldVelocity = this.velocity.clone();
        this.velocity.add(this.acceleration.clone().multiplyScalar(timeDiff));

        if (this.friction && Math.round(this.velocity.angleTo(oldVelocity))){
            this.acceleration = new THREE.Vector3( ); 
            this.velocity = new THREE.Vector3( );
            this.friction = false;
        } else {
            this.position.add(oldVelocity.multiplyScalar(timeDiff)).add(this.velocity.clone().multiplyScalar(timeDiff/2));
        }
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

function createCameraTopo() {
    "use strict";
    camera[0] = new THREE.OrthographicCamera(
        -25,
         25,
         25, 
        -25,
        1, 
        1000
       );
       camera[0].position.x = 0;
       camera[0].position.y = 40;
       camera[0].position.z = 0;
   
       camera[0].lookAt(scene.position);
}

function createCameraLateral(){
    camera[1] = new THREE.OrthographicCamera(
        -25,
         25,
         25, 
        -25,
        1, 
        1000
       );
       camera[1].position.x = 40;
       camera[1].position.y = 0;
       camera[1].position.z = 0;
   
       camera[1].lookAt(scene.position);
}

function createCameraFrontal() {
    "use strict";
    camera[2] = new THREE.OrthographicCamera(
        -25,
         25,
         25, 
        -25,
        1, 
        1000
       );
       camera[2].position.x = 0;
       camera[2].position.y = 0;
       camera[2].position.z = 40;
   
       camera[2].lookAt(scene.position);
}

function onResize() {
    "use strict";

    renderer.setSize(window.innerWidth, window.innerHeight);
 
   

    if (window.innerHeight > 0 && window.innerWidth > 0){
        resizeCameraTopo(scale_height);
        resizeCameraFrontal(scale_height);
        resizeCameraLateral(scale_height);
    }
    else{
        resizeCameraTopo(scale_height);
        resizeCameraFrontal(scale_height);
        resizeCameraLateral(scale_height);
    }
}

function resizeCameraLateral(scale) {
    camera[0].aspect = window.innerWidth / window.innerHeight;
    camera[0].updateProjectionMatrix();
}

function resizeCameraTopo(scale) {
    camera[1].aspect = window.innerWidth / window.innerHeight;
    camera[1].updateProjectionMatrix();
}
function resizeCameraFrontal(scale) {
    camera.aspect[2] = window.innerWidth / window.innerHeight;
    camera[2].updateProjectionMatrix();
}

function switch_camera(number) {
    camera_activa = number;
}

function onKeyDown(e) {
    "use strict";
    switch (e.keyCode) {
        case 49: //1
            switch_camera(1);
            break;
         case 51: //3
            switch_camera(2);
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
                    node.acceleration = new THREE.Vector3(0, 0, ACCELERATION_RATE);
                    node.friction = false;
                }
            });
            break;
        case 40: //down
            scene.traverse(function(node) {
                if (node instanceof Chair) {
                    node.acceleration = new THREE.Vector3(0, 0, -ACCELERATION_RATE);
                node.friction = false;
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
                    node.acceleration.multiplyScalar(-1 * ACCELERATION_RATE * Math.cos(node.velocity.angleTo(node.acceleration)));                    node.friction = true;
                }
            });
        break;
    }
}
function render() {
    "use strict";

    renderer.render(scene, camera[camera_activa]);
}

function init() {
    "use strict";

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    createScene();
    createCameraTopo();
    createCameraLateral();
    createCameraFrontal();

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
