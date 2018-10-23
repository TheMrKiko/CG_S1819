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
const WALL_BALL_RADIUS_SQUARED = (WALL_RADIUS +BALL_RADIUS) ** 2 ;
const NUM_BAllS = 10;
const ANGULAR_VELOCITY = Math.PI / 96;

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


    checkCollision(_) {

    }
}

const calcAngleToRotate = (vector) => {
    
    if (vector.x == 0 && vector.z == 0)  {
        return 0
    } else if ((vector.x >= 0 && vector.z >=0) || (vector.x <= 0 && vector.z >= 0)) {
        return Math.PI * 2 - vector.angleTo(X_AXIS);
    } else {
        return vector.angleTo(X_AXIS);
    }
}

class Ball extends Object3D {
    constructor(x, y, z) {
        super();

        this.addBall(0, 0, 0);
        this.add(new THREE.AxesHelper(BALL_RADIUS));
        this.radius = BALL_RADIUS;
        this.direction = new THREE.Vector3(Math.random() * 2 - 1, 0, Math.random() * 2 - 1).normalize();
        this.velocity = Math.random() * 30 + 10;
        this.oldPosition = new THREE.Vector3(x, y, z);
        this.position.set(x, y, z);
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

        this.position.add(this.direction.clone().multiplyScalar(this.velocity * timeDiff));
        
        this.setRotationFromAxisAngle(Y_AXIS, calcAngleToRotate(this.direction) + Math.PI / 2);

        this.getObjectByName("BallMesh").rotateX(timeDiff * this.velocity * ANGULAR_VELOCITY);
    }
    
    updatePosition() {
        if (this.collided) {
            this.position.set(this.oldPosition.x, this.oldPosition.y, this.oldPosition.z);
        } else {
            this.oldPosition = this.position.clone();
        }
        this.collided = false;
    }
    
    checkCollision(obj) {
        if (obj instanceof Ball) {
            if (this.position.distanceToSquared(obj.getCenterTo(this)) <= BALL_DIAMETER_SQUARED) {
                return true;
            }
            return false
        }
    }

    resolveCollision(obj) {
        [this.direction, obj.direction] = [obj.direction, this.direction];
        [this.velocity, obj.velocity] = [obj.velocity, this.velocity];
        this.collided = true;
        obj.collided = true;
    }

    checkCollisionWithAll() {
        for (var ball in balls){
            if (this.checkCollision(balls[ball])) {
                return true;
            }
        }
    }
    
    getCenterTo(obj) {
        if (obj instanceof Ball) {
            return this.position;
        }
    }
    
    checkWallCollision(wall) {
        var u2 = new THREE.Vector3()
        var union = this.getWorldPosition(u2).clone().sub(ring.ringWalls[wall].getWorldPosition(u2));
        var normalToWall = ring.normalVectorWalls[wall];
        var distance = union.projectOnVector(normalToWall);
        
        if (distance.dot(normalToWall) < 0 || distance.lengthSq() <= WALL_BALL_RADIUS_SQUARED) { //inside wall or already out of wal
            this.direction.reflect(normalToWall);
            this.collided = true;
            return true;
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

        this.normalVectorWalls = [new THREE.Vector3(0, 0, -1), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1,0,0)]

        this.radius = WALL_RADIUS;
        this.position.set(x, y, x);
        ring = this;
        }

    addWall(x, y, z, widthRatio, rotY) {
        "use strict";

        var wallMaterial = new THREE.MeshBasicMaterial({
            color: 0xfff05f,
            wireframe: true
        });
        var wallGeometry = new THREE.BoxGeometry(WALL_WIDTH(widthRatio), WALL_HEIGHT, 1);

        var wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);

        wallMesh.position.set(x, y, z);
        wallMesh.rotateY(rotY);
        this.add(wallMesh);
        return wallMesh;
    }

    checkCollision(ball) { //vai se a bola choca com cada parede
        for (var wallindex in this.ringWalls) {
            if (ball.checkWallCollision(wallindex)) {
                return true;
            }
        }
    }
}

function createScene() {
    "use strict";

    var numBalls = NUM_BAllS - 1;

    scene = new THREE.Scene();
    scene.add(new Ring(0, 0, 0))
    scene.add(new THREE.AxesHelper(5));
    movingBall = new Ball(0, 0, 0);

    balls.push(movingBall);
    scene.add(movingBall);

    while (numBalls) {
        var ball = new Ball(Math.random() * (WALL_WIDTH(2) - 2 * BALL_RADIUS) - (WALL_WIDTH(2) - 2 * BALL_RADIUS) / 2, 0, Math.random() * (WALL_WIDTH(1) - 2 * BALL_RADIUS) - (WALL_WIDTH(1) - 2 * BALL_RADIUS) / 2)
        if (!ball.checkCollisionWithAll()) {
            numBalls--;
            scene.add(ball);
            balls.push(ball);
        }
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
    
    var interval = setInterval(function() {
        balls.forEach(function(ball) {
            ball.velocity *= 1.2;
        })
    }, 20 * 1000)
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
        ring.checkCollision(ball);
        for (var j = index + 1; j < balls.length; j++) {
            if (ball.checkCollision(balls[j])) {
                ball.resolveCollision(balls[j]);
            }
        }
    })

    balls.forEach(function(ball) {
        ball.updatePosition();
    })
    

    render();

    requestAnimationFrame(animate);
}
