require("babel-core/register")(
    {
        presets: ['latest']
    }
)

require("babel-polyfill")

require("./app.js")
