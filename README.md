# YottaDwyte
This project uses graphs & tableviews to present relations between objects. Data visualizations can be realized with the help of sigmajs, nodejs, Azure, Express, Jade. These visualizations are the result of a study that can explain classification, clustering and prediction without sharing the actual data features and relations. 
>Azure fulfills the role as a mocking environment for integration-testing purposes. Rerouting the calculations through a restfull service leverages the loosely coupled design. Jade is just awesome to me. But I will stick with CSS for now. Sigmajs provides the best features when you need open source, performance, backup from its community or [advanced study visualizations](https://gephi.github.io/).

### Requirements
1. [Microsoft Azure ](http://www.microsoft.com/bizspark/azure/getstarted.aspx)
2. [AdventureWorks2012 on-premises](http://msftdbprodsamples.codeplex.com/releases/view/93587) / [AdventureWorks2012 for Azure](http://msftdbprodsamples.codeplex.com/releases/view/37304) 
3. [Nodesjs](http://nodejs.org/)
4. [Express](http://expressjs.com/)
5. [Sigmajs](https://github.com/jacomyal/sigma.js/wiki)
6. Change connectionstring in [repository.js](https://github.com/DoctorBoo/Calc/blob/master/routes/repository.js) with yours.

##Examples
1. [A directed graph with 10 nodes](http://haxe.azurewebsites.net/graph?dependencies&show&pagesize=10)
	> Click a node to invoke a menu.  
    Change the query-string's pagesize value to increase the amount of nodes.
2. [Dependencies of AdventureWorks 2012](http://haxe.azurewebsites.net/graph/query?dependencies&pagesize=100&tablify)  
3. [Jsonfied database object: Production.Product](http://haxe.azurewebsites.net/graph/query?table=production.product&pagesize=10)
4. [Tablified json database object: Production.Product](http://haxe.azurewebsites.net/graph/query?table=production.product&pagesize=10&tablify)
5. [Changing the parent-child mapping with JSON](http://haxe.azurewebsites.net/graph?dependencies&pagesize=10&parent={%22schema%22:%22Schema_FK_table%22,%20%22object%22:%20%22FK_column%22}&child={%22schema%22:%22Schema_PK_table%22,%20%22object%22:%20%22PK_column%22}&show)
	> If no parent and child relation is given defaults may be applied :
    [parent={"schema":"Schema_FK_table", "object": "FK_table"}&child={"schema":"Schema_PK_table", "object": "PK_table"}](http://haxe.azurewebsites.net/graph?dependencies&pagesize=10&parent={%22schema%22:%22Schema_FK_table%22,%20%22object%22:%20%22FK_table%22}&child={%22schema%22:%22Schema_PK_table%22,%20%22object%22:%20%22PK_table%22}&show)









