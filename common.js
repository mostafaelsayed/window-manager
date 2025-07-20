async function getSavedWindows() {
    let savedWindows = await chrome.storage.local.get(['savedWindows']);
    if (savedWindows && savedWindows['savedWindows']) {
        return savedWindows['savedWindows'];
    }
    return [];
}

async function wait(waitMilis) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve('waited ' + waitMilis + 'ms');
        }, waitMilis);
    });
}