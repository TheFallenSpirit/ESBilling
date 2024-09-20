module.exports = {
    apps: [{
        time: true,
        name: 'ES Billing',
        script: './build/app.js',
        node_args: '-r dotenv/config'
    }]
};
