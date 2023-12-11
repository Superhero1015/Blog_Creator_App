const express = require('express');
const mysql = require('mysql2')
const path = require('path')
const dotenv = require('dotenv')
const bcrypt = require('bcryptjs')
const exphbs = require('express-handlebars');
var session = require('express-session');

dotenv.config({ path: './.env'})

const app = express();
const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
})
const publicDir = path.join(__dirname, './public')

app.use(express.static(publicDir));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
    secret: 'Website Password',
    resave: true,
    saveUninitialized: true
}));
app.engine('.hbs', exphbs.engine({ 
    extname: '.hbs', 
    defaultLayout: null,
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials'),
    navbar: 'partials/navbar.hbs',
    footer: 'partials/footer.hbs'
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views/layouts'));

db.connect((error) => {
    if(error) {
        console.log('Error connecting to MySQL:', error)
    } else {
        console.log('MySQL connected!');
    }
});

app.get("/", (req, res) => {
    res.render("index")
});
app.get("/register", (req, res) => {
    res.render("register")
})
app.get("/login", (req, res) => {
    res.render("login")
})
app.get("/dashboard", (req, res) => {
    if (!req.session.userId) {
        console.log('userID:', userID);
        return res.redirect('/login');
    }
    db.query('SELECT user, title, body, date_created FROM posts ORDER BY date_created DESC', (error, posts) => {
        if (error) {
            console.log(error);
            return res.status(500).send('Internal Server Error');
        }
        posts = posts.map(post => ({
            ...post,
            date_created: new Date(post.date_created).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric"
            })
        }));
        res.render("dashboard", { posts, textClass: 'white-text' });
    });
})
app.get("/makepost", (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.render("makepost")
})

app.get("/logout", (req, res) => {
    console.log('Logging out');
    req.session.destroy((err) => {
      if (err) {
        console.log(err);
      }
      res.redirect('/');
    });
  });


app.post("/auth/login", (req, res) => {    
    const { name, password } = req.body
    console.log('Login attempt with name:', name);
    console.log('Login attempt with password:', password);

    db.query('SELECT name, password, id FROM users WHERE name = ?', [name], async (error, result) => {
        if(error) {
            console.log(error);
            return res.status(500).send('Internal Server Error');
        }

        if( result.length > 0 ) {
            const hashedPassword = result[0].password;
            console.log('Hashed Password:', hashedPassword);
            const match = await bcrypt.compare(password, hashedPassword);
            if (match) {
                console.log('result[0].id:', result[0].id);
                req.session.userId = result[0].id;
                req.session.userName = name;
                return res.redirect('/dashboard');
            } else {
                return res.render('login', {
                    message: 'Incorrect password'
                });
            }
        } else {
            return res.render('login', {
                message: 'No Such Name Found'
            })
        }
    })
})

app.post("/auth/register", (req, res) => {    
    const { name, email, password, password_confirm } = req.body

    db.query('SELECT email FROM users WHERE email = ?', [email], async (error, result) => {
        if(error) {
            console.log(error);
            return res.status(500).send('Internal Server Error');
        }

        if( result.length > 0 ) {
            return res.render('register', {
                message: 'This email is already in use'
            })
        } else if(password !== password_confirm) {
            return res.render('register', {
                message: 'Passwords Do Not Match'
            })
        }

        let hashedPassword = await bcrypt.hash(password, 8);

        console.log(hashedPassword)
       
        db.query('INSERT INTO users SET ?', {name: name, email: email, password: hashedPassword}, (err, result) => {
            if(err) {
                console.log(err);
            } else {
                return res.render('register', {
                    message2: 'User registered!'
                })
            }
        })        
    })
})


app.post("/auth/makepost", (req, res) => {  
    if (!req.session.userId) {
        return res.redirect('/login'); // Redirect to login if not logged in
    }  
    const { user, title, body } = req.body
    db.query('SELECT COUNT(*) AS postCount FROM posts', (countError, countResult) => {
        if (countError) {
            console.log(countError);
            return res.status(500).send('Internal Server Error');
        }
        const postCount = countResult[0].postCount + 1;
        console.log("Current Post Count:", postCount)
        const post = {
            post_id: postCount, 
            user: user, 
            title: title, 
            body: body, 
            date_created: new Date(),
            user_id: req.session.userId
        };
        db.query('INSERT INTO posts SET ?', post, (err, result) => {
            if(err) {
                console.log(err);
            } else {
                return res.render('dashboard', {
                    message2: 'New Post Uploaded!'
                })
            }
        })
    })  
})


app.listen(process.env.PORT || 5001)