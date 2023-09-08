-- ~550 dla więcej niż 3 obok siebie
/**/
select concat(lat_, ':' , lon_) as latlon
	--, count(*) as cntAll
	, max(townLabel) as town
	, max(stateLabel) as state
	, count(*) as rowCount
	, count(distinct item) as cnt
	, array_to_string(array_agg(item ORDER BY item), '; ') as agg_qid
	, array_to_string(array_agg(inspireIds ORDER BY item), '; ') as agg_inspireid
	, array_to_string(array_agg(typeLabels ORDER BY item), '; ') as agg_type
	, array_to_string(array_agg(monumentStatus ORDER BY item), '; ') as agg_status
from (
	SELECT cast(lat as NUMERIC(11,6)) as lat_, cast(lon as NUMERIC(11,6)) as lon_
	, item
	, townLabel
	, stateLabel
	, inspireIds
	, typeLabels
	, monumentStatus
	FROM public.wlz_dupl
) as t
group by lat_, lon_
-- having count(distinct item) > 2
-- order by cntQ desc

having count(distinct item) > 2 
AND	count(distinct item) <= 6
order by state, town, latlon, cnt desc
;
/**/
