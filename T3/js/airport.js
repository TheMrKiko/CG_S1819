var scene, renderer, clock;
var camera;
var global_light;
var spotLight = Array(4);

const ANGULAR_VELOCITY = Math.PI/2;
const ASPECT_RATIO = 16/9;
const PLANE_HEIGHT = 55;
const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

const DISTANCE_LAMPS = 20;
const LAMP_BASE_RADIUS = 2.5;
const LAMP_HEIGHT = 14;

var lampsPos = [[DISTANCE_LAMPS, 0, DISTANCE_LAMPS],
                [-DISTANCE_LAMPS, 0, DISTANCE_LAMPS],
                [DISTANCE_LAMPS, 0, -DISTANCE_LAMPS],
                [-DISTANCE_LAMPS, 0, -DISTANCE_LAMPS]];
const smallerThan = (A, B) => A < B ? 1 : -1
const midpoint = (A, B, C) => new THREE.Vector3((A.x + B.x + C.x) / 3, (A.y + B.y + C.y) / 3, (A.z + B.z + C.z) / 3)
const midNpoint = (A, B, m, n) => new THREE.Vector3(midNpointAux(A.x, B.x, m, n), midNpointAux(A.y, B.y, m, n), midNpointAux(A.z, B.z, m, n))
const midNpointAux = (aw, bw, m, n) => aw + (Math.abs(aw - bw) * n * smallerThan(aw, bw)) / m

function pushSegmentedFace2(geo, a, b, c, levels) {
    var va = geo.vertices[a], vb = geo.vertices[b], vc = geo.vertices[c];
    var l = geo.vertices.length
    for (var it = 0; it != levels + 1; it ++) {
        var topStartI = l + (it * (it + 1) / 2) - 1
        var topStartI_r = it ? topStartI : a
        var bottomStartV = (levels - it) ? midNpoint(va, vb, levels + 1, it + 1) : vb
        var bottomEndV = (levels - it) ? midNpoint(va, vc, levels + 1, it + 1) : vc
        var bottomStartI = geo.vertices.length
        var bottomStartI_r = it - levels ? bottomStartI : b
        console.log("it", it, "t b", topStartI, bottomStartI, "t b", bottomStartV, bottomEndV)
        geo.vertices.push(bottomStartV)
        for (var mvs = 1; mvs != it + 1; mvs ++) {
           console.log(mvs)
            geo.vertices.push(midNpoint(bottomStartV, bottomEndV, it + 1, mvs))
        }
        geo.vertices.push(bottomEndV)
        for (var tr = 0; tr != it * 2 + 1; tr ++) {
            var auxPrim, auxSec, auxTer
            var inc = 0;
            if (tr % 2 == 0) {
                auxPrim = tr ? topStartI + inc + 1 : topStartI_r
                auxSec = (tr) ? bottomStartI + inc + 1: bottomStartI_r
                auxTer = (it - levels) || (tr - it * 2) ? bottomStartI + inc + 1 : c
                inc++
            } else {
                auxPrim = topStartI
                auxSec = bottomStartI + 1
                auxTer = topStartI + 1
                
            }
            console.log(auxPrim, auxSec, auxTer)
            console.log(geo.vertices[auxPrim], geo.vertices[auxSec], geo.vertices[auxTer])
            geo.faces.push(new THREE.Face3(auxPrim, auxSec, auxTer));
        }
    }
}

function pushSegmentedFace(geo, a, b, c, level) {
    if (level) {
        geo.vertices.push(midpoint(geo.vertices[a], geo.vertices[b], geo.vertices[c]))

        var lenV = geo.vertices.length - 1
        pushSegmentedFace(geo, a, b, lenV, level - 1)
        pushSegmentedFace(geo, b, c, lenV, level - 1)
        pushSegmentedFace(geo, c, a, lenV, level - 1)

    } else {
        geo.faces.push(new THREE.Face3(a, b, c));
    } 
}

//atualiza a distancia entre vertices para que se mantenha numa scale posterior
function updateVerticesDistanceAndScale(array, distance, scalefactor) {
    for (let index = 0; index < array.length; index++) {
        var diff = index < 8 ? array[index].x - (distance/2 * 1/scalefactor): (array[index].x + (distance/2 * 1/scalefactor));
        array[index].setX(diff);
    }
}

