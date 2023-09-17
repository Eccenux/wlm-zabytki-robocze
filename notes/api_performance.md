# PoC pobierania danych z API

Dodatkowe, lub większość danych z API.

WLZ: Może by zmienić strategię pobierania danych:
1. Wyciągnąć podstawowe dane ze SPARQL.
2. Wyciągnąć pozostałe dane z API.

Wygląda na to, że współbierzne pobieranie danych encji z API jest dosyć szybkie.
Pobieranie P3424 (nr zab.) z datą jest trudne w SPARQL.

Może nawet wyciąganie z API poszłoby szybciej niż obecny SPARQL? -> testing... -> nope :-/.

## Test przez SPARQL

Done in 66 steps
MonumentsLoader.js:67
Total records: 11747; Qids: 10822.
MonumentsLoader.js:68
Elapsed time for loadMany: 2:24.832 [m:s.ms] (per record: 0:00.012 [m:s.ms]).

Done in 33 steps
MonumentsLoader.js:67
Total records: 5162; Qids: 4876.
MonumentsLoader.js:68
Elapsed time for loadMany: 0:53.070 [m:s.ms] (per record: 0:00.010 [m:s.ms]).

Done in 33 steps
MonumentsLoader.js:67
Total records: 5210; Qids: 4875.
MonumentsLoader.js:68
Elapsed time for loadMany: 0:50.581 [m:s.ms] (per record: 0:00.009 [m:s.ms]).


## Test przez SPARQL+API

Etykiety, w tym województwo ze SPARQL, encja z API.

step = 0.1;
Total records: 3334; Qids: 1.
MonumentsLoader.js:88
Elapsed time for loadMany: 1:04.204 [m:s.ms] (per record: 0:00.019 [m:s.ms]).

step = 0.015; (standard)
+ zapis bez encji
Done in 33 steps
MonumentsLoader.js:87
Total records: 5153; Qids: 4875.
MonumentsLoader.js:88
Elapsed time for loadMany: 2:05.922 [m:s.ms] (per record: 0:00.024 [m:s.ms]).

step = 0.1;
+ zapis bez encji
Done in 4 steps
MonumentsLoader.js:87
Total records: 3334; Qids: 3311.
MonumentsLoader.js:88
Elapsed time for loadMany: 0:55.959 [m:s.ms] (per record: 0:00.016 [m:s.ms]).

Saving 4901 records (20.0000, 20.5000).
MonumentsLoader.js:72
Done in 1 steps
MonumentsLoader.js:87
Total records: 4901; Qids: 4893.
MonumentsLoader.js:88
Elapsed time for loadMany: 1:18.881 [m:s.ms] (per record: 0:00.016 [m:s.ms]).

## Test przez API

SPARQL pobiera tylko Q w danych granicach. API pobiera resztę.

Done in 4 steps
MonumentsLoader.js:87
Total records: 3330; Qids: 3311.
MonumentsLoader.js:88
Elapsed time for loadMany: 0:50.789 [m:s.ms] (per record: 0:00.015 [m:s.ms]).

Tu się mniej więcej zrównałem z gołym SPARQL, ale w danych API nie mam etykiet...
