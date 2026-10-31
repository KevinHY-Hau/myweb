// Kevin HY Hau - Hello World 👋


function setup() {
  createCanvas(500, 500, WEBGL)
  frameRate(36)
  angleMode(DEGREES)
  
  
}

function draw() {

  clear()   // see-through, so the page background shows (was: background("#181C22"))
  // The black backing plate is switched off, otherwise it draws a dark square behind the cubes:
  // stroke(0)
  // fill(0)
  // translate(0,0,-200)
  // box(550,550,1, 0.5)
  // translate(0,0,200)
  
  stroke(255 * sin(frameCount))
  strokeWeight(1 + cos(frameCount))
  
  for(i = -1; i <= 1; i += 1){
    for(j = -1; j <= 1; j += 1){
      for(k = -1; k <= 1; k += 1){
        //rotateZ(frameCount * 0.005)
        
          
        let size = 45 + 15 * cos(frameCount) + 15 * cos(frameCount)
        
        push()
        
        rotateY(frameCount * 0.7)
        rotateX(frameCount * 0.6)
        rotateZ(frameCount * 0.5)
        
        
        if( (i == 0) & ( j == 0) | (i == 0) & ( k == 0) | (j == 0) & ( k == 0)  ){
          
          if( (i === 0) & ( j === 0)  & ( k === 0)) {
            
            translate(i * (size + 15) *sin(frameCount) , 
                      j * (size + 15) *sin(frameCount) , 
                      k * (size + 15) *sin(frameCount))
                      
            
            rotateY(frameCount * 2.5)
            rotateX(frameCount * 1.6)
            rotateZ(frameCount * 1.7)
            
            translate(size /2 + 1, 0,  0)
            fill(205 + 50 * sin(frameCount), 50 * sin(frameCount), 0) 
            box(1, size, size)
            
            //green
            translate(-size - 1, 0,  0)
            fill(0, 205 + 50 * sin(frameCount), 50 * sin(frameCount))
            box(1, size, size)
            
            // blue
            translate(size /2 + 1, size /2 + 1, 0)
            fill(50 * sin(frameCount), 0, 205 + 50 * sin(frameCount))
            box(size, 1, size)
            
            //cyan
            translate(0, -size - 1, 0)
            fill(50 * sin(frameCount), 205 + 50 * sin(frameCount), 205 + 50 * sin(frameCount))
            box(size, 1, size)
            
            // pink
            translate(0, size /2 + 1, size /2 + 1)
            fill(205 + 50 * sin(frameCount), 50 * sin(frameCount), 205 + 50 * sin(frameCount))
            box(size, size, 1)
            
            //yellow
            translate(0, 0, -size - 1)
            fill(205 + 50 * sin(frameCount), 205 + 50 * sin(frameCount), 50 * sin(frameCount))
            box(size, size, 1)
            
            
          }
        } else {
          translate(i * (size + 15) + 5 * sin(frameCount), 
                    j * (size + 15) + 5 * sin(frameCount), 
                    k * (size + 15) + 5 * sin(frameCount))
          
          
          //red
          translate(size /2 + 1, 0,  0)
          fill(205 + 50 * sin(frameCount), 50 * sin(frameCount), 0)
          box(1, size + 10 * sin(frameCount) - 10, size + 10 * sin(frameCount) - 10)
          
          //green
          translate(-size - 1, 0,  0)
          fill(0, 205 + 50 * sin(frameCount), 50 * sin(frameCount))
          box(1, size + 10 * sin(frameCount)- 10, size + 10 * sin(frameCount) - 10)
          
          // blue
          translate(size /2 + 1, size /2 + 1, 0)
          fill(50 * sin(frameCount), 0, 205 + 50 * sin(frameCount))
          box(size + 10 * sin(frameCount)- 10, 1, size + 10 * sin(frameCount)- 10)
          
          //cyan
          translate(0, -size - 1, 0)
          fill(50 * sin(frameCount), 205 + 50 * sin(frameCount), 205 + 50 * sin(frameCount))
          box(size + 10 * sin(frameCount)- 10, 1, size + 10 * sin(frameCount)- 10)
          
          // pink
          translate(0, size /2 + 1, size /2 + 1)
          fill(205 + 50 * sin(frameCount), 50 * sin(frameCount), 205 + 50 * sin(frameCount))
          box(size + 10 * sin(frameCount)- 10, size + 10 * sin(frameCount)- 10, 1)
          
          //yellow
          translate(0, 0, -size - 1)
          fill(205 + 50 * sin(frameCount), 205 + 50 * sin(frameCount), 50 * sin(frameCount))
          box(size + 10 * sin(frameCount)- 10, size + 10 * sin(frameCount)- 10, 1)
          
          
        }
                    
          //sphere(5 + 2 * sin(TWO_PI * (frameCount % 60) * 0.1))
          //box(50, 50, 50)
          //pointLight(100, 100, 100, 150, 0)
          //specularMaterial(250, 255, 0)
          
        
        pop()
      }
      
    }
  }
    
  

}
