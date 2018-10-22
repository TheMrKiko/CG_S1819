var scene, renderer, clock;
var cameras = new Array(3);
var activeCamera = 0;
var balls = new Array();
var ring;
var movingBall;

const ASPECT_RATIO = 2 / 1;
const PLANE_HEIGHT = 55;
const WALL_HEIGHT = 10;
const BALL_RADIUS = WALL_HEIGHT / 2;
const BALL_DIAMETER_SQUARED = (BALL_RADIUS * 2) ** 2;
const WALL_RADIUS = 0.5;
const BALL_WALL_DIST_SQUARED = (BALL_RADIUS + WALL_RADIUS) ** 2;

const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

const WALL_WIDTH = (ratio) => (WALL_HEIGHT * 10 * ratio) / Math.sqrt(5);

class Object3D extends THREE.Object3D {

    constructor() {
        super();
        this.direction;
        this.velocity = 0;
        this.radius;
        this.collided = false;
    }

    animate(_) {
    }

    getCenterTo(_) {

    }

    checkCollision(_) {

    }
}

class Ball extends Object3D {
    constructor(x, y, z) {
        super();

        this.addBall(0, 0, 0);
        this.add(new THREE.AxesHelper(BALL_RADIUS));
        this.radius = BALL_RADIUS;
        this.direction = new THREE.Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
        this.velocity = Math.random() * 30 + 10;
        this.oldPosition = new THREE.Vector3(x, y, z);
        this.position.set(x, y, x);

        balls.push(this);

        this.collisionRadius = [BALL_RADIUS, BALL_RADIUS , -BALL_RADIUS, -BALL_RADIUS];
    }

    addBall(x, y, z) {
        "use strict";

        var ballMaterial = new THREE.MeshBasicMaterial({
            color: eval('0x'+Math.floor(Math.random() * 16777215).toString(16)),
            wireframe: true
        });
        var ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 10, 10);

        var ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
        ballMesh.name = "BallMesh";
        ballMesh.position.set(x, y, z);
        this.add(ballMesh);
    }

    animate(timeDiff) {
        var direction3D = new THREE.Vector3(this.direction.x, 0, this.direction.y)
        this.position.add(direction3D.multiplyScalar(this.velocity * timeDiff));

        this.getObjectByName("BallMesh").rotateZ((timeDiff * this.velocity)*0.010);
           
      
    }

    newVelocity(wall) {
        var normalToWall = ring.normalVectorWalls[wall];
        var pointOfTouch;
        var centerBall;
        var oldDirection = this.direction.clone();
        //console.log("ntw", normalToWall)
        
        this.direction = this.direction.reflect(normalToWall);
        this.position.set(this.oldPosition.x, this.oldPosition.y, this.oldPosition.z);
        
    }
    updateOldPosition() {
        //console.log("this.position", this.position)
        this.oldPosition = this.position;
    }

    checkCollision(obj) {
        if (obj instanceof Ball) {
            if (this.position.distanceToSquared(obj.getCenterTo(this)) <= BALL_DIAMETER_SQUARED) {
               [this.direction, obj.direction] = [obj.direction, this.direction];
               [this.velocity, obj.velocity] = [obj.velocity, this.velocity];
               this.collided = true;
            }
        } else if (obj instanceof Wall) {
            if (this.position.distanceToSquared(obj.getCenterTo(this)) <= BALL_WALL_DIST_SQUARED) {
                console.log(this, this.position)
                this.direction = new THREE.Vector2(((-1) ** obj.normalToWall.x) * this.direction.x, ((-1) ** obj.normalToWall.z) * this.direction.z);
                this.collided = true;
            }
        }
    }

    getCenterTo(obj) {
        if (obj instanceof Ball) {
            return this.position;
        }
    }

    checkWallCollision(wall) {
        //console.log("parede", ring.ringWalls[wall].position.z)
        switch (wall) {
            case 0: //bottom wall
            case 2: //top wall
                if(Math.abs(this.position.z + this.collisionRadius[wall] - ring.ringWalls[wall].position.z) < 0.5)  {
                    console.log("colidiu top ou bottom")
                    console.log(this.position.z - ring.ringWalls[wall].position.z)
                    return wall;
                }
                return -1;
                break;
            case 1://right wall
            case 3://left wall
                if(Math.abs(this.position.x + this.collisionRadius[wall] - ring.ringWalls[wall].position.x) < 0.5)  {
                    console.log("colidiu left ou right")
                    console.log(this.position.x - ring.ringWalls[wall].position.x)
                    return wall;
                }
                return -1;
                break;
            default:
                break;
        }
    }
}

