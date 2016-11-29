var canvas 	= document.getElementById("canvas"), 
	ctx 	= canvas.getContext("2d");
var colors    = ["#76ff03", "#00e5ff", "white", "#d500f9", "#ffff00", "#ff3d00"];

//some thoughts: I think defining the size of the ball and player should be relative to the
//canvas dimentions so that if we decide to change the canvas size then all the game objects
//scale with it
//
//could calculate the ball radius as BALL_RADIUS = (CANVAS_W / GRID_COLS) * 0.5 which will make the
//BALL_RADIUS always scale to be the right size to fill the canvas appropriately across the grid

//global constants 
var BALL_RADIUS = 8,
    GRID_ROWS = 15,
    GRID_COLS = 42,
    CANVAS_W = 680,
    CANVAS_H = 580,
    BALL_SPEED = 100,//pixels per second
    PLAYER_SPEED = 200;//pixels per second

var player = null,//the player
    gameObjects = [],//holds all the balls
    lastTick = 0;//used to track how much time passes between frames


//moved this stuff to the top for organization and clarity
var xStart = 12, 
    yStart = canvas.height-10,
    ballRadius = 8;

var left  = false, 
    right = false, 
    space = false;

var arrStartX = canvas.width/2,
	arrStartY = (ballRadius*2)+10, 
	playerStartX = canvas.width/2, 
	playerStartY = ballRadius;

//helper class for Vector2 maths
class Point{
    constructor(x, y){
        this.x = x;
        this.y = y;
    }

    magnitude(){
        //returns the magnitude / displacemnet of this Point
        return Math.Sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }

    normalized(){
        //returns this Point normalized as a new Point object
        let mag = this.magnitude();
        if (mag !== 0){
            return new Point(this.x/mag, this.y/mag);
        }
        return new Point(this.x, this.y);
    }

    normalize(){
        //normalize this Point in place and returns 'this' for chaining
        let mag = this.magnitude();
        if (mag !== 0){
            this.x = this.x/mag;
            this.y = this.y/mag;
        }
        return this;
    }
        

    static distance(A, B){
        //returns the distance between two Point objects
        return Math.sqrt(Math.pow((A.x - B.x),2) + Math.pow((A.y - B.y), 2));
    }

    static distance2(A, B){
        //returns the squared distance to save on expensive Math.sqrt if needed
        return (Math.pow((A.x - B.x), 2) + Math.pow((A.y - B.y), 2));
    }
}

class Ball{
    constructor(x, y, radius, color){
        this.position = new Point(x,y);
        this.radius = radius;
        this.color = color;//get random color
        this.speed = BALL_SPEED;//pixels per second
    }

    collidesPoint(point){
        return (Point.distance(this.position, point) <= this.radius);
    }

    collidesCircle(point, radius){
        let dst = Point.distance(this.position, point);
        return dst <= (this.radius + radius);
    }

    update(dt){

    }

    draw(ctx){
        ctx.beginPath();
        ctx.beginPath();
	ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI*2);
	ctx.fillStyle = this.color;
	ctx.fill();
	ctx.closePath();

    }
}

class Player{
    constructor(x, y, width, height){
        //draw assumes this position is the center of a rectangle
        this.position = new Point(x, y);
        //using a Point object to store the width and height
        this.size = new Point(width, height);
        this.color = '#fff';
        this.nextProjectileColor = color_randomizer();
        this.projectile = null;//this will be null until the player shoot, when the projectile is destroyed, thie will be set back to null and the player can fire again
    }
    //some quick references for treating this like a rectangle
    top(){
        return this.position.y;
    }
    bottom(){
        return this.position.y + this.size.y;
    }
    left(){
        return this.position.x - this.size.x * 0.5;
    }
    right(){
        return this.position.x + this.size.x * 0.5;
    }

    update(dt){ 
        let dir = 0;
        let x = player.position.x;
        if (left){
            dir -= 1
        }
        if (right){
            dir += 1
        } 
        //if left and right are down dir will go back to 0 and the player will not move

        x += dir * PLAYER_SPEED * dt;
        //keep the player in bounds of screen
        x = (x < 0) ? 0 : x;
        x = (x > CANVAS_W) ? CANVAS_W : x;

        player.position.x = x;

        //check to fire
        if (space){
            this.shoot();
        }
        if (this.projectile){
            //move the projectile down
            let pY = this.projectile.position.y;
            //using dt * speed assures that the projectile moves relative to time and not framerate
            this.projectile.position.y = pY + (dt * this.projectile.speed);
            //make sure its not off the screen, if so 'destroy' it
            if ((pY + this.projectile.radius) > CANVAS_H){
                this.projectile = null
            }
        }
        //would rather do this in a main update function controlled by the game but maybe later
        if (this.projectile !== null){
            for (let i = gameObjects.length - 1; i > -1; i--){
                let obj = gameObjects[i];
                if (obj.collidesCircle(this.projectile.position, this.projectile.radius)){
                    //the colors should match
                    if (this.projectile.color === obj.color){
                        gameObjects.splice(i, 1);
                        //get some points or something
                    }
                    this.projectile = null;
                }
            }
        }
    }

