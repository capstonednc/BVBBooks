var http            = require('http'),
    https           = require('https'),
    fs              = require('fs'),
    nodemailer      = require("nodemailer"),
    request         = require("superagent"),
    flash           = require("connect-flash"),
    bodyParser      = require("body-parser"),
    session         = require("express-session"),
    cookieParser    = require("cookie-parser"),
    methodOverride  = require("method-override"),
    Schema          = require("schema-client"),
    express         = require("express"),
    nodeuuid        = require("uuid"),
    cors            = require("cors"),
    app             = express();
    




app.use(session({
    secret: "Afrika19762016",
    resave: false,
    saveUninitialized: false, 
    cookie: {
        maxAge: 30*60*1000,
        secure: false
    }
}));

app.use(bodyParser.urlencoded({extended:true}))
   .use(cookieParser())
   .set("view engine", "ejs")
   .use(express.static(__dirname + "/public"))
   .use(methodOverride("_method"))
   .use(flash())
app.locals.moment = require("moment");

var client = new Schema.Client("blackvoicesbooks", "C4fUNwHDfbfxKLYn3NMCnhGitkaZuTuQ");

var SchemaAPI = "https://blackvoicesbooks:C4fUNwHDfbfxKLYn3NMCnhGitkaZuTuQ@api.schema.io";


app.use(function(req, res, next){
    res.locals.success = req.flash("success");
    res.locals.errors = req.flash("error");
    res.locals.session = req.session;
    res.locals.account = req.session.account;
    res.locals.cart = req.session.cart;
    next();
});




function restrict(req, res, next) {
    if(req.session.account && req.session.account.id){
        next();
    } else {
        req.flash("error", "You must be logged in to access this page");
        req.session.redirectTo = req.path;
        res.redirect("/login");
    }
};


//BASIC ROUTES
app.get("/", function(req, res){
    res.render("landing");
});

app.get("/index", function(req, res) {
    res.render('index');   
});

app.get("/about", function(req, res) {
    res.render("about");
});

app.get("/blog", function(req, res) {
    res.render("blog");
});

//CONTACT ROUTES
app.get("/contact", function(req, res) {
    res.render("contact");
});

app.post("/contact", function(req, res){
    var mailOpts, smtpTrans;
    smtpTrans = nodemailer.createTransport("SMTP", {
        service: "Gmail",
        auth:{
            user: "obuinc@gmail.com",
            pass: "uhurusasa76"
        }
    }); 
    mailOpts = {
        from: req.body.name + '&lt;' + req.body.email + '&gt;',
        to: 'obuinc@gmail.com',
        subject: 'BVB Contact Form',
        text: req.body.name + " from " + req.body.email + " says " + req.body.comments
    };
    smtpTrans.sendMail (mailOpts, function(err, response){
        if(err){
            console.log(err);
            res.redirect("/contact");
        } else {
            console.log("successfully sent email");
            req.flash("success", "successfully sent email");
            console.log(req.body.name, req.body.email, req.body.comments);
            res.redirect("/index");
        }
    });
});

//SHOP ROUTES
app.get("/account", restrict, function(req, res){
    res.render("accountsettings", {
        account: req.session.account,
        session: req.session
    });
});

app.get("/account/billing", restrict, function(req, res){
    request
        .get('http://localhost:3001/v1/account')
        .set('X-Session', req.cookies.xSession)
        .set('Accept', 'application/json')
        .end(function (error, account){
            if (account) {
                account = account.body;
                req.session.account = account;
                console.log(account);
                res.render("accountbilling", {
                    account: account
                });
            } else {
                console.log(error);
                res.redirect('index');    
            }
        });
});

app.put("/account/billing", function(req, res) {
    request
        .put('http://localhost:3001/v1/account')
        .set('X-Session', req.cookies.xSession)
        .set('Accept', 'application/json')
        .send({
            billing: {
                method: req.body.method,
                name: req.body.name,
                phone: req.body.phone,
                address1: req.body.address1,
                city: req.body.city,
                state: req.body.state,
                zip: req.body.zip,
                country: req.body.country,
                card: {
                    token: req.body.token,
                    last4: req.body.last4,
                    expiry: req.body.expiry,
                    brand: req.body.brand
                    }  
                }   
            })
        .end(function (error, account){
            if(account && !error){
                account = account.body;
                console.log("Form submitted");
                req.flash("success", "Your billing info was successfully added.");
                console.log(req.body);
                res.redirect(303, '/account/billing');
                console.log("Successful submission");
            } else {
                console.log(error);
                req.flash("error", "We weren't able to add your selections. Please try again later");
                res.redirect('/account/billing');
            }
        });
});

