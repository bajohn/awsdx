

# RIP

Didn't end up submitting, life got in the way!


# AWS Data Exchange Hackathon 
Repo for hackathon described here:
https://awsdataexchange.devpost.com/

Deadline: 5:00pm EDT Aug 24, 2020

## Deployment 
`./scripts/deploy.sh --libs=true`
- `--libs [true|false]` Bundle and deploy python packages managed by pipenv.

## Ideas
Free data only, preferably with at least 1 year 
- Amazing CBP data. Infographic for countries->US shipping through 2020.

- See about predictive modeling between Fed data and Equity EOD data.
- Debit, Credit data: Experian, Facteus

Euro energy data background:
- Translate types: https://dd.eionet.europa.eu/vocabulary/eurostat/siec/view
- Crappy existing data explorer https://appsso.eurostat.ec.europa.eu/nui/show.do?dataset=nrg_ind_peh&lang=en

## TODO
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


## Dead Ideas
- Correlate shipping data with something
- [Shipping Data](https://aws.amazon.com/marketplace/pp/prodview-2yx6pwjzh23bo?qid=1595467629281&sr=0-10&ref_=srh_res_product_title)
- Turns out this data is low frequency so not very interesting less interesting

