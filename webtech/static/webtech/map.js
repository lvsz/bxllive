const mapboxAccessToken = 'pk.eyJ1IjoibHZzeiIsImEiOiJjam9qOXIzdTYwMnFpM2t2d2MyaHJxcXJsIn0.EBOtf2ATioNXLSCXj2DxGQ'
// Grand Place
var dest = L.latLng(50.8467139, 4.3524994);

// Brussels Central Station
var user_location = L.latLng(50.8454639, 4.3569867);

// create the map
var map = L.map('map').setView(dest,5);


// routing plugin
var control = L.Routing.control({
    router: L.Routing.mapbox(mapboxAccessToken, { profile: 'mapbox/walking' })
}).addTo(map);


// create tile layer for map
L.tileLayer(`https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=${mapboxAccessToken}`, {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 19,
    id: 'mapbox.streets',
}).addTo(map);


// called when user's location is found
function userLocation(e) {
    user_location = e.latlng;
    control.setWaypoints([user_location]);
}


// adds a waypoint to the a route
// argument needs to have a member called latlng to access the coordinates
function updateRoute(e) {
    control.spliceWaypoints(control.getWaypoints().length - 1, 1, e.latlng);
}


// creates button, used for interactively planning routes
function createButton(label, container) {
    var btn = L.DomUtil.create('button', 'a', container);
    btn.setAttribute('type', 'button');
    btn.innerHTML = label;
    return btn;
}


// click on the map allows users to plan routes
map.on('click', function(e) {
    var container = L.DomUtil.create('div'),
        // startBtn = createButton('Start from this location', container),
        destBtn = createButton('Go to this location', container);

    L.popup()
        .setContent(container)
        .setLatLng(e.latlng)
        .openOn(map);

    L.DomEvent.on(destBtn, 'click', function() {
        updateRoute(e)
        map.closePopup();
    });
});


// map layer that keeps the venue markers
var venue_markers = L.layerGroup().addTo(map);

function addVenueMarker(venue) {
    return marker = L.marker(venue.latlng, {
        title: venue.name,
        alt: venue.name,
        riseOnHover: true,
    })
        .on({'click': function() {updateRoute(venue)} })
        .addTo(venue_markers);
}

$('#find-nearby-venues').click(function() {
    const point = map.getCenter();
    const lng = point.lng;
    const lat = point.lat;
    $.get('/webtech/user_locate/', {lng: point.lng, lat: point.lat}, function(data) {
        const venues = JSON.parse(data);
        for (venue of venues) {
            addVenueMarker(venue)
        };
    });
});


var event_markers = L.layerGroup().addTo(map);

// provides a map popup with a link and summary of an event
function event_marker_content(evt) {
    var html = `<p class="event-marker">${evt.date}: <a href="../events/${evt.id}">${evt.name}</a><br>`;
    html += `${evt.weekday}, ${evt.time} @ ${evt.venue}<br>`;
    if (evt.artists.length > 1) {
        html += 'line-up:<ul>';
        for (artist of evt.artists) {
            html += `<li>${artist.name}</li>`;
        };
        html += '</ul>';
    }
    html += '</p>'
    return html;
}

function event_popup(evt) {
    var container = L.DomUtil.create('div');
    container.innerHTML = event_marker_content(evt);
    var btn = createButton("Go to this venue", container);

    L.DomEvent.on(btn, 'click', function() {updateRoute(evt)});

    return L.popup({
        autoClose: false,
        closeOnEscapeKey: false,
        closeOnClick: false,
    })
        .setContent(container)
        .setLatLng(evt.latlng)
}


// given a datestring in 'dd/mm/yyyy' format, this function queries the database for events on that date
// is supposed to be called in the datepicker's "onClose" option
function get_events_on_date(dateString, inst) {
    if (dateString) {
        event_markers.clearLayers();
        const dateList = dateString.split('/');
        $.get( '/webtech/events_on_date/',
            { dd: dateList[0], mm: dateList[1], yy: dateList[2] },
            function(data) {
                const evts = JSON.parse(data);
                for (evt of evts) {
                    event_popup(evt).addTo(event_markers);
                }
            })
    }
};


$( function() {
    $( "#datepicker" ).datepicker({
        dateFormat: "dd/mm/yy",
        onClose: get_events_on_date,
    });
});


$( document ).ready(function() {
    var selected_event = document.getElementById("selected_event").innerHTML;
    if (selected_event) {
        selected_event = JSON.parse(selected_event);
        map.setView(selected_event.latlng, 16)
        event_popup(selected_event).addTo(event_markers);
        map.on('locationfound', userLocation).locate();
    } else {
        map.setView(dest, 15);
        map.on('locationfound', userLocation).locate().setView(user_location, 15);
    }
});
