import { Component, OnInit } from '@angular/core';

import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  readonly accessToken = 'pk.eyJ1IjoiYnJlbmRhbmFqb2huIiwiYSI6ImNrZWM1aHkwZjA0YzIydHJzaTdudHA5cjQifQ.ogTyplFS7LdAC7QspnVVkQ';
  testPoint: GeoJSON.Point = { type: 'Point', coordinates: [0, 0] };
  defaultCenter = [-77.0366, 38.895]; //[-98.585522, 39.8333333];
  //londonishCenter = [0, 51.5];

  private timer: number;
  appTime = new Date('2020-08-29');
  timeRate = 2;// clock seconds per app day
  updateRate = 100;// rerenders per second
  shipSpeed = 37; // 37 kph is approx 20 knots 


  masterArr: {
    startLoc: string
    endLock: string
    startCoord: number[]
    endCoord: number[]
    endDate: Date
  }[] = [];



  constructor() {

  }

  ngOnInit() {

    setInterval(() => { this.updateAppTime() }, 1000 / this.updateRate)



    const startLocation = 'New York';
    const endLocation = 'London';
    const endDate = new Date();

  }

  updateAppTime() {
    const curTime = this.appTime.getTime();
    const newTime = curTime + 24 * 3600 * 1000 / this.updateRate / this.timeRate;
    console.log(this.appTime);
    this.appTime = new Date(newTime);
  }

  async doRequest() {
    // this.testPoint.coordinates = respCoords;

    // this.timer = window.setInterval(() => {
    //   //console.log(this.testPoint.coordinates);
    //   this.testPoint.coordinates = [
    //     this.testPoint.coordinates[0] + .05,
    //     this.testPoint.coordinates[1] - .05]

    //   this.testPoint = { ...this.testPoint };
    // }, 1);

  }



  async coord(placeName: string) {
    let request = "https://api.mapbox.com/geocoding/v5/mapbox.places/";
    request += placeName
    request += '.json';
    request += '?access_token=';
    request += this.accessToken;

    const resp = await fetch(request);
    const respBody = await resp.json();
    const features = respBody['features'];

    const bestfeature = features[0];
    return bestfeature['center'];


  }



}
