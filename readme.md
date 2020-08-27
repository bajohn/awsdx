

# RIP

Didn't end up submitting, life got in the way!


# AWS Data Exchange Hackathon 
Repo for hackathon described here:
https://awsdataexchange.devpost.com/

Deadline: 5:00pm EDT Aug 24, 2020

## Deployment 
`./scripts/deploy.sh --libs=true`
- `--libs [true|false]` Bundle and deploy python packages managed by pipenv.

## Plan
- Amazing CBP data. Infographic for countries->US shipping through 2020.

- Take data from `data/ams__header_2020__202008241500.csv` with CSV columns:
```
identifier,carrier_code,vessel_country_code,vessel_name,port_of_unlading,estimated_arrival_date,foreign_port_of_lading_qualifier,foreign_port_of_lading,manifest_quantity,manifest_unit,weight,weight_unit,measurement,measurement_unit,record_status_indicator,place_of_receipt,port_of_destination,foreign_port_of_destination_qualifier,foreign_port_of_destination,conveyance_id_qualifier,conveyance_id,in_bond_entry_type,mode_of_transportation,secondary_notify_party_1,secondary_notify_party_2,secondary_notify_party_3,secondary_notify_party_4,secondary_notify_party_5,secondary_notify_party_6,secondary_notify_party_7,secondary_notify_party_8,secondary_notify_party_9,secondary_notify_party_10,actual_arrival_date
```

Sample Row:
```
2020072777336,SEAU,SG,MAERSK NESTON,"Port Hueneme, California",2020-07-26,Schedule K Foreign Port,"Puerto Bolivar,Ecuador",2880,BOX,131704,Pounds,75,Cubic Meters,Deleted,PUERTO BOLIVAR -,"","","",IMO Number/Lloyds Number,9215907,"","Vessel, non-container","","","","","","","","","","",2020-07-26
```

Pull out:
- Originating port (`foreign_port_of_lading`)
- Destination port (`port_of_unlading`) 
- carrier_code,vessel_country_code,vessel_name (for fun, maybe tooltip), vessel IMO (identifier)
- Estimated Arrival
- weight,weight_unit (for sizing of dot)



Several options to pull to an API, way that involves parts that I know would be

frontend request -> API Gateway Endpoint -> Lambda smart open -> (assuming well-ordered)  s3 csv 
front end receives data and continue token (or simply row number) <- Lambda parsing <- s3 csv response

Front end can store in a giant FIFO queue

Front end: 
- Use mapbox API, show dots indicating size of ship based on kg
- Use typical ship speed interpolated from arrival date to "simulate" voyage. Randomize radial angle (?) to spread out ships approaching the same port (should decide how to do this)
- Bonus: show big queue on sidebar, would be really satisfying.


## TODO

Sample Header row


1



## Dead Ideas
- Correlate shipping data with something
- [Shipping Data](https://aws.amazon.com/marketplace/pp/prodview-2yx6pwjzh23bo?qid=1595467629281&sr=0-10&ref_=srh_res_product_title)
- Turns out this data is low frequency so not very interesting less interesting

- See about predictive modeling between Fed data and Equity EOD data.
- Debit, Credit data: Experian, Facteus



Euro energy data background:
- Translate types: https://dd.eionet.europa.eu/vocabulary/eurostat/siec/view
- Crappy existing data explorer https://appsso.eurostat.ec.europa.eu/nui/show.do?dataset=nrg_ind_peh&lang=en


- Look up Crux (featured provider!) for great financial data. Also great energy sector data! 
- Reach out to Crux, what's up with subscription request.

- Fed ownership vs economy? Here's key for  `"awsdx_db"."gov_ownership_stats"`
```
Total consumer credit owned by federal government, not seasonally adjusted level
tccobfg
Nonrevolving consumer credit owned by federal government, not seasonally adjusted level
nrccobfgnsal
Total consumer credit owned by federal government, not seasonally adjusted flow, monthly rate
tccobfgnsafmr
Nonrevolving consumer credit owned by federal government, not seasonally adjusted flow, monthly rate
nrccobfgnsafmr
```
