var CSSParser = function CSSParser(css, declarationUrl) {
    // Removing commented fragments
    this.css = css.replace(/\/\*[^*]*\*+([^/*][^*]*\*+)*\//, '');

    this.declarationUrl = declarationUrl;

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
            var mte = this.css.indexOf('{', pos), // cssText opening bracket position
                ob = 1, // Opening brackets count
                cb = 0, // Closing brackets count
                chPos = mte + 1;

            while (ob != cb && chPos < cssLength) {
                var ch = this.css.charAt(chPos);
                if (ch == '{') ob++;
                if (ch == '}') cb++;
                chPos++;
            }

            var declarationText = this.css.substring(pos, mte).trim(),
                mediaQueryList = this.parseMediaQueryList(
                    'CSSMediaRule',
                    declarationText,
                    this.css.substring(mte, chPos),
                    null,
                    declarationText);

            this.results.push.apply(this.results, mediaQueryList);
        }
    },

    findImportRules: function findImportRules() {
        var pos = -1,
            cssLength = this.css.length;

        while ((pos = this.css.indexOf('@import', pos + 1)) >= 0) {
            var importRule = {},
                ite = this.css.indexOf(';', pos);

            var declarationText = this.css.substring(pos, ite + 1).trim(),
                url = declarationText.match(this.urlRegExp)[0],
                mediaQueryList = this.parseMediaQueryList(
                    'CSSImportRule',
                    declarationText,
                    null,
                    this.parseHref(url),
                    declarationText);

            this.results.push.apply(this.results, mediaQueryList);
        }
    },

    parseHref: function parseHref(url) {
        var separator = '"';

        if (url.indexOf('\'') != -1)
            separator = '\'';

        return url.substring(url.indexOf(separator) + 1, url.lastIndexOf(separator));
    },

    parseMediaQueryList: function parseMediaQueryList(type, mediaText, cssText, href, declarationText) {
        var results = [],
            mqTexts = mediaText.replace(/@import|@media|;/, '').split(','); // stripping and splitting

        for (var i in mqTexts) {
            var mqText = mqTexts[i].trim(),
                mq = {
                    type: type,
                    mediaType: 'all', // if not all it will get overriden
                    mediaText: mqText, // mediaText after , split
                    expressions: [],
                    cssText: cssText,
                    href: href,
                    declarationText: declarationText,
                    declarationUrl: this.declarationUrl
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