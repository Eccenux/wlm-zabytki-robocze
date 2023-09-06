-- 4300 dla l6
-- ~550 dla więcej niż 3 obok siebie
/*
select concat(lat_, ':' , lon_, ':20')
	--, count(*) as cntAll
	, max(townLabel) as miasto
	, count(distinct item) as cntQ
	, array_agg(distinct item) as items
from (
	SELECT cast(lat as NUMERIC(11,6)) as lat_, cast(lon as NUMERIC(11,6)) as lon_, item, townLabel
	FROM public.wlz_dupl
) as t
group by lat_, lon_
having count(distinct item) > 2
order by cntQ desc
*/

-- 11,5 -> 4369
-- 11,4 -> 5999
-- 11,3 -> 16657
select concat(lat_, ':' , lon_, ':20')
	--, count(*) as cntAll
	, max(townLabel) as miasto
	, count(distinct item) as cntQ
	, array_agg(distinct item) as items
from (
	SELECT cast(lat as NUMERIC(11,3)) as lat_, cast(lon as NUMERIC(11,3)) as lon_, item, townLabel
	FROM public.wlz_dupl
) as t
group by lat_, lon_
having count(distinct item) > 1
order by cntQ desc