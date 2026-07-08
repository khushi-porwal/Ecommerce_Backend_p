const productModel = require("../../models/products/product")
const mongoose = require("mongoose");
const createProduct = async (req,res) => {
    try {

        console.log(req.body)
        const { name, price, description, category, stock } = req.body;

        if (!name.trim() || price === undefined || !description.trim() || !category || stock === undefined) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Image is required"
            });
        }
        const images = [req.file.path];

        const existingProduct = await productModel.findOne({ name });

        if (existingProduct) {
            return res.status(409).json({
                success: false,
                message: "Product already exists"
            });
        }

        if(isNaN(price) || price <= 0) {
            return res.status(400).json({
                success: false,
                message: "Price must be greater tha 0"
            })
        }
        if (isNaN(stock) || stock < 0) {
            return res.status(400).json({
                success: false,
                message: "Stock cannot be negative"
            });
        }
        const newProduct = await productModel.create({
            name,
            price,
            description,
            category,
            stock,
            images
        });

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            product: newProduct
        });

    } catch(err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Internal Server error"
        });
    }
}


const getAllProduct = async(req,res) => {
    
    try {
    const search = req.query.search || "";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const category = req.query.category || "";
    const sort = req.query.sort;

    const skip = (page-1) * limit;

    const searchFilter = {};
    if(search) {
        searchFilter.name = {
            $regex: search,
            $options:"i"
        }

    }

    if(category) {
        searchFilter.category = category;
    }
    
    let query = productModel.find(searchFilter);
    if(sort === "lowToHigh") {
        query = query.sort({price:1})
    }
    else if(sort == "highToLow") {
        query = query.sort({price:-1})
    }

    const product = await query
    .skip(skip)
    .limit(limit)
    


    if(product.length == 0) {
        return res.status(200).json({
            success:true,
            totalProducts:0,
            totalPages:0,
            data:[]
        })
    }
// Why not return 404?

// Answer:

// Because the endpoint exists and executed successfully.
//  It simply didn't find matching data. Returning an empty
//   array with status 200 is the standard REST practice.
    
    const totalProducts = await productModel.countDocuments(searchFilter);
    const totalPages = Math.ceil(totalProducts / limit);

    

    return res.status(200).json({
        success: true,
        message: "product successfully got",
        currentPage:page,
        totalPages,
        totalProducts,
        data:product
    })
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "something went wrong in the product while getting"
        })
    }
    
}

const getSingleProduct = async(req,res)=> {
    try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Product ID"
            });
        }

// Why check ObjectId.isValid()?

// Good answer:

// Before querying MongoDB, I validate the ID format. 
// This prevents unnecessary database queries and avoids 
// CastError exceptions when an invalid ID is passed

        const product = await productModel.findById(id);
        if(!product) {
            return res.status(404).json({
                success:false,
                message: "product not exists"
            })
        }

        return res.status(200).json({
        success: true,
        message: "Product fetched successfully",
        product
        })
    } catch(err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while finding single product"
        })
    }
    
}

const updateProduct = async (req, res) => {
    try {
        const id = req.params.id;

        // Validate Product ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Product ID"
            });
        }

        const { price, stock, description, category, name } = req.body;

        // Validate Price
        if (price !== undefined && (isNaN(price) || price < 0)) {
            return res.status(400).json({
                success: false,
                message: "Price cannot be negative"
            });
        }

        // Validate Stock
        if (stock !== undefined && (isNaN(stock) || stock < 0)) {
            return res.status(400).json({
                success: false,
                message: "Stock cannot be negative"
            });
        }

        // Create update object (Only update provided fields)
        const updateData = {};

        if (name !== undefined) updateData.name = name;
        if (price !== undefined) updateData.price = price;
        if (stock !== undefined) updateData.stock = stock;
        if (description !== undefined) updateData.description = description;
        if (category !== undefined) updateData.category = category;

        // If image is uploaded
        if (req.file) {
            updateData.images = [req.file.path];
        }

        const product = await productModel.findByIdAndUpdate(
            id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

const deleteProduct = async (req,res) => {
    try{
        const id = req.params.id

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Product ID"
            });
        }
        const product = await productModel.findByIdAndDelete(id)
        if(!product) {
            return res.status(404).json({
                success:false,
                message: "product donot exists"
            })
        }
        return res.status(200).json({
        success: true,
        message: "Product deleted successfully",
        product
        })
    } catch(err) {
        console.error(err)
        return res.status(500).json({
            success: false,
            message: "Something went wrong during deletion"
        })
    }
}
module.exports =  {
    createProduct,
    getAllProduct,
    getSingleProduct,
    updateProduct,
    deleteProduct
}



// Why use isNaN()?

// Answer:

// Because data from req.body may not always be numeric. 
// isNaN() ensures that values like "abc" are rejected 
// before saving them to the database.






// Why convert page using Number()?

// Because

// req.query.page

// always comes as a string.

// Example

// ?page=2

// becomes

// "2"

// Using

// Number(req.query.page)

// converts it into

// 2

// which is required for calculations.





// Why use Regex?

// Answer:

// Regex allows partial matching.

// Example

// Searching

// iphone

// matches

// iPhone 16 Pro



// Why use skip?

// Answer:

// Skip ignores previous documents so MongoDB 
// returns only the requested page.


