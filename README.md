# WLZ skrypty robocze

Oficjalne:
https://pl.wikipedia.org/wiki/Wikipedysta:NuxBot/WLZ_duplikaty

Top dla chętnych:
https://pl.wikipedia.org/wiki/Wikipedysta:Nux/test_WLZ_duplikaty

Dokładność geowspółrzędnych vs dystans:
https://pl.wikipedia.org/wiki/Wikipedysta:Nux/test_WLZ_dok%C5%82adno%C5%9B%C4%87_geo-wsp%C3%B3%C5%82rz%C4%99dnych

## TODO
- [x] purge main `WLZ duplikaty` after deploying lists
- mark as done
	- [x] skip groups that all have iid and all iid are unique (any empty/null means the group will not be skipped)
		- [x] basic test and function `showRow()`
		- [x] also check for rare cases were Q is repeated
		- [x] check if row should be shown, but only for `states()`; not for `top()` -- in top we check for invalid location
	- [or?] for two-item duplicate skip part-parent
		- P527 (składa się z; has part).
		- E.g.: https://www.wikidata.org/wiki/Q30583403 (zespół) składa się z Q30583404 (dom).
		- [x] Download P527 and save as hasPart.
		- [] For two-element group check if hasPart is non-empty and contains the other item.
	- [or?] skip `is-different-then` (P1889) if all in group are different
		E.g.:
		https://www.wikidata.org/wiki/Q30049639
		https://www.wikidata.org/wiki/Q30049640
		https://www.wikidata.org/wiki/Q30049641
		2nd group:
		Q30049642
		Q30049645
		Q30049646 
- dump groups with unique inspire id?
- gadet for mark as done? or just use `qsOtherThen.js`?
- gadet for replacing locations? (based on `wdApi.notes.js`)
- BTW. jenkins-data repo (local)

## Zawartość repo

Główne skrypty:
- `download_pl.js` -- skrypt do pobrania danych z WD (do plików json).
- `dbInsert.js` -- skrypt do wstania jsonów do bazy danych (Postgres). Skrypt wstawia dane do tabeli `wlz_dupl`, ale są tam wszystkie rekordy, a nie same duplikaty.
- `dbExportMw.js` -- skrypt do eksportu danych z bazy do tabel (do plików wiki).
	Dopiero tutaj, przy pobieraniu danych, zostaną pobrane tylko duplikaty.  
	Duplikaty są wyznaczane na podstawie danych zgrupowanych według obciętych współrzędnych (lat, lon) — czyli współrzędnych o zmniejszonej dokładności.  
	Testowe zapytania do sprawdzania liczby duplikatów w zależności od wybranej dokładności (liczby miejsc po przecinku): `src\db\count.dupl.sql`
- `wikiploy.mjs` -- skrypt do wrzucania plików wiki do Wikipedii (aktualizacja podstron).

Skrypty pomocnicze:
- `geodistance.js` -- spr. przełożenia dokładności współrzędnych (liczby miejsc po przecinku) na fizyczną dokładność lokalizacji (w metrach, a nawet nanometrach). Specyficzne dla Polski.
- `OSM-geocoding.js` -- skrypt pomocniczy do ustalania współrzędnych grupy adresów.
- `qsOtherThen.js` -- genertator quick statements do wstawiania P1889 („inne niż”).
