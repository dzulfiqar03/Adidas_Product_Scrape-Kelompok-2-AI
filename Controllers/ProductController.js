
class ProductController {
    index(req, res, path) {
        res.sendFile(path.join(__dirname, '../Src/views/Product.html'));
    }
}

module.exports = ProductController;