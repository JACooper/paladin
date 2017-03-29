"use strict";

var app = app || { };

window.onload = function() {
    //console.log("window.onload called");
    app.main.questManager = app.questManager;
    app.main.inputManager = app.inputManager;
    app.main.assetManager = app.assetManager;
    app.main.soundManager = app.soundManager;
    app.main.soundManager.init();
    app.main.emitter = app.emitter;
    app.main.init();
};