app.get("/account/shipping", restrict, function(req, res){
    request
        .get('http://localhost:3001/v1/account')
        .set('X-Session', req.cookies.xSession)
        .set('Accept', 'application/json')
        .end(function (error, account){
            if (account) {
                account = account.body;
                req.session.account = account;
                res.render("accountshipping", {
                    account: account
                });
            } else {
                console.log(error);
                res.redirect('index');    
            }
        });
});

app.put("/account/shipping", function(req, res) {
    request
        .put('http://localhost:3001/v1/account')
        .set('X-Session', req.cookies.xSession)
        .set('Accept', 'application/json')
        .send({
            shipping: {
                name: req.body.name,
                phone: req.body.phone,
                address1: req.body.address1,
                city: req.body.city,
                state: req.body.state,
                zip: req.body.zip,
                country: req.body.country 
                }   
            })
        .end(function (error, account){
            if(account && !error){
                account = account.body;
                console.log("Form submitted");
                req.flash("success", "Your shipping info was successfully added.");
                console.log(req.body);
                res.redirect(303, '/account/shipping');
                console.log("Successful submission");
            } else {
                console.log(error);
                req.flash("error", "We weren't able to add your selections. Please try again later");
                res.redirect('/account/shipping');
            }
        });
});
app.get("/account/orders", restrict, function(req, res){
    request
        .get('http://localhost:3001/v1/account/orders')
        .set('X-Session', req.cookies.xSession)
        .set('Accept', 'application/json')
        .end(function (error, orders){
            if (orders) {
                orders = orders.body;
                console.log(orders);
                account = req.session.account;
                res.render("accountorders", {
                    orders: orders
                });
            } else {
                console.log(error);
                res.redirect('index');    
            }
        });
});

app.get("/shop", function(req, res) {
    request 
        .get("http://localhost:3001/v1/products")
        .set('Accept', 'application/json')
        .end(function(err, product){
            if(!err && product) {
                res.render("shop", {
                    product: product.body
                });
            } else {
                console.log(err);
                res.redirect('index')
            }
        })
});

app.get("/shop/:id", function(req, res) {
    var id = req.params.id;
    var url = "http://localhost:3001/v1/products/" + id;
    request
        .get(url)
        .set('Accept', 'application/json')
        .end(function(err, product){
            if(err){
                console.log(err);
                res.redirect('shop');
            } else {
                res.render('show', {
                    product: product.body
                });
            }
        });
});


//ACCESS/VIEW CART
app.get("/cart", restrict, function(req, res) {
    request
        .get('http://localhost:3001/v1/cart')
        .set('X-Session', req.cookies.xSession)
        .set('Accept', 'application/json')
        .end(function (error, cart){
            if(!cart || cart.body == null ){
                req.flash('error', 'There are no items in your cart');
                res.redirect('index');
            } else if (cart) {
                cart = cart.body
                req.session.cart = cart;
                console.log(typeof req.session.cart);
                console.log(typeof cart);
                account = req.session.account;
                console.log(cart);
                res.render("cart", {
                    cart: cart
                });
            } else {
                console.log(error);
                res.redirect('index');    
            }
        });
});

//REMOVE ITEMS FROM CART
app.post("/cart/remove", restrict, function(req, res) {
    request
        .post('http://localhost:3001/v1/cart/remove-item')
        .set('X-Session', req.cookies.xSession)
        .set('Accept', 'application/json')
        .send({
                item_id: req.body.itemid,
                quantity: req.body.quantity   
            })
        .end(function (error, cart){
            if(cart && !error){
                req.flash("success", "Your selections were successfully removed from cart");
                req.session.cart = cart.body;
                res.redirect("/cart");
            } else {
                console.log(error);
                req.flash("error", "We weren't able to remove your selections. Please try again later");
                res.redirect('cart');
            }
        });
});

//ADD ITEMS TO CART
app.post("/cart", restrict, function(req, res) {
    request
        .post('http://localhost:3001/v1/cart/add-item')
        .set('X-Session', req.cookies.xSession)
        .set('Accept', 'application/json')
        .send({
                product_id: req.body.productId,
                quantity: req.body.quantity   
            })
        .end(function (error, cart){
            if(cart && !error){
                req.flash("success", "Your selections were successfully added to cart");
                req.session.cart = cart.body;
                res.redirect("back");
            } else {
                console.log(error);
                req.flash("error", "We weren't able to add your selections. Please try again later");
                res.redirect('back');
            }
        });
});

