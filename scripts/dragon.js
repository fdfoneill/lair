var showGuides = document.getElementById("showGuides");
const canvas = document.getElementById("lairCanvas");
const context = canvas.getContext("2d");
const rect = canvas.getBoundingClientRect();

var cursorPosition = {x: 0, y: 0};

canvas.addEventListener("mousemove", (event) => {
    cursorPosition.x = event.clientX - rect.left;;
    cursorPosition.y = event.clientY - rect.top;;
});

const dragon = {
    rotation: 0,
    scale: 15, 
    color: "blue",
    time: Date.now(),
    directionHeadToCursor: 0,
    neckPosition: {x: canvas.width / 2, y: canvas.height / 2},
    headAngle: Math.PI,
    minHeadAngle: (2/5) * Math.PI,
    maxHeadTurn: (1/5) * Math.PI,
    headPosition: {x: 0, y: 0},
    headTurnSpeed: 3,
    neckControlPoint: {x: 0, y: 0},
    bodyTurnSpeed: 1, 
    spinePivotPoint: {x: 0, y: 0},
    spineLength: 20,
    hipAngle: 0,
    hipPosition: {x: 0, y: 0},
    tailPivotPoint: {x: 0, y: 0},
    tailSwishSpeed: 1,
    tailAngle: 0,
    tailLength: 0,
    tailPosition: {x: 0, y: 0},
    walkingSpeed: 1, // percent of neck length moved per second
    headCursorDistanceTolerance: 1,
    fireSpeed: 5,
    fireDuration: 500,
    fireSpread: 0.4,
    fireSymbol: ".",
    fireColor: "red",
    
    angleToAbsolute(relative_angle, negative=false) {
        if (negative) {
            return relative_angle + this.rotation;
        } else {
            return relative_angle - this.rotation;
        }
    },
    
    getPointOnHeadCardioid(angle) {
        var point_coords = {x: 0, y: 0};
        radius = this.scale;
        point_coords.x = this.neckPosition.x + (2*radius*(1-Math.cos(this.angleToAbsolute(angle, true)))*Math.cos(angle));
        point_coords.y = this.neckPosition.y + (2*radius*(1-Math.cos(this.angleToAbsolute(angle, true)))*Math.sin(angle));
        return point_coords;
    },
    
    drawHeadCardioid() {
        context.beginPath();
        for (let angle = 0; angle <= 2 * Math.PI; angle += 0.01) {
            var point_coords = this.getPointOnHeadCardioid(angle);
            context.lineTo(point_coords.x, point_coords.y);
        }
        context.closePath();
        context.strokeStyle = "black";
        context.stroke();
    },
    
    getDirectionHeadToCursor() {
        var directionHeadToCursor = 0;
        var centerPosition = this.getPointOnHeadCardioid(Math.PI);
        
        if (pointIsAboveLine(this.neckPosition.x, this.neckPosition.y, centerPosition.x, centerPosition.y, this.headPosition.x, this.headPosition.y) != pointIsAboveLine(this.neckPosition.x, this.neckPosition.y, centerPosition.x, centerPosition.y, cursorPosition.x, cursorPosition.y)) {
            1;
        } else {
            1;
        }
        
        var current_dist = cartesianDistance(this.headPosition.x, this.headPosition.y, cursorPosition.x, cursorPosition.y);
        var pos_head_coords = this.getPointOnHeadCardioid(this.headAngle + (this.scale/40));
        var neg_head_coords = this.getPointOnHeadCardioid(this.headAngle- (this.scale/40));
        if (cartesianDistance(pos_head_coords.x, pos_head_coords.y, cursorPosition.x, cursorPosition.y) < current_dist) {
            directionHeadToCursor = 1;
        } else if (cartesianDistance(neg_head_coords.x, neg_head_coords.y, cursorPosition.x, cursorPosition.y) < current_dist) {
            directionHeadToCursor = -1;
        } else {
            directionHeadToCursor = 0;
        }
        return directionHeadToCursor;
    },
    
    drawHead() {
        var headText = "A"
        context.font = (28*(this.scale/20)) + "px Georgia";
        context.fillStyle = this.color;
        context.save();
        context.translate(this.headPosition.x, this.headPosition.y);
        // face directly outward
        context.rotate(getAngleBetweenPoints(this.headPosition.x, this.headPosition.y, this.neckControlPoint.x, this.neckControlPoint.y)-(Math.PI/2));
        // rotate toward cursor
        var head_rotation = angleToMod2Pi(
            getAngleBetweenPoints(this.headPosition.x, this.headPosition.y, cursorPosition.x, cursorPosition.y)-
            getAngleBetweenPoints(this.neckControlPoint.x, this.neckControlPoint.y, this.headPosition.x, this.headPosition.y)
        );
        if ((head_rotation > this.maxHeadTurn) & (head_rotation < Math.PI)) {
            head_rotation = this.maxHeadTurn;
        } else if ((head_rotation < ((2*Math.PI)-this.maxHeadTurn)) & (head_rotation > Math.PI)) {
            head_rotation = ((2*Math.PI)-this.maxHeadTurn);
        }
        context.rotate(head_rotation);
        var text_size = context.measureText(headText).width;
        context.fillText(headText, -1*(text_size/2), text_size/2);
        context.restore();
    },
    
    getNeckControlPoint(show) {
        var out_control_point = {x: this.neckPosition.x, y: this.neckPosition.y};
        out_control_point.y -= Math.sin(-1*this.rotation) * this.scale * 2 * Math.abs(this.angleToAbsolute(this.headAngle, true)-Math.PI);
        out_control_point.x -= Math.cos(-1*this.rotation) * this.scale * 2 * Math.abs(this.angleToAbsolute(this.headAngle, true)-Math.PI);
       
        if (show) {
            var cpText = "."
            context.save();
            context.font = (28*(this.scale/20)) + "px Georgia";
            context.fillStyle = "black";
            context.translate(out_control_point.x, out_control_point.y);
            var text_size = context.measureText(cpText).width;
            context.fillText(cpText, -1*(text_size/2), text_size/2);
            context.restore();
        }
        
        return out_control_point;
    },
    
    drawNeck() {
        context.strokeStyle = this.color;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(this.neckPosition.x, this.neckPosition.y);
        context.quadraticCurveTo(this.neckControlPoint.x, this.neckControlPoint.y, this.headPosition.x, this.headPosition.y);
        context.stroke();
    },
    
    moveShoulders() {
        if (
            cartesianDistance(this.headPosition.x, this.headPosition.y, cursorPosition.x, cursorPosition.y) < this.headCursorDistanceTolerance
            )
        {
            true;
        } else {
            // get t
            var updated_t = 0;
            updated_t += this.walkingSpeed * (Date.now() - this.time) / 1000;
            // calculate bezier point
            var new_position = this.neckPosition;
            while (
                cartesianDistance(this.neckPosition.x, this.neckPosition.y, new_position.x, new_position.y) < 
                (this.walkingSpeed * (Date.now() - this.time) / 10)
            ) {
                new_position = getPointAlongQuadraticCurve(
                    this.neckPosition.x, 
                    this.neckPosition.y, 
                    this.neckControlPoint.x, 
                    this.neckControlPoint.y, 
                    cursorPosition.x, 
                    cursorPosition.y, 
                    updated_t
                );
                updated_t += 0.01;
            } 
            // update position
            this.neckPosition = new_position;
        }
    },
    
    drawShoulders() {
        var shoulder_text = "\u23FA";
        context.fillStyle = this.color;
        var text_size = context.measureText(shoulder_text).width;
        context.save();
        context.translate(this.neckPosition.x, this.neckPosition.y);
        context.rotate(-1*this.rotation);
        context.fillText(shoulder_text, -1*(text_size/2), text_size/2);
        context.restore();
        
    },
    
    turnBody() {
        var headAngle_relative = this.angleToAbsolute(this.headAngle, true);
        var body_turn_amount = Math.PI * this.bodyTurnSpeed * (Date.now() - this.time) / 2000;
        if (headAngle_relative > Math.PI) {
            this.rotation -= body_turn_amount;
        } else if (headAngle_relative < Math.PI) {
            this.rotation += body_turn_amount;
        }
    },
    
    getSpinePivotPoint() {
        // hips and shoulders trace out a circle around a central point
        var out_pivot_point = {x: this.neckPosition.x, y: this.neckPosition.y};
        out_pivot_point.y -= Math.sin(-1*this.rotation+Math.PI) * this.spineLength / 2;
        out_pivot_point.x -= Math.cos(-1*this.rotation+Math.PI) * this.spineLength / 2;
        
        if (show) {
            var cpText = "."
            context.save();
            context.font = (28*(this.scale/20)) + "px Georgia";
            context.fillStyle = "black";
            context.translate(out_pivot_point.x, out_pivot_point.y);
            var text_size = context.measureText(cpText).width;
            context.fillText(cpText, -1*(text_size/2), text_size/2);
            context.restore();
        }
        
        return out_pivot_point;
    },
    
    getPointOnHipCircle(angle) {
        hip_point = {
            x: this.spinePivotPoint.x + (this.spineLength/2) * Math.cos(angle),
            y: this.spinePivotPoint.y + (this.spineLength/2) * Math.sin(angle) 
        }
        return hip_point;
    },
    
    drawHipCircle() {
        context.beginPath();
        for (let angle = 0; angle <= 2 * Math.PI; angle += 0.01) {
            var hip_point = this.getPointOnHipCircle(angle)
            context.lineTo(hip_point.x, hip_point.y);
        }
        context.closePath();
        context.strokeStyle = "black";
        context.stroke();
    },
    
    moveHips() {
        while (cartesianDistance(this.hipPosition.x, this.hipPosition.y, this.spinePivotPoint.x, this.spinePivotPoint.y) > (this.spineLength/2)) {
            //move hips toward pivot point
            this.hipPosition.x += (this.spinePivotPoint.x - this.hipPosition.x) * 0.01;
            this.hipPosition.y += (this.spinePivotPoint.y - this.hipPosition.y) * 0.01;
        }
    },
    
    drawHips() {
        var hip_text = "\u23FA";
        var text_size = context.measureText(hip_text).width;
        context.fillStyle = this.color;
        context.save();
        context.translate(this.hipPosition.x, this.hipPosition.y);
        context.rotate(getAngleBetweenPoints(this.hipPosition.x, this.hipPosition.y, this.spinePivotPoint.x, this.spinePivotPoint.y));
        context.fillText(hip_text, -1*(text_size/2), text_size/2);
        context.restore();
    },
    
    drawSpine(show=false) {
        var spine_control_point = {x: this.spinePivotPoint.x, y: this.spinePivotPoint.y};
        var spine_angle = angleToMod2Pi(
            getAngleBetweenPoints(this.hipPosition.x, this.hipPosition.y, this.spinePivotPoint.x, this.spinePivotPoint.y) - 
            getAngleBetweenPoints(this.spinePivotPoint.x, this.spinePivotPoint.y, this.neckPosition.x, this.neckPosition.y)
        )
        
        const spine_bend_scale = 1.3;
        var spine_control_point = {
            x: this.spinePivotPoint.x - (spine_bend_scale*((this.hipPosition.x - this.spinePivotPoint.x) + (this.neckPosition.x - this.spinePivotPoint.x))/2),
            y: this.spinePivotPoint.y - (spine_bend_scale*((this.hipPosition.y - this.spinePivotPoint.y) + (this.neckPosition.y - this.spinePivotPoint.y))/2),
        }
        if (show) {
            var scp_text = ".";
            var text_size = context.measureText(scp_text).width;
            context.save();
            context.fillStyle = "black"
            context.translate(spine_control_point.x, spine_control_point.y);
            context.rotate(-1 * getAngleBetweenPoints(this.hipPosition.x, this.hipPosition.y, this.spinePivotPoint.x, this.spinePivotPoint.y)/2);
            context.fillText(scp_text, -1*(text_size/2), text_size/2);
            context.restore();
        }
        
        context.strokeStyle = this.color;
        context.beginPath();
        context.lineWidth = 3.5;
        context.moveTo(this.neckPosition.x, this.neckPosition.y);
        context.quadraticCurveTo(spine_control_point.x, spine_control_point.y, this.hipPosition.x, this.hipPosition.y);
        context.stroke();
    },
    
    getTailPivotPoint(show=false) {
        // tail tip traces out a circle around a central point
        var out_pivot_point = {x: this.hipPosition.x, y: this.hipPosition.y};

        out_pivot_point.y -= ((this.spinePivotPoint.y)-(this.hipPosition.y)) * (this.tailLength / this.spineLength);
        out_pivot_point.x -= ((this.spinePivotPoint.x)-(this.hipPosition.x)) * (this.tailLength / this.spineLength);
        
        if (show) {
            var cpText = "."
            context.save();
            context.font = (28*(this.scale/20)) + "px Georgia";
            context.fillStyle = "black";
            context.translate(out_pivot_point.x, out_pivot_point.y);
            var text_size = context.measureText(cpText).width;
            context.fillText(cpText, -1*(text_size/2), text_size/2);
            context.restore();
        }
        
        return out_pivot_point;
    },
    
    getPointOnTailCircle(angle) {
        tip_point = {
            x: this.tailPivotPoint.x + (this.tailLength/2) * Math.cos(angle),
            y: this.tailPivotPoint.y + (this.tailLength/2) * Math.sin(angle) 
        }
        return tip_point;
    },
    
    drawTailCircle(angle, tailScale) {
        context.beginPath();
        for (let angle = 0; angle <= 2 * Math.PI; angle += 0.01) {
            var hip_point = this.getPointOnTailCircle(angle)
            context.lineTo(hip_point.x, hip_point.y);
        }
        context.closePath();
        context.strokeStyle = "black";
        context.stroke();
    },
    
    swishTail() {
        var hipAngle = getAngleBetweenPoints(this.hipPosition.x, this.hipPosition.y, this.spinePivotPoint.x, this.spinePivotPoint.y);
        var deltaTailSwish = (Math.sin(angleToMod2Pi(Date.now() * this.tailSwishSpeed / 1000)))+Math.PI;
        var tailAngle = hipAngle + deltaTailSwish;
        this.tailAngle = tailAngle;
        var tailTip = this.getPointOnTailCircle(tailAngle);
        return tailTip;
    },
    
    drawTail(show) {
        var tail = {x: this.tailPivotPoint.x, y: this.tailPivotPoint.y};
        var tail_bend = angleToMod2Pi(
            getAngleBetweenPoints(this.hipPosition.x, this.hipPosition.y, this.tailPivotPoint.x, this.tailPivotPoint.y) - 
            getAngleBetweenPoints(this.tailPivotPoint.x, this.tailPivotPoint.y, this.tailPosition.x, this.tailPosition.y)
        )
        
        const tail_bend_scale = 1.3;
        var tail_control_point = {
            x: this.tailPivotPoint.x - (tail_bend_scale*((this.tailPosition.x - this.tailPivotPoint.x) + (this.hipPosition.x - this.tailPivotPoint.x))/2),
            y: this.tailPivotPoint.y - (tail_bend_scale*((this.tailPosition.y - this.tailPivotPoint.y) + (this.hipPosition.y - this.tailPivotPoint.y))/2),
        }
        if (show) {
            var scp_text = ".";
            var text_size = context.measureText(scp_text).width;
            context.save();
            context.fillStyle = "black"
            context.translate(tail_control_point.x, tail_control_point.y);
            context.rotate(-1 * getAngleBetweenPoints(this.tailPosition.x, this.tailPosition.y, this.tailPivotPoint.x, this.tailPivotPoint.y)/2);
            context.fillText(scp_text, -1*(text_size/2), text_size/2);
            context.restore();
        }
        context.strokeStyle = this.color;
        context.beginPath();
        context.lineWidth = 2;
        context.moveTo(this.hipPosition.x, this.hipPosition.y);
        context.quadraticCurveTo(tail_control_point.x, tail_control_point.y, this.tailPosition.x, this.tailPosition.y);
        context.stroke();
    },
    
    limbs: {},
    
    fire: {
        spurtClock: Date.now(),
        
        fireThickness: 10,
        burstSize: 100,
        
        particles: [],
        
        newParticle(source) {
            np = {
                location: {x: source.headPosition.x, y: source.headPosition.y},
                created: Date.now(),
                lastUpdated: Date.now(),
                angle: getAngleBetweenPoints(source.headPosition.x, source.headPosition.y, cursorPosition.x, cursorPosition.y),
                duration: source.fireDuration + ((Math.random()-0.5)*source.fireDuration),
                color: source.fireColor,
                symbol: source.fireSymbol,
                expired: false,
                move() {
                    this.angle += (Math.random() - 0.5) * source.fireSpread;
                    this.location.x += Math.cos(this.angle) * (source.fireSpeed+((Math.random()-0.5)*source.fireSpeed));
                    this.location.y += Math.sin(this.angle) * (source.fireSpeed+((Math.random()-0.5)*source.fireSpeed));
                },
                draw() {
                    var symbol_size = context.measureText(this.symbol).width;
                    context.save();
                    context.translate(this.location.x, this.location.y);
                    context.fillStyle = this.color;
                    context.fillText(this.symbol, -1*(symbol_size/2), symbol_size/2);
                    context.restore();
                },
                update() {
                    this.draw();
                    this.move();
                    this.lastUpdated = Date.now();
                    if ((Date.now() - this.created) > this.duration) {
                        this.expired = true;
                    }
                },
            }
            return np;
        },
        
        updateParticles() {
            for (var i=0; i < this.particles.length; i+=1) {
                this.particles[i].update();
            }
            // remove expired particles
            this.particles = this.particles.filter(obj => !obj.expired);
            console.log(this.particles.length);
            this.spurtClock = Date.now();
        },
        
        spurt() {
            var timeSinceLastSpurt = (Date.now() - this.spurtClock);
            if (timeSinceLastSpurt > this.burstSize) {
                timeSinceLastSpurt = this.burstSize;
            }
            for (var i=1; i < timeSinceLastSpurt - ((Math.random()*100)/this.fireThickness); i++) {
                this.particles.push(this.newParticle(dragon));
            }
        },
    },
    
    update() {
        if (isKeyDown("mouse")) {
            this.moveShoulders();   
            this.turnBody();
            this.moveHips();
        }
        if (isKeyDown(" ")) {
            this.fire.spurt();
        }
        this.fire.updateParticles();
        this.rotation = angleToMod2Pi(this.rotation);
        
        if (showGuides.checked) {
            this.drawHeadCardioid();
            this.drawHipCircle();
            this.drawTailCircle();
            show = true;
        } else {
            show=false;
        }
        
        this.headAngle += this.getDirectionHeadToCursor() * Math.PI * this.headTurnSpeed * (Date.now() - this.time) / 2000;
        if (this.headAngle < this.angleToAbsolute(this.minHeadAngle)) {
            this.headAngle = this.angleToAbsolute(this.minHeadAngle);
        } else if (this.headAngle > this.angleToAbsolute((2*Math.PI) - this.minHeadAngle)) {
            this.headAngle = this.angleToAbsolute((2*Math.PI) - this.minHeadAngle);
        }
        
        this.headPosition = this.getPointOnHeadCardioid(this.headAngle);
        this.neckControlPoint = this.getNeckControlPoint(show);
        this.spinePivotPoint = this.getSpinePivotPoint(show);
        this.tailPivotPoint = this.getTailPivotPoint(show);
        this.tailPosition = this.swishTail();
        this.drawTail(show);
        this.drawSpine(show);
        this.drawHips();
        this.drawNeck();
        this.drawShoulders();
        this.drawHead();
        this.time = Date.now();
    },
};

