"use strict";

var app = app || { };

app.questManager = (function() {
    
    var questFlags = [ ];
    var questWrappers = [ ];
    var currentQuest = undefined;
    var currentQuestWrapper = undefined;    // Typically set in loadRandomQuest
    var introQuestWrapper = null;
    var levelQuestWrapper = null;
    var deathQuestWrapper = null;
    var victoryQuestWrapper = null;
    var pausedQuestWrapper = null;          // Used for returning from the levelQuest
    var pausedQuest = null;

    var loadQuest = function(response) {
        parseQuest(response.quest);
    };

    var parseQuest = function(questWrapper) {
        var qWrapper = { };
        qWrapper.questName = questWrapper.questName;
        qWrapper.questStages = [ ];

        qWrapper.requirements = [ ];
        if (questWrapper.requirements !== undefined) {
            qWrapper.requirements = questWrapper.requirements;
        }

        var stages = [ ];
        stages = questWrapper.stages;
        // Using for instead of forEach for simplicity and so items are added in order
        for (var i = 0; i < stages.length; i++) {
            qWrapper.questStages[i] = parseQuestScene(stages[i]);
        }

        /*
            Special quests should be stored separately, as they need to happen
            only at specific (or multiple) times
        */
        if (qWrapper.questName === "intro") {
            introQuestWrapper = qWrapper;
        } else if (qWrapper.questName === "level") {
            levelQuestWrapper = qWrapper;
        } else if (qWrapper.questName === "death") {
            deathQuestWrapper = qWrapper;
        } else if (qWrapper.questName === "victory") {
            victoryQuestWrapper = qWrapper;
        } else {
            questWrappers.push(qWrapper);
        }
    };

    /**
     * Helper function for parsing a given stage of a quest.
     * @param questStage The raw JSON object to parse
     * @return The parsed Scene object
     */
    var parseQuestScene = function(questStage) {
        var stage = [ ];
        stage = questStage.questStage;

        // Read in all options
        var optionsArray = [ ];
        for (var i = 0; i < stage.options.length; ++i) {
            optionsArray.push(parseQuestSceneVars(stage.options[i]));
        }

        var resultsArray = [ ];
        for (var j = 0; j < stage.results.length; ++j) {
            resultsArray.push(stage.results[j]);    // Get name of next scene - some weirdness here
        }

        var bgAudio = null;
        if (stage.BGA !== undefined) {
            bgAudio = stage.BGA;
        }

        var bgImage = null;
        if (stage.BGI !== undefined) {
            bgImage = stage.BGI;
        }

        var prompt = stage.prompt;
        var s = new Scene(stage.name, optionsArray, resultsArray, prompt, bgImage, bgAudio, null, null);
        return s;
    };

    /**
     * Helper function for parsing out each Option defined within a quest stage.
     * @param opt The raw JSON object to parse from
     * @return The parsed Option object
     */
    var parseQuestSceneVars = function(opt) {
        var optText = opt.option.description;
        var qReq;
        if (opt.option.requirement !== undefined) {
            var optReq = opt.option.requirement;
            qReq = new Requirement(optReq.strReq, optReq.sklReq, optReq.wlpReq);
        } else {
            qReq = new Requirement(0, 0, 0);
        }

        var qResolution = [ ];
        if (opt.option.resolution !== undefined) {
            qResolution = opt.option.resolution;
        }

        var qFlags = [ ];
        if (opt.option.flags !== undefined) {
            qFlags = opt.option.flags;
        }
        
        var qOption = new Option(optText, qReq, qResolution, qFlags);
        return qOption;
    };

    /**
     * Helper function for getting the questManager's "currentQuest" member.
     * @return The currentQuest
     */
    var getCurrentQuest = function() {
        return currentQuest;
    };

    /**
     * Helper function for retrieving the "intro" quest. Sets currentQuestWrapper.
     * @return The currentQuest, after it has been appropriately set
     */
    var getIntroQuest = function() {
        currentQuestWrapper = introQuestWrapper;
        currentQuest = currentQuestWrapper.questStages[0];
        return currentQuest;
    };

    /**
     * Helper function for retrieving the "level" quest. Sets currentQuestWrapper.
     * @return The currentQuest, after it has been appropriately set
     */
    var getLevelQuest = function() {
        // Store current quest information so we can get back to it later
        pausedQuestWrapper = currentQuestWrapper;
        pausedQuest = currentQuest;

        currentQuestWrapper = levelQuestWrapper;
        currentQuest = currentQuestWrapper.questStages[0];
        return currentQuest;
    };

    /**
     * Helper function for retrieving the "death" quest. Sets currentQuestWrapper.
     * @return The currentQuest, after it has been appropriately set
     */
    var getDeathQuest = function() {
        currentQuestWrapper = deathQuestWrapper;
        currentQuest = currentQuestWrapper.questStages[0];
        return currentQuest;
    };

    /**
     * Helper function for retrieving the "victory" quest. Sets currentQuestWrapper.
     * @return The currentQuest, after it has been appropriately set
     */
    var getVictoryQuest = function() {
        currentQuestWrapper = victoryQuestWrapper;
        currentQuest = currentQuestWrapper.questStages[0];
        return currentQuest;
    };

    /**
     * Helper function that checks if the victory flag was set.
     * @return Whether or not questFlags currently contains the "victory" flag
     */
    var checkWon = function() {
        if (questFlags.includes("victory")) {
            return true;
        }
        return false;
    };

    /**
     * reset is a helper function, called upon restart, that resets all
     *  questWrappers "ignore" flags to be false.
     */
    var reset = function() {
        for (var i = 0; i < questWrappers.length; i++) {
            questWrappers[i].ignore = false;
        }
        questFlags = [ ];
    };

    /**
     * loadNextQuest searches the current questWrapper for the appropriate
     *  next quest stage, or if there were no additional stages defined in the
     *  quest, loads a new questWrapper.
     * @param optionSelect The option object that the user selected.
     * @return The resolution of the selected option
     */
    var loadNextQuest = function(optionSelect) {
        var optionIndex = 0;
        while (currentQuest.options[optionIndex] !== optionSelect && optionIndex < currentQuest.options.length) {
            optionIndex++;
        }

        // Get result, resolution, & quest flags corresponding to option index
        var nextQuest = null;
        var questResolution = currentQuest.options[optionIndex].resolution;
        var questSetFlags = currentQuest.options[optionIndex].flags;

        var currQuestName = currentQuestWrapper.questName;
        var nextQuestName = currentQuest.results[optionIndex];
        if (nextQuestName !== "intro" && nextQuestName !== "maingame"
            && nextQuestName !== "victory" && nextQuestName !== "null") {

            var quests = currentQuestWrapper.questStages;
            // Loop through quests till we find the matching result
            for (var i = 0; i < quests.length && nextQuest === null; ++i) {
                if (nextQuestName === quests[i].name) {
                    nextQuest = quests[i];
                }
            }
        } else if (nextQuestName === "victory") {
            currentQuestWrapper = victoryQuestWrapper;
            nextQuest = currentQuestWrapper.questStages[0];
        } else if (nextQuestName === "intro") {
            currentQuestWrapper = introQuestWrapper;
            nextQuest = currentQuestWrapper.questStages[0];
        } else if (currQuestName === "level") {
            currentQuestWrapper = pausedQuestWrapper;
            nextQuest = pausedQuest;
        } else {
            if (currQuestName !== "intro") {
                questWrappers[questWrappers.indexOf(currentQuestWrapper)].ignore = true;
            }
            nextQuest = loadRandomQuest();
        }

        // Quest resolutions are either empty or complete
        if (questResolution.length <= 0)
        {
            questResolution = null;
        }

        for (var i = 0; i < questSetFlags.length; i++) {
            questFlags.push(questSetFlags[i]);
        }

        currentQuest = nextQuest;

        return questResolution;
    };

    /**
     * loadRandomQuest searches through for a questWrapper that isn't being
     *  ignored and has all the appropriate flags set. If such a questWrapper
     *  exists, currentQuestWrapper is set to it and its first quest stage is
     *  returned.
     * @return The first quest stage of the new questWrapper, or null if no
     *          such wrapper exists.
     */
    var loadRandomQuest = function() {
        var resultQuest = null;
        var resultQuestWrapper = null;

        var newQuestIndex = -1;
        var questFound = false;

        // Search through all quests that shouldn't be ignored
        var questsToSearch = questWrappers.slice(0);
        questsToSearch = questsToSearch.filter(function(wrapper) {
            return (!(wrapper.ignore));
        });

        // Probably a better way of handling this. Something to look into for the future.
        while(!questFound && questsToSearch.length > 0) {
            newQuestIndex = Math.floor(Math.random() * questsToSearch.length);

            if (!(questsToSearch[newQuestIndex].ignore)) {
                var valid = true;
                var reqs = questsToSearch[newQuestIndex].requirements;
                if (reqs !== null || reqs.length > 0) {
                    for (var i = 0; i < reqs.length && valid; ++i) {
                        if (!questFlags.includes(reqs[i])) {
                            valid = false;
                        }
                    }
                }

                if (valid) {
                    // If a quest with all the appropriate flags set was found, break out & return it
                    resultQuestWrapper = questWrappers[newQuestIndex];
                    questFound = true; 
                } else {
                    // If we couldn't do this quest, remove it from the copied quest list
                    questsToSearch.splice(questsToSearch.indexOf(questsToSearch[newQuestIndex]), 1);
                }
            }
        }

        if (resultQuestWrapper !== null) {
            currentQuestWrapper = resultQuestWrapper;
            return currentQuestWrapper.questStages[0];    // The first stage of a quest is always at index 0
        } else {
            return null;
        }
    };

    return {
        loadQuest: loadQuest,
        getCurrentQuest: getCurrentQuest,
        getIntroQuest: getIntroQuest,
        getLevelQuest: getLevelQuest,
        getDeathQuest: getDeathQuest,
        getVictoryQuest: getVictoryQuest,
        loadNextQuest: loadNextQuest,
        reset: reset,
        checkWon: checkWon
    };
}());