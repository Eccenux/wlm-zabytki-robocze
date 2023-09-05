SELECT * FROM public.wlz_dupl
ORDER BY id ASC 
;

SELECT * FROM public.wlz_dupl
where item = 'Q11690917'
and "lat" = 52.87475
and "lon" = 14.203194
ORDER BY id ASC;

SELECT count(*), item FROM public.wlz_dupl
group BY item
order by 1 desc
;

SELECT * FROM public.wlz_dupl
where item = 'Q11690917'
;

SELECT * FROM public.wlz_dupl
WHERE item in (
SELECT item FROM public.wlz_dupl
group BY item
having count(*) > 3
)

;


/*
SELECT *
, lon
, cast(14.203194444 as NUMERIC(11, 8))
, "lon"*10e8
, floor("lon"*10e8)
, cast(14.203196666 as NUMERIC(11, 8))
, floor(14.203196666*10e8)
FROM public.wlz_dupl
where item = 'Q11690917'
and "lat" = cast(52.87475 as NUMERIC(11, 8))
and "lon" = cast(14.203194444 as NUMERIC(11, 8))
ORDER BY id ASC;
*/