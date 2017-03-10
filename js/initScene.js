// Global variables
var canvas, engine, scene, camera = 0;	//engine draw the game scene on canvas, scene will contains game elements
var numberOfRoads = 5;			//number of the roads that player can use
var life = 3;					//number of lives of player
var previous_life = 3;			//support variable, used to control if lives are changed
var score = 0;					//score of player
var previous_score = 0;			//support variable, used to control if score is changed
var enemy_model = [];			//model used to create an enemy
var player_model;				//model used to create the player
var shot_model;					//model used to create a bullet

var enemies = [];				//this array contains all enemies alive on roads
var roadPosition = [];			//index i contains position.x coordinates of ith road 
var realPositionPlayer = [];	//due to prospective, position of player is not precisely centered on the roadPosition
var realPositionBullet = [];	//due to prospective, position of bullet is not precisely centered on the roadPosition
var playerRoadPosition;			//contains the current index of the player position (used for realPositionPlayer/realPositionBullet)
var player;						//model of the player
var bullet;						//model of the bullet
var start = false;				//boolean used to deal with starting game
var end = false;				//boolean used to deal with ending game
var timeout;					//timer used to create every "creationSeconds" seconds
var creationRate;				//support timer of timeout
var creationSeconds;			//rate of setInterval function "timeout", used for creation of enemies
var speedRate;					//rate of the speed of the enemy movement
var rateUpdate;					//timer used to increment rates every 10 seconds
var createEnemy;				//function that creates enemy


// Adding keyboard event listener
window.addEventListener('keydown', onKeyDown);


//with this listener we load the scene when the canvas is fully loaded, then check if babylon engine is supported or not.
document.addEventListener('DOMContentLoaded', function () {
    if (BABYLON.Engine.isSupported()) {
        initScene();
        createLandscape();
        createRoads();
    }
}, false);
	
	/****************************************************************
	*  Creation of BABYLON Engine and Initialization of the scene	*
	****************************************************************/

function initScene() {
    // Get canvas
    canvas = document.getElementById('canvas');

    // Create Babylon engine
    engine = new BABYLON.Engine(canvas, true);

    // Create scene
    scene = new BABYLON.Scene(engine);

    // Create the camera, we need only 1 camera to display the game
    camera = new BABYLON.FreeCamera('camera', new BABYLON.Vector3(0,4,-2), scene);
    camera.attachControl(canvas);

    //in this way camera motion with keys is disabled
	camera.keysUp    = [];
	camera.keysDown  = [];
	camera.keysLeft  = [];
	camera.keysRight = [];

	// Create 1 pointlight and 1 directional light
	var pointLight = new BABYLON.PointLight('light', new BABYLON.Vector3(-1,4,4), scene);
	var directionalLight = new BABYLON.DirectionalLight("Dir0", new BABYLON.Vector3(0, -5, 0), scene);
	speedRate = 0.7;
	creationSeconds = 1000;
	
	
	//this function updates the rate of the enemies speed and creation every 10s 
	rateUpdate=function () {
		if(speedRate<=1.6)
			speedRate += 0.1;
		 if(creationSeconds>500){
			creationSeconds -= 50;
		}
		clearInterval(creationRate);
		creationRate = setInterval(createEnemy, creationSeconds);
		//console.log(creationSeconds);
	};		
	setInterval(rateUpdate, 10000);
	// Render the Scene


  	engine.runRenderLoop(function () {
       scene.render();
        if(previous_life!=life && life >= 0) {
	        previous_life--;
			switch (life) {
        		case 0: 
    	    		$("#life").attr("src","./others/lives/0life.png");
	            	break;
        		case 1:
	        		$("#life").attr("src","./others/lives/1life.png");
    	        	break;
        		case 2:
        			$("#life").attr("src","./others/lives/2lives.png");
        			break;
    		}
        }
        if(life < 0 || end){
			//console.log("partita terminata");
        	$("#life").text("0");
			$("#end1").text("GAME OVER");
			$("#end2").text("Press Enter to restart the game");
			clearInterval(timeout);
			clearInterval(rateUpdate);
			engine.stopRenderLoop();
		}
		if(previous_score!=score) {
	        previous_score = score;
    	    $("#score").text(""+previous_score);
        }
        enemies.forEach(function (enemy) {
			for(var i = 0;i<enemy.length;i++)
				enemy[i].position.z -= speedRate;
			//console.log(speedRate);
        });
		if(bullet!=null){
			bullet.position.z += 0.7;
        	killEnemies();
        }
    	cleanScreen();
    });
}

		/************************
		*  	Texture Landscape	*
		************************/

