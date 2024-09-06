const path = require('path');

module.exports = {
    entry: './src/index.ts',
    target: "node",
    devtool: false,
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'norisk_blockbench_plugin.js',
        path: path.resolve(__dirname, 'dist'),
    },
};