//initial setup
dragon.headCursorDistanceTolerance = dragon.scale/2;
dragon.spineLength = dragon.scale * 8;
dragon.tailLength = dragon.scale * 6;
dragon.hipPosition.x = dragon.neckPosition.x + dragon.spineLength;
dragon.hipPosition.y = dragon.neckPosition.y;

class FireParticle {
    constructor() {
       this.angle = 0; 
    }
    
}

function cartesianDistance(x1, y1, x2, y2) {
    return Math.sqrt(((x1-x2)**2) + ((y1-y2)**2))
}

function pointIsAboveLine(startX, startY, endX, endY, pointX, pointY) {
    m = (endY-startY) / (endX - startX);
    b = startY - (m * startX);
    return pointY > ((m * pointX) + b)
}

function getAngleBetweenPoints(x1, y1, x2, y2) {
    var angle_between_points = Math.atan2((y2-y1),(x2-x1));
    if (angle_between_points < 0) {
        angle_between_points += (Math.PI * 2);
    }
    return angle_between_points;
}

function angleToMod2Pi(angle) {
    while (angle < 0) {
        angle += (2* Math.PI);
    }
    return angle % (2* Math.PI);
}

function getPointAlongQuadraticCurve(startX, startY, cpX, cpY, endX, endY, t) {
    // t goes from 0 to 1
    var x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * cpX + t * t * endX;
    var y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * cpY + t * t * endY;
    return { x: x, y: y };
}

function isKeyDown(key) {
  return keyState[key] === true;
}

var keyState = {};

document.addEventListener('keydown', function(event) {
  keyState[event.key] = true;
});

document.addEventListener('keyup', function(event) {
  keyState[event.key] = false;
});

document.addEventListener('mousedown', function(event) {
  keyState['mouse'] = true;
});

document.addEventListener('mouseup', function(event) {
  keyState['mouse'] = false;
});

function render() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    dragon.update();
    
    // Loop the rendering
    requestAnimationFrame(render);
}
render();