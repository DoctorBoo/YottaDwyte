var theModel = require('the-model');
var nodefactory = theModel.nodefactory;
var express = require('express');
var sql = require('node-sqlserver-unofficial');
var connStr = "Driver={SQL Server Native Client 11.0};" +
        //For Azure:
        "Server=tcp:jf0s2hahaz.database.windows.net,1433;Database=Adventureworks2012;UID=@jf0s2hahaz;PWD={};Encrypt={yes};Connection Timeout=30;";
        //"Server={DEV-DT2-VDB01};UID={OMNIT\dwight};Database={DT2dot0_DEV};Trusted_Connection={Yes}";
        //On premise: "Server={...};UID={...};Database={...};Trusted_Connection={Yes}";
var router = express.Router();

var MongoClient = require('mongodb').MongoClient
var format = require('util').format;

router.CreateGraph = function(request, meta, rows) {
  var query = request.query;
  query.parent = query.parent ? JSON.parse(query.parent) : { schema: 'Schema_FK_table', object: 'FK_table' };
  query.child = query.child ? JSON.parse(query.child) : { schema: 'Schema_PK_table', object: 'PK_table' };
  
  var factory = new nodefactory('FK_table', meta, rows, query.parent.object, query.child.object, query.parent.schema, query.child.schema);
  return factory;
};

var importData = function (request, response) {
  var req = request;
  var params = request.url;
  var table = params.split('/').length > 1 ? params.split('/')[2] : null;
  sql.open(connStr, function (error, conn) {
    if (!error) {
      
      if (table) {
        var qryString = "SELECT *  FROM " + table;
        
        conn.queryRaw(qryString , function (err, results) {
          if (err) {
            handleError('Syntax/Query problems', err);
          }
          
          try {
            var pagesize = results.rows.length;
            console.log(results.meta);
            
            this.gRenderer.MongoClient.connect('mongodb://mongo:mongo@ds045097.mongolab.com:45097/YottaDwyteLab', function (err, db) {
              if (err) throw err;
              
              var collection = db.collection(table);
              
              results.rows.forEach(function (row) {
                results.meta.forEach(function (column, i) {
                  var value = row[i];
                  var tuple = {};
                  tuple[column.name] = value;
                  collection.insert(tuple, function (err, docs) {});
                });
              });

              db.close();
            })
          } catch (e) {
            handleError('Syntax/Query problems', e);
          }
        });
      } else {
        handleError('Syntax error', new Error('tablename expected'));
      }
    } else {
      handleError('Connection problems', error);
    }
  });
  
  response.end();
}
var graphJson = function (request, response, meta, rows) {
  var factory = router.CreateGraph(request, meta, rows);
  response.writeHead(200, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(factory.graph)); //JSON.stringify({ "query-result": results })
}
var graphRenderer = function (request, response, meta, rows) {  
  var table = { meta: meta, rows: rows };
  var query = request.query;

  if (query.show === '') {
    var factory = router.CreateGraph(request, meta, rows);
    response.render('directed', {
      title: 'Graph',
      h1: 'Graph',
      graph: factory.graph
    });
    response.end();
  } else {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ "query-result": table })); //JSON.stringify({ "query-result": results })
  }
}

var tableRenderer = function (request, response, meta, rows, name) {
  var query = request.query;
  var table = { meta: meta, rows: rows };
  
  if (query.tablify === '') {
    //response.status(200).json({ "query-result": results });
    response.render('query', {
      title: 'Query Result',
      h1: name,
      meta: table.meta,
      values: table.rows
    });
    //response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end();
  } else {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ "query-result": table })); //JSON.stringify({ "query-result": results })
  }
}

