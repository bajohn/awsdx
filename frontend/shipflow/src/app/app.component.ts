import { Component, OnInit } from '@angular/core';
import mapboxgl from 'mapbox-gl'; // or
import mapboxSdk from 'mapbox-gl'; // or

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  testCenter: number[];
  constructor() {

  }
  pointOnCircle(angle) {
    const radius = 20;
    return {
      'type': 'Point',
      'coordinates': [Math.cos(angle) * radius + this.testCenter[0], Math.sin(angle) * radius + this.testCenter[1]]
    };
  }
  animateMarker(map, timestamp) {
    // Update the data to a new position based on the animation timestamp. The
    // divisor in the expression `timestamp / 1000` controls the animation speed.
    map.getSource('point').setData(this.pointOnCircle(timestamp / 1000));

    // Request the next frame of the animation.
    requestAnimationFrame(this.animateMarker.bind(this, map, timestamp));
  }

  ngOnInit() {
    const centerLonLat = [-98.585522, 39.8333333];

    mapboxgl.accessToken = 'pk.eyJ1IjoiYnJlbmRhbmFqb2huIiwiYSI6ImNrZWM1aHkwZjA0YzIydHJzaTdudHA5cjQifQ.ogTyplFS7LdAC7QspnVVkQ';
    this.testSetter();
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11', // stylesheet location
      center: centerLonLat, // starting position [lng, lat]
      zoom: 3 // starting zoom
    });






    map.on('load', () => {
      // Add a source and layer displaying a point which will be animated in a circle.
      map.addSource('point', {
        'type': 'geojson',
        'data': this.pointOnCircle(0)
      });

      map.addLayer({
        'id': 'point',
        'source': 'point',
        'type': 'circle',
        'paint': {
          'circle-radius': 10,
          'circle-color': '#007cbf'
        }
      });



      // Start the animation.
      this.animateMarker(map, 0);
    });

  }

  async testSetter() {
    this.testCenter = await this.geoCode('Washington, DC');
  }


  async geoCode(placeName: string) {
    // store this somewhere for efficiency
    var mapboxClient = mapboxSdk({ accessToken: mapboxgl.accessToken });
    return mapboxClient.geocoding
      .forwardGeocode({
        query: placeName,
        autocomplete: false,
        limit: 1
      })
      .send()
      .then(function (response) {
        if (
          response &&
          response.body &&
          response.body.features &&
          response.body.features.length
        ) {
          var feature = response.body.features[0];
          console.log(feature);
          return feature.center;
        }
      });
  }




}
