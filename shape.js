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
  
  this.trueCenterpoint = function() {
    var px = 0, py = 0;
    for( var i = 0; i < this.vertices.length; i++) {
      px += (this.vertices[i].x + this.vertices[(i+1)%this.vertices.length].x) * cross(this.vertices[i], this.vertices[(i+1)%this.vertices.length]);
      py += (this.vertices[i].y + this.vertices[(i+1)%this.vertices.length].y) * cross(this.vertices[i], this.vertices[(i+1)%this.vertices.length]);
    }
    px /= 6 * this.area();
    py /= 6 * this.area();
    return new p5.Vector(px, py);
  }
  
  this.radius = function() {
    var center = this.trueCenterpoint();
    var max_r = -1;
    for( var i = 0; i < this.vertices.length; i++) {
      var dist_ = dist(center.x, center.y, this.vertices[i].x, this.vertices[i].y);
      if(dist_ > max_r) {
        max_r = dist_;
      }
    }
    return max_r;
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
  
  this.intersections = function(pos, angle, indlist) {
    if (indlist === undefined) {
      indlist = [];
    }
    intersections = [];
    for (var i = 0; i < this.vertices.length; i++) {
      if(lineIntersect2(pos, angle, this.vertices[i], this.vertices[(i+1)%this.vertices.length])) {
        intersections.push(lineIntersectionPoint(pos, p5.Vector.add(pos, p5.Vector.fromAngle(angle)), this.vertices[i], this.vertices[(i+1)%this.vertices.length]));
        indlist.push(i);
      }
    }
    //sorting
    for (var n = intersections.length; n > 1; n--){
      for (i=0; i < n-1; i++){
        if (dist(intersections[i].x, intersections[i].y, pos.x, pos.y) > dist(intersections[i+1].x, intersections[i+1].y, pos.x, pos.y)){
          var temp = intersections[i];
          intersections[i] = intersections[i+1];
          intersections[i+1] = temp;
          
          var temp2 = indlist[i];
          indlist[i] = indlist[i+1];
          indlist[i+1] = temp2;
        }
      }
    }
    return intersections;
  }
  
  this.splitAtWeakestPoint = function() {
    var weakestAngle;
    var intersectiondist = -1;
    var center = this.trueCenterpoint();
    var indList = [];
    var splitIntersections = [];
    for( angle = random(PI/15); angle < TWO_PI; angle += PI/15) {
      var list = [];
      var intersections = this.intersections(center, angle, list);
      if(intersections.length >= 2) {
        var dist_ = 0;
        for(var i = 0; i < intersections.length; i++){
          dist_ += dist(intersections[i].x, intersections[i].y, center.x, center.y);
        }
        if (intersectiondist == -1 || dist_ < intersectiondist) {
          intersectiondist = dist_;
          weakestAngle = angle;
          indList = list;
          splitIntersections = intersections;
        }
      }
    }
    
    if(splitIntersections.length > 1){
      var newVertices1 = [];
      newVertices1.push(splitIntersections[0].copy());
      for (i = (indList[0] + 1) % this.vertices.length; i != (indList[1] + 1) % this.vertices.length; i = (i + 1) % this.vertices.length) {
        newVertices1.push(this.vertices[i]);
      }
      newVertices1.push(splitIntersections[1].copy());
      
      var newVertices2 = [];
      newVertices2.push(splitIntersections[1].copy());
      for (i = (indList[1] + 1) % this.vertices.length; i != (indList[0] + 1) % this.vertices.length; i = (i + 1) % this.vertices.length) {
        newVertices2.push(this.vertices[i]);
      }
      newVertices2.push(splitIntersections[0].copy());
      
      return [new Shape(newVertices1), new Shape(newVertices2)];
    }
    else {
      return [this];
    }
  }
  
  this.sub = function(pos1, heading1, pos2, heading2, shape) {
    debris = [];
    
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
    
    var d = [];
    if(intersections.length > 1) {
      d.push(intersections[1].copy());
    }
    for( i = 0; i < this.vertices.length; i++) {
      if(Shape.contains(stencilVertices, this.vertices[i]) && intersections.indexOf(this.vertices[i]) === -1){
        d.push(this.vertices.splice(i--, 1)[0]);
      }
    }
    if(intersections.length > 1) {
      d.push(intersections[0].copy());
    }
    debris.push(new Shape(d));
    
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
      return [[this], debris];
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
      var shapes = [];
      for(i = 0; i < outcomePolygons.length; i++) {
        shapes.push(new Shape(outcomePolygons[i]));
      }
      return [shapes, debris];
    }
    else {
      return [[this], debris];
    }
  }

  this.draw = function() {

    if (this.frame < 0) {

      beginShape();
        for (var i = 0; i < this.vertices.length; i++) {
          vertex(this.vertices[i].x, this.vertices[i].y);
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

Shape.makeAsteroidSized = function(shapes) {
  for(var i = 0; i < shapes[0].length; i++) {
    var area = shapes[0][i].area();
    var r = shapes[0][i].radius();
    var error = abs((PI - area / (r * r)) / PI);
    if(area < 800) {
      shapes[1].push(shapes[0].splice(i--, 1)[0]);
    }
    else if (error > 0.8) {
      var newShapes = shapes[0][i].splitAtWeakestPoint();
      shapes[0] = shapes[0].concat(newShapes);
      shapes[0].splice(i--, 1);
    }
  }
  return shapes;
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
