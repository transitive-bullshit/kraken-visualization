# [Kraken](https://fisch0920.github.io/kraken-visualization/dist)

### Kraken Demo

This is a small visual demo of Kraken's proprietary graph reputation analysis for understanding and interacting with the relationships between top engineering candidates and tech companies.

There is a hosted version of the [demo](https://fisch0920.github.io/kraken-visualization/dist).

### Structure

The project is a static single-page Angular app using Gulp as a build system and setup to use an AWS S3 bucket for deployment.

### Building

Install node and npm if not already installed. Install [bower](http://bower.io/) (web package manager) and [gulp](http://gulpjs.com/) (build system).

```
npm install -g bower gulp
```

Install local dependencies

```
npm install
bower install
```

Compile the local development server

```
gulp
```

You can now run `gulp serve` to run the localhost server. This is mainly used for debugging during development.

### Todo

* pre-animation hovering over choices in the dropdown should brighten company's reputations accordingly
* better display of reputation and possibly interpolation
* using a different color for node / edge highlighting than the color used for reputation

### License

MIT. Copyright (c) 2014 Kraken
