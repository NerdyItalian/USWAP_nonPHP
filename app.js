var processedData;

// Listings are represented as a multi-dimensional array of objects. Some arrays will be just the one object.
var listings = [];

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
                        "description": result["body"],
                        "sublease": isSublease(result["aid"]),
                        "url": result["url"]
                    }
                }
            );
            console.log("geoJsonObject:", geoJsonObject);

            // Sort result data into an array of listings based on building ID
            sortListing(result);
            }
        }
    processedData = geoJsonObject;
    displayListings();
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

function getBuilding(listing) {
    if (listing instanceof Array) {
        return listing[0].buildid;
    } else {
        return listing.buildid;
    }
}

function sortListing(listing) {
    // If sublease: put it into the listing array as-is -- all of these will be arrays of listings in a building
    if (isSublease(listing.aid)) {
        listings.push([listing]);
    } else {
        // Check if the listing's building ID is already in global var listings
        // If it is: put it into that array; otherwise put it into its own array
        var i;
        for (i=0; i<listings.length; i++) {
            console.log("Listings ", i, ":", getBuilding(listings[i]), "==", getBuilding(listing));
            if (getBuilding(listings[i]) == getBuilding(listing)) {
                listings[i].push(listing);
                return;
            }
        }
        listings.push([listing]);
    }
}

// Accordion display functions
function displayListings() {
    var $housing = $('.js-housing');
    var i, j;
    for (i=0; i<listings.length; i++) {
        var $container = displayListItem(listings[i][0], i);
        if (listings[i].length > 1) {
            $container.find('.accordion-heading').append('<p><em>Click to view all ' + listings[i].length + ' floor plans</em></p>');
            $container.append(displayAccordionItems(listings[i], i));
        }
        $housing.append($container);
    }
}

function displayListItem(listing, index) {
    var $container = $('<div class="accordion-group">');
    var $firstListing = $('<header class="accordion-heading"><a class="accordion-toggle" data-parent="#js-listings" data-toggle="collapse" href="#js-listing-' + index + '">' + listing.list + '</a></header>');
    $firstListing.append('<p>' + listing.beds + ' beds, ' + listing.baths + ' baths' + '</p>');
    $container.append($firstListing);
    return $container;
}

function displayAccordionItems(listing, index) {
    var $container = $('<div class="accordion-body collapse" id="js-listing-' + index + '">');
    var i, $listing;

    for (i=0; i<listing.length; i++) {
        $listing = $('<div class="accordion-inner">');
        $listing.append('<p>' + listing[i].list + '</p>');
        $container.append($listing);
    }
    return $container;
}