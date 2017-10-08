"use strict";

function sendMessageToActiveTab(msg) {
	browser.tabs.query({
		currentWindow: true,
		active: true
	}).then(function(tabs) {
		return Promise.all(tabs.map(tab =>
					browser.tabs.sendMessage(tab.id, msg)));
	}).catch(err => { console.error(err); });
}

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	if (msg.type == "do-super-stop") {
		sendMessageToActiveTab(msg);
	} else {
		throw new Error("unknown message type");
	}
});
