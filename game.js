const CANVAS_H = 580, CANVAS_W = 680,
    PLAYER_SPEED = CANVAS_W * 0.4,//this way it will always take the player a little over 2 seconds to travel the width of the canvas no matter what size the canvas is
    BALL_RADIUS = 8,
    BALL_SPEED = CANVAS_H * 0.75,//takes almost 1 second to travel the entire height of the canvas
    GRID_ROWS = 14, GRID_COLS = 42,
    colors = ["#76ff03", "#00e5ff", "#fff", "#d500f9", "#ffff00", "#ff3d00"],
    c = document.getElementById("canvas"),
    ctx = c.getContext("2d");

//KEYS
const K_A = 65, K_LEFT = 37,
    K_D = 68, K_RIGHT = 39,
    K_SPACE = 32;

// I liked ali's function for getting a random color - just gave it a new name
function getRandomColor() {
    return colors[Math.floor(Math.random() * colors.length)];
}

function Point(x,y){
    this.x = x;
    this.y = y;

    this.set = (x, y) => {
        this.x = x;
        this.y = y;
    }

    this.mag = () => {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }

    this.distanceTo = (other) => {
        //get the distance between this Point and another Point
        return new Point(other.x - this.x, other.y - this.y).mag();
    }

    this.getNormalized = () => {
        //returns a new Point that represents this Point when normalized
        return new Point(this.x, this.y).normalize();
    }

    this.normalize = () => {
        //normalizes this Point in place and returns 'this' for chaining
        let mag = this.mag();
        if (mag !== 0){
            this.x /= mag;
            this.y /= mag;
        }
        return this;
    }
}

function Player() {
    this.pos = new Point(
        CANVAS_W * 0.5,
        CANVAS_H * 0.05
    );
    this.width = CANVAS_W * 0.01;//always 1% of the width of the canvas
    this.height = CANVAS_H * 0.10;//always 10% of the height of the canvas
    this.speed = PLAYER_SPEED;
    this.balls = [];//store all the balls the player has shot - the player object is responsible for collision logic
    this.nextBall = new Ball(0,0,getRandomColor());//doesn't matter where it is right now because the player will update it every frame

    this.lastShot = 0;//will be set to Date.now after shooting
    this.shootSpeed = 0.5;//seconds between shots

    this.update = (timepassed) => {
        if (this.nextBall === null){
            this.lastShot += timepassed;
            if (this.lastShot >= this.shootSpeed){
                this.lastShot -= this.shootSpeed;
                this.nextBall = new Ball(0,0,getRandomColor());
            }
        }
        if ((keys.isPressed(K_A) || keys.isPressed(K_LEFT)) && this.pos.x - this.width > + 6){
            this.pos.x -= this.speed * timepassed;
            //if(!shooted){ball.x -= this.speed;} // LEFT && A
        }
        if ((keys.isPressed(K_D) || keys.isPressed(K_RIGHT)) && this.pos.x + this.width < CANVAS_W-6){
            this.pos.x += this.speed * timepassed;
            //if(!shooted){ball.x += this.speed;} // RIGHT && D
        }
        //update the position of nextBall before shooting it
        if (this.nextBall){
            this.nextBall.pos.x = this.pos.x + this.width * 0.5 - this.nextBall.radius * 0.5;
            this.nextBall.pos.y = this.pos.y + this.height;
        }
        if (keys.isPressed(K_SPACE)){
            //shoot
            if (this.nextBall !== null){
                this.nextBall.vel.set(0, 1);
                this.balls.push(this.nextBall);
                this.nextBall = null;
            }
        }

        this.balls.forEach( (ball) => {
            ball.update(timepassed);
        });
    }

    this.checkCollisions = (otherBalls) => {
        //this also checks for collisions with screen bounds in case balls will bounce or leave the screen
        let ball, other;
        for(let i = this.balls.length - 1; i > -1; i--){
            ball = this.balls[i];
            if (ball.pos.x - ball.radius > CANVAS_W || ball.pos.x + ball.radius < 0 || ball.pos.y - ball.radius < 0 || ball.pos.y + ball.radius > CANVAS_H){
                //the ball is completely off screen - destroy it
                //will change this laterl for testing for bounces
                this.balls.splice(i, 1);
                console.log('destroy ball');
                continue;
            }
            for (let j = otherBalls.length - 1; j > -1; j--){
                other = otherBalls[j];
                if (other.pos.distanceTo(ball.pos) <= ball.radius + other.radius){
                    console.log('hit');
                    //destroy both for now
                    this.balls.splice(i, 1);
                    otherBalls.splice(j, 1);
                    break;
                }
            }
        }
    }

    this.draw = () => {
        ctx.fillStyle = "#fff";
        ctx.fillRect(this.pos.x - this.width * 0.5, this.pos.y, this.width, this.height);
        if (this.nextBall){
            this.nextBall.draw();
        }

        this.balls.forEach( (ball) => {
            ball.draw(ctx);
        });
    }

}

