'use strict';

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
    self.graph = {
      nodes: [],
      edges: []
    };
    self.graph = self.CreateJasonfiedGexf(meta, rows, parent, child);
    
    self.graph.nodes.forEach(function (node) {
      self.EvalNodes(self.EvalFn, node);
    });
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
        x: Math.random(), // Math.cos(Math.PI * 2 * ix / rows.length),
        y: Math.random(), //Math.sin(Math.PI * 2 * ix / rows.length),
        size: 100, //Math.random(),
        color: '#' + (Math.floor(Math.random() * 16777215).toString(16) + '000000'),
        //grid_x: ix % 10,
        //grid_y: Math.floor(ix / 10),
        grid_size: 1,
        grid_color: '#ccc',
        weight: 0,
        order: 0,
        traversed: false,
        childCount: 0
      });
    };
    
    var nodeFound, sourceFound, targetFound;
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var parent = row[self.indexOfParent];
      var schemaParent = row[self.indexOfschemaParent];
      var schemaChild = row[self.indexOfschemaChild];
      var child = row[self.indexOfChild];
      
      nodeFound = graph.nodes.some(function (item) {
        return item.label.toLowerCase() === row[self.indexOfIdentity].toLowerCase();
      });
      if (!nodeFound) {
        addNode(row[self.indexOfIdentity], row[self.indexOfIdentity], i, schemaParent);
      }      ;
      sourceFound = graph.nodes.some(function (item) {
        return item.label.toLowerCase() === parent.toLowerCase();
      });
      if (!sourceFound) {
        addNode(parent, parent, i, schemaParent);
      }      ;
      targetFound = graph.nodes.some(function (item) {
        return item.label.toLowerCase() === child.toLowerCase();
      });
      if (!targetFound) {
        addNode(child, child, i, schemaChild);
      }      ;
      
      var source = self.indexOfschemaParent > -1 ? schemaParent + '.' + parent : parent;
      var target = self.indexOfschemaChild > -1 ? schemaChild + '.' + child : child;
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
  NodeFactory.prototype.EvalFn = function (node, index, array) {
    
    var parent = this;
    
    node.weight = node.id === parent.id ?  parent.weight + Math.random() : parent.weight + 1 + Math.random();
    node.order = node.id === parent.id ? parent.order + Math.random() : index + 1 + parent.weight + Math.random() * 0.0001;
    
    node.x = node.order;
    node.y = node.weight;
    
    console.log('EvalFn:', node);
  }
  
  NodeFactory.prototype.get_children = function (node) {
    var parent = this;
    
    return self.graph.edges.some(function (edge) {
      return edge.source === parent.id && edge.target === node.id && !node.traversed;
    });
  }
  
  NodeFactory.prototype.EvalNodes = function (evalFn, node) {
    //console.log('EvalNodes:', node);
    node.traversed = true;
    var children = self.graph.nodes.filter(self.get_children, node);
    node.childCount = children.length;
    
    evalFn.call(node, node);
    if (children && children.length > 0) {
      //eval node for weight, order, label.
      children.forEach(evalFn, node);
      
      //pre-order traversal
      children.forEach(function (child) {
        self.EvalNodes(self.EvalFn, child);
      });
    }
    else
      return null;
  }
  return NodeFactory;
})();

module.exports = NodeFactory;