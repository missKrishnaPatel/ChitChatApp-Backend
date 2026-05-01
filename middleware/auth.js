import jwt from "jsonwebtoken"
export const checkAuth = async(req, res,next) =>{

    try {
        const token = req.headers.authorization;
        // "Bearer fhghhgrthtrh5+6f54d8sf4d5gfhujjhj485g48fg47"

        if(!token || !token.startsWith("Bearer ")){
            return res.status(401).json({
                success:false,
                message:"Token is missing"
            })
        }

        const actualToken = token.split(" ")[1];
        const decoded = jwt.verify(actualToken, process.env.JWT_SECRET)
        req.user = decoded;
        next();
    } catch (error) {
        
    }
}