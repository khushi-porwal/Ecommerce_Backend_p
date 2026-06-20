const express = require('express')
const app = express();
require('dotenv').config();
const connectDB = require('./config/db')
const paymentRoutes = require("./routes/payment/paymentRoutes")
const orderRoutes = require("./routes/order/order")
const adminRoutes = require("./routes/admin/adminRoutes")
const authRoutes = require('./routes/authRoutes')
const reviewRoutes = require("./routes/review/review")
const cartRoutes = require("./routes/cart/cartRoutes")
const productRoutes = require("./routes/product/productRoutes")
const wishlistRoutes = require("./routes/wishlist/wishlistRoutes")

app.use(express.json())

app.use(express.urlencoded({
    extended : true
}))

connectDB();

app.use(authRoutes)
app.use(productRoutes)
app.use(cartRoutes)
app.use(orderRoutes)
app.use(reviewRoutes)
app.use(adminRoutes)
app.use(wishlistRoutes)
app.use(paymentRoutes)
app.get("/", (req,res) => {
    res.send("Hello World")
})

const port = 3000;
app.listen(port, ()=> {
    console.log(`Server is running on the port ${port}`)
})