function scaleMesh(mesh, scalefactor) {
    var m = new THREE.Matrix4();
        m.set(scalefactor, 0, 0, 0,
                0,scalefactor,0,0,
                0,0,scalefactor,0,
                0,0,0,1)
    mesh.applyMatrix(m);
}

const A = 0;
const B = 1;
const C = 2;
const D = 3;
const E = 4;
const UP_C = 5;
const UP_E = 6;
const UP_A = 7;

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
    
        var floorMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            wireframe: true
        });
        var floorGeometry = new THREE.BoxGeometry(2 + (DISTANCE_LAMPS + LAMP_BASE_RADIUS) * 2, 0.5, 2 + (DISTANCE_LAMPS + LAMP_BASE_RADIUS) * 2, 10, 1, 10);

        var floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
        floorMesh.receiveShadow = true;
        floorMesh.position.set(x, y, z);
        this.add(floorMesh);
    }
}

class Plane extends Object3D {
    constructor(x, y, z) {
        super();    
        
        

        this.isRotatingX = 0;
        this.isRotatingY = 0;

        this.addBody(0, 0, 0);
        this.addCockpit(0,0,0);
        this.addWing(0, 0, 0, 5, 1.2);
        this.addWingStabilizer(0,3,-15, 5,1/2);
        
        this.add(new THREE.AxesHelper(3));
        this.position.set(x,y,z);
    }

