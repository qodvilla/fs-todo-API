import express, { json } from "express";
import cors from 'cors';
import bcrypt from 'bcrypt';

import knex from 'knex';


const pg = knex({
    client: 'pg',
    connection: {
        host : '127.0.0.1',
        port : 5432,
        user : 'postgres',
        password : 'admin',
        database : 'foodstyles-db'
    }
});

const server = express();
server.use(express.json());
server.use(cors())
const PORT = 8080;



server.get('/listTodos', (req, res) => {
    pg.select("*").from("todos").then(response => {
        res.send(response).status(200);
    }).catch(e => {
        // Error handling 
    })
})

server.post('/createTodo', (req, res) => {
    pg.insert(req.body).into("todos").then(response => {
        res.send("Successfully added a new todo item").status(200)
    }).catch(e => {
        // Error handling 
    });
})

server.delete('/deleteTodo', (req, res) => {
    pg.del().from('todos').where('id', req.body.id).then(response => {
        res.send("deleted").status(200);
    }).catch(e => {
       // Error handling 
    })
})


server.put('/markTodoCompleted/:id', (req, res) => {
    const data = req.body
    console.log(data)
    pg('todos').where('id', req.params.id).update(data).then(response => {
        console.log(response);
    }).catch(e => {
        console.log(e);
    })
})


server.put('/markTodoUncompleted/:id', (req, res) => {
    console.log(req.params.id);
    const data = req.body
    console.log(data)
    pg('todos').where('id', req.params.id).update(data).then(response => {
        res.send("OK").status(200);
    }).catch(e => {
        // Error handling 
    })
})


server.post('/signUp', (req, res) => {
    const {fullname, email, password} = req.body;
    bcrypt.hash(password, 10).then(hash => {
        pg.transaction(trx => {
            pg.insert({fullname, email}, 'email')
            .into('users')
            .transacting(trx)
            .then(emails => {
                return pg('login').insert({email: emails[0].email, hash: hash}).transacting(trx)
            }).then(trx.commit)
            .catch(trx.rollback);
        })
        .then(inserts => {
            res.send("User account created!")
        }).catch(e => {
            // Error handling 
        })
    })
    .catch(e => {
        // Error handling 
    })
})


server.post('/signIn', (req, res) => {
    const {email, password} = req.body;
    pg.select("*").where('email', email).from('login')
    .then(response => {
            const user = response[0];
            console.log(user);
            bcrypt.compare(password, response[0].hash)
            .then(match => {
                if(match){
                    res.send({email: user.email}).status(200);
                    return;
                } else {
                    res.send("You are not who you claim to be...").status(401);
                }
            })
            .catch(e => {
                res.send("Internal Server Error").status(500);
        })
    })
    .catch(e => {
    })
})


server.listen(PORT, () => {
    console.log(`Listening on PORT ${PORT}`)
})