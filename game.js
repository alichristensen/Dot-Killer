const CANVAS_H = 580,
    CANVAS_W = 720,//680,
    PLAYER_SPEED = CANVAS_W * 0.33,//this way it will always take the player a little over 3 seconds to travel the width of the canvas no matter what size the canvas is
    BALL_RADIUS = 10,
    BALL_SPEED = CANVAS_H * 0.75,//takes almost 1 second to travel the entire height of the canvas
    GRID_ROWS = 14, GRID_COLS = 42,
    colors = ['blue', 'green', 'pink', 'red', 'white', 'yellow'],
    c = document.getElementById("canvas"),
    ctx = c.getContext("2d");

//KEYS
const KEY_A = 65, KEY_LEFT = 37,
    KEY_D = 68, KEY_RIGHT = 39,
    KEY_SPACE = 32;

function imgLoaded(imgID){
    colorMap[colorID].loaded = true;
}

//map color names to hex colors and images - colors can be used as a fallback if images don't load
var colorMap = {
    'blue': {hex: '#00e5ff', image: document.getElementById('blue')},
    'green': {hex: '#76ff03', image: document.getElementById('green')},
    'pink': {hex: '#d500f9', image: document.getElementById('pink')},
    'red': {hex: '#ff3d00', image: document.getElementById('red')},
    'white': {hex: '#fff', image: document.getElementById('white')},
    'yellow': {hex: '#ffff00', image: document.getElementById('yellow')}
}

