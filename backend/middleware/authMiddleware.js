import jwt from "jsonwebtoken";

export const checkAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  try {
    if (!authHeader || !authHeader.startsWith("token ")) {
      return res.status(401).json({ message: "Unauthorized, Please Login" });
    }

    const token = authHeader.split(" ")[1];
    const decode = jwt.verify(token, process.env.JWT_SECRET);

    if (!decode || !decode.id) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    req.user = decode;

    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Token expired or invalid" });
  }
};
