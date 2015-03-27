"use strict";
// Generated by CoffeeScript 1.8.0
var Commands = {
  availableCommands: {},
  keyToCommandRegistry: {},
  addCommand: function(command, description, options) {
    if (command in this.availableCommands) {
      console.log(command, "is already defined! Check code for duplicates.");
      return;
    }
    options || (options = {});
    this.availableCommands[command] = {
      description: description || command,
      background: options.background ? true : false,
      noRepeat: options.noRepeat
    };
  },
  mapKeyToCommand: function(key, command) {
    var commandDetails;
    if (!this.availableCommands[command]) {
      console.log("Command %c" + command, "color:red;", "doesn't exist!");
      return;
    } else if (window._DEBUG) {
      console.log("Mapping", key, "to", command);
    }
    commandDetails = this.availableCommands[command];
    this.keyToCommandRegistry[key] = {
      command: command,
      background: commandDetails.background,
      noRepeat: commandDetails.noRepeat
    };
  },
  unmapKey: function(key) {
    delete this.keyToCommandRegistry[key];
  },
  _keyLeftRegex: /<[acf]-/ig,
  _keyRegex: /<([acf]-)?([a-zA-Z0-9]{2,5})>/g,
  normalizeKey: function(key) {
    return key.replace(this._keyLeftRegex, function(match) {
      return match.toLowerCase();
    }).replace(this._keyRegex, function(match, optionalPrefix, keyName) {
      return "<" + (optionalPrefix || "") + keyName.toLowerCase() + ">";
    });
  },
  _spaceSpliter: /\s+/,
  parseCustomKeyMappings: function(customKeyMappings) {
    var key, line, lineCommand, lines, splitLine, vimiumCommand, _i, _len;
    lines = customKeyMappings.split("\n");
    for (_i = 0, _len = lines.length; _i < _len; _i++) {
      line = lines[_i].trim();
      if (line[0] === "\"" || line[0] === "#") {
        continue;
      }
      splitLine = line.split(this._spaceSpliter);
      lineCommand = splitLine[0];
      if (lineCommand === "map") {
        if (splitLine.length !== 3) {
          continue;
        }
        key = this.normalizeKey(splitLine[1]);
        vimiumCommand = splitLine[2];
        this.mapKeyToCommand(key, vimiumCommand);
      } else if (lineCommand === "unmap") {
        if (splitLine.length !== 2) {
          continue;
        }
        key = this.normalizeKey(splitLine[1]);
        if (window._DEBUG) {
          console.log("Unmapping", key);
        }
        this.unmapKey(key);
      } else if (lineCommand === "unmapAll") {
        this.keyToCommandRegistry = {};
      }
    }
  },
  clearKeyMappingsAndSetDefaults: function() {
    var key, defaultmap = this._defaultKeyMappings;
    this.keyToCommandRegistry = {};
    for (key in defaultmap) {
      this.mapKeyToCommand(key, defaultmap[key]);
    }
  },
  commandGroups: {
    pageNavigation: ["scrollDown", "scrollUp", "scrollLeft", "scrollRight", "scrollToTop"
      , "scrollToBottom", "scrollToLeft", "scrollToRight", "scrollPageDown", "scrollPageUp"
      , "scrollFullPageUp", "scrollFullPageDown", "reload", "toggleViewSource", "copyCurrentUrl"
      , "LinkHints.activateModeToCopyLinkUrl", "LinkHints.activateModeToCopyLinkText"
      , "openCopiedUrlInCurrentTab", "openCopiedUrlInNewTab", "goUp", "goToRoot", "enterInsertMode"
      , "focusInput", "LinkHints.activateMode", "LinkHints.activateModeToOpenInNewTab"
      , "LinkHints.activateModeToOpenInNewForegroundTab", "LinkHints.activateModeWithQueue"
      , "LinkHints.activateModeToDownloadLink", "LinkHints.activateModeToOpenIncognito"
      , "LinkHints.activateModeToHover" //
      , "Vomnibar.activate", "Vomnibar.activateInNewTab", "Vomnibar.activateTabSelection"
      , "Vomnibar.activateBookmarks", "Vomnibar.activateBookmarksInNewTab", "Vomnibar.activateHistory"
      , "Vomnibar.activateHistoryInNewTab", "goPrevious", "goNext", "nextFrame"
      , "Marks.activateCreateMode", "Vomnibar.activateEditUrl", "Vomnibar.activateEditUrlInNewTab"
      , "Marks.activateGotoMode"],
    historyNavigation: ["goBack", "goForward", "reloadTab", "switchFocus", "simBackspace"],
    findCommands: ["enterFindMode", "performFind", "performBackwardsFind"],
    tabManipulation: ["nextTab", "previousTab", "firstTab", "lastTab", "createTab", "duplicateTab"
      , "removeTab", "restoreTab", "moveTabToNextWindow", "moveTabToIncognito", "togglePinTab"
      , "closeTabsOnLeft", "closeTabsOnRight", "closeOtherTabs", "moveTabLeft", "moveTabRight" //
      , "enableImageTemp", "toggleImage", "clearImageCS"],
    misc: ["showHelp", "enterVisualMode"]
  },
  advancedCommands: ["scrollToLeft", "scrollToRight", "moveTabToNextWindow", "moveTabToIncognito"
    , "goUp", "goToRoot", "focusInput", "LinkHints.activateModeWithQueue", "enableImageTemp"
    , "toggleImage", "clearImageCS"
    , "LinkHints.activateModeToDownloadLink", "Vomnibar.activateEditUrl"
    , "Vomnibar.activateEditUrlInNewTab", "LinkHints.activateModeToOpenIncognito"
    , "goNext", "goPrevious", "Marks.activateCreateMode", "Marks.activateGotoMode"
    , "moveTabLeft", "moveTabRight", "closeTabsOnLeft", "closeTabsOnRight", "closeOtherTabs"],
  _defaultKeyMappings: null,
};

