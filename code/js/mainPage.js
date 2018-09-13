"use strict";
//Name: Khor Peak Siew, Randy Chin, Gowin
//Team: 212
//Last modified: 18/5/2018


let data = {
    campus: "sunway",
    callback: "storeRoutes"
};

// Automate the generation of URL for the web service request
// @param {String} url The front part of the web service url
// @param {Object} data Contain the subsequent query string of the url
function jsonpRequest(url, data) {
    // Build URL parameters from data object.
    let params = "";
    // For each key in data object...
    for (let key in data) {
        if (data.hasOwnProperty(key)) {
            if (params.length == 0) {
                // First parameter starts with '?'
                params += "?";
            } else {
                // Subsequent parameter separated by '&'
                params += "&";
            }

            let encodedKey = encodeURIComponent(key);
            let encodedValue = encodeURIComponent(data[key]);

            params += encodedKey + "=" + encodedValue;
        }
    }
    let script = document.createElement('script');
    script.src = url + params;
    document.body.appendChild(script);
}

// Store the object returned by jsonpRequest in localStorage
// @param {Object} routes Contains the details for each walkingRoute
function storeRoutes(routesArray) {
    if (typeof(Storage) !== "undefined") {
        if (localStorage.getItem(STORAGE_KEY) != null) {
            let pathNumber = JSON.parse(localStorage.getItem(STORAGE_KEY)).length;
            if (routesArray.length >= pathNumber) {
                // Stringify routesArray instance to a JSON string
                let jsonStr = JSON.stringify(routesArray);
                localStorage.setItem(STORAGE_KEY, jsonStr);

            }
        } else {
            let jsonStr = JSON.stringify(routesArray);
            localStorage.setItem(STORAGE_KEY, jsonStr);
        }
    } else {
        console.log("Error: localStorage is not supported by current browser.");
    }
}

// Navigate to navigation page when clicked, also store the path 
// selected by user in localStorage for navigation
// @param {Number} The path index in path list on main page
function viewPath(pathIndex) {
    if (typeof(Storage) !== "undefined") {
        // Stringify pathIndex to a JSON string
        let jsonStr = JSON.stringify(pathIndex);
        localStorage.setItem("whichPath", jsonStr);
    } else {
        console.log("Error: localStorage is not supported by current browser.");
    }
    // redirecting to navigation page 
    location.href = "navigate.html";
}

// Navigate to addRoute page
function addRoute() {
    location.href = "addRoute.html";
}

// Contacting Campus Nav web service using jsonpRequest function 
jsonpRequest("https://eng1003.monash/api/campusnav/", data);

// Add the table DOM listing the paths to the page after 1.5 seconds to allow
// for the Campus Nav web service to return the dats in JSON 
setTimeout(function() {
    let pathList = new PathList();
    if (localStorage.getItem(STORAGE_KEY) !== null) {
        // Retrieve the path list from localStorage
        let walkingRoutesObject = JSON.parse(localStorage.getItem(STORAGE_KEY));
        // Initialise path list objects with the pathList JSON
        pathList.initialiseFromPathListPDO(walkingRoutesObject);
    }

    // Adding the path list to the main page evrytime it reloads
    let listOfPaths = document.getElementById("paths-list");
    let listHTML = "";

    for (let index = 0; index < pathList.pathLists.length; index++) {
        let places = pathList.pathLists[index].places;
        let serverUserPlaces;
        // categorizing the paths to either server or user added
        if (places.includes("User")) {
            serverUserPlaces = "<strong>User: </strong><br/>" + places.replace("User", "");
        } else {
            serverUserPlaces = "<strong>Server: </strong><br/>" + places;
        }

        listHTML += "<tr> <td onmousedown=\"viewPath(" + index + ")\" class=\"full-width mdl-data-table__cell--non-numeric\">" + serverUserPlaces;
        listHTML += "<div class=\"subtitle\">" + "Distance: " + pathList.pathLists[index].totalDistance() + " m <br/>Number of Turns: " + pathList.pathLists[index].numberOfTurns() + "</div></td></tr>";
    }

    // Insert the list view elements into the available list of paths.
    listOfPaths.innerHTML = listHTML;
}, 1500);