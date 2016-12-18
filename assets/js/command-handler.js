chrome.commands.onCommand.addListener(function(command) {
  if (command === "toggleCSNPanel") {
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, command);
    });
  }
});
