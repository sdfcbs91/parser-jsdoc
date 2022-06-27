import * as vscode from "vscode";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const main = require("./main");

exports.activate = function (context: vscode.ExtensionContext) {
  main(context);
};
