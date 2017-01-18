var nodemailer      = require("nodemailer"),
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

app.use(bodyParser.urlencoded({extended:false}))
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
    res.locals.account = req.session.account;
    if(req.session.account_id){
        client.get("/accounts/{id}", {
            id: req.session.account_id
        }, function(err, account){
            if(account){
                req.account = account;
                res.locals.account = account;
            };
            next();
        });
    } else {
        next();
    }
});


function restrict(req, res, next) {
    if(req.session.account && req.session.account.id){
        next();
    } else {
        req.flash("error", "You must be logged in to access this page");
        res.redirect("/login");
    }
};

// function checkForId(account) {
//     if(account){
//         request.put('http://localhost:3001/v1/session')
//             .set('X-Session', sessionID)
//             .set('Accept', 'application/json')
//             .end(function(err, session){
//                 if(session && session.body.account_id === account.id){
//                     session = session.body;
//                     console.log("xSession header is now " + session.id);
//                 } else {
//                     console.log(err);
//                     return false;
//                 }
//             });                
//     } else {
//         console.log("account not found");
//     }
// };

// function setXSession(account) {
//     var xSession = checkForId(account);
//     console.log("xSession header is now " + xSession);
// }
// function generateSessionId(account) {
//     var schemaSessionID = nodeuuid();
//     request.get('http://localhost:3001/v1/session/')
//         .query({account_id: account.id})
//         .set("X-Session" , schemaSessionID)
//         .set('Accept', 'application/json')
//         .end(function(err, session){
//             if(session){
//                 console.log(session);
//             } else {
//                 console.log(err);
//             }
//         });
// }
// function getSession(req, res, next) {
//     request.get('http://localhost:3001/v1/session/:last')
//         .query({account_id: req.session.account.id})
//         .end(function(err, session){
//             if(session){
//                 console.log(session.body);
//             } else {
//                 console.log(err);
//             }
//         });
//         next();
// };

// function sessionCookieExists(req, res) {
//     if(req.session.account_id && req.cookies.XSession){
//         return true;
//     } else {
//         return false;
//     }; 
// };

function setXSessionCookie(req, res, next){
    var xSessionHeader = nodeuuid();
    console.log(xSessionHeader);
    if(!req.cookies.xSession || req.cookies.xSession === undefined){
        res.cookie("xSession", xSessionHeader, {maxAge: 30 * 60 * 1000, httpOnly: true});
        console.log(req.cookies.xSession);
        console.log("X-Session cookie set: " + req.cookies.xSession);
        next();
    } else {
        console.log("X-Session cookie already exists, SessionID is : " + req.cookies.xSession);
        next();
    }
};
// function getSessionCookie(req, res, next) {
//     return req.cookies.XSession; 
// }

// function generateAndSetSessionCookie(req, res, next){
//     var schemaID = nodeuuid();
//     res.cookie("XSession", schemaID, {maxAge: 30 * 60 * 1000, httpOnly: true});
//     global.sessionID = req.cookies.XSession;
//     next();
// }

// function authenticateSession (req, res, next) {
//     if(sessionCookieExists()) {
//         getSessionCookie();
//     } else {
//         generateAndSetSessionCookie();
//     }
// }
//BASIC ROUTES
app.get("/", function(req, res){
    res.render("landing");
});

app.get("/index", function(req, res) {
    res.render("index");
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
    res.render("account", {
        account: req.session.account,
        session: req.session
    });
});

app.get("/shop", function(req, res) {
    request 
        .get("http://localhost:3001/v1/products")
        .set('X-Session',req.cookies.xSession)
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


app.get("/cart", restrict, function(req, res) {
    console.log(req.cookies.xSession);
    if(!req.session.account) {
        req.flash("error", "You currently must be logged in to access your cart");
        res.redirect('register');
    } else {
    request
        .get('http://localhost:3001/v1/cart')
        .set('X-Session', req.cookies.xSession)
        .set('Accept', 'application/json')
        .end(function (error, cart){
            if(!cart || cart.body == null ){
                req.flash('error', 'There are no items in your cart');
                res.redirect('index');
            } else if (cart) {
                req.session.cart = cart.body;
                account = req.session.account;
                console.log(req.session.account.name + "'s cart " + req.session.cart.number + " has " + req.session.cart.item_quantity + " item and costs " + req.session.cart.grand_total );
                res.render("cart", {
                    cart: cart.body
                });
            } else {
                console.log(error);
                res.redirect('index');    
            }
        });
    }
});

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
                res.redirect("/cart");
            } else {
                console.log(error);
                req.flash("error", "We weren't able to remove your selections. Please try again later");
                res.redirect('cart');
            }
        });
});

app.put("/cart", restrict, function(req, res) {
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
                res.redirect("/shop");
            } else {
                console.log(error);
                req.flash("error", "We weren't able to add your selections. Please try again later");
                res.redirect('login');
            }
        });
});

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
                res.redirect("/shop");
            } else {
                console.log(error);
                req.flash("error", "We weren't able to add your selections. Please try again later");
                res.redirect('login');
            }
        });
});
app.post("/checkout", restrict, function(req, res) {
    request
        post("http://localhost:3001/v1/cart/checkout")
        .set('X-Session', req.cookies.xSession)
        .set('Accept', 'application/json')
        .end(function (error, order){
            if(order && !error){
                req.flash("success", "Your cart were successfully added to order");
                res.redirect("/account");
            } else {
                console.log(error);
                req.flash("error", "We weren't able to add your selections. Please try again later");
                res.redirect('cart');
            }
        });
});

//ORDER ROUTES
app.get("/order", function(req, res) {
    res.render("order");
});

app.post("/order", function(req, res) {
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
            res.redirect("/order");
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
            request
            .post('http://localhost:3001/v1/account/login')
            .set('X-Session', acctCookie)
            .set('Accept', 'application/json').send({email:req.body.email, password: req.body.password})
            .end(function(error, account){
                if(account){
                    account = account.body;
                    req.session.account = account;
                    req.flash("success", "Logged in, " + account.email + ".");
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
                res.redirect('index');  
            } else {
                console.log(err);
                res.redirect('index');
            }                
        });
});
    

    
app.listen(3000, function(){
    console.log("BVB Server has started");
});