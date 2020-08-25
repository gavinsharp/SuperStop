"use strict";

// Keep in sync with settings.js!
const defaultSettings = {
	cancelTimers: true,
	stopVideos: true,
	stopCssAnimations: true,
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

settingsPromise.then(() => {
	browser.storage.onChanged.addListener((changes, area) => {
		if (area != "local")
			return;
		for (var prop in changes) {
			if (prop in defaultSettings) {
				settings[prop] = changes[prop].newValue;
				console.log("updated setting", prop, changes[prop].newValue);
			}
		}
	});
});

function superStop() {
	// (A bit anticlimactic, no?)
	window.stop();
}

let timer = 0;
function cancelTimers() {
	let lastTimer = window.setTimeout(() => {});
	window.clearTimeout(lastTimer);
	for (let i = timer; i < lastTimer; i++)
		window.clearTimeout(i);
	timer = lastTimer + 1;
}

function stopVideos() {
	for (let video of document.getElementsByTagName("video")) {
		if (video.pause) video.pause();
	}
}

function stopCssAnimations() {
	let el = document.createElement("style");
	el.textContent = "*, *::before, *::after { animation: none !important; }";
	document.documentElement.appendChild(el);
}

function handleKeyDown(event) {
	if (!event.isTrusted)
		return;
	if (!settings || !settings.shortcut || keyDownEventToString(event) != settings.shortcut)
		return;
	superStop(); // if other things somehow fail
	browser.runtime.sendMessage({type: "do-super-stop"})
		.catch(err => { console.error(err); });
}

window.addEventListener('keydown', handleKeyDown, true);

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	if (msg.type == "do-super-stop") {
		if (window == top)
			superStop();
		if (settings && settings.cancelTimers)
			cancelTimers();
		if (settings && settings.stopVideos)
			stopVideos();
		if (settings && settings.stopCssAnimations)
			stopCssAnimations();
	} else {
		throw new Error("unknown message type");
	}
});
