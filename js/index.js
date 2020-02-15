/*jslint browser: true*/
/*global mapboxgl*/

//-----------------------------------------------------------------------

mapboxgl.accessToken = 'pk.eyJ1IjoidHVyc2ljcyIsImEiOiJjajBoN3hzZGwwMDJsMnF0YW96Y2l3OGk2In0._5BdojVYvNuR6x4fQNYZrA';

//-----------------------------------------------------------------------

var map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/mapbox/outdoors-v11', //streets-v11 outdoors-v11 satellite-v11 satellite-streets-v11
	center: [13.38523, 52.45171], // hackathon location
	minZoom: 10,
	maxZoom: 19,
	zoom: 17,
	pitch: 60,
	hash: true,
//	maxBounds: [[6.4, 51.22], [6.8, 51.46]]
});

//-----------------------------------------------------------------------

map.on('load', function () {
	'use strict';

	map.addControl(new mapboxgl.FullscreenControl());
	map.addControl(new mapboxgl.NavigationControl());
	map.addControl(new mapboxgl.GeolocateControl({
		positionOptions: {
			enableHighAccuracy: true
		}
	}));
});

//-----------------------------------------------------------------------
