// setting the cookie value
function setCookie(cookieName, cookieValue, expirationDays) {
    var expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + expirationDays);
    cookieValue = cookieValue + "; expires=" + expirationDate.toUTCString();
    document.cookie = cookieName + "=" + cookieValue;
}
// retrieving the cookie value
function getCookie(cookieName) {
    var cookies = document.cookie.split(";");
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        var index = cookie.indexOf("=");
        var key = cookie.substr(0, index);
        var val = cookie.substr(index + 1);
        if (key == cookieName)
            return val;
    }
}

function isWebStorageSupported() {
    return 'localStorage' in window;
}