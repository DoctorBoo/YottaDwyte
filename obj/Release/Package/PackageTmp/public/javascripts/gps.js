function supportsGeolocation() {
    return 'geolocation' in navigator;
}
function showMessage(message) {
    $('#message').html(message);
}
function getLocation() {
    if (supportsGeolocation()) {
        var options = {
            enableHighAccuracy: true,
            timeout: 3000,
            maximumAge: 20000
        };
        navigator.geolocation.getCurrentPosition(showPosition, showError, options);
        watchId = navigator.geolocation.watchPosition(showPosition, showError, options);
    }
    else {
        showMessage("Geolocation is not supported by this browser.");
    }
}

function getDistance(lat1, lon1, lat2, lon2) {
    var earthRadius = 3959; //miles
    var latRadians = getRadians(lat2 - lat1);
    var lonRadians = getRadians(lon2 - lon1);
    var a = Math.sin(latRadians / 2) * Math.sin(latRadians / 2) +
    Math.cos(getRadians(lat1)) * Math.cos(getRadians(lat2)) *
    Math.sin(lonRadians / 2) * Math.sin(lonRadians / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var distance = earthRadius * c;
    return distance;
}
function getRadians(latlongDistance) {
    return latlongDistance * Math.PI / 180;
}
function endWatch() {
    if (watchId != 0) {
        navigator.geolocation.clearWatch(watchId);
        watchId = 0;
        showMessage("Monitoring ended.");
    }
}
function showPosition(position) {
    var mapcanvas = document.getElementById('map');
    var coords = new google.maps.LatLng(position.coords.latitude
        , position.coords.longitude);
    var options = {
        zoom: 13,
        center: coords,
        mapTypeControl: false,
        navigationControlOptions: {
            style: google.maps.NavigationControlStyle.SMALL
        },
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map = new google.maps.Map(mapcanvas, options);
    var marker = new google.maps.Marker({
        position: coords,
        map: map,
        title: "You are here!"
    });
}
function showPositionObs(position) {
    var datetime = new Date(position.timestamp).toLocaleString();
    showMessage("Latitude: " + position.coords.latitude + "<br />"
    + "Longitude: " + position.coords.longitude + "<br />"
    + "Timestamp: " + datetime);
}
function showError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            showMessge("User denied Geolocation access request.");
            break;
        case error.POSITION_UNAVAILABLE:
            showMessage("Location information unavailable.");
            break;
        case error.TIMEOUT:
            showMessage("Get user location request timed out.");
            break;
        case error.UNKNOWN_ERROR:
            showMessage("An unknown error occurred.");
            break;
    }
}

function showErrorObs(error) {
    switch (error.code) {
       
        default:
            showMessage("Error not handled.");
            break;
    }
}