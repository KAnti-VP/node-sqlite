import express from 'express'
import cors from 'cors'
import sqlite3 from 'sqlite3'

const db = new sqlite3.Database("./database.sqlite")

let users = [
    {
      id: "1",
      name: "John Doe",
      email: "john.doe@example.com",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane.smith@example.com",
    },
    {
      id: "3",
      name: "Sam Johnson",
      email: "sam.johnson@example.com",
    },
];

db.serialize(() => {
    db.run("DROP TABLE IF EXISTS users") // never do this in production
    db.run("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT)")

    for (const u of users) {
        db.run("INSERT INTO users (name, email) VALUES (?, ?)", [u.name, u.email])
    }
})

const app = express()
app.use(cors())
app.use(express.json())

app.all("/api/users", (req, res) => {
    db.all("SELECT * FROM users;", (err, users) => {
        if (err) {
            return res.status(500).json({message: err.message})
        }
        res.status(200).json(users)
    })
})

app.get("/api/users/:id", (req, res) => {
    const id = req.params.id
    db.get("SELECT * FROM users WHERE id = ?;", [id], (err, user) => {
        if (err) {
            return res.status(500).json({message: err.message})
        }
        if (!user) {
            return res.status(404).json({message: "User not found"})
        }
        res.status(200).json(user)
    })
})

app.post("/api/users", (req, res) => {
    db.run("INSERT INTO users (name, email) VALUES (?, ?);", 
        [req.body.name, req.body.email], function (err) {
        if (err) {
            return res.status(500).json({message: err.message})
        }
        res.status(201).json({id: this.lastID, ...req.body})
    })
})

app.put("/api/users/:id", (req, res) => {
    const id = req.params.id
    db.get("SELECT * FROM users WHERE id = ?;", [id], (err, user) => {
        if (err) {
            return res.status(500).json({message: err.message})
        }
        if (!user) {
            return res.status(404).json({message: "User not found"})
        }
        db.run("UPDATE users SET name = ?, email = ? WHERE id = ?;", 
            [req.body.name, req.body.email, id], function (err) {
                if (err) {
                    return res.status(500).json({message: err.message})
                }
                res.status(200).json({id: Number(id), ...req.body})
            })
    })
})

app.delete("/api/users/:id", (req, res) => {
    const id = req.params.id
    db.get("SELECT * FROM users WHERE id = ?;", [id], (err, user) => {
        if (err) {
            return res.status(500).json({message: err.message})
        }
        if (!user) {
            return res.status(404).json({message: "User not found"})
        }
        db.run("DELETE FROM users WHERE id = ?;", [id], function (err) {
            if (err) {
                return res.status(500).json({message: err.message})
            }
            res.sendStatus(204)
        })
    })
})

app.listen(3000, () => { console.log(`Server is running on port 3000`)})
