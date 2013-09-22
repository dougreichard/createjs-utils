var stage;
function init() {
    stage = new createjs.Stage("demoCanvas");

   var green = new window.spriteLib.GreenBall();
   green.y = 100;
   green.x = 100;
   stage.addChild(green);
    green.gotoAndPlay('bounce');
    
    var blue = new window.spriteLib.BlueBall();
   blue.y = 100;
   blue.x = 300;
   stage.addChild(blue);
    blue.gotoAndPlay('roll');


  var red = new window.spriteLib.RedBall();
   red.y = 100;
   red.x = 500;
   stage.addChild(red);
    red.gotoAndPlay('bounce');
    
    
    createjs.Ticker.setFPS(60);
    createjs.Ticker.addEventListener("tick", tick);
}

function tick(event) {
    stage.update(event);
}
