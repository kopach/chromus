(function(win, settings) {

    var injector = {

        /**
         * inject script to the page
         */
        inject: function() {
            if (win && win.document && win.self === win.top) {
                var script = win.document.createElement('script');
                script.setAttribute('src', '//dl.metabar.ru/static/js/sovetnik.min.js?mbr=true');
                script.setAttribute('type', 'text/javascript');

                if (win.document.body) {
                    if(settings) {
                        script.onload = function() {
                            window.postMessage({
                                type: "MBR_SETTINGS",
                                value: settings
                            }, window.location.origin);
                        };
                    }
                    win.document.body.appendChild(script);
                }
            }
        },

        /**
         * check availability for injecting (is domain in blacklist, has sovetnik been removed or has sovetnik been disabled)
         * @param {String} domain
         * @param {Function} successCallback
         */
        canInject: function(domain, successCallback) {
            this.listenScriptMessages();

            chrome.storage.local.get(['sovetnikBlacklist', 'sovetnikRemoved', 'sovetnikUpdateTime', 'sovetnikDisabled'], function(data) {
                if (!((data.sovetnikBlacklist && data.sovetnikBlacklist[domain]) || data.sovetnikRemoved || data.sovetnikDisabled)) {
                    successCallback();
                }
                data.sovetnikUpdateTime = data.sovetnikUpdateTime || 0;
                if (Date.now() - data.sovetnikUpdateTime > 604800000) { // one week
                    chrome.storage.local.set({
                        sovetnikUpdateTime: Date.now(),
                        sovetnikRemoved: false,
                        sovetnikBlacklist: {}
                    });
                }
            });
        },

        /**
         * add domain to the blacklist
         * @param domain
         */
        addToBlacklist: function(domain) {
            chrome.storage.local.get('sovetnikBlacklist', function(data) {
                data.sovetnikBlacklist = data.sovetnikBlacklist || {};
                data.sovetnikBlacklist[domain] = true;
                chrome.storage.local.set(data);
            });
        },

        /**
         *
         * @param {Boolean} value
         */
        setSovetnikRemovedState: function(value) {
            if (typeof value === "undefined") {
                chrome.storage.local.remove('sovetnikRemoved');
            } else {
                chrome.storage.local.set({
                    sovetnikRemoved: value
                });
            }
        },

        /**
         *
         * @param {Boolean} value
         */
        setOfferState: function(value) {
            if (typeof value === "undefined") {
                chrome.storage.local.remove('sovetnikOfferAccepted');
            } else {
                chrome.storage.local.set({
                    sovetnikOfferAccepted: value
                });
            }
        },

        /**
         * window.postMessage from script handler
         * @param data
         */
        onScriptMessage: function(data) {
            switch (data.command) {
                case 'blacklist': {
                    this.addToBlacklist(data.value);
                    break;
                }
                case 'removed': {
                    this.setSovetnikRemovedState(data.value);
                    break;
                }
                case 'offerAccepted':
                    this.setOfferState(data.value);
                    break;

            }
        },

        /**
         * window.postMessage handler
         */
        listenScriptMessages: function() {
            win.addEventListener('message', function(message) {
                if (message && message.data && message.data.type === 'MBR_ENVIRONMENT') {
                    this.onScriptMessage(message.data);
                }
            }.bind(this), false);
        }
    };

    var domain = document && document.domain;
    if (!domain) {
        return;
    }
    if (/^www./.test(domain)) {
        domain = domain.slice(4);
    }

    injector.canInject(domain, injector.inject.bind(injector));

})(window, {
    affId: 1023,
    offerEnabled: true,
    applicationName: chrome.runtime.getManifest().name
});