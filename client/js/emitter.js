"use strict";

var app = app || {};

app.emitter = (function() {

    var numParticles = 25;
    var maxXspeed = 0.5;
    var maxYspeed = 0.5;
    var decayRate = 2.5;
    var lifetime = 150;
    var length = 5;

    var radius = undefined;
    var emitPoint = { };

    var particleArray = [ ];

    var initialize = function(startRadius) {

        radius = startRadius;

        for(var i = 0; i < numParticles; i++) {
            particleArray.push(initializeParticle());
        }
    };

    var updateAndDraw = function(startX, startY, ctx) {

        ctx.save();
        for(var i = 0; i < particleArray.length; i++) {
            var p = particleArray[i];
            
            p.age += decayRate;
            p.x += p.xSpeed;
            p.y += p.ySpeed;
            var alpha = 1 - p.age / lifetime;

            ctx.strokeStyle = "rgba(" + 0 + "," + 0 + "," + 0 + "," + alpha + ")"; 
            
            ctx.beginPath();
            ctx.moveTo(startX + p.x, startY + p.y);
            ctx.lineTo(startX + p.x + p.xLength, startY + p.y + p.yLength);
            ctx.closePath();
            ctx.stroke();
                   
            // if the particle is too old, recycle it
            if(p.age >= lifetime) {
                particleArray[i] = initializeParticle();
            }       
        }
        ctx.restore();
    };

    var initializeParticle = function() {

        var p = { };

        p.age = Math.random() * lifetime;
        p.angle = Math.random() * 360;

        var xAngle = Math.cos(p.angle);
        var yAngle = Math.sin(p.angle);

        // Start particles around (0, 0) and translate them later
        p.x = xAngle * radius;
        p.y = yAngle * radius;

        p.xLength = xAngle * length;
        p.yLength = yAngle * length;

        p.xSpeed = xAngle * (Math.random() * maxXspeed);
        p.ySpeed = yAngle * (Math.random() * maxYspeed);

        return p;
    };

    return {
        initialize: initialize,
        updateAndDraw: updateAndDraw
    };
}());