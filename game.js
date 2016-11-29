const CANVAS_H = 580, CANVAS_W = 680, 
  PLAYER_SPEED = 3, BALL_RADIUS = 8, BALL_SPEED = 6,
  GRID_ROWS = 14, GRID_COLS = 42,
  colors = ["#76ff03", "#00e5ff", "#fff", "#d500f9", "#ffff00", "#ff3d00"],
  c = document.getElementById("canvas"),
  ctx = c.getContext("2d");
  // define player and his ball
var player = {
    x: CANVAS_W * 0.5, y: CANVAS_H * 0.05,
    h: CANVAS_H * .10, w: CANVAS_W * 0.01,
    speed: PLAYER_SPEED
  },
  ball = new Ball(player.x,player.y+player.h), ballArray = [], shooted = false;
// balls builder
function Ball(x, y) {
  this.x = x;
  this.y = y;
  this.r = BALL_RADIUS;
  this.color = colors[Math.floor(Math.random() * colors.length)];
}
// populate an array of balls with the coordinates for placement on canvas
function createBallArray(){
  var ballX = 12,
    ballY = CANVAS_H + (BALL_RADIUS) - GRID_ROWS*(BALL_RADIUS*2);
  for(var i = 0; i < GRID_ROWS*GRID_COLS;i++){
    ballArray.push(new Ball(ballX, ballY));
    ballX += BALL_RADIUS*2;
    if(ballX > CANVAS_W - BALL_RADIUS){
      ballX = 12; ballY += BALL_RADIUS*2;
    }
  }
}
createBallArray();
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
  document.addEventListener("keyup", this.keyup.bind(this));
}
KeyListener.prototype.isPressed = function (key) {
  return this.pressedKeys[key] ? true : false;
};
KeyListener.prototype.addKeyPressListener = function (keyCode, callback) {
  document.addEventListener("keypress", function (e) {
    if (e.keyCode == keyCode) callback(e);
  });
};
var keys = new KeyListener();
// check for the distance between radiuses, if collision => check color, if matches => destroy
function collisionCheck(){
  for(var i = 0; i < ballArray.length; i++){
    var dist = Math.sqrt(Math.pow(ballArray[i].x - ball.x,2)+Math.pow(ballArray[i].y - ball.y,2));
    if (dist<(ballArray[i].r + ball.r)){
      if(ballArray[i].color === ball.color)
        ballArray.splice(i, 1);
      return true;
    }
  }
  return false;
}
// calculate where stuff is
function move() {
  if ((keys.isPressed(65) || keys.isPressed(37)) && player.x - player.w > + 6){
    player.x -= player.speed; if(!shooted){ball.x -= player.speed;} // LEFT && A    
  }
  if ((keys.isPressed(68) || keys.isPressed(39)) && player.x + player.w < CANVAS_W-6){
    player.x += player.speed; if(!shooted){ball.x += player.speed;} // RIGHT && D    
  }
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
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  // draw player
  ctx.fillStyle = "#fff";
  ctx.fillRect(player.x-player.w/2, player.y, player.w, player.h);
  // draw player ball
  ctx.fillStyle = ball.color;
  ctx.beginPath();
  ctx.arc(ball.x,ball.y,ball.r,0,2*Math.PI);
  ctx.fill();
  // draw balls
  for(var i = 0; i < ballArray.length; i++){
    ctx.fillStyle = ballArray[i].color;
    ctx.beginPath();
    ctx.arc(ballArray[i].x,ballArray[i].y,ballArray[i].r,0,2*Math.PI);
    ctx.fill();
  }
}
function loop() {
  move();
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);