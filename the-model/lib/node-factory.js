
var NodeFactory = (function NodeFactory() {
  var self;
  
  //schemaParent is the name of the column in meta.
  //It holds the schema-name for each identity.
  function NodeFactory(identityName, meta, rows, parent, child, schemaParent, schemaChild) {
    this.identityName = identityName;
    this.indexOfIdentity = -1;
    this.indexOfParent = -1;
    this.indexOfChild = -1;
    this.indexOfschemaParent = -1;
    this.indexOfschemaChild = -1;
    this.schemaParent = schemaParent;
    this.schemaChild = schemaChild;
    this.identity = null;
    self = this;
    
    if (!identityName || !meta || !rows)
      throw new Error('identityName, meta and rows expected.');
    if (!Array.isArray(meta) || !Array.isArray(rows))
      throw new Error("meta or rows should be array's.");
    this.graph = this.CreateJasonfiedGexf(meta, rows, parent, child);
  }
  
  /*
     * Caller should have knowledge about metadata , which is the schema/structure of a row
     * Apply identityName to context.
    */
    NodeFactory.prototype.CreateJasonfiedGexf = function (meta, pRows, pParent, pChild) {
    var graph = {
      nodes: [],
      edges: []
    };
    
    var metaData = Array.prototype.slice.call(meta);
    var rows = Array.prototype.slice.call(pRows);
    var identityName = this.identityName;
    var metaDataDetails, parentDetails, childDetails;
    
    var foundId = metaData.some(function (item, ix) {
      metaDataDetails = item;
      self.indexOfIdentity = ix;
      return item.name.toLowerCase() === identityName.toLowerCase();
    });
    if (!foundId)
      throw new Error('identity not found: ' + this.identityName);
    self.identity = metaDataDetails;
    
    metaData.some(function (item, ix) {
      self.indexOfschemaParent = ix;
      return self.schemaParent ? item.name.toLowerCase() === self.schemaParent.toLowerCase() : false;
    });
    metaData.some(function (item, ix) {
      self.indexOfschemaChild = ix;
      return self.schemaChild ? item.name.toLowerCase() === self.schemaChild.toLowerCase() : false;
    });
    
    metaData.some(function (item, ix) {
      parentDetails = item;
      self.indexOfParent = ix;
      return item.name.toLowerCase() === pParent.toLowerCase();
    });
    self.parent = parentDetails;
    
    metaData.some(function (item, ix) {
      childDetails = item;
      self.indexOfChild = ix;
      return item.name.toLowerCase() === pChild.toLowerCase();
    });
    self.child = childDetails;
    var addNode = function (pid, plabel, ix, schema) {
      graph.nodes.push({
        id: schema ? schema + '.' + pid : pid,
        label: plabel,
        x: Math.random(),// Math.cos(Math.PI * 2 * ix / rows.length),
        y: Math.random(),//Math.sin(Math.PI * 2 * ix / rows.length),
        size: 1, //Math.random(),
        color: '#' + (Math.floor(Math.random() * 16777215).toString(16) + '000000'),
        grid_x: ix % 10,
        grid_y: Math.floor(ix / 10),
        grid_size: 1,
        grid_color: '#ccc'
      });
    };
    
    var nodeFound, sourceFound, targetFound;
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var parent = row[self.indexOfParent];
      var child = row[self.indexOfChild];
      nodeFound = null;
      nodeFound = graph.nodes.some(function (item) {
        return item.label.toLowerCase() === row[self.indexOfIdentity].toLowerCase();
      });
      if (!nodeFound) {
        addNode(row[self.indexOfIdentity], row[self.indexOfIdentity], i, row[self.indexOfschemaParent]);
      }      ;
      sourceFound = graph.nodes.some(function (item) {
        return item.label.toLowerCase() === parent.toLowerCase();
      });
      if (!sourceFound) {
        addNode(parent, parent, i, row[self.indexOfschemaParent]);
      }      ;
      targetFound = graph.nodes.some(function (item) {
        return item.label.toLowerCase() === child.toLowerCase();
      });
      if (!targetFound) {
        addNode(child, child, i, row[self.indexOfschemaChild]);
      }      ;
      
      var source = self.indexOfschemaParent > -1 ? row[self.indexOfschemaParent] + '.' + parent : parent;
      var target = self.indexOfschemaChild > -1 ? row[self.indexOfschemaChild] + '.' + child : child;
      graph.edges.push({
        id: 'e' + i,
        target: target,
        source: source,
        size: Math.random(),                
        color: '#ccc',
        hover_color: '#ff87',
        type: 'arrow'
                /*
                 * [  'line','curve','arrow','curvedArrow','dashed','dotted','parallel','tapered'    ]
                 * */
      });
    }
    
    return graph;
  }
  NodeFactory.prototype.get_indexOfIdentity = function () {
    return this.indexOfIdentity;
  }
  return NodeFactory;
})();

module.exports = NodeFactory;