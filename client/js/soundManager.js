"use strict";

var app = app || { };

app.soundManager = (function() {
    
    var audioAssets = [ ];

    var bgAudioElement = undefined;
    var currentTrack = undefined;
    var BG_AUDIO_VOLUME = 0.70;

    var seAudioElement = undefined;
    var currentEffect = undefined;
    var SE_AUDIO_VOLUME = 0.95;

    var init = function() {
        bgAudioElement = document.querySelector('#bgAudio');
        bgAudioElement.volume = BG_AUDIO_VOLUME;

        seAudioElement = document.querySelector('#seAudio');
        seAudioElement.volume = SE_AUDIO_VOLUME;
    };

    var loadAudio = function(audioFile) {
        var srcTok = audioFile.split("/");
        var truncSrc = srcTok[srcTok.length - 1];

        // ditch extension
        truncSrc = truncSrc.substr(0, truncSrc.length - 4);

        audioAssets.push(new TaggedAudio(truncSrc, audioFile));
    };

    var changeTrack = function(tag) {
        if (currentTrack !== undefined) {
            if (tag !== currentTrack.tag && tag !== "NO_CHANGE") {
                pauseTrack();
                currentTrack = getAudioWithTag(tag);
                bgAudioElement.src = currentTrack.audio;
                bgAudioElement.currentTime = 0;
                playTrack();
            }
        } else {
            currentTrack = getAudioWithTag(tag);
            bgAudioElement.src = currentTrack.audio;
            bgAudioElement.currentTime = 0;
            playTrack();
        }
    };

    var getAudioWithTag = function(tag) {
        var matches = audioAssets.filter(function(tAudio) {
            return (tAudio.tag === tag);
        });

        if (matches[0]) {
            return matches[0];
        } else {
            return null;
        }
    };

    var playTrack = function() {
        bgAudioElement.play();
    };

    var pauseTrack = function() {
        bgAudioElement.pause();
    };

    var playEffect = function(tag) {
        seAudioElement.pause();
        currentEffect = getAudioWithTag(tag);
        seAudioElement.src = currentEffect.audio;
        seAudioElement.currentTime = 0;
        seAudioElement.play();
    };

    return {
        init: init,
        loadAudio: loadAudio,
        changeTrack: changeTrack,
        playTrack: playTrack,
        pauseTrack: pauseTrack,
        playEffect: playEffect
    };
}());