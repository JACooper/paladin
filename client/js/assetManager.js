"use strict";

var app = app || { };

app.assetManager = (function() {
    
    var imageAssets = [ ];

    // So we don't have to go searching for commonly used ones every time
    var player = undefined;
    var cursor = undefined;

    var loadImage = function(img) {
        var srcTok = img.src.split("/");
        var truncSrc = srcTok[srcTok.length - 1];

        // ditch extension
        truncSrc = truncSrc.substr(0, truncSrc.length - 4);

        imageAssets.push(new TaggedImage(truncSrc, img));
    };

    var getImage = function(tag) {
        var matches = imageAssets.filter(function(timg) {
            return (timg.tag === tag);
        });

        if (matches[0]) {
            return matches[0].img;
        } else {
            return null;
        }
    };

    var getPlayerPortrait = function() {
        if (player === undefined)
        {
            var matches = imageAssets.filter(function(timg) {
                return (timg.tag === 'player');
            });

            if (matches[0]) {
                player = matches[0].img;
            } else {
                player = null;
            }
        }

        return player;
    };

    var getCursor = function() {
        if (cursor === undefined)
        {
            var matches = imageAssets.filter(function(timg) {
                return (timg.tag === 'cursor');
            });

            if (matches[0]) {
                cursor = matches[0].img;
            } else {
                cursor = null;
            }
        }

        return cursor;
    };

    return {
        loadImage: loadImage,
        getImage: getImage,
        getPlayerPortrait: getPlayerPortrait,
        getCursor: getCursor
    };
}());