// basic clock that will track how much time passes between frame - tick() should be called every frame
function Clock() {
    this.lastTick = Date.now();
    this.tick = () => {
        let now = Date.now()
        let delta = now - this.lastTick;
        this.lastTick = now;
        return delta;
    }
}

function Ball(x, y, color) {
    this.pos = new Point(x, y);
    this.vel = new Point(0, 0);//the velocity / trajectory of the ball - will need this especially when bouncing is implemented
    this.radius = BALL_RADIUS;
    this.color = color;
    this.speed = BALL_SPEED;

    this.update = (timepassed) => {
        this.pos.set(
            this.pos.x + this.vel.x * this.speed * timepassed,
            this.pos.y + this.vel.y * this.speed * timepassed
        );
    }

    //objects should be responsible for drawing themselves. helps keep things organized and cleans up the main draw function
    this.draw = () => {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2*Math.PI, true);
        ctx.closePath();
        ctx.fill();
    }
}

//random colors: colors[Math.floor(Math.random() * colors.length)]
// return an array of balls with the coordinates for placement on canvas
function createBallArray(){
    let ballArray = [];
    var ballX = 12,
        ballY = CANVAS_H + (BALL_RADIUS) - GRID_ROWS*(BALL_RADIUS*2);
    for(var i = 0; i < GRID_ROWS*GRID_COLS;i++){
        ballArray.push(new Ball(ballX, ballY, colors[Math.floor(Math.random() * colors.length)]));
        ballX += BALL_RADIUS*2;
        if(ballX > CANVAS_W - BALL_RADIUS){
            ballX = 12; ballY += BALL_RADIUS*2;
        }
    }
    return ballArray;
}

// this is our keypress function, just add keys.isPressed(*keynumber*) on move() to bind stuff to that keypress
function KeyListener() {
    this.pressedKeys = [];
    this.keydown = function (e) {
        this.pressedKeys[e.keyCode] = true;
    };
    this.keyup = function (e) {
        this.pressedKeys[e.keyCode] = false;
    };
    document.addEventListener("keydown", this.keydown.bind(this));
    document.addEventListener("keyup", this.keyup.bind(this))
}
KeyListener.prototype.isPressed = function (key) {
    return this.pressedKeys[key] ? true : false;
};
KeyListener.prototype.addKeyPressListener = function (keyCode, callback) {
    document.addEventListener("keypress", function (e) {
        if (e.keyCode == keyCode) callback(e);
    });
};
var keys = new KeyListener();//global KeyListener

/*
// check for the distance between radiuses, if collision => check color, if matches => destroy
function collisionCheck(){
    for(var i = 0; i < ballArray.length; i++){
        var dist = Math.sqrt(Math.pow(ballArray[i].x - ball.x,2)+Math.pow(ballArray[i].y - ball.y,2));
        if (dist<(ballArray[i].r + ball.r)){
            if(ballArray[i].color === ball.color) {
                ballArray.splice(i, 1);
            } else {
                ballArray.splice(i, 0, new Ball(ball.x, ball.y-3, ball.color));
            }
            return true;
        }
    }
    return false;
}

// calculate where stuff is
function move() {
    if(keys.isPressed(32))
        shooted = true;
    if(shooted){
        ball.y += BALL_SPEED;
        if(ball.y > CANVAS_W || collisionCheck()){
            shooted = false;
            ball.x = player.x; ball.y = player.y+player.h; ball.color = colors[Math.floor(Math.random() * colors.length)];
        }
    }
}

// draw stuff from move()
function draw() {
    // draw canvas
        // draw player
        // draw player ball
    ctx.fillStyle = ball.color;
    ctx.beginPath();
    ctx.arc(ball.x,ball.y,ball.r,0,2*Math.PI);
    ctx.fill();
    // draw balls
    ballArray.forEach( (ball) => {
        ball.draw();
    });
}

function loop() {
    move();
    draw();
    requestAnimationFrame(loop);
}
*/

function Game() {
    this.clock = null;
    this.player = new Player();
    this.ballArray = [];

    this.init = () => {
        this.clock = new Clock();
        this.player = new Player();
        this.ballArray = createBallArray();
    }

    this.update = () => {
        let timepassed = this.clock.tick() * 0.001,//convert milliseconds to seconds
            ball = null;
        this.player.update(timepassed);
        this.player.checkCollisions(this.ballArray);
    }

    this.draw  = () => {
        //clear canvas
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        //draw game objects
        this.player.draw();
        this.ballArray.forEach( (ball) => {
            ball.draw();
        });
    }

    this.loop = () => {
        this.update();
        this.draw();
        requestAnimationFrame(this.loop);
    }
}

var game = new Game();
game.init();
game.loop();
