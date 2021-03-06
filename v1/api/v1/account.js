const util = require('../util');
const session = require('./session');

const account = module.exports;

// Init routes
account.init = (env, router, schema) => {
  const requireSession = session.require.bind(this, schema);
  const requireAccount = account.require.bind(this, schema);
  router.get('/account', requireSession, requireAccount, account.get.bind(this, schema));
  router.put('/account', requireSession, requireAccount, account.update.bind(this, schema));
  router.post('/account', requireSession, account.create.bind(this, schema));
  router.post('/account/login', requireSession, account.login.bind(this, schema));
  router.post('/account/logout', requireSession, account.logout.bind(this, schema));
  router.post('/account/recover', requireSession, account.recover.bind(this, schema));
  router.get('/account/orders', requireSession, requireAccount, account.getOrders.bind(this, schema));
  router.get('/account/orders/:id', requireSession, requireAccount, account.getOrderById.bind(this, schema));
};

// Require logged in account
account.require = (schema, req, res, next) => {
  if (!req.session.account_id) {
    return res.status(400).json({
      error: 'Account must be logged in to access this resource'
    });
  }
  next();
};

// Get current account
account.get = (schema, req, res) => {
  return schema.get('/accounts/{id}', {
    id: req.session.account_id
  });
};

// Update current account
account.update = (schema, req, res) => {
  req.body.id = req.session.account_id;
  const error = account.filterData(req);
  if (error) {
    return res.status(400).json(error);
  }
  return schema.put('/accounts/{id}', req.body);
};

// Create new account
account.create = (schema, req, res) => {
  if (req.session.account_id) {
    return res.status(400).send({
      error: 'Account cannot be logged in before #create'
    });
  }
  const error = account.filterData(req);
  if (error) {
    return res.status(400).json(error);
  }
  req.body.group = 'customers'; // Default group
  req.body.type = 'individual'; // Default type
  return schema.post('/accounts', req.body).then(result => {
    if (result.errors) {
      return result;
    }
    return account.loginSession(schema, req, result);
  });
};

// Login account
account.login = (schema, req) => {
  return schema.get('/accounts/:login', req.body).then(result => {
    if (!result) {
      if (req.session.account_id) {
        return account.loginSession(schema, req, null);
      }
      return null;
    }
    return account.loginSession(schema, req, result);
  });
};

// Logout account
account.logout = (schema, req) => {
  return schema.put('/:sessions/{id}', {
    id: req.sessionID,
    account_id: null,
    account_group: null
  }).return({
    success: true
  });
};

// Update session with logged in account
account.loginSession = (schema, req, result) => {
  if (!req.sessionID) {
    return result;
  }
  var accountId = result ? result.id : null;
  var accountGroup = result ? result.group : null;
  return schema.put('/:sessions/{id}', {
    id: req.sessionID,
    account_id: accountId,
    account_group: accountGroup
  }).then(() => {
    if (req.session.cart_id) {
      return schema.put('/carts/{id}', {
        id: req.session.cart_id,
        account_id: accountId
      });
    }
  }).then(() => {
    return result;
  });
};

// Recover account (step 0)
account.recover = (schema, req) => {
  if (req.body.email) {
    return account.recoverEmail(schema, req);
  } else if (req.body.reset_key) {
    return account.recoverPassword(schema, req);
  } else {
    return {
      errors: {
        email: {
          code: 'REQUIRED',
          message: 'Missing `email` or `reset_key` to send account recovery notice'
        }
      }
    };
  }
};

// Recover account email (step 1)
account.recoverEmail = (schema, req) => {
  // Set timeout 1 day in the future by defaultQuery
  let date = new Date();
  date.setDate(date.getDate() + 1);
  const resetExpired = date.getTime();

  // Create a unique reset key
  const resetKey =
      require('crypto')
      .createHash('md5')
      .update(req.body.email + resetExpired)
      .digest('hex');

  // Build the reset url
  let resetUrl;
  if (req.body.reset_url && typeof req.body.reset_url === 'string') {
    resetUrl = req.body.reset_url;
    if (resetUrl.indexOf('{key}') !== -1) {
      resetUrl = resetUrl.replace('{key}', resetKey);
    } else if (resetUrl.indexOf('{reset_key}') !== -1) {
      resetUrl = resetUrl.replace('{reset_key}', resetKey);
    } else {
      if (resetUrl[resetUrl.length - 1] === '/') {
        resetUrl += resetKey;
      } else {
        resetUrl += '/' + resetKey;
      }
    }
  } else {
    return {
      errors: {
        reset_url: {
          code: 'REQUIRED',
          message: 'Missing `reset_url` to send account recovery notice'
        }
      }
    };
  }

  return schema.get('/accounts/{email}', {
    email: req.body.email
  }).then(result => {
    if (!result) {
      return;
    }

    return schema.put('/accounts/{id}', {
      id: result.id,
      $notify: 'password-reset',
      password_reset_url: resetUrl,
      password_reset_key: resetKey,
      password_reset_expired: resetExpired
    });
  }).then(result => {
    if (result && (result.errors || result.error)) {
      return result;
    }
    return {
      success: true
    };
  });
};

// Recover account password (step 2)
account.recoverPassword = (schema, req) => {
  if (!req.body.reset_key) {
    return {
      errors: {
        reset_key: {
          code: 'REQUIRED',
          message: 'Missing `reset_key` to identify account'
        }
      }
    };
  }
  if (!req.body.password) {
    return {
      errors: {
        password: {
          code: 'REQUIRED',
          message: 'Missing `password` to reset account access'
        }
      }
    };
  }

  return schema.get('/accounts/:first', {
    password_reset_key: req.body.reset_key
  }).then(result => {
    if (!result) {
      return {
        errors: {
          reset_key: {
            code: 'INVALID',
            message: 'Invalid `reset_key`, account not found'
          }
        }
      };
    }

    // Verify key is used before timeout
    resetExpired = result.password_reset_expired;
    if (!resetExpired || resetExpired <= Date.now()) {
      return {
        errors: {
          reset_key: {
            code: 'INVALID',
            message: 'Expired `reset_key`, please retry account recovery'
          }
        }
      };
    }

    return schema.put('/accounts/{id}', {
      id: result.id,
      password: req.body.password,
      password_reset_url: null,
      password_reset_key: null,
      password_reset_expired: null
    });
  }).then(result =>  {
    if (result && (result.errors || result.error)) {
      return result;
    }
    if (req.body.login) {
      return account.loginSession(schema, req, result);
    }
    return {
      success: true
    };
  });
};

// Filter account data
account.filterData = (req) => {
  try {
    req.body = util.filterData(req.body, [
      'id',
      'shipping',
      'billing',
      'name',
      'first_name',
      'last_name',
      'email',
      'password'
      // TODO: more fields
    ]);
  } catch (err) {
    return { error: err.toString() };
  }
};

// Get account orders list
account.getOrders = (schema, req) => {
  const query = req.query || {};
  return schema.get('/orders', {
    account_id: req.session.account_id,
    fields: query.fields,
    limit: query.limit,
  });
};

// Get account orders list
account.getOrderById = (schema, req) => {
  const query = req.query || {};
  return schema.get('/orders/{id}', {
    account_id: req.session.account_id,
    id: req.params.id,
    fields: query.fields,
  });
};