function createLandscape () {
	// Create box
    var skybox = BABYLON.Mesh.CreateBox('skyBox', 1000.0, scene);

    // Create sky
    var skyBoxMaterial = new BABYLON.StandardMaterial('skyBox', scene);
    skyBoxMaterial.backFaceCulling = false;
    skyBoxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyBoxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skyBoxMaterial.reflectionTexture = new BABYLON.CubeTexture('others/textures/landscape/sky', scene);
    skyBoxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;

    // Box + Sky
    skybox.material = skyBoxMaterial;
}


	/****************************************
	*  Initialization of Objects Elements	*
	****************************************/

function initGame() {
	createEnemies();
	createPlayer();
}


function createRoads(){
	var cameraPosition = numberOfRoads/2;
	var roadSpaces = 1.35;

  	// Set material of the road (texture)
    var ground = new BABYLON.StandardMaterial('ground', scene);
    var texture = new BABYLON.Texture('others/textures/ground.jpg', scene);
    texture.uScale = 300;
    texture.vScale = 0.5;
    ground.diffuseTexture = texture;

    var createRoad = function (id, position) {
        var road = BABYLON.Mesh.CreateBox('road'+id, 1, scene);
        road.scaling.y = 0.12;
        road.scaling.x = 1;
        road.scaling.z = 900;
        road.position.x = position;
        road.material = ground;
    };
	
    var currentRoadPosition = roadSpaces * -1 * (numberOfRoads/2);
    for (var i = 0; i<numberOfRoads; i++){
        roadPosition[i] = currentRoadPosition;
        if(i == Math.floor(cameraPosition))				//centering camera position
        	camera.position.x = currentRoadPosition;
        createRoad(i, currentRoadPosition);
        currentRoadPosition += roadSpaces;
 	}
 	

	//due to prospective, position of space ship seems wrong, so we adjust this position statically
	realPositionPlayer[0] = roadPosition[0] + 1;
	realPositionPlayer[1] = roadPosition[1] + 0.5;
	realPositionPlayer[2] = roadPosition[2];
	realPositionPlayer[3] = roadPosition[3] - 0.5;
	realPositionPlayer[4] = roadPosition[4] - 1;
	
	//the same for bullets
	realPositionBullet[0] = roadPosition[0] + 0.5;
	realPositionBullet[1] = roadPosition[1] + 0.25;
	realPositionBullet[2] = roadPosition[2];
	realPositionBullet[3] = roadPosition[3] - 0.25;
	realPositionBullet[4] = roadPosition[4] - 0.5;
	
}


function createEnemies(){
	//when user press longspace, camera is restored to default
	camera.dispose();
	camera = new BABYLON.FreeCamera('camera', new BABYLON.Vector3(roadPosition[2],4,-2), scene);
  	camera.setTarget(new BABYLON.Vector3(roadPosition[2],0,7.5));
    camera.attachControl(canvas);

	camera.keysUp    = [];
	camera.keysDown  = [];
	camera.keysLeft  = [];
	camera.keysRight = [];


	//import the enemy composed object, adjusting position of its part
	BABYLON.SceneLoader.ImportMesh('', 'others/enemy/', 'drone.babylon', scene, 
	function (meshes) {
        var m = [];
		for(var i = 0;i<meshes.length;i++){
			m[i] = meshes[i];
			m[i].isVisible = false;
			m[i].rotation.y = 0;

		}	        

		m[0].scaling = new BABYLON.Vector3(0.20,0.20,0.20);
		m[1].scaling = new BABYLON.Vector3(0.20,0.20,0.20);
		m[2].scaling = new BABYLON.Vector3(0.10,0.10,0.10);
		m[3].scaling = new BABYLON.Vector3(0.5,0.5,0.5);
		m[4].scaling = new BABYLON.Vector3(0.45,0.45,0.45);
				
		m[0].position = new BABYLON.Vector3(+0.3, 2.1, 1.2);		//Right antenna
		m[1].position = new BABYLON.Vector3(-0.3, 2.1, 1.2);		//Left antenna
 		m[2].position = new BABYLON.Vector3(0, 1, 0.5);				//Red Sphere
		m[3].position = new BABYLON.Vector3(0, 1, 1);				//Enemy Body 
		m[4].position = new BABYLON.Vector3(+0.35, 0.43, 1.2);		//Back engines

        enemy_model = m;		//here a model is created
    });

	createEnemy = function () {
        var posZ = 250;
        var position = Math.floor(Math.random() * numberOfRoads);
        var posX = roadPosition[position];
        var enemy = [];
		for(var i = 0; i<enemy_model.length;i++){			
	        // Create a clone of the template
	        enemy[i] = enemy_model[i].clone(enemy_model[i].name);
	        enemy[i].id = enemy_model[i].name + (enemies.length + 1);
   	 		enemy[i].isVisible = true;
        	enemy[i].position.x+= posX;
        	enemy[i].position.z+= posZ;
			enemy[i].road = position;
    	}
    	enemies.push(enemy);
	}
    // This function adds a new enemy every 1s
    creationRate = setInterval(createEnemy, 1000);
}