app.get("/cart/billing", restrict, function(req, res){
     request
        .get('http://localhost:3001/v1/cart')
        .set('X-Session', req.cookies.xSession)
        .set('Accept', 'application/json')
        .end(function (error, cart){
            if (cart) {
                cart = cart.body;
                req.session.cart = cart;
                account = req.session.account;
                console.log(cart);
                res.render("billing", {
                    cart: cart,
                    account: req.session.account
                });
            } else {
                console.log(error);
                req.flash("error", "We weren't able to add your selections. Please try again later");
                res.redirect('back');
            }
    })
});
app.get("/cart/shipping", restrict, function(req, res){
     request
        .get('http://localhost:3001/v1/cart')
        .set('X-Session', req.cookies.xSession)
        .set('Accept', 'application/json')
        .end(function (error, cart){
            if (cart) {
                cart = cart.body;
                req.session.cart = cart;
                account = req.session.account;
                console.log(cart);
                res.render("shipping", {
                    cart: cart,
                    account: req.session.account
                });
            } else {
                console.log(error);
                req.flash("error", "We weren't able to add your selections. Please try again later");
                res.redirect('back');
            }
    })
});

app.put("/cart/shipping", function(req, res) {
    request
        .put('http://localhost:3001/v1/cart')
        .set('X-Session', req.cookies.xSession)
        .set('Accept', 'application/json')
        .send({
            shipping: {
                name: req.body.name,
                phone: req.body.phone,
                address1: req.body.address1,
                city: req.body.city,
                state: req.body.state,
                zip: req.body.zip,
                country: req.body.country
                }   
            })
        .end(function (error, cart){
            if(cart && !error){
                cart = cart.body;
                console.log("Form submitted");
                req.flash("success", "Your shipping info was successfully added.");
                console.log(cart);
                console.log(req.body);
                res.redirect('/cart/shipment');
                console.log("Successful submission");
            } else {
                console.log(error);
                req.flash("error", "We weren't able to add your selections. Please try again later");
                res.redirect('/cart');
            }
        });
});

app.put("/cart/billing", function(req, res) {
    request
        .put('http://localhost:3001/v1/cart')
        .set('X-Session', req.cookies.xSession)
        .set('Accept', 'application/json')
        .send({
            billing: {
                method: req.body.method,
                name: req.body.name,
                phone: req.body.phone,
                address1: req.body.address1,
                city: req.body.city,
                state: req.body.state,
                zip: req.body.zip,
                country: req.body.country,
                card: {
                    token: req.body.token,
                    last4: req.body.last4,
                    expiry: req.body.expiry,
                    brand: req.body.brand
                    }  
                }   
            })
        .end(function (error, cart){
            if(cart && !error){
                cart = cart.body;
                console.log("Form submitted");
                req.flash("success", "Your billing info was successfully added.");
                console.log(cart);
                console.log(req.body);
                res.redirect('/cart/shipping');
                console.log("Successful submission");
            } else {
                console.log(error);
                req.flash("error", "We weren't able to add your selections. Please try again later");
                res.redirect('/cart');
            }
        });
});
app.get("/cart/shipment", restrict, function(req, res){
    request
        .get('http://localhost:3001/v1/cart/shipment-rating')
        .set('X-Session', req.cookies.xSession)
        .set('Accept', 'application/json')
        .end(function (error, shipment){
                shipment = shipment.body;
                console.log(shipment);
                res.render('shipment', {
                    shipment: shipment
                });
    });
});

app.put("/cart/shipment", restrict, function(req, res){
    request
        .put('http://localhost:3001/v1/cart')
        .set('X-Session', req.cookies.xSession)
        .set('Accept', 'application/json')
        .send({
            shipping: {
                service: req.body.shipmenttypeid
            } 
        })
        .end(function (error, shipment){
                shipment = shipment.body;
                req.flash("success", "Your shipping option has been updated.");
                console.log(shipment);
                console.log(req.body);
                res.redirect('/cart/confirm');
    });
});

app.get("/cart/confirm", restrict, function(req, res){
    request
        .get('http://localhost:3001/v1/cart')
        .set('X-Session', req.cookies.xSession)
        .set('Accept', 'application/json')
        .end(function (error, cart){
                cart = cart.body;
                res.render("checkout", {
                    cart: cart,
                    account: req.session.account
                });
    });
});

app.post("/checkout", restrict, function(req, res) {
    request
        .post("http://localhost:3001/v1/cart/checkout")
        .set('X-Session', req.cookies.xSession)
        .set('Accept', 'application/json')
        .send({
            cart: req.body.cart
        })
        .end(function (error, order){
            if(order && !error){
                order = order.body;
                if(order.errors){
                    console.log(order);
                    console.log(req.body);
                    var orderText = JSON.stringify(order.errors);
                    console.log(orderText);
                    req.flash("error", orderText);
                    if(orderText.includes("shipping.service")){
                        res.redirect("/cart/shipment");
                    } else {
                        res.redirect("/cart");
                    }
                } else {
                console.log(order);
                res.redirect("/account/orders");
                }
            } else {
                console.log(error);
                req.flash("error", "We weren't able to add your selections. Please try again later");
                res.redirect('cart');
            }
        });
});

