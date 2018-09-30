var camera, scene, renderer;

class Table extends THREE.Object3D {
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

class Chair extends THREE.Object3D {
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
}

function createScene() {
    "use strict";

    scene = new THREE.Scene();

    scene.add(new THREE.AxisHelper(5));
    scene.add(new Table(0, 8.5, 0));
    scene.add(new Chair(0, 5.5, -4));
}

function createCamera() {
    "use strict";
    camera = new THREE.PerspectiveCamera(
        40,
        window.innerWidth / window.innerHeight,
        1,
        1000
    );
    camera.position.x = 25;
    camera.position.y = 25;
    camera.position.z = -5;
    camera.lookAt(scene.position);
}

function onResize() {
    "use strict";

    renderer.setSize(window.innerWidth, window.innerHeight);

    if (window.innerHeight > 0 && window.innerWidth > 0) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }
}

function onKeyDown(e) {
    "use strict";

    switch (e.keyCode) {
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
    }
}

function render() {
    "use strict";
    renderer.render(scene, camera);
}

function init() {
    "use strict";
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    createScene();
    createCamera();

    render();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
}

function animate() {
    "use strict";
    render();

    requestAnimationFrame(animate);
}