function createPlayer(){
	var initialPosition = 2;
	//create player
    BABYLON.SceneLoader.ImportMesh('', 'others/player/', 'player.babylon', scene, function (meshes) {
		player = meshes[0];
		player.position = new BABYLON.Vector3(1,3.1,4.1);
		player.isVisible = true;
		player.scaling = new BABYLON.Vector3(0.15,0.15,0.15);
		player.position = new BABYLON.Vector3(roadPosition[initialPosition], 2, 1.5);
		playerRoadPosition = initialPosition;
    });	

    //create bullet
    BABYLON.SceneLoader.ImportMesh('', 'others/bullet/', 'bullet.babylon', scene, function (meshes) {
        var shot = meshes[0];
        shot.isVisible = false;
        shot.scaling = new BABYLON.Vector3(0.3,0.1,0.3);
        shot.position = new BABYLON.Vector3(2, 2, 2);
        shot_model = shot;
    });
}


function onKeyDown(event) {
    var currentKey = -1;

    switch (event.keyCode) {
    	case 13: //'enter'	
    		if(life < 0 || end)
    			location.assign(location.href);
    		break;
        case 37: //'left arrow'
            currentKey = 0;
            break;
        case 39: //'right arrow'
            currentKey = 1;
            break;
        case 32: //'longspace'
            if(!start){
            	$("#start").text("");
				initGame();
				var twoMinutes = 60 * 2;
				display = document.querySelector('#time');
				startTimer(twoMinutes, display);
				start = true;
				currentKey = -1;
			}
			else
				currentKey = 2;
            break;
    }

    if (currentKey != -1) {
        animate(currentKey);
    }
}

function animate(key) {
    // Get the initial position of our player
    var positionPlayer = player.position.x;

    // Create the animation object
    var animatePlayer = new BABYLON.Animation('animatePlayer','position.x',60,BABYLON.Animation.ANIMATIONTYPE_FLOAT,BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE);

    // Animation keys
    var keys = [];
    var newPosition;
    switch (key) {
        case 0: //'left move'
        	if(playerRoadPosition!=0){
        		playerRoadPosition--;
            	keys.push({frame: 0,value: positionPlayer},{frame: 10,value: realPositionPlayer[playerRoadPosition]});
        	}
        	else
        		return;
            break;
        case 1: //'right move'
            if(playerRoadPosition!=4){
	            playerRoadPosition++;
	            keys.push({frame: 0,value: positionPlayer},{frame: 10,value: realPositionPlayer[playerRoadPosition]});
        	}
        	else
        		return;
            break;
        case 2: //'shot'
	        if(bullet==null)
	        	shot();
        	return;
    }
	
    // Add keys to the animation
    animatePlayer.setKeys(keys);

    // Link the animation to the Mesh
    player.animations.push(animatePlayer);

    // Run the animation
    scene.beginAnimation(player, 0, 10, false, 1);
}

function shot(){
	$("body").append('<audio autoplay><source src="./others/sounds/LaserBlaster.mp3"' + 
	'type="audio/mpeg"> Your browser does not support the audio tag.</audio>');

	var posZ = 3;
    var posX = realPositionBullet[playerRoadPosition];
	
    bullet = shot_model.clone(shot_model.name);
    bullet.isVisible = true;
    bullet.position = new BABYLON.Vector3(posX, 1, posZ);
	bullet.road = playerRoadPosition;
}

