function initialize() {
    var mapOptions = {
        center: { lat: 44.9747, lng: -93.2354},
        zoom: 12
    };
    var map = new google.maps.Map(document.getElementById('map-canvas'),
        mapOptions);

    map.data.loadGeoJson('dummyGeoJSON.json');
/*    map.data.setStyle({
        icon: 'https://maps.gstatic.com/mapfiles/ms2/micons/green-dot.png',
        fillColor: 'green'
    });*/
    map.data.setStyle(function(feature) {
        var placeName = feature.getProperty('name');
        if (feature.getProperty('sublease')) {
            return {
                icon: "https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png",
                visible: true,
                clickable: true,
                title: placeName
            };
        } else {
            return {
                icon: "https://maps.gstatic.com/mapfiles/ms2/micons/green-dot.png",
                visible: true,
                clickable: true,
                title: placeName
            }
        }
    });
    map.data.addListener('click', function(event) {
        var windowObjectReference;
        var address = event.feature.getProperty('url');
        windowObjectReference = window.open(address, "__blank");
    });
    /*    map.data.addListener('mouseover', function(event) {
     document.getElementById('info-box').textContent =
     event.feature.getProperty('description');
     });*/
}
google.maps.event.addDomListener(window, 'load', initialize);