    addBody(x,y,z){
        "use strict";
        
        var bodyGeometry = new THREE.Geometry();
        

        var bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0x696969,
            wireframe: true,
			
        });

        bodyGeometry.vertices.push(
            new THREE.Vector3(0, 0, -2.5),
            new THREE.Vector3(0, 5, -2.5),
            new THREE.Vector3(15, 0, -2.5),
            new THREE.Vector3(-25, 0, -2.5),
            new THREE.Vector3(-25, 5, -2.5),
            
            new THREE.Vector3(0, 0, 2.5),
            new THREE.Vector3(0, 5, 2.5),
            new THREE.Vector3(15, 0, 2.5),
            new THREE.Vector3(-25, 0, 2.5),
            new THREE.Vector3(-25, 5, 2.5)
        );

        const l = 0
        //uma parede
        pushSegmentedFace2(bodyGeometry, 0, 1, 2, 1);
        pushSegmentedFace(bodyGeometry, 0, 3, 4, l);
        pushSegmentedFace(bodyGeometry, 0, 4, 1, l);
        //outra parede
        pushSegmentedFace(bodyGeometry, 7, 6, 5, l);
        pushSegmentedFace(bodyGeometry, 9, 8, 5, l);
        pushSegmentedFace(bodyGeometry, 6, 9, 5, l);
        //parte da frente
        pushSegmentedFace(bodyGeometry, 2, 1, 6, l);
        pushSegmentedFace(bodyGeometry, 2, 6, 7, l);
        //parte de cima
        pushSegmentedFace(bodyGeometry, 1, 4, 9, l);
        pushSegmentedFace(bodyGeometry, 1, 9, 6, l);
        //parte de tras
        pushSegmentedFace(bodyGeometry, 4, 3, 8, l);
        pushSegmentedFace(bodyGeometry, 4, 8, 9, l);
        //parte de baixo
        pushSegmentedFace(bodyGeometry, 2, 8, 3, l);
        pushSegmentedFace(bodyGeometry, 2, 7, 8, l);
        
        
        var bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        
        bodyMesh.position.set(x, y, z + 5);
        bodyGeometry.computeFaceNormals();
        bodyGeometry.computeVertexNormals();
        bodyMesh.castShadow = true;
        bodyMesh.rotateY(-Math.PI/2);
        
        this.add(bodyMesh);
    }
    addCockpit(x,y,z){
        var modifier = new THREE.SubdivisionModifier(4);
        var cockpitGeometry = new THREE.Geometry();

        var cockpitMaterial = new THREE.MeshPhongMaterial({
            color: 	0x48d1ff,
            wireframe: true,
			
        });
        cockpitGeometry.vertices.push(
            new THREE.Vector3(-2.5, 5,0),
            new THREE.Vector3(-2.5, 3.5 ,4.5),
            new THREE.Vector3(-2.5, 5, 4.5),
            new THREE.Vector3(2.5, 5,0),
            new THREE.Vector3(2.5, 3.5 ,4.5),
            new THREE.Vector3(2.5, 5, 4.5),
            
        );
        cockpitGeometry.faces.push( new THREE.Face3(0, 1, 2));
        cockpitGeometry.faces.push( new THREE.Face3(3, 5, 4));
        cockpitGeometry.faces.push( new THREE.Face3(0, 2, 3));
        cockpitGeometry.faces.push( new THREE.Face3(3, 2, 5));
        cockpitGeometry.faces.push( new THREE.Face3(5, 1, 4));
        cockpitGeometry.faces.push( new THREE.Face3(2, 1, 5));
        cockpitGeometry.faces.push( new THREE.Face3(0, 4, 1));
        cockpitGeometry.faces.push( new THREE.Face3(3, 5, 1));
      
        var cockpitMesh = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpitMesh.position.set(x, y, z+5);
        cockpitGeometry.computeFaceNormals();
        cockpitGeometry.computeVertexNormals();
        cockpitMesh.castShadow = true;
        this.add(cockpitMesh);
    }

    addWing(x,y,z, distance, scalefactor){
        "use strict";
       
        var wingGeometry = new THREE.Geometry();

        wingGeometry.vertices.push(
            new THREE.Vector3(0,0,0), // A - 0
            new THREE.Vector3(0,0,6), // B - 1
            new THREE.Vector3(-12,0,0), // C - 2
            new THREE.Vector3(-12,0,-4), // D - 3
            new THREE.Vector3(-2,0,0), // E - 4
            new THREE.Vector3(-12,1,0), // UP C - 5 
            new THREE.Vector3(-2,1,0), //  UP E - 6
            new THREE.Vector3(0,1,0), //UP A - 7

            //WING 2
            new THREE.Vector3(0,0,0), // A - 8
            new THREE.Vector3(0,0,6), // B - 9
            new THREE.Vector3(12,0,0), // C - 10
            new THREE.Vector3(12,0,-4), // D - 11
            new THREE.Vector3(2,0,0), // E - 12
            new THREE.Vector3(12,1,0), // UP C - 13 
            new THREE.Vector3(2,1,0), //  UP E - 14
            new THREE.Vector3(0,1,0), //UP A - 15
            
        );

        updateVerticesDistanceAndScale(wingGeometry.vertices, distance, scalefactor);

        wingGeometry.faces.push( new THREE.Face3(0, 2, 1));
        wingGeometry.faces.push( new THREE.Face3(2, 4, 3));
        wingGeometry.faces.push( new THREE.Face3(2, 5, 6));
        wingGeometry.faces.push( new THREE.Face3(2, 4, 6));
        wingGeometry.faces.push( new THREE.Face3(2, 5, 3));
        wingGeometry.faces.push( new THREE.Face3(3, 5, 6));
        wingGeometry.faces.push( new THREE.Face3(3, 6, 4));
        wingGeometry.faces.push( new THREE.Face3(A, E, UP_A));
        wingGeometry.faces.push( new THREE.Face3(E, UP_E, UP_A));
        wingGeometry.faces.push( new THREE.Face3(B, A, UP_A));
        wingGeometry.faces.push( new THREE.Face3(B, UP_A, UP_C));
        wingGeometry.faces.push( new THREE.Face3(B, UP_C, C));

        //WING2
        var len = wingGeometry.faces.length;
        for (var i = 0; i < len; i++) {
            var v1 = wingGeometry.faces[i]["a"];
            var v2 = wingGeometry.faces[i]["b"];
            var v3 = wingGeometry.faces[i]["c"];
            wingGeometry.faces.push( new THREE.Face3(v1 + 8, v3 + 8, v2 + 8));
        }

        var wingMaterial = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        wireframe: true
        });
        
        var wingMesh = new THREE.Mesh(wingGeometry, wingMaterial);
        
        scaleMesh(wingMesh, scalefactor);

        wingMesh.castShadow = true;
        wingGeometry.computeFaceNormals();
        wingGeometry.computeVertexNormals();
        wingMesh.position.set(x, y+1, z);
      
        this.add(wingMesh);

    }

    addStabilizer(x, y, z) {
        "use strict";

        var stabilizerGeometry = new THREE.Geometry();

        var stabilizerMaterial = new THREE.MeshPhongMaterial({
            color: 0x0000ff,
            wireframe: true
        });
        stabilizerGeometry.vertices.push(
            // vertical stabilizer
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 3, 0),
            new THREE.Vector3(0, 0, 3),
            new THREE.Vector3(-0.5, 0, 0),
            new THREE.Vector3(-0.5, 3, 0),
            new THREE.Vector3(-0.5, 0, 3),

        );

        //stabilizerGeometry.vertices.push(midpointGeo(stabilizerGeometry, 0, 1, 2, 1)) //mete um vertice entre o 0 e o 1

        stabilizerGeometry.faces.push(new THREE.Face3(0, 1, 2));
        stabilizerGeometry.faces.push(new THREE.Face3(3, 5, 4));
        stabilizerGeometry.faces.push(new THREE.Face3(1, 0, 3));
        stabilizerGeometry.faces.push(new THREE.Face3(4, 1, 3));
        stabilizerGeometry.faces.push(new THREE.Face3(1, 5, 2));
        stabilizerGeometry.faces.push(new THREE.Face3(4, 5, 1));

        var stabilizerMesh = new THREE.Mesh(stabilizerGeometry, stabilizerMaterial);
        stabilizerMesh.castShadow = true;
        stabilizerGeometry.computeFaceNormals();
        stabilizerGeometry.computeVertexNormals();
        stabilizerMesh.position.set(x + 0.25, y, z); 
        this.add(stabilizerMesh);
        }


    addWingStabilizer(x, y, z, distance, scalefactor) {
        "use strict";

        var stabilizerGeometry = new THREE.Geometry();

        var stabilizerMaterial = new THREE.MeshPhongMaterial({
            color: 0x0000ff,
            wireframe: true
        });
    //horizontal
    // horizontal stabilizers
        stabilizerGeometry.vertices.push(
            new THREE.Vector3(0,0,0), // A - 0
            new THREE.Vector3(0,0,6), // B - 1
            new THREE.Vector3(-12,0,0), // C - 2
            new THREE.Vector3(-12,0,-4), // D - 3
            new THREE.Vector3(-2,0,0), // E - 4
            new THREE.Vector3(-12,1,0), // UP C - 5 
            new THREE.Vector3(-2,1,0), //  UP E - 6
            new THREE.Vector3(0,1,0), //UP A - 7

            //WING 2
            new THREE.Vector3(0,0,0), // A - 8
            new THREE.Vector3(0,0,6), // B - 9
            new THREE.Vector3(12,0,0), // C - 10
            new THREE.Vector3(12,0,-4), // D - 11
            new THREE.Vector3(2,0,0), // E - 12
            new THREE.Vector3(12,1,0), // UP C - 13 
            new THREE.Vector3(2,1,0), //  UP E - 14
            new THREE.Vector3(0,1,0), //UP A - 15
        )

        updateVerticesDistanceAndScale(stabilizerGeometry.vertices, distance, scalefactor);
        
        stabilizerGeometry.faces.push( new THREE.Face3(0, 2, 1));
        stabilizerGeometry.faces.push( new THREE.Face3(2, 4, 3));
        stabilizerGeometry.faces.push( new THREE.Face3(2, 5, 6));
        stabilizerGeometry.faces.push( new THREE.Face3(2, 4, 6));
        stabilizerGeometry.faces.push( new THREE.Face3(2, 5, 3));
        stabilizerGeometry.faces.push( new THREE.Face3(3, 5, 6));
        stabilizerGeometry.faces.push( new THREE.Face3(3, 6, 4));
        stabilizerGeometry.faces.push( new THREE.Face3(A, E, UP_A));
        stabilizerGeometry.faces.push( new THREE.Face3(E, UP_E, UP_A));
        stabilizerGeometry.faces.push( new THREE.Face3(B, A, UP_A));
        stabilizerGeometry.faces.push( new THREE.Face3(B, UP_A, UP_C));
        stabilizerGeometry.faces.push( new THREE.Face3(B, UP_C, C));

        //WING2
        var len = stabilizerGeometry.faces.length;
        for (var i = 0; i < len; i++) {
            var v1 = stabilizerGeometry.faces[i]["a"];
            var v2 = stabilizerGeometry.faces[i]["b"];
            var v3 = stabilizerGeometry.faces[i]["c"];
            stabilizerGeometry.faces.push( new THREE.Face3(v1 + 8, v3 + 8, v2 + 8));
        }

        var stabilizerMesh = new THREE.Mesh(stabilizerGeometry, stabilizerMaterial);
        
        scaleMesh(stabilizerMesh, scalefactor);

        stabilizerMesh.castShadow = true;
        stabilizerGeometry.computeFaceNormals();
        stabilizerGeometry.computeVertexNormals();
        stabilizerMesh.position.set(x, y, z);        
        this.add(stabilizerMesh);
        this.addStabilizer(x, y + 2, z -5);
    }

    animate(timeDiff) {
        this.rotateX(timeDiff * this.isRotatingX);
        this.rotateOnWorldAxis(Y_AXIS, timeDiff * this.isRotatingY);
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
        this.add(new THREE.AxesHelper(3));

        this.position.set(x, y, z);
    }

    addBase(x, y, z) {
        "use strict";

        var baseMaterial = new THREE.MeshPhongMaterial({
            color: 0x696969,
            wireframe: true
        });
        var baseGeometry = new THREE.CylinderGeometry(LAMP_BASE_RADIUS, LAMP_BASE_RADIUS, 0.5, 20);

        var baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);

        baseGeometry.computeFaceNormals();
        baseGeometry.computeVertexNormals();
        baseMesh.castShadow = true;

        baseMesh.position.set(x, y + 0.25, z);
        this.add(baseMesh);
    }

    addTube(x, y, z) {
        "use strict";

        var tubeMaterial = new THREE.MeshPhongMaterial({
            color: 	0x696969,
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

        var holderMaterial = new THREE.MeshPhongMaterial({
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

        var lampMaterial = new THREE.MeshPhongMaterial({
            color: 0xffff1a,
            wireframe: true
        });
        var lampGeometry = new THREE.SphereGeometry(2, 8, 6, 0, Math.PI * 2, 0, Math.PI/2);

        var lampMesh = new THREE.Mesh(lampGeometry, lampMaterial);
       
        lampGeometry.computeFaceNormals();
        lampGeometry.computeVertexNormals();
        lampMesh.castShadow = true;
        lampMesh.position.set(x, y, z);
        this.add(lampMesh);
    }
}

function createGlobalLight() {
    "use strict";

    global_light = new THREE.DirectionalLight(0xffffff, 0.7);
    global_light.position.set(0, 1, 0);
    global_light.lookAt(0,0,0);
    global_light.castShadow = true;
    //HELP WITH THE SHADOWS
   global_light.shadow.camera.near = -60;
   global_light.shadow.camera.far = 90;
   global_light.shadow.camera.left= -90;
   global_light.shadow.camera.right = 90;
   global_light.shadow.camera.top= 90;
   global_light.shadow.camera.bottom = -90;
   
    
    scene.add( global_light );

    //global_light.target.updateMatrixWorld();

    //global_light.shadow.camera.near = 0.5;      
    //global_light.shadow.camera.far = 25;     
}

function createSpotLight() {
    "use strict";

    for (let i = 0; i < spotLight.length; i++) {
        spotLight[i] = new THREE.SpotLight( 0xffffff, 1, 50, Math.PI/8);
        //spotlights in lamps positions
        spotLight[i].position.set(lampsPos[i][0], LAMP_HEIGHT + 5, lampsPos[i][2]);
        spotLight[i].castShadow = true;
        spotLight[i].angle = Math.PI/10     
        spotLight[i].shadow.camera.near = 10;
        spotLight[i].shadow.camera.far = 200;
        spotLight[i].shadow.mapSize.width = -1024;
        spotLight[i].shadow.mapSize.height = 1024;
        scene.add( spotLight[i] );
    }
}
    
function spotLight_switcher(light) {
    spotLight[light].visible = !spotLight[light].visible;
}

function global_light_switcher() {
	global_light.visible = !global_light.visible;
}
function createScene() {
    "use strict";
    
    scene = new THREE.Scene();
    
    scene.add(new THREE.AxesHelper(5));
    //create lamps
    for (let i = 0; i < lampsPos.length; i++) {
        scene.add(new Lamp(lampsPos[i][0], lampsPos[i][1], lampsPos[i][2]));
        
    }

    scene.add(new Floor(0, 0, 0));
    scene.add(new Plane(0, 2, 0));
}
function createLight(){
    createGlobalLight();
    createSpotLight();
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

function createPerspectiveCamera( x, y, z){
    "use strict";

    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(x,y,z);
    camera.lookAt(0, 0, 0);

}

function resizeCameraPerspective() {
    "use strict";
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    var sizes = calcCameraSize()
    var width = sizes[0]
    var height = sizes[1]

    if (window.innerHeight > 0 && window.innerWidth > 0) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
}


function onResize() {
    "use strict";
    
    renderer.setSize(window.innerWidth, window.innerHeight);    
    resizeCameraPerspective();
    
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
            if (node instanceof THREE.AxesHelper) {
                node.visible = !node.visible;
            }
        });
        break;
        case 78://N
        case 110://n 
        global_light_switcher();
        
        break;

        case 49:
        spotLight_switcher(0);
        break;
        case 50:
        spotLight_switcher(1);
        break;
        case 51:
        spotLight_switcher(2);
        break;
        case 52:
        spotLight_switcher(3);
        break;
        case 38: //up
        scene.traverse(function(node) {
            if (node instanceof Plane) {
                node.isRotatingX = 1;
            }
        });
        break;
        case 40: //down
        scene.traverse(function(node) {
            if (node instanceof Plane) {
                node.isRotatingX = -1;
            }
        });
        break;
        case 37: //left
        scene.traverse(function(node) {
            if (node instanceof Plane) {
                node.isRotatingY = -1;
            }
        });
        break;
        case 39: //right
        scene.traverse(function(node) {
            if (node instanceof Plane) {
                node.isRotatingY = 1;
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
                if (node instanceof Plane) {
                    node.isRotatingX = 0;
                }
            });
        break;
        case 37: //left
        case 39: //right
        scene.traverse(function(node) {
            if (node instanceof Plane) {
                node.isRotatingY = 0;
            }
        });
        break;
    }
}
function render() {
    "use strict";

    renderer.render(scene, camera);
    renderer.shadowMap.enabled = true;
   
}


function init() {
    "use strict";

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    createScene();
    createPerspectiveCamera(20, 20, 20);
    createLight();
    
    render();

    clock = new THREE.Clock();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    window.addEventListener("keyup", onKeyUp);
    
    var controls = new THREE.OrbitControls(camera, renderer.domElement);

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

/*
 *	@author zz85 / http://twitter.com/blurspline / http://www.lab4games.net/zz85/blog
 *	@author centerionware / http://www.centerionware.com
 *
 *	Subdivision Geometry Modifier
 *		using Loop Subdivision Scheme
 *
 *	References:
 *		http://graphics.stanford.edu/~mdfisher/subdivision.html
 *		http://www.holmes3d.net/graphics/subdivision/
 *		http://www.cs.rutgers.edu/~decarlo/readings/subdiv-sg00c.pdf
 *
 *	Known Issues:
 *		- currently doesn't handle "Sharp Edges"
 */

THREE.SubdivisionModifier = function ( subdivisions ) {

	this.subdivisions = ( subdivisions === undefined ) ? 1 : subdivisions;

};

// Applies the "modify" pattern
THREE.SubdivisionModifier.prototype.modify = function ( geometry ) {

	if ( geometry.isBufferGeometry ) {

		geometry = new THREE.Geometry().fromBufferGeometry( geometry );

	} else {

		geometry = geometry.clone();

	}

	geometry.mergeVertices();

	var repeats = this.subdivisions;

	while ( repeats -- > 0 ) {

		this.smooth( geometry );

	}

	geometry.computeFaceNormals();
	geometry.computeVertexNormals();

	return geometry;

};

( function () {

	// Some constants
	var WARNINGS = ! true; // Set to true for development
	var ABC = [ 'a', 'b', 'c' ];


	function getEdge( a, b, map ) {

		var vertexIndexA = Math.min( a, b );
		var vertexIndexB = Math.max( a, b );

		var key = vertexIndexA + "_" + vertexIndexB;

		return map[ key ];

	}


	function processEdge( a, b, vertices, map, face, metaVertices ) {

		var vertexIndexA = Math.min( a, b );
		var vertexIndexB = Math.max( a, b );

		var key = vertexIndexA + "_" + vertexIndexB;

		var edge;

		if ( key in map ) {

			edge = map[ key ];

		} else {

			var vertexA = vertices[ vertexIndexA ];
			var vertexB = vertices[ vertexIndexB ];

			edge = {

				a: vertexA, // pointer reference
				b: vertexB,
				newEdge: null,
				// aIndex: a, // numbered reference
				// bIndex: b,
				faces: [] // pointers to face

			};

			map[ key ] = edge;

		}

		edge.faces.push( face );

		metaVertices[ a ].edges.push( edge );
		metaVertices[ b ].edges.push( edge );


	}

	function generateLookups( vertices, faces, metaVertices, edges ) {

		var i, il, face;

		for ( i = 0, il = vertices.length; i < il; i ++ ) {

			metaVertices[ i ] = { edges: [] };

		}

		for ( i = 0, il = faces.length; i < il; i ++ ) {

			face = faces[ i ];

			processEdge( face.a, face.b, vertices, edges, face, metaVertices );
			processEdge( face.b, face.c, vertices, edges, face, metaVertices );
			processEdge( face.c, face.a, vertices, edges, face, metaVertices );

		}

	}

	function newFace( newFaces, a, b, c, materialIndex ) {

		newFaces.push( new THREE.Face3( a, b, c, undefined, undefined, materialIndex ) );

	}

	function midpoint( a, b ) {

		return ( Math.abs( b - a ) / 2 ) + Math.min( a, b );

	}

	function newUv( newUvs, a, b, c ) {

		newUvs.push( [ a.clone(), b.clone(), c.clone() ] );

	}

	/////////////////////////////

	// Performs one iteration of Subdivision
	THREE.SubdivisionModifier.prototype.smooth = function ( geometry ) {

		var tmp = new THREE.Vector3();

		var oldVertices, oldFaces, oldUvs;
		var newVertices, newFaces, newUVs = [];

		var n, i, il, j, k;
		var metaVertices, sourceEdges;

		// new stuff.
		var sourceEdges, newEdgeVertices, newSourceVertices;

		oldVertices = geometry.vertices; // { x, y, z}
		oldFaces = geometry.faces; // { a: oldVertex1, b: oldVertex2, c: oldVertex3 }
		oldUvs = geometry.faceVertexUvs[ 0 ];

		var hasUvs = oldUvs !== undefined && oldUvs.length > 0;

		/******************************************************
		 *
		 * Step 0: Preprocess Geometry to Generate edges Lookup
		 *
		 *******************************************************/

		metaVertices = new Array( oldVertices.length );
		sourceEdges = {}; // Edge => { oldVertex1, oldVertex2, faces[]  }

		generateLookups( oldVertices, oldFaces, metaVertices, sourceEdges );


		/******************************************************
		 *
		 *	Step 1.
		 *	For each edge, create a new Edge Vertex,
		 *	then position it.
		 *
		 *******************************************************/

		newEdgeVertices = [];
		var other, currentEdge, newEdge, face;
		var edgeVertexWeight, adjacentVertexWeight, connectedFaces;

		for ( i in sourceEdges ) {

			currentEdge = sourceEdges[ i ];
			newEdge = new THREE.Vector3();

			edgeVertexWeight = 3 / 8;
			adjacentVertexWeight = 1 / 8;

			connectedFaces = currentEdge.faces.length;

			// check how many linked faces. 2 should be correct.
			if ( connectedFaces != 2 ) {

				// if length is not 2, handle condition
				edgeVertexWeight = 0.5;
				adjacentVertexWeight = 0;

				if ( connectedFaces != 1 ) {

					if ( WARNINGS ) console.warn( 'Subdivision Modifier: Number of connected faces != 2, is: ', connectedFaces, currentEdge );

				}

			}

			newEdge.addVectors( currentEdge.a, currentEdge.b ).multiplyScalar( edgeVertexWeight );

			tmp.set( 0, 0, 0 );

			for ( j = 0; j < connectedFaces; j ++ ) {

				face = currentEdge.faces[ j ];

				for ( k = 0; k < 3; k ++ ) {

					other = oldVertices[ face[ ABC[ k ] ] ];
					if ( other !== currentEdge.a && other !== currentEdge.b ) break;

				}

				tmp.add( other );

			}

			tmp.multiplyScalar( adjacentVertexWeight );
			newEdge.add( tmp );

			currentEdge.newEdge = newEdgeVertices.length;
			newEdgeVertices.push( newEdge );

			// console.log(currentEdge, newEdge);

		}

		/******************************************************
		 *
		 *	Step 2.
		 *	Reposition each source vertices.
		 *
		 *******************************************************/

		var beta, sourceVertexWeight, connectingVertexWeight;
		var connectingEdge, connectingEdges, oldVertex, newSourceVertex;
		newSourceVertices = [];

		for ( i = 0, il = oldVertices.length; i < il; i ++ ) {

			oldVertex = oldVertices[ i ];

			// find all connecting edges (using lookupTable)
			connectingEdges = metaVertices[ i ].edges;
			n = connectingEdges.length;

			if ( n == 3 ) {

				beta = 3 / 16;

			} else if ( n > 3 ) {

				beta = 3 / ( 8 * n ); // Warren's modified formula

			}

			// Loop's original beta formula
			// beta = 1 / n * ( 5/8 - Math.pow( 3/8 + 1/4 * Math.cos( 2 * Math. PI / n ), 2) );

			sourceVertexWeight = 1 - n * beta;
			connectingVertexWeight = beta;

			if ( n <= 2 ) {

				// crease and boundary rules
				// console.warn('crease and boundary rules');

				if ( n == 2 ) {

					if ( WARNINGS ) console.warn( '2 connecting edges', connectingEdges );
					sourceVertexWeight = 3 / 4;
					connectingVertexWeight = 1 / 8;

					// sourceVertexWeight = 1;
					// connectingVertexWeight = 0;

				} else if ( n == 1 ) {

					if ( WARNINGS ) console.warn( 'only 1 connecting edge' );

				} else if ( n == 0 ) {

					if ( WARNINGS ) console.warn( '0 connecting edges' );

				}

			}

			newSourceVertex = oldVertex.clone().multiplyScalar( sourceVertexWeight );

			tmp.set( 0, 0, 0 );

			for ( j = 0; j < n; j ++ ) {

				connectingEdge = connectingEdges[ j ];
				other = connectingEdge.a !== oldVertex ? connectingEdge.a : connectingEdge.b;
				tmp.add( other );

			}

			tmp.multiplyScalar( connectingVertexWeight );
			newSourceVertex.add( tmp );

			newSourceVertices.push( newSourceVertex );

		}


		/******************************************************
		 *
		 *	Step 3.
		 *	Generate Faces between source vertices
		 *	and edge vertices.
		 *
		 *******************************************************/

		newVertices = newSourceVertices.concat( newEdgeVertices );
		var sl = newSourceVertices.length, edge1, edge2, edge3;
		newFaces = [];

		var uv, x0, x1, x2;
		var x3 = new THREE.Vector2();
		var x4 = new THREE.Vector2();
		var x5 = new THREE.Vector2();

		for ( i = 0, il = oldFaces.length; i < il; i ++ ) {

			face = oldFaces[ i ];

			// find the 3 new edges vertex of each old face

			edge1 = getEdge( face.a, face.b, sourceEdges ).newEdge + sl;
			edge2 = getEdge( face.b, face.c, sourceEdges ).newEdge + sl;
			edge3 = getEdge( face.c, face.a, sourceEdges ).newEdge + sl;

			// create 4 faces.

			newFace( newFaces, edge1, edge2, edge3, face.materialIndex );
			newFace( newFaces, face.a, edge1, edge3, face.materialIndex );
			newFace( newFaces, face.b, edge2, edge1, face.materialIndex );
			newFace( newFaces, face.c, edge3, edge2, face.materialIndex );

			// create 4 new uv's

			if ( hasUvs ) {

				uv = oldUvs[ i ];

				x0 = uv[ 0 ];
				x1 = uv[ 1 ];
				x2 = uv[ 2 ];

				x3.set( midpoint( x0.x, x1.x ), midpoint( x0.y, x1.y ) );
				x4.set( midpoint( x1.x, x2.x ), midpoint( x1.y, x2.y ) );
				x5.set( midpoint( x0.x, x2.x ), midpoint( x0.y, x2.y ) );

				newUv( newUVs, x3, x4, x5 );
				newUv( newUVs, x0, x3, x5 );

				newUv( newUVs, x1, x4, x3 );
				newUv( newUVs, x2, x5, x4 );

			}

		}

		// Overwrite old arrays
		geometry.vertices = newVertices;
		geometry.faces = newFaces;
		if ( hasUvs ) geometry.faceVertexUvs[ 0 ] = newUVs;

		// console.log('done');

	};

} )();