//ORDER ROUTES
app.get("/custom", function(req, res) {
    res.render("custom");
});

app.post("/custom", function(req, res) {
    var mailOpts, smtpTrans;
    smtpTrans = nodemailer.createTransport("SMTP", {
        service: "Gmail",
        auth:{
            user: "obuinc@gmail.com",
            pass: "uhurusasa76"
        }
    }); 
    mailOpts = {
        from: req.body.FirstN + " " + req.body.LastN + '&lt;' + req.body.Email + '&gt;',
        to: 'obuinc@gmail.com',
        subject: 'BVB Order Form',
        text: req.body.FirstN + " " + req.body.LastN + " from " + req.body.Email + " is looking for " + req.body.Title + " by " + req.body.Author
    };
    smtpTrans.sendMail (mailOpts, function(err, response){
        if(err){
            console.log(err);
            res.redirect("/custom");
        } else {
            console.log(req.body.FirstN, req.body.LastN, req.body.Email);
            req.flash("success", "successfully sent email");
            res.redirect("/index");
        }
    });
});

//AUTH ROUTES

app.get("/login", function(req, res) {
    res.render("login");
});



app.post("/login", function(req, res){
    client.get("/accounts/:login", {
        email: req.body.email, 
        password: req.body.password
    }).then(function(account){
        if(account){
            var acctCookie = account.id + "-session";
            res.clearCookie('xSession', { path: '/' });
            res.cookie("xSession", acctCookie);
            client.get("/carts/:last?account_id={id}", {
                id: account.id
            }).then(function(cart){
                    req.session.cart = cart && cart.toObject();
            });
            request
            .post('http://localhost:3001/v1/account/login')
            .set('X-Session', acctCookie)
            .set('Accept', 'application/json').send({email:req.body.email, password: req.body.password})
            .end(function(error, account){
                if(account){
                    account = account.body;
                    req.session.account = account;
                    console.log("Logged in");
                    console.log(req.session.cart);
                    req.flash("success", "Logged in, " + account.email + ".");
                    var redirectTo = req.session.redirectTo ? req.session.redirectTo : '/';
                    delete req.session.redirectTo;
                    // is authenticated ?
                    res.redirect(redirectTo);
                } else if(account == null){
                    req.flash("error", "Your username or password is incorrect. Try again or <a href='/register'> sign up here</a>");
                    res.redirect("login");
                } else {
                    console.log(error);
                    res.redirect('login');
                }
            })
        }
    })
});

app.get("/register", function(req, res) {
    res.render("register");
});

app.post("/register", function(req, res){
    client.post("/accounts", {
        first_name: req.body.firstName,
        last_name: req.body.lastName,
        email: req.body.email,  
        username: req.body.username,
        password: req.body.password        
    }).then(function(account){
        if(account){
            var acctCookie = account.id + "-session";
            res.clearCookie('xSession', { path: '/' });
            res.cookie("xSession", acctCookie);
            request
            .post('http://localhost:3001/v1/account/login')
            .set('X-Session', acctCookie)
            .set('Accept', 'application/json').send({email:req.body.email, password: req.body.password})
            .end(function(error, account){
                if(account){
                    account = account.body;
                    req.session.account = account;
                    req.flash("success", "Welcome to Black Voices ," + account.username + "!");
                    res.redirect("/index");
                } else if(account == null){
                    req.flash("error", "Your username or password is incorrect. Try again or <a href='/register'> sign up here</a>");
                    res.redirect("login");
                } else {
                    console.log(error);
                    res.redirect('login');
                }
            })
        }
    })
});

app.get("/logout", function(req, res) {
    request
        .post('http://localhost:3001/v1/account/logout')
        .set('Accept', 'application/json')
        .set('X-Session', req.cookies.xSession)
        .end(function(err){
            if (!err) {
                req.flash("success", "You have been logged out!");
                req.session.account = undefined;
                req.session.cart = undefined;
                res.clearCookie('xSession', { path: '/' });
                res.cookie("xSession", nodeuuid());
                res.redirect('index');  
            } else {
                console.log(err);
                res.redirect('index');
            }                
        });
});
    

var pkey = fs.readFileSync('./key.pem', 'utf8');
var pcert = fs.readFileSync('./server.crt', 'utf8');

var options = {
    key: pkey,
    cert: pcert
};

http.createServer(app).listen(3000, function(){
    console.log("BVB Server has started");
});
https.createServer(options, app).listen(443);

