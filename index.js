require('dotenv').config()
const express = require('express')
const axios = require('axios')
const path = require('path')
const Message = require('bsv/message')
const bsv = require('bsv')
const app = express()
const port = 3000
const key = bsv.PrivateKey.fromWIF(process.env.privateKey)

const routes = {
  moneybutton: "https://www.moneybutton.com/api/v1/bsvalias/id/",
  handcash: "https://handcash-paymail-production.herokuapp.com/api/bsvalias/id/"
}
app.use(express.static('public'))
app.set('view engine', 'ejs')
app.set('views')
app.use(express.urlencoded());
app.use(express.json());
app.get('/', (req, res) => {
  res.render("index")
})
app.get('/how', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public/', 'how.html'));
})
app.get('/paymail/:paymail', (req, res) => {
  let paymail = req.params.paymail
  console.log('params =' ,req.params.paymail)
  let endpoint;
  if (/@moneybutton\.com/.test(paymail)) {
    endpoint = routes.moneybutton;
  } else if (/handcash/.test(paymail)) {
    endpoint = routes.handcash;
  }
  axios.get(endpoint + req.params.paymail).then((r) => {
    console.log("r = ", r.data)
    const messageHex = Buffer.from(r.data.handle).toString("hex")
    const pubkeyHex = Buffer.from(r.data.pubkey).toString("hex")
    const concatenated = messageHex + pubkeyHex;
    const hashed = bsv.crypto.Hash.sha256(Buffer.from(concatenated, "hex")).toString('hex')
    console.log(concatenated)
    console.log("hashed = ", hashed)
    const sig = Message.sign(hashed, key)
    let verified = Message.verify(hashed, "13SrNDkVzY5bHBRKNu5iXTQ7K7VqTh5tJC", sig)
    console.log("valid=", verified)
    res.render("show", { paymail: r.data.handle, pubkey: r.data.pubkey, sig: sig })
  })
})
app.post("/user", (req, res) => {
  console.log(req.body.paymail)
  res.redirect("/paymail/" + req.body.paymail);
  // get paymail address
})
app.listen(port, () => console.log(`Example app listening on port ${port}!`))