// We want to delete all the enemies behind the camera
function cleanScreen () {
    for (var n = 0; n < enemies.length; n++) {
    	if(enemies[n][3].position.z < 3) {
    		if(enemies[n][3].position.x == roadPosition[playerRoadPosition]){
	    		life--;
	    		//console.log("vita decrementata");
	    	}
			else{
				//console.log("nemico non ucciso");
				// Decrease score
	        	score -= 20;
			}
	        // Destroy the clone	
	   		for(var i = 0; i<enemy_model.length;i++)		
   				enemies[n][i].dispose();
   	        enemies.splice(n, 1);
   	        n--;	
        }
    }
   	if(bullet!=null)
		if(bullet.position.z > 110){
			bullet.dispose()
	        bullet = null;
		}
}

function killEnemies() {
    for (var j = 0; j < enemies.length; j++) {	
	    if(bullet!=null){
	    	if(bullet.road == enemies[j][3].road){
		    	if(((enemies[j][3].position.z - 3) < bullet.position.z)){
					//console.log("nemico ucciso");
					score+=100;
					// Destroy the clone
					animationDead(j);
					scalingDead(j);
	   		        enemies.splice(j, 1);
	    	        j--;
	        	    bullet.dispose()
	            	bullet = null;	
					
				}
			}
		}
	}
}

function animationDead(pos){
	var positionEnemy;	
	var animateEnemy;
	var keys;
	var newPosition;

	for(var i = 0;i<enemy_model.length;i++){
	
	    /****************************
    	*	Animation Position.x	*
    	****************************/

		// Get the initial position of our Mesh
	    positionEnemy = enemies[pos][i].position.x;
	    // Create the animation object
	    animateEnemy = new BABYLON.Animation('animateEnemy','position.x',60,BABYLON.Animation.ANIMATIONTYPE_FLOAT,BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE);

	    keys = [];
	    if(Math.floor(Math.random()*10)<5)
	   		newPosition = positionEnemy+(Math.floor((Math.random() * 4))/10);
		else
			newPosition = positionEnemy-(Math.floor((Math.random() * 4))/10);
	
    	keys.push({frame: 0,value: positionEnemy},{frame: 10,value: newPosition});
    
    	// Add keys to the animation
    	animateEnemy.setKeys(keys);

    	// Link the animation to the Mesh
    	enemies[pos][i].animations.push(animateEnemy);

    	// Run the animation
    	scene.beginAnimation(enemies[pos][i], 0, 10, false, 1);

    	/****************************
    	*	Animation Position.y	*
    	****************************/


		// Get the initial position of our Mesh
	    positionEnemy = enemies[pos][i].position.y;
	    // Create the animation object
	    animateEnemy = new BABYLON.Animation('animateEnemy','position.y',60,BABYLON.Animation.ANIMATIONTYPE_FLOAT,BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE);

    	keys = [];
		newPosition;
    	if(Math.floor(Math.random()*10)<5)
		    newPosition = positionEnemy+(Math.floor((Math.random() * 4))/10);
		else
			newPosition = positionEnemy-(Math.floor((Math.random() * 4))/10);
	
  	  	keys.push({frame: 0,value: positionEnemy},{frame: 10,value: newPosition});
    
	    // Add keys to the animation
	    animateEnemy.setKeys(keys);

	    // Link the animation to the Mesh
	    enemies[pos][i].animations.push(animateEnemy);

    	// Run the animation
    	scene.beginAnimation(enemies[pos][i], 0, 10, false, 1);
    
    	/****************************
    	*	Animation Position.z	*
    	****************************/
    
    	// Get the initial position of our Mesh
    	positionEnemy = enemies[pos][i].position.z;
    	// Create the animation object
    	animateEnemy = new BABYLON.Animation('animateEnemy','position.z',60,BABYLON.Animation.ANIMATIONTYPE_FLOAT,BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE);

    	keys = [];
		newPosition;
	
		if(Math.floor(Math.random()*10)<5 && i!=2)
		    newPosition = positionEnemy+(Math.floor((Math.random() * 4))/10);
		else
			newPosition = positionEnemy-(Math.floor((Math.random() * 4))/10);
		    
	    keys.push({frame: 0,value: positionEnemy},{frame: 10,value: newPosition});
    
	    // Add keys to the animation
	    animateEnemy.setKeys(keys);

    	// Link the animation to the Mesh
    	enemies[pos][i].animations.push(animateEnemy);

    	// Run the animation
    	scene.beginAnimation(enemies[pos][i], 0, 10, false, 1);
	}
}


