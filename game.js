var canvas 	= document.getElementById("canvas"), 
	ctx 	= canvas.getContext("2d");

var colors    = ["#76ff03", "#00e5ff", "white", "#d500f9", "#ffff00", "#ff3d00"];

//setup 2d array to hold ball colors
var gameColor = new Array(15);
for (var i=0; i<15; i++) {
	gameColor[i] = new Array(42);
}

//setup 3d array to hold ball locations
var ballLocations = new Array(15);
for (var i=0; i<15; i++) {
	ballLocations[i] = new Array(42);
	for (var a=0; a<42; a++) {
		ballLocations[i][a] = new Array(2);
	}
}

var xStart 	   = 12, 
	yStart 	   = canvas.height-10,
	ballRadius = 8;

var left  = false, 
	right = false, 
	space = false;

var arrStartX = canvas.width/2,
	arrStartY = (ballRadius*2)+10, 
	playerStartX = canvas.width/2, 
	playerStartY = ballRadius;


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
	ctx.closePath;
}

function game_ball_draw(color) {
	ctx.beginPath();
	ctx.arc(playerStartX, playerStartY, ballRadius, 0, Math.PI*2);
	ctx.fillStyle = color;
	ctx.fill();
	ctx.closePath;
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
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	game_ball_draw(playerColor);
	arrow_draw(arrStartX, arrStartY);
	//15 high by 42 accross
	for (var a=0; a<15; a++) {
		if (a==0) {
			yStart = canvas.height-10;
		}
		for (var b=0; b<42; b++) {
			ballLocations[a][b][0] = xStart;
			ballLocations[a][b][1] = yStart;
			balls_draw(xStart, yStart, gameColor[a][b]);
			xStart += ballRadius*2;
		}
		xStart = 12;
		yStart -= ballRadius*2;
	}

	if (right) {
		arrStartX+=3;
		playerStartX+=3;
	} else if (left) {
		arrStartX-=3;
		playerStartX-=3;
	}

	//collision detection
	if (space) {
		if (!detect_collision()) {
			setInterval(function(){
				playerStartY += 5;
			}, 100);
		} else if (detect_collision()) {
			playerStartY += 0;
		}
	}
}

function detect_collision(x, y) {
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

setInterval(draw, 10);