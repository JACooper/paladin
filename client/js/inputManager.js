"use strict";

var app = app || { };

app.inputManager = (function() {
    var keyManager = { };
    keyManager.keydown = [ ];

    window.addEventListener("keydown", function(e) {
        keyManager.keydown[e.keyCode] = true;
    });
        
    window.addEventListener("keyup", function(e) {
        keyManager.keydown[e.keyCode] = false;
        
        if (e.keyCode == 13) {  // 'ENTER' key
            app.main.enterOption();
        } else {
            var char = String.fromCharCode(e.keyCode);
            if (char === "1" || char === "2" || char === "3") {
                app.main.selectOption(parseInt(char) - 1);
            }
            if (char === "v" || char === "V") {
                app.main.toggleVirtue();
            }
        }
    });
}());