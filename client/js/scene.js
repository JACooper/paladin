// Make global Scene object for both main & questManager to use. . .or maybe just questManager?

"use strict";

function Requirement(strReq, sklReq, wlpReq) {
    this.strReq = strReq;
    this.sklReq = sklReq;
    this.wlpReq = wlpReq;
}

function Option(optionText, optionRequirements, optionResolution, optionFlags) {
    this.text         = optionText;
    this.requirements = optionRequirements; // Array
    this.resolution   = optionResolution;   // Array
    this.flags        = optionFlags;
}

function Scene(name, options, results, prompt, BGI, BGA, procFunc, resolveFunc) {
    this.name       = name;     // For internal referencing
    this.options    = options;
    this.results    = results;
    this.prompt     = prompt;
    this.background = BGI;
    this.audio      = BGA;
    this.proceed    = procFunc; // Determines where to go when "scenes" is empty
                                

    this.resolve = resolveFunc;
}