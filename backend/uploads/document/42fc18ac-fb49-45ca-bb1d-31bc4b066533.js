// Civil Canvas Background Animation (Construction/Grid Style, Cranes, Scaffolding)
// Transitions are handled by slideshow.js


// Civil Canvas Background Animation (Construction/Grid Style, Cranes, Scaffolding)
const canvas = document.getElementById('civil-canvas');
const ctx = canvas.getContext('2d');

let width, height;
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resize);
resize();

// Scaffolding lines and cranes
let time = 0;

function drawScaffolding(isDark) {
    ctx.strokeStyle = isDark ? 'rgba(0, 150, 255, 0.08)' : 'rgba(0, 119, 204, 0.08)';
    ctx.lineWidth = 1;
    
    // Draw vertical posts
    let postSpacing = 150;
    for (let x = 0; x < width + postSpacing; x += postSpacing) {
        ctx.beginPath();
        let currentX = x - (time * 0.1) % postSpacing; // slow pan
        ctx.moveTo(currentX, 0);
        ctx.lineTo(currentX, height);
        ctx.stroke();

        // draw cross bracing between posts
        ctx.beginPath();
        ctx.strokeStyle = isDark ? 'rgba(0, 150, 255, 0.04)' : 'rgba(0, 119, 204, 0.04)';
        for (let y = 0; y < height; y += postSpacing) {
            ctx.moveTo(currentX, y);
            ctx.lineTo(currentX - postSpacing, y + postSpacing);
            ctx.moveTo(currentX, y + postSpacing);
            ctx.lineTo(currentX - postSpacing, y);
        }
        ctx.stroke();
    }
    
    // Draw horizontal beams
    ctx.strokeStyle = isDark ? 'rgba(0, 150, 255, 0.08)' : 'rgba(0, 119, 204, 0.08)';
    for (let y = 0; y < height; y += postSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
}

class Crane {
    constructor() {
        this.reset();
    }
    reset(initial = false) {
        this.x = initial ? Math.random() * width : width + 200;
        this.y = height;
        this.height = Math.random() * 400 + 200;
        this.jibLength = Math.random() * 300 + 150;
        this.angle = (Math.random() - 0.5) * 0.5; // slow swing
        this.swingSpeed = (Math.random() - 0.5) * 0.002;
        this.hookPos = Math.random() * 0.8 + 0.1;
        this.hookDrop = Math.random() * 100 + 50;
        this.opacity = Math.random() * 0.15 + 0.05;
        this.baseWidth = 20;
        this.speed = Math.random() * 0.2 + 0.1;
        // z index effect (parallax)
        this.parallax = Math.random() * 0.5 + 0.5; 
    }
    
    update() {
        this.x -= this.speed * this.parallax;
        this.angle += this.swingSpeed;
        if(this.angle > 0.3 || this.angle < -0.3) this.swingSpeed *= -1;
        
        if (this.x < -this.jibLength * 2) {
            this.reset(false);
        }
    }
    
    draw(isDark) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.parallax, this.parallax);
        
        ctx.strokeStyle = isDark ? `rgba(0, 191, 255, ${this.opacity})` : `rgba(0, 119, 204, ${this.opacity})`;
        ctx.fillStyle = isDark ? `rgba(0, 191, 255, ${this.opacity * 0.5})` : `rgba(0, 119, 204, ${this.opacity * 0.5})`;
        ctx.lineWidth = 2;
        
        // Draw Mast (Tower)
        ctx.beginPath();
        ctx.moveTo(-this.baseWidth/2, 0);
        ctx.lineTo(-this.baseWidth/2, -this.height);
        ctx.lineTo(this.baseWidth/2, -this.height);
        ctx.lineTo(this.baseWidth/2, 0);
        ctx.stroke();
        
        // Draw mast cross braces
        for(let i=0; i<this.height; i+=20) {
            ctx.beginPath();
            ctx.moveTo(-this.baseWidth/2, -i);
            ctx.lineTo(this.baseWidth/2, -i - 20);
            ctx.moveTo(this.baseWidth/2, -i);
            ctx.lineTo(-this.baseWidth/2, -i - 20);
            ctx.stroke();
        }
        
        // Translate to top of mast for Jib rotation
        ctx.translate(0, -this.height);
        ctx.rotate(this.angle);
        
        // Jib (Front arm)
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-this.jibLength, 0);
        // Counter Jib (Back arm)
        ctx.lineTo(this.jibLength/3, 0);
        ctx.stroke();
        
        // Jib internal triangles
        for(let i=0; i<this.jibLength-20; i+=20) {
            ctx.beginPath();
            ctx.moveTo(-i, 0);
            ctx.lineTo(-i - 10, -10);
            ctx.lineTo(-i - 20, 0);
            ctx.stroke();
        }
        
        // Tie rod from top
        ctx.beginPath();
        ctx.moveTo(0, -30); // Top peak
        ctx.lineTo(0, 0);
        ctx.moveTo(0, -30);
        ctx.lineTo(-this.jibLength*0.8, 0);
        ctx.moveTo(0, -30);
        ctx.lineTo(this.jibLength*0.3, 0);
        ctx.stroke();
        
        // Hook line dropping down
        let hookX = -this.jibLength * this.hookPos;
        ctx.beginPath();
        ctx.moveTo(hookX, 0);
        ctx.lineTo(hookX, this.hookDrop);
        ctx.stroke();
        
        // Hook block
        ctx.beginPath();
        ctx.rect(hookX - 5, this.hookDrop, 10, 10);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
}

const cranes = [];
for(let i=0; i<6; i++) {
    let c = new Crane();
    c.reset(true);
    cranes.push(c);
}

// Background schematic lines (moving measurements horizontally)
function drawSchematicLines(isDark) {
    ctx.strokeStyle = isDark ? 'rgba(0, 229, 255, 0.15)' : 'rgba(0, 119, 204, 0.15)';
    ctx.fillStyle = isDark ? 'rgba(0, 229, 255, 0.4)' : 'rgba(0, 119, 204, 0.4)';
    ctx.lineWidth = 1;
    ctx.font = '10px monospace';
    
    for(let y=100; y<height; y+=250) {
        let lx = (time * 0.5) % 200;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        
        // Draw measurement tick marks
        for(let mk = -lx; mk < width; mk+=100) {
            ctx.beginPath();
            ctx.moveTo(mk, y - 5);
            ctx.lineTo(mk, y + 5);
            ctx.stroke();
            if (mk > 0) ctx.fillText(`SEC-${mk.toFixed(0)}`, mk + 5, y - 5);
        }
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    const isDark = document.documentElement.classList.contains('dark');
    
    time++;
    
    drawScaffolding(isDark);
    drawSchematicLines(isDark);
    
    // Sort cranes by parallax to draw back ones first
    cranes.sort((a,b) => a.parallax - b.parallax);
    
    cranes.forEach(crane => {
        crane.update();
        crane.draw(isDark);
    });

    requestAnimationFrame(animate);
}

animate();

