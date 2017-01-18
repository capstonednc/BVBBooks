var nodemailer      = require("nodemailer"),
    passport        = require("passport"),
    localStrategy   = require("passport-local"),
    passLocalMong   = require("passport-local-mongoose"),
    flash           = require("connect-flash"),
    mongoose        = require("mongoose"),
    bodyParser      = require("body-parser"),
    methodOverride  = require("method-override"),
    Schema          = require("schema-client"),
    express         = require("express"),
    request         = require("request"),
    app             = express();
    
mongoose.connect("mongodb://localhost/bvbooks");
app.use(bodyParser.urlencoded({extended:false}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.use(require('express-promise')());

var client = new Schema.Client("blackvoicesbooks", "C4fUNwHDfbfxKLYn3NMCnhGitkaZuTuQ");

var SchemaAPI = "https://blackvoicesbooks:C4fUNwHDfbfxKLYn3NMCnhGitkaZuTuQ@api.schema.io";

app.use(require("express-session")({
    secret: "Afrika19762016",
    resave: false,
    saveUninitialized: false
}));


app.use(function(req,res, next){
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
app.get("/shop/:slug", function(req, res) {
    res.render("show", {
      categories: client.get('/categories'),
      product: client.get('/products/{slug}', {
        slug: req.params.slug,
      })
    });
});

app.get("/shop", function(req, res) {
    res.render("shop", {
        product: client.get('/products')
    });
});

app.get("/cart", function(req, res) {
    console.log(res.session.cart_id);
    res.render("cart", {
      carts: client.get('/carts'),
      product: client.get('/products')
    });
});

app.post("/cart", function(req, res) {
    var acctId = req.session.account_id;
    var cartId = req.session.cart_id;
    console.log(cartId);
    client.get("/carts/:first", {
        account_id: {acctId},
        status: "true",
        date_created: {$gt: Date.now()-36400}
    }).then(function(cart){
        if(cart){
            return cart.put({
                account_id: acctId, 
                items: [{
                product_id: req.body.productId,
                quantity: req.body.quantity
                }],
            });
        }
    }).then(function(done){
        req.flash("success", "successfully added items to cart");
        console.log(cartId);
        res.redirect("/shop");
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

app.post("/login", function(req, res) {
    client.get("/accounts/:login", {
        email: req.body.email, 
        password: req.body.password
    }).then(function(account) {
        if(account){
            req.session.account_id = account.id;
            req.flash("success", "Logged in, " + account.email + ".");
            res.redirect("/index");
        } else {
            console.log('login error')
            res.redirect("/login");
        }
    });
});

app.get("/register", function(req, res) {
    res.render("register");
});

app.post("/register", function(req, res){
    client.post('/accounts', {
      email: req.body.email,  
      username: req.body.username,
      password: req.body.password,
    }).then(function(account) {
      if (account.errors) {
        console.log(account.errors);
        req.flash(account.errors.message);
        res.redirect("/register");
      } else {
        req.session.userEmail = req.body.email;
        req.flash("success", "Welcome to Black Voices ," + account.username + "!");
        res.redirect("/index");
      }
    
    }).catch(function(errors){
        console.log(errors);
        req.flash("error", errors.message);
    });
});

app.get("/logout", function(req, res) {
    req.session.destroy;
    req.flash("success", "You are now logged out.");
    res.redirect("/index");
});
    

    
app.listen(process.env.PORT, process.env.IP, function(){
    console.log("BVB Server has started");
})