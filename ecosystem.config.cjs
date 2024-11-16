module.exports = {
  apps: [{
    name: "rok-server",
    script: "./src/server/index.ts",
    interpreter: 'node',
    interpreter_args: '--loader tsx'
  }]
}
