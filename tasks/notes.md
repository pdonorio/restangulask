
## working

http://localhost:9000/#/rest?host=http:%2F%2Felastic:9200
- [ ] ONLINE: update bower!!
- [ ] search types
    + show type and word search in list? is it possible?
- [ ] subwords in search
    + could it be changed?
- [ ] add an element to step4 selects: steptemplate field with ',' in rethinkdb

## done

- [x] unfound words
    + elastic test with lowercase token
- [x] submission new iter
    - [x] list unfinished
    - [x] button to go to details/edit if id is available
    - [x] fill step 2 and/or step 3 choosing a select
    + elastic gets updated only if you complete the first 3 steps
        * same id as rethinkdb
    - [x] BUG: step 1 -> type de l'extrait does not work (value=False?)
    - [x] BUG:if you finish 4 steps, it goes back to 1 but missing the data

## ui


https://github.com/lmenezes/cerebro
http://www.elastichq.org/gettingstarted.html
https://github.com/WikiSuite/adminer-elasticsearch
http://mobz.github.io/elasticsearch-head/
https://github.com/dzharii/awesome-elasticsearch