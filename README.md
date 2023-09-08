Oficjalne:
https://pl.wikipedia.org/wiki/Wikipedysta:NuxBot/WLZ_duplikaty

Top dla chętnych:
https://pl.wikipedia.org/wiki/Wikipedysta:Nux/test_WLZ_duplikaty

Dokładność geowspółrzędnych vs dystans:
https://pl.wikipedia.org/wiki/Wikipedysta:Nux/test_WLZ_dok%C5%82adno%C5%9B%C4%87_geo-wsp%C3%B3%C5%82rz%C4%99dnych

TODO:
- [x] purge main `WLZ duplikaty` after deploying lists
- mark as done
	- skip groups that all have iid and all iid are unique (any empty/null means the group will not be skipped)
	- [xor] skip `part-of` for two-item duplicate
	- [xor] skip `is-different-then` if all in group are different