Commands._defaultKeyMappings = {
  "?": "showHelp",
  "j": "scrollDown",
  "k": "scrollUp",
  "h": "scrollLeft",
  "l": "scrollRight",
  "gg": "scrollToTop",
  "G": "scrollToBottom",
  "zH": "scrollToLeft",
  "zL": "scrollToRight",
  "<c-e>": "scrollDown",
  "<c-y>": "scrollUp",
  "d": "scrollPageDown",
  "u": "scrollPageUp",
  "r": "reload",
  "R": "reloadTab",
  "gs": "toggleViewSource",
  "i": "enterInsertMode",
  "v": "enterVisualMode",
  "H": "goBack",
  "L": "goForward",
  "gu": "goUp",
  "gU": "goToRoot",
  "gi": "focusInput",
  "f": "LinkHints.activateMode",
  "F": "LinkHints.activateModeToOpenInNewTab",
  "<a-f>": "LinkHints.activateModeWithQueue",
  "/": "enterFindMode",
  "n": "performFind",
  "N": "performBackwardsFind",
  "[[": "goPrevious",
  "]]": "goNext",
  "yy": "copyCurrentUrl",
  "yf": "LinkHints.activateModeToCopyLinkUrl",
  "p": "openCopiedUrlInCurrentTab",
  "P": "openCopiedUrlInNewTab",
  "K": "nextTab",
  "J": "previousTab",
  "gt": "nextTab",
  "gT": "previousTab",
  "<<": "moveTabLeft",
  ">>": "moveTabRight",
  "g0": "firstTab",
  "g$": "lastTab",
  "W": "moveTabToNextWindow",
  "t": "createTab",
  "yt": "duplicateTab",
  "x": "removeTab",
  "X": "restoreTab",
  "<a-p>": "togglePinTab",
  "o": "Vomnibar.activate",
  "O": "Vomnibar.activateInNewTab",
  "T": "Vomnibar.activateTabSelection",
  "b": "Vomnibar.activateBookmarks",
  "B": "Vomnibar.activateBookmarksInNewTab",
  "ge": "Vomnibar.activateEditUrl",
  "gE": "Vomnibar.activateEditUrlInNewTab",
  "gf": "nextFrame",
  "<f1>": "simBackspace",
  "<f2>": "switchFocus",
  "m": "Marks.activateCreateMode",
  "`": "Marks.activateGotoMode"
};

