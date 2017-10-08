"use strict";

// Keep in sync with content-script.js!
const defaultSettings = {
	cancelTimers: true,
	shortcut: 'Shift+Esc'
};
let settings = null;
let settingsPromise = browser.storage.local.get(defaultSettings)
	.then(data => { settings = data; })
	.catch(err => { console.error(err); });

function keyDownEventToString(event) {
	function keyToString(event) {
		let code = event.which, key = event.key;
		if (code === 27)
			return "Esc";
		if (code === 32)
			return "Space";
		if (code < 32)
			return null;
		return (key.length === 1 ? key.toUpperCase() : key);
	}
	function accelToString(event) {
		var accel = "";
		if (event.ctrlKey) accel += "Ctrl+";
		if (event.metaKey) accel += "Meta+";
		if (event.shiftKey) accel += "Shift+";
		if (event.altKey) accel += "Alt+";
		return accel;
	}
	var key = keyToString(event), accel = accelToString(event);
	return key ? accel + key : "";
}
// end keep in sync

let loadPromise = new Promise(resolve => {
	window.addEventListener('load', resolve, false);
});

let cancelTimersEl = null;
let shortcutEl = null;

function handleShortcutKeyDown(event) {
	if (event.which === 8) {
		// Clear on backspace.
		this.value = "";
	}
	else {
		let str = keyDownEventToString(event);
		if (!str)
			return;
		this.value = str;
	}

	browser.storage.local.set({
		"shortcut": this.value
	});
	event.stopPropagation();
	event.preventDefault();
}

Promise.all([loadPromise, settingsPromise]).then(() => {
	shortcutEl = document.getElementById("shortcut");
	cancelTimersEl = document.getElementById("timers");

	cancelTimersEl.checked = settings.cancelTimers;
	shortcutEl.value = settings.shortcut;

	cancelTimersEl.onchange = function() {
		browser.storage.local.set({
			"cancelTimers": this.checked
		});
	};

	shortcutEl.addEventListener("keydown", handleShortcutKeyDown, false);

	document.body.hidden = false;
});
