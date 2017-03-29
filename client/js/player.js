// Make global Scene object for both main & questManager to use. . .or maybe just questManager?

"use strict";

// Do these even need getters/setters?
function Item(name) {
    this.name = name;
}

function Player(name, currHealth, maxHealth, items, str, skl, wlp, virtue, currExp, maxExp) {
    this.name = name;
    this.health = currHealth;
    this.maxHealth = maxHealth;
    this.inventory = items;     // Array of Items
    this.str = str;
    this.skl = skl;
    this.wlp = wlp;
    this.virtue = virtue;
    this.currExp = currExp;
    this.maxExp = maxExp;
}
