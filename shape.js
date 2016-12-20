function Shape(vertices) {

  if (!vertices) vertices = [];

  this.vertices = vertices;
  this.frames = 100;
  this.frame = -1;
  this.speed = 0.5;
  this.spin = 0.1;
  this.seed = random(millis());

  this.breakAnime = function(frames, speed, spin) {
    if (frames && frames > 0) this.frames = frames;
    if (speed) this.speed = speed;
    if (spin) this.spin = spin;
    this.frame = 0;
  }

  this.fade = function() {
    if (this.frame < 0) return 255;
    else return 255 * (1 - this.frame / this.frames);
  }

  this.globalVertices = function(pos, heading) {
    var glob_vertices = [];
    for (var i = 0; i < this.vertices.length; i++) {
      var v = this.vertices[i].copy();
      v.rotate(heading);
      v.add(pos);
      glob_vertices.push(v);
    }
    return glob_vertices;
  }
  
  //calculates the area within a shape
  this.area = function() {
    var area = 0;
    for ( var i = 0; i < this.vertices.length - 1; i++) {
      area += this.vertices[i].x * this.vertices[i+1].y - this.vertices[i].y * this.vertices[i+1].x;
    }
    return abs(area / 2);
  }
  
  //checks if the shape contains a specific point
  this.contains = function(pos) {
    var c = false;
    for (var i = 0, j = this.vertices.length-1; i < this.vertices.length; j = i++) {
      if ( ((this.vertices[i].y>pos.y) != (this.vertices[j].y>pos.y)) &&
       (pos.x < (this.vertices[j].x-this.vertices[i].x) * (pos.y-this.vertices[i].y) / (this.vertices[j].y-this.vertices[i].y) + this.vertices[i].x) )
         c = !c;
    }
    return c;
  }
  
  this.sub = function(pos1, heading1, pos2, heading2, shape) {
    intersections = [];
    stencilVertices = shape.globalVertices(pos2, heading2);
    for(var i = 0; i < stencilVertices.length; i++) {
      stencilVertices[i].sub(pos1);
      stencilVertices[i].rotate(-heading1);
    }
    
    for(i = 0; i < stencilVertices.length; i++) {
      for (var j = 0; j < this.vertices.length; j++) {
        if (lineIntersect(stencilVertices[i], stencilVertices[(i+1)%stencilVertices.length], this.vertices[j], this.vertices[(j+1)%this.vertices.length])){
          var intersection = lineIntersectionPoint(stencilVertices[i], stencilVertices[(i+1)%stencilVertices.length], this.vertices[j], this.vertices[(j+1)%this.vertices.length]);
          if(intersection !== undefined) {
            intersections.push(intersection);
            this.vertices.splice((++j)%this.vertices.length, 0, intersection);
            stencilVertices.splice((++i)%stencilVertices.length, 0, intersection);
          }
        }
      }
    }
    
    for( i = 0; i < this.vertices.length; i++) {
      if(Shape.contains(stencilVertices, this.vertices[i]) && intersections.indexOf(this.vertices[i]) === -1){
        this.vertices.splice(i--, 1);
      }
    }
    
    for( i = 0; i < this.vertices.length; i++) {
      if (intersections.indexOf(this.vertices[i]) !== -1 && intersections.indexOf(this.vertices[(i+1)%this.vertices.length]) !== -1) {
        var intersection_start = this.vertices[i];
        var intersection_end = this.vertices[(i+1)%this.vertices.length];
        for( j = stencilVertices.indexOf(intersection_start); stencilVertices[j] !== intersection_end; j = mod((j -1), stencilVertices.length)) {
          if(intersections.indexOf(stencilVertices[j]) === -1) {
            this.vertices.splice(++i, 0, stencilVertices[j].copy());
          }
        }
      }
    }
    
    for( i = 0; i < this.vertices.length - 1; i++) {
      for ( j = i + 1; j < this.vertices.length; j++) {
        if (this.vertices[i].x == this.vertices[j].x && this.vertices[i].y == this.vertices[j].y) {
          this.vertices.splice(i--, 1);
          this.vertices.splice(j--, 1);
        }
      }
    }
    
    intersections = [];
    var addTo = [];
    for( i = 0; i < this.vertices.length - 2; i++) {
      for (j = i + 2; j < this.vertices.length - (i === 0 ? 1 : 0); j++) {
        if(lineIntersect(this.vertices[i], this.vertices[i+1], this.vertices[j], this.vertices[(j+1) % this.vertices.length])) {
          intersection = lineIntersectionPoint(this.vertices[i], this.vertices[i+1], this.vertices[j], this.vertices[(j+1) % this.vertices.length]);
          if(intersection !== undefined) {
            intersections.push(intersection);
            addTo[intersections.length - 1] = [i + 1, j + 1];
          }
        }
      }
    }
    
    if(intersections.length < 1){
      return [];
    }
    
    for ( i = 0; i < addTo.length; i++) {
      for ( j = 0; j < addTo[i].length; j++) {
        var index = addTo[i][j];
        this.vertices.splice(index, 0, intersections[i]);
        
        for ( k = i; k < addTo.length; k++) {
          for ( l = j; l < addTo[k].length; l++) {
            if(addTo[k][l] > index){
              addTo[k][l]++;
            }
          }
        }
      }
    }
    
    var outcomePolygons = new Array(intersections.length + 1);
    var pushTo = 0;
    var order = 1;
    
    for( i = 0; i < this.vertices.length; i++) {
      if(outcomePolygons[pushTo] === undefined) {
        outcomePolygons[pushTo] = [];
      }
      if (intersections.indexOf(this.vertices[i]) !== -1) {
        if(order == 1) {
          outcomePolygons[pushTo].push(this.vertices[i]);
        }
        pushTo += order;
        if (pushTo == outcomePolygons.length - 1) {
          order = -1;
        }
      }
      else {
        outcomePolygons[pushTo].push(this.vertices[i]);
      }
    }
    
    for( i = 0; i < outcomePolygons.length; i++) {
      if(Shape.inverted(outcomePolygons[i])) {
        outcomePolygons.splice(i--, 1);
      }
    }
    
    if(outcomePolygons.length > 0){
      this.vertices = outcomePolygons.shift();
      return outcomePolygons;
    }
    else {
      return [];
    }
  }

  this.draw = function() {

    if (this.frame < 0) {

      beginShape();
        for (var i = 0; i < this.vertices.length; i++) {
          vertex(this.vertices[i].x, this.vertices[i].y);
          strokeWeight(4);
          stroke(0, 255, 255);
          point(this.vertices[i].x, this.vertices[i].y);
          strokeWeight(1);
          stroke(255);
        }
      endShape(CLOSE);

    } else if (this.frame < this.frames) {

      push();

      var hRng = this.speed * 0.5;
      randomSeed(this.seed);

      for (var i = 0; i < this.vertices.length; i++) {
        var vertA = this.vertices[i];
        var vertB = this.vertices[(i + 1) % this.vertices.length];

        var rSpeed = this.speed + random(- hRng, hRng);
        var vAB = p5.Vector.sub(vertB, vertA);
        var cAB = p5.Vector.add(vertA, vertB);
        cAB.div(2);
        var trans = cAB.copy();
        trans.normalize();
        trans.mult(this.frame * rSpeed);
        trans.add(cAB);

        push();

        translate(trans.x, trans.y);
        rotate(this.frame * random(-this.spin / 2, this.spin / 2));
        line(-vAB.x / 2, -vAB.y / 2, vAB.x / 2, vAB.y / 2);

        pop();

      }

      pop();

      this.frame++;

    } else {
      this.frame = -1;
      return false;
    }
    return true;

  }
  
}

Shape.contains = function(vertices, pos) {
  var c = false;
  for (var i = 0, j = vertices.length-1; i < vertices.length; j = i++) {
    if ( ((vertices[i].y>pos.y) != (vertices[j].y>pos.y)) &&
     (pos.x < (vertices[j].x-vertices[i].x) * (pos.y-vertices[i].y) / (vertices[j].y-vertices[i].y) + vertices[i].x) )
       c = !c;
  }
  return c;
}

Shape.inverted = function(vertices) {
  var sum = 0;
  for ( var i = 0; i < vertices.length; i++) {
    sum += (vertices[(i+1) % vertices.length].x - vertices[i].x) * (vertices[i].y + vertices[(i+1)%vertices.length].y);
  }
  return sum >= 0;
}

Shape.smooth = function(vertices, loop_) {
  if(loop_ === undefined) {
    loop_ = true;
  }
  for (var i = 0; i < vertices.length - (loop_ ? 0 : 1); i+=2) {
    var v_ = createVector((vertices[i].x + vertices[(i+1)%vertices.length].x) * 0.5 + random(10), (vertices[i].y + vertices[(i+1)%vertices.length].y) * 0.5 + random(10));
    vertices.splice(i + 1, 0, v_);
  }
}