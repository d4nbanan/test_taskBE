const express = require('express');
const app = express();
const fs = require('fs');
const jwt = require('jsonwebtoken');
const config = require('./config.json');
const cors = require('cors');

const { secretKey } = config;


const getUsers = () => {
    try {
        const data = JSON.parse(fs.readFileSync('./users.json', 'utf8'));
        return data;
    } catch (err) {
        console.log(err);
        return null;
    }
}

const findUserById = (userId) => {
    const users = getUsers();

    if(users) {
        const profile = users.filter(user => user.id === userId);

        if (!profile.length) {
            return undefined;
        }
        return profile[0];
    }
    return null;
}

const findUserByUsername = (username) => {
    const users = getUsers();

    if(users) {
        const profile = users.filter(user => user.username === username);

        if (!profile.length) {
            return undefined;
        }
        return profile[0];
    }
    return null;
}

app.use(cors());
app.use(express.json({limit: "50mb"}));

app.use((req, res, next) => {
    if (req.headers.authorization) {
        jwt.verify(
            req.headers.authorization,
            secretKey,
            (err, payload) => {
                if (err) next();
                else if (payload) {
                    for (let user of getUsers()) {
                        if (user.id === payload.id) {
                            req.user = user;
                            next();
                        }
                    }

                    next();
                }
            }
        )
    }

    next();
})


app.get('/list', (req, res) => {
    if (!req.user) {
        res.status(401).json({message: "Unauthorized"});
    } else {
        const users = getUsers().map(user => {
            delete user.password;
            return user;
        });

        if (!users) {
            res.status(400).json({message: "error"});
        }

        const slicedUsers = [];
        users.forEach(user => {
            slicedUsers.push({id: user.id, first_name: user.first_name});
        })

        res.send(slicedUsers);
    }
});

app.get("/get/:id", async (req, res, next) => {
    if (!req.user) {
        res.status(401).json({message: "Unauthorized"});
    } else {
        const userId = req.params.id;

        const user = findUserById(userId);

        if (user === undefined) {
            res.status(404).json({message: "User not found"});
        } else if (user) {
            delete user.password;
            res.send(user);
        }
    }
})

app.post('/login', async (req, res) => {

    const {username, password} = req.body;
    const user = findUserByUsername(username);

    if(user === undefined){
        res.status(404).json({message: "User not found"});
    } else if(user){
        if(password !== user.password){
            res.status(400).json({message: "Invalid password"});
        }

        const token = jwt.sign({ id: user.id, username: user.username }, secretKey);
        res.send({token});
    }
})

app.listen(1337, () => console.log("server started"));