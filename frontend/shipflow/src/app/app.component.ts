import { Component, OnInit } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

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

  appTime = new Date('2020-08-25');
  timeRate = 2;// clock seconds per app day
  updateRate = 100;// rerenders per second
  shipSpeed = 37; // 37 kph is approx 20 knots 
  daysToShow = 7; // number of days to show a ship for

  shipArr: {
    startLoc: string
    endLoc: string
    startCoord: number[]
    endCoord: number[]
    endDate: Date
    curSource: any
  }[] = [];



  constructor() {

  }

  async ngOnInit() {

    // start app clock
    setInterval(() => { this.updateAppTime() }, 1000 / this.updateRate)

    const startLoc = 'New York';
    const endLoc = 'Berlin';
    const endDate = new Date();
    const testObj = await this.initShipObj(startLoc, endLoc, endDate);
    this.shipArr.push(testObj);
  }

  async initShipObj(startLoc, endLoc, endDate) {
    const startCoord = await this.coord(startLoc);
    const endCoord = await this.coord(endLoc);
    return {
      startLoc: startLoc,
      endLoc: endLoc,
      startCoord: startCoord,
      endCoord: endCoord,
      endDate: endDate,
      curSource: this.pointSource(startCoord, endCoord, endDate),
      srcId: uuidv4(),
      ptId: uuidv4()
    }
  }

  updateAppTime() {
    const curTime = this.appTime.getTime();
    const newTime = curTime + 24 * 3600 * 1000 / this.updateRate / this.timeRate;
    this.appTime = new Date(newTime);
    this.updateShips();
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


  // Hit Mapbox geo code API to figure out
  // lat/lon from a generic place name
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




  showGraphics(endDate: Date) {
    const startDate = new Date(endDate.getTime() - this.daysToShow * 7 * 24 * 3600 * 1000);
    return endDate > this.appTime && startDate < this.appTime;
  }

  lineSource(startCoord, endCoord) {
    return {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            startCoord,
            endCoord
          ]
        }
      }
    };
  }

  shipCoord(startCoord, endCoord, endDate: Date) {
    const deltaX = startCoord[0] - endCoord[0];
    const deltaY = startCoord[1] - endCoord[1];

    const daysLeft = (endDate.getTime() - this.appTime.getTime()) / (24 * 3600 * 1000);
    const pct = daysLeft / this.daysToShow;

    return [endCoord[0] + deltaX * pct, endCoord[1] + deltaY * pct];
  }

  pointSource(startCoord, endCoord, endDate) {

    const curCoord = this.shipCoord(startCoord, endCoord, endDate);
    const ret = {
      type: 'Point',
      coordinates: curCoord
    }
    return ret;
  }

  updateShips() {
    for (let i in this.shipArr) {
      const curObj = this.shipArr[i]
      const ret = { ...curObj };
      this.shipArr[i].curSource = this.pointSource(ret.startCoord, ret.endCoord, ret.endDate);
    }
  }
}


