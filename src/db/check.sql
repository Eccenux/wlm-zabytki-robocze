/*
SELECT * FROM public.wlz_dupl
ORDER BY id ASC 
;

SELECT * FROM public.wlz_dupl
where item = 11690917
and "lat" = 52.87475
and "lon" = 14.203194
ORDER BY id ASC;

SELECT count(*), item FROM public.wlz_dupl
group BY item
order by 1 desc
;

SELECT * FROM public.wlz_dupl
where item = 11690917
;
*/

/*
SELECT * FROM public.wlz_dupl
WHERE item in (
SELECT item FROM public.wlz_dupl
group BY item
having count(*) > 1
)
;
*/

WITH item_counts AS (
  SELECT item, COUNT(*) AS item_count
  FROM public.wlz_dupl
  GROUP BY item
  HAVING COUNT(*) > 1
)
SELECT wd.*
FROM public.wlz_dupl wd
INNER JOIN item_counts ic ON wd.item = ic.item
ORDER BY ic.item_count DESC;
;