// I liked ali's function for getting a random color - just gave it a new name
function getRandomColor() {
    //now returns a colorMap object
    return colorMap[colors[Math.floor(Math.random() * colors.length)]];
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
    //the grid of balls without padding between them cause collisions with two target balls
    //to favor the one with the lower [row][col] index - to help ease this we can try
    //to subtract one unit from the Ball radius so that it will a little more forgiving when shooting
    //down cooridors
    this.pos = new Point(
        CANVAS_W * 0.5,
        CANVAS_H * 0.05
    );

    this.width = CANVAS_W * 0.01;//always 1% of the width of the canvas
    this.height = CANVAS_H * 0.10;//always 10% of the height of the canvas
    this.speed = PLAYER_SPEED;
    this.balls = [];//store all the balls the player has shot - the player object is responsible for collision logic
    this.nextBallRadius = BALL_RADIUS - 2;//slightly reduce the players ball size
    this.nextBall = new Ball(0,0,getRandomColor());//doesn't matter where it is right now because the player will update it every frame
    this.nextBall.radius = this.nextBallRadius;

    this.lastShot = 0;//will be set to Date.now after shooting
    this.shootSpeed = 0.5;//seconds between shots

    this.update = (timepassed) => {
        if (this.nextBall === null){
            this.lastShot += timepassed;
            if (this.lastShot >= this.shootSpeed){
                this.lastShot -= this.shootSpeed;
                this.nextBall = new Ball(0,0,getRandomColor());
                this.nextBall.radius = this.nextBallRadius;
            }
        }
        if ((keys.isPressed(KEY_A) || keys.isPressed(KEY_LEFT)) && this.pos.x - this.width > + 6){
            this.pos.x -= this.speed * timepassed;
            //if(!shooted){ball.x -= this.speed;} // LEFT && A
        }
        if ((keys.isPressed(KEY_D) || keys.isPressed(KEY_RIGHT)) && this.pos.x + this.width < CANVAS_W-6){
            this.pos.x += this.speed * timepassed;
            //if(!shooted){ball.x += this.speed;} // RIGHT && D
        }
        //update the position of nextBall before shooting it
        if (this.nextBall){
            this.nextBall.pos.x = this.pos.x + this.width * 0.5 - this.nextBall.radius * 0.5;
            this.nextBall.pos.y = this.pos.y + this.height;
        }
        if (keys.isPressed(KEY_SPACE)){
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
        //should return and object {row: r, col: c} if collision detected otherwise return null
        let ball, other;
        let collisions = [];
        for(let i = this.balls.length - 1; i > -1; i--){
            ball = this.balls[i];
            if (ball.pos.x - ball.radius > CANVAS_W || ball.pos.x + ball.radius < 0 || ball.pos.y - ball.radius < 0 || ball.pos.y + ball.radius > CANVAS_H){
                //the ball is completely off screen - destroy it
                //will change this laterl for testing for bounces
                this.balls.splice(i, 1);
                console.log('destroy ball');
                continue;
            }
            for (let r = 0; r < otherBalls.length; r++){
                for (let c = 0; c < otherBalls[0].length; c++){
                    other = otherBalls[r][c];
                    if (other == null) continue;
                    if (ball.pos.distanceTo(other.pos) <= ball.radius + other.radius){
                        if (ball.color === other.color){
                            collisions.push({
                                row: r,
                                col: c
                            });
                        } else {
                            //should get this moved to the Game but have to rework - maybe send the Game object as a second parameter
                            //so the scores can be manipulated by calling certain functions for matching and non-matching color collisions
                            otherBalls[r][c] = null;
                        }
                        this.balls.splice(i, 1);
                        break;//break this loop - don't return in case there are move player balls
                    }
                }
            };
        }
        return collisions.length > 0 ? collisions : null;
    }

    this.draw = () => {
        ctx.fillStyle = "#fff";
        ctx.fillRect(this.pos.x - this.width * 0.5, this.pos.y, this.width, this.height);
        if (this.nextBall){
            if (this.nextBall.color.image.width > 0){//will be zero if it didnt load
                ctx.drawImage(
                    this.nextBall.color.image,
                    this.pos.x - this.nextBall.radius,
                    this.pos.y - this.nextBall.radius + this.height,
                    this.nextBall.radius * 2,
                    this.nextBall.radius * 2
                );
            } else {
                this.nextBall.draw();
            }
        }

        this.balls.forEach( (ball) => {
            if (ball.color.image.width > 0){
                ctx.drawImage(
                    ball.color.image,
                    ball.pos.x - ball.radius,
                    ball.pos.y - ball.radius,
                    ball.radius * 2,
                    ball.radius * 2
                );
            } else {
                ball.draw(ctx);
            }
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
        if (this.color.image.width > 0){
            ctx.drawImage(
                this.color.image,
                this.pos.x - this.radius,
                this.pos.y - this.radius,
                this.radius*2,
                this.radius*2
            );
            return;
        }
        ctx.fillStyle = this.color.hex;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2*Math.PI, true);
        ctx.closePath();
        ctx.fill();
    }
}

function createBallArray(){
    let ballArray = [],
        cols = CANVAS_W / (BALL_RADIUS * 2);
    let startX = BALL_RADIUS
    let startY = CANVAS_H - BALL_RADIUS;
    for (let r = 0; r < GRID_ROWS; r++){
        ballArray.push([]);
        for (let c = 0; c < cols; c++){
            ballArray[r][c] = new Ball(startX + BALL_RADIUS*2*c, startY - BALL_RADIUS*2*r, getRandomColor());
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

function Game() {
    this.clock = new Clock();
    this.player = new Player();
    this.ballArray = [[]];

    this.init = () => {
        this.clock = new Clock();
        this.player = new Player();
        this.ballArray = createBallArray();
    }

    this.update = () => {
        let timepassed = this.clock.tick() * 0.001,//convert milliseconds to seconds
            ball = null,
            collision = null;
        this.player.update(timepassed);
        collisions = this.player.checkCollisions(this.ballArray);
        if (collisions){
            collisions.forEach( (cell) => {
                this.destroyBall(cell.row, cell.col, this.ballArray[cell.row][cell.col].color);
            });
        }
    }

    this.destroyBall = (row, col, color) => {
        //destroy the ball at the col,row and check adjacent cells
        //this function can be called recursively
        if (this.ballArray[row][col] == null) return;
        if (this.ballArray[row][col].color !== color){
            //destroy the one ball and don't do neighbor checks
            this.ballArray[row][col] = null;
            return;
        }
        let neighbors = [];
        console.log('destroy - row: ' + row + ' col: ' + col);
        for (let r = -1; r <= 1; r++){
            if (r+row >= 0 && r+row < this.ballArray.length){
                for(let c = -1; c <= 1; c++){
                    if (c+col >= 0 && c+col < this.ballArray[0].length){
                        if (row+r === row && c === col+c) continue;
                        //if the grid cell is empty, continue
                        if (this.ballArray[r+row][c+col] == null || this.ballArray[r+row][c+col].color !== color) continue;
                        //otherwise add the row,col to neighbors list
                        console.log('add neighbor');
                        neighbors.push({
                            row: r+row,
                            col: c+col
                        })
                    }
                }
            }
        }
        this.ballArray[row][col] = null;//unreference ball in this array
        neighbors.forEach( (neighbor) => {
            this.destroyBall(neighbor.row, neighbor.col, color);
        })
    }

    this.draw  = () => {
        //clear canvas
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        //draw game objects
        this.player.draw();
        this.ballArray.forEach( (row) => {
            row.forEach( (ball) => {
                if (ball) ball.draw()
            });
        });
    }

    this.loop = () => {
        this.update();
        this.draw();
        requestAnimationFrame(this.loop);
    }
}

var game = new Game();
game.init();//can be called to reset the game
game.loop();
