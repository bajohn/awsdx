import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

import { v4 as uuidv4 } from 'uuid';

import { Map } from 'mapbox-gl';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  readonly accessToken = 'pk.eyJ1IjoiYnJlbmRhbmFqb2huIiwiYSI6ImNrZWM1aHkwZjA0YzIydHJzaTdudHA5cjQifQ.ogTyplFS7LdAC7QspnVVkQ';
  testPoint: GeoJSON.Point = { type: 'Point', coordinates: [0, 0] };
  defaultCenter = [-98.585522, 39.8333333]; //[-77.0366, 38.895]; // Assumes Kansas!

  appTime = new Date('2020-08-29');
  timeRate = 10;// clock seconds per app day
  updateRate = 10;// rerenders per second
  shipSpeed = 37; // 37 kph is approx 20 knots 
  daysToShow = 2; // number of days to show a ship for

  map: Map;

  shipArr: {
    startLoc: string
    endLoc: string
    startCoord: number[]
    endCoord: number[]
    endDate: Date
    sourceData: any
    srcId: string
    ptId: string
    lineId: string
  }[] = [];


  constructor() {

  }

  async ngOnInit() {

    // start app clock
    setInterval(() => { this.updateAppTime() }, 1000 / this.updateRate)

    // 
    this.debugArray();

  }

  async debugArray() {
    const endDate = new Date();
    const testObj1 = await this.initShipObj('taipei', 'Seattle', endDate);
    const testObj2 = await this.initShipObj('tokyo', 'los angeles', endDate);
    const testObj3 = await this.initShipObj('quito', 'panama', endDate);

    this.shipArr.push(testObj1);
    this.shipArr.push(testObj2);
    this.shipArr.push(testObj3);
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
      sourceData: this.pointSource(startCoord, endCoord, endDate),
      srcId: uuidv4(),
      ptId: uuidv4(),
      lineId: uuidv4()
    };
  }

  updateAppTime() {
    const curTime = this.appTime.getTime();
    const newTime = curTime + 24 * 3600 * 1000 / this.updateRate / this.timeRate;
    this.appTime = new Date(newTime);
    this.updateShips();
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
    const startDate = new Date(endDate.getTime() - this.daysToShow * 24 * 3600 * 1000);
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
    const D = this.shipSpeed * this.daysToShow * 24; // km total over days to show

    const totalDeltaLon = startCoord[0] - endCoord[0];
    const totalDeltaLat = startCoord[1] - endCoord[1];

    const AoA = Math.atan2(totalDeltaLat, totalDeltaLon);// "angle of attack"- ratio of lat:lon
    const lonKm = D * Math.cos(AoA); // KM in the east/west direction
    const latKm = D * Math.sin(AoA); // KM in north/south

    const latConst = 111.2;
    const lonConst = 111.2 * Math.cos(Math.PI / 180 * endCoord[1]);

    const deltaLat = latKm / latConst;
    const deltaLon = lonKm / lonConst;

    const daysLeft = (endDate.getTime() - this.appTime.getTime()) / (24 * 3600 * 1000);
    const pct = daysLeft / this.daysToShow;


    const lonSign = endCoord[0] > this.defaultCenter[0] ? -1 : 1;
    return [endCoord[0] - lonSign * deltaLon * pct, endCoord[1] + deltaLat * pct];
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
      this.shipArr[i].sourceData = this.pointSource(ret.startCoord, ret.endCoord, ret.endDate);
    }
  }

  // Not yet used but could be useful.
  saveMap(map: Map) {
    this.map = map;
  }

}


