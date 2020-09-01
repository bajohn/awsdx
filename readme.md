# ShipFlow
This app was created for the AWS Data Exchange Challenge. Read more here

https://awsdataexchange.devpost.com/

The following was submitted as a description for the entry:

## Inspiration
I wanted to create a data visualization showing macroeconomic movement. I decided shipping container data would be perfect.
## What it does
ShipFlow uses a US Customs and Border Protection (CBP) Data  [provided by Enigma](https://console.aws.amazon.com/dataexchange/home?region=us-east-1#/subscriptions/prod-ejlpbky2zthni) as its source. 

## How I built it
I found the dataset on AWS Data Exchange, and decided to explore it a bit. 

The file that ended up being most useful was `data/ams__header_2020__202008241500.csv`, showing the header data of containers cleared by CBP.

The header data contains port of origin, port of destination, weight, vessel name, and several other fields useful for visualizing shipments. Since detailed telemetry data is out of scope of this project and dataset, I decided to interpolate their path of travel using a simple algorithm. I assumed ships travel at a fixed speed along a line that intersects the port of destination and the center of the United States. For the vast majority of ships, this gives a reasonable-looking path. The algorithm located [here](https://github.com/bajohn/awsdx/blob/master/frontend/shipflow/src/app/app.component.ts) is

```  shipCoord(endCoord, endDate: Date, lonOffset, latOffset) {
    const D = this.shipSpeed * this.daysToShow * 24; // km total over days to show

    const totalDeltaLon = endCoord[0] - this.defaultCenter[0];
    const totalDeltaLat = endCoord[1] - this.defaultCenter[1];

    const AoA = Math.atan2(totalDeltaLat, totalDeltaLon);// "angle of attack"- ratio of lat:lon
    const lonKm = D * Math.cos(AoA); // KM in the east/west direction
    const latKm = D * Math.sin(AoA); // KM in north/south

    const latConst = 111.2;
    const lonConst = 111.2 * Math.cos(Math.PI / 180 * this.defaultCenter[1]);

    const deltaLat = latKm / latConst;
    const deltaLon = lonKm / lonConst;

    const daysLeft = (endDate.getTime() - this.appTime.getTime()) / (24 * 3600 * 1000);
    const pct = daysLeft / this.daysToShow;

    return [endCoord[0] + (deltaLon + lonOffset) * pct, endCoord[1] + (deltaLat + latOffset) * pct];
  }
  ```

This algorithm means that to know where a ship's visualization location is, we only need to know its destination in lon/lat, arrival date, and the app's clock time. A small, randomized offset was added so that a group of ships with the same destination location / time would not be shown directly on top of each other.

Since the AWS Data Exchange dataset contains generic place names, a translation layer is needed. The Mapbox Geocoding API was used to retrieve a lon/lat from a generic place name. 

I wrote several Python scripts run locally to interact with the data (see source in github repo):
- [Data Agg](https://github.com/bajohn/awsdx/blob/master/scripts/data_agg.py) to automatically move data from AWS Data Exchange to S3.
- [Data Cleaner](https://github.com/bajohn/awsdx/blob/master/scripts/data_cleaner.py) to clean data for upload to AWS Athena
- [Data Sampler](com/bajohn/awsdx/blob/master/scripts/data_sampler.py) to view a few rows of data locally.

I then uploaded the dataset to AWS Athena, where I was able to further investigate the data using SQL.

After finding queries that returned the data that the front-end needed, (I created a Lambda)[https://github.com/bajohn/awsdx/blob/master/lambdas/data_aggregation.py] to do these queries in realtime. This backend Lambda simply takes a date, like `2020-07-19`, as an argument and returns all relevant ships for that date from the AWS Data Exchange dataset stored in S3.

I then wrote the front end using Angular 9 and Mapbox. The front end pulls several days of data from the backend lambda, then queries the Mapbox to find the lat/lon of each destination. These results are stored in an array and displayed on the webpage. The app recalculates position of every ship every tick of its simulated time. The user is able to change the time, triggering a reload, and watch as the ships move to their destination. Metadata about the ships is shown in a popup, and the size of a ship's circle on the map is proportional to the size of its cargo.

The frontend shows ships two days from their destination, and removes them on arrival.

To host the app, I registered a domain name using AWS Route 53 and ACM. The app's Javascript/HTML artifacts are stored in S3, and served using cloudfront. This app uses infrastructure as code via Terraform, allowing easier management and configuration. (A small deploy script)[https://github.com/bajohn/awsdx/blob/master/scripts/deploy.sh] was written to efficiently update the backend Lambda's code.


## Challenges I ran into
The data was more complex than expected. Particularly, I had assumed each row of data for the same vessel's voyage would have the same origin and destination, but this is not the case. I thought a container originating in Germany but shipped from the Netherlands to the United States would show the Netherlands as a port of origin, but instead Germany is shown. To simplify the display, I chose the origin with the largest weight on the vessel to show as the origin in the app.

I originally wanted to implement a great circle path to more accurately show where ships were travelling from, but soon realized this was a high-effort low-reward task. Actual ships follow shipping lanes and more complex navigtation than great circles, so I decided instead to use the algorithm described above.

The animation speed ended up being a bit slow, and would likely not be mobile friendly. 

## Accomplishments that I'm proud of
In about one week of working on my own, I was able to go from zero to a fully-functioning data-driven web app. This shows the power of AWS.

## What I learned
This was my first time using AWS Athena and the AWS Data Exchange. These are incredible tools that I look forward to using in the future.

## What's next for Ship Flow
ShipFlow has plenty of room for performance improvements. Some possible angles of attack are:

- Looking further into the Mapbox API to try to improving the animations. 
- Precaching ship paths
- Precaching {place-name: lon-lat} mapping that is now pulled in realtime.
- Tie in more data sources, such as actual telemetry data and more ship metadata.

And of course I'd like to sort out a few bugs, particularly browser compatibility issues.



