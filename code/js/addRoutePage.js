"use strict";
// Coded by: Khor Peak Siew
// Team: 212
// Last modified: 18/5/2018


// Map Initialisation callback.  Will be called when Maps API loads.
function initMap() {
    // Initial position centered at Monash University Malaysia 
    const initialPosition = {
        lat: 3.06486,
        lng: 101.60098
    };

    const markerIcon = {
        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        fillColor: "#FF69B4",
        fillOpacity: 100,
        strokeWeight: 1,
        scale: 4
    };

    // Store the number of markers of turning point
    let markerCount = 0;

    // Initialise the map
    const map = initialiseMap(initialPosition);

    // Initialise the draggable Marker to set the path line
    const draggableMarker = new google.maps.Marker({
        map: map,
        position: initialPosition,
        animation: google.maps.Animation.DROP,
        draggable: true
    });

    let pathLine = [];
    let pathLineCoordinates = [];
    let pathLinePoly;

    // Add hot pink markers at turning points when clicked by user
    google.maps.event.addDomListener(document.getElementById('addMarker'), 'click', function() {
        if (pathLinePoly != undefined) {
            pathLinePoly.setMap(null);
        }

        let draggableMarkerPosition = {
            lat: draggableMarker.getPosition().lat(),
            lng: draggableMarker.getPosition().lng()
        };

        // Add marker only when the most recent marker is not the same current position
        if (pathLine.length === 0 || (draggableMarkerPosition.lat !== pathLineCoordinates[markerCount - 1].lat) ||
            (draggableMarkerPosition.lng !== pathLineCoordinates[markerCount - 1].lng)) {
            let marker = new google.maps.Marker({
                position: draggableMarkerPosition,
                map: map,
                icon: markerIcon
            });
            markerCount += 1;

            // Store the path line as arrays of Marker objects and coordinates
            pathLine.push(marker);
            pathLineCoordinates.push(draggableMarkerPosition);

            // Make the first starting point marker green
            if (markerCount === 1) {
                let icon = marker.getIcon();
                icon.fillColor = "green";
                marker.setIcon(icon);
                // Make the markers in between the first and last markers to be blue
            } else if (markerCount >= 3) {
                let icon = pathLine[markerCount - 2].getIcon();
                icon.fillColor = "blue";
                pathLine[markerCount - 2].setIcon(icon);
            }
        }

        // Plot the path line in blue
        pathLinePoly = new google.maps.Polyline({
            path: pathLineCoordinates,
            geodesic: true,
            strokeColor: 'blue',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });

        pathLinePoly.setMap(map);

    });

    // Undo the last marker added to the map if user mistakenly added it
    google.maps.event.addDomListener(document.getElementById('undoMarker'), 'click', function() {
        if (pathLineCoordinates.length > 0) {
            pathLine[markerCount - 1].setMap(null);
            pathLinePoly.setMap(null);

            // Decrement the number of markers by 1
            markerCount -= 1;
            if (markerCount > 1) {
                // Fill the last marker with hot pink color
                let icon = pathLine[markerCount - 1].getIcon();
                icon.fillColor = "#FF69B4";
                pathLine[markerCount - 1].setIcon(icon);
            }

            // Remove the last marker in the pathLine & pathLineCoordinates array
            pathLine.pop();
            pathLineCoordinates.pop();

            pathLinePoly = new google.maps.Polyline({
                path: pathLineCoordinates,
                geodesic: true,
                strokeColor: 'blue',
                strokeOpacity: 1.0,
                strokeWeight: 2
            });

            pathLinePoly.setMap(map);
        }

    });

    // Add the path line with its title and locations of turning points into localStorage as JSON string
    google.maps.event.addDomListener(document.getElementById('addRoute'), 'click', function() {
        if (markerCount < 2) {
            displayMessage("At least two markers are needed to create a path.");
        } else {
            let pathList = JSON.parse(localStorage.getItem(STORAGE_KEY));

            // Prompt the user for the path line title
            let title = prompt("Enter the title for your route (e.g. x to y): ");
            // Continuously prompt user for title if given empty string
            while (title === "") {
                title = prompt("Enter the title for your route (e.g. x to y): ");
            }
            // Exit function if user click 'cancel'
            if (title === null) {
                return;
            }
            title = "User" + title;

            let locations = pathLineCoordinates;

            let path = {
                locations,
                title
            };
            // Add the user added path into the path list retrieved 
            pathList.push(path);

            //  Store the path list into localStorage
            let jsonStr = JSON.stringify(pathList);
            localStorage.setItem(STORAGE_KEY, jsonStr);

            // Notify user to go back to main page for navigation
            displayMessage("Route added successfully! Click on Back button to Navigate at Main Page.", 3000);
        }
    });

    // Always make the map centered even when screen changes size
    google.maps.event.addDomListener(window, "resize", function() {
        let center = map.getCenter();
        google.maps.event.trigger(map, "resize");
        map.setCenter(center);
    });

}

// Initialise the map with given latLng coordinates
// @param {Object} {lat, lng} The latLng of the coordinates to initialise the map
// @param {Object} google.maps.Map(document.getElementById('map') A new google map object
function initialiseMap({
    lat,
    lng
}) {
    return new google.maps.Map(document.getElementById('map'), {
        center: {
            lat,
            lng
        },
        zoom: 20
    });
}