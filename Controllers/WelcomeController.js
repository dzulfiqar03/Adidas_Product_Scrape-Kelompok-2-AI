class WelcomeController {
    index(req, res,path){
        res.sendFile(path.join(__dirname, '../Public/Src/views/WelcomePage.html'));
    }
}

module.exports = WelcomeController;