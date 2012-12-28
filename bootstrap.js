/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");

function startup(aData, aReason) {
  // Install the new shortcut in all browser windows, current and future
  watchWindows(function (window) {
    let doc = window.document;

    function makeXUL(type) doc.createElement(type);

    let keyset = makeXUL("keyset");
    keyset.id = "superstop-keyset";

    let key = makeXUL("key");
    key.id = "superstop-key";
    key.setAttribute("keycode", "VK_ESCAPE");
    key.setAttribute("modifiers", "shift");
    key.setAttribute("oncommand", "BrowserStop();");
    doc.getElementById("mainKeyset").appendChild(keyset).appendChild(key);
  });
}

function shutdown(aData, aReason) {
  if (aReason != APP_SHUTDOWN) {
    unloaders.forEach(function (f) {
      try {
        f();
      } catch (ex) {}
    });
  }
}

function install(aData, aReason) { }

function uninstall(aData, aReason) { }


/* Code from: https://github.com/Mardak/restartless/blob/watchWindows/bootstrap.js */
let unloaders = [];

function watchWindows(callback) {
  // Wrap the callback in a function that ignores failures
  function watcher(window) {
    try {
      // Now that the window has loaded, only handle browser windows
      let documentElement = window.document.documentElement;
      if (documentElement.getAttribute("windowtype") == "navigator:browser")
        callback(window);
    }
    catch(ex) {}
  }

  // Wait for the window to finish loading before running the callback
  function runOnLoad(window) {
    // Listen for one load event before checking the window type
    window.addEventListener("load", function runOnce() {
      window.removeEventListener("load", runOnce, false);
      watcher(window);
    }, false);
  }

  // Add functionality to existing windows
  let windows = Services.wm.getEnumerator(null);
  while (windows.hasMoreElements()) {
    // Only run the watcher immediately if the window is completely loaded
    let window = windows.getNext();
    if (window.document.readyState == "complete")
      watcher(window);
    // Wait for the window to load before continuing
    else
      runOnLoad(window);
  }

  // Watch for new browser windows opening then wait for it to load
  function windowWatcher(subject, topic) {
    if (topic == "domwindowopened")
      runOnLoad(subject);
  }
  Services.ww.registerNotification(windowWatcher);
  unloaders.push(function() Services.ww.unregisterNotification(windowWatcher));
}