(function(descriptions) {
  var command, description, commands = Commands;
  for (command in descriptions) {
    description = descriptions[command];
    commands.addCommand(command, description[0], description[1]);
  }
})({
  showHelp: [
    "Show help", {
      noRepeat: true
    }
  ],
  scrollDown: ["Scroll down"],
  scrollUp: ["Scroll up"],
  scrollLeft: ["Scroll left"],
  scrollRight: ["Scroll right"],
  scrollToTop: [
    "Scroll to the top of the page", {
      noRepeat: true
    }
  ],
  scrollToBottom: [
    "Scroll to the bottom of the page", {
      noRepeat: true
    }
  ],
  scrollToLeft: [
    "Scroll all the way to the left", {
      noRepeat: true
    }
  ],
  scrollToRight: [
    "Scroll all the way to the right", {
      noRepeat: true
    }
  ],
  scrollPageDown: ["Scroll a page down"],
  scrollPageUp: ["Scroll a page up"],
  scrollFullPageDown: ["Scroll a full page down"],
  scrollFullPageUp: ["Scroll a full page up"],
  reload: [
    "Reload current frame", {
      noRepeat: true
    }
  ],
  reloadTab: [
    "Reload the whole page", {
      background: true,
      noRepeat: true
    }
  ],
  toggleViewSource: [
    "View page source", {
      noRepeat: true
    }
  ],
  copyCurrentUrl: [
    "Copy the current URL to the clipboard", {
      noRepeat: true
    }
  ],
  "LinkHints.activateModeToCopyLinkUrl": [
    "Copy a link URL to the clipboard", {
      noRepeat: true
    }
  ],
  "LinkHints.activateModeToCopyLinkText": [
    "Copy a link text to the clipboard", {
      noRepeat: true
    }
  ],
  openCopiedUrlInCurrentTab: [
    "Open the clipboard's URL in the current tab", {
      background: true,
      noRepeat: true
    }
  ],
  openCopiedUrlInNewTab: [
    "Open the clipboard's URL in a new tab", {
      background: true,
      noRepeat: 20
    }
  ],
  enterInsertMode: [
    "Enter insert mode", {
      noRepeat: true
    }
  ],
  enterVisualMode: [
    "Enter visual mode", {
      noRepeat: true
    }
  ],
  focusInput: [
    "Focus the first text box on the page. Cycle between them using tab", {
      noRepeat: false
    }
  ],
  "LinkHints.activateMode": [
    "Open a link in the current tab", {
      noRepeat: true
    }
  ],
  "LinkHints.activateModeToOpenInNewTab": [
    "Open a link in a new tab", {
      noRepeat: true
    }
  ],
  "LinkHints.activateModeToOpenInNewForegroundTab": [
    "Open a link in a new tab & switch to it", {
      noRepeat: true
    }
  ],
  "LinkHints.activateModeWithQueue": [
    "Open multiple links in a new tab", {
      noRepeat: true
    }
  ],
  "LinkHints.activateModeToOpenIncognito": [
    "Open a link in incognito window", {
      noRepeat: true
    }
  ],
  "LinkHints.activateModeToDownloadLink": [
    "Download link url", {
      noRepeat: true
    }
  ],
  "LinkHints.activateModeToHover": [
    "select an element and hover", {
      noRepeat: true
    }
  ],
  enterFindMode: [
    "Enter find mode", {
      noRepeat: true
    }
  ],
  performFind: ["Cycle forward to the next find match"],
  performBackwardsFind: ["Cycle backward to the previous find match"],
  switchFocus: [
    "blur activeElement or refocus it", {
      noRepeat: true
    }
  ],
  simBackspace: [
    "simulate backspace for once if focused", {
      noRepeat: true
    }
  ],
  goPrevious: [
    "Follow the link labeled previous or <", {
      noRepeat: true
    }
  ],
  goNext: [
    "Follow the link labeled next or >", {
      noRepeat: true
    }
  ],
  goBack: [
    "Go back in history", {
      noRepeat: false
    }
  ],
  goForward: [
    "Go forward in history", {
      noRepeat: false
    }
  ],
  goUp: [
    "Go up the URL hierarchy", {
      noRepeat: false
    }
  ],
  goToRoot: [
    "Go to root of current URL hierarchy", {
      noRepeat: true
    }
  ],
  nextTab: [
    "Go one tab right", {
      background: true
    }
  ],
  previousTab: [
    "Go one tab left", {
      background: true
    }
  ],
  firstTab: [
    "Go to the first tab", {
      background: true,
      noRepeat: true
    }
  ],
  lastTab: [
    "Go to the last tab", {
      background: true,
      noRepeat: true
    }
  ],
  createTab: [
    "Create new tab", {
      background: true,
      noRepeat: 20
    }
  ],
  duplicateTab: [
    "Duplicate current tab", {
      background: true,
      noRepeat: 20
    }
  ],
  removeTab: [
    "Close current tab", {
      background: true,
      noRepeat: (chrome.sessions && chrome.sessions.MAX_SESSION_RESULTS || 25)
    }
  ],
  restoreTab: [
    "Restore closed tab", {
      background: true,
      noRepeat: (chrome.session && chrome.sessions.MAX_SESSION_RESULTS || 25)
    }
  ],
  moveTabToNextWindow: [
    "Move tab to next window", {
      background: true,
      noRepeat: true
    }
  ],
  moveTabToIncognito: [
    "Make tab in a incognito window", {
      background: true,
      noRepeat: true
    }
  ],
  togglePinTab: [
    "Pin/unpin current tab", {
      background: true,
      noRepeat: true
    }
  ],
  closeTabsOnLeft: [
    "Close tabs on the left", {
      background: true
    }
  ],
  closeTabsOnRight: [
    "Close tabs on the right", {
      background: true
    }
  ],
  closeOtherTabs: [
    "Close all other tabs", {
      background: true,
      noRepeat: true
    }
  ],
  moveTabLeft: [
    "Move tab to the left", {
      background: true
    }
  ],
  moveTabRight: [
    "Move tab to the right", {
      background: true
    }
  ],
  enableImageTemp: [
    "enable the site's image temporarily in incognito", {
      background: true,
      noRepeat: true
    }
  ],
  toggleImage: [
    "turn on/off the site's image", {
      background: true,
      noRepeat: true
    }
  ],
  clearImageCS: [
    "clear extension's image content settings", {
      background: true,
      noRepeat: true
    }
  ],
  "Vomnibar.activate": [
    "Open URL, bookmark, or history entry", {
      noRepeat: true
    }
  ],
  "Vomnibar.activateInNewTab": [
    "Open URL, bookmark, history entry, in a new tab", {
      noRepeat: true
    }
  ],
  "Vomnibar.activateTabSelection": [
    "Search through your open tabs", {
      noRepeat: true
    }
  ],
  "Vomnibar.activateBookmarks": [
    "Open a bookmark", {
      noRepeat: true
    }
  ],
  "Vomnibar.activateBookmarksInNewTab": [
    "Open a bookmark in a new tab", {
      noRepeat: true
    }
  ],
  "Vomnibar.activateHistory": [
    "Open a history", {
      noRepeat: true
    }
  ],
  "Vomnibar.activateHistoryInNewTab": [
    "Open a history in a new tab", {
      noRepeat: true
    }
  ],
  "Vomnibar.activateEditUrl": [
    "Edit the current URL", {
      noRepeat: true
    }
  ],
  "Vomnibar.activateEditUrlInNewTab": [
    "Edit the current URL and open in a new tab", {
      noRepeat: true
    }
  ],
  nextFrame: [
    "Cycle forward to the next frame on the page", {
      background: true
    }
  ],
  "Marks.activateCreateMode": [
    "Create a new mark", {
      noRepeat: true
    }
  ],
  "Marks.activateGotoMode": [
    "Go to a mark", {
      noRepeat: true
    }
  ]
});

Settings.setUpdateHook("keyMappings", function(value) {
  Commands.clearKeyMappingsAndSetDefaults();
  Commands.parseCustomKeyMappings(value);
  this.postUpdate("postKeyMappings", null);
});