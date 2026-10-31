let rot_time = 8
let a1 = 130
let b1 = 130
let speed = 150
let delay1 = 0
let min_dist = 0.5
let size = 0.4
let rep = 3

function setup() {
  createCanvas(500, 500)
}

function draw(){
  
  // background(13, 17, 23)
  background(25, 29, 35)    
  // Calculate the angle to rotate.
  let angle = TWO_PI / rot_time  

  // Move the origin to the center.
  translate(250, 250)
   
  // Draw the flower.
  
  cos_frame_speed = cos(frameCount/speed)
  sin_frame_speed = sin(frameCount/speed)

  // middle ellipse
  for(let i = 0; i <= TWO_PI; i += TWO_PI/60){   
    for (let j = 0; j < rot_time; j++) {
      rotate(angle)
      e_x1 = a1 * (cos(i) * cos_frame_speed)
      e_y1 = b1 * (sin(i) * cos_frame_speed)      
      fill(random(10,250), random(10,250), random(10,250))
      noStroke()
      circle(e_x1, e_y1, 2)
      e_x1 = a1 * (cos(i) * sin_frame_speed)
      e_y1 = b1 * (sin(i) * sin_frame_speed)      
      fill(random(10,250), random(10,250), random(10,250))
      noStroke()
      circle(e_x1, e_y1, 2)     

    }
  }
  
  // circle going around ellipse for the middle
  for (let i = 0; i < rot_time; i++) {
    noStroke()
    rotate(angle)
    
    e_x1 = a1 * (cos_frame_speed * cos(delay1+frameCount / speed))
    e_y1 = b1 * (sin_frame_speed * cos(delay1+frameCount / speed))      
    fill(255, random(100,250), random(100,250))
    circle(e_x1, e_y1, 5)
    circle(-e_x1, -e_y1, 5)
    
    e_x1 = a1 * (sin_frame_speed * sin(delay1+frameCount / speed))
    e_y1 = b1 * (cos_frame_speed * sin(delay1+frameCount / speed))      
    fill(random(100,250), 255, random(100,250))
    circle(e_x1, e_y1, 5)
    circle(-e_x1, -e_y1, 5)
    
  }
  
  
  // ellipse outside
  for(let i = 0; i <= TWO_PI; i += TWO_PI/60){   
    for (let j = 0; j < rot_time; j++) {
      rotate(angle)
      e_x1 = a1 * (min_dist + cos(i) * cos_frame_speed)
      e_y1 = b1 * (min_dist + sin(i) * cos_frame_speed)      
      fill(random(10,250), random(10,250), random(10,250))
      noStroke()
      circle(e_x1, e_y1, 2)
      circle(-e_x1, -e_y1, 2)
      
      e_x1 = a1 * (min_dist + sin(i) * sin_frame_speed)
      e_y1 = b1 * (min_dist + cos(i) * sin_frame_speed)      
      fill(random(10,250), random(10,250), random(10,250))
      noStroke()
      circle(e_x1, e_y1, 2)
      circle(-e_x1, -e_y1, 2)
      
      
    }
  }
  
  // circle going around ellipse outside
  noStroke()
  for (let i = 0; i < rot_time; i++) {
    rotate(angle)
    e_x1 = a1 * (min_dist + cos_frame_speed * cos(delay1+frameCount / speed))
    e_y1 = b1 * (min_dist + sin_frame_speed * cos(delay1+frameCount / speed))      
    fill(255, random(100,250), random(100,250))
    circle(e_x1, e_y1, 5)
    circle(-e_x1, -e_y1, 5)
    
    e_x1 = a1 * (min_dist + sin_frame_speed * sin(delay1+frameCount / speed))
    e_y1 = b1 * (min_dist + cos_frame_speed * sin(delay1+frameCount / speed))      
    fill(random(100,250), 255, random(100,250))
    circle(e_x1, e_y1, 5)
    circle(-e_x1, -e_y1, 5)
    
  }
  
  
  // ellipse smaller
  noStroke()
  for(let i = 0; i <= TWO_PI; i += TWO_PI/20){   
    for (let j = 0; j < rot_time; j++) {
        rotate(angle)
        e_x1 = size * (a1 * (min_dist + cos(i) * cos_frame_speed)) 
        e_y1 = size * (b1 * (min_dist + sin(i) * cos_frame_speed)) 
        fill(random(10,250), random(10,250), random(10,250))
        circle(e_x1, e_y1, 2)
        e_x1 = size * (a1 * (min_dist + sin(i) * sin_frame_speed)) 
        e_y1 = size * (b1 * (min_dist + cos(i) * sin_frame_speed)) 
        fill(random(10,250), random(10,250), random(10,250))
        circle(e_x1, e_y1, 2) 
    }
  }
  
  // circles going circle in both direction
  for (let i = 0; i < rot_time; i++) {
    rotate(angle)
    
    e_x1 = size * (min_dist + a1 * cos_frame_speed * cos(2 * delay1+frameCount / (speed)))
    e_y1 = size * (min_dist + b1 * sin_frame_speed * cos(2 * delay1+frameCount / (speed)))      
    
    stroke(255, random(100,250), random(100,250))
    fill(255, random(100,250), random(100,250))
    circle(-e_x1, -e_y1, 5)
    circle(e_x1, e_y1, 5)
       
    a2 = size * (min_dist + a1 * cos_frame_speed)
    b2 = size * (min_dist + b1 * sin_frame_speed)
    
    noStroke()
    circle( a2,  b2, 6 * cos_frame_speed)
    circle(-a2, -b2, 6 * cos_frame_speed)
    
    fill(random(100,250),random(100,250),random(100,250))
    
    circle( a2, -b2, 6 * cos_frame_speed)
    circle(-a2,  b2, 6 * cos_frame_speed)
    
    rotate(angle)
  
  }
  
}
