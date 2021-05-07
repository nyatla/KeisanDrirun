const CopyWebpackPlugin = require("copy-webpack-plugin");
const WriteFilePlugin = require('write-file-webpack-plugin');
module.exports = {
    // メインとなるJavaScriptファイル（エントリーポイント）
    entry: `./src/index.js`,

    // ファイルの出力設定
    output: {
        //  出力ファイルのディレクトリ名
        path: `${__dirname}/dist`,
        // 出力ファイル名
        filename: "main.js"
    },
    mode: "development",
    // ローカル開発用環境を立ち上げる
    // 実行時にブラウザが自動的に localhost を開く
    devServer: {
        contentBase: "dist",
        open: true
    },
    plugins: [
        new CopyWebpackPlugin(
            [
                {
                    from: '',
                    to: `${__dirname}/dist`,
                    ignore: [
                    'index.js'
                    ]
                }             
            ],
            { context: 'src' }
        ),
        new WriteFilePlugin(),
    ],
};