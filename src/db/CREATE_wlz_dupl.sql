DROP TABLE IF EXISTS public.wlz_dupl;

CREATE TABLE public.wlz_dupl
(
    id SERIAL PRIMARY KEY,
    lat NUMERIC(11, 8),
    lon NUMERIC(11, 8),
    itemLabel TEXT,
    townLabel TEXT,
    item TEXT,
    town TEXT
);

ALTER TABLE IF EXISTS public.wlz_dupl
    OWNER to wlz;