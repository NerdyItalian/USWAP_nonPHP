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
            // Get the index of a listing if there are other listings
            var listingIndex = getOtherListings(result.buildid, geoJsonObject["features"]);

            console.log("Listing index for result ", i, ":", listingIndex);

            // Only add a listing to a group of buildings if the listing is like so
            if (listingIndex != null && !isSublease(result["aid"])) {
                geoJsonObject["features"][listingIndex].properties["additional"].push({
                    "name": getName(result["aid"], result["list"]),
                    "buildid": result["buildid"],
                    "description": result["body"],
                    "sublease": isSublease(result["aid"]),
                    "url": result["url"]
                });
            }

            else {
            // Process object into GeoJSON to display it on the map
                geoJsonObject["features"].push(
                    {
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [parseFloat(result["lng"]), parseFloat(result["lat"])]
                        },
                        "properties": {
                            "name": getName(result["aid"], result["list"]),
                            "buildid": result["buildid"],
                            "description": result["body"],
                            "image": result["images"][0].thumb,
                            "sublease": isSublease(result["aid"]),
                            "url": result["url"],
                            "additional": []
                        }
                    }
                );
            }
            console.log("geoJsonObject:", geoJsonObject);
            }
        }
    processedData = geoJsonObject;
    displayListings(processedData.features);
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

function getOtherListings(id, array) {
    var i;
    for (i=0; i<array.length; i++) {
        console.log("Checking if ", array[i].properties["buildid"], "is equal to ", id);
        if (array[i].properties["buildid"] == id) {
            console.log("It's equal");
            return i;
        }
    }
}

// Accordion display functions
function displayListings(data) {
    var $housing = $('.js-housing');
    var i;
    for (i=0; i<data.length; i++) {
        var listing = data[i].properties;
        var $container = displayListItem(listing, i);
        if (listing.additional.length > 0) {
            $container.find('.accordion-heading').append('<p><em>Click to view ' + listing.additional.length + ' additional floor plans</em></p>');
            $container.append(displayAccordionItems(listing.additional, i));
        }
        $housing.append($container);
    }
}

function displayListItem(listing, index) {
    var $container = $('<div class="accordion-group">');
    if (!listing.sublease) {
        $container.addClass('affiliate');
    }
    var $firstListing = $('<header class="accordion-heading"><a class="accordion-toggle" data-parent="#js-listings" data-toggle="collapse" href="#js-listing-' + index + '"><img class="cover-image cover-image-sm" src="' + listing.image + '"><h3 class="title">' + listing.name + '</a></h3></header>');
    //$firstListing.append('<p>' + listing.beds + ' beds, ' + listing.baths + ' baths' + '</p>');
    $container.append($firstListing);
    return $container;
}

function displayAccordionItems(listing, index) {
    var $container = $('<div class="accordion-body collapse" id="js-listing-' + index + '">');
    var i, $listing;

    for (i=0; i<listing.length; i++) {
        $listing = $('<div class="accordion-inner">');
        $listing.append('<p>' + listing[i].name + '</p>');
        $container.append($listing);
    }
    return $container;
}