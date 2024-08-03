
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";

import {Cart} from "../models/cart.model.js"
import { Product } from "../models/product.model.js";


const addToCart = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    // Find the product in the cart
    const existingProduct = await Cart.findOne({ productId });
    const addedProduct = await Product.findById(productId)

    if (existingProduct) {
        if (existingProduct.count >= addedProduct.stock){
            throw new ApiError(400, "We don't have enough stock remaining")
        }
        // If the product is already in the cart, update the count
        existingProduct.count += 1;
        const updatedProduct = await existingProduct.save();

        if (!updatedProduct) {
            throw new ApiError(500, "Something went wrong while updating the product count in the cart");
        }

        return res.status(200).json(
            new ApiResponse(200, updatedProduct, "Product count updated in Cart successfully")
        );
    } else {
        // If the product is not in the cart, add it to the cart
        const addedToCart = await Cart.create({
            productId,
            count: 1
        });

        if (!addedToCart) {
            throw new ApiError(500, "Something went wrong while adding the product to cart");
        }

        return res.status(201).json(
            new ApiResponse(201, addedToCart, "Product added to Cart successfully")
        );
    }
});

const deleteFromCart = asyncHandler( async (req, res) => {

    const cartId  = req.params.id;
    const deletedFromCart = await Cart.findByIdAndDelete(cartId)

    if (!deletedFromCart) {
        throw new ApiError(500, "Something went wrong while deleting the product from cart")
    }
    
    return res.status(201).json(
        new ApiResponse(200, deletedFromCart, "Product deleted from Cart Successfully")
    )
} )

const getAllCartItems = asyncHandler(async (req, res) => {
    const cartItems = await Cart.aggregate([
        {
            $lookup: {
                from: "products", // The collection name of the products
                localField: "productId",
                foreignField: "_id",
                as: "productDetails"
            }
        },
        {
            $unwind: "$productDetails" // To deconstruct the array and bring the product details inline
        }
    ]);

    if (!cartItems) {
        throw new ApiError(500, "Something went wrong while fetching cart items");
    }

    return res.status(200).json(
        new ApiResponse(200, cartItems, "Products fetched from Cart successfully")
    );
});

const getCartCount = asyncHandler(async (req, res)=>{
    const cartCount = await Cart.countDocuments()
    if (!cartCount){
        throw new ApiError(500, "Something went wrong while getting cart count")
    }
    return res.status(201).json(
        new ApiResponse(200, cartCount, "Products count fetched from Cart Successfully")
    )
})


export {
    addToCart, deleteFromCart, getAllCartItems, getCartCount
}