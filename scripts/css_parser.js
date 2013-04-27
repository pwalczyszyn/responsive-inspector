var CSSParser = function CSSParser(css) {
    // Removing commented fragments
    this.css = css.replace(/\/\*[^*]*\*+([^/*][^*]*\*+)*\//, '');
    this.urlRegExp = /url\(\s*([\'|\"]\S*[\'|\"])\s*\)|[\'|\"]\S*[\'|\"]/gi;
}

CSSParser.prototype = {

    parse: function parse() {
        this.results = [];
        if (this.css.indexOf('@media') >= 0)
            this.findMediaRules();
        if (this.css.indexOf('@import') >= 0)
            this.findImportRules();
        return this.results;
    },

    findMediaRules: function findMediaRules() {
        var pos = -1,
            cssLength = this.css.length;

        while ((pos = this.css.indexOf('@media', pos + 1)) >= 0) {
            var mediaRule = {},
                mte = this.css.indexOf('{', pos), // cssText opening bracket position
                ob = 1, // Opening brackets count
                cb = 0, // Closing brackets count
                chPos = mte + 1;

            while (ob != cb && chPos < cssLength) {
                var ch = this.css.charAt(chPos);
                if (ch == '{') ob++;
                if (ch == '}') cb++;
                chPos++;
            }

            mediaRule.type = 'CSSMediaRule';
            mediaRule.mediaText = this.css.substring(pos, mte).trim().toLowerCase();
            mediaRule.cssText = this.css.substring(mte, chPos);
            mediaRule.mediaQueryList = this.parseMediaQueryList(mediaRule.mediaText.substring(6)); // Substring without @media part

            this.results.push(mediaRule);
        }
    },

    findImportRules: function findImportRules() {
        var pos = -1,
            cssLength = this.css.length;

        while ((pos = this.css.indexOf('@import', pos + 1)) >= 0) {
            var importRule = {},
                ite = this.css.indexOf(';', pos);

            importRule.type = 'CSSImportRule';
            importRule.importText = this.css.substring(pos, ite + 1).trim();

            var url = importRule.importText.match(this.urlRegExp)[0];
            importRule.href = this.parseHref(url);
            importRule.mediaQueryList = this.parseMediaQueryList(importRule.importText.substring(importRule.importText.indexOf(url) + url.length + 1, importRule.importText.length - 1)); // Substring without @media part

            console.log(importRule);
        }
    },

    parseHref: function parseHref(url) {
        var separator = '"';

        if (url.indexOf('\'') != -1)
            separator = '\'';

        return url.substring(url.indexOf(separator) + 1, url.lastIndexOf(separator));
    },

    parseMediaQueryList: function parseMediaQueryList(mediaText) {
        console.log(mediaText);

        var results = [],
            mqTexts = mediaText.split(',');

        for (var i in mqTexts) {
            var mqText = mqTexts[i].trim(),
                mq = {
                    mediaType: 'all', // if not all it will get overriden
                    mediaText: mqText, // mediaText after , split
                    expressions: []
                },
                andSplits = mqText.split('and');

            for (var j in andSplits) {
                var andSplit = andSplits[j].trim();
                if (andSplit.indexOf('(') == -1) { // This most likely is mediaType part
                    mq.mediaType = andSplit;
                } else { // This most likely is expression part
                    var expStr = andSplit.substring(andSplit.indexOf('(') + 1, andSplit.lastIndexOf(')')),
                        expStrSplit = expStr.split(':'),
                        expression = {
                            propertyName: expStrSplit[0].trim()
                        };

                    if (expStrSplit.length > 1)
                        expression.propertyValue = expStrSplit[1].trim();

                    mq.expressions.push(expression);
                }
            }

            results.push(mq);
        }

        return results;
    }

}

// CSSImportRule "@import url("../blaskan/style.css");"

// CSSMediaRule 
// {
//    mediaText: "only screen and (-webkit-min-device-pixel-ratio: 2)",
//    cssText: "@media only screen and (-webkit-min-device-pixel-ratio: 2) { ... }"
// }