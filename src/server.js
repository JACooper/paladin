//*********************************************************************************************************************
//------------------------------------------------------ IMPORTS ------------------------------------------------------
//*********************************************************************************************************************

var http = require('http');             // To handle http requests/responses
var url = require('url');               // To simplify reading of urls in http requests
var fs = require('fs');                 // To read/return from the file system

//*********************************************************************************************************************
//------------------------------------------------------ GLOBALS ------------------------------------------------------
//*********************************************************************************************************************

var port = process.env.PORT || 3000;    // 3000 is a dev port - process.env.PORT is whatever our process was given


var f_htm_paladin       = fs.readFileSync(__dirname + '/../client/paladin.html');

var f_aud_behelit       = fs.readFileSync(__dirname + '/../client/assets/audio/behelit.mp3');
var f_aud_enter         = fs.readFileSync(__dirname + '/../client/assets/audio/enter.wav');
var f_aud_menuTheme     = fs.readFileSync(__dirname + '/../client/assets/audio/Menu Theme.mp3');
var f_aud_select        = fs.readFileSync(__dirname + '/../client/assets/audio/select.wav');

var f_img_cursor        = fs.readFileSync(__dirname + '/../client/assets/images/cursor.png');
var f_img_mainBg        = fs.readFileSync(__dirname + '/../client/assets/images/mainBackground.jpg');
var f_img_mainBgAlt     = fs.readFileSync(__dirname + '/../client/assets/images/mainBackgroundAlt.jpg');
var f_img_player        = fs.readFileSync(__dirname + '/../client/assets/images/player.png');

var f_jvs_assetManager  = fs.readFileSync(__dirname + '/../client/js/assetManager.js');
var f_jvs_emitter       = fs.readFileSync(__dirname + '/../client/js/emitter.js');
var f_jvs_inputManager  = fs.readFileSync(__dirname + '/../client/js/inputManager.js');
var f_jvs_loader        = fs.readFileSync(__dirname + '/../client/js/loader.js');
var f_jvs_main          = fs.readFileSync(__dirname + '/../client/js/main.js');
var f_jvs_player        = fs.readFileSync(__dirname + '/../client/js/player.js');
var f_jvs_questManager  = fs.readFileSync(__dirname + '/../client/js/questManager.js');
var f_jvs_scene         = fs.readFileSync(__dirname + '/../client/js/scene.js');
var f_jvs_soundManager  = fs.readFileSync(__dirname + '/../client/js/soundManager.js');
var f_jvs_taggedStructs = fs.readFileSync(__dirname + '/../client/js/taggedStructs.js');

var f_jsn_death         = fs.readFileSync(__dirname + '/../client/jsondata/questDeath.json');
var f_jsn_defeat        = fs.readFileSync(__dirname + '/../client/jsondata/questDefeat.json');
var f_jsn_intro         = fs.readFileSync(__dirname + '/../client/jsondata/questIntro.json');
var f_jsn_level         = fs.readFileSync(__dirname + '/../client/jsondata/questLevel.json');
var f_jsn_main          = fs.readFileSync(__dirname + '/../client/jsondata/questMain.json');
var f_jsn_nemesis       = fs.readFileSync(__dirname + '/../client/jsondata/questNemesis.json');
var f_jsn_nemesis2      = fs.readFileSync(__dirname + '/../client/jsondata/questNemesis2.json');
var f_jsn_sample        = fs.readFileSync(__dirname + '/../client/jsondata/questSample.json');
var f_jsn_victory       = fs.readFileSync(__dirname + '/../client/jsondata/questVictory.json');


//*********************************************************************************************************************
//----------------------------------------------------- CONSTANTS -----------------------------------------------------
//*********************************************************************************************************************

const CONTENT_HEADER_HTML    = { 'Content-Type': 'text/html' };
const CONTENT_HEADER_CSS     = { 'Content-Type': 'text/css' };
const CONTENT_HEADER_JS      = { 'Content-Type': 'text/javascript' };
const CONTENT_HEADER_JSON    = { 'Content-Type': 'application/json' };
const CONTENT_HEADER_PNG     = { 'Content-Type': 'image/png' };
const CONTENT_HEADER_JPG     = { 'Content-Type': 'image/jpeg' };
const CONTENT_HEADER_MP3     = { 'Content-Type': 'audio/mpeg' };
const CONTENT_HEADER_WAV     = { 'Content-Type': 'audio/wav' };


//*********************************************************************************************************************
//----------------------------------------------------- FUNCTIONS -----------------------------------------------------
//*********************************************************************************************************************

