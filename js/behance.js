// http://your_redirect_uri?error=access_denied&error_reason=user_denied&error_message=The+user+has+denied+your+request
// http://your_redirect_uri?code=code

var search = window.location.search.substring(1);

if (search != '') {
    var params = {},
        split = search.split('&');

    for (var i in split) {
        var paramSplit = split[i].split('=');
        if (paramSplit.length == 2)
            params[decodeURIComponent(paramSplit[0])] = decodeURIComponent(paramSplit[1]);
    }

    console.log(params);

    if (params.code) {
        $('div.success').css('display', 'block');
    } else if (params.error) {
        $('div.error').css('display', 'block');
    } else {
        $('div.unknown').css('display', 'block');
    }

}