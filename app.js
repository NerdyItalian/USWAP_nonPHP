var processedData;

function initializeCallback() {
    var mapOptions = {
        center: { lat: 44.9747, lng: -93.2354},
        zoom: 12
    };
    var map = new google.maps.Map(document.getElementById('map-canvas'),
        mapOptions);
    console.log("processed data inside initialize: " + processedData);
    map.data.addGeoJson(processedData);

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

getData(processData, initializeCallback);

// 'http://umn.u-swap.org/api/v1/housing'
function getData(callback, initialize) {
    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: 'dummyData.json',
        success: function(data, textstatus) {
            console.log(data);
            callback(data);
            google.maps.event.addDomListener(window, 'load', initialize);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(textStatus, errorThrown);
        },
        complete: function (jqXHR, textStatus) {
            console.log("Ajax call complete: " + textStatus)
        }
    })
}

function processData(data) {
    geoJsonObject = {
        "type": "FeatureCollection",
        "features": []
    };
    for (var i=0; i < data.results.length; i++) {
        var result = data.results[i];
        if (result["active"] == "1") {
            geoJsonObject["features"].push(
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [parseFloat(result["lng"]), parseFloat(result["lat"])]
                    },
                    "properties": {
                        "name": getName(result["aid"], result["list"]),
                        "description": result["body"],
                        "sublease": isSublease(result["aid"]),
                        "url": result["url"]
                    }
                }
            );
            console.log("geoJsonObject:", geoJsonObject);
        }
        }
    processedData = geoJsonObject;
}

function isSublease(aid) {
    if (aid == null) {
        return true;
    }else {
        return false;
    }
}

function getName(aid, list) {
    if (aid == null) {
        return "Sublease";
    } else {
        return list;
    }
}