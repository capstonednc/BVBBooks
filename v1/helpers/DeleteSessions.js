'use strict'

var Schema = require('schema-client');
let client = new Schema.Client("blackvoicesbooks", "C4fUNwHDfbfxKLYn3NMCnhGitkaZuTuQ");


// client.get("/:sessions", {
// }, function(err, data){
//     if(err){
//         console.log(err);
//     } else {
//         Array.from(data).map(function(id){
//             var results = [id.id];
//             console.log(results);
//         })
//     }
// }.then(function(results){
//     var id;
//     var
// }));

function deleteSessionsRecursive() {
  client.delete('/:sessions/:last').
  then(function(result) {
    if (result) {
      // Continue deleting until all are removed
      console.log(result.id);
      console.log('Deleted session ID: '+ result.id);
      deleteSessionsRecursive();
    } else {
      console.log('Completed');
      process.exit();
    }
  });
}

// Start
deleteSessionsRecursive();