    shoot(){
        if (this.projectile === null){
            //create a new project Ball and give it the next color
            this.projectile = new Ball(this.position.x, this.bottom(), BALL_RADIUS, this.nextProjectileColor);
            //get a new color
            this.nextProjectileColor = color_randomizer();
        }
    }

    draw(ctx){
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.rect(this.left(), this.top(), this.size.x, this.size.y);
        ctx.fill();
        //draw the ball at the bottom of the player
        if (this.projectile === null){
            ctx.beginPath();
            ctx.arc(this.position.x, this.bottom(), BALL_RADIUS, 0, Math.PI*2);
            ctx.fillStyle = this.nextProjectileColor;
            ctx.fill(); 
        }
        else {
            this.projectile.draw(ctx);
        }
    }
}

//setup 2d array to hold ball colors
var gameColor = new Array(15);
for (var i=0; i<15; i++) {
	gameColor[i] = new Array(42);
}

//created function for initializing the balls
function initGrid(){
    //clear the existing gameObjects if any
    gameObjects = [];
    for (let y = 0; y < GRID_ROWS; y++){
        for (let x = 0; x < GRID_COLS; x++){
            let posX = (x * BALL_RADIUS * 2) + (BALL_RADIUS * 1.5);
            let posY = (CANVAS_H + BALL_RADIUS) - (y * BALL_RADIUS * 2);
            gameObjects.push(new Ball(posX, posY, BALL_RADIUS, color_randomizer()));
            console.log('create object');
        }
    }
}

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

for (var a=0; a<15; a++) {
	for (var b=0; b<42; b++) {
		gameColor[a][b] = color_randomizer();
	}
}

function color_randomizer() {
	var num = Math.floor(Math.random()*6);
	return colors[num];
}

function balls_draw(x, y, color) {
	ctx.beginPath();
	ctx.arc(x, y, ballRadius, 0, Math.PI*2);
	ctx.fillStyle = color; 
	ctx.fill(); 
	ctx.closePath();
}

function game_ball_draw(color) {
	ctx.beginPath();
	ctx.arc(playerStartX, playerStartY, ballRadius, 0, Math.PI*2);
	ctx.fillStyle = color;
	ctx.fill();
	ctx.closePath();
}

function arrow_draw(x, y) {
	ctx.beginPath();
	ctx.rect(x, y, 1, 50);
	ctx.fillStyle = "white";
	ctx.fill();
	ctx.closePath();
}

var playerColor = color_randomizer();

function draw() {
        let timepassed = (Date.now() - lastTick) * 0.001;
        player.update(timepassed);
	ctx.clearRect(0, 0, canvas.width, canvas.height);

        gameObjects.forEach( (ball) => {
            ball.draw(ctx);
        });
        player.draw(ctx);
    
        lastTick = Date.now();
}

function detect_collision(x, y) {
    if (playerBall !== null){
        //loop backwards through the gameObjects array so using slice will not cause index out of range
        for (let i = gameObjects.length - 1; i > -1; i--){
            if (gameObject.collidsCircle(playerBall.position, playerBall.radius)){
                //remove the ball and give the player a new ball
                gameObjects.slice(i, 1);
            }
        }
        //if gameObjects is empty the player wins?
        if (gameObject.length === 0){
            //just reinitialize the grid for testing
            initGrid();
        }
    }
    for (var a=0; a<15; a++) {
            for (var b=0; b<42; b++) {
            }
    }
}

function keyDownHandler(e) {
	if (e.keyCode == 39) {
		right = true;
	} else if (e.keyCode == 37) {
		left = true;
	} else if (e.keyCode == 32) {
		space = true;
	}
}

function keyUpHandler(e) {
	if (e.keyCode == 39) {
		right = false;
	} else if (e.keyCode == 37) {
		left = false;
	} else if (e.keyCode == 32) {
		space = false;
	}
}
//passing relative scales of the canvas size so the player size changes with the canvas
player = new Player(CANVAS_W * 0.5, CANVAS_H * 0.05, CANVAS_W * 0.01, CANVAS_H * .10);
initGrid();
//initialize lastTick so we will know how much time passes between frames
lastTick = Date.now();
setInterval(draw, 33);
