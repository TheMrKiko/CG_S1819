var scene, renderer, clock;
var camera;
var global_light;
var spotLight = Array(4);
var plane;

const ANGULAR_VELOCITY = Math.PI/2;
const ASPECT_RATIO = 16/9;
const PLANE_HEIGHT = 55;
const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

const DISTANCE_LAMPS = 40;
const LAMP_BASE_RADIUS = 2.5;
const LAMP_HEIGHT = 30;

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
        geo.vertices.push(bottomStartV)
        for (var mvs = 1; mvs != it + 1; mvs ++) {
            geo.vertices.push(midNpoint(bottomStartV, bottomEndV, it + 1, mvs))
        }
        geo.vertices.push(bottomEndV)
        for (var tr = 0, inc = 0; tr != it * 2 + 1; tr ++) {
            var auxPrim, auxSec, auxTer
            if (tr % 2 == 0) {
                auxPrim = tr ? topStartI + inc : topStartI_r
                auxSec = (tr) ? bottomStartI + inc: bottomStartI_r
                auxTer = (it - levels) || (tr - it * 2) ? bottomStartI + inc + 1 : c
                inc++
            } else {
                auxPrim = topStartI + inc - 1
                auxSec = bottomStartI + inc
                auxTer = topStartI + inc
                
            }
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

class Mesh extends THREE.Mesh {
    constructor(geometry, materialOpts) {
        var materialsArray = [new THREE.MeshPhongMaterial(materialOpts), new THREE.MeshLambertMaterial(materialOpts), new THREE.MeshBasicMaterial(materialOpts)]
        super(geometry, materialsArray[0]);
        this.materialsArray = materialsArray;
        this.lightMaterialIndex = 0;
        this.previousIndex = 0;
        this.hasFlatMaterial = false;
        this.lightMaterialsArray = [materialsArray[0], materialsArray[1]];
        this.flatMaterial = materialsArray[2];
        return this;
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
    
        var floorMaterial = {
            color: 0x00ffff,
            wireframe: true
        };
        var floorGeometry = new THREE.BoxGeometry(2 + (DISTANCE_LAMPS + LAMP_BASE_RADIUS) * 2, 0.5, 2 + (DISTANCE_LAMPS + LAMP_BASE_RADIUS) * 2, 10, 1, 10);

        var floorMesh = new Mesh(floorGeometry, floorMaterial);
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

        var bodyMaterial = {
            color: 0x696969,
            wireframe: true,
			
        };

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
        pushSegmentedFace2(bodyGeometry, 0, 1, 2, 4);
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

        var bodyMesh = new Mesh(bodyGeometry, bodyMaterial);

        bodyMesh.position.set(x, y, z + 5);
        bodyGeometry.computeFaceNormals();
        bodyGeometry.computeVertexNormals();
        bodyMesh.castShadow = true;
        bodyMesh.rotateY(-Math.PI/2);
        
        this.add(bodyMesh);
    }
    addCockpit(x,y,z){
        var cockpitGeometry = new THREE.Geometry();

        var cockpitMaterial = {
            color: 	0x48d1ff,
            wireframe: true,
			
        };
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
        var cockpitMesh = new Mesh(cockpitGeometry, cockpitMaterial);
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

        wingGeometry.faces.push( new THREE.Face3(0, 1, 2));
        wingGeometry.faces.push( new THREE.Face3(2, 3, 4));
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

        var wingMaterial = {
        color: 0xff0000,
        wireframe: true
        };
        var wingMesh = new Mesh(wingGeometry, wingMaterial);
        
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

        var stabilizerMaterial = {
            color: 0x0000ff,
            wireframe: true
        };
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

        var stabilizerMesh = new Mesh(stabilizerGeometry, stabilizerMaterial);
        stabilizerMesh.castShadow = true;
        stabilizerGeometry.computeFaceNormals();
        stabilizerGeometry.computeVertexNormals();
        stabilizerMesh.position.set(x + 0.25, y, z); 
        this.add(stabilizerMesh);
        }


    addWingStabilizer(x, y, z, distance, scalefactor) {
        "use strict";

        var stabilizerGeometry = new THREE.Geometry();

        var stabilizerMaterial = {
            color: 0x0000ff,
            wireframe: true
        };
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
        
        stabilizerGeometry.faces.push( new THREE.Face3(0, 1, 2));
        stabilizerGeometry.faces.push( new THREE.Face3(2, 3, 4));
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

        var stabilizerMesh = new Mesh(stabilizerGeometry, stabilizerMaterial);
        
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
        this.addHolder(0, LAMP_HEIGHT + 0.5, 0);
        this.addLamp(0, LAMP_HEIGHT + 1 ,0);
        this.add(new THREE.AxesHelper(3));

        this.position.set(x, y, z);
    }

    addBase(x, y, z) {
        "use strict";

        var baseMaterial = {
            color: 0x696969,
            wireframe: true
        };
        var baseGeometry = new THREE.CylinderGeometry(LAMP_BASE_RADIUS, LAMP_BASE_RADIUS, 0.5, 20);

        var baseMesh = new Mesh(baseGeometry, baseMaterial);

        baseGeometry.computeFaceNormals();
        baseGeometry.computeVertexNormals();
        baseMesh.castShadow = true;

        baseMesh.position.set(x, y + 0.25, z);
        this.add(baseMesh);
    }

    addTube(x, y, z) {
        "use strict";

        var tubeMaterial = {
            color: 	0x696969,
            wireframe: true
        };
        var tubeGeometry = new THREE.CylinderGeometry(0.5, 0.5, LAMP_HEIGHT, 15);

        var tubeMesh = new Mesh(tubeGeometry, tubeMaterial);

        tubeMesh.position.set(x, y + LAMP_HEIGHT / 2, z);
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

        var refletorMesh = new Mesh(refletorGeometry, refletorMaterial);

        refletorMesh.position.set(x, y + 2.5, z);
        this.add(refletorMesh);
    }

    addHolder(x, y, z) {
        "use strict";

        var holderMaterial = {
            color: 0xffff1a,
            wireframe: true
        };
        var holderGeometry = new THREE.CylinderGeometry(0.7, 0.1, 0.5, 15);

        var holderMesh = new Mesh(holderGeometry, holderMaterial);

        holderMesh.position.set(x, y + 0.25, z);
        this.add(holderMesh);
    }

    addLamp(x, y, z) {
        "use strict";

        var lampMaterial = {
            color: 0xffff1a,
            wireframe: true
        };
        var lampGeometry = new THREE.SphereGeometry(2, 8, 6, 0, Math.PI * 2, 0, Math.PI/2);

        var lampMesh = new Mesh(lampGeometry, lampMaterial);
       
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

   global_light.shadow.mapSize.width = 4096;
   global_light.shadow.mapSize.height = 4096;


   
    
    scene.add( global_light );

    //global_light.target.updateMatrixWorld();

    //global_light.shadow.camera.near = 0.5;      
    //global_light.shadow.camera.far = 25;     
}

function createSpotLight() {
    "use strict";

    for (let i = 0; i < spotLight.length; i++) {
        spotLight[i] = new THREE.SpotLight( 0xffffff, 1, 100, Math.PI/4);
        //spotlights in lamps positions
        spotLight[i].position.set(lampsPos[i][0], LAMP_HEIGHT + 5, lampsPos[i][2]);
        spotLight[i].castShadow = true;
        spotLight[i].angle = Math.PI/10     
        spotLight[i].shadow.camera.near = 10;
        spotLight[i].shadow.camera.far = 200;
        spotLight[i].shadow.mapSize.width = -1024;
        spotLight[i].shadow.mapSize.height = 1024;
        spotLight[i].target = plane;
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
    plane = new Plane(0, 25, 0);
    scene.add(plane);
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
            if (node instanceof Mesh) {
                for (var material in node.materialsArray)
                    node.materialsArray[material].wireframe = !node.materialsArray[material].wireframe;
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
        case 71://G
        case 104://g 
        scene.traverse(function(node) {
            if (node instanceof Mesh) {
                node.previousIndex = node.lightMaterialIndex;
                node.lightMaterialIndex = Math.abs(node.lightMaterialIndex - 1)
                node.material = node.lightMaterialsArray[node.lightMaterialIndex];
            }
        });        
        break;
        case 76://L
        case 108://l 
        scene.traverse(function(node) {
            if (node instanceof Mesh) {
                if (node.hasFlatMaterial){
                    node.material = node.lightMaterialsArray[node.previousIndex];
                } else {
                    node.material = node.flatMaterial;
                    node.hasFlatMaterial = true;
                }
            }
        });          
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
                node.isRotatingX = 2;
            }
        });
        break;
        case 40: //down
        scene.traverse(function(node) {
            if (node instanceof Plane) {
                node.isRotatingX = -2;
            }
        });
        break;
        case 37: //left
        scene.traverse(function(node) {
            if (node instanceof Plane) {
                node.isRotatingY = -2;
            }
        });
        break;
        case 39: //right
        scene.traverse(function(node) {
            if (node instanceof Plane) {
                node.isRotatingY = 2;
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
    //renderer.shadowMap.enabled = true;
    //renderer.shadowMap.type = THREE.PCFShadowMap;
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
    createPerspectiveCamera(50, 50, 50);
    createLight();
    
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
        if (node instanceof Object3D) {
            node.animate(timeDiff);
        }
    })

    render();

    requestAnimationFrame(animate);
}
