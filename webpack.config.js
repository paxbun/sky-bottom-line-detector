const path = require("path");

module.exports = {
  entry: path.join(__dirname, "src", "index.ts"),
  devtool: "inline-source-map",
  mode: "development",
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
        exclude: /node_modules/,
        options: {
          configFile: "tsconfig.json",
        },
      },
      {
        test: /\.glsl$/,
        type: "asset/source"
      }
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  output: {
    filename: "index.js",
    path: path.join(__dirname, "dist"),
  },
  node: {
    __dirname: false,
  },
};
