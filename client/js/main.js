"use strict";

var app = app || { };

// Object literal that ties our modules all together
app.main = {
    GAME_STATE: Object.freeze({ // fake enum - maybe change later
        LOADING: 0,
        DEFAULT: 1,
        RESOLVING: 2,
        PAUSED: 3,
        END: 4
    }),
    PLAYER_STATE: Object.freeze({
        ALIVE: 0,
        DEAD: 1,
        WON: 2,
        LEVEL: 3
    }),
    WIDTH: 800,
    CHAR_INFO_WIDTH: 200,
    HEIGHT: 500,

    PROMPT_OFFSET_HEIGHT: 50,
    PROMPT_OFFSET_WIDTH: 50,
    PROMPT_LINE_HEIGHT: 40,
    PROMPT_FONT: "28px MedievalSharp",
    PROMPT_FONT_COLOR: '#121212',

    OPTION_OFFSET_HEIGHT: 330,
    OPTION_OFFSET_WIDTH: 55,
    OPTION_RIGHT_MARGIN: 10,
    OPTION_LINE_HEIGHT: 60,
    OPTION_SPACING: 25,
    OPTION_FONT: "20px MedievalSharp",
    OPTION_FONT_COLOR: '#121212',

    CHAR_NAME_FONT: '26px MedievalSharp',
    CHAR_NAME_COLOR: "#FFDDBB",
    CHAR_NAME_WIDTH_OFFSET: 100,    // CHAR_INFO_WIDTH / 2
    CHAR_NAME_HEIGHT_OFFSET: 230,
    CHAR_NAME_LINE_HEIGHT: 35,

    CHAR_STAT_FONT: '24px MedievalSharp',
    CHAR_STAT_MAIN_COLOR: '#DDBB44',
    CHAR_STAT_HLTH_COLOR: '#AA3333',
    CHAR_STAT_VIRT_COLOR: '#4466FF',
    CHAR_STAT_EXP_COLOR: '#CCCCCC',
    CHAR_STAT_WIDTH_OFFSET: 15,
    CHAR_STAT_HEIGHT_OFFSET: 270,   // this.CHAR_NAME_HEIGHT_OFFSET + this.CHAR_NAME_LINE_HEIGHT + 15,
    CHAR_STAT_LINE_HEIGHT: 30,

    CURSOR_NUM_WIDTH_DIVS: 6,
    CURSOR_NUM_HEIGHT_DIVS: 4,
    CURSOR_DISPLAY_MEASURE: 30,
    CURSOR_DISPLAY_WIDTH_SPACING: 10,
    CURSOR_ANIM_DELAY: 3,

    QUESTS: ["jsondata/questIntro.json", "jsondata/questLevel.json", "jsondata/questDeath.json", "jsondata/questVictory.json", "jsondata/questMain.json"],
    IMAGES: ["assets/images/player.png", "assets/images/cursor.png", "assets/images/mainBackgroundAlt.jpg"],
    AUDIO: ["assets/audio/behelit.mp3", "assets/audio/select.wav", "assets/audio/enter.wav"],
    resourcesLoaded: 0,

    canvas: undefined,
    ctx: undefined,

    questManager: undefined,    // Required module
    inputManager: undefined,    // Required module
    assetManager: undefined,    // Required module
    emitter: undefined,

    gameState: undefined,

    player: undefined,
    playerState: undefined,

    pausePriorState: undefined,

    currentQuest: undefined,
    selectedOption: undefined,
    soX: undefined,
    soY: undefined,
    canChoose: true,
    usingVirtue: false,
    currResolution: undefined,

    cursorX: undefined,
    cursorY: undefined,
    cursorWdtInt: undefined,
    cursorHgtInt: undefined,
    cursorAnimTime: undefined,

    animationID: 0,

    // Initialization
    init: function() {
        this.canvas = document.querySelector('canvas');
        this.canvas.width = this.WIDTH + this.CHAR_INFO_WIDTH;
        this.canvas.height = this.HEIGHT;
        this.ctx = this.canvas.getContext('2d');

        this.selectedOption = null;
        this.player = new Player("Paladin Jude", 5, 5, null, 4, 4, 4, 1, 0, 1);

        this.gameState = this.GAME_STATE.LOADING;
        this.playerState = this.PLAYER_STATE.ALIVE;
        
        this.QUESTS.forEach(this.loadQuest.bind(this));
        this.IMAGES.forEach(this.loadImage.bind(this));
        this.AUDIO.forEach(this.loadSound.bind(this));

        this.emitter.initialize(this.CURSOR_DISPLAY_MEASURE / 2)

        window.onblur = this.pauseGame.bind(this);
        window.onfocus = this.resumeGame.bind(this);

        this.update();
    },

    // Update (display quest, play music)
    update: function() {
        this.animationID = requestAnimationFrame(this.update.bind(this));
        if (this.gameState === this.GAME_STATE.LOADING) {
            this.showLoadProgress();
        } else if (this.gameState === this.GAME_STATE.PAUSED) {
            this.drawPaused();
        } else if (this.gameState === this.GAME_STATE.RESOLVING) {
            this.drawResolution();
        } else if (this.gameState === this.GAME_STATE.DEFAULT
                    || this.gameState === this.GAME_STATE.END) {
            this.drawScene();
        }
    },

    //  --  Logic functions     --
    selectOption: function(index) {
        var newOption = this.currentQuest.options[index];
        if (newOption !== null) {
            this.soundManager.playEffect('select');
            this.selectedOption = newOption;
            this.checkIfCanUse();
        } else {
            this.selectedOption = null;
        }
    },

    enterOption: function() {
        // If the game was displaying a quest resolution, move on to the next quest
        if (this.gameState === this.GAME_STATE.RESOLVING) {
            this.gameState = this.GAME_STATE.DEFAULT;
            this.proceedToNext();
        } else if (this.gameState === this.GAME_STATE.PAUSED) {
            this.drawPaused();
        } else if (this.gameState === this.GAME_STATE.END) {
            this.restart();
        } else if (this.selectedOption !== null) {
            // If the player selected a valid option, process it
            if (this.canChoose === true) {
                this.soundManager.playEffect('enter');

                if (this.usingVirtue) {
                    var optReq = this.selectedOption.requirements;

                    // Minor DRY violation to prevent having to pass all this data around
                    var strReqDiff = this.player.str - optReq.strReq;
                    var sklReqDiff = this.player.skl - optReq.sklReq;
                    var wlpReqDiff = this.player.wlp - optReq.wlpReq;

                    var mostUsed = Math.min(strReqDiff, sklReqDiff, wlpReqDiff);
                    if (mostUsed < 0) {
                        // Reduce the player's virtue by the biggest difference
                        // (if virtue was required in the 1st place)
                        this.player.virtue += mostUsed;
                    }

                    this.usingVirtue = false;   // "Turn off" virtue
                }

                var resolution = this.questManager.loadNextQuest(this.selectedOption);

                this.selectedOption = null;     // Clear out current option

                if (resolution !== null) {
                    this.gameState = this.GAME_STATE.RESOLVING;
                    this.procResolution(resolution);
                } else {
                    this.proceedToNext();
                }
            }
        }
    },

    checkIfCanUse: function() {
        var optReq = this.selectedOption.requirements;

        var strReqDiff = this.player.str - optReq.strReq;
        var sklReqDiff = this.player.skl - optReq.sklReq;
        var wlpReqDiff = this.player.wlp - optReq.wlpReq;

        if (this.usingVirtue) {
            strReqDiff += this.player.virtue;
            sklReqDiff += this.player.virtue;
            wlpReqDiff += this.player.virtue;
        }

        if (strReqDiff >= 0 && sklReqDiff >= 0 && wlpReqDiff >= 0) {
            this.canChoose = true;
        } else {
            this.canChoose = false;
        }
    },

    restart: function() {
        this.player = new Player("Paladin Jude", 5, 5, null, 4, 4, 4, 1, 0, 1);
        this.introQuest();
        this.beginAudio();
        this.questManager.reset();
        this.selectedOption = null;
        this.playerState = this.PLAYER_STATE.ALIVE;
        this.gameState = this.GAME_STATE.DEFAULT;
    },

    toggleVirtue: function() {
        this.usingVirtue = !this.usingVirtue;
        this.checkIfCanUse();
    },

    proceedToNext: function() {

        if (this.questManager.checkWon()) {
            this.playerState = this.PLAYER_STATE.WON;
        }

        if (this.playerState === this.PLAYER_STATE.WON) {
            this.endQuest(true);
        } else if (this.playerState === this.PLAYER_STATE.DIED) {
            this.endQuest(false);
        } else if (this.playerState === this.PLAYER_STATE.LEVEL) {
            this.levelQuest();
        } else {
            this.nextQuest();
        }
    },

    procResolution: function(resolution) {
        this.player.health += resolution[0];

        if (this.player.health <= 0) {
            this.playerState = this.PLAYER_STATE.DIED;
        } else {

            this.player.str += resolution[1];
            this.player.skl += resolution[2];
            this.player.wlp += resolution[3];
            this.player.virtue += resolution[4];

            this.player.currExp += resolution[5];
            var expDiff = this.player.currExp - this.player.maxExp;

            if (expDiff >= 0) {
                this.playerState = this.PLAYER_STATE.LEVEL;
                this.player.maxExp *= 2;
                if (expDiff > 0) {
                    // Prevent leveling up multiple times at once
                    if (expDiff >= this.player.maxExp) {
                        expDiff = this.player.maxExp - 1;
                    }

                    this.player.currExp = expDiff;
                }
            }
        }

        this.currResolution = resolution;
    },

    nextQuest: function() {
        this.currentQuest = this.questManager.getCurrentQuest();
        this.beginAudio();
    },

    introQuest: function() {
        this.currentQuest = this.questManager.getIntroQuest();
    },

    levelQuest: function() {
        this.currentQuest = this.questManager.getLevelQuest();
        this.playerState = this.PLAYER_STATE.ALIVE;
    },

    /**
     * Loads either the death or victory quest/scene
     * @param victory - bool representing whether player died or won
     */
    endQuest: function(victory) {
        if (victory) {
            this.currentQuest = this.questManager.getVictoryQuest();
        } else {
            this.currentQuest = this.questManager.getDeathQuest();
        }

        this.gameState = this.GAME_STATE.END;
    },

    beginAudio: function() {
        if (this.currentQuest !== undefined) {
            if (this.currentQuest.audio !== null) {
                var audioSrc = this.currentQuest.audio;
                this.soundManager.changeTrack(audioSrc);
            } else {
                this.soundManager.pauseTrack();
            }
        }
    },

    pauseGame: function() {
        if (this.gameState !== this.GAME_STATE.PAUSED) {
            cancelAnimationFrame(this.animationID);
            this.pausePriorState = this.gameState;
            this.gameState = this.GAME_STATE.PAUSED;
            this.soundManager.pauseTrack();
            this.update();
        }
    },

    resumeGame: function() {
        if (this.gameState === this.GAME_STATE.PAUSED) {
            cancelAnimationFrame(this.animationID);
            this.gameState = this.pausePriorState;
            this.soundManager.playTrack();
            this.update();
        }
    },

    //  --  Drawing functions   --
    drawScene: function() {
        this.drawBackground();
        this.ctx.font = this.PROMPT_FONT;
        this.ctx.fillStyle = this.PROMPT_FONT_COLOR;

        var promptLines = this.getLines(this.ctx, this.currentQuest.prompt, this.WIDTH - this.PROMPT_OFFSET_WIDTH * 2);
        for (var i = 0; i < promptLines.length; ++i) {
            this.ctx.fillText(promptLines[i], this.PROMPT_OFFSET_WIDTH, this.PROMPT_OFFSET_HEIGHT + (this.PROMPT_LINE_HEIGHT * i));
        }

        // The null check is basically redundant, here for demo purposes. Remove later on.
        if (this.currentQuest.options !== null) {
            this.ctx.font = this.OPTION_FONT;

            var promptPrefix = "";
            var optReq = { };
            var currOpt = { };
            for (var j = 0; j < this.currentQuest.options.length; ++j) {
                promptPrefix = (j + 1) + " - ";
                currOpt = this.currentQuest.options[j];
                optReq = currOpt.requirements;
                if (optReq.strReq > 0) {
                    promptPrefix += "[STR " + optReq.strReq + "] ";
                }
                if (optReq.sklReq > 0) {
                    promptPrefix += "[SKL " + optReq.sklReq + "] ";
                }
                if (optReq.wlpReq > 0) {
                    promptPrefix += "[WLP " + optReq.wlpReq + "] ";
                }

                var optX = this.OPTION_OFFSET_WIDTH;
                var optY = this.OPTION_OFFSET_HEIGHT + (this.OPTION_LINE_HEIGHT * j);

                if (currOpt === this.selectedOption) {
                    this.soX = optX;
                    this.soY = optY;
                    if (this.canChoose === true) {
                        if (this.usingVirtue) {
                            this.ctx.fillStyle = this.CHAR_STAT_VIRT_COLOR;
                        } else {
                            this.ctx.fillStyle = "#228822";
                        }
                    } else {
                        // this.ctx.fillStyle = "#4B4B4B";
                        this.ctx.fillStyle = "#882222";
                    }
                } else {
                    this.ctx.fillStyle = this.OPTION_FONT_COLOR;
                }

                promptPrefix += currOpt.text;
                var optionLines = this.getLines(this.ctx, promptPrefix, this.WIDTH - this.OPTION_OFFSET_WIDTH - this.OPTION_RIGHT_MARGIN);

                for (var k = 0; k < optionLines.length; ++k) {
                    this.ctx.fillText(optionLines[k], optX, optY + (this.OPTION_SPACING * k));
                }
            }
        }

        this.drawHUD();
        this.drawCursor();
        this.drawParticles();
    },

    drawHUD: function() {
        
        // this.ctx.fillStyle = '#222222';
        this.ctx.fillStyle = "rgba(2, 2, 2, 0.8)";
        this.ctx.fillRect(this.WIDTH, 0, this.CHAR_INFO_WIDTH, this.canvas.height);  // Draw character info bar

        this.ctx.drawImage(this.assetManager.getPlayerPortrait(), this.WIDTH, 0);

        this.ctx.font = this.CHAR_NAME_FONT;
        this.ctx.textAlign = "center";
        this.ctx.fillStyle = this.CHAR_NAME_COLOR;
        var currName = this.player.name;
        this.ctx.fillText(currName, this.WIDTH + this.CHAR_NAME_WIDTH_OFFSET, this.CHAR_NAME_HEIGHT_OFFSET);

        this.ctx.textAlign = "left";
        this.ctx.font = this.CHAR_STAT_FONT;
        this.ctx.fillStyle = this.CHAR_STAT_HLTH_COLOR;
        var currHlth = "HEALTH :  " + this.player.health;
        this.ctx.fillText(currHlth, this.WIDTH + this.CHAR_STAT_WIDTH_OFFSET, this.CHAR_STAT_HEIGHT_OFFSET + this.CHAR_STAT_LINE_HEIGHT * 0);

        this.ctx.fillStyle = this.CHAR_STAT_MAIN_COLOR;
        var currStr = "STRENGTH :  " + this.player.str;
        var currSkl = "SKILL :  " + this.player.skl;
        var currWlp = "WILLPOWER :  " + this.player.wlp;
        this.ctx.fillText(currStr, this.WIDTH + this.CHAR_STAT_WIDTH_OFFSET, this.CHAR_STAT_HEIGHT_OFFSET + this.CHAR_STAT_LINE_HEIGHT * 1);
        this.ctx.fillText(currSkl, this.WIDTH + this.CHAR_STAT_WIDTH_OFFSET, this.CHAR_STAT_HEIGHT_OFFSET + this.CHAR_STAT_LINE_HEIGHT * 2);
        this.ctx.fillText(currWlp, this.WIDTH + this.CHAR_STAT_WIDTH_OFFSET, this.CHAR_STAT_HEIGHT_OFFSET + this.CHAR_STAT_LINE_HEIGHT * 3);

        this.ctx.fillStyle = this.CHAR_STAT_VIRT_COLOR;
        var currVirt = "VIRTUE :  " + this.player.virtue;
        this.ctx.fillText(currVirt, this.WIDTH + this.CHAR_STAT_WIDTH_OFFSET, this.CHAR_STAT_HEIGHT_OFFSET + this.CHAR_STAT_LINE_HEIGHT * 4);

        this.ctx.fillStyle = this.CHAR_STAT_EXP_COLOR;
        var currExp = "XP :  " + this.player.currExp + " / " + this.player.maxExp;
        this.ctx.fillText(currExp, this.WIDTH + this.CHAR_STAT_WIDTH_OFFSET, this.CHAR_STAT_HEIGHT_OFFSET + this.CHAR_STAT_LINE_HEIGHT * 5);

    },

    drawBackground: function() {
        // Ignore drawing backgrounds for now
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(0, 0, this.WIDTH, this.canvas.height);

        if (this.currentQuest !== undefined) {
            if (this.currentQuest.background !== null) {
                var bg = this.assetManager.getImage(this.currentQuest.background);
                this.ctx.drawImage(bg, 0, 0, bg.naturalWidth, bg.naturalHeight, 0, 0, this.canvas.width, this.canvas.height);
            }
        }
    },

    drawCursor: function() {
        if (this.selectedOption !== null) {
            var cursor = this.assetManager.getCursor();

            // Get these once so we don't have to keep querying the size
            // If any are undefined, they all will be so set them all
            if (this.cursorWdtInt === undefined) {
                this.cursorWdtInt = cursor.naturalWidth / this.CURSOR_NUM_WIDTH_DIVS;
                this.cursorHgtInt = cursor.naturalHeight / this.CURSOR_NUM_HEIGHT_DIVS;
                this.cursorX = 0;
                this.cursorY = 0;
                this.cursorAnimTime = 0;
            }

            if (this.soX !== undefined && this.soY !== undefined) {
                // If there's a problem, pass cursorWdtInt/HgtInt as width & height to use
                this.ctx.drawImage(cursor, this.cursorX, this.cursorY,
                                    this.cursorWdtInt, this.cursorHgtInt,
                                    this.soX - this.CURSOR_DISPLAY_MEASURE - this.CURSOR_DISPLAY_WIDTH_SPACING, this.soY - this.CURSOR_DISPLAY_MEASURE / 2,
                                    this.CURSOR_DISPLAY_MEASURE, this.CURSOR_DISPLAY_MEASURE);

                if (this.cursorAnimTime <= 0) {
                    this.cursorX += this.cursorWdtInt;
                    if (this.cursorX >= cursor.naturalWidth) {
                        this.cursorX = 0;
                        this.cursorY += this.cursorHgtInt;
                        if (this.cursorY >= cursor.naturalHeight) {
                            this.cursorY = 0;
                        }
                    }
                    this.cursorAnimTime = this.CURSOR_ANIM_DELAY;
                } else {
                    this.cursorAnimTime--;
                }
            }
        }
    },

    drawParticles: function() {
        if (this.selectedOption !== null) {
            if (this.soX !== undefined && this.soY !== undefined) {
                this.emitter.updateAndDraw(this.soX - (this.CURSOR_DISPLAY_MEASURE / 2) - this.CURSOR_DISPLAY_WIDTH_SPACING,
                                            this.soY,
                                            this.ctx);
            }
        }
    },

    drawResolution: function() {
        this.drawBackground();
        this.ctx.fillStyle = "black";
        this.ctx.font = this.PROMPT_FONT;

        var resolutionNumbers = this.currResolution;
        var resolutionFields = [' Health', ' Strength', ' Skill', ' Willpower', ' Virtue', ' XP'];

        var offset = 0;
        for (var i = 0; i < resolutionFields.length; ++i) {
            var numAsString = this.getSignAndNumber(resolutionNumbers[i]);
            if (numAsString !== null)
            {
                this.ctx.fillText(numAsString + resolutionFields[i], this.PROMPT_OFFSET_WIDTH, this.PROMPT_OFFSET_HEIGHT + (this.PROMPT_LINE_HEIGHT * offset));
                offset++;
            }
        }

        this.ctx.fillText("Press Enter to continue", this.OPTION_OFFSET_WIDTH, this.OPTION_OFFSET_HEIGHT);

        this.drawHUD();
    },

    drawPaused: function() {
        this.ctx.save();

        this.ctx.fillStyle = "#222";
        var imageBG = this.assetManager.getImage('mainBackgroundAlt');
        if (imageBG) {
            this.ctx.drawImage(imageBG, 0, 0, imageBG.naturalWidth, imageBG.naturalHeight, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = "#CCCCCC";
        }

        this.ctx.font = "42px MedievalSharp";
        this.ctx.textAlign = "center";
        this.ctx.fillText("PALADIN", this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.font = "24px MedievalSharp"
        this.ctx.fillText("Paused", this.canvas.width / 2, this.canvas.height / 2 + 20);
        this.ctx.restore();
    },

    /**
     * Helper function for drawResolution()
     * Returns a number preceeded by its sign in formatted string form
     */
    getSignAndNumber: function(num) {
        if (num > 0)
            return '+' + num;
        else if (num < 0)
            return num;
        else
            return null;
    },

    showLoadProgress: function() {
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(0, 0, this.WIDTH, this.canvas.height);
        this.ctx.fillStyle = "black";
        this.ctx.font = this.PROMPT_FONT;

        var percentage = Math.floor((this.resourcesLoaded / (this.QUESTS.length + this.IMAGES.length + this.AUDIO.length)) * 100);
        this.ctx.fillText("Loading resources. " + percentage  + "% complete.", this.PROMPT_OFFSET_WIDTH, this.PROMPT_OFFSET_HEIGHT + this.PROMPT_LINE_HEIGHT);
    },

    // Shamelessly lifted from: http://stackoverflow.com/questions/2936112/text-wrap-in-a-canvas-element
    getLines: function(ctx, text, maxWidth) {
        var words = text.split(" ");
        var lines = [];
        var currentLine = words[0];

        for (var i = 1; i < words.length; i++) {
            var word = words[i];
            var width = ctx.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    },

    //  --  Loading functions   --
    loadAsset: function() {
        if (this.gameState == this.GAME_STATE.LOADING) {
            this.resourcesLoaded++;
            if (this.resourcesLoaded == (this.QUESTS.length + this.IMAGES.length + this.AUDIO.length)) {
                this.introQuest();
                this.beginAudio();
                this.gameState = this.GAME_STATE.DEFAULT;
            }
        }
    },

    loadQuest: function(questPath) {
        var xhr = new XMLHttpRequest();
            
        xhr.onload = function() {
            var response = JSON.parse(xhr.responseText);
            this.questManager.loadQuest(response);
            this.loadAsset();
        }.bind(this);
        
        xhr.open('GET', questPath);
        
        xhr.setRequestHeader('If-Modified-Since', 'Sat, 1 Jan 2010 00:00:00 GMT');
        xhr.overrideMimeType("application/json");   // Extra step required for locally testing w/ Firefox

        xhr.send();
    },

    loadImage: function(imagePath) {
        var img = new Image();

        img.onload = function() {
            this.assetManager.loadImage(img);
            this.loadAsset();
        }.bind(this);

        img.src = imagePath;
    },

    /**
     * There is. . .probably a much better way of doing this.
     */
    loadSound: function(soundPath) {
        var audio = new Audio();

        audio.oncanplaythrough = function() {
            this.soundManager.loadAudio(audio.src);
            this.loadAsset();
        }.bind(this);

        audio.src = soundPath;
    }
};