class Ring extends Object3D {
    constructor(x, y, z) {
        super();
        
        this.ringWalls = new Array(4);
        this.ringWalls[0] = this.addWall(0, 0, WALL_WIDTH(1) / 2, 2, 0);
        this.ringWalls[1] = this.addWall(WALL_WIDTH(2) / 2, 0, 0, 1, Math.PI / 2);
        this.ringWalls[2] = this.addWall(0, 0, - WALL_WIDTH(1) / 2, 2, Math.PI);
        this.ringWalls[3] = this.addWall(- WALL_WIDTH(2) / 2, 0, 0, 2 * WALL_RADIUS, Math.PI * 3 / 2);
        this.add(new THREE.AxesHelper(WALL_HEIGHT));

        this.normalVectorWalls = [new THREE.Vector3(0,0,-1), new THREE.Vector3(-1,0,0), new THREE.Vector3(0,0,1), new THREE.Vector3(1,0,0)]

        this.radius = WALL_RADIUS;
        this.position.set(x, y, x);
        ring = this;
        for (let index = 0; index < ring.ringWalls.length; index++) {
            //console.log( ring.ringWalls[index]);
            
        }
    }

    addWall(x, y, z, widthRatio, rotY) {
        "use strict";

        var wall = new Wall(x, y, z, widthRatio, rotY);
        this.add(wall);
        return wall;
    }

    checkCollision(ball) { //vai se a bola choca com cada parede
        var hasCollision = -1;
        for (let index = 0; index < this.ringWalls.length; index++) {
            hasCollision = ball.checkCollision(this.ringWalls[index]);
            /*if (hasCollision != -1) {
                break;
            }*/
        }
        //console.log("hasCOl", hasCollision)
        return hasCollision;
    }

    getCenterTo(obj) {
        if (obj instanceof Ball) {
            
            return new THREE.Vector3()
        }
    }
}

class Wall extends Object3D {
    constructor(x, y, z, widthRatio, rotY) {
        super();
        var wallMaterial = new THREE.MeshBasicMaterial({
            color: 0xfff05f,
            wireframe: true
        });
        var wallGeometry = new THREE.BoxGeometry(WALL_WIDTH(widthRatio), WALL_HEIGHT, 1);

        var wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
        this.add(wallMesh);

        this.position.set(x, y, z);

        this.normalToWall = new THREE.Vector2(0, -1);
        this.rotateY(rotY);
        this.normalToWall.rotateAround(new THREE.Vector2(0, 0), rotY).round();
        
        console.log(this.normalToWall)

    }

    getCenterTo(obj) {
        if (obj instanceof Ball) {
            console.log("ca")
            const getNeg = (coord) => coord ? 0 : 1;
            return new THREE.Vector3(
                getNeg(this.normalToWall.x)*obj.position.x + this.normalToWall.x*this.position.x,
                0,
                getNeg(this.normalToWall.z)*obj.position.z + this.normalToWall.z*this.position.z)
        }
    }
}

function createScene() {
    "use strict";
    
    scene = new THREE.Scene();
    scene.add(new THREE.AxesHelper(5));
    movingBall = new Ball(0,0,0)
    scene.add(movingBall);
    //scene.add(new Ball(1,0,0));
   /* scene.add(new Ball(2,0,0));
    scene.add(new Ball(3,0,0));
    scene.add(new Ball(0,0,0));
    scene.add(new Ball(0,0,0));
    scene.add(new Ball(0,0,0));
    scene.add(new Ball(0,0,0));
    scene.add(new Ball(0,0,0));
    scene.add(new Ball(0,0,0));*/
    scene.add(new Ring(0, 0, 0))
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

function createMovingPerspectiveCamera(index, x, y, z){
    "use strict";

    cameras[index] = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, 1000);
    cameras[index].position.set(0, 10, -15);
    cameras[index].lookAt(movingBall.position);
    movingBall.add(cameras[index]);

}

function onResize() {
    "use strict";
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    var sizes = calcCameraSize();
    var width = sizes[0];
    var height = sizes[1];

    resizeCameraOrtographic(0, width, height);
    resizeCameraPerspective(1);
    resizeCameraPerspective(2);
}

function resizeCameraOrtographic(index, width, height) {
    "use strict";

	cameras[index].left = - width / 2;
	cameras[index].right = width / 2;
	cameras[index].top = height / 2;
	cameras[index].bottom = - height / 2;
    cameras[index].updateProjectionMatrix();

}function resizeCameraPerspective(index) {
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
    createPerspectiveCamera(1, WALL_WIDTH(1), WALL_WIDTH(1), WALL_WIDTH(1));
    createMovingPerspectiveCamera(2, WALL_WIDTH(1), WALL_WIDTH(1), WALL_WIDTH(1));

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

    balls.forEach(function(ball, index, balls) {
        var wallColision = ring.checkCollision(ball);
        //console.log("wallcolii", wallColision)
        for (var j = index + 1; j < balls.length; j++) {
            ball.checkCollision(balls[j]);
        }
        if (wallColision != -1) {
           // console.log("WALL COLISION")
            //ball.newVelocity(wallColision);
            //ball.animate(timeDiff);
        } else {
           // ball.updateOldPosition();
        }
    })
    

    render();

    requestAnimationFrame(animate);
}
