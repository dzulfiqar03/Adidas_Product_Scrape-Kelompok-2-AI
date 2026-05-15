class SystemConfigurationController {
    getBotInfo(req, res, isReady, client) {
        if (isReady && client && client.info) {
            // Mengambil nomor dari client.info.wid.user
            res.json({
                success: true,
                number: client.info.wid.user
            });
        } else {
            res.json({
                success: false,
                message: 'Bot belum login'
            });
        }
    }
}

module.exports = SystemConfigurationController;