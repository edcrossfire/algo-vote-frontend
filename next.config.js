/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

const webpack = require('webpack')

const { parsed: myEnv } = require('dotenv').config({
  path:'C:/Users/ecart/Desktop/dev-portfolio/algo-vote-frontend/.env'
})

module.exports = {
  webpack(config) {
      config.plugins.push(new webpack.EnvironmentPlugin(myEnv))
      return config
  }
}