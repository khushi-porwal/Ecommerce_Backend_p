const productModel = require("../../models/products/product")

const createProduct = async (req,res) => {
    try {

        console.log(req.body)
        const { name, price, description, category, stock } = req.body;

        if (!name || !price || !description || !category || !stock) {
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

        const image = req.file.path;

        const existingProduct = await productModel.findOne({ name });

        if (existingProduct) {
            return res.status(400).json({
                success: false,
                message: "Product already exists"
            });
        }

        const newProduct = await productModel.create({
            name,
            price,
            description,
            category,
            stock,
            image
        });

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            product: newProduct
        });

    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: err.message
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
    if(sort == "highToLow") {
        query = query.sort({price:-1})
    }

    const product = await query
    .skip(skip)
    .limit(limit)
    


    if(product.length == 0) {
        return res.status(404).json({
            success:false,
            message:"product is not available"
        })
    }

    
    const totalProducts = await productModel.countDocuments(searchFilter);
    const totalPages = Math.ceil(totalProducts / limit);

    

    return res.status(200).json({
        success: true,
        message: "product successfully got",
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
        const product = await productModel.findById(id);
        if(!product) {
            return res.status(400).json({
                success:false,
                message: "product donot exists"
            })
        }

        return res.status(200).json({
        success: true,
        message: "Product exists",
        product
        })
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while finding single product"
        })
    }
    
}

const updateProduct = async (req,res) => {
    try {
        const id = req.params.id;
        const {price,stock,description,image} = req.body;
        const product = await productModel.findByIdAndUpdate(
            id, 
            {
                price,
                stock,
                description,
                image
            },
            {new: true}
        
        );

        return res.status(200).json({
        success: true,
        message: "Product updated successfully",
        product
        })

    } catch(err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            message: "Something went wrong during updation"
        })
    }
}

const deleteProduct = async (req,res) => {
    try{
        const id = req.params.id
        const product = await productModel.findByIdAndDelete(id)
        if(!product) {
            return res.status(400).json({
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
        console.log(err)
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