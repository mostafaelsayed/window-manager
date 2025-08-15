chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");
        if (request.data === "enable-dark-mode-for-this-tab") {
            document.body.style.backgroundColor = '#1a1a1aff';
            document.body.style.color = 'white';
            for (let elem of document.body.getElementsByTagName('*')) {
                elem.style.backgroundColor = '#1a1a1aff';
                elem.style.color = 'white';
            }
            for (let elem of document.body.getElementsByTagName('pre')) {
                elem.style.backgroundColor = 'grey';
                for (let elem1 of elem.getElementsByTagName('span')) {
                    elem1.style.backgroundColor = 'grey';
                }
            }
            for (let elem of document.body.getElementsByTagName('code')) {
                elem.style.backgroundColor = 'grey';
                for (let elem1 of elem.getElementsByTagName('span')) {
                    elem1.style.backgroundColor = 'grey';
                }
            }

            for (let elem of document.body.getElementsByTagName('a')) {
                const elemBackgroundColor = window.getComputedStyle( elem ).getPropertyValue('background-color');  
                console.log('elemBackgroundColor: ', elemBackgroundColor);
                if (elemBackgroundColor == 'rgb(26, 26, 26)' || elemBackgroundColor == '#1a1a1aff') {
                    elem.style.color = '#0067cd';
                    for (let elem1 of elem.getElementsByTagName('*')) {
                        elem1.style.color = '#0067cd';
                    }
                }
            }
            sendResponse({ 'done': true });
        }
    }
);