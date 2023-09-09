--ALTER TABLE IF EXISTS public.wlz_dupl RENAME TO wlz_dupl_prev;
DROP TABLE IF EXISTS public.wlz_dupl;

CREATE TABLE public.wlz_dupl
(
    id SERIAL PRIMARY KEY,
    item bigint,
    lat NUMERIC(11, 8),
    lon NUMERIC(11, 8),
    itemLabel TEXT,
    typeLabels TEXT,
    townLabel TEXT,
    stateLabel TEXT,
    monumentStatus TEXT,
    otherThen TEXT,
    inspireIds TEXT
);

ALTER TABLE IF EXISTS public.wlz_dupl
    OWNER to wlz;
	
CREATE UNIQUE INDEX wlz_dupl_llq ON wlz_dupl (item, lat, lon);