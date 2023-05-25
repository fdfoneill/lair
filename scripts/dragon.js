var showGuides = document.getElementById("showGuides");

const canvas = document.getElementById("lairCanvas");
const context = canvas.getContext("2d");
const rect = canvas.getBoundingClientRect();

const windowHeight = window.innerHeight;
const windowWidth = window.innerWidth;
const canvasSize = Math.min(windowHeight, windowWidth) * 0.8;
canvas.width = canvasSize;
canvas.height = canvasSize;

var cursorPosition = {x: 0, y: 0};

canvas.addEventListener("mousemove", (event) => {
    cursorPosition.x = event.clientX - rect.left;;
    cursorPosition.y = event.clientY - rect.top;;
});

const dragon = {
    rotation: 0,
    scale: canvasSize/50,
    color: "blue",
    time: Date.now(),
    
    directionHeadToCursor: 0,
    neckPosition: {x: canvas.width / 2, y: canvas.height / 2},
    headAngle: Math.PI,
    faceAngle: Math.PI,
    minHeadAngle: (2/5) * Math.PI,
    maxHeadTurn: (1/5) * Math.PI,
    headPosition: {x: 0, y: 0},
    headTurnSpeed: 3,
    neckControlPoint: {x: 0, y: 0},
    
    spinePivotPoint: {x: 0, y: 0},
    spineLength: 20,
    
    hipAngle: 0,
    hipPosition: {x: 0, y: 0},
    
    tailPivotPoint: {x: 0, y: 0},
    tailSwishSpeed: 1,
    tailAngle: 0,
    tailLength: 0,
    tailPosition: {x: 0, y: 0},
    
    bodyTurnSpeed: 1, 
    walkingSpeed: 1, // fraction of neck length moved per second
    headCursorDistanceTolerance: 1,
    
    fireSpeed: 4,
    fireDuration: 800,
    fireSpread: 0.3,
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
        var headText = "A";
        headText = "\u2660"; // spade
//        headText = "\u25B2"; // triangle solid
//        headText = "\u23CF"; // eject
//        headText = "\u2206"; // triangle hollow
        headText = "\u2665"; // heart inverted
        var head_text_rotation_offset = Math.PI;
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
        this.faceAngle = 
            getAngleBetweenPoints(this.headPosition.x, this.headPosition.y, this.neckControlPoint.x, this.neckControlPoint.y)-(Math.PI/2) + 
            head_rotation - 
            (Math.PI/2);
        context.rotate(head_rotation+head_text_rotation_offset);
        var text_size = context.measureText(headText).width;
        context.fillText(headText, -1*(text_size/2), text_size/2);
        // eyes
//        var eyeText = ":";
//        context.font = (28*(this.scale/40)) + "px Georgia";
//        var eye_width = context.measureText(eyeText).width;
//        var eye_height = context.measureText(eyeText).fontBoundingBoxAscent;
//        context.fillStyle = "white";
//        context.rotate(Math.PI/2);
//        context.fillText(eyeText, -1*(eye_width/2), eye_height/2);
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
        this.hipAngle = -hipAngle + Math.PI;
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
    
    // limbs
    maxClawStretch: 30* ((canvasSize/50)/12),
    maxFootStretch: 20* ((canvasSize/50)/12),
    
    limbClock: Date.now(),
    limbSpeedY: 10* ((canvasSize/50)/12),
    
    leftClawPosition: {
        relative: {x: -30* ((canvasSize/50)/12), y: 20* ((canvasSize/50)/12)},
        absolute: {x: 0, y: 0},
        snapY: 25* ((canvasSize/50)/12),
        stepping: true,
    },
    rightClawPosition: {
        relative: {x: 0* ((canvasSize/50)/12), y: -20* ((canvasSize/50)/12)},
        absolute: {x: 0, y: 0},
        snapY: -25* ((canvasSize/50)/12),
        stepping: false,
    },
    leftFootPosition: {
        relative: {x: 10* ((canvasSize/50)/12), y: 10* ((canvasSize/50)/12)},
        absolute: {x: 0, y: 0},
        snapY: 10* ((canvasSize/50)/12),
        stepping: true,
    },
    rightFootPosition: {
        relative: {x: -10* ((canvasSize/50)/12), y: -10* ((canvasSize/50)/12)},
        absolute: {x: 0, y: 0},
        snapY: -10* ((canvasSize/50)/12),
        stepping: false,
    },
    
    initializeLimbs(anchor) {
        function initializeLimb(limb, anchor, angle) {
            if (!limb.stepping) {
                limb.absolute = xyRelativeToAbsolute(limb.relative.x, limb.relative.y, anchor.x, anchor.y, angle);
            }
        }
        initializeLimb(this.leftClawPosition, this.neckPosition, this.rotation);
        initializeLimb(this.rightClawPosition, this.neckPosition, this.rotation);
        initializeLimb(this.leftFootPosition, this.hipPosition, this.hipAngle);
        initializeLimb(this.rightFootPosition, this.hipPosition, this.hipAngle);
    },
    
    fixLimb(limb, anchor, angle, opposite, maxStretch, xOffset=0) {
        // emergency reset!
        if (
            (cartesianDistance(limb.absolute.x, limb.absolute.y, anchor.x, anchor.y) > (maxStretch*2)) & 
            (cartesianDistance(opposite.absolute.x, opposite.absolute.y, anchor.x, anchor.y) > (maxStretch*2))
        ) {
            console.log("emergency limb fix");
            limb.relative.x = 0+xOffset;
            opposite.relative.x = 0;
        }
        // if limb has crossed over body
        if ((limb.relative.y * limb.snapY) < 0) {
            limb.relative.y += (limb.snapY-limb.relative.y) * (Date.now() - this.limbClock) * (this.limbSpeedY/1000);
        }
        if (limb.stepping) {
            limb.relative.x = (-opposite.relative.x) + xOffset;
            if (limb.relative.y != limb.snapY) {
                limb.relative.y += (limb.snapY-limb.relative.y) * (Date.now() - this.limbClock) * (this.limbSpeedY/1000);
            }
        } else {
            limb.relative = xyAbsoluteToRelative(
                limb.absolute.x,
                limb.absolute.y,
                anchor.x,
                anchor.y,
                angle
            );
//            if (cartesianDistance(limb.absolute.x, limb.absolute.y, anchor.x, anchor.y) > maxStretch) {
//                limb.stepping = !limb.stepping;
//                opposite.stepping = !opposite.stepping;
//            }
            if (limb.relative.x > (maxStretch+xOffset)) {
                limb.stepping = !limb.stepping;
                opposite.stepping = !opposite.stepping;
            }
        }
        limb.absolute = xyRelativeToAbsolute(
            limb.relative.x,
            limb.relative.y,
            anchor.x,
            anchor.y,
            angle
        )
    },
    
    updateLimbs() {
        this.fixLimb(this.leftClawPosition, this.neckPosition, this.rotation, this.rightClawPosition, this.maxClawStretch, -20);
        this.fixLimb(this.rightClawPosition, this.neckPosition, this.rotation, this.leftClawPosition, this.maxClawStretch, -20);
        this.fixLimb(this.leftFootPosition, this.hipPosition, this.hipAngle, this.rightFootPosition, this.maxFootStretch);
        this.fixLimb(this.rightFootPosition, this.hipPosition, this.hipAngle, this.leftFootPosition, this.maxFootStretch);
        
        this.limbClock = Date.now();
    },
    
    drawLimb(limb, anchor, angle, xOffset=0) {
        var extremity_text = "\u25B4";
        var text_size = context.measureText(extremity_text).width;
        context.fillStyle = this.color;
        context.save();
        if (xOffset==0) {
            var limb_position = {x: limb.absolute.x+xOffset, y: limb.absolute.y};
        } else {
            var limb_position = xyRelativeToAbsolute(limb.relative.x + xOffset, limb.relative.y, anchor.x, anchor.y, angle);
        }
        context.translate(limb_position.x, limb_position.y);
        context.rotate(-angle - (Math.PI/2));
        context.fillText(extremity_text, -1*(text_size/2), text_size/2);
        context.restore();
    },
    
    leftElbowPosition: {
        relative: {x: 0, y: 0},
        absolute: {x: 0, y: 0},
    },
    
    rightElbowPosition: {
        relative: {x: 0, y: 0},
        absolute: {x: 0, y: 0},
    },
    
    drawLeftArm() {
        var boneLength = this.maxClawStretch / 2;
        var psi = getAngleBetweenPoints(0,0, this.leftClawPosition.relative.x, this.leftClawPosition.relative.y);
        var l = cartesianDistance(this.neckPosition.x, this.neckPosition.y, this.leftClawPosition.absolute.x, this.leftClawPosition.absolute.y);
        var phi = Math.acos(((l/2)/20));
        var elbowpos = {x: Math.cos(psi-phi)*boneLength, y: Math.sin(psi-phi)*boneLength};
        this.leftElbowPosition.relative = {x:elbowpos.x, y: elbowpos.y};
        elbowpos = xyRelativeToAbsolute(elbowpos.x, elbowpos.y, this.neckPosition.x, this.neckPosition.y, this.rotation);
        if (isNaN(elbowpos.x) | isNaN(elbowpos.y)) {
            elbowpos.x = ((this.neckPosition.x + this.leftClawPosition.absolute.x)/2);
            elbowpos.y = ((this.neckPosition.y + this.leftClawPosition.absolute.y)/2);
        }
        this.leftElbowPosition.absolute = {x:elbowpos.x, y: elbowpos.y};
        context.beginPath();
        context.moveTo(this.neckPosition.x, this.neckPosition.y);
        context.lineTo(elbowpos.x, elbowpos.y);
        context.lineTo(this.leftClawPosition.absolute.x, this.leftClawPosition.absolute.y);
        context.stroke();
    },
    
    drawRightArm() {
        var boneLength = this.maxClawStretch / 2;
        var psi = getAngleBetweenPoints(0,0, this.rightClawPosition.relative.x, this.rightClawPosition.relative.y);
        var l = cartesianDistance(this.neckPosition.x, this.neckPosition.y, this.rightClawPosition.absolute.x, this.rightClawPosition.absolute.y);
        var phi = Math.acos(((l/2)/20));
        var elbowpos = {x: Math.cos(psi+phi)*boneLength, y: Math.sin(psi+phi)*boneLength};
        this.rightElbowPosition.relative = {x:elbowpos.x, y: elbowpos.y};
        elbowpos = xyRelativeToAbsolute(elbowpos.x, elbowpos.y, this.neckPosition.x, this.neckPosition.y, this.rotation);
        if (isNaN(elbowpos.x) | isNaN(elbowpos.y)) {
            elbowpos.x = ((this.neckPosition.x + this.rightClawPosition.absolute.x)/2);
            elbowpos.y = ((this.neckPosition.y + this.rightClawPosition.absolute.y)/2);
        }
        this.rightElbowPosition.absolute = {x:elbowpos.x, y: elbowpos.y};
        context.beginPath();
        context.moveTo(this.neckPosition.x, this.neckPosition.y);
        context.lineTo(elbowpos.x, elbowpos.y);
        context.lineTo(this.rightClawPosition.absolute.x, this.rightClawPosition.absolute.y);
        context.stroke();
    },
    
    drawLeftLeg() {
        var boneLength = this.maxFootStretch * (4/3);
        var leftKneePosition = {x: (0.5*this.leftFootPosition.relative.x) - (boneLength/2), y: this.leftFootPosition.relative.y/2};
        var leftHeelPosition = {x: (0.5*this.leftFootPosition.relative.x) + (boneLength/2), y: this.leftFootPosition.relative.y/2};
        leftKneePosition = xyRelativeToAbsolute(leftKneePosition.x, leftKneePosition.y, this.hipPosition.x, this.hipPosition.y, this.hipAngle);
        leftHeelPosition = xyRelativeToAbsolute(leftHeelPosition.x, leftHeelPosition.y, this.hipPosition.x, this.hipPosition.y, this.hipAngle);
        context.beginPath();
        context.moveTo(this.hipPosition.x, this.hipPosition.y);
        context.lineTo(leftKneePosition.x, leftKneePosition.y);
        context.lineTo(leftHeelPosition.x, leftHeelPosition.y);
        context.lineTo(this.leftFootPosition.absolute.x, this.leftFootPosition.absolute.y);
        context.stroke();
    },
    
    drawRightLeg() {
        var boneLength = this.maxFootStretch*(4/3);
        var rightKneePosition = {x: (0.5*this.rightFootPosition.relative.x) - (boneLength/2), y: this.rightFootPosition.relative.y/2};
        var rightHeelPosition = {x: (0.5*this.rightFootPosition.relative.x) + (boneLength/2), y: this.rightFootPosition.relative.y/2};
        rightKneePosition = xyRelativeToAbsolute(rightKneePosition.x, rightKneePosition.y, this.hipPosition.x, this.hipPosition.y, this.hipAngle);
        rightHeelPosition = xyRelativeToAbsolute(rightHeelPosition.x, rightHeelPosition.y, this.hipPosition.x, this.hipPosition.y, this.hipAngle);
        context.beginPath();
        context.moveTo(this.hipPosition.x, this.hipPosition.y);
        context.lineTo(rightKneePosition.x, rightKneePosition.y);
        context.lineTo(rightHeelPosition.x, rightHeelPosition.y);
        context.lineTo(this.rightFootPosition.absolute.x, this.rightFootPosition.absolute.y);
        context.stroke();
    },
    
    drawLeftWing(wingLength) {
        wingLength *= this.spineLength;
        var maxTipAngle = (1*Math.PI)/4;
        var angleElbowToWingTip = 
            ((2*Math.PI) - getAngleBetweenPoints(
                this.leftClawPosition.relative.x, 
                this.leftClawPosition.relative.y, 
                this.leftElbowPosition.relative.x, 
                this.leftElbowPosition.relative.y)
            ) + maxTipAngle;
        if (angleElbowToWingTip > (Math.PI * 2)) {
            angleElbowToWingTip -= (Math.PI * 2);
        }
        var innerAngles = angleElbowToWingTip / 5;
        var fingerProportions = [0.8, 1.0, 0.8, 0.6];
        for (var i = 0; i <4; i++) {
            var tipAngle = maxTipAngle - (innerAngles * i);
            var fingerLength = wingLength * fingerProportions[i];
            wingTipRelativeX = this.leftClawPosition.relative.x + (fingerLength) * Math.cos(tipAngle);
            wingTipRelativeY = this.leftClawPosition.relative.y + (fingerLength) * Math.sin(tipAngle);
            wingTipAbsolute = xyRelativeToAbsolute(wingTipRelativeX, wingTipRelativeY, this.neckPosition.x, this.neckPosition.y, this.rotation);

            context.beginPath();
            context.moveTo(this.leftClawPosition.absolute.x, this.leftClawPosition.absolute.y);
            context.lineTo(wingTipAbsolute.x, wingTipAbsolute.y);
            context.stroke();
        }
    },
    
    drawRightWing(wingLength) {
        wingLength *= this.spineLength;
        var maxTipAngle = (7*Math.PI)/4;
        var angleElbowToWingTip = 
            (getAngleBetweenPoints(
                this.rightClawPosition.relative.x, 
                this.rightClawPosition.relative.y, 
                this.rightElbowPosition.relative.x, 
                this.rightElbowPosition.relative.y)
            ) + maxTipAngle - (3*Math.PI/2);
        console.log(angleElbowToWingTip)
        if (angleElbowToWingTip > (Math.PI * 2)) {
            angleElbowToWingTip -= (Math.PI * 2);
        }
        var innerAngles = angleElbowToWingTip / 5;
        var fingerProportions = [0.8, 1.0, 0.8, 0.6];
        for (var i = 0; i <4; i++) {
            var tipAngle = maxTipAngle + (innerAngles * i);
            var fingerLength = wingLength * fingerProportions[i];
            wingTipRelativeX = this.rightClawPosition.relative.x + (fingerLength) * Math.cos(tipAngle);
            wingTipRelativeY = this.rightClawPosition.relative.y + (fingerLength) * Math.sin(tipAngle);
            wingTipAbsolute = xyRelativeToAbsolute(wingTipRelativeX, wingTipRelativeY, this.neckPosition.x, this.neckPosition.y, this.rotation);

            context.beginPath();
            context.moveTo(this.rightClawPosition.absolute.x, this.rightClawPosition.absolute.y);
            context.lineTo(wingTipAbsolute.x, wingTipAbsolute.y);
            context.stroke();
        }
    },
    
    drawLimbs() {
        this.drawLeftArm();
        this.drawRightArm();
        this.drawLeftLeg();
        this.drawRightLeg();
        
        this.drawLeftWing(1.3);
        this.drawRightWing(1.3);
        
        this.drawLimb(this.leftClawPosition, this.neckPosition, this.rotation, 0);
        this.drawLimb(this.rightClawPosition, this.neckPosition, this.rotation, 0);
        this.drawLimb(this.leftFootPosition, this.hipPosition, this.rotation);
        this.drawLimb(this.rightFootPosition, this.hipPosition, this.rotation);
    },
    
    fire: {
        spurtClock: Date.now(),
        
        fireThickness: 10,
        burstSize: 100,
        maxFireTank: 1000,
        currentFireTank: 0,
        tankRefillSpeed: 200,
        tankClock: Date.now(),
        fireLock: false,
        fireFloor: 900,
        
        particles: [],
        
        newParticle(source) {
            np = {
                location: {x: source.headPosition.x, y: source.headPosition.y},
                created: Date.now(),
                lastUpdated: Date.now(),
                //angle: getAngleBetweenPoints(source.headPosition.x, source.headPosition.y, cursorPosition.x, cursorPosition.y),
                angle: source.faceAngle,
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
            // update fireLock
            if (!this.fireLock) {
                if (this.currentFireTank < 1) {
                    this.fireLock = true;
                }
            } else if (this.currentFireTank >= this.fireFloor) {
                this.fireLock = false;
            }
            // refill tank
            if (this.currentFireTank < this.maxFireTank) {
                this.currentFireTank += Math.floor(
                    Math.min(((Date.now() - this.spurtClock)/1000) * this.tankRefillSpeed, (this.maxFireTank-this.currentFireTank))
                );
            }
            this.spurtClock = Date.now();
        },
        
        spurt() {
            if (!this.fireLock) {
                var timeSinceLastSpurt = (Date.now() - this.spurtClock);
                if (timeSinceLastSpurt > this.burstSize) {
                    timeSinceLastSpurt = this.burstSize;
                }
                var spurtSize = timeSinceLastSpurt;
                for (var i=1; i < spurtSize; i++) {
                    this.particles.push(this.newParticle(dragon));
                    this.currentFireTank -= 1;
                    this.currentFireTank = Math.max(this.currentFireTank, 0);
                }
            }
        },
        
        drawTank() {
            context.save();
            if (this.currentFireTank > (this.maxFireTank * 0.66)) {
                context.fillStyle = "green";
            } else if (this.currentFireTank > (this.maxFireTank * 0.33)) {
                context.fillStyle = "orange";
            } else {
                context.fillStyle = "red";
            }
            var tankText = "Fire: " + Math.floor(this.currentFireTank/10) + "/" + Math.floor(this.maxFireTank/10);
            if (this.fireLock) {
                context.fillStyle = "gray";
            }
            context.fillText(tankText, 5,15);
            context.restore();
        },
    },
    
    update() {
        if (isKeyDown(" ")) {
            this.moveShoulders();   
            this.turnBody();
            this.moveHips();
        }
        if (isKeyDown("f")) {
            this.fire.spurt();
        }
        this.fire.drawTank();
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
        this.updateLimbs();
        
        this.drawLimbs();
        this.drawTail(show);
        this.drawSpine(show);
        this.drawHips();
        this.drawNeck();
        this.drawShoulders();
        this.fire.updateParticles();
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
dragon.fire.currentFireTank = dragon.fire.maxFireTank;
dragon.initializeLimbs();
dragon.maxClawStretch = dragon.maxClawStretch * (dragon.scale/12);
dragon.maxFootStretch = dragon.maxFootStretch * (dragon.scale/12);


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

function xyRelativeToAbsolute(x, y, center_x, center_y, angle) {
    var absolute_xy = {x: (Math.sin(angle)*y)+(Math.cos(-angle)*x), y: (Math.cos(angle)*y)+(Math.sin(-angle)*x)};
    absolute_xy.x += center_x;
    absolute_xy.y += center_y;
    return absolute_xy;
}

function xyAbsoluteToRelative(absolute_x, absolute_y, center_x, center_y, angle) {
    // Step 1: Shifting the coordinates
    var shifted_x = absolute_x - center_x;
    var shifted_y = absolute_y - center_y;

    // Step 2: Rotating the coordinates
    var relative_x = (Math.cos(angle) * shifted_x) - (Math.sin(angle) * shifted_y);
    var relative_y = (Math.sin(angle) * shifted_x) + (Math.cos(angle) * shifted_y);

    return { x: relative_x, y: relative_y };
}

function findIsoscelesKnee(extremityX, extremityY, boneLength) {
    1;
}

function isKeyDown(key) {
  return keyState[key] === true;
}

var keyState = {};

document.addEventListener('keydown', function(event) {
    if (event.key == " ") {
        event.preventDefault();
    }
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