routes = ['/query' , '/graph', '/graph/json', '/'];
routesPost = ['/importdata/*', '/importdata']
renderer = (function () {
function renderer() {
this['/query'] = tableRenderer;
this['/graph'] = graphRenderer;
this['/graph/json'] = graphJson;
this['/'] = graphRenderer;
this['/importdata/*'] = importData;
    this['/importdata'] = importData;
    this.MongoClient = MongoClient;
    this.MongoTest = function () {
      this.MongoClient.connect('mongodb://mongo:mongo@ds045097.mongolab.com:45097/YottaDwyteLab', function (err, db) {
        if (err) throw err;
      
        var collection = db.collection('test_insert2');
        collection.insert({ a: 2 }, function (err, docs) {
        
          collection.count(function (err, count) {
            console.log(format("count = %s", count));
          });
        
          // Locate all the entries using find 
          collection.find().toArray(function (err, results) {
            console.dir(results);
            // Let's close the db 
            db.close();
          });
        });
      })
    }
  }

  return renderer;
})();
gRenderer = new renderer();

var requestPostHandler = function (request, response) {
  this.gRenderer[request.route.path](request, response);
}
var requestGetHandler = function (request, response) {
  var query = request.query;
  
  var table = query && query.table && query.table.isArray && query.table.isArray() ? 
                query.table.length > 0 ? query.table[1] : 
                query.table : query && query.table;
  
  sql.open(connStr, function (error, conn) {
    if (!error) {
      
      var dependencies = query.dependencies === '';
      if (table || dependencies) {
        var qryString = "SELECT *  FROM " + table;
        qryString = dependencies ? getDependencies() : qryString;
        console.log(qryString);
        
        conn.queryRaw(qryString , function (err, results) {
          if (err) {
            handleError('Syntax/Query problems', err);
          }
          
          try {
            var pagesize = query.pagesize || 100;//results.rows.length;
            results.rows.splice(Number(pagesize), results.rows.length - Number(pagesize));
            console.log(results.meta);
            
            this.gRenderer[request.route.path](request, response, results.meta, results.rows, table);

          } catch (e) {
            handleError('Syntax/Query problems', e);
          }
        });
      } else {
        handleError('Syntax error', new Error('tablename expected'));
      }
    } else {
      handleError('Connection problems', error);
    }
  });
  
  function handleError(title, error) {
    response.status(500);
    response.render('error', {
      message: title,
      error: error
    });
  }
}

routes.forEach(function (route) {
  router.get(route, requestGetHandler);
});
routesPost.forEach(function (route) {
  router.post(route, requestPostHandler);
});

function getDependencies() {
  var qryStr =
 'SELECT ' +
                'sch.table_schema as Schema_FK_table,' +
                'o1.name AS FK_table, ' +
                'c1.name AS FK_column,' +
                'fk.name AS FK_name,' +
                'sch2.table_schema as Schema_PK_table,' +
                'o2.name AS PK_table,' +
                'c2.name AS PK_column,' +
                'pk.name AS PK_name,' +
                'fk.delete_referential_action_desc AS Delete_Action,' +
                'fk.update_referential_action_desc AS Update_Action ' +
                'FROM sys.objects o1 INNER JOIN sys.foreign_keys fk ON o1.object_id = fk.parent_object_id ' +   
                'INNER JOIN INFORMATION_SCHEMA.TABLES sch ON o1.name = sch.table_name ' +             
                'INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id ' +
                'INNER JOIN sys.columns c1 ON fkc.parent_object_id = c1.object_id AND fkc.parent_column_id = c1.column_id ' +
                'INNER JOIN sys.columns c2 ON fkc.referenced_object_id = c2.object_id AND fkc.referenced_column_id = c2.column_id ' +
                'INNER JOIN sys.objects o2 ON fk.referenced_object_id = o2.object_id ' +
                'INNER JOIN INFORMATION_SCHEMA.TABLES sch2 ON o2.name = sch2.table_name ' +
                'INNER JOIN sys.key_constraints pk ON fk.referenced_object_id = pk.parent_object_id AND fk.key_index_id = pk.unique_index_id ' +
                ' ORDER BY o1.name, o2.name, fkc.constraint_column_id';
  return qryStr;
}
module.exports = router;
