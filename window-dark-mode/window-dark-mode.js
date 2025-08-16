chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");
        if (request.data === "enable-dark-mode-for-this-site" || request.data == 'enable-dark-mode-for-the-current-site-domain') {
            setDarkMode();
            sendResponse({ 'done': true });
        }
    }
);

async function get(key) {
    let obj = await chrome.storage.local.get([key]);
    if (obj && obj[key]) {
        return obj[key];
    }
    return null;
}

async function init() {
    const tabsGlobalSettings = await get('tabsGlobalSettings');
    const url = window.location.href;
    if (tabsGlobalSettings && tabsGlobalSettings[url] && tabsGlobalSettings[url].darkMode === true ) {
        setDarkMode();
    }
    else {
        const domainGlobalSettings = await get('domainGlobalSettings');
        const url = window.location.href;
        if (domainGlobalSettings) {
            for (let key in domainGlobalSettings) {
                if (url.startsWith(key)) {
                    setDarkMode();
                }
            }
        }
    }
}

function setDarkMode() {
    document.body.classList.add('window-manager-dark-mode');
}

init();