'use strict'

var Schema = require('schema-client');
let client = new Schema.Client("blackvoicesbooks", "C4fUNwHDfbfxKLYn3NMCnhGitkaZuTuQ");

// client.delete('/:models/carts/fields/items', {$unset: 'image'}, function(err, result){
//   if(err){
//     console.log(err);
//   } else {
//     console.log(result);
//   }
// });

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

function deleteCartsRecursive() {
  client.delete('/carts/:last').
  then(function(result) {
    if (result) {
      // Continue deleting until all are removed
      console.log(result.id);
      console.log('Deleted cart ID: '+ result.id);
      deleteCartsRecursive();
    } else {
      console.log('Completed');
      process.exit();
    }
  });
}

// Start
deleteCartsRecursive();