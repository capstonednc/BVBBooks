
var Schema = require('schema-client');
let client = new Schema.Client("blackvoicesbooks", "C4fUNwHDfbfxKLYn3NMCnhGitkaZuTuQ");
client.delete('/:models/com.orders/fields/items', {
        fields: {
            
            // Add 'runway'
            'author': {
                type: 'string',
                formula: 'if(product_id, product.attributes[0].value)' 
            }

        }
    }, (err, res) => {
        console.log('Model updated');
        console.log(res);
    });
    