/**
 * onRequest handles requests from the client
 * @params req - The client's request
 * @params res - The response to send back to the client
 */
function onRequest(req, res) {
    var parsedUrl = url.parse(req.url);

    var headerObj = CONTENT_HEADER_HTML;
    var statusCode = 200;
    var file = f_htm_paladin;       // Should default to some sort of error page instead, really

    switch(parsedUrl.pathname) {
        case '/':
        case '/paladin.html':
            headerObj = CONTENT_HEADER_HTML;
            file = f_htm_paladin;
            break;
        case '/assets/audio/behelit.mp3':
            headerObj = CONTENT_HEADER_MP3;
            file = f_aud_behelit;
            break;
        case '/assets/audio/enter.wav':
            headerObj = CONTENT_HEADER_WAV;
            file = f_aud_enter;
            break;
        case '/assets/audio/Menu Theme.mp3':
            headerObj = CONTENT_HEADER_MP3;
            file = f_aud_menuTheme;
            break;
        case '/assets/audio/select.wav':
            headerObj = CONTENT_HEADER_WAV;
            file = f_aud_select;
            break;
        case '/assets/images/cursor.png':
            headerObj = CONTENT_HEADER_PNG;
            file = f_img_cursor;
            break;
        case '/assets/images/mainBackground.jpg':
            headerObj = CONTENT_HEADER_JPG;
            file = f_img_mainBg;
            break;
        case '/assets/images/mainBackgroundAlt.jpg':
            headerObj = CONTENT_HEADER_JPG;
            file = f_img_mainBgAlt;
            break;
        case '/assets/images/player.png':
            headerObj = CONTENT_HEADER_PNG;
            file = f_img_player;
            break;
        case '/js/assetManager.js':
            headerObj = CONTENT_HEADER_JS;
            file = f_jvs_assetManager;
            break;
        case '/js/emitter.js':
            headerObj = CONTENT_HEADER_JS;
            file = f_jvs_emitter;
            break;
        case '/js/inputManager.js':
            headerObj = CONTENT_HEADER_JS;
            file = f_jvs_inputManager;
            break;
        case '/js/loader.js':
            headerObj = CONTENT_HEADER_JS;
            file = f_jvs_loader;
            break;
        case '/js/main.js':
            headerObj = CONTENT_HEADER_JS;
            file = f_jvs_main;
            break;
        case '/js/player.js':
            headerObj = CONTENT_HEADER_JS;
            file = f_jvs_player;
            break;
        case '/js/questManager.js':
            headerObj = CONTENT_HEADER_JS;
            file = f_jvs_questManager;
            break;
        case '/js/scene.js':
            headerObj = CONTENT_HEADER_JS;
            file = f_jvs_scene;
            break;
        case '/js/soundManager.js':
            headerObj = CONTENT_HEADER_JS;
            file = f_jvs_soundManager;
            break;
        case '/js/taggedStructs.js':
            headerObj = CONTENT_HEADER_JS;
            file = f_jvs_taggedStructs;
            break;
        case '/jsondata/questDeath.json':
            headerObj = CONTENT_HEADER_JSON;
            file = f_jsn_death;
            break;
        case '/jsondata/questDefeat.json':
            headerObj = CONTENT_HEADER_JSON;
            file = f_jsn_defeat;
            break;
        case '/jsondata/questIntro.json':
            headerObj = CONTENT_HEADER_JSON;
            file = f_jsn_intro;
            break;
        case '/jsondata/questLevel.json':
            headerObj = CONTENT_HEADER_JSON;
            file = f_jsn_level;
            break;
        case '/jsondata/questMain.json':
            headerObj = CONTENT_HEADER_JSON;
            file = f_jsn_main;
            break;
        case '/jsondata/questNemesis.json':
            headerObj = CONTENT_HEADER_JSON;
            file = f_jsn_nemesis;
            break;
        case '/jsondata/questNemesis2.json':
            headerObj = CONTENT_HEADER_JSON;
            file = f_jsn_nemesis2;
            break;
        case '/jsondata/questSample.json':
            headerObj = CONTENT_HEADER_JSON;
            file = f_jsn_sample;
            break;
        case '/jsondata/questVictory.json':
            headerObj = CONTENT_HEADER_JSON;
            file = f_jsn_victory;
            break;
        default:
            statusCode = 400;
    }

    if (statusCode === 400) {
        headerObj = CONTENT_HEADER_JSON;
        file = JSON.stringify({ error: "Could not find resource!" });
    }

    res.writeHead(statusCode, headerObj);
    res.write(file);
    res.end();

}

http.createServer(onRequest).listen(port);  // Start our server listening