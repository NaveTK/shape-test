function setup() {
  createCanvas(windowWidth, windowHeight);
  this.shapes = [];
  var vertices = [];
  var total = random(10, 15);
  for (var i = 0; i < total; i++) {
    var angle = map(i, 0, total, 0, TWO_PI);
    var r = random(150, 200);
    vertices.push(createVector(r * cos(angle), r * sin(angle)));
  }
  this.shapes.push(new Shape(vertices));
  
  this.heading = random(0, TWO_PI);
  this.stampHeading = random(0, TWO_PI);
  
  vertices = [];
  for (var i = 0; i < TWO_PI; i += TWO_PI / 10) {
    vertices.push(createVector(30 * cos(i), 30 * sin(i)));
  }
  this.stampShape = new Shape(vertices);
  colorMode(HSB);
}

function draw() {
  background(0);
  stroke(255);
  strokeWeight(1);
  noFill();
  push();
  translate(windowWidth/2, windowHeight/2);
  rotate(this.heading);
  for (var i = 0; i < this.shapes.length; i++) {
    fill((i*45)%360, 100, 100);
    this.shapes[i].draw();
  }
  pop();
  push();
  translate(mouseX, mouseY);
  rotate(this.stampHeading);
  this.stampShape.draw();
  pop();
}

function mousePressed() {
  if (mouseButton == LEFT) {
    for (var i = this.shapes.length - 1; i >= 0; i--) {
      var newShapes = this.shapes[i].sub(createVector(windowWidth/2, windowHeight/2), this.heading, createVector(mouseX, mouseY), this.stampHeading, this.stampShape);
      for(j = 0; j < newShapes.length; j++) {
        if(newShapes[j] !== undefined){
          this.shapes.push(new Shape(newShapes[j]));
        }
      }
    }
  }
}

function mouseWheel() {
  var vertices = [];
  var total = random(10, 15);
  for (var i = 0; i < total; i++) {
    var angle = map(i, 0, total, 0, TWO_PI);
    var r = random(20, 40);
    vertices.push(createVector(r * cos(angle), r * sin(angle)));
  }
  this.stampShape = new Shape(vertices);
}