-- 4300 dla l6
-- ~550 dla więcej niż 3 obok siebie
/**/
select concat(lat_, ':' , lon_, ':20')
	--, count(*) as cntAll
	, max(townLabel) as miasto
	, max(stateLabel) as woj
	, count(distinct item) as cntQ
	, array_to_string(array_agg(item ORDER BY item), '; ') as Qid
	, array_to_string(array_agg(inspireIds ORDER BY item), '; ') as inspireId
	, array_to_string(array_agg(typeLabels ORDER BY item), '; ') as typy
	, array_to_string(array_agg(monumentStatus ORDER BY item), '; ') as statusy
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
having count(distinct item) > 2
order by cntQ desc
;
/**/
