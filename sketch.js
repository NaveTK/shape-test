function setup() {
  createCanvas(windowWidth, windowHeight);
  this.shapes = [];
  var vertices = [];
  var total = random(10, 15);
  for (var i = 0; i < total; i++) {
    var angle = map(i, 0, total, 0, TWO_PI);
    var r = random(60, 80);
    vertices.push(createVector(r * cos(angle), r * sin(angle)));
  }
  this.shapes.push(new Shape(vertices));
  this.debris = [];
  
  this.heading = random(0, TWO_PI);
  this.stampHeading = random(0, TWO_PI);
  
  vertices = [];
  for (var i = 0; i < TWO_PI; i += TWO_PI / 10) {
    var r = 20 + random(10);
    vertices.push(createVector(r * cos(i), r * sin(i)));
  }
  this.stampShape = new Shape(vertices);
  colorMode(HSB);
  
  this.startPoint = createVector(0, 0);
  this.endPoint = createVector(0, 0);
  this.intersectionPoints = [];
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
    this.shapes[i].draw();
  }
  
  for( i = 0; i < this.debris.length; i++) {
    stroke(0, 100, 100);
    noFill();
    if (!this.debris[i].draw()) {
      this.debris.splice(i--, 1);
    }
  }
  
  push();
  strokeWeight(5);
  for( i = 0; i < this.intersectionPoints.length; i++) {
    point(this.intersectionPoints[i].x, this.intersectionPoints[i].y);
  }
  pop();
  pop();
  /*
  translate(mouseX, mouseY);
  rotate(this.stampHeading);
  this.stampShape.draw();
  */
  line(this.startPoint.x, this.startPoint.y, this.endPoint.x, this.endPoint.y);
}

function mousePressed() {
  if (mouseButton == LEFT) {
    this.shapes.splice(1, this.shapes.length - 1);
    this.debris = [];
    this.startPoint = createVector(mouseX, mouseY);
    this.endPoint = createVector(mouseX, mouseY);
  }
}

function mouseDragged() {
  if (mouseButton == LEFT) {
    this.endPoint = createVector(mouseX, mouseY);
    this.intersectionPoints = this.shapes[0].intersections(p5.Vector.sub(this.startPoint, createVector(windowWidth/2, windowHeight/2)).rotate(-this.heading), p5.Vector.sub(this.endPoint, this.startPoint).heading()-this.heading);
  }
}

function mouseReleased() {
  if (mouseButton == LEFT) {
    this.intersectionPoints = this.shapes[0].intersections(p5.Vector.sub(this.startPoint, createVector(windowWidth/2, windowHeight/2)).rotate(-this.heading), p5.Vector.sub(this.endPoint, this.startPoint).heading()-this.heading);
    if(this.intersectionPoints.length > 0) {
      var impact = this.intersectionPoints[0].copy().rotate(this.heading);
      impact.add(createVector(windowWidth/2, windowHeight/2));
      var newShapes = this.shapes[0].sub(createVector(windowWidth/2, windowHeight/2), this.heading, impact, this.stampHeading, this.stampShape);
      this.shapes.splice(0, 1);
      if(newShapes[0].length == 1) {
        newShapes[0] = newShapes[0][0].splitAtWeakestPoint();
      }
      newShapes = Shape.makeAsteroidSized(newShapes);
      for(j = 0; j < newShapes[0].length; j++) {
        this.shapes.push(newShapes[0][j]);
      }
      
      this.debris = newShapes[1];
      for( j = 0; j < this.debris.length; j++) {
        this.debris[j].breakAnime();
      }
      /*
      for(j = 0; j < newShapes[1].length; j++) {
        this.debris.push(newShapes[1][j]);
      }
      */
    }
  }
}
