chrome.runtime.connect({ name: 'settings-panel' });



loadNavTabsStylesHtml().then(html => {
    let elem = document.createElement('style');
    elem.innerHTML = html;
    document.body.after(elem);

    loadNavTabsMainHtml().then(html => {
        document.getElementById('nav-tabs-container').innerHTML = html;
        if (document.getElementById('main-tab-link').classList.contains('active')) {
            document.getElementById('main-tab-link').classList.remove('active');
            document.getElementById('main-tab-link').removeAttribute('aria-current');
            document.getElementById('settings-tab-link').classList.add('active');
            document.getElementById('settings-tab-link').setAttribute('aria-current', 'page');
        }

        let elem = document.createElement('script');
        elem.setAttribute('src', 'nav-tabs.js')
        document.body.after(elem);


    });

});

