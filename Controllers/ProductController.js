
class ProductController {
    index(req, res, path) {
        res.sendFile(path.join(__dirname, '../Public/Src/views/Product.html'));
    }
}

module.exports = ProductController;