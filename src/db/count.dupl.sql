-- województwa
SELECT 
COALESCE(lower(stateLabel), '_brak'), count(*)
FROM public.wlz_dupl
group by COALESCE(lower(stateLabel), '_brak')
-- stare województwa...
HAVING count(*) > 300
order by 1
;
/**
	Liczba duplikatów zależnie od stopnia zaokrąglenia współrzędnych.

	accuracy = liczba miejsc po przecinku

	Results:
	6	4287
	5	4365
	4	6004
	3	16736
*/
select '3' as accuracy, count(*)
from (
	select 1 from (
		SELECT cast(lat as NUMERIC(11,3)) as lat_, cast(lon as NUMERIC(11,3)) as lon_, item, townLabel
		FROM public.wlz_dupl
	) as t
	group by lat_, lon_
	having count(distinct item) > 1
) as c
UNION
select '4' as accuracy, count(*)
from (
	select 1 from (
		SELECT cast(lat as NUMERIC(11,4)) as lat_, cast(lon as NUMERIC(11,4)) as lon_, item, townLabel
		FROM public.wlz_dupl
	) as t
	group by lat_, lon_
	having count(distinct item) > 1
) as c
UNION
select '5' as accuracy, count(*)
from (
	select 1 from (
		SELECT cast(lat as NUMERIC(11,5)) as lat_, cast(lon as NUMERIC(11,5)) as lon_, item, townLabel
		FROM public.wlz_dupl
	) as t
	group by lat_, lon_
	having count(distinct item) > 1
) as c
UNION
select '6' as accuracy, count(*)
from (
	select 1 from (
		SELECT cast(lat as NUMERIC(11,6)) as lat_, cast(lon as NUMERIC(11,6)) as lon_, item, townLabel
		FROM public.wlz_dupl
	) as t
	group by lat_, lon_
	having count(distinct item) > 1
) as c
order by 1 desc
;

/**
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
having count(distinct item) > 1
order by cntQ desc
;
**/