function scalingDead(pos){
	var positionEnemy;	
	var animateEnemy;
	var keys;
	var newPosition;

	for(var i = 0;i<enemy_model.length;i++){
			
    	/****************************
    	*	Animation Scaling.x		*
    	****************************/

		// Get the initial position of our Mesh
	    positionEnemy = enemies[pos][i].scaling.x;
	    // Create the animation object
	    animateEnemy = new BABYLON.Animation('animateEnemy','scaling.x',60,BABYLON.Animation.ANIMATIONTYPE_FLOAT,BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE);

	    keys = [];
	
    	keys.push({frame: 0,value: positionEnemy},{frame: 30,value: 0});
    
    	// Add keys to the animation
    	animateEnemy.setKeys(keys);

    	// Link the animation to the Mesh
    	enemies[pos][i].animations.push(animateEnemy);

    	// Run the animation
    	scene.beginAnimation(enemies[pos][i], 0, 30, false, 1);


    	/****************************
    	*	Animation Scaling.y		*
    	****************************/


		// Get the initial position of our Mesh
	    positionEnemy = enemies[pos][i].scaling.y;
	    // Create the animation object
	    animateEnemy = new BABYLON.Animation('animateEnemy','scaling.y',60,BABYLON.Animation.ANIMATIONTYPE_FLOAT,BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE);

    	keys = [];
    	keys.push({frame: 0,value: positionEnemy},{frame: 30,value: 0});
    
	    // Add keys to the animation
	    animateEnemy.setKeys(keys);

	    // Link the animation to the Mesh
	    enemies[pos][i].animations.push(animateEnemy);

    	// Run the animation
    	scene.beginAnimation(enemies[pos][i], 0, 30, false, 1);
    
    
       	/****************************
    	*	Animation Scaling.z		*
    	****************************/
    
    	// Get the initial position of our Mesh
    	positionEnemy = enemies[pos][i].scaling.z;
    	// Create the animation object
    	animateEnemy = new BABYLON.Animation('animateEnemy','scaling.z',60,BABYLON.Animation.ANIMATIONTYPE_FLOAT,BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE);

    	keys = [];
	
		if(Math.floor(Math.random()*10)<5)
		    newPosition = positionEnemy+(Math.floor((Math.random() * 4))/10);
		else
			newPosition = positionEnemy-(Math.floor((Math.random() * 4))/10);
		    
    	keys.push({frame: 0,value: positionEnemy},{frame: 30,value: 0});
    
	    // Add keys to the animation
	    animateEnemy.setKeys(keys);

    	// Link the animation to the Mesh
    	enemies[pos][i].animations.push(animateEnemy);

    	// Run the animation
    	scene.beginAnimation(enemies[pos][i], 0, 30, false, 1);
	}
}

function startTimer(duration, display) {
    var start = Date.now(),
        diff,
        minutes,
        seconds;
    function timer() {
        if(seconds == 0 && minutes == 0){ 
			//console.log("partita terminata");
			end = true;
			$("#time").text("00:00");
		}
		else{
			// get the number of seconds that have elapsed since 
	        // startTimer() was called
   	     	diff = duration - (((Date.now() - start) / 1000) | 0);	

        	// does the same job as parseInt truncates the float
        	minutes = (diff / 60) | 0;
        	seconds = (diff % 60) | 0;

        	minutes = minutes < 10 ? "0" + minutes : minutes;
        	seconds = seconds < 10 ? "0" + seconds : seconds;

        	display.textContent = minutes + ":" + seconds; 

        	if (diff <= 0) {
            	// add one second so that the count down starts at the full duration
           		// example 05:00 not 04:59
        	    start = Date.now() + 1000;
        	}
    	}
    };

    // we don't want to wait a full second before the timer starts
    timer();
    timeout = setInterval(timer, 1000);
}

