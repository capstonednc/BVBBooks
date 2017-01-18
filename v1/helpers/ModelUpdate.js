
var Schema = require('schema-client');
let client = new Schema.Client("blackvoicesbooks", "C4fUNwHDfbfxKLYn3NMCnhGitkaZuTuQ");
client.put('/:models/com.carts/fields/items', {
        fields: {
            
            // Add 'runway'
            'image':{
                type: 'string',
                formula: 'if(product_id, product.images.file.url)' 
            }, 
            'name': {
                type: 'string',
                formula: 'if(product_id, product.name)' 
            }

        }
    }, (err, res) => {
        console.log('Model updated');
        console